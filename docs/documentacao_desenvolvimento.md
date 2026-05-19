# Documentação de Desenvolvimento: Painel de Estudos Foco 2026

Este documento descreve a arquitetura técnica da aplicação, a estrutura de pastas e arquivos, o funcionamento das APIs e como os dados do frontend são sincronizados em tempo real com os arquivos locais do workspace.

---

## 📂 1. Arquitetura do Workspace e Arquivos

A aplicação foi criada na pasta `study_dashboard/` de forma a coexistir harmoniosamente com a sua estrutura de estudos preexistente.

### Estrutura Física:
```
Estudo Concurso 2026/
├── 01_Planejamento_de_Horarios/
│   └── planejamento_semanal.csv          <-- LIDO
├── 02_Pomodoro_e_Horas/
│   └── controle_pomodoro.csv             <-- ESCRITO
├── 03_Tarefas_de_Estudo/
│   ├── tasks_estudo.csv                  <-- LIDO & ESCRITO
│   └── kanban_simples.md                 <-- SINCRONIZADO (ESCRITO)
├── 04_Registro_do_Que_Foi_Estudado/
│   ├── diario_de_estudo.csv              <-- LIDO & ESCRITO
│   └── historico_concluido.md            <-- SINCRONIZADO (ESCRITO)
└── study_dashboard/                      <-- APLICAÇÃO (DASHBOARD)
    ├── docs/
    │   ├── documentacao_usuario.md
    │   └── documentacao_desenvolvimento.md
    ├── public/                           <-- FRONTEND (ESTÁTICOS)
    │   ├── app.js
    │   ├── index.html
    │   └── style.css
    ├── package.json
    └── server.js                         <-- BACKEND EXPRESS
```

---

## ⚙️ 2. O Servidor Backend (`server.js`)

Construído em Node.js usando o microframework Express. Ele funciona de forma 100% autônoma e leve, sem exigir sistemas de banco de dados externos (como SQLite, MongoDB ou MySQL), pois **os arquivos CSV locais atuam como o seu banco de dados**!

### Principais Componentes do Código:

#### A. Parsers Nativos de CSV (Sem dependências)
Para evitar downloads pesados e lentidão, criamos um par de parser e stringificador de CSV de alta performance usando lógica Regex e varredura de caracteres nativa em JavaScript:
* `parseCSV(content)`: Lê o conteúdo textual do arquivo CSV, separa a primeira linha de cabeçalhos (*headers*) e converte cada linha de dados subsequente em um objeto estruturado em JSON com chaves correspondentes aos cabeçalhos. Lida corretamente com vírgulas envoltas por aspas `""` e aspas escapadas.
* `toCSV(headers, rows)`: Transforma um array de objetos JSON de volta em formato textual CSV estruturado, escapando automaticamente vírgulas ou quebras de linha encontradas nos campos de texto.

#### B. Mecanismos de Sincronização Automatizada
* **Sincronizador Kanban (`syncKanbanMarkdown(tasks)`)**: 
  - Sempre que uma tarefa é criada, editada, movida ou excluída, a função lê o novo conjunto de dados JSON, mapeia as categorias de status legadas do CSV ("A fazer", "Fazendo hoje", "Travado / pendente", "Concluido") para seções correspondentes do arquivo `03_Tarefas_de_Estudo/kanban_simples.md` e reescreve o Markdown.
  - Se a tarefa está concluída, o item no markdown ganha a marcação `- [x] Nome da Tarefa`. Se não, fica `- [ ] Nome da Tarefa`.
* **Histórico de Entregas (`appendToHistoryMarkdown(taskName, duration, obs)`)**:
  - Quando uma tarefa transita para o status "Concluido", o servidor calcula automaticamente a estimativa de tempo (Pomodoros Estimados $\times$ 25 minutos).
  - Ele lê `04_Registro_do_Que_Foi_Estudado/historico_concluido.md`, procura um cabeçalho para o mês/ano atual (ex: `## Maio 2026`) e insere logo abaixo a linha de log: `- [x] DD/MM/AAAA | Feito: Título | Tempo: X min | Obs`. Se o mês atual não tiver um cabeçalho criado no arquivo, ele o gera automaticamente no final.

