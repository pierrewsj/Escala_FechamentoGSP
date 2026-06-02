const $ = (id) => document.getElementById(id);
const SENHA_ADMIN = '4321';
const STORAGE_KEY = 'escalaEquipe9132DadosV7';
const STORAGE_KEYS_ANTERIORES = ['escalaEquipe9132DadosV6', 'escalaEquipe9132DadosV5', 'escalaEquipe9132DadosV4'];
const CARGAS_STORAGE_KEY = 'escalaEquipe9132FechamentoCargasV1';

function normalizarCodigoPosto(valor) {
  if (typeof valor !== 'string') return valor;
  const v = valor.trim();
  const mapa = {
    'CANETA': 'Pens.',
    'CANETAS': 'Pens.',
    'CANETAS.': 'Pens.',
    'Caneta': 'Pens.',
    'Canetas': 'Pens.',
    'Canetas.': 'Pens.',
    'PENS.': 'Pens.',
    'PENS': 'Pens.',
    'Pens': 'Pens.',
    'Pens.': 'Pens.',
    'PENSILVÂNIA': 'Pens.',
    'Pensilvânia': 'Pens.',
    'PENSILINA': 'Pens.',
    'Pensilina': 'Pens.',
    'PENSÃO': 'Pens.',
    'Pensão': 'Pens.',
    'FOLGA': 'Pens.',
    'Folga': 'Pens.',
    'G89 INTERNO': 'INT-89',
    'G 89 INTERNO': 'INT-89',
    'G89 Interno': 'INT-89',
    'G 89 Interno': 'INT-89',
    'G89 interno': 'INT-89',
    'G 89 interno': 'INT-89',
    'INT89': 'INT-89',
    'INT 89': 'INT-89',
    'Interne': 'INT-89',
    'Interni': 'INT-89'
  };
  return mapa[v] || valor;
}

function corrigirTextoEscala(valor) {
  if (typeof valor !== 'string') return valor;
  const v = valor.trim();
  const mapa = {
    'Pensilvânia': 'Pensilina',
    'PENSILVÂNIA': 'Pensilina',
    'Pensão / folga conforme escala': 'Pensilina',
    'PENSÃO / FOLGA CONFORME ESCALA': 'Pensilina',
    'Caneta': 'Pens.',
    'Canetas': 'Pens.',
    'Canetas.': 'Pens.',
    'CANETAS': 'Pens.',
    'CANETAS.': 'Pens.',
    'G89 interno': 'Interni',
    'G89 Interno': 'Interni',
    'G 89 interno': 'Interni',
    'G 89 Interno': 'Interni',
    'G89 INTERNO': 'Interni',
    'G 89 INTERNO': 'Interni',
    'Interne': 'Interni',
    'Interni': 'Interni'
  };
  return mapa[v] || valor;
}

function corrigirDadosAntigos() {
  const legendaCorrigida = {};

  Object.keys(LEGENDA).forEach(codigoOriginal => {
    const codigo = normalizarCodigoPosto(codigoOriginal);
    const info = LEGENDA[codigoOriginal];

    if (typeof info === 'string') {
      legendaCorrigida[codigo] = corrigirTextoEscala(info);
    } else if (info) {
      legendaCorrigida[codigo] = {
        local: corrigirTextoEscala(info.local),
        setor: corrigirTextoEscala(info.setor)
      };
    }
  });

  Object.keys(LEGENDA).forEach(k => delete LEGENDA[k]);
  Object.assign(LEGENDA, legendaCorrigida);

  Object.assign(LEGENDA, {
    '74': { local: 'Pensilina', setor: 'Pensilina' },
    '75': { local: 'Pensilina', setor: 'Pensilina' },
    '76': { local: 'Pensilina', setor: 'Pensilina' },
    '77': { local: 'Pensilina', setor: 'Pensilina' },
    'Pens.': { local: 'Pensilina', setor: 'Pensilina' },
    'INT-89': { local: 'Interni', setor: 'Interni' }
  });

  ESCALA.forEach(p => {
    if (Array.isArray(p.dias)) {
      p.dias = p.dias.map(normalizarCodigoPosto);
    }
  });
}

