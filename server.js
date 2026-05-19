const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Caminhos dos arquivos de dados
const PATH_SCHEDULE = path.join(__dirname, '../01_Planejamento_de_Horarios/planejamento_semanal.csv');
const PATH_POMODORO = path.join(__dirname, '../02_Pomodoro_e_Horas/controle_pomodoro.csv');
const PATH_TASKS_CSV = path.join(__dirname, '../03_Tarefas_de_Estudo/tasks_estudo.csv');
const PATH_KANBAN_MD = path.join(__dirname, '../03_Tarefas_de_Estudo/kanban_simples.md');
const PATH_DIARY_CSV = path.join(__dirname, '../04_Registro_do_Que_Foi_Estudado/diario_de_estudo.csv');
const PATH_HISTORY_MD = path.join(__dirname, '../04_Registro_do_Que_Foi_Estudado/historico_concluido.md');

// ==========================================
// AUTO-INICIALIZAÇÃO PARA DEPLOY EM NUVEM
// ==========================================
const directories = [
  path.dirname(PATH_SCHEDULE),
  path.dirname(PATH_POMODORO),
  path.dirname(PATH_TASKS_CSV),
  path.dirname(PATH_KANBAN_MD),
  path.dirname(PATH_DIARY_CSV),
  path.dirname(PATH_HISTORY_MD)
];

directories.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

if (!fs.existsSync(PATH_SCHEDULE)) {
  const defaultSchedule = `Dia,Horario_Inicio,Horario_Fim,Bloco,Objetivo,Status,Observacoes
Segunda,14:00,16:00,Matemática,Estudo principal,Planejado,
Segunda,18:00,20:00,Português,Questoes ou revisao,Planejado,
Terca,14:00,16:00,Banco de Dados,Estudo principal,Planejado,
Terca,18:00,19:30,Estrutura de Dados e Algoritmos,Estudo principal,Planejado,
Quarta,14:00,16:00,Conhecimentos Bancários,Estudo principal,Planejado,
Quarta,18:00,19:00,Atualidades Mercado Financeiro,Estudo principal,Planejado,
Quinta,14:00,16:00,Probabilidade e Estatística,Estudo principal,Planejado,
Quinta,18:00,19:00,Aprendizagem de Máquina,Estudo principal,Planejado,
Sexta,14:00,15:00,Big Data,Estudo principal,Planejado,
Sexta,16:00,17:00,Ferramentas e Linguagens,Estudo principal,Planejado,
Sabado,9:00,11:00,Redação Discursiva,Simulado ou questoes,Planejado,
Domingo,18:00,18:30,Fechamento,Planejar proxima semana,Planejado
`;
  fs.writeFileSync(PATH_SCHEDULE, defaultSchedule, 'utf8');
}

if (!fs.existsSync(PATH_POMODORO)) {
  fs.writeFileSync(PATH_POMODORO, 'Data,Inicio,Fim,Duracao_Minutos,Tipo,Assunto_ou_Tarefa,Concluido,Distrações,Observacoes\n', 'utf8');
}

if (!fs.existsSync(PATH_TASKS_CSV)) {
  fs.writeFileSync(PATH_TASKS_CSV, 'ID,Data_Criacao,Tarefa,Origem,Prioridade,Estimativa_Pomodoros,Status,Data_Conclusao,Observacoes\n', 'utf8');
}

if (!fs.existsSync(PATH_KANBAN_MD)) {
  fs.writeFileSync(PATH_KANBAN_MD, '# Kanban Simples de Estudo\n\n## A fazer\n- [ ] \n\n## Fazendo hoje\n- [ ] \n\n## Concluido\n- [x] \n\n## Travado / pendente\n- [ ] \n', 'utf8');
}

if (!fs.existsSync(PATH_DIARY_CSV)) {
  fs.writeFileSync(PATH_DIARY_CSV, 'Data,Tempo_Liquido,Quantidade_Pomodoros,O_que_foi_estudado,O_que_foi_concluido,Dificuldade,Proximo_Passo\n', 'utf8');
}