#### C. Endpoints da API RESTful (Rotas)
* `GET /api/schedule`: Retorna os blocos do cronograma semanal.
* `GET /api/pomodoros`: Retorna a lista histórica de Pomodoros concluídos.
* `POST /api/pomodoros`: Adiciona um novo Pomodoro concluído. Se o tipo for `"Estudo"`, ele chama a função interna `updateDailyProgressMetrics()` que soma automaticamente o tempo líquido de estudos hoje e o número de ciclos do dia, salvando ou atualizando a linha do dia corrente em `diario_de_estudo.csv`.
* `GET /api/tasks`: Retorna a lista de todas as tarefas.
* `POST /api/tasks`: Cria uma nova tarefa com ID autoincrementado e sincroniza com o Markdown.
* `PUT /api/tasks/:id`: Atualiza dados de uma tarefa (incluindo alteração de status e escrita de data de conclusão) e sincroniza com o Markdown.
* `DELETE /api/tasks/:id`: Exclui permanentemente uma tarefa e reescreve os arquivos sincronizados.
* `GET /api/diary`: Retorna a lista de registros de diário salvos.
* `POST /api/diary`: Grava ou atualiza um diário de estudos.
* `GET /api/analytics`: Executa cálculos agregados complexos em memória a partir dos CSVs de Pomodoro e Tarefas, retornando:
  - Minutos e Pomodoros estudados hoje.
  - Minutos e Pomodoros acumulados na semana (últimos 7 dias).
  - Quantidade de tarefas no Kanban por coluna (Total, Concluídas, Pendentes, Ativas, Bloqueadas).
  - Distribuição de prioridades de tarefas pendentes (Alta, Média, Baixa).

---

## 🎨 3. O Frontend (`public/app.js`, `style.css` e `index.html`)

O frontend é uma SPA (Single Page Application) desenvolvida em Vanilla JS estruturada com CSS puro.

### Arquitetura de Estado:
No início de `public/app.js`, criamos o objeto global `state` que centraliza todos os dados sincronizados em memória com as variáveis do timer Pomodoro:
```js
const state = {
  currentTab: 'dashboard',
  tasks: [],
  schedule: [],
  pomodoroLogs: [],
  diaryLogs: [],
  analytics: null,
  timer: {
    duration: 1500, // Tempo total em segundos (25 min)
    timeLeft: 1500, // Segundos restantes
    intervalId: null,
    isRunning: false,
    phase: 'study', // 'study', 'short', 'long'
    startTime: null,
    distractions: 0,
    tickingEnabled: false
  }
};
```

### Funcionalidades Especiais do Código:

#### A. Motor de Som Sintético (Web Audio API)
Para manter o sistema super leve e 100% offline, em vez de carregar arquivos de áudio `.mp3` pesados pela rede que poderiam falhar, a função `playSyntheticSound(type)` gera frequências harmônicas diretamente por hardware através das placas de áudio do computador:
- **`start`**: Um som crescente e energético (`523Hz` a `783Hz`) indicando o início do foco.
- **`end`**: Um acorde duplo agudo e harmônico (`659Hz` e `880Hz`) sinalizando a conclusão.
- **`tick`**: Uma onda senoidal discreta de curtíssima duração (`0.04s` a `1000Hz`) simulando o ponteiro de um relógio, ideal para quem estuda com ruído branco.

#### B. Renderização do Timer Circular (SVG Dinâmico)
O timer circular utiliza uma técnica matemática avançada com a propriedade CSS `stroke-dashoffset`. 
- O círculo possui um raio `r = 88`, resultando em um comprimento de circunferência de $2 \times \pi \times 88 \approx 552.92$ pixels.
- Usando `dashoffset = 552.92 * (1 - (timeLeft / duration))`, o Javascript calcula em tempo real o quanto o anel de luz roxo neon deve se apagar conforme o tempo corre, criando uma sensação visual fluida de progresso.

#### C. Quadro Kanban (Drag and Drop & APIs)
- A lógica de arrastar e soltar utiliza a API de drag-and-drop padrão do HTML5.
- No evento `dragstart` do card, inserimos o ID da tarefa com `e.dataTransfer.setData('text/plain', ID)`.
- Nas colunas Kanban, o evento `drop` resgata o ID e executa uma requisição `PUT /api/tasks/:id` passando o novo status (associado ao atributo `data-status` da coluna solta).

---

## 🛠️ 4. Onde Mexer no Código para Customizar?

Se você quiser expandir ou adaptar o sistema:

1. **Alterar Tempos Padrão do Pomodoro**:
   - Vá em `public/app.js` na constante `PRESETS` (linha 22) e mude os valores de `duration` (em segundos):
     ```js
     const PRESETS = {
       study: { duration: 1500, label: 'Trabalho' }, // Mude para 3000 se quiser 50 min de foco
       short: { duration: 300, label: 'Pausa Curta' },
       long: { duration: 900, label: 'Pausa Longa' }
     };
     ```
2. **Adicionar Novos Campos nas Tarefas ou Diários**:
   - Se quiser adicionar novos dados (ex: campo "Material Utilizado" na tarefa), edite os campos no formulário HTML em `public/index.html`.
   - Em seguida, atualize o envio de JSON no `public/app.js` e adicione o novo cabeçalho correspondente na constante `headers` dentro das rotas de gravação do `server.js` para garantir que o CSV escreva a nova coluna.
3. **Mudar Cores e Estilo Visual**:
   - Abra o `public/style.css` e altere os valores das variáveis CSS globais declaradas na raiz `:root` (linhas 5 a 35). A paleta de cores é controlada de forma centralizada por ali.