function clonar(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function textoSlug(valor) {
  return String(valor || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function garantirIdsColaboradores() {
  const usados = new Set();
  ESCALA.forEach((pessoa, indice) => {
    let base = pessoa.id || `${textoSlug(pessoa.nome)}-${textoSlug(pessoa.turno || 'turno')}` || `colaborador-${indice + 1}`;
    let id = base;
    let contador = 2;
    while (usados.has(id)) {
      id = `${base}-${contador}`;
      contador += 1;
    }
    pessoa.id = id;
    usados.add(id);
  });
}

function colaboradorPorId(id) {
  return ESCALA.find(pessoa => pessoa.id === id);
}

function ordenarEscala() {
  ESCALA.sort((a,b) => ((a.turno || '') + (a.nome || '')).localeCompare((b.turno || '') + (b.nome || ''), 'pt-BR'));
}

function turnosDisponiveis() {
  return CONFIG.turnos || ['1º Turno', '2º Turno', '3º Turno'];
}

function normalizarEscala() {
  ESCALA.forEach(p => {
    if (!p.turno) p.turno = CONFIG.turno || '1º Turno';
    if (!Array.isArray(p.dias)) p.dias = Array(31).fill('Pens.');
    while (p.dias.length < 31) p.dias.push('Pens.');
    p.dias = p.dias.slice(0, 31);
  });
  garantirIdsColaboradores();
  ordenarEscala();
}

function carregarDadosSalvos() {
  let salvo = localStorage.getItem(STORAGE_KEY);
  if (!salvo) {
    const chaveAntiga = STORAGE_KEYS_ANTERIORES.find(chave => localStorage.getItem(chave));
    if (chaveAntiga) salvo = localStorage.getItem(chaveAntiga);
  }

  if (!salvo) {
    corrigirDadosAntigos();
    normalizarEscala();
    salvarDadosLocais();
    return;
  }

  try {
    const dados = JSON.parse(salvo);
    if (dados.legenda && dados.escala) {
      Object.keys(LEGENDA).forEach(k => delete LEGENDA[k]);
      Object.assign(LEGENDA, dados.legenda);
      ESCALA.splice(0, ESCALA.length, ...dados.escala);
    }
  } catch (erro) {
    console.warn('Não foi possível carregar dados salvos.', erro);
  }

  corrigirDadosAntigos();
  normalizarEscala();
  salvarDadosLocais();
}

function salvarDadosLocais() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    legenda: LEGENDA,
    escala: ESCALA,
    atualizadoEm: new Date().toISOString()
  }));
  mostrarUltimaAtualizacao();
}

function dadosSalvos() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
}