if (!fs.existsSync(PATH_HISTORY_MD)) {
  fs.writeFileSync(PATH_HISTORY_MD, '# Histórico de Estudos Concluídos\n', 'utf8');
}

// ==========================================
// FUNÇÕES AUXILIARES DE PARSE DE CSV
// ==========================================

function parseCSV(content) {
  if (!content || !content.trim()) return [];
  const lines = content.split(/\r?\n/);
  if (lines.length === 0) return [];
  const headers = lines[0].split(',').map(h => h.trim());
  const result = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = [];
    let current = '';
    let inQuotes = false;
    for (let c = 0; c < line.length; c++) {
      const char = line[c];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    
    const row = {};
    headers.forEach((header, index) => {
      let val = values[index] || '';
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.substring(1, val.length - 1);
      }
      row[header] = val;
    });
    result.push(row);
  }
  return result;
}

function toCSV(headers, rows) {
  const headerLine = headers.join(',');
  const dataLines = rows.map(row => {
    return headers.map(header => {
      let val = String(row[header] === undefined || row[header] === null ? '' : row[header]);
      if (val.includes(',') || val.includes('\n') || val.includes('\r') || val.includes('"')) {
        val = `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    }).join(',');
  });
  return [headerLine, ...dataLines].join('\n') + '\n';
}

// ==========================================
// SINCRONIZADORES DE MARKDOWN
// ==========================================

function syncKanbanMarkdown(tasks) {
  let content = '# Kanban Simples de Estudo\n\n';
  
  const categories = {
    'A fazer': [],
    'Fazendo hoje': [],
    'Concluido': [],
    'Travado / pendente': []
  };
  
  tasks.forEach(task => {
    const status = task.Status || 'A fazer';
    let cat = 'A fazer';
    if (status.toLowerCase().includes('hoje') || status.toLowerCase() === 'fazendo') {
      cat = 'Fazendo hoje';
    } else if (status.toLowerCase().includes('concluid') || status.toLowerCase() === 'concluido' || status.toLowerCase() === 'done') {
      cat = 'Concluido';
    } else if (status.toLowerCase().includes('travad') || status.toLowerCase().includes('pendent')) {
      cat = 'Travado / pendente';
    }
    
    if (categories[cat]) {
      categories[cat].push(task.Tarefa);
    } else {
      categories['A fazer'].push(task.Tarefa);
    }
  });
  
  // Section A Fazer
  content += '## A fazer\n\n';
  if (categories['A fazer'].length > 0) {
    categories['A fazer'].forEach(t => {
      if (t) content += `- [ ] ${t}\n`;
    });
  } else {
    content += '- [ ] \n';
  }
  content += '\n';
  
  // Section Fazendo hoje
  content += '## Fazendo hoje\n\n';
  if (categories['Fazendo hoje'].length > 0) {
    categories['Fazendo hoje'].forEach(t => {
      if (t) content += `- [ ] ${t}\n`;
    });
  } else {
    content += '- [ ] \n';
  }
  content += '\n';
  
  // Section Concluido
  content += '## Concluido\n\n';
  if (categories['Concluido'].length > 0) {
    categories['Concluido'].forEach(t => {
      if (t) content += `- [x] ${t}\n`;
    });
  } else {
    content += '- [x] \n';
  }
  content += '\n';
  
  // Section Travado / pendente
  content += '## Travado / pendente\n\n';
  if (categories['Travado / pendente'].length > 0) {
    categories['Travado / pendente'].forEach(t => {
      if (t) content += `- [ ] ${t}\n`;
    });
  } else {
    content += '- [ ] \n';
  }
  
  try {
    fs.writeFileSync(PATH_KANBAN_MD, content, 'utf8');
  } catch (err) {
    console.error('Erro ao escrever kanban_simples.md:', err);
  }
}

function appendToHistoryMarkdown(taskName, durationMinutes, observations = '') {
  try {
    if (!fs.existsSync(PATH_HISTORY_MD)) return;
    let content = fs.readFileSync(PATH_HISTORY_MD, 'utf8');
    
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const monthIndex = now.getMonth();
    const year = now.getFullYear();
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    const monthName = months[monthIndex];
    const headerTitle = `## ${monthName} ${year}`;
    const dateStr = `${day}/${String(monthIndex + 1).padStart(2, '0')}/${year}`;
    
    const entry = `- [x] ${dateStr} | Feito: ${taskName} | Tempo: ${durationMinutes} min | ${observations || 'Sem observações'}`;
    
    if (content.includes(headerTitle)) {
      // Encontra a posição logo após o cabeçalho e adiciona a nova linha ali
      const index = content.indexOf(headerTitle) + headerTitle.length;
      content = content.slice(0, index) + '\n\n' + entry + content.slice(index);
    } else {
      // Se a seção do mês não existir, cria no final do arquivo
      content += `\n\n${headerTitle}\n\n${entry}\n`;
    }
    
    fs.writeFileSync(PATH_HISTORY_MD, content, 'utf8');
  } catch (err) {
    console.error('Erro ao salvar no histórico concluído MD:', err);
  }
}

// ==========================================
// ENDPOINTS DA API
// ==========================================

// --- Cronograma Semanal ---
app.get('/api/schedule', (req, res) => {
  try {
    if (!fs.existsSync(PATH_SCHEDULE)) {
      return res.status(404).json({ error: 'Arquivo de cronograma não encontrado.' });
    }
    const data = fs.readFileSync(PATH_SCHEDULE, 'utf8');
    const parsed = parseCSV(data);
    res.json(parsed);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao carregar cronograma: ' + error.message });
  }
});

// --- Pomodoros ---
app.get('/api/pomodoros', (req, res) => {
  try {
    if (!fs.existsSync(PATH_POMODORO)) {
      return res.status(404).json({ error: 'Arquivo de Pomodoro não encontrado.' });
    }
    const data = fs.readFileSync(PATH_POMODORO, 'utf8');
    const parsed = parseCSV(data);
    res.json(parsed);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao carregar Pomodoros: ' + error.message });
  }
});

app.post('/api/pomodoros', (req, res) => {
  try {
    const { Inicio, Fim, Duracao_Minutos, Tipo, Assunto_ou_Tarefa, Concluido, Distracoes, Observacoes } = req.body;
    
    // Obtém data de hoje local do servidor formatada YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];
    
    let rows = [];
    if (fs.existsSync(PATH_POMODORO)) {
      const data = fs.readFileSync(PATH_POMODORO, 'utf8');
      rows = parseCSV(data);
    }
    
    const newRow = {
      Data: today,
      Inicio: Inicio || '',
      Fim: Fim || '',
      Duracao_Minutos: Duracao_Minutos || '25',
      Tipo: Tipo || 'Estudo',
      Assunto_ou_Tarefa: Assunto_ou_Tarefa || '',
      Concluido: Concluido || 'Sim',
      'Distrações': Distracoes || '0',
      Observacoes: Observacoes || ''
    };
    
    rows.push(newRow);
    
    const headers = ['Data', 'Inicio', 'Fim', 'Duracao_Minutos', 'Tipo', 'Assunto_ou_Tarefa', 'Concluido', 'Distrações', 'Observacoes'];
    fs.writeFileSync(PATH_POMODORO, toCSV(headers, rows), 'utf8');
    
    // Atualiza automaticamente as estatísticas do dia no diário se o tipo for "Estudo"
    if (Tipo === 'Estudo') {
      updateDailyProgressMetrics(today);
    }
    
    res.status(201).json(newRow);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao salvar Pomodoro: ' + error.message });
  }
});

// --- Gerenciador de Tarefas (CRUD) ---
app.get('/api/tasks', (req, res) => {
  try {
    if (!fs.existsSync(PATH_TASKS_CSV)) {
      return res.status(404).json({ error: 'Arquivo de tarefas não encontrado.' });
    }
    const data = fs.readFileSync(PATH_TASKS_CSV, 'utf8');
    const parsed = parseCSV(data);
    res.json(parsed);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao carregar tarefas: ' + error.message });
  }
});

app.post('/api/tasks', (req, res) => {
  try {
    const { Tarefa, Origem, Prioridade, Estimativa_Pomodoros, Status, Observacoes } = req.body;
    
    let rows = [];
    if (fs.existsSync(PATH_TASKS_CSV)) {
      const data = fs.readFileSync(PATH_TASKS_CSV, 'utf8');
      rows = parseCSV(data);
    }
    
    // Auto-incremental ID
    let maxId = 0;
    rows.forEach(r => {
      const id = parseInt(r.ID, 10);
      if (id > maxId) maxId = id;
    });
    const nextId = maxId + 1;
    
    const today = new Date().toISOString().split('T')[0];
    
    const newTask = {
      ID: String(nextId),
      Data_Criacao: today,
      Tarefa: Tarefa || '',
      Origem: Origem || 'Site externo',
      Prioridade: Prioridade || 'Media',
      Estimativa_Pomodoros: Estimativa_Pomodoros || '1',
      Status: Status || 'A fazer',
      Data_Conclusao: '',
      Observacoes: Observacoes || ''
    };
    
    rows.push(newTask);
    
    const headers = ['ID', 'Data_Criacao', 'Tarefa', 'Origem', 'Prioridade', 'Estimativa_Pomodoros', 'Status', 'Data_Conclusao', 'Observacoes'];
    fs.writeFileSync(PATH_TASKS_CSV, toCSV(headers, rows), 'utf8');
    
    // Sincroniza com Markdown
    syncKanbanMarkdown(rows);
    
    res.status(201).json(newTask);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar tarefa: ' + error.message });
  }
});

app.put('/api/tasks/:id', (req, res) => {
  try {
    const taskId = req.params.id;
    const updates = req.body;
    
    if (!fs.existsSync(PATH_TASKS_CSV)) {
      return res.status(404).json({ error: 'Arquivo de tarefas não encontrado.' });
    }
    
    const data = fs.readFileSync(PATH_TASKS_CSV, 'utf8');
    const rows = parseCSV(data);
    
    const index = rows.findIndex(r => r.ID === taskId);
    if (index === -1) {
      return res.status(404).json({ error: 'Tarefa não encontrada.' });
    }
    
    const wasCompletedBefore = rows[index].Status === 'Concluido';
    const isCompletedNow = updates.Status === 'Concluido';
    
    // Se mudou para Concluido agora, seta Data_Conclusao
    if (!wasCompletedBefore && isCompletedNow) {
      updates.Data_Conclusao = new Date().toISOString().split('T')[0];
      
      // Adiciona ao historico_concluido.md automaticamente
      const durationEstimate = parseInt(rows[index].Estimativa_Pomodoros || 1, 10) * 25;
      appendToHistoryMarkdown(rows[index].Tarefa, durationEstimate, updates.Observacoes || rows[index].Observacoes);
    } else if (wasCompletedBefore && !isCompletedNow) {
      // Se saiu de Concluido, remove a data de conclusao
      updates.Data_Conclusao = '';
    }
    
    rows[index] = {
      ...rows[index],
      ...updates
    };
    
    const headers = ['ID', 'Data_Criacao', 'Tarefa', 'Origem', 'Prioridade', 'Estimativa_Pomodoros', 'Status', 'Data_Conclusao', 'Observacoes'];
    fs.writeFileSync(PATH_TASKS_CSV, toCSV(headers, rows), 'utf8');
    
    // Sincroniza com Markdown
    syncKanbanMarkdown(rows);
    
    res.json(rows[index]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar tarefa: ' + error.message });
  }
});

app.delete('/api/tasks/:id', (req, res) => {
  try {
    const taskId = req.params.id;
    if (!fs.existsSync(PATH_TASKS_CSV)) {
      return res.status(404).json({ error: 'Arquivo de tarefas não encontrado.' });
    }
    
    const data = fs.readFileSync(PATH_TASKS_CSV, 'utf8');
    let rows = parseCSV(data);
    
    const filteredRows = rows.filter(r => r.ID !== taskId);
    
    if (rows.length === filteredRows.length) {
      return res.status(404).json({ error: 'Tarefa não encontrada.' });
    }
    
    const headers = ['ID', 'Data_Criacao', 'Tarefa', 'Origem', 'Prioridade', 'Estimativa_Pomodoros', 'Status', 'Data_Conclusao', 'Observacoes'];
    fs.writeFileSync(PATH_TASKS_CSV, toCSV(headers, filteredRows), 'utf8');
    
    // Sincroniza com Markdown
    syncKanbanMarkdown(filteredRows);
    
    res.json({ message: 'Tarefa excluída com sucesso.' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir tarefa: ' + error.message });
  }
});

// --- Diário de Estudos ---
app.get('/api/diary', (req, res) => {
  try {
    if (!fs.existsSync(PATH_DIARY_CSV)) {
      return res.status(404).json({ error: 'Arquivo de diário não encontrado.' });
    }
    const data = fs.readFileSync(PATH_DIARY_CSV, 'utf8');
    const parsed = parseCSV(data);
    res.json(parsed);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao carregar diário: ' + error.message });
  }
});

// Preencher/Atualizar Diário Manualmente (com observações, dificuldade, etc.)
app.post('/api/diary', (req, res) => {
  try {
    const { Data, Tempo_Liquido, Quantidade_Pomodoros, O_que_foi_estudado, O_que_foi_concluido, Dificuldade, Proximo_Passo } = req.body;
    const targetDate = Data || new Date().toISOString().split('T')[0];
    
    let rows = [];
    if (fs.existsSync(PATH_DIARY_CSV)) {
      const data = fs.readFileSync(PATH_DIARY_CSV, 'utf8');
      rows = parseCSV(data);
    }
    
    const index = rows.findIndex(r => r.Data === targetDate);
    
    const diaryRow = {
      Data: targetDate,
      Tempo_Liquido: Tempo_Liquido || '0 min',
      Quantidade_Pomodoros: Quantidade_Pomodoros || '0',
      O_que_foi_estudado: O_que_foi_estudado || '',
      O_que_foi_concluido: O_que_foi_concluido || '',
      Dificuldade: Dificuldade || 'Média',
      Proximo_Passo: Proximo_Passo || ''
    };
    
    if (index !== -1) {
      rows[index] = { ...rows[index], ...diaryRow };
    } else {
      rows.push(diaryRow);
    }
    
    const headers = ['Data', 'Tempo_Liquido', 'Quantidade_Pomodoros', 'O_que_foi_estudado', 'O_que_foi_concluido', 'Dificuldade', 'Proximo_Passo'];
    fs.writeFileSync(PATH_DIARY_CSV, toCSV(headers, rows), 'utf8');
    
    res.json(diaryRow);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar diário: ' + error.message });
  }
});

// --- API de Analytics/Estatísticas gerais ---
app.get('/api/analytics', (req, res) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Carrega Pomodoros
    let pomodoros = [];
    if (fs.existsSync(PATH_POMODORO)) {
      pomodoros = parseCSV(fs.readFileSync(PATH_POMODORO, 'utf8'));
    }
    
    // Carrega Tarefas
    let tasks = [];
    if (fs.existsSync(PATH_TASKS_CSV)) {
      tasks = parseCSV(fs.readFileSync(PATH_TASKS_CSV, 'utf8'));
    }
    
    // Calcula métricas de hoje
    const pomodorosHoje = pomodoros.filter(p => p.Data === todayStr && p.Tipo === 'Estudo');
    const tempoLiquidoHoje = pomodorosHoje.reduce((sum, p) => sum + parseInt(p.Duracao_Minutos || 25, 10), 0);
    const distracoesHoje = pomodorosHoje.reduce((sum, p) => sum + parseInt(p['Distrações'] || 0, 10), 0);
    
    // Calcula métricas desta semana (últimos 7 dias)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const pomodorosSemana = pomodoros.filter(p => {
      const pDate = new Date(p.Data);
      return pDate >= sevenDaysAgo && p.Tipo === 'Estudo';
    });
    const tempoLiquidoSemana = pomodorosSemana.reduce((sum, p) => sum + parseInt(p.Duracao_Minutos || 25, 10), 0);
    
    // Estatísticas de tarefas
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.Status === 'Concluido').length;
    const pendingTasks = tasks.filter(t => t.Status === 'A fazer').length;
    const activeTasks = tasks.filter(t => t.Status === 'Fazendo hoje' || t.Status === 'Fazendo').length;
    const blockedTasks = tasks.filter(t => t.Status.includes('Travado') || t.Status.includes('pendent')).length;
    
    // Distribuição de prioridades das pendentes
    const priorities = { Alta: 0, Media: 0, Baixa: 0 };
    tasks.forEach(t => {
      if (t.Status !== 'Concluido' && priorities[t.Prioridade] !== undefined) {
        priorities[t.Prioridade]++;
      }
    });
    
    res.json({
      today: {
        pomodoros: pomodorosHoje.length,
        minutes: tempoLiquidoHoje,
        distractions: distracoesHoje
      },
      week: {
        pomodoros: pomodorosSemana.length,
        minutes: tempoLiquidoSemana
      },
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        pending: pendingTasks,
        active: activeTasks,
        blocked: blockedTasks,
        priorities
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao gerar estatísticas: ' + error.message });
  }
});

// --- Função interna para auto-atualizar métricas numéricas no diário ao fazer Pomodoro ---
function updateDailyProgressMetrics(todayStr) {
  try {
    if (!fs.existsSync(PATH_POMODORO) || !fs.existsSync(PATH_DIARY_CSV)) return;
    
    const pomodoros = parseCSV(fs.readFileSync(PATH_POMODORO, 'utf8'));
    const diaryRows = parseCSV(fs.readFileSync(PATH_DIARY_CSV, 'utf8'));
    
    const todayStudyPomodoros = pomodoros.filter(p => p.Data === todayStr && p.Tipo === 'Estudo');
    const totalMinutes = todayStudyPomodoros.reduce((sum, p) => sum + parseInt(p.Duracao_Minutos || 25, 10), 0);
    const count = todayStudyPomodoros.length;
    
    // Lista os assuntos estudados hoje
    const subjects = [...new Set(todayStudyPomodoros.map(p => p.Assunto_ou_Tarefa).filter(Boolean))].join('; ');
    
    const index = diaryRows.findIndex(r => r.Data === todayStr);
    
    const updatedRow = {
      Data: todayStr,
      Tempo_Liquido: `${totalMinutes} min`,
      Quantidade_Pomodoros: String(count),
      O_que_foi_estudado: index !== -1 && diaryRows[index].O_que_foi_estudado 
        ? [...new Set([...diaryRows[index].O_que_foi_estudado.split('; '), ...subjects.split('; ')])].filter(Boolean).join('; ')
        : subjects,
      O_que_foi_concluido: index !== -1 ? diaryRows[index].O_que_foi_concluido : '',
      Dificuldade: index !== -1 ? diaryRows[index].Dificuldade : 'Média',
      Proximo_Passo: index !== -1 ? diaryRows[index].Proximo_Passo : ''
    };
    
    if (index !== -1) {
      diaryRows[index] = updatedRow;
    } else {
      diaryRows.push(updatedRow);
    }
    
    const headers = ['Data', 'Tempo_Liquido', 'Quantidade_Pomodoros', 'O_que_foi_estudado', 'O_que_foi_concluido', 'Dificuldade', 'Proximo_Passo'];
    fs.writeFileSync(PATH_DIARY_CSV, toCSV(headers, diaryRows), 'utf8');
  } catch (err) {
    console.error('Erro ao atualizar métricas diárias:', err);
  }
}

// Inicializa a aplicação
app.listen(PORT, () => {
  console.log(`=============================================================`);
  console.log(`  PAINEL DE ESTUDOS INTERATIVO INICIADO COM SUCESSO!`);
  console.log(`  Acesse em seu navegador: http://localhost:${PORT}`);
  console.log(`=============================================================`);
});
