/* ==========================================================================
   APP.JS - LÓGICA E INTERATIVIDADE DO PAINEL DE ESTUDOS
   ========================================================================== */

// --- ESTADO GLOBAL DA APLICAÇÃO ---
const state = {
  currentTab: 'dashboard',
  tasks: [],
  schedule: [],
  pomodoroLogs: [],
  diaryLogs: [],
  analytics: null,
  frequency: [],

  // Timer State
  timer: {
    duration: 1500, // 25 min em segundos
    timeLeft: 1500,
    intervalId: null,
    isRunning: false,
    phase: 'study', // study, short, long
    startTime: null,
    distractions: 0,
    tickingEnabled: false
  }
};

// Configurações dos Presets
const PRESETS = {
  study: { duration: 1500, label: 'Trabalho' }, // 25 min
  short: { duration: 300, label: 'Pausa Curta' },  // 5 min
  long: { duration: 900, label: 'Pausa Longa' }   // 15 min
};

// ==========================================
// AUDIO SINTETIZADOR ENGINE (Web Audio API)
// ==========================================
function playSyntheticSound(type) {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'start') {
      // Tom subindo alegre
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.25); // G5
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } else if (type === 'end') {
      // Sucessão harmônica dupla
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
      osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } else if (type === 'tick') {
      // Clique de relógio discreto
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1000, ctx.currentTime);
      gain.gain.setValueAtTime(0.015, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.04);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.04);
    }
  } catch (err) {
    console.warn('Bloqueio do navegador para som ou áudio indisponível', err);
  }
}

// ==========================================
// INICIALIZAÇÃO DA APLICAÇÃO
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  setupTabs();
  setupTimerControls();
  setupKanban();
  setupDiaryForm();
  setupFrequency();

  // Mostra a data de hoje formatada
  const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById('current-date-display').innerText = new Date().toLocaleDateString('pt-BR', dateOptions);

  // Set date field values
  const todayStr = new Date().toISOString().split('T')[0];
  document.getElementById('diary-date').value = todayStr;

  // Set default values for frequency month and year selects
  const now = new Date();
  const monthSelect = document.getElementById('frequency-month-select');
  const yearSelect = document.getElementById('frequency-year-select');
  if (monthSelect) monthSelect.value = now.getMonth();
  if (yearSelect) yearSelect.value = now.getFullYear();

  // Carrega os dados iniciais
  loadAllData();

  // Atualiza as estatísticas rápidas periodicamente
  setInterval(loadAllData, 30000);
});

// ==========================================
// CONTROLE DE NAVEGAÇÃO DE ABAS
// ==========================================
function setupTabs() {
  const menuButtons = document.querySelectorAll('.menu-item');
  menuButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabName = btn.getAttribute('data-tab');
      switchTab(tabName);
    });
  });
}