function formatarDataHora(valor) {
  if (!valor) return '';
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return '';
  return data.toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function mostrarUltimaAtualizacao() {
  const el = $('ultimaAtualizacao');
  if (!el) return;
  const atualizado = dadosSalvos().atualizadoEm;
  el.textContent = atualizado ? `Última atualização: ${formatarDataHora(atualizado)}` : '';
}

function diaAtualDoMes() {
  return new Date().getDate();
}

function diasDisponiveis() {
  return Array.from({ length: 31 }, (_, i) => i + 1);
}

function pessoasPorTurno(turno = 'todos') {
  if (turno === 'todos') return ESCALA;
  return ESCALA.filter(p => p.turno === turno);
}

function postosDisponiveis(pessoas = ESCALA) {
  return [...new Set([
    ...Object.keys(LEGENDA),
    ...pessoas.flatMap(p => p.dias)
  ])].filter(Boolean).sort((a,b) => a.localeCompare(b, 'pt-BR', { numeric: true }));
}

function postoDescricao(posto) {
  const info = LEGENDA[posto];
  if (!posto) return 'Sem posto definido';
  if (!info) return 'Sem descrição cadastrada';
  if (typeof info === 'string') return info;
  if (info.local && info.setor && info.local.toLowerCase() === info.setor.toLowerCase()) return info.local;
  if (info.local && info.setor) return `${info.local} • ${info.setor}`;
  return info.local || info.setor || 'Sem descrição cadastrada';
}

function postoLegendaCompleta(posto) {
  const info = LEGENDA[posto];
  if (!info) return `${posto} - Sem descrição cadastrada`;
  if (typeof info === 'string') return `${posto} - ${info}`;
  if (info.local && info.setor && info.local.toLowerCase() === info.setor.toLowerCase()) return `${posto} - ${info.local}`;
  return `${posto} - ${info.local || ''} - ${info.setor || ''}`.replace(/ - $/, '');
}


function configurarBotoesAbas() {
  document.querySelectorAll('.aba[data-aba]').forEach(botao => {
    botao.addEventListener('click', () => abrirAba(botao.dataset.aba, botao));
  });
}

function iniciar() {
  carregarDadosSalvos();
  configurarBotoesAbas();
  preencherSelects();
  montarLegenda();
  prepararModuloCargas();
  mostrarUltimaAtualizacao();
  if ($('tituloHoje')) $('tituloHoje').textContent = CONFIG.titulo;
  if ($('infoHoje')) $('infoHoje').textContent = 'Use a consulta abaixo para visualizar.';
  registrarServiceWorker();
}

function preencherSelects() {
  $('selectTurnoConsulta').innerHTML = [
    '<option value="todos">Todos os turnos</option>',
    ...turnosDisponiveis().map(t => `<option value="${t}">${t}</option>`)
  ].join('');
  $('selectTurnoConsulta').value = CONFIG.turno || '1º Turno';
  atualizarValorConsulta();
  preencherSelectsAdmin();
}

function atualizarValorConsulta() {
  const tipo = $('tipoConsulta')?.value || 'nome';
  const turno = $('selectTurnoConsulta')?.value || 'todos';
  const pessoas = pessoasPorTurno(turno);

  if (tipo === 'nome') {
    $('valorConsulta').innerHTML = pessoas
      .slice()
      .sort((a,b) => a.nome.localeCompare(b.nome, 'pt-BR'))
      .map(p => `<option value="${p.nome}">${p.nome} • ${p.turno}</option>`)
      .join('') || '<option value="">Nenhum colaborador neste turno</option>';
    return;
  }

  if (tipo === 'dia') {
    $('valorConsulta').innerHTML = diasDisponiveis()
      .map(d => `<option value="${d}">Dia ${String(d).padStart(2, '0')}</option>`)
      .join('');
    return;
  }

  const postos = postosDisponiveis(pessoas);
  $('valorConsulta').innerHTML = postos
    .map(p => `<option value="${p}">${p} - ${postoDescricao(p)}</option>`)
    .join('') || '<option value="">Nenhum posto encontrado</option>';
}

function preencherSelectsAdmin() {
  if (!$('adminColaborador')) return;

  garantirIdsColaboradores();
  ordenarEscala();

  const opcoesTurnos = turnosDisponiveis().map(t => `<option value="${t}">${t}</option>`).join('');
  $('novoTurno').innerHTML = opcoesTurnos;

  const opcoesColaboradores = ESCALA
    .map(p => `<option value="${p.id}">${p.nome} • ${p.turno}</option>`)
    .join('');

  $('adminColaborador').innerHTML = opcoesColaboradores;
  if ($('excluirColaborador')) $('excluirColaborador').innerHTML = opcoesColaboradores || '<option value="">Nenhum colaborador</option>';
  if ($('substituirOrigem')) $('substituirOrigem').innerHTML = opcoesColaboradores || '<option value="">Nenhum colaborador</option>';
  if ($('substituirDestino')) $('substituirDestino').innerHTML = opcoesColaboradores || '<option value="">Nenhum colaborador</option>';
  if ($('substituirDia')) $('substituirDia').innerHTML = diasDisponiveis()
    .map(d => `<option value="${d}">Dia ${String(d).padStart(2, '0')}</option>`)
    .join('');

  $('adminColaborador').onchange = carregarEscalaMensal;
  montarGradeDiasAdmin();
  carregarEscalaMensal();
}

function montarGradeDiasAdmin() {
  if (!$('gradeDiasAdmin')) return;
  const postos = postosDisponiveis();
  const opcoes = ['<option value="">Sem posto</option>', ...postos.map(p => `<option value="${p}">${p}</option>`)].join('');
  $('gradeDiasAdmin').innerHTML = diasDisponiveis().map(d => `
    <div class="dia-admin">
      <label for="diaAdmin_${d}">${String(d).padStart(2, '0')}</label>
      <select id="diaAdmin_${d}">${opcoes}</select>
    </div>
  `).join('');
}

function card({ titulo, badge, descricao, hoje = false, subtitulo = '' }) {
  return `
    <article class="item ${hoje ? 'hoje' : ''}">
      <div class="item-topo">
        <h3>${titulo}</h3>
        <span class="badge">${badge}</span>
      </div>
      ${subtitulo ? `<p class="mini-info">${subtitulo}</p>` : ''}
      <p class="descricao">${descricao}</p>
    </article>
  `;
}

function consultarUnico() {
  const tipo = $('tipoConsulta').value;
  const valor = $('valorConsulta').value;
  if (!valor) {
    $('resultadoConteudo').innerHTML = '<div class="resultado-vazio">Nenhum item disponível para consultar.</div>';
    abrirResultado();
    return;
  }

  if (tipo === 'nome') return buscarPorNome(valor);
  if (tipo === 'dia') return buscarPorDia(Number(valor));
  return buscarPorPosto(valor);
}

function buscarPorNome(nomeInformado) {
  abrirResultado();
  const nome = nomeInformado || $('valorConsulta').value;
  const turnoFiltro = $('selectTurnoConsulta')?.value || 'todos';
  const pessoa = pessoasPorTurno(turnoFiltro).find(p => p.nome === nome) || ESCALA.find(p => p.nome === nome);
  if (!pessoa) return;

  const hoje = diaAtualDoMes();
  $('resultadoConteudo').innerHTML = `
    <div class="lista-cards">
      <div class="card"><h2>${pessoa.nome}</h2><p class="muted">${pessoa.turno}</p></div>
      ${pessoa.dias.map((posto, i) => {
        const dia = i + 1;
        return card({
          titulo: `Dia ${String(dia).padStart(2, '0')}`,
          badge: posto,
          descricao: postoDescricao(posto),
          hoje: dia === hoje
        });
      }).join('')}
    </div>
  `;
}

function buscarPorDia(diaInformado) {
  abrirResultado();
  const dia = Number(diaInformado || $('valorConsulta').value);
  const turnoFiltro = $('selectTurnoConsulta')?.value || 'todos';
  const pessoas = pessoasPorTurno(turnoFiltro);
  const hoje = diaAtualDoMes();
  const tituloTurno = turnoFiltro === 'todos' ? 'Todos os turnos' : turnoFiltro;

  $('resultadoConteudo').innerHTML = `
    <div class="lista-cards">
      <div class="card"><h2>Escala do dia ${String(dia).padStart(2, '0')}</h2><p class="muted">${tituloTurno}</p></div>
      ${pessoas.length ? pessoas.map(pessoa => {
        const posto = pessoa.dias[dia - 1] || '-';
        return card({
          titulo: pessoa.nome,
          badge: posto,
          descricao: postoDescricao(posto),
          subtitulo: pessoa.turno,
          hoje: dia === hoje
        });
      }).join('') : '<div class="resultado-vazio">Nenhum colaborador neste turno.</div>'}
    </div>
  `;
}

function buscarPorPosto(postoInformado) {
  abrirResultado();
  const postoBusca = postoInformado || $('valorConsulta').value;
  const turnoFiltro = $('selectTurnoConsulta')?.value || 'todos';
  const pessoas = pessoasPorTurno(turnoFiltro);
  const hoje = diaAtualDoMes();
  const itens = [];

  pessoas.forEach(pessoa => {
    pessoa.dias.forEach((posto, i) => {
      const dia = i + 1;
      if (posto === postoBusca) {
        itens.push(card({
          titulo: pessoa.nome,
          badge: `Dia ${String(dia).padStart(2, '0')}`,
          descricao: `${postoBusca} • ${postoDescricao(postoBusca)}`,
          subtitulo: pessoa.turno,
          hoje: dia === hoje
        }));
      }
    });
  });

  $('resultadoConteudo').innerHTML = `
    <div class="lista-cards">
      <div class="card"><h2>Local / posto ${postoBusca}</h2><p class="muted">${postoDescricao(postoBusca)}</p></div>
      ${itens.length ? itens.join('') : '<div class="resultado-vazio">Nenhum resultado encontrado.</div>'}
    </div>
  `;
}

function mostrarHoje() {
  const dia = Math.min(diaAtualDoMes(), 31);
  $('tipoConsulta').value = 'dia';
  atualizarValorConsulta();
  $('valorConsulta').value = String(dia);
  buscarPorDia(dia);
}

function montarLegenda() {
  $('legendaConteudo').innerHTML = Object.keys(LEGENDA)
    .sort((a,b) => a.localeCompare(b, 'pt-BR', { numeric: true }))
    .map((codigo) => card({ titulo: codigo, badge: 'Posto', descricao: postoLegendaCompleta(codigo) }))
    .join('');
}

function abrirAba(id, botao) {
  const painel = $(id);
  if (!painel) {
    console.warn('Painel não encontrado:', id);
    return;
  }

  document.querySelectorAll('.painel').forEach(p => p.classList.remove('ativo'));
  document.querySelectorAll('.aba').forEach(a => a.classList.remove('ativa'));

  painel.classList.add('ativo');

  const botaoAba = botao || document.querySelector(`.aba[data-aba="${id}"]`);
  if (botaoAba) botaoAba.classList.add('ativa');

  if (id === 'relatorioCargas') atualizarRelatorioCargas();
}

function abrirResultado() {
  document.querySelectorAll('.painel').forEach(p => p.classList.remove('ativo'));
  document.querySelectorAll('.aba').forEach(a => a.classList.remove('ativa'));
  $('resultado').classList.add('ativo');
  document.querySelector('.aba').classList.add('ativa');
}

function msgAdmin(texto, tipo = 'ok') {
  const el = $('msgAdmin');
  if (!el) return;
  el.textContent = texto;
  el.className = `msg ${tipo}`;
  setTimeout(() => { el.textContent = ''; }, 4500);
}

function entrarAdmin() {
  const senha = $('senhaAdmin').value.trim();
  if (senha !== SENHA_ADMIN) {
    $('msgAdminLogin').textContent = 'Senha incorreta.';
    $('msgAdminLogin').className = 'msg erro';
    return;
  }

  $('adminLogin').hidden = true;
  $('areaAdmin').hidden = false;
  $('senhaAdmin').value = '';
  $('msgAdminLogin').textContent = '';
  preencherSelectsAdmin();
}

function sairAdmin() {
  $('areaAdmin').hidden = true;
  $('adminLogin').hidden = false;
}

function atualizarAppAposEdicao() {
  salvarDadosLocais();
  preencherSelects();
  montarLegenda();
}

function salvarColaborador() {
  const nome = $('novoNome').value.trim().toUpperCase();
  const turno = $('novoTurno').value || '1º Turno';

  if (!nome) {
    msgAdmin('Informe o nome do colaborador.', 'erro');
    return;
  }

  if (ESCALA.some(p => p.nome === nome && p.turno === turno)) {
    msgAdmin('Esse colaborador já existe neste turno.', 'erro');
    return;
  }

  ESCALA.push({ nome, turno, dias: Array(31).fill('') });
  garantirIdsColaboradores();
  ordenarEscala();
  $('novoNome').value = '';
  atualizarAppAposEdicao();
  msgAdmin(`Colaborador ${nome} adicionado em ${turno}.`);
}

function excluirColaborador() {
  const campo = $('excluirColaborador');
  if (!campo || campo.value === '') {
    msgAdmin('Selecione um colaborador para excluir.', 'erro');
    return;
  }

  const pessoa = colaboradorPorId(campo.value);
  if (!pessoa) {
    msgAdmin('Colaborador não encontrado. Atualize a lista e tente novamente.', 'erro');
    preencherSelectsAdmin();
    return;
  }

  const confirmar = confirm(`Deseja excluir ${pessoa.nome} do ${pessoa.turno}?`);
  if (!confirmar) return;

  const indice = ESCALA.findIndex(item => item.id === pessoa.id);
  if (indice >= 0) ESCALA.splice(indice, 1);
  atualizarAppAposEdicao();
  msgAdmin(`Colaborador ${pessoa.nome} excluído.`);
}

function salvarPosto() {
  const codigo = $('novoCodigoPosto').value.trim().toUpperCase();
  const local = $('novaLocalizacao').value.trim();
  const setor = $('novoSetor').value.trim();

  if (!codigo || !local) {
    msgAdmin('Informe pelo menos o código e a localização.', 'erro');
    return;
  }

  LEGENDA[codigo] = { local, setor: setor || local };
  $('novoCodigoPosto').value = '';
  $('novaLocalizacao').value = '';
  $('novoSetor').value = '';
  atualizarAppAposEdicao();
  msgAdmin(`Posto ${codigo} salvo.`);
}

function colaboradorAdminSelecionado() {
  return colaboradorPorId($('adminColaborador').value);
}

function carregarEscalaMensal() {
  const pessoa = colaboradorAdminSelecionado();
  if (!pessoa) return;
  diasDisponiveis().forEach(d => {
    const campo = $(`diaAdmin_${d}`);
    if (campo) campo.value = pessoa.dias[d - 1] || '';
  });
}

function aplicarPostoTodosDias() {
  const pessoa = colaboradorAdminSelecionado();
  const posto = $('postoIntervalo')?.value;

  if (!pessoa) {
    msgAdmin("Selecione um colaborador.", "erro");
    return;
  }

  if (!posto) {
    msgAdmin("Selecione um posto para aplicar.", "erro");
    return;
  }

  pessoa.dias = diasDisponiveis().map(() => posto);
  atualizarAppAposEdicao();
  carregarEscalaMensal();
  msgAdmin("Posto " + posto + " aplicado para " + pessoa.nome + ".");
}
function salvarEscalaMensal() {
  const pessoa = colaboradorAdminSelecionado();
  if (!pessoa) {
    msgAdmin('Selecione um colaborador.', 'erro');
    return;
  }

  pessoa.dias = diasDisponiveis().map(d => $(`diaAdmin_${d}`).value || '');
  atualizarAppAposEdicao();
  msgAdmin(`Escala mensal de ${pessoa.nome} salva.`);
}

function substituirColaborador() {
  const origem = colaboradorPorId($('substituirOrigem')?.value);
  const destino = colaboradorPorId($('substituirDestino')?.value);
  const diaInicio = Number($('substituirDia')?.value || 1);

  if (!origem || !destino) {
    msgAdmin('Selecione os dois colaboradores.', 'erro');
    return;
  }

  if (origem.id === destino.id) {
    msgAdmin('Escolha colaboradores diferentes.', 'erro');
    return;
  }

  const confirmar = confirm(`${destino.nome} vai assumir os postos de ${origem.nome} a partir do dia ${String(diaInicio).padStart(2, '0')}. Deseja continuar?`);
  if (!confirmar) return;

  for (let i = diaInicio - 1; i < 31; i++) {
    destino.dias[i] = origem.dias[i] || '';
    origem.dias[i] = '';
  }

  atualizarAppAposEdicao();
  carregarEscalaMensal();
  msgAdmin(`${destino.nome} assumiu os postos de ${origem.nome} a partir do dia ${String(diaInicio).padStart(2, '0')}.`);
}


function dataISOHoje() {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  const dia = String(agora.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

function formatarDataBR(dataISO) {
  if (!dataISO) return '';
  const [ano, mes, dia] = dataISO.split('-');
  if (!ano || !mes || !dia) return dataISO;
  return `${dia}/${mes}/${ano}`;
}

function setoresCargasDisponiveis() {
  return [
    'Caixaria G08',
    'Caixaria G89',
    'Pátio Central G89',
    'JIS G04 - 72',
    'JIS G04 - 73',
    'Interni G89',
    'Mecanismo G04'
  ];
}

function carregarLancamentosCargas() {
  try {
    return JSON.parse(localStorage.getItem(CARGAS_STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function salvarLancamentosCargas(lista) {
  localStorage.setItem(CARGAS_STORAGE_KEY, JSON.stringify(lista));
}

function prepararModuloCargas() {
  const dataHoje = dataISOHoje();
  if ($('cargaData') && !$('cargaData').value) $('cargaData').value = dataHoje;
  if ($('relatorioData') && !$('relatorioData').value) $('relatorioData').value = dataHoje;

  const turnos = turnosDisponiveis();
  const opcoesTurno = turnos.map(t => `<option value="${t}">${t}</option>`).join('');
  const opcoesTurnoFiltro = '<option value="todos">Todos os turnos</option>' + opcoesTurno;
  if ($('cargaTurno')) $('cargaTurno').innerHTML = opcoesTurno;
  if ($('relatorioTurno')) $('relatorioTurno').innerHTML = opcoesTurnoFiltro;

  const setores = setoresCargasDisponiveis();
  const opcoesSetor = setores.map(s => `<option value="${s}">${s}</option>`).join('');
  const opcoesSetorFiltro = '<option value="todos">Todos os setores</option>' + opcoesSetor;
  if ($('cargaSetor')) $('cargaSetor').innerHTML = '<option value="">Selecione</option>' + opcoesSetor;
  if ($('relatorioSetor')) $('relatorioSetor').innerHTML = opcoesSetorFiltro;

  if ($('listaColaboradoresCargas')) {
    const nomes = [...new Set(ESCALA.map(p => p.nome).filter(Boolean))].sort((a,b) => a.localeCompare(b, 'pt-BR'));
    $('listaColaboradoresCargas').innerHTML = nomes.map(nome => `<option value="${nome}"></option>`).join('');
  }

  atualizarRelatorioCargas();
}

function msgCargas(texto, tipo = 'ok') {
  const el = $('msgCargas');
  if (!el) return;
  el.textContent = texto;
  el.className = `msg ${tipo}`;
  setTimeout(() => { el.textContent = ''; }, 4500);
}

function msgRelatorioCargas(texto, tipo = 'ok') {
  const el = $('msgRelatorioCargas');
  if (!el) return;
  el.textContent = texto;
  el.className = `msg ${tipo}`;
  setTimeout(() => { el.textContent = ''; }, 4500);
}

function salvarFechamentoCarga() {
  const data = $('cargaData')?.value || dataISOHoje();
  const turno = $('cargaTurno')?.value || '';
  const setor = $('cargaSetor')?.value || '';
  const colaborador = ($('cargaColaborador')?.value || '').trim().toUpperCase();
  const registro = ($('cargaRegistro')?.value || '').trim();
  const quantidade = Number($('cargaQuantidade')?.value || 0);
  const observacao = ($('cargaObservacao')?.value || '').trim();

  if (!data || !turno || !setor || !colaborador || !quantidade || quantidade < 0) {
    msgCargas('Preencha Data, Turno, Setor, Colaborador e Quantidade.', 'erro');
    return;
  }

  const lista = carregarLancamentosCargas();
  const agora = new Date();
  const id = lista.length ? Math.max(...lista.map(item => Number(item.id) || 0)) + 1 : 1;

  lista.push({
    id,
    data,
    hora: agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    turno,
    setor,
    colaborador,
    registro,
    quantidade,
    observacao,
    criadoEm: agora.toISOString()
  });

  salvarLancamentosCargas(lista);
  limparFormularioCargas(false);
  if ($('cargaData')) $('cargaData').value = data;
  if ($('cargaTurno')) $('cargaTurno').value = turno;
  if ($('cargaSetor')) $('cargaSetor').value = setor;
  atualizarRelatorioCargas();
  msgCargas(`Lançamento salvo com sucesso. ID ${id} • ${quantidade} cargas para ${colaborador}.`);
}

function limparFormularioCargas(limparData = true) {
  if (limparData && $('cargaData')) $('cargaData').value = dataISOHoje();
  if ($('cargaColaborador')) $('cargaColaborador').value = '';
  if ($('cargaRegistro')) $('cargaRegistro').value = '';
  if ($('cargaQuantidade')) $('cargaQuantidade').value = '';
  if ($('cargaObservacao')) $('cargaObservacao').value = '';
}

function agruparSomando(lista, campo) {
  return lista.reduce((acc, item) => {
    const chave = item[campo] || 'Não informado';
    acc[chave] = (acc[chave] || 0) + Number(item.quantidade || 0);
    return acc;
  }, {});
}

function linhasResumo(obj) {
  return Object.entries(obj)
    .sort((a,b) => b[1] - a[1] || a[0].localeCompare(b[0], 'pt-BR'))
    .map(([nome, total]) => `<tr><td>${nome}</td><td>${total}</td></tr>`)
    .join('') || '<tr><td colspan="2">Sem lançamentos.</td></tr>';
}

function atualizarRelatorioCargas() {
  if (!$('resumoCargas') || !$('tabelasCargas')) return;

  const data = $('relatorioData')?.value || dataISOHoje();
  const turno = $('relatorioTurno')?.value || 'todos';
  const setor = $('relatorioSetor')?.value || 'todos';

  const lista = carregarLancamentosCargas().filter(item => {
    const mesmaData = item.data === data;
    const mesmoTurno = turno === 'todos' || item.turno === turno;
    const mesmoSetor = setor === 'todos' || item.setor === setor;
    return mesmaData && mesmoTurno && mesmoSetor;
  });

  const totalGeral = lista.reduce((soma, item) => soma + Number(item.quantidade || 0), 0);
  const totalLancamentos = lista.length;
  const porColaborador = agruparSomando(lista, 'colaborador');
  const porSetor = agruparSomando(lista, 'setor');
  const porTurno = agruparSomando(lista, 'turno');

  $('resumoCargas').innerHTML = `
    <div class="resumo-card"><span>Total geral</span><strong>${totalGeral}</strong></div>
    <div class="resumo-card"><span>Lançamentos</span><strong>${totalLancamentos}</strong></div>
    <div class="resumo-card"><span>Data</span><strong>${formatarDataBR(data)}</strong></div>
  `;

  $('tabelasCargas').innerHTML = `
    <div class="tabela-bloco">
      <h3>Total por colaborador</h3>
      <table><thead><tr><th>Colaborador</th><th>Cargas</th></tr></thead><tbody>${linhasResumo(porColaborador)}</tbody></table>
    </div>
    <div class="tabela-bloco">
      <h3>Total por setor</h3>
      <table><thead><tr><th>Setor</th><th>Cargas</th></tr></thead><tbody>${linhasResumo(porSetor)}</tbody></table>
    </div>
    <div class="tabela-bloco">
      <h3>Total por turno</h3>
      <table><thead><tr><th>Turno</th><th>Cargas</th></tr></thead><tbody>${linhasResumo(porTurno)}</tbody></table>
    </div>
    <div class="tabela-bloco tabela-lancamentos">
      <h3>Lançamentos do dia</h3>
      <table>
        <thead><tr><th>Hora</th><th>Turno</th><th>Setor</th><th>Colaborador</th><th>Qtd.</th></tr></thead>
        <tbody>${lista.map(item => `<tr><td>${item.hora || ''}</td><td>${item.turno}</td><td>${item.setor}</td><td>${item.colaborador}</td><td>${item.quantidade}</td></tr>`).join('') || '<tr><td colspan="5">Sem lançamentos.</td></tr>'}</tbody>
      </table>
    </div>
  `;
}

function exportarCargasCSV() {
  const lista = carregarLancamentosCargas();
  if (!lista.length) {
    msgRelatorioCargas('Não há lançamentos para exportar.', 'erro');
    return;
  }

  const cabecalho = ['ID','Data','Hora','Turno','Setor','Colaborador','Registro','Quantidade','Observacao'];
  const linhas = lista.map(item => cabecalho.map(campo => {
    const chave = campo === 'Observacao' ? 'observacao' : campo.toLowerCase();
    return `"${String(item[chave] ?? '').replace(/"/g, '""')}"`;
  }).join(';'));

  const csv = [cabecalho.join(';'), ...linhas].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `fechamento-cargas-${dataISOHoje()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
  msgRelatorioCargas('Arquivo CSV gerado. Ele pode ser aberto no Excel.');
}

function compartilharResumoCargas() {
  const data = $('relatorioData')?.value || dataISOHoje();
  const lista = carregarLancamentosCargas().filter(item => item.data === data);
  const totalGeral = lista.reduce((soma, item) => soma + Number(item.quantidade || 0), 0);
  const porColaborador = Object.entries(agruparSomando(lista, 'colaborador'))
    .sort((a,b) => b[1] - a[1])
    .map(([nome, total]) => `${nome}: ${total}`)
    .join('\n');

  const texto = `FECHAMENTO DE CARGAS - ${formatarDataBR(data)}\n\nTotal geral: ${totalGeral}\n\nPor colaborador:\n${porColaborador || 'Sem lançamentos.'}`;
  const url = `https://wa.me/?text=${encodeURIComponent(texto)}`;
  window.open(url, '_blank');
}

function apagarLancamentosCargas() {
  const confirmar = confirm('Deseja apagar TODOS os lançamentos de cargas salvos neste aparelho?');
  if (!confirmar) return;
  salvarLancamentosCargas([]);
  atualizarRelatorioCargas();
  msgRelatorioCargas('Lançamentos apagados deste aparelho.');
}

async function atualizarAplicativo() {
  try {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(reg => reg.unregister()));
    }
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map(key => caches.delete(key)));
    }
  } catch (erro) {
    console.warn('Não foi possível limpar o cache automaticamente.', erro);
  }
  window.location.href = window.location.pathname + '?v=' + Date.now();
}

async function registrarServiceWorker() {
  if ('serviceWorker' in navigator) {
    try { await navigator.serviceWorker.register('./service-worker.js'); } catch (e) {}
  }
}

let promptInstalacao;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  promptInstalacao = e;
  $('btnInstalar').hidden = false;
});

if ($('btnInstalar')) $('btnInstalar').addEventListener('click', async () => {
  if (!promptInstalacao) return;
  promptInstalacao.prompt();
  await promptInstalacao.userChoice;
  promptInstalacao = null;
  $('btnInstalar').hidden = true;
});

if ($('btnAtualizarApp')) $('btnAtualizarApp').addEventListener('click', atualizarAplicativo);


Object.assign(window, {
  abrirAba,
  consultarUnico,
  mostrarHoje,
  atualizarValorConsulta,
  entrarAdmin,
  sairAdmin,
  salvarColaborador,
  excluirColaborador,
  salvarPosto,
  substituirColaborador,
  salvarEscalaMensal,
  salvarFechamentoCarga,
  limparFormularioCargas,
  atualizarRelatorioCargas,
  exportarCargasCSV,
  compartilharResumoCargas,
  apagarLancamentosCargas,
  atualizarAplicativo
});

window.addEventListener('load', iniciar);
