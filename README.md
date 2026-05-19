# 🎯 Estudos Concurso 2026 | Painel de Foco Inteligente

> Um ecossistema de produtividade de ultra-alta performance desenvolvido especificamente para candidatos focados no **Concurso do Banco do Brasil 2026** e outras carreiras de alto nível.

---

## 💎 Sobre o Projeto

Este é um **Painel de Foco e Gestão de Estudos** moderno e dinâmico, desenvolvido com uma interface espacial e futurista (Estilo *Sci-Fi Glassmorphism*). Ele integra perfeitamente controle de tempo líquido (Pomodoro), quadro de tarefas ativo (Kanban), planejamento diário (Cronograma) e registro inteligente de progresso com sincronização em tempo real em banco de dados CSV local.

O design do painel conta com uma experiência imersiva com efeitos neon, micro-animações interativas e o logotipo oficial e proporcional do **Banco do Brasil** integrado diretamente à barra lateral.

---

## 🚀 Funcionalidades Principais

- **⏱️ Cronômetro Pomodoro Completo & Rápido**:
  - Timer circular interativo com contagem regressiva e cálculo automático de porcentagem de ciclo.
  - Pré-configurações rápidas de tempo (Estudo, Intervalo Curto, Intervalo Longo).
  - Feedbacks sonoros sintetizados nativamente (início, cliques de relógio *ticking* e finalização de ciclo).
  - Contador analítico de distrações em tempo real por sessão.

- **📋 Quadro Kanban de Tarefas**:
  - Gerenciador de tarefas integrado com colunas (*A Fazer, Em Progresso e Concluído*).
  - Níveis de prioridade customizados com tags coloridas neon (*Alta, Média, Baixa*).
  - Transições suaves de estado de tarefa.

- **📅 Cronograma de Estudos Integrado**:
  - Planejamento horário diário para manter o foco nas matérias-chave.
  - Sincronização direta dos horários programados para a data atual.

- **✍️ Diário de Estudos Inteligente (Integração de Métricas)**:
  - Sistema inteligente de recomendação que faz varredura e pré-preenche automaticamente o campo **"O que foi estudado hoje"** com base na última tarefa do diário de Pomodoro local (`controle_pomodoro.csv`).
  - Histórico persistente e visualização das anotações das datas anteriores.

- **🎨 Design System Premium**:
  - Layout *Responsive-First* escuro e futurista.
  - Efeitos holográficos e desfoque de fundo de vidro (*Backdrop Blur*).
  - Indicadores visuais de estado ativo ("Desenvolvido por Guedescss" com indicador pulsante).

---

## 🛠️ Tecnologias Utilizadas

- **Frontend**: 
  - HTML5 Semântico com estrutura otimizada para SEO.
  - CSS3 Vanilla (Arquitetura de Design System baseada em CSS Variables e propriedades HSL neon).
  - JavaScript Vanilla (ES6+, manipulação reativa do DOM, síntese de áudio nativa por Web Audio API).
- **Backend & Servidor**:
  - Node.js
  - Express.js (Serviço de APIs e rotas estáticas).
- **Armazenamento de Dados**:
  - Banco de dados em Arquivo Plano (Flat-File CSV) para máxima privacidade e integridade dos logs de estudo (`controle_pomodoro.csv`).

---

## 📦 Como Executar o Projeto Localmente

### Pré-requisitos
* Ter o [Node.js](https://nodejs.org/) instalado na sua máquina.

### Passo a Passo

1. **Clone o repositório** para a sua máquina local:
   ```bash
   git clone https://github.com/guedescss/estudos-concurso-2026.git
   ```

2. **Navegue até a pasta do painel**:
   ```bash
   cd study_dashboard
   ```

3. **Instale as dependências** do projeto:
   ```bash
   npm install
   ```

4. **Inicie o servidor de desenvolvimento**:
   ```bash
   npm start
   ```
   *Ou execute diretamente:*
   ```bash
   node server.js
   ```

5. **Acesse no navegador**:
   Abra [http://localhost:3000](http://localhost:3000) e comece a turbinar os seus estudos!
   Deploy: [https://study-dashboard-production.up.railway.app/](https://study-dashboard-production.up.railway.app/)

---

## ✒️ Direitos e Créditos

Este ecossistema foi projetado e desenvolvido com muito foco e dedicação por:

<div align="center">
  <br/>
  <a href="https://linkedin.com/in/guedescss" target="_blank">
    <img src="https://github.com/guedescss.png" width="120px" style="border-radius: 50%;" alt="João Vitor Guedes"/>
  </a>
  <h3><b>João Vitor Guedes</b></h3>
  <p><i>Desenvolvedor & Idealizador do Projeto</i></p>

  <a href="https://github.com/guedescss" target="_blank">
    <img src="https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white" alt="GitHub" />
  </a>
  <a href="https://linkedin.com/in/guedescss" target="_blank">
    <img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn" />
  </a>
  <br/><br/>
</div>

---

<p align="center">
  <i>"A disciplina supera o talento. Rumo à aprovação em 2026! 🎯"</i>
</p>