function switchTab(tabName) {
  state.currentTab = tabName;

  // Atualiza botões da barra lateral
  document.querySelectorAll('.menu-item').forEach(btn => {
    if (btn.getAttribute('data-tab') === tabName) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Atualiza painéis de conteúdo
  document.querySelectorAll('.tab-pane').forEach(pane => {
    if (pane.id === `tab-${tabName}`) {
      pane.classList.add('active');
    } else {
      pane.classList.remove('active');
    }
  });

  // Atualiza título do Header
  const titles = {
    dashboard: 'Dashboard Geral',
    pomodoro: 'Timer Pomodoro',
    kanban: 'Quadro Kanban de Tarefas',
    schedule: 'Cronograma Semanal',
    diary: 'Diário de Estudos'
  };
  document.getElementById('current-tab-title').innerText = titles[tabName] || 'Painel de Estudo';

  // Recarrega dados relevantes da aba aberta
  loadAllData();
}

// ==========================================
// BUSCA E SINCRONIZAÇÃO DE DADOS (API)
// ==========================================
async function loadAllData() {
  try {
    const [tasksRes, scheduleRes, pomRes, diaryRes, statsRes, freqRes] = await Promise.all([
      fetch('/api/tasks'),
      fetch('/api/schedule'),
      fetch('/api/pomodoros'),
      fetch('/api/diary'),
      fetch('/api/analytics'),
      fetch('/api/frequency')
    ]);

    state.tasks = await tasksRes.json();
    state.schedule = await scheduleRes.json();
    state.pomodoroLogs = await pomRes.json();
    state.diaryLogs = await diaryRes.json();
    state.analytics = await statsRes.json();
    state.frequency = await freqRes.json();

    // Atualiza a UI com os dados carregados
    renderUI();
  } catch (err) {
    console.error('Erro ao buscar dados do servidor local:', err);
  }
}

function renderUI() {
  updateHeaderStats();

  if (state.currentTab === 'dashboard') {
    renderDashboard();
  } else if (state.currentTab === 'pomodoro') {
    updateTaskSelectDropdown();
  } else if (state.currentTab === 'kanban') {
    renderKanban();
  } else if (state.currentTab === 'schedule') {
    renderSchedule();
    renderFrequencyCalendar();
  } else if (state.currentTab === 'diary') {
    renderDiaryHistory();
    prefillDiaryMetrics();
  }
}

function updateHeaderStats() {
  if (!state.analytics) return;

  document.getElementById('header-study-time').innerText = `${state.analytics.today.minutes} min`;
  document.getElementById('header-pomodoros').innerText = state.analytics.today.pomodoros;
}

// ==========================================
// RENDERIZADOR DO DASHBOARD
// ==========================================
function renderDashboard() {
  if (!state.analytics) return;

  // Cartões
  document.getElementById('dash-time-today').innerText = `${state.analytics.today.minutes} min`;
  document.getElementById('dash-pom-today').innerText = state.analytics.today.pomodoros;
  document.getElementById('dash-time-week').innerText = `${state.analytics.week.minutes} min`;

  const total = state.analytics.tasks.total;
  const completed = state.analytics.tasks.completed;
  document.getElementById('dash-tasks-completed').innerText = `${completed} / ${total}`;

  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  document.getElementById('dash-tasks-pct').innerText = `Aproveitamento de ${pct}% das tarefas criadas.`;

  document.getElementById('dash-distractions-today').innerText = state.analytics.today.distractions;

  // Lista de Tarefas Ativas no Dashboard
  const activeTasksList = document.getElementById('dash-active-tasks-list');
  activeTasksList.innerHTML = '';

  const activeTasks = state.tasks.filter(t => t.Status === 'Fazendo hoje' || t.Status === 'A fazer').slice(0, 5);

  if (activeTasks.length === 0) {
    activeTasksList.innerHTML = '<li class="loading-item">Nenhuma tarefa ativa pendente. Excelente! 🎉</li>';
  } else {
    activeTasks.forEach(task => {
      const isDoing = task.Status === 'Fazendo hoje';
      const li = document.createElement('li');
      li.className = 'task-summary-item';
      li.innerHTML = `
        <span class="dot" style="background-color: ${isDoing ? 'var(--warning)' : 'var(--text-muted)'}"></span>
        <span class="task-name">${task.Tarefa}</span>
        <span class="badge prio badge-${task.Prioridade.toLowerCase()}">${task.Prioridade}</span>
      `;
      activeTasksList.appendChild(li);
    });
  }

  // Cronograma de Hoje
  const todayName = getTodayWeekDayName();
  const todayScheduleList = document.getElementById('dash-today-schedule-list');
  todayScheduleList.innerHTML = '';

  const todayBlocks = state.schedule.filter(s => s.Dia.toLowerCase() === todayName.toLowerCase());

  if (todayBlocks.length === 0) {
    todayScheduleList.innerHTML = '<p class="loading-item">Sem blocos planejados para hoje.</p>';
  } else {
    todayBlocks.forEach(b => {
      const card = document.createElement('div');
      card.className = 'schedule-block-card';
      card.style.marginBottom = '8px';
      card.innerHTML = `
        <span class="block-time">${b.Horario_Inicio} - ${b.Horario_Fim} | ${b.Bloco}</span>
        <span class="block-name">${b.Objetivo}</span>
        <span class="block-objective" style="font-size: 10px; color: var(--text-secondary);">${b.Observacoes || 'Sem observações'}</span>
      `;
      todayScheduleList.appendChild(card);
    });
  }
}

function getTodayWeekDayName() {
  const days = ['Domingo', 'Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta', 'Sabado'];
  return days[new Date().getDay()];
}

// ==========================================
// TIMER POMODORO INTERATIVO
// ==========================================
function setupTimerControls() {
  const toggleBtn = document.getElementById('btn-timer-toggle');
  const miniToggleBtn = document.getElementById('btn-mini-play');
  const resetBtn = document.getElementById('btn-timer-reset');
  const skipBtn = document.getElementById('btn-timer-skip');
  const miniSkipBtn = document.getElementById('btn-mini-skip');

  const presetStudyBtn = document.getElementById('btn-preset-study');
  const presetShortBtn = document.getElementById('btn-preset-short');
  const presetLongBtn = document.getElementById('btn-preset-long');

  const tickingCheckbox = document.getElementById('toggle-ticking-sound');
  const distractionBtnTimer = document.getElementById('btn-log-distraction-timer');
  const distractionBtnDash = document.getElementById('btn-log-distraction-dash');

  // Play/Pause
  toggleBtn.addEventListener('click', toggleTimer);
  miniToggleBtn.addEventListener('click', toggleTimer);

  // Reset / Skip
  resetBtn.addEventListener('click', resetTimer);
  skipBtn.addEventListener('click', skipPhase);
  miniSkipBtn.addEventListener('click', skipPhase);

  // Presets
  presetStudyBtn.addEventListener('click', () => setPreset('study'));
  presetShortBtn.addEventListener('click', () => setPreset('short'));
  presetLongBtn.addEventListener('click', () => setPreset('long'));

  // Ticking Sound Toggle
  tickingCheckbox.addEventListener('change', (e) => {
    state.timer.tickingEnabled = e.target.checked;
  });

  // Distrações
  distractionBtnTimer.addEventListener('click', logDistraction);
  distractionBtnDash.addEventListener('click', logDistraction);

  // Inicializa a UI do Ring
  updateTimerUI();
}

function toggleTimer() {
  if (state.timer.isRunning) {
    pauseTimer();
  } else {
    startTimer();
  }
}

function startTimer() {
  if (state.timer.isRunning) return;

  state.timer.isRunning = true;
  state.timer.startTime = new Date();

  // Toca som de início
  playSyntheticSound('start');

  state.timer.intervalId = setInterval(() => {
    state.timer.timeLeft--;

    // Tocar som de relógio se habilitado
    if (state.timer.tickingEnabled && state.timer.timeLeft > 0) {
      playSyntheticSound('tick');
    }

    if (state.timer.timeLeft <= 0) {
      handleTimerComplete();
    }

    updateTimerUI();
  }, 1000);

  document.getElementById('btn-timer-toggle').innerText = '❚❚';
  document.getElementById('btn-mini-play').innerText = '❚❚';

  // Visual pulse class on timer-info
  document.querySelector('.circular-timer-container').classList.add('timer-running');
}

function pauseTimer() {
  if (!state.timer.isRunning) return;

  clearInterval(state.timer.intervalId);
  state.timer.isRunning = false;
  state.timer.intervalId = null;

  document.getElementById('btn-timer-toggle').innerText = '▶';
  document.getElementById('btn-mini-play').innerText = '▶';
  document.querySelector('.circular-timer-container').classList.remove('timer-running');
}

function resetTimer() {
  pauseTimer();
  state.timer.timeLeft = state.timer.duration;
  state.timer.distractions = 0;
  document.getElementById('session-distraction-count').innerText = 0;
  updateTimerUI();
}

function setPreset(phaseName) {
  pauseTimer();

  const preset = PRESETS[phaseName];
  if (!preset) return;

  state.timer.phase = phaseName;
  state.timer.duration = preset.duration;
  state.timer.timeLeft = preset.duration;
  state.timer.distractions = 0;

  document.getElementById('session-distraction-count').innerText = 0;
  document.getElementById('timer-phase-title').innerText = preset.label;
  document.getElementById('mini-timer-label').innerText = preset.label;

  // Atualiza classes ativas nos botões de preset
  document.querySelectorAll('.btn-preset').forEach(btn => {
    if (btn.getAttribute('data-preset') === phaseName) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Muda cor do anel com base na fase
  const ring = document.getElementById('timer-progress-ring');
  if (phaseName === 'study') {
    ring.style.stroke = 'var(--primary)';
  } else if (phaseName === 'short') {
    ring.style.stroke = 'var(--success)';
  } else {
    ring.style.stroke = 'var(--info)';
  }

  updateTimerUI();
}

function skipPhase() {
  pauseTimer();
  // Alterna: Foco -> Pausa Curta -> Foco -> Pausa Curta ... Pausa Longa a cada 4 foco
  if (state.timer.phase === 'study') {
    setPreset('short');
  } else {
    setPreset('study');
  }
}

function logDistraction() {
  state.timer.distractions++;
  document.getElementById('session-distraction-count').innerText = state.timer.distractions;

  // Se estiver no dashboard, envia direto pro servidor no Pomodoro mais recente
  if (state.currentTab === 'dashboard') {
    // Registra uma distração avulsa diretamente
    fetch('/api/pomodoros', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        Duracao_Minutos: '0',
        Tipo: 'Distração Avulsa',
        Assunto_ou_Tarefa: 'Registro manual via Dashboard',
        Distracoes: 1,
        Concluido: 'Não'
      })
    }).then(() => loadAllData());
  }
}

function updateTimerUI() {
  const minutes = Math.floor(state.timer.timeLeft / 60);
  const seconds = state.timer.timeLeft % 60;
  const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  document.getElementById('timer-clock').innerText = timeStr;
  document.getElementById('mini-timer-time').innerText = timeStr;

  // Progress Ring
  const ring = document.getElementById('timer-progress-ring');
  const maxDashOffset = 552.92; // 2 * Math.PI * 88
  const pct = state.timer.timeLeft / state.timer.duration;
  const dashOffset = maxDashOffset * (1 - pct);

  ring.style.strokeDashoffset = dashOffset;

  // Info text pct
  const pctText = `${Math.round(pct * 100)}%`;
  document.getElementById('timer-pct').innerText = pctText;
}

async function handleTimerComplete() {
  pauseTimer();
  playSyntheticSound('end');

  const phaseLabel = PRESETS[state.timer.phase].label;
  alert(`Fase finalizada: ${phaseLabel}! Muito bem! 🎉`);

  // Registrar automaticamente no arquivo CSV
  const selectElement = document.getElementById('pomodoro-task-select');
  const taskName = selectElement.value || document.getElementById('pomodoro-notes').value || 'Foco Geral';

  const now = new Date();
  const startTime = state.timer.startTime || new Date(now.getTime() - state.timer.duration * 1000);

  const formatTime = (date) => {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const bodyData = {
    Inicio: formatTime(startTime),
    Fim: formatTime(now),
    Duracao_Minutos: String(Math.round(state.timer.duration / 60)),
    Tipo: state.timer.phase === 'study' ? 'Estudo' : 'Pausa',
    Assunto_ou_Tarefa: taskName,
    Concluido: 'Sim',
    Distracoes: String(state.timer.distractions),
    Observacoes: state.timer.phase === 'study' ? 'Ciclo finalizado' : 'Descanso merecido'
  };

  try {
    const res = await fetch('/api/pomodoros', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyData)
    });

    if (res.ok) {
      // Se foi vinculado a uma tarefa Kanban e foi estudo, incrementa pomodoro nela
      if (state.timer.phase === 'study' && selectElement.value) {
        // Encontra o ID da tarefa selecionada
        const targetTask = state.tasks.find(t => t.Tarefa === selectElement.value);
        if (targetTask) {
          // Atualiza a tarefa no servidor (sinaliza que está fazendo e salva nota)
          await fetch(`/api/tasks/${targetTask.ID}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              Status: 'Fazendo hoje',
              Observacoes: `Ciclo Pomodoro concluído em ${new Date().toLocaleDateString('pt-BR')}`
            })
          });
        }
      }

      // Reseta o timer para a próxima fase
      state.timer.distractions = 0;
      document.getElementById('session-distraction-count').innerText = 0;
      document.getElementById('pomodoro-notes').value = '';

      // Auto transição para o próximo bloco
      skipPhase();

      // Recarrega todos os dados
      loadAllData();
    }
  } catch (err) {
    console.error('Erro ao salvar log do Pomodoro no CSV:', err);
  }
}

function updateTaskSelectDropdown() {
  const select = document.getElementById('pomodoro-task-select');
  if (!select) return;

  const currentValue = select.value;
  select.innerHTML = '<option value="">-- Estudar sem tarefa específica (Apenas Foco geral) --</option>';

  // Apenas tarefas pendentes/ativas
  const activeTasks = state.tasks.filter(t => t.Status !== 'Concluido');
  activeTasks.forEach(task => {
    const opt = document.createElement('option');
    opt.value = task.Tarefa;
    opt.innerText = `[${task.Prioridade}] ${task.Tarefa} (${task.Origem})`;
    select.appendChild(opt);
  });

  // Preserva valor selecionado se ainda existir
  if (currentValue && activeTasks.some(t => t.Tarefa === currentValue)) {
    select.value = currentValue;
  }
}

// ==========================================
// QUADRO KANBAN DE TAREFAS
// ==========================================
function setupKanban() {
  const openModalBtn = document.getElementById('btn-open-task-modal');
  const closeModalBtn = document.getElementById('btn-close-task-modal');
  const cancelBtn = document.getElementById('btn-cancel-task');
  const form = document.getElementById('task-form');

  openModalBtn.addEventListener('click', () => openTaskModal());
  closeModalBtn.addEventListener('click', closeTaskModal);
  cancelBtn.addEventListener('click', closeTaskModal);

  form.addEventListener('submit', handleTaskSubmit);

  // Setup Drag & Drop Handlers
  const columns = document.querySelectorAll('.kanban-column');
  columns.forEach(col => {
    col.addEventListener('dragover', (e) => {
      e.preventDefault();
      col.classList.add('drag-over');
    });

    col.addEventListener('dragleave', () => {
      col.classList.remove('drag-over');
    });

    col.addEventListener('drop', (e) => {
      e.preventDefault();
      col.classList.remove('drag-over');
      const taskId = e.dataTransfer.getData('text/plain');
      const newStatus = col.getAttribute('data-status');

      moveTaskStatus(taskId, newStatus);
    });
  });
}

function openTaskModal(task = null) {
  const modal = document.getElementById('task-modal');
  const title = document.getElementById('modal-task-title');
  const form = document.getElementById('task-form');

  form.reset();

  if (task) {
    title.innerText = 'Editar Tarefa de Estudo';
    document.getElementById('task-id-field').value = task.ID;
    document.getElementById('field-task-name').value = task.Tarefa;
    document.getElementById('field-task-priority').value = task.Prioridade;
    document.getElementById('field-task-pomodoros').value = task.Estimativa_Pomodoros;
    document.getElementById('field-task-origin').value = task.Origem;
    document.getElementById('field-task-status').value = task.Status;
    document.getElementById('field-task-notes').value = task.Observacoes;
  } else {
    title.innerText = 'Criar Nova Tarefa de Estudo';
    document.getElementById('task-id-field').value = '';
    document.getElementById('field-task-status').value = 'A fazer';
  }

  modal.classList.add('active');
}

function closeTaskModal() {
  document.getElementById('task-modal').classList.remove('active');
}

async function handleTaskSubmit(e) {
  e.preventDefault();

  const id = document.getElementById('task-id-field').value;
  const data = {
    Tarefa: document.getElementById('field-task-name').value,
    Prioridade: document.getElementById('field-task-priority').value,
    Estimativa_Pomodoros: document.getElementById('field-task-pomodoros').value,
    Origem: document.getElementById('field-task-origin').value || 'Site externo',
    Status: document.getElementById('field-task-status').value,
    Observacoes: document.getElementById('field-task-notes').value
  };

  try {
    let res;
    if (id) {
      // Editar existente
      res = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } else {
      // Criar nova
      res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    }

    if (res.ok) {
      closeTaskModal();
      loadAllData();
    }
  } catch (err) {
    console.error('Erro ao salvar tarefa no CSV:', err);
  }
}

async function moveTaskStatus(taskId, newStatus) {
  try {
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ Status: newStatus })
    });

    if (res.ok) {
      loadAllData();
    }
  } catch (err) {
    console.error('Erro ao atualizar status da tarefa:', err);
  }
}

async function deleteTask(taskId) {
  if (!confirm('Deseja realmente excluir esta tarefa? Os arquivos CSV e Markdown locais serão atualizados.')) return;

  try {
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: 'DELETE'
    });

    if (res.ok) {
      loadAllData();
    }
  } catch (err) {
    console.error('Erro ao excluir tarefa:', err);
  }
}

function renderKanban() {
  // Limpa containers
  const containers = {
    'A fazer': document.getElementById('cards-todo'),
    'Fazendo hoje': document.getElementById('cards-doing'),
    'Travado / pendente': document.getElementById('cards-blocked'),
    'Concluido': document.getElementById('cards-done')
  };

  Object.values(containers).forEach(c => {
    if (c) c.innerHTML = '';
  });

  const counts = { 'A fazer': 0, 'Fazendo hoje': 0, 'Travado / pendente': 0, 'Concluido': 0 };

  state.tasks.forEach(task => {
    let status = task.Status || 'A fazer';

    // Normalização de nomes de status legados
    if (status === 'Fazendo') status = 'Fazendo hoje';
    if (status.includes('Travado') || status.includes('pendent')) status = 'Travado / pendente';
    if (status.includes('concluid') || status === 'Done') status = 'Concluido';

    const container = containers[status];
    if (!container) return;

    counts[status]++;

    // Criação do Card
    const card = document.createElement('div');
    card.className = 'kanban-card';
    card.draggable = true;
    card.setAttribute('data-id', task.ID);

    card.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', task.ID);
      card.style.opacity = '0.5';
    });

    card.addEventListener('dragend', () => {
      card.style.opacity = '1';
    });

    const prioLower = task.Prioridade.toLowerCase();
    const estimativa = task.Estimativa_Pomodoros || 1;

    card.innerHTML = `
      <span class="card-priority-badge badge-${prioLower}">${task.Prioridade}</span>
      <h5>${task.Tarefa}</h5>
      <div class="kanban-card-footer">
        <span class="card-origin">${task.Origem}</span>
        <span class="card-estimate">🍅 ${estimativa}</span>
      </div>
      <div class="card-actions">
        <button class="btn-card-action" onclick="openTaskModalById('${task.ID}')">✏️</button>
        ${status !== 'Concluido' ? `<button class="btn-card-action" onclick="moveTaskStatus('${task.ID}', 'Concluido')">✅</button>` : ''}
        <button class="btn-card-action" onclick="deleteTask('${task.ID}')" style="color: var(--danger);">🗑️</button>
      </div>
    `;

    container.appendChild(card);
  });

  // Atualiza contadores nas colunas
  document.getElementById('count-todo').innerText = counts['A fazer'];
  document.getElementById('count-doing').innerText = counts['Fazendo hoje'];
  document.getElementById('count-blocked').innerText = counts['Travado / pendente'];
  document.getElementById('count-done').innerText = counts['Concluido'];

  // Total Geral
  document.getElementById('kanban-badge-total').innerText = `${state.tasks.length} Tarefas`;
}

// Handler acessível globalmente
window.openTaskModalById = function (id) {
  const task = state.tasks.find(t => t.ID === id);
  if (task) {
    openTaskModal(task);
  }
};

window.moveTaskStatus = moveTaskStatus;
window.deleteTask = deleteTask;

// ==========================================
// CRONOGRAMA SEMANAL (TABELA INTERATIVA)
// ==========================================
function renderSchedule() {
  const container = document.getElementById('weekly-schedule-container');
  container.innerHTML = '';

  const weekDays = ['Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta', 'Sabado', 'Domingo'];
  const todayIndex = new Date().getDay(); // 0 = Domingo, 1 = Segunda...

  // Converte index de Date para index de cronograma (Segunda é o primeiro, Domingo é o último)
  let todayScheduleIdx = todayIndex === 0 ? 6 : todayIndex - 1;

  weekDays.forEach((day, index) => {
    const col = document.createElement('div');
    col.className = 'schedule-day-column';
    if (index === todayScheduleIdx) {
      col.classList.add('active-day');
    }

    // Normaliza nome do dia para exibição limpa
    const displayNames = {
      Segunda: 'Segunda-feira',
      Terca: 'Terça-feira',
      Quarta: 'Quarta-feira',
      Quinta: 'Quinta-feira',
      Sexta: 'Sexta-feira',
      Sabado: 'Sábado',
      Domingo: 'Domingo'
    };

    col.innerHTML = `<div class="day-title">${displayNames[day]}</div>`;

    const blocksContainer = document.createElement('div');
    blocksContainer.className = 'schedule-blocks-container';

    const dayBlocks = state.schedule.filter(s => s.Dia.toLowerCase() === day.toLowerCase());

    if (dayBlocks.length === 0) {
      blocksContainer.innerHTML = '<span class="loading-item" style="font-size:10px;">Sem blocos</span>';
    } else {
      dayBlocks.forEach(b => {
        const blockEl = document.createElement('div');
        blockEl.className = 'schedule-block-card';
        blockEl.innerHTML = `
          <span class="block-time">${b.Horario_Inicio} - ${b.Horario_Fim}</span>
          <span class="block-name">${b.Bloco}</span>
          <span class="block-objective">${b.Objetivo}</span>
        `;
        blocksContainer.appendChild(blockEl);
      });
    }

    col.appendChild(blocksContainer);
    container.appendChild(col);
  });
}

// ==========================================
// DIÁRIO DE ESTUDOS
// ==========================================
function setupDiaryForm() {
  const form = document.getElementById('diary-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = {
      Data: document.getElementById('diary-date').value,
      Tempo_Liquido: document.getElementById('diary-minutes').value,
      Quantidade_Pomodoros: document.getElementById('diary-pomodoros').value,
      O_que_foi_estudado: document.getElementById('diary-studied').value,
      O_que_foi_concluido: document.getElementById('diary-completed').value,
      Dificuldade: document.getElementById('diary-difficulty').value,
      Proximo_Passo: document.getElementById('diary-next-step').value
    };

    try {
      const res = await fetch('/api/diary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (res.ok) {
        alert('Diário de estudos gravado e sincronizado com sucesso! 📝');
        loadAllData();
      }
    } catch (err) {
      console.error('Erro ao salvar diário no CSV:', err);
    }
  });
}

function prefillDiaryMetrics() {
  if (!state.analytics) return;

  // Preenche métricas numéricas se o dia selecionado for hoje
  const selectedDate = document.getElementById('diary-date').value;
  const todayStr = new Date().toISOString().split('T')[0];

  if (selectedDate === todayStr) {
    document.getElementById('diary-minutes').value = `${state.analytics.today.minutes} min`;
    document.getElementById('diary-pomodoros').value = state.analytics.today.pomodoros;

    // Auto preenchimento dos temas estudados hoje a partir dos Pomodoros salvos
    const todayStudyPomodoros = state.pomodoroLogs.filter(p => p.Data === todayStr && p.Tipo === 'Estudo');
    const studiedTopics = [...new Set(todayStudyPomodoros.map(p => p.Assunto_ou_Tarefa).filter(Boolean))].join('; ');

    if (studiedTopics && !document.getElementById('diary-studied').value) {
      document.getElementById('diary-studied').value = studiedTopics;
    }

    // Auto preenchimento das tarefas concluídas hoje a partir do Kanban
    const completedTasksToday = state.tasks.filter(t => t.Status === 'Concluido' && t.Data_Conclusao === todayStr);
    const completedTitles = completedTasksToday.map(t => t.Tarefa).join('; ');

    if (completedTitles && !document.getElementById('diary-completed').value) {
      document.getElementById('diary-completed').value = completedTitles;
    }
  }
}

function renderDiaryHistory() {
  const container = document.getElementById('diary-history-container');
  if (!container) return;

  container.innerHTML = '';

  // Ordena por data decrescente
  const sortedLogs = [...state.diaryLogs].sort((a, b) => new Date(b.Data) - new Date(a.Data));

  if (sortedLogs.length === 0) {
    container.innerHTML = '<div class="loading-item" style="padding: 20px;">Nenhum registro no diário de estudos.</div>';
    return;
  }

  sortedLogs.forEach(log => {
    const card = document.createElement('div');
    card.className = 'diary-history-card';

    // Format Date for Portuguese
    const parts = log.Data.split('-');
    const dateStr = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : log.Data;

    card.innerHTML = `
      <div class="diary-card-header">
        <span class="diary-card-date">📅 ${dateStr}</span>
        <span class="difficulty-badge diff-${log.Dificuldade.toLowerCase()}">${log.Dificuldade}</span>
      </div>
      <div class="diary-card-stats">
        <div class="diary-card-stat">Foco Líquido: <strong>${log.Tempo_Liquido}</strong></div>
        <div class="diary-card-stat">Ciclos: <strong>🍅 ${log.Quantidade_Pomodoros}</strong></div>
      </div>
      ${log.O_que_foi_estudado ? `
        <div class="diary-card-section">
          <span>Estudado</span>
          <p>${log.O_que_foi_estudado}</p>
        </div>
      ` : ''}
      ${log.O_que_foi_concluido ? `
        <div class="diary-card-section">
          <span>Entregas</span>
          <p>${log.O_que_foi_concluido}</p>
        </div>
      ` : ''}
      ${log.Proximo_Passo ? `
        <div class="diary-card-section">
          <span>Próximo Passo</span>
          <p>${log.Proximo_Passo}</p>
        </div>
      ` : ''}
    `;
    container.appendChild(card);
  });
}

// ==========================================
// FREQUÊNCIA MENSAL DE ESTUDOS (CHECKLIST)
// ==========================================
function setupFrequency() {
  const monthSelect = document.getElementById('frequency-month-select');
  const yearSelect = document.getElementById('frequency-year-select');
  const syncBtn = document.getElementById('btn-sync-frequency');

  if (!monthSelect || !yearSelect || !syncBtn) return;

  monthSelect.addEventListener('change', renderFrequencyCalendar);
  yearSelect.addEventListener('change', renderFrequencyCalendar);
  syncBtn.addEventListener('click', syncFrequencyFromLogs);
}

function renderFrequencyCalendar() {
  const container = document.getElementById('frequency-calendar-grid');
  if (!container) return;

  const monthSelect = document.getElementById('frequency-month-select');
  const yearSelect = document.getElementById('frequency-year-select');
  if (!monthSelect || !yearSelect) return;

  const month = parseInt(monthSelect.value, 10);
  const year = parseInt(yearSelect.value, 10);
  const mesAnoStr = `${year}-${String(month + 1).padStart(2, '0')}`;

  // Procura os dados salvos deste mês
  const monthData = state.frequency.find(f => f.Mes_Ano === mesAnoStr);
  const checkedDays = monthData && monthData.Dias_Marcados
    ? monthData.Dias_Marcados.split(',').map(Number).filter(Boolean)
    : [];

  container.innerHTML = '';

  // Total de dias no mês selecionado
  const totalDays = new Date(year, month + 1, 0).getDate();

  // Índice do dia da semana do dia 1 (0 = Domingo, 1 = Segunda...)
  const firstDayIndex = new Date(year, month, 1).getDay();

  // Renderiza dias em branco para alinhar com o dia da semana correto
  for (let i = 0; i < firstDayIndex; i++) {
    const emptyCell = document.createElement('div');
    emptyCell.className = 'freq-day-cell empty';
    container.appendChild(emptyCell);
  }

  // Contexto de hoje para destaque
  const today = new Date();
  const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year;
  const todayDate = today.getDate();

  let studiedCount = 0;

  // Renderiza os dias do mês
  for (let d = 1; d <= totalDays; d++) {
    const cell = document.createElement('div');
    cell.className = 'freq-day-cell';
    cell.innerText = d;

    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

    // Verifica se possui logs de estudo no diário ou pomodoro
    const hasDiaryRecord = state.diaryLogs.some(log => log.Data === dateStr && log.Tempo_Liquido !== '0 min' && log.Tempo_Liquido !== '0');
    const hasPomodoroRecord = state.pomodoroLogs.some(p => p.Data === dateStr && p.Tipo === 'Estudo' && p.Concluido === 'Sim');
    const hasActivity = hasDiaryRecord || hasPomodoroRecord;

    const isChecked = checkedDays.includes(d);

    if (isChecked) {
      cell.classList.add('checked');
      studiedCount++;
    }

    if (hasActivity) {
      cell.classList.add('has-activity');
      const dot = document.createElement('span');
      dot.className = 'activity-indicator';
      cell.appendChild(dot);
      cell.title = "Estudo registrado via Pomodoro/Diário";
    }

    if (isCurrentMonth && d === todayDate) {
      cell.classList.add('is-today');
      cell.title = (cell.title ? cell.title + " | " : "") + "Hoje";
    }

    // Clique para alternar marcação
    cell.addEventListener('click', () => {
      toggleFrequencyDay(mesAnoStr, checkedDays, d);
    });

    container.appendChild(cell);
  }

  // Atualiza estatísticas
  const pct = totalDays > 0 ? Math.round((studiedCount / totalDays) * 100) : 0;
  document.getElementById('freq-stat-days').innerText = `${studiedCount} / ${totalDays}`;
  document.getElementById('freq-stat-pct').innerText = `${pct}%`;

  // Calcula sequências (streaks)
  const { currentStreak, maxStreak } = calculateStreaks(year, month, checkedDays);
  document.getElementById('freq-stat-streak').innerText = `🔥 ${currentStreak} ${currentStreak === 1 ? 'dia' : 'dias'}`;
  document.getElementById('freq-stat-max-streak').innerText = `🏆 ${maxStreak} ${maxStreak === 1 ? 'dia' : 'dias'}`;
}

function calculateStreaks(year, month, checkedDays) {
  if (checkedDays.length === 0) {
    return { currentStreak: 0, maxStreak: 0 };
  }

  let maxStreak = 0;
  let tempStreak = 0;
  const totalDays = new Date(year, month + 1, 0).getDate();

  for (let d = 1; d <= totalDays; d++) {
    if (checkedDays.includes(d)) {
      tempStreak++;
      if (tempStreak > maxStreak) {
        maxStreak = tempStreak;
      }
    } else {
      tempStreak = 0;
    }
  }

  // Calcula sequência atual terminando hoje (ou ontem caso hoje ainda não tenha sido marcado)
  let currentStreak = 0;
  const today = new Date();
  if (today.getMonth() === month && today.getFullYear() === year) {
    const todayDay = today.getDate();
    let checkDay = todayDay;
    if (checkedDays.includes(checkDay)) {
      while (checkedDays.includes(checkDay) && checkDay > 0) {
        currentStreak++;
        checkDay--;
      }
    } else if (checkedDays.includes(checkDay - 1)) {
      checkDay = todayDay - 1;
      while (checkedDays.includes(checkDay) && checkDay > 0) {
        currentStreak++;
        checkDay--;
      }
    }
  } else {
    // Se for mês passado, mostra a sequência com que terminou o mês (se o último dia estava marcado)
    currentStreak = checkedDays.includes(totalDays) ? tempStreak : 0;
  }

  return { currentStreak, maxStreak };
}

async function toggleFrequencyDay(mesAnoStr, checkedDays, day) {
  let newCheckedDays;
  if (checkedDays.includes(day)) {
    newCheckedDays = checkedDays.filter(d => d !== day);
  } else {
    newCheckedDays = [...checkedDays, day];
  }

  newCheckedDays.sort((a, b) => a - b);
  const diasMarcadosStr = newCheckedDays.join(',');

  try {
    const res = await fetch('/api/frequency', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        Mes_Ano: mesAnoStr,
        Dias_Marcados: diasMarcadosStr
      })
    });

    if (res.ok) {
      const updatedRow = await res.json();
      const idx = state.frequency.findIndex(f => f.Mes_Ano === mesAnoStr);
      if (idx !== -1) {
        state.frequency[idx] = updatedRow;
      } else {
        state.frequency.push(updatedRow);
      }
      renderFrequencyCalendar();
    }
  } catch (err) {
    console.error('Erro ao atualizar frequência:', err);
  }
}

async function syncFrequencyFromLogs() {
  const monthSelect = document.getElementById('frequency-month-select');
  const yearSelect = document.getElementById('frequency-year-select');
  if (!monthSelect || !yearSelect) return;

  const month = parseInt(monthSelect.value, 10);
  const year = parseInt(yearSelect.value, 10);
  const mesAnoStr = `${year}-${String(month + 1).padStart(2, '0')}`;

  const totalDays = new Date(year, month + 1, 0).getDate();
  const autoCheckedDays = [];

  for (let d = 1; d <= totalDays; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

    const hasDiary = state.diaryLogs.some(log => log.Data === dateStr && log.Tempo_Liquido !== '0 min' && log.Tempo_Liquido !== '0');
    const hasPomodoro = state.pomodoroLogs.some(p => p.Data === dateStr && p.Tipo === 'Estudo' && p.Concluido === 'Sim');

    if (hasDiary || hasPomodoro) {
      autoCheckedDays.push(d);
    }
  }

  if (autoCheckedDays.length === 0) {
    alert('Nenhum registro de estudo (Diário ou Pomodoro) encontrado para este mês.');
    return;
  }

  // Mescla marcações manuais existentes com novos dias auto-detectados
  const monthData = state.frequency.find(f => f.Mes_Ano === mesAnoStr);
  const currentChecked = monthData && monthData.Dias_Marcados
    ? monthData.Dias_Marcados.split(',').map(Number).filter(Boolean)
    : [];

  const mergedChecked = [...new Set([...currentChecked, ...autoCheckedDays])].sort((a, b) => a - b);
  const diasMarcadosStr = mergedChecked.join(',');

  try {
    const res = await fetch('/api/frequency', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        Mes_Ano: mesAnoStr,
        Dias_Marcados: diasMarcadosStr
      })
    });

    if (res.ok) {
      const updatedRow = await res.json();
      const idx = state.frequency.findIndex(f => f.Mes_Ano === mesAnoStr);
      if (idx !== -1) {
        state.frequency[idx] = updatedRow;
      } else {
        state.frequency.push(updatedRow);
      }
      alert(`Sincronização concluída! Importados ${autoCheckedDays.length} dias com estudos registrados.`);
      renderFrequencyCalendar();
    }
  } catch (err) {
    console.error('Erro ao sincronizar frequência com os logs:', err);
  }
}
