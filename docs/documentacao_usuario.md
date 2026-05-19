# Manual do Usuário: Painel de Estudos Foco 2026

Este documento contém o guia passo a passo de como interagir com o seu **Painel de Estudos Interativo** e como tirar o melhor proveito de cada funcionalidade na sua rotina de preparação.

---

## 🚀 1. Como Iniciar o Painel

Se a aplicação não estiver ativa (por exemplo, após ligar o computador):
1. Abra um terminal (PowerShell ou CMD) na pasta da aplicação:
   ```powershell
   cd "C:\Users\guedes\Desktop\Estudo Concurso 2026\study_dashboard"
   ```
2. Inicie o servidor executando:
   ```powershell
   node server.js
   ```
3. Abra o seu navegador e acesse: **[http://localhost:3000](http://localhost:3000)**

---

## 📊 2. Aba "Dashboard" (Visão Geral)

O Dashboard é a sua central de monitoramento de performance.

```
+------------------------------------------------------------+
|⚡ Tempo Hoje   | 🍅 Pomodoros   | 📈 Tempo Semana | 🎯 Kanban  |
|    150 min     |       6        |     650 min     |    3 / 8   |
+------------------------------------------------------------+
```

### O que fazer aqui:
* **Análise de Foco**: Veja instantaneamente quanto tempo líquido você estudou hoje (baseado apenas nos Pomodoros de Foco concluídos).
* **Contador de Distrações**: Acompanhe o número total de interrupções que você registrou no dia.
* **Registrar Distração Rápida**: Se você estava fora do timer e se distraiu (redes sociais, celular, etc.), clique no botão amarelo `⚡ Registrar Distração (+1)` para contabilizar.
* **Visualização Rápida**: Acompanhe as 5 principais tarefas ativas no seu Kanban e veja o seu cronograma de estudos planejado para o dia atual.

---

## ⏱️ 3. Aba "Timer Pomodoro" (Execução)

Esta é a tela onde a mágica do foco acontece. Ela combina o tradicional método Pomodoro com o seu gerenciador de tarefas.

### Passo a Passo para uma Sessão de Estudo:
1. **Selecione uma Tarefa (Opcional, mas Recomendado)**: 
   - No painel da direita, clique em **"Vincular a uma Tarefa"**.
   - Escolha a matéria ou tarefa ativa do seu Kanban que você vai estudar agora.
2. **Escolha o Bloco (Preset)**:
   - Clique em um dos três presets no centro:
     - `🍅 Foco (25m)`: Período de foco total.
     - `☕ Pausa Curta (5m)`: Descanso rápido.
     - `🌴 Pausa Longa (15m)`: Descanso maior após 4 ciclos de foco.
3. **Controle o Fluxo**:
   - Clique no grande botão circular azul `▶ Iniciar` para começar a contagem regressiva.
   - O anel de progresso circular irá se apagar lentamente conforme o tempo passa.
   - Para pausar, clique em `❚❚ Pausar`.
   - Se quiser pular a fase atual (ex: acabar o descanso antes), clique no botão `Pular Bloco ⏭️`.
4. **Gerenciamento de Distrações**:
   - Se durante o ciclo de foco você se distrair, clique imediatamente no botão amarelo `⚡ Perdi o Foco! Registrar Distração`.
   - A distração será somada à sessão atual e salva no CSV no final do ciclo para sua análise estatística posterior.
5. **Anotações da Sessão**:
   - Escreva no campo **"Anotações da Sessão"** o que está fazendo (ex: "Lendo capítulos 1 e 2 de Constitucional") para salvar junto ao log.
6. **Conclusão Automática**:
   - Ao zerar o timer, um sinal sonoro agradável (gerado pelo próprio navegador) será tocado.
   - Uma mensagem confirmará a conclusão. Ao clicar em "OK", os dados serão **automaticamente salvos** em `02_Pomodoro_e_Horas/controle_pomodoro.csv`.
   - Se você tinha selecionado uma tarefa, o sistema também atualizará o status dela para "Fazendo hoje" no Kanban.

---

## 📋 4. Aba "Quadro Kanban" (Planejamento)

Esta aba permite organizar visualmente o fluxo de vida das suas matérias e tarefas.

```
+------------+   +--------------+   +------------------+   +------------+
| A Fazer    |   | Fazendo Hoje |   | Travado/Pendente |   | Concluído  |
|            |   |              |   |                  |   |            |
|  [Card]    |-->|    [Card]    |-->|      [Card]      |-->|   [Card]   |
+------------+   +--------------+   +------------------+   +------------+
```

### Como Operar o Kanban:
* **Criar Nova Tarefa**:
   1. Clique no botão verde `+ Nova Tarefa de Estudo`.
   2. Preencha o Título (ex: "Resolver 30 questões de crase"), selecione a Prioridade (Alta, Média ou Baixa), estime quantos Pomodoros vai levar, defina a Origem (ex: "QConcursos", "PDF Aula 3") e digite observações úteis.
   3. Clique em **"Salvar Tarefa"**. Ela aparecerá instantaneamente em **"A Fazer"** tanto no site quanto no seu arquivo CSV e Markdown local.
* **Mover Tarefas (Mudar de Status)**:
   - **Método 1 (Arrastar)**: Clique com o mouse no card e arraste-o para a coluna desejada (ex: mover de "A Fazer" para "Fazendo Hoje" ao iniciar o dia).
   - **Método 2 (Cliques rápidos)**: Clique no botão verde de checkmark `✅` no card para movê-lo diretamente para a coluna "Concluído".
* **Editar Tarefa**: Clique no ícone de lápis `✏️` no card da tarefa para abrir o formulário com os dados preenchidos e editá-los.
* **Excluir Tarefa**: Clique no ícone de lixeira `🗑️` vermelha. Uma confirmação será exibida e, ao aceitar, a tarefa sumirá do Kanban e dos seus arquivos locais.

---

## 📅 5. Aba "Cronograma Semanal" (Rotina)

Exibe de forma visual o seu planejamento definido no arquivo `01_Planejamento_de_Horarios/planejamento_semanal.csv`.

* **Destaque Dinâmico**: A aplicação lê a data atual do seu computador e **ilumina com uma borda neon roxa** o dia da semana em que você está.
* **Leitura**: Excelente para consultar rapidamente qual é o seu bloco atual de estudos planejado para o dia.

---

## 📝 6. Aba "Diário de Estudos" (Fechamento)

Ideal para ser preenchida no encerramento da sua rotina diária de estudos.

### Como Preencher e Salvar:
1. **Data**: O campo data vem automaticamente preenchido com a data de hoje.
2. **Integração Inteligente**: O painel busca os Pomodoros de foco executados hoje no banco de dados local e **preenche automaticamente** o "Tempo Líquido" e a "Qtd. Pomodoros" (ex: "150 min" e "6 Pomodoros").
3. **Assuntos e Entregas Automáticos**:
   - A aplicação agrupa todos os títulos das tarefas que você estudou ou concluiu hoje no Kanban e pré-preenche os campos correspondentes para economizar seu tempo de digitação!
4. **Avalie e Planeje**:
   - Defina a Dificuldade geral observada no dia (Fácil, Média ou Difícil).
   - Escreva o que planeja estudar amanhã no campo **"Próximo Passo"**.
5. **Gravar**: Clique no botão verde `💾 Gravar Diário de Estudo`.
   - Os dados são salvos em `04_Registro_do_Que_Foi_Estudado/diario_de_estudo.csv`.
   - Um histórico visual com todos os seus diários anteriores aparecerá no lado direito da tela para fácil consulta!
