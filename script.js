'use strict';

const $ = (id) => document.getElementById(id);
const APP = window.APP_CONFIG || {};

const STORAGE = Object.freeze({
  cachePrefixo: 'escala9132CacheV2:',
  fila: 'escala9132FilaV2',
  cargas: 'escala9132HistoricoCargasV2',
  ultimoEnvio: 'escala9132UltimoEnvioV2',
  rascunhoCarga: 'escala9132RascunhoCargaV2',
  tentativasAdmin: 'escala9132TentativasAdminV2',
  sabadosHE: 'escala9132SabadosHEV1',
  estatisticasHE: 'escala9132EstatisticasHEV1'
});

const CHAVE_ESCALA_FIXA = 'FIXA';
const SITUACOES = new Set((typeof STATUS_ESCALA !== 'undefined' ? STATUS_ESCALA : []).map((item) => item.codigo));
let mesSelecionado = CHAVE_ESCALA_FIXA;
let adminSenhaSessao = '';
let origemDadosAtual = 'local';
let registroServiceWorker = null;
let promptInstalacao = null;
let recarregandoPorAtualizacao = false;
let carregandoMes = false;
let carregandoSabado = false;
let escalaSabadoEditor = null;
let estatisticasSabadoEditor = new Map();
let postosNecessariosSabadoEditor = new Set();
let historicoSabadoDisponivel = false;
let requisicaoSabadoEditor = 0;
let modoColaboradorAdmin = 'adicionar';
let modoPostoAdmin = 'adicionar';

/* =========================
   Utilitários
   ========================= */
function clonar(valor) {
  return JSON.parse(JSON.stringify(valor));
}

function escaparHTML(valor) {
  return String(valor ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function textoSlug(valor) {
  return String(valor || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function criarId(prefixo, texto = '') {
  const base = textoSlug(texto) || Math.random().toString(36).slice(2, 9);
  return `${prefixo}-${base}-${Date.now().toString(36)}`;
}

function dataISOHoje() {
  const data = new Date();
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
}

function dataPorISO(dataISO) {
  const data = new Date(`${String(dataISO || '')}T12:00:00`);
  return Number.isNaN(data.getTime()) ? null : data;
}

function dataEhSabado(dataISO) {
  const data = dataPorISO(dataISO);
  return Boolean(data && data.getDay() === 6);
}

function deslocarDataISO(dataISO, quantidadeDias) {
  const data = dataPorISO(dataISO);
  if (!data) return '';
  data.setDate(data.getDate() + Number(quantidadeDias || 0));
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
}

function proximoSabadoISO(incluirHoje = true) {
  const hoje = new Date();
  const diaSemana = hoje.getDay();
  let diferenca = (6 - diaSemana + 7) % 7;
  if (!incluirHoje && diferenca === 0) diferenca = 7;
  const alvo = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + diferenca, 12, 0, 0);
  return `${alvo.getFullYear()}-${String(alvo.getMonth() + 1).padStart(2, '0')}-${String(alvo.getDate()).padStart(2, '0')}`;
}

function diaDoMesDaData(dataISO) {
  const data = dataPorISO(dataISO);
  return data ? Math.min(31, data.getDate()) : 1;
}

function diasNoMes() { return 31; }

function diasDisponiveis() { return Array.from({ length: 31 }, (_, indice) => indice + 1); }

function formatarDataBR(dataISO) {
  if (!dataISO) return '';
  const partes = String(dataISO).split('-');
  if (partes.length !== 3) return dataISO;
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function formatarDataHora(valor) {
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return '';
  return data.toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function diaParaDestaque() { return new Date().getDate(); }

function turnosDisponiveis() {
  return CONFIG.turnos || ['1º Turno', '2º Turno', '3º Turno'];
}

function normalizarTurnoComparacao(valor) {
  const texto = String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[º°ª]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
  const numero = texto.match(/[123]/)?.[0];
  return numero ? `${numero} TURNO` : texto;
}

function mesmoTurno(valorA, valorB) {
  return normalizarTurnoComparacao(valorA) === normalizarTurnoComparacao(valorB);
}

function turnoCanonico(valor) {
  const encontrado = turnosDisponiveis().find((turno) => mesmoTurno(turno, valor));
  return encontrado || String(valor || CONFIG.turno || '1º Turno').trim();
}

function setLoadingBotao(botaoOuId, carregando, textoCarregando = 'Aguarde...') {
  const botao = typeof botaoOuId === 'string' ? $(botaoOuId) : botaoOuId;
  if (!botao) return;
  const texto = botao.querySelector('.btn-texto');
  const spinner = botao.querySelector('.spinner-botao');
  if (!botao.dataset.textoOriginal && texto) botao.dataset.textoOriginal = texto.textContent;
  botao.disabled = carregando;
  if (texto) texto.textContent = carregando ? textoCarregando : (botao.dataset.textoOriginal || texto.textContent);
  if (spinner) spinner.hidden = !carregando;
}

function ocultarCarregamentoInicial() {
  const elemento = $('carregamentoInicial');
  if (!elemento) return;
  elemento.classList.add('oculto');
  setTimeout(() => elemento.remove(), 400);
}

/* =========================
   Toasts e mensagens
   ========================= */
function toast(mensagem, tipo = 'info', duracao = 4200) {
  const container = $('toastContainer');
  if (!container) return;
  const icones = { ok: '✓', erro: '!', aviso: '⚠', info: 'i' };
  const item = document.createElement('div');
  item.className = `toast ${tipo}`;
  item.innerHTML = `
    <span class="toast-icone">${icones[tipo] || 'i'}</span>
    <span>${escaparHTML(mensagem)}</span>
    <button class="toast-fechar" type="button" aria-label="Fechar">×</button>
  `;
  const remover = () => {
    if (!item.isConnected) return;
    item.classList.add('saindo');
    setTimeout(() => item.remove(), 230);
  };
  item.querySelector('.toast-fechar').addEventListener('click', remover);
  container.appendChild(item);
  if (duracao > 0) setTimeout(remover, duracao);
}

function msgAdmin(texto, tipo = 'ok') {
  const elemento = $('msgAdmin');
  if (!elemento) return;
  elemento.textContent = texto;
  elemento.className = `msg ${tipo}`;
  setTimeout(() => { if (elemento.textContent === texto) elemento.textContent = ''; }, 5000);
}

function msgCargas(texto, tipo = 'ok') {
  const elemento = $('msgCargas');
  if (!elemento) return;
  elemento.textContent = texto;
  elemento.className = `msg ${tipo}`;
  setTimeout(() => { if (elemento.textContent === texto) elemento.textContent = ''; }, 5000);
}

/* =========================
   Normalização dos dados
   ========================= */
function normalizarCodigoPosto(valor) {
  if (typeof valor !== 'string') return valor;
  const original = valor.trim();
  const chave = original.toUpperCase();
  const mapa = {
    'CANETA': 'Pens.', 'CANETAS': 'Pens.', 'CANETAS.': 'Pens.',
    'PENS': 'Pens.', 'PENS.': 'Pens.', 'PENSILVÂNIA': 'Pens.', 'PENSILINA': 'Pens.',
    'G89 INTERNO': 'INT-89', 'G 89 INTERNO': 'INT-89', 'INT89': 'INT-89',
    'INT 89': 'INT-89', 'INTERNE': 'INT-89', 'INTERNI': 'INT-89',
    'FPT-X': 'FPT-CX', 'FPT/CX': 'FPT-CX', 'FPT CX': 'FPT-CX'
  };
  return mapa[chave] || original;
}

function garantirIdsColaboradores() {
  const usados = new Set();
  ESCALA.forEach((pessoa, indice) => {
    let base = pessoa.id || `${textoSlug(pessoa.nome)}-${textoSlug(pessoa.turno || 'turno')}` || `colaborador-${indice + 1}`;
    let id = base;
    let contador = 2;
    while (usados.has(id)) id = `${base}-${contador++}`;
    pessoa.id = id;
    usados.add(id);
  });
}

function normalizarDadosAtuais() {
  const legendaNova = {};
  Object.entries(LEGENDA || {}).forEach(([codigoOriginal, info]) => {
    const codigo = normalizarCodigoPosto(codigoOriginal);
    if (!codigo) return;
    if (typeof info === 'string') legendaNova[codigo] = { local: info, setor: info, ativo: true };
    else legendaNova[codigo] = {
      local: String(info?.local || info?.setor || codigo),
      setor: String(info?.setor || info?.local || codigo),
      ativo: info?.ativo !== false
    };
  });
  LEGENDA = legendaNova;

  ESCALA = (Array.isArray(ESCALA) ? ESCALA : []).map((pessoa) => ({
    id: pessoa.id || '',
    nome: String(pessoa.nome || '').trim().toUpperCase(),
    registro: String(pessoa.registro || '').trim(),
    turno: turnoCanonico(pessoa.turno || CONFIG.turno || '1º Turno'),
    ativo: pessoa.ativo !== false,
    dias: Array.from({ length: 31 }, (_, indice) => normalizarCodigoPosto(Array.isArray(pessoa.dias) ? (pessoa.dias[indice] || '') : ''))
  })).filter((pessoa) => pessoa.nome);

  garantirIdsColaboradores();
  ESCALA.sort((a, b) => `${a.turno}${a.nome}`.localeCompare(`${b.turno}${b.nome}`, 'pt-BR'));
}

function dadosPadrao() {
  return {
    legenda: clonar(LEGENDA_PADRAO),
    escala: [
      ...clonar(ESCALA_PRIMEIRO_TURNO),
      ...clonar(ESCALA_SEGUNDO_TURNO_2023)
    ].map((pessoa) => ({ ...pessoa, registro: '', ativo: true }))
  };
}

function aplicarDados(payload, origem = 'local') {
  if (payload?.postos || payload?.legenda) {
    LEGENDA = clonar(payload.postos || payload.legenda);
  }
  if (Array.isArray(payload?.escala)) {
    ESCALA = clonar(payload.escala);
  }
  normalizarDadosAtuais();
  origemDadosAtual = origem;
}

function colaboradorPorId(id) {
  return ESCALA.find((pessoa) => pessoa.id === id && pessoa.ativo !== false);
}

function pessoasAtivas() {
  return ESCALA.filter((pessoa) => pessoa.ativo !== false);
}

function pessoasPorTurno(turno = 'todos') {
  const pessoas = pessoasAtivas();
  return turno === 'todos' ? pessoas : pessoas.filter((pessoa) => mesmoTurno(pessoa.turno, turno));
}

function postosDisponiveis(pessoas = pessoasAtivas()) {
  const codigos = new Set(Object.entries(LEGENDA)
    .filter(([, info]) => info?.ativo !== false)
    .map(([codigo]) => codigo));
  pessoas.forEach((pessoa) => pessoa.dias.forEach((posto) => { if (posto && !SITUACOES.has(posto)) codigos.add(posto); }));
  return [...codigos].sort((a, b) => a.localeCompare(b, 'pt-BR', { numeric: true }));
}

function postoDescricao(posto) {
  if (!posto) return 'Sem posto definido';
  const situacao = (typeof STATUS_ESCALA !== 'undefined' ? STATUS_ESCALA : []).find((item) => item.codigo === posto);
  if (situacao) return situacao.descricao;
  const info = LEGENDA[posto];
  if (!info) return 'Sem descrição cadastrada';
  if (typeof info === 'string') return info;
  if (info.local && info.setor && info.local.toLowerCase() === info.setor.toLowerCase()) return info.local;
  if (info.local && info.setor) return `${info.local} • ${info.setor}`;
  return info.local || info.setor || 'Sem descrição cadastrada';
}

function postoLegendaCompleta(posto) {
  const descricao = postoDescricao(posto);
  return `${posto} - ${descricao}`;
}

/* =========================
   Cache local
   ========================= */
function chaveCache(mesAno = mesSelecionado) {
  return `${STORAGE.cachePrefixo}${mesAno}`;
}

function salvarCacheMes(mesAno = mesSelecionado, dados = null) {
  const pacote = dados || {
    mesAno,
    legenda: LEGENDA,
    escala: ESCALA,
    atualizadoEm: new Date().toISOString(),
    origem: origemDadosAtual
  };
  localStorage.setItem(chaveCache(mesAno), JSON.stringify(pacote));
  mostrarUltimaAtualizacao();
}

function carregarCacheMes(mesAno) {
  try {
    return JSON.parse(localStorage.getItem(chaveCache(mesAno)) || 'null');
  } catch {
    return null;
  }
}

function migrarCacheEscalaFixa() {
  if (carregarCacheMes(CHAVE_ESCALA_FIXA)) return;
  const candidatos = [];
  for (let indice = 0; indice < localStorage.length; indice += 1) {
    const chave = localStorage.key(indice) || '';
    if (!chave.startsWith(STORAGE.cachePrefixo) || chave === chaveCache(CHAVE_ESCALA_FIXA)) continue;
    try {
      const pacote = JSON.parse(localStorage.getItem(chave) || 'null');
      if (pacote?.escala?.length) candidatos.push(pacote);
    } catch { /* ignora cache antigo inválido */ }
  }
  candidatos.sort((a, b) => String(b.atualizadoEm || '').localeCompare(String(a.atualizadoEm || '')));
  if (!candidatos[0]) return;
  localStorage.setItem(chaveCache(CHAVE_ESCALA_FIXA), JSON.stringify({ ...candidatos[0], mesAno: CHAVE_ESCALA_FIXA, origem: candidatos[0].origem || 'cache migrado' }));
}

function mostrarUltimaAtualizacao() {
  const elemento = $('ultimaAtualizacao');
  if (!elemento) return;
  const cache = carregarCacheMes(mesSelecionado);
  elemento.textContent = cache?.atualizadoEm ? `Última atualização: ${formatarDataHora(cache.atualizadoEm)}` : '';
}

/* =========================
   Escalas de sábado / Hora Extra
   ========================= */
function lerCacheSabados() {
  try { return JSON.parse(localStorage.getItem(STORAGE.sabadosHE) || '{}'); } catch { return {}; }
}

function chaveEscalaSabado(dataISO, turno = 'todos') {
  return `${dataISO}|${turno || 'todos'}`;
}

function obterCacheEscalaSabado(dataISO, turno = 'todos') {
  const cache = lerCacheSabados();
  const exato = cache[chaveEscalaSabado(dataISO, turno)];
  if (exato) return normalizarEscalaSabado(exato, dataISO, turno);

  const escalasDaData = Object.values(cache)
    .filter((item) => item?.dataISO === dataISO)
    .map((item) => normalizarEscalaSabado(item, dataISO, item?.turno || 'todos'));
  if (turno !== 'todos') {
    return escalasDaData.find((item) => mesmoTurno(item.turno, turno)) || null;
  }

  const publicadas = escalasDaData.filter((item) => item.status === 'PUBLICADA');
  if (!publicadas.length) return null;
  const itens = publicadas.flatMap((item) => Array.isArray(item.itens) ? item.itens : []);
  return normalizarEscalaSabado({
    dataISO,
    turno: 'todos',
    status: itens.length ? 'PUBLICADA' : 'VAZIA',
    encontrada: itens.length > 0,
    itens,
    atualizadoEm: publicadas.map((item) => item.atualizadoEm || item.salvoLocalEm || '').sort().reverse()[0] || ''
  }, dataISO, 'todos');
}

function salvarCacheEscalaSabado(escala) {
  if (!escala?.dataISO) return;
  const cache = lerCacheSabados();
  const turno = escala.turno || 'todos';
  const normalizada = normalizarEscalaSabado(escala, escala.dataISO, turno);
  cache[chaveEscalaSabado(normalizada.dataISO, turno)] = { ...normalizada, salvoLocalEm: new Date().toISOString() };
  delete cache[chaveEscalaSabado(normalizada.dataISO, 'todos')];
  const chaves = Object.keys(cache).sort((a, b) => String(cache[b]?.salvoLocalEm || '').localeCompare(String(cache[a]?.salvoLocalEm || '')));
  const reduzido = {};
  chaves.slice(0, 80).forEach((chave) => { reduzido[chave] = cache[chave]; });
  localStorage.setItem(STORAGE.sabadosHE, JSON.stringify(reduzido));
}

function normalizarEscalaSabado(resposta, dataISO, turno = 'todos') {
  const itens = Array.isArray(resposta?.itens) ? resposta.itens.map((item) => ({
    colaboradorId: String(item.colaboradorId || item.idColaborador || ''),
    nome: String(item.nome || '').toUpperCase(),
    registro: String(item.registro || ''),
    turno: String(item.turno || turno || ''),
    posto: normalizarCodigoPosto(String(item.posto || '')),
    observacao: String(item.observacao || ''),
    status: String(item.status || resposta.status || 'RASCUNHO').trim().toUpperCase()
  })) : [];
  return {
    dataISO: resposta?.dataISO || dataISO,
    turno: resposta?.turno || turno || 'todos',
    status: String(resposta?.status || (itens[0]?.status) || 'VAZIA').trim().toUpperCase(),
    encontrada: Boolean(resposta?.encontrada ?? itens.length),
    itens,
    atualizadoEm: resposta?.atualizadoEm || new Date().toISOString()
  };
}

async function carregarEscalaSabado(dataISO, turno = 'todos', { forcar = false, incluirRascunho = false, silencioso = true } = {}) {
  if (!dataEhSabado(dataISO)) return normalizarEscalaSabado({}, dataISO, turno);
  const cache = obterCacheEscalaSabado(dataISO, turno);
  if (cache && !forcar) {
    if (incluirRascunho || cache.status === 'PUBLICADA') return cache;
  }
  try {
    if (!navigator.onLine) throw new Error('Sem conexão.');
    const resposta = await apiGet('escalaSabado', {
      equipe: APP.equipe || CONFIG.equipe,
      data: dataISO,
      turno: turno === 'todos' ? '' : turno,
      incluirRascunho: incluirRascunho ? '1' : ''
    });
    const escala = normalizarEscalaSabado(resposta, dataISO, turno);
    // Uma resposta vazia não apaga uma escala publicada já confirmada e armazenada no aparelho.
    if (!escala.encontrada && cache?.status === 'PUBLICADA' && cache.itens?.length) return cache;
    const cacheCompleto = lerCacheSabados();
    cacheCompleto[chaveEscalaSabado(escala.dataISO || dataISO, turno)] = { ...escala, salvoLocalEm: new Date().toISOString() };
    localStorage.setItem(STORAGE.sabadosHE, JSON.stringify(cacheCompleto));
    return escala;
  } catch (erro) {
    if (!silencioso) toast(`Não foi possível consultar a escala de sábado. ${erro.message}`, 'aviso');
    if (cache && (incluirRascunho || cache.status === 'PUBLICADA')) return cache;
    return normalizarEscalaSabado({}, dataISO, turno);
  }
}

function itemSabadoDoColaborador(escala, colaboradorId) {
  return escala?.itens?.find((item) => item.colaboradorId === colaboradorId) || null;
}

function chaveEstatisticasSabado(dataISO, turno) {
  return `${dataISO}|${turno || 'todos'}`;
}

function lerCacheEstatisticasSabado() {
  try { return JSON.parse(localStorage.getItem(STORAGE.estatisticasHE) || '{}'); } catch { return {}; }
}

function salvarCacheEstatisticasSabado(dataISO, turno, estatisticas) {
  const cache = lerCacheEstatisticasSabado();
  cache[chaveEstatisticasSabado(dataISO, turno)] = {
    dataISO,
    turno,
    estatisticas,
    salvoLocalEm: new Date().toISOString()
  };
  const chaves = Object.keys(cache).sort((a, b) => String(cache[b]?.salvoLocalEm || '').localeCompare(String(cache[a]?.salvoLocalEm || '')));
  const reduzido = {};
  chaves.slice(0, 40).forEach((chave) => { reduzido[chave] = cache[chave]; });
  localStorage.setItem(STORAGE.estatisticasHE, JSON.stringify(reduzido));
}

function normalizarEstatisticasSabado(resposta) {
  return Array.isArray(resposta?.estatisticas) ? resposta.estatisticas.map((item) => ({
    colaboradorId: String(item.colaboradorId || ''),
    totalAno: Number(item.totalAno || 0),
    total90Dias: Number(item.total90Dias || 0),
    totalGeral: Number(item.totalGeral || 0),
    consecutivos: Number(item.consecutivos || 0),
    ultimoSabado: String(item.ultimoSabado || ''),
    ultimoPosto: normalizarCodigoPosto(String(item.ultimoPosto || ''))
  })) : [];
}

async function carregarEstatisticasSabado(dataISO, turno, { forcar = false, silencioso = true } = {}) {
  const chave = chaveEstatisticasSabado(dataISO, turno);
  const cache = lerCacheEstatisticasSabado()[chave];
  if (cache && !forcar) return { itens: normalizarEstatisticasSabado(cache), disponivel: true };
  try {
    if (!navigator.onLine) throw new Error('Sem conexão.');
    const resposta = await apiGet('estatisticasSabado', {
      equipe: APP.equipe || CONFIG.equipe,
      data: dataISO,
      turno
    });
    const estatisticas = normalizarEstatisticasSabado(resposta);
    salvarCacheEstatisticasSabado(dataISO, turno, estatisticas);
    return { itens: estatisticas, disponivel: true };
  } catch (erro) {
    if (!silencioso) toast(`Não foi possível atualizar o histórico de sábados. ${erro.message}`, 'aviso');
    return cache
      ? { itens: normalizarEstatisticasSabado(cache), disponivel: true }
      : { itens: [], disponivel: false };
  }
}

function estatisticaDoColaboradorSabado(colaboradorId) {
  return estatisticasSabadoEditor.get(String(colaboradorId || '')) || {
    colaboradorId: String(colaboradorId || ''),
    totalAno: 0,
    total90Dias: 0,
    totalGeral: 0,
    consecutivos: 0,
    ultimoSabado: '',
    ultimoPosto: ''
  };
}

/* =========================
   API Google Apps Script
   ========================= */
function apiConfigurada() {
  return /^https:\/\/script\.google\.com\/macros\/s\/.+\/exec/.test(APP.appsScriptUrl || '');
}

function apiGet(acao, parametros = {}) {
  return new Promise((resolve, reject) => {
    if (!apiConfigurada()) {
      reject(new Error('URL do Apps Script não configurada.'));
      return;
    }

    const callback = `__escala9132_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const script = document.createElement('script');
    const timeout = setTimeout(() => finalizar(new Error('Tempo de resposta da planilha excedido.')), APP.timeoutApiMs || 12000);

    function finalizar(erro, dados) {
      clearTimeout(timeout);
      delete window[callback];
      script.remove();
      if (erro) reject(erro); else resolve(dados);
    }

    window[callback] = (resposta) => {
      if (resposta?.sucesso === false) finalizar(new Error(resposta.mensagem || 'Erro na planilha.'));
      else finalizar(null, resposta);
    };

    const url = new URL(APP.appsScriptUrl);
    url.searchParams.set('acao', acao);
    url.searchParams.set('callback', callback);
    url.searchParams.set('_', String(Date.now()));
    Object.entries(parametros).forEach(([chave, valor]) => {
      if (valor !== undefined && valor !== null && valor !== '') url.searchParams.set(chave, String(valor));
    });

    script.onerror = () => finalizar(new Error('Não foi possível acessar a planilha.'));
    script.src = url.toString();
    document.head.appendChild(script);
  });
}

function lerFila() {
  try { return JSON.parse(localStorage.getItem(STORAGE.fila) || '[]'); } catch { return []; }
}

function salvarFila(fila) {
  localStorage.setItem(STORAGE.fila, JSON.stringify(fila));
  atualizarFilaOfflineInfo();
}

function enfileirarPayload(payload) {
  const fila = lerFila();
  fila.push({ id: criarId('fila'), criadoEm: new Date().toISOString(), payload });
  salvarFila(fila);
}

async function apiPost(payload, { permitirFila = true } = {}) {
  if (!apiConfigurada()) throw new Error('URL do Apps Script não configurada.');
  if (!navigator.onLine) {
    if (permitirFila) {
      enfileirarPayload(payload);
      return { enfileirado: true };
    }
    throw new Error('Sem conexão com a internet.');
  }

  try {
    await fetch(APP.appsScriptUrl, {
      method: 'POST',
      mode: 'no-cors',
      cache: 'no-store',
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
      body: JSON.stringify(payload)
    });
    return { enviado: true };
  } catch (erro) {
    if (permitirFila) {
      enfileirarPayload(payload);
      return { enfileirado: true, erro };
    }
    throw erro;
  }
}

async function processarFilaOffline() {
  if (!navigator.onLine || !apiConfigurada()) return;
  const fila = lerFila();
  if (!fila.length) return;

  const restantes = [];
  let enviados = 0;
  for (const item of fila) {
    try {
      await apiPost(item.payload, { permitirFila: false });
      enviados += 1;
    } catch {
      restantes.push(item);
    }
  }
  salvarFila(restantes);
  if (enviados) toast(`${enviados} registro(s) pendente(s) enviado(s) para a planilha.`, 'ok');
}

function atualizarFilaOfflineInfo() {
  const quantidade = lerFila().length;
  const elemento = $('filaOfflineInfo');
  if (elemento) elemento.textContent = quantidade ? `${quantidade} envio(s) aguardando conexão` : 'Nenhum lançamento pendente';
}

function atualizarStatusConexao() {
  const elemento = $('statusConexao');
  if (!elemento) return;
  const online = navigator.onLine;
  elemento.classList.toggle('online', online);
  elemento.classList.toggle('offline', !online);
  elemento.textContent = online ? 'Online' : 'Offline';
  if (online) processarFilaOffline();
}

/* =========================
   Carregamento e sincronização da escala
   ========================= */
async function carregarEscalaFixa({ forcar = false, silencioso = false } = {}) {
  if (carregandoMes) return;
  mesSelecionado = CHAVE_ESCALA_FIXA;
  carregandoMes = true;
  const cache = carregarCacheMes(CHAVE_ESCALA_FIXA);
  if (cache && !forcar) { aplicarDados(cache, 'cache local'); atualizarInterfaceCompleta(); }
  try {
    if (!navigator.onLine) throw new Error('Sem conexão.');
    const resposta = await apiGet('bootstrap', { equipe: APP.equipe || CONFIG.equipe });
    aplicarDados({ postos: resposta.postos, escala: resposta.escala }, 'Google Sheets');
    salvarCacheMes(CHAVE_ESCALA_FIXA, { mesAno: CHAVE_ESCALA_FIXA, legenda: LEGENDA, escala: ESCALA, atualizadoEm: resposta.atualizadoEm || new Date().toISOString(), origem: 'Google Sheets' });
    if (!silencioso && forcar) toast('Dados atualizados pela planilha.', 'ok');
  } catch (erro) {
    if (!cache) { aplicarDados(dadosPadrao(), 'dados iniciais'); salvarCacheMes(CHAVE_ESCALA_FIXA); }
    if (!silencioso) toast(`Usando dados salvos no aparelho. ${erro.message}`, 'aviso', 5000);
  } finally { carregandoMes = false; atualizarInterfaceCompleta(); }
}

async function recarregarEscala(mostrarAviso = false) { await carregarEscalaFixa({ forcar: true, silencioso: !mostrarAviso }); }

/* =========================
   Consulta da escala
   ========================= */
function preencherSelectTurnos() {
  const valores = ['<option value="todos">Todos os turnos</option>', ...turnosDisponiveis().map((turno) => `<option value="${escaparHTML(turno)}">${escaparHTML(turno)}</option>`)].join('');
  const atual = $('selectTurnoConsulta')?.value || CONFIG.turno;
  if ($('selectTurnoConsulta')) { $('selectTurnoConsulta').innerHTML = valores; $('selectTurnoConsulta').value = turnosDisponiveis().includes(atual) || atual === 'todos' ? atual : CONFIG.turno; }
}

function atualizarValorConsulta() {
  const tipo = $('tipoConsulta')?.value || 'nome';
  const turno = $('selectTurnoConsulta')?.value || 'todos';
  const pessoas = pessoasPorTurno(turno);
  const campo = $('valorConsulta');
  if (!campo) return;

  if (tipo === 'nome') {
    campo.innerHTML = pessoas
      .slice().sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
      .map((pessoa) => `<option value="${escaparHTML(pessoa.id)}">${escaparHTML(pessoa.nome)} • ${escaparHTML(pessoa.turno)}</option>`)
      .join('') || '<option value="">Nenhum colaborador neste turno</option>';
    return;
  }

  if (tipo === 'dia') {
    campo.innerHTML = diasDisponiveis().map((dia) => `<option value="${dia}">Dia ${String(dia).padStart(2, '0')}</option>`).join('');
    return;
  }

  campo.innerHTML = postosDisponiveis(pessoas)
    .map((posto) => `<option value="${escaparHTML(posto)}">${escaparHTML(posto)} - ${escaparHTML(postoDescricao(posto))}</option>`)
    .join('') || '<option value="">Nenhum posto encontrado</option>';
}

function trocarTurnoConsulta() {
  atualizarValorConsulta();
  const abaSabado = document.querySelector('.aba-sabado');
  if (abaSabado?.classList.contains('ativa')) mostrarProximoSabado(abaSabado);
  else mostrarHoje(false);
}

function card({ titulo, badge, descricao, hoje = false, subtitulo = '' }) {
  return `
    <article class="item ${hoje ? 'hoje' : ''}">
      <div class="item-topo">
        <h3>${escaparHTML(titulo)}</h3>
        <span class="badge">${escaparHTML(badge || '—')}</span>
      </div>
      ${subtitulo ? `<p class="mini-info">${escaparHTML(subtitulo)}</p>` : ''}
      <p class="descricao">${escaparHTML(descricao)}</p>
    </article>
  `;
}

function abrirAba(id, botao = null) {
  const painel = $(id);
  if (!painel) return;
  document.querySelectorAll('.painel').forEach((item) => item.classList.remove('ativo'));
  document.querySelectorAll('.aba').forEach((item) => item.classList.remove('ativa'));
  painel.classList.add('ativo');
  const alvo = botao || document.querySelector(`.aba[data-aba="${id}"]`);
  if (alvo) alvo.classList.add('ativa');
}

function abrirResultado() {
  abrirAba('resultado', document.querySelector('.aba-hoje'));
}

function abrirModalConsulta(botao = null) {
  abrirAba('resultado', botao || document.querySelector('.aba-consulta'));
  atualizarValorConsulta();
  $('modalConsulta').hidden = false;
  setTimeout(() => $('tipoConsulta')?.focus(), 40);
}

function fecharModalConsulta() {
  if ($('modalConsulta')) $('modalConsulta').hidden = true;
}

function executarConsultaModal() {
  consultarUnico();
  fecharModalConsulta();
}

function consultarUnico() {
  const tipo = $('tipoConsulta')?.value;
  const valor = $('valorConsulta')?.value;
  if (!valor) {
    $('resultadoConteudo').innerHTML = '<div class="resultado-vazio">Nenhum item disponível para consultar.</div>';
    abrirResultado();
    return;
  }
  if (tipo === 'nome') buscarPorNome(valor);
  else if (tipo === 'dia') buscarPorDia(Number(valor));
  else buscarPorPosto(valor);
}

function buscarPorNome(id) {
  abrirResultado();
  const pessoa = colaboradorPorId(id);
  if (!pessoa) return;
  const destaque = diaParaDestaque();
  const limite = diasNoMes();
  $('resultadoConteudo').innerHTML = `
    <div class="lista-cards">
      <div class="card"><h2>${escaparHTML(pessoa.nome)}</h2><p class="muted">${escaparHTML(pessoa.turno)}</p></div>
      ${pessoa.dias.slice(0, limite).map((posto, indice) => card({
        titulo: `Dia ${String(indice + 1).padStart(2, '0')}`,
        badge: posto || '—',
        descricao: postoDescricao(posto),
        hoje: indice + 1 === destaque
      })).join('')}
    </div>`;
}

function buscarPorDia(dia) {
  abrirResultado();
  const turno = $('selectTurnoConsulta')?.value || 'todos';
  const pessoas = pessoasPorTurno(turno);
  const destaque = diaParaDestaque();
  const tituloTurno = turno === 'todos' ? 'Todos os turnos' : turno;
  $('resultadoConteudo').innerHTML = `
    <div class="lista-cards">
      <div class="card"><h2>Escala do dia ${String(dia).padStart(2, '0')}</h2><p class="muted">${escaparHTML(tituloTurno)}</p></div>
      ${pessoas.length ? pessoas.map((pessoa) => {
        const posto = pessoa.dias[dia - 1] || '';
        return card({ titulo: pessoa.nome, badge: posto || '—', descricao: postoDescricao(posto), subtitulo: pessoa.turno, hoje: dia === destaque });
      }).join('') : '<div class="resultado-vazio">Nenhum colaborador neste turno.</div>'}
    </div>`;
}

function buscarPorPosto(postoBusca) {
  abrirResultado();
  const turno = $('selectTurnoConsulta')?.value || 'todos';
  const destaque = diaParaDestaque();
  const itens = [];
  pessoasPorTurno(turno).forEach((pessoa) => {
    pessoa.dias.slice(0, diasNoMes()).forEach((posto, indice) => {
      if (posto === postoBusca) itens.push(card({
        titulo: pessoa.nome,
        badge: `Dia ${String(indice + 1).padStart(2, '0')}`,
        descricao: `${postoBusca} • ${postoDescricao(postoBusca)}`,
        subtitulo: pessoa.turno,
        hoje: indice + 1 === destaque
      }));
    });
  });
  $('resultadoConteudo').innerHTML = `
    <div class="lista-cards">
      <div class="card"><h2>Local / posto ${escaparHTML(postoBusca)}</h2><p class="muted">${escaparHTML(postoDescricao(postoBusca))}</p></div>
      ${itens.length ? itens.join('') : '<div class="resultado-vazio">Nenhum resultado encontrado.</div>'}
    </div>`;
}

function renderizarEscalaSabadoPublica(dataISO, turnoSelecionado, escala, { atualizando = false } = {}) {
  const statusEscala = String(escala?.status || '').trim().toUpperCase();
  const itens = (escala?.itens || []).filter((item) => {
    const statusItem = String(item.status || statusEscala).trim().toUpperCase();
    return statusItem === 'PUBLICADA' && (turnoSelecionado === 'todos' || mesmoTurno(item.turno, turnoSelecionado));
  });
  const tituloTurno = turnoSelecionado === 'todos' ? 'Todos os turnos' : turnoSelecionado;
  const avisoAtualizacao = atualizando
    ? '<p class="muted mini-ajuda">Exibindo a última escala salva no aparelho enquanto a planilha é atualizada.</p>'
    : '';
  $('resultadoConteudo').innerHTML = `
    <div class="lista-cards">
      <div class="card cabecalho-he-publico">
        <div class="item-topo"><h2>Hora extra — sábado ${escaparHTML(formatarDataBR(dataISO))}</h2><span class="badge">HE</span></div>
        <p class="muted">${escaparHTML(tituloTurno)}</p>
        ${avisoAtualizacao}
      </div>
      ${itens.length ? itens
        .slice().sort((a, b) => `${a.turno}${a.nome}`.localeCompare(`${b.turno}${b.nome}`, 'pt-BR'))
        .map((item) => card({
          titulo: item.nome,
          badge: item.posto || '—',
          descricao: item.posto ? postoDescricao(item.posto) : 'Sem posto definido',
          subtitulo: `${item.turno}${item.observacao ? ` • ${item.observacao}` : ''}`,
          hoje: dataISO === dataISOHoje()
        })).join('')
        : '<div class="resultado-vazio">Nenhuma escala de hora extra publicada para este sábado e turno.</div>'}
    </div>`;
}

async function mostrarEscalaSabado(dataISO, botao = null) {
  abrirAba('resultado', botao || document.querySelector('.aba-sabado'));
  const turnoSelecionado = $('selectTurnoConsulta')?.value || 'todos';
  const cache = obterCacheEscalaSabado(dataISO, turnoSelecionado);

  if (cache?.status === 'PUBLICADA' && cache.itens?.length) {
    renderizarEscalaSabadoPublica(dataISO, turnoSelecionado, cache, { atualizando: true });
  } else {
    $('resultadoConteudo').innerHTML = '<div class="resultado-vazio">Carregando a escala de hora extra...</div>';
  }

  const escala = await carregarEscalaSabado(dataISO, turnoSelecionado, { forcar: true, incluirRascunho: false, silencioso: !cache });
  if (escala?.status === 'PUBLICADA' && escala.itens?.length) {
    renderizarEscalaSabadoPublica(dataISO, turnoSelecionado, escala);
  } else if (cache?.status === 'PUBLICADA' && cache.itens?.length) {
    renderizarEscalaSabadoPublica(dataISO, turnoSelecionado, cache);
  } else {
    renderizarEscalaSabadoPublica(dataISO, turnoSelecionado, escala || normalizarEscalaSabado({}, dataISO, turnoSelecionado));
  }
}

async function mostrarProximoSabado(botao = null) {
  abrirAba('resultado', botao || document.querySelector('.aba-sabado'));
  const turnoSelecionado = $('selectTurnoConsulta')?.value || 'todos';
  const dataAlvo = proximoSabadoISO(true);
  const cache = obterCacheEscalaSabado(dataAlvo, turnoSelecionado);

  // Exibe imediatamente o que estiver salvo no aparelho.
  if (cache?.status === 'PUBLICADA' && cache.itens?.length) {
    renderizarEscalaSabadoPublica(dataAlvo, turnoSelecionado, cache, { atualizando: true });
  } else {
    renderizarEscalaSabadoPublica(
      dataAlvo,
      turnoSelecionado,
      normalizarEscalaSabado({}, dataAlvo, turnoSelecionado),
      { atualizando: true }
    );
  }

  try {
    // Consulta diretamente a data exibida. Esta rota existe também nas implantações anteriores
    // e evita depender da ação "proximaEscalaSabado" no Apps Script publicado.
    const escala = await carregarEscalaSabado(dataAlvo, turnoSelecionado, {
      forcar: true,
      incluirRascunho: false,
      silencioso: false
    });

    if (escala?.status === 'PUBLICADA' && escala.itens?.length) {
      salvarCacheEscalaSabado(escala);
      renderizarEscalaSabadoPublica(dataAlvo, turnoSelecionado, escala);
      return;
    }

    if (cache?.status === 'PUBLICADA' && cache.itens?.length) {
      renderizarEscalaSabadoPublica(dataAlvo, turnoSelecionado, cache);
      return;
    }

    renderizarEscalaSabadoPublica(
      dataAlvo,
      turnoSelecionado,
      escala || normalizarEscalaSabado({}, dataAlvo, turnoSelecionado)
    );
  } catch (erro) {
    if (cache?.status === 'PUBLICADA' && cache.itens?.length) {
      renderizarEscalaSabadoPublica(dataAlvo, turnoSelecionado, cache);
    } else {
      renderizarEscalaSabadoPublica(
        dataAlvo,
        turnoSelecionado,
        normalizarEscalaSabado({}, dataAlvo, turnoSelecionado)
      );
    }
    toast(`Não foi possível atualizar a escala de sábado. ${erro.message}`, 'aviso');
  }
}

async function mostrarHoje() {
  if (new Date().getDay() === 6) {
    await mostrarEscalaSabado(dataISOHoje(), document.querySelector('.aba-hoje'));
    return;
  }
  const dia = Math.min(new Date().getDate(), 31);
  if ($('tipoConsulta')) $('tipoConsulta').value = 'dia';
  atualizarValorConsulta();
  if ($('valorConsulta')) $('valorConsulta').value = String(dia);
  buscarPorDia(dia);
}

function montarLegenda() {
  const campo = $('legendaConteudo');
  if (!campo) return;
  campo.innerHTML = postosDisponiveis([])
    .map((codigo) => card({ titulo: codigo, badge: 'Posto', descricao: postoLegendaCompleta(codigo) }))
    .join('') || '<div class="resultado-vazio">Nenhum posto cadastrado.</div>';
}

/* =========================
   Fechamento de cargas
   ========================= */
function historicoCargasLocal() {
  try { return JSON.parse(localStorage.getItem(STORAGE.cargas) || '[]'); } catch { return []; }
}

function salvarHistoricoCarga(registro) {
  const historico = historicoCargasLocal().filter((item) => item.protocolo !== registro.protocolo);
  historico.unshift(registro);
  localStorage.setItem(STORAGE.cargas, JSON.stringify(historico.slice(0, 1500)));
}

function salvarRascunhoCarga() {
  const rascunho = {
    turnoFiltro: $('cargaTurnoFiltro')?.value || '',
    colaboradorId: $('cargaColaborador')?.value || '',
    dataISO: $('cargaData')?.value || '',
    registro: $('cargaRegistro')?.value || '',
    quantidade: $('cargaQuantidade')?.value || '',
    setor: $('cargaSetor')?.value || '',
    setorManual: $('cargaSetor')?.dataset.manual === 'true'
  };
  localStorage.setItem(STORAGE.rascunhoCarga, JSON.stringify(rascunho));
}

function restaurarRascunhoCarga() {
  try {
    const rascunho = JSON.parse(localStorage.getItem(STORAGE.rascunhoCarga) || 'null');
    if (!rascunho) return;

    if ($('cargaData') && rascunho.dataISO) $('cargaData').value = rascunho.dataISO;

    const pessoaRascunho = colaboradorPorId(rascunho.colaboradorId);
    const turnoRascunho = rascunho.turnoFiltro || pessoaRascunho?.turno || CONFIG.turno;
    if ($('cargaTurnoFiltro')) $('cargaTurnoFiltro').value = turnoCanonico(turnoRascunho);
    preencherSelectColaboradoresCargas();

    if ($('cargaColaborador') && pessoaRascunho && mesmoTurno(pessoaRascunho.turno, $('cargaTurnoFiltro')?.value)) {
      $('cargaColaborador').value = pessoaRascunho.id;
    }
    if ($('cargaRegistro')) $('cargaRegistro').value = rascunho.registro || '';
    if ($('cargaQuantidade')) $('cargaQuantidade').value = rascunho.quantidade || '';

    preencherDadosCargaPorColaborador(false).then(() => {
      if (rascunho.setorManual && rascunho.setor) {
        $('cargaSetor').value = rascunho.setor;
        $('cargaSetor').dataset.manual = 'true';
        $('cargaSetorInfo').textContent = `${rascunho.setor} (editado)`;
      }
    });
  } catch { /* sem ação */ }
}

function preencherSelectTurnosCargas() {
  const campo = $('cargaTurnoFiltro');
  if (!campo) return;
  const atual = campo.value || $('selectTurnoConsulta')?.value || CONFIG.turno;
  campo.innerHTML = turnosDisponiveis()
    .map((turno) => `<option value="${escaparHTML(turno)}">${escaparHTML(turno)}</option>`)
    .join('');
  campo.value = turnoCanonico(atual);
}

function preencherSelectColaboradoresCargas() {
  const campo = $('cargaColaborador');
  if (!campo) return;
  const turno = turnoCanonico($('cargaTurnoFiltro')?.value || CONFIG.turno);
  const valorAtual = campo.value;
  const pessoas = pessoasAtivas()
    .filter((pessoa) => mesmoTurno(pessoa.turno, turno))
    .slice()
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

  campo.innerHTML = '<option value="">Selecione o colaborador</option>' + (
    pessoas.length
      ? pessoas.map((pessoa) => `<option value="${escaparHTML(pessoa.id)}">${escaparHTML(pessoa.nome)}</option>`).join('')
      : '<option value="" disabled>Nenhum colaborador neste turno</option>'
  );

  const pessoaAtual = colaboradorPorId(valorAtual);
  if (pessoaAtual && mesmoTurno(pessoaAtual.turno, turno)) campo.value = valorAtual;
}

function trocarTurnoCargas() {
  const turno = turnoCanonico($('cargaTurnoFiltro')?.value || CONFIG.turno);
  if ($('cargaTurnoFiltro')) $('cargaTurnoFiltro').value = turno;

  const pessoaAtual = colaboradorPorId($('cargaColaborador')?.value || '');
  if (pessoaAtual && !mesmoTurno(pessoaAtual.turno, turno)) $('cargaColaborador').value = '';

  preencherSelectColaboradoresCargas();
  preencherDadosCargaPorColaborador(true);
  salvarRascunhoCarga();
}
function diaDaDataCarga() {
  const data = $('cargaData')?.value || dataISOHoje();
  return Number(data.slice(-2)) || 1;
}

async function preencherDadosCargaPorColaborador(resetarSetorManual = false) {
  const pessoa = colaboradorPorId($('cargaColaborador')?.value || '');
  if (resetarSetorManual && $('cargaSetor')) { $('cargaSetor').dataset.manual = 'false'; $('editorSetorCarga').hidden = true; }
  if (!pessoa) {
    if ($('cargaTurno')) $('cargaTurno').value = '';
    if ($('cargaSetor')) { $('cargaSetor').value = ''; $('cargaSetor').dataset.auto = ''; }
    if ($('cargaTurnoInfo')) $('cargaTurnoInfo').textContent = 'Selecione um colaborador';
    if ($('cargaSetorInfo')) $('cargaSetorInfo').textContent = 'Selecione um colaborador';
    salvarRascunhoCarga(); return;
  }
  const dataCarga = $('cargaData')?.value || dataISOHoje();
  let posto = pessoa.dias[Math.max(0, Math.min(30, diaDaDataCarga() - 1))] || '';
  let origemPosto = '';
  if (dataEhSabado(dataCarga)) {
    const escalaHE = await carregarEscalaSabado(dataCarga, pessoa.turno, { incluirRascunho: false, silencioso: true });
    const itemHE = itemSabadoDoColaborador(escalaHE, pessoa.id);
    posto = itemHE?.posto || '';
    origemPosto = itemHE ? ' • Hora extra' : ' • Sem escala HE publicada';
  }
  const setorAuto = posto ? `${posto} - ${postoDescricao(posto)}` : '';
  const textoSetorAuto = posto ? `${setorAuto}${origemPosto}` : (dataEhSabado(dataCarga) ? 'Sem escala de hora extra publicada para este colaborador' : 'Sem posto definido');
  $('cargaTurno').value = pessoa.turno; $('cargaTurnoInfo').textContent = pessoa.turno; $('cargaSetor').dataset.auto = setorAuto;
  if ($('cargaSetor').dataset.manual !== 'true') { $('cargaSetor').value = setorAuto; $('cargaSetorInfo').textContent = textoSetorAuto; }
  if (!$('cargaRegistro').value && pessoa.registro) $('cargaRegistro').value = pessoa.registro;
  preencherOpcoesSetorManualCarga(); salvarRascunhoCarga();
}

function setoresCargasDisponiveis() {
  return postosDisponiveis().map((posto) => `${posto} - ${postoDescricao(posto)}`);
}

function preencherOpcoesSetorManualCarga() {
  const campo = $('cargaSetorManual');
  if (!campo) return;
  const atual = $('cargaSetor')?.value || '';
  const opcoes = setoresCargasDisponiveis();
  campo.innerHTML = '<option value="">Selecione o setor/posto</option>' + opcoes.map((opcao) => `<option value="${escaparHTML(opcao)}">${escaparHTML(opcao)}</option>`).join('');
  if (opcoes.includes(atual)) campo.value = atual;
}

function abrirEditorSetorCarga() {
  if (!colaboradorPorId($('cargaColaborador')?.value || '')) {
    msgCargas('Selecione o colaborador antes de editar o setor/posto.', 'erro');
    return;
  }
  preencherOpcoesSetorManualCarga();
  $('editorSetorCarga').hidden = false;
}

function aplicarSetorManualCarga() {
  const setor = $('cargaSetorManual')?.value || '';
  if (!setor) {
    msgCargas('Selecione o setor/posto que será lançado.', 'erro');
    return;
  }
  $('cargaSetor').value = setor;
  $('cargaSetor').dataset.manual = 'true';
  $('cargaSetorInfo').textContent = `${setor} (editado)`;
  $('editorSetorCarga').hidden = true;
  salvarRascunhoCarga();
  toast('Setor alterado somente para este lançamento.', 'info');
}

function restaurarSetorAutomaticoCarga() {
  const setor = $('cargaSetor')?.dataset.auto || '';
  $('cargaSetor').value = setor;
  $('cargaSetor').dataset.manual = 'false';
  $('cargaSetorInfo').textContent = setor || 'Sem posto definido';
  $('editorSetorCarga').hidden = true;
  salvarRascunhoCarga();
}

function gerarProtocoloCarga(registro) {
  const agora = new Date();
  const data = dataISOHoje().replaceAll('-', '');
  const hora = [agora.getHours(), agora.getMinutes(), agora.getSeconds()].map((valor) => String(valor).padStart(2, '0')).join('');
  const finalRegistro = String(registro || '').replace(/\D/g, '').slice(-4).padStart(4, '0');
  const aleatorio = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `FC-${data}-${hora}-${finalRegistro}-${aleatorio}`;
}

function dadosLancamentoCargaAtual() {
  const pessoa = colaboradorPorId($('cargaColaborador')?.value || '');
  const dataISO = $('cargaData')?.value || '';
  const registro = String($('cargaRegistro')?.value || '').trim();
  const quantidade = Number($('cargaQuantidade')?.value || 0);
  const turno = $('cargaTurno')?.value || pessoa?.turno || '';
  const setorPosto = $('cargaSetor')?.value || '';

  if (!pessoa) throw new Error('Selecione o colaborador.');
  if (!dataISO) throw new Error('Informe a data.');
  if (!registro) throw new Error('Informe o registro.');
  if (!Number.isInteger(quantidade) || quantidade <= 0) throw new Error('Informe uma quantidade inteira maior que zero.');
  if (!setorPosto) throw new Error('Informe o setor/posto.');

  return { pessoa, dataISO, registro, quantidade, turno, setorPosto };
}

function atualizarStatusEnvioCargas(info = null) {
  const campo = $('statusEnvioCargas');
  if (!campo) return;
  let dados = info;
  if (!dados) {
    try { dados = JSON.parse(localStorage.getItem(STORAGE.ultimoEnvio) || 'null'); } catch { dados = null; }
  }
  campo.innerHTML = dados
    ? `<span>Último envio</span><strong>${escaparHTML(dados.protocolo)} • ${escaparHTML(dados.dataEnvio)} às ${escaparHTML(dados.horaEnvio)}</strong>`
    : '<span>Último envio</span><strong>Nenhum envio realizado neste aparelho</strong>';
}

async function salvarPlanilhaCargas() {
  let dados;
  try {
    await preencherDadosCargaPorColaborador(false);
    dados = dadosLancamentoCargaAtual();
  } catch (erro) {
    msgCargas(erro.message, 'erro');
    toast(erro.message, 'erro');
    return;
  }

  const assinatura = [dados.dataISO, dados.pessoa.id, dados.registro, dados.turno, dados.setorPosto, dados.quantidade].join('|');
  const recente = historicoCargasLocal().find((item) => item.assinatura === assinatura && Date.now() - new Date(item.criadoEm).getTime() < 10 * 60 * 1000);
  if (recente && !confirm('Um lançamento idêntico foi registrado nos últimos 10 minutos. Deseja enviar novamente?')) return;

  setLoadingBotao('btnSalvarCargas', true, 'Salvando...');
  const agora = new Date();
  const protocolo = gerarProtocoloCarga(dados.registro);
  const dataEnvio = formatarDataBR(dataISOHoje());
  const horaEnvio = agora.toLocaleTimeString('pt-BR', { hour12: false });
  const payload = {
    acao: 'salvarFechamento',
    equipe: APP.equipe || CONFIG.equipe,
    protocolo,
    data: formatarDataBR(dados.dataISO),
    dataISO: dados.dataISO,
    colaborador: dados.pessoa.nome,
    colaboradorId: dados.pessoa.id,
    registro: dados.registro,
    turno: dados.turno,
    setorPosto: dados.setorPosto,
    quantidade: String(dados.quantidade),
    dataEnvio,
    horaEnvio
  };

  try {
    const envio = await apiPost(payload);
    dados.pessoa.registro = dados.registro;
    const registroLocal = {
      ...payload,
      quantidade: dados.quantidade,
      assinatura,
      criadoEm: agora.toISOString(),
      statusEnvio: envio.enfileirado ? 'Pendente' : 'Enviado'
    };
    salvarHistoricoCarga(registroLocal);
    salvarCacheMes();
    localStorage.setItem(STORAGE.ultimoEnvio, JSON.stringify({ protocolo, dataEnvio, horaEnvio }));
    atualizarStatusEnvioCargas({ protocolo, dataEnvio, horaEnvio });
    atualizarFilaOfflineInfo();
    $('cargaQuantidade').value = '';
    salvarRascunhoCarga();

    if (envio.enfileirado) {
      msgCargas(`Sem internet. O lançamento ${protocolo} ficou salvo e será enviado automaticamente.`, 'aviso');
      toast('Lançamento salvo na fila offline.', 'aviso');
    } else {
      mostrarModalSalvamento({ protocolo, dataEnvio, horaEnvio });
      msgCargas(`Registro encaminhado para a planilha. Protocolo: ${protocolo}`);
      toast('Fechamento salvo com sucesso.', 'ok');
    }
  } catch (erro) {
    msgCargas(`Não foi possível salvar: ${erro.message}`, 'erro');
    toast('Falha ao salvar o fechamento.', 'erro');
  } finally {
    setLoadingBotao('btnSalvarCargas', false);
  }
}

function mostrarModalSalvamento(info) {
  $('modalSalvoMensagem').textContent = `Registro enviado. Protocolo: ${info.protocolo}. Horário: ${info.horaEnvio}.`;
  $('modalSalvoPlanilha').hidden = false;
}

function fecharModalSalvamento() {
  $('modalSalvoPlanilha').hidden = true;
  $('cargaQuantidade')?.focus();
}

function prepararModuloCargas() {
  preencherSelectTurnosCargas();
  preencherSelectColaboradoresCargas();
  if ($('cargaData') && !$('cargaData').value) $('cargaData').value = dataISOHoje();
  preencherDadosCargaPorColaborador(false);
  atualizarStatusEnvioCargas();
  atualizarFilaOfflineInfo();
}

/* =========================
   Administração
   ========================= */
async function sha256(texto) {
  const dados = new TextEncoder().encode(texto);
  const hash = await crypto.subtle.digest('SHA-256', dados);
  return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function estadoTentativasAdmin() {
  try { return JSON.parse(localStorage.getItem(STORAGE.tentativasAdmin) || '{"falhas":0,"bloqueadoAte":0}'); } catch { return { falhas: 0, bloqueadoAte: 0 }; }
}

function salvarTentativasAdmin(estado) {
  localStorage.setItem(STORAGE.tentativasAdmin, JSON.stringify(estado));
}

async function entrarAdmin() {
  const senha = $('senhaAdmin')?.value.trim() || '';
  const estado = estadoTentativasAdmin();
  if (estado.bloqueadoAte > Date.now()) {
    const minutos = Math.ceil((estado.bloqueadoAte - Date.now()) / 60000);
    $('msgAdminLogin').textContent = `Acesso bloqueado temporariamente. Tente novamente em ${minutos} minuto(s).`;
    $('msgAdminLogin').className = 'msg erro';
    return;
  }
  if (!senha) {
    $('msgAdminLogin').textContent = 'Digite a senha.';
    $('msgAdminLogin').className = 'msg erro';
    return;
  }

  setLoadingBotao('btnEntrarAdmin', true, 'Verificando...');
  try {
    const hash = await sha256(senha);
    const esperado = (APP.adminHashPartes || []).join('');
    if (hash !== esperado) {
      estado.falhas = Number(estado.falhas || 0) + 1;
      if (estado.falhas >= 5) {
        estado.falhas = 0;
        estado.bloqueadoAte = Date.now() + 5 * 60 * 1000;
      }
      salvarTentativasAdmin(estado);
      throw new Error('Senha incorreta.');
    }

    salvarTentativasAdmin({ falhas: 0, bloqueadoAte: 0 });
    adminSenhaSessao = senha;
    $('adminLogin').hidden = true;
    $('areaAdmin').hidden = false;
    $('senhaAdmin').value = '';
    $('msgAdminLogin').textContent = '';
    preencherSelectsAdmin();
    toast('Administração liberada.', 'ok');
  } catch (erro) {
    $('msgAdminLogin').textContent = erro.message;
    $('msgAdminLogin').className = 'msg erro';
  } finally {
    setLoadingBotao('btnEntrarAdmin', false);
  }
}

function sairAdmin() {
  adminSenhaSessao = '';
  $('areaAdmin').hidden = true;
  $('adminLogin').hidden = false;
  toast('Sessão administrativa encerrada.', 'info');
}

function exigirAdmin() {
  if (!adminSenhaSessao) {
    msgAdmin('Entre novamente na administração.', 'erro');
    return false;
  }
  return true;
}

function preencherSelectsAdmin() {
  if (!$('adminColaborador')) return;
  const pessoas = pessoasAtivas().slice().sort((a, b) => `${a.turno}${a.nome}`.localeCompare(`${b.turno}${b.nome}`, 'pt-BR'));
  const opcoes = pessoas.map((pessoa) => `<option value="${escaparHTML(pessoa.id)}">${escaparHTML(pessoa.nome)} • ${escaparHTML(pessoa.turno)}</option>`).join('');
  const turnos = turnosDisponiveis().map((turno) => `<option value="${escaparHTML(turno)}">${escaparHTML(turno)}</option>`).join('');
  const colaboradorSelecionado = $('colaboradorEditar')?.value || '';
  const postoSelecionado = $('postoEditar')?.value || '';

  $('novoTurno').innerHTML = turnos;
  if ($('turnoEscalaSabado')) {
    const turnoAtualHE = $('turnoEscalaSabado').value || $('selectTurnoConsulta')?.value || CONFIG.turno;
    $('turnoEscalaSabado').innerHTML = turnos;
    $('turnoEscalaSabado').value = turnosDisponiveis().includes(turnoAtualHE) ? turnoAtualHE : CONFIG.turno;
  }

  $('colaboradorEditar').innerHTML = '<option value="">Selecione um colaborador</option>' + opcoes;
  if (pessoas.some((pessoa) => pessoa.id === colaboradorSelecionado)) $('colaboradorEditar').value = colaboradorSelecionado;

  $('adminColaborador').innerHTML = opcoes || '<option value="">Nenhum colaborador</option>';
  $('substituirOrigem').innerHTML = opcoes || '<option value="">Nenhum colaborador</option>';
  $('substituirDestino').innerHTML = opcoes || '<option value="">Nenhum colaborador</option>';
  $('substituirDia').innerHTML = diasDisponiveis().map((dia) => `<option value="${dia}">Dia ${String(dia).padStart(2, '0')}</option>`).join('');

  const postos = postosDisponiveis([]);
  $('postoEditar').innerHTML = '<option value="">Selecione um posto</option>' + postos.map((posto) => `<option value="${escaparHTML(posto)}">${escaparHTML(posto)} - ${escaparHTML(postoDescricao(posto))}</option>`).join('');
  if (postos.includes(postoSelecionado)) $('postoEditar').value = postoSelecionado;

  montarGradeDiasAdmin();
  carregarEscala();
  analisarConflitos();
  prepararEditorEscalaSabado();
  selecionarModoColaborador(modoColaboradorAdmin, { preservarSelecao: true });
  selecionarModoPosto(modoPostoAdmin, { preservarSelecao: true });
}

function marcarModoAtivo(containerId, modo) {
  const container = $(containerId);
  if (!container) return;
  container.querySelectorAll('[data-modo]').forEach((botao) => {
    const ativo = botao.dataset.modo === modo;
    botao.classList.toggle('ativo', ativo);
    botao.setAttribute('aria-pressed', String(ativo));
  });
}

function limparCamposColaboradorAdmin() {
  if ($('novoNome')) $('novoNome').value = '';
  if ($('novoRegistro')) $('novoRegistro').value = '';
  if ($('novoTurno')) $('novoTurno').value = $('selectTurnoConsulta')?.value || CONFIG.turno;
}

function limparCamposPostoAdmin() {
  if ($('novoCodigoPosto')) $('novoCodigoPosto').value = '';
  if ($('novaLocalizacao')) $('novaLocalizacao').value = '';
  if ($('novoSetor')) $('novoSetor').value = '';
}

function selecionarModoColaborador(modo = 'adicionar', { preservarSelecao = false } = {}) {
  const modosValidos = ['adicionar', 'editar', 'excluir'];
  modoColaboradorAdmin = modosValidos.includes(modo) ? modo : 'adicionar';
  marcarModoAtivo('modosColaborador', modoColaboradorAdmin);

  const selecionando = modoColaboradorAdmin !== 'adicionar';
  if ($('selecaoColaboradorAdmin')) $('selecaoColaboradorAdmin').hidden = !selecionando;
  if ($('camposColaboradorAdmin')) $('camposColaboradorAdmin').hidden = modoColaboradorAdmin === 'excluir';
  if ($('acaoSalvarColaborador')) $('acaoSalvarColaborador').hidden = modoColaboradorAdmin === 'excluir';
  if ($('acaoExcluirColaborador')) $('acaoExcluirColaborador').hidden = modoColaboradorAdmin !== 'excluir';

  const ajuda = $('ajudaModoColaborador');
  const botaoSalvar = $('btnSalvarColaboradorAdmin');
  if (modoColaboradorAdmin === 'adicionar') {
    if ($('colaboradorEditar')) $('colaboradorEditar').value = '';
    limparCamposColaboradorAdmin();
    if (ajuda) ajuda.textContent = 'Preencha os dados para cadastrar um novo colaborador.';
    if (botaoSalvar) botaoSalvar.textContent = 'Adicionar colaborador';
    return;
  }

  if (!preservarSelecao && $('colaboradorEditar')) $('colaboradorEditar').value = '';
  if (!$('colaboradorEditar')?.value) {
    const primeiraOpcao = Array.from($('colaboradorEditar')?.options || []).find((opcao) => opcao.value);
    if (primeiraOpcao) $('colaboradorEditar').value = primeiraOpcao.value;
  }
  carregarColaboradorAdmin();

  if (modoColaboradorAdmin === 'editar') {
    if (ajuda) ajuda.textContent = 'Escolha um colaborador, altere os dados e salve.';
    if (botaoSalvar) botaoSalvar.textContent = 'Salvar alterações';
  } else if (ajuda) {
    ajuda.textContent = 'Escolha o colaborador que será removido definitivamente do cadastro e da escala fixa.';
  }
}

function mostrarBlocoAdmin(elemento, mostrar) {
  if (!elemento) return;
  elemento.hidden = !mostrar;
  if (mostrar) {
    elemento.removeAttribute('hidden');
    elemento.style.removeProperty('display');
  } else {
    elemento.setAttribute('hidden', '');
  }
}

function listaCodigosPostosAdmin() {
  return Object.entries(LEGENDA || {})
    .filter(([codigo, info]) => String(codigo || '').trim() && info?.ativo !== false)
    .map(([codigo]) => String(codigo).trim())
    .sort((a, b) => a.localeCompare(b, 'pt-BR', { numeric: true }));
}

function preencherListaPostosAdmin({ preservarSelecao = true } = {}) {
  const campo = $('postoEditar');
  if (!campo) return [];

  const selecaoAnterior = preservarSelecao ? String(campo.value || '') : '';
  const postos = listaCodigosPostosAdmin();
  campo.innerHTML = '<option value="">Selecione um posto</option>' + postos
    .map((codigo) => `<option value="${escaparHTML(codigo)}">${escaparHTML(codigo)} - ${escaparHTML(postoDescricao(codigo))}</option>`)
    .join('');

  if (selecaoAnterior && postos.includes(selecaoAnterior)) campo.value = selecaoAnterior;
  return postos;
}

function selecionarModoPosto(modo = 'adicionar', { preservarSelecao = false } = {}) {
  const modosValidos = ['adicionar', 'editar', 'excluir'];
  modoPostoAdmin = modosValidos.includes(modo) ? modo : 'adicionar';
  marcarModoAtivo('modosPosto', modoPostoAdmin);

  const selecao = $('selecaoPostoAdmin');
  const campos = $('camposPostoAdmin');
  const acaoSalvar = $('acaoSalvarPosto');
  const acaoExcluir = $('acaoExcluirPosto');
  const ajuda = $('ajudaModoPosto');
  const botaoSalvar = $('btnSalvarPostoAdmin');
  const campoLista = $('postoEditar');

  if (modoPostoAdmin === 'adicionar') {
    mostrarBlocoAdmin(selecao, false);
    mostrarBlocoAdmin(campos, true);
    mostrarBlocoAdmin(acaoSalvar, true);
    mostrarBlocoAdmin(acaoExcluir, false);
    if (campoLista) campoLista.value = '';
    limparCamposPostoAdmin();
    if (ajuda) ajuda.textContent = 'Preencha o código, a localização e o setor do novo posto.';
    if (botaoSalvar) botaoSalvar.textContent = 'Adicionar posto';
    $('novoCodigoPosto')?.focus({ preventScroll: true });
    return;
  }

  const postos = preencherListaPostosAdmin({ preservarSelecao });
  mostrarBlocoAdmin(selecao, true);
  mostrarBlocoAdmin(campos, modoPostoAdmin === 'editar');
  mostrarBlocoAdmin(acaoSalvar, modoPostoAdmin === 'editar');
  mostrarBlocoAdmin(acaoExcluir, modoPostoAdmin === 'excluir');

  if (!postos.length) {
    if (campoLista) campoLista.value = '';
    limparCamposPostoAdmin();
    if (ajuda) ajuda.textContent = 'Nenhum posto ativo foi encontrado. Use Adicionar para cadastrar um novo posto.';
    return;
  }

  if (!campoLista?.value || !postos.includes(campoLista.value)) campoLista.value = postos[0];
  carregarPostoAdmin();

  if (modoPostoAdmin === 'editar') {
    if (ajuda) ajuda.textContent = 'Escolha um posto na lista, altere o código, a localização ou o setor e toque em Salvar alterações.';
    if (botaoSalvar) botaoSalvar.textContent = 'Salvar alterações';
  } else if (ajuda) {
    ajuda.textContent = 'Escolha o posto que será removido definitivamente. As posições dele serão limpas da escala fixa.';
  }

  requestAnimationFrame(() => {
    campoLista?.focus({ preventScroll: true });
    selecao?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
}

function abrirModoPostoAdmin(modo) {
  selecionarModoPosto(modo, { preservarSelecao: false });
}

function carregarColaboradorAdmin() {
  const pessoa = colaboradorPorId($('colaboradorEditar')?.value || '');
  if (!pessoa) {
    if (modoColaboradorAdmin !== 'adicionar') limparCamposColaboradorAdmin();
    return;
  }
  $('novoNome').value = pessoa.nome || '';
  $('novoRegistro').value = pessoa.registro || '';
  $('novoTurno').value = pessoa.turno || CONFIG.turno;
}

function carregarPostoAdmin() {
  const campo = $('postoEditar');
  const codigoSelecionado = String(campo?.value || '').trim();
  const codigo = Object.keys(LEGENDA || {}).find((item) => String(item).trim() === codigoSelecionado) || codigoSelecionado;
  const info = LEGENDA?.[codigo];

  if (!codigo || !info) {
    if (modoPostoAdmin !== 'adicionar') limparCamposPostoAdmin();
    return;
  }

  if ($('novoCodigoPosto')) $('novoCodigoPosto').value = codigo;
  if ($('novaLocalizacao')) $('novaLocalizacao').value = typeof info === 'string' ? info : (info.local || '');
  if ($('novoSetor')) $('novoSetor').value = typeof info === 'string' ? info : (info.setor || info.local || '');
}

function montarGradeDiasAdmin() {
  const campo = $('gradeDiasAdmin');
  if (!campo) return;
  const opcoesPostos = postosDisponiveis().map((posto) => `<option value="${escaparHTML(posto)}">${escaparHTML(posto)}</option>`).join('');
  const opcoesSituacoes = (typeof STATUS_ESCALA !== 'undefined' ? STATUS_ESCALA : []).map((item) => `<option value="${escaparHTML(item.codigo)}">${escaparHTML(item.descricao)}</option>`).join('');
  campo.innerHTML = diasDisponiveis().map((dia) => `
    <div class="dia-admin">
      <label for="diaAdmin_${dia}">${String(dia).padStart(2, '0')}</label>
      <select id="diaAdmin_${dia}">
        <option value="">Sem posto</option>
        <optgroup label="Postos">${opcoesPostos}</optgroup>
        <optgroup label="Situações">${opcoesSituacoes}</optgroup>
      </select>
    </div>`).join('');
}

function carregarEscala() {
  const pessoa = colaboradorPorId($('adminColaborador')?.value || '');
  diasDisponiveis().forEach((dia) => {
    const campo = $(`diaAdmin_${dia}`);
    if (campo) campo.value = pessoa?.dias[dia - 1] || '';
  });
}

async function salvarColaborador() {
  if (!exigirAdmin()) return;
  if (modoColaboradorAdmin === 'excluir') return;

  const editando = modoColaboradorAdmin === 'editar';
  const idSelecionado = editando ? ($('colaboradorEditar')?.value || '') : '';
  const nome = $('novoNome')?.value.trim().toUpperCase() || '';
  const registro = $('novoRegistro')?.value.trim() || '';
  const turno = $('novoTurno')?.value || CONFIG.turno;
  if (!nome) {
    msgAdmin('Informe o nome do colaborador.', 'erro');
    return;
  }

  let pessoa = editando ? colaboradorPorId(idSelecionado) : null;
  if (editando && !pessoa) {
    msgAdmin('Selecione o colaborador que deseja editar.', 'erro');
    return;
  }

  const duplicado = pessoasAtivas().some((item) => item.id !== pessoa?.id && item.nome === nome && mesmoTurno(item.turno, turno));
  if (duplicado) {
    msgAdmin('Esse colaborador já existe neste turno.', 'erro');
    return;
  }

  if (!pessoa) {
    pessoa = { id: criarId('col', `${nome}-${turno}`), nome, registro, turno, ativo: true, dias: Array(31).fill('') };
    ESCALA.push(pessoa);
  } else {
    pessoa.nome = nome;
    pessoa.registro = registro;
    pessoa.turno = turno;
    pessoa.ativo = true;
  }

  normalizarDadosAtuais();
  salvarCacheMes();
  atualizarInterfaceCompleta({ preservarAdmin: true });
  await apiPost({ acao: 'salvarColaborador', senha: adminSenhaSessao, mesAno: mesSelecionado, equipe: APP.equipe || CONFIG.equipe, colaborador: pessoa });

  if (editando) {
    modoColaboradorAdmin = 'editar';
    preencherSelectsAdmin();
    if ($('colaboradorEditar')) $('colaboradorEditar').value = pessoa.id;
    carregarColaboradorAdmin();
    msgAdmin(`Dados de ${nome} atualizados.`);
    toast('Colaborador atualizado.', 'ok');
  } else {
    selecionarModoColaborador('adicionar');
    msgAdmin(`Colaborador ${nome} adicionado.`);
    toast('Colaborador adicionado.', 'ok');
  }
}

async function excluirColaborador() {
  if (!exigirAdmin()) return;
  const pessoa = colaboradorPorId($('colaboradorEditar')?.value || '');
  if (!pessoa) {
    msgAdmin('Selecione um colaborador.', 'erro');
    return;
  }
  const aviso = `Excluir definitivamente ${pessoa.nome} do ${pessoa.turno}?\n\nO colaborador será removido do cadastro e da escala fixa. Registros antigos de cargas e sábados serão preservados.`;
  if (!confirm(aviso)) return;

  ESCALA = ESCALA.filter((item) => item.id !== pessoa.id);
  salvarCacheMes();
  atualizarInterfaceCompleta({ preservarAdmin: true });
  await apiPost({ acao: 'excluirColaborador', senha: adminSenhaSessao, colaboradorId: pessoa.id, equipe: APP.equipe || CONFIG.equipe });
  modoColaboradorAdmin = 'excluir';
  preencherSelectsAdmin();
  msgAdmin(`${pessoa.nome} foi excluído.`);
  toast('Colaborador excluído do cadastro.', 'ok');
}

async function salvarPosto() {
  if (!exigirAdmin()) return;
  if (modoPostoAdmin === 'excluir') return;

  const editando = modoPostoAdmin === 'editar';
  const codigoOriginal = editando ? ($('postoEditar')?.value || '') : '';
  const codigo = normalizarCodigoPosto($('novoCodigoPosto')?.value.trim().toUpperCase() || '');
  const local = $('novaLocalizacao')?.value.trim() || '';
  const setor = $('novoSetor')?.value.trim() || '';
  if (!codigo || !local) {
    msgAdmin('Informe o código e a localização.', 'erro');
    return;
  }
  if (editando && !codigoOriginal) {
    msgAdmin('Selecione o posto que deseja editar.', 'erro');
    return;
  }
  if (!editando && LEGENDA[codigo]?.ativo !== false) {
    msgAdmin('Esse código de posto já existe. Use a opção Editar.', 'erro');
    return;
  }
  if (editando && codigoOriginal !== codigo && LEGENDA[codigo]?.ativo !== false) {
    msgAdmin('Já existe outro posto com esse código.', 'erro');
    return;
  }

  if (codigoOriginal && codigoOriginal !== codigo) {
    const codigoAnterior = normalizarCodigoPosto(codigoOriginal);
    delete LEGENDA[codigoAnterior];
    ESCALA.forEach((pessoa) => {
      pessoa.dias = pessoa.dias.map((posto) => normalizarCodigoPosto(posto) === codigoAnterior ? codigo : posto);
    });
  }
  LEGENDA[codigo] = { local, setor: setor || local, ativo: true };
  salvarCacheMes();
  atualizarInterfaceCompleta({ preservarAdmin: true });
  await apiPost({ acao: 'salvarPosto', senha: adminSenhaSessao, equipe: APP.equipe || CONFIG.equipe, codigoOriginal, posto: { codigo, local, setor: setor || local, ativo: true } });

  if (editando) {
    modoPostoAdmin = 'editar';
    preencherSelectsAdmin();
    if ($('postoEditar')) $('postoEditar').value = codigo;
    carregarPostoAdmin();
    msgAdmin(`Posto ${codigo} atualizado.`);
    toast('Posto atualizado.', 'ok');
  } else {
    selecionarModoPosto('adicionar');
    msgAdmin(`Posto ${codigo} adicionado.`);
    toast('Posto adicionado.', 'ok');
  }
}

async function excluirPosto() {
  if (!exigirAdmin()) return;
  const codigo = normalizarCodigoPosto($('postoEditar')?.value || '');
  if (!codigo || !LEGENDA[codigo]) {
    msgAdmin('Selecione um posto.', 'erro');
    return;
  }
  const descricao = postoDescricao(codigo);
  const aviso = `Excluir definitivamente o posto ${codigo} — ${descricao}?\n\nO posto será removido do cadastro e todas as posições dele serão limpas da escala fixa. Registros antigos de cargas e sábados serão preservados.`;
  if (!confirm(aviso)) return;

  delete LEGENDA[codigo];
  ESCALA.forEach((pessoa) => {
    pessoa.dias = pessoa.dias.map((posto) => normalizarCodigoPosto(posto) === codigo ? '' : posto);
  });
  salvarCacheMes();
  atualizarInterfaceCompleta({ preservarAdmin: true });
  await apiPost({ acao: 'excluirPosto', senha: adminSenhaSessao, equipe: APP.equipe || CONFIG.equipe, codigo });
  modoPostoAdmin = 'excluir';
  preencherSelectsAdmin();
  msgAdmin(`Posto ${codigo} excluído.`);
  toast('Posto excluído do cadastro.', 'ok');
}

async function salvarEscala() {
  if (!exigirAdmin()) return;
  const pessoa = colaboradorPorId($('adminColaborador')?.value || '');
  if (!pessoa) {
    msgAdmin('Selecione um colaborador.', 'erro');
    return;
  }
  pessoa.dias = Array.from({ length: 31 }, (_, indice) => {
    const dia = indice + 1;
    return $(`diaAdmin_${dia}`)?.value || '';
  });
  salvarCacheMes();
  analisarConflitos();
  atualizarInterfaceCompleta({ preservarAdmin: true });
  await apiPost({ acao: 'salvarEscala', senha: adminSenhaSessao, equipe: APP.equipe || CONFIG.equipe, colaborador: pessoa });
  msgAdmin(`Escala de ${pessoa.nome} salva.`);
  toast('Escala salva.', 'ok');
}

async function substituirColaborador() {
  if (!exigirAdmin()) return;
  const origem = colaboradorPorId($('substituirOrigem')?.value || '');
  const destino = colaboradorPorId($('substituirDestino')?.value || '');
  const diaInicio = Number($('substituirDia')?.value || 1);
  if (!origem || !destino || origem.id === destino.id) {
    msgAdmin('Selecione dois colaboradores diferentes.', 'erro');
    return;
  }
  if (!confirm(`${destino.nome} assumirá os postos de ${origem.nome} a partir do dia ${String(diaInicio).padStart(2, '0')}. Continuar?`)) return;
  for (let indice = diaInicio - 1; indice < 31; indice += 1) {
    destino.dias[indice] = origem.dias[indice] || '';
    origem.dias[indice] = '';
  }
  salvarCacheMes();
  atualizarInterfaceCompleta({ preservarAdmin: true });
  await apiPost({
    acao: 'substituirColaborador', senha: adminSenhaSessao, equipe: APP.equipe || CONFIG.equipe,
    origemId: origem.id, destinoId: destino.id, diaInicio
  });
  msgAdmin(`${destino.nome} assumiu a escala a partir do dia ${String(diaInicio).padStart(2, '0')}.`);
}

async function sincronizarDadosComPlanilha() {
  if (!exigirAdmin()) return;
  const tamanhoEstimado = JSON.stringify({ escala: ESCALA, postos: LEGENDA }).length;
  if (tamanhoEstimado > 55000) {
    msgAdmin('Os dados ficaram grandes demais para um único envio. Salve as escalas individualmente.', 'erro');
    return;
  }
  await apiPost({ acao: 'sincronizarTudo', senha: adminSenhaSessao, equipe: APP.equipe || CONFIG.equipe, postos: LEGENDA, escala: ESCALA });
  msgAdmin('Sincronização completa encaminhada para a planilha.');
  toast('Dados enviados para sincronização.', 'ok');
}

function analisarConflitos() {
  const campo = $('conflitosEscala');
  if (!campo) return;
  const conflitos = [];
  const ocupacao = new Map();
  pessoasAtivas().forEach((pessoa) => {
    pessoa.dias.slice(0, diasNoMes()).forEach((posto, indice) => {
      if (!posto || SITUACOES.has(posto) || ['Pens.', 'Ilha'].includes(posto)) return;
      const chave = `${pessoa.turno}|${indice + 1}|${posto}`;
      if (!ocupacao.has(chave)) ocupacao.set(chave, []);
      ocupacao.get(chave).push(pessoa.nome);
    });
  });
  ocupacao.forEach((nomes, chave) => {
    if (nomes.length < 2) return;
    const [turno, dia, posto] = chave.split('|');
    conflitos.push(`Dia ${String(dia).padStart(2, '0')} • ${turno} • posto ${posto}: ${nomes.join(' e ')}`);
  });
  campo.innerHTML = conflitos.length
    ? conflitos.slice(0, 15).map((texto) => `<div class="conflito-item">${escaparHTML(texto)}</div>`).join('') + (conflitos.length > 15 ? `<div class="conflito-item">E mais ${conflitos.length - 15} possível(is) conflito(s).</div>` : '')
    : '<div class="conflito-ok">Nenhuma duplicidade de posto encontrada na escala.</div>';
}

/* =========================
   Administração da escala de sábado / HE
   ========================= */
function prepararEditorEscalaSabado() {
  if (!$('dataEscalaSabado') || !$('turnoEscalaSabado')) return;
  if (!$('dataEscalaSabado').value) $('dataEscalaSabado').value = proximoSabadoISO(true);
  if (!$('turnoEscalaSabado').value) $('turnoEscalaSabado').value = CONFIG.turno;
  const chave = chaveEscalaSabado($('dataEscalaSabado').value, $('turnoEscalaSabado').value);
  if ($('listaEscalaSabado')?.dataset.chave === chave && $('listaEscalaSabado').children.length) return;
  carregarEditorEscalaSabado(false);
}

function validarDataEscalaSabado() {
  const dataISO = $('dataEscalaSabado')?.value || '';
  if (!dataISO) throw new Error('Escolha a data do sábado.');
  if (!dataEhSabado(dataISO)) throw new Error('A data escolhida não é um sábado.');
  return dataISO;
}

function definirStatusEscalaSabado(status) {
  const campo = $('statusEscalaSabado');
  if (!campo) return;
  const valor = String(status || 'VAZIA').toUpperCase();
  campo.className = `status-he ${valor === 'PUBLICADA' ? 'publicada' : valor === 'RASCUNHO' ? 'rascunho' : 'vazia'}`;
  campo.textContent = valor === 'PUBLICADA' ? 'Publicada' : valor === 'RASCUNHO' ? 'Rascunho' : 'Não cadastrada';
}

function opcoesPostosHE(postoAtual = '') {
  return '<option value="">Selecione o posto</option>' + postosDisponiveis([])
    .map((posto) => `<option value="${escaparHTML(posto)}" ${posto === postoAtual ? 'selected' : ''}>${escaparHTML(posto)} - ${escaparHTML(postoDescricao(posto))}</option>`)
    .join('');
}

function renderizarPostosNecessariosSabado(escala = null) {
  const campo = $('postosNecessariosSabado');
  if (!campo) return;
  if (!postosNecessariosSabadoEditor.size && escala?.itens?.length) {
    escala.itens.forEach((item) => { if (item.posto) postosNecessariosSabadoEditor.add(item.posto); });
  }
  const postos = postosDisponiveis([]);
  campo.innerHTML = postos.length ? postos.map((posto) => `
    <label class="posto-necessario-he ${postosNecessariosSabadoEditor.has(posto) ? 'selecionado' : ''}">
      <input type="checkbox" data-posto-he="${escaparHTML(posto)}" ${postosNecessariosSabadoEditor.has(posto) ? 'checked' : ''} onchange="atualizarPostosNecessariosSabado()" />
      <span><strong>${escaparHTML(posto)}</strong><small>${escaparHTML(postoDescricao(posto))}</small></span>
    </label>`).join('') : '<div class="resultado-vazio">Nenhum posto ativo cadastrado.</div>';
}

function atualizarPostosNecessariosSabado() {
  postosNecessariosSabadoEditor = new Set([...document.querySelectorAll('#postosNecessariosSabado [data-posto-he]:checked')].map((campo) => campo.dataset.postoHe));
  document.querySelectorAll('#postosNecessariosSabado .posto-necessario-he').forEach((item) => {
    item.classList.toggle('selecionado', Boolean(item.querySelector('input')?.checked));
  });
  atualizarResumoSabado();
}

function marcarPostosNecessariosSabado(marcar) {
  document.querySelectorAll('#postosNecessariosSabado [data-posto-he]').forEach((campo) => { campo.checked = Boolean(marcar); });
  atualizarPostosNecessariosSabado();
}

function textoHistoricoSabado(estatistica) {
  if (!historicoSabadoDisponivel) return 'Histórico indisponível sem conexão';
  const ultimo = estatistica.ultimoSabado ? formatarDataBR(estatistica.ultimoSabado) : 'nenhum';
  const sequencia = estatistica.consecutivos ? ` • ${estatistica.consecutivos} consecutivo(s)` : '';
  return `Ano: ${estatistica.totalAno} • 90 dias: ${estatistica.total90Dias} • Total: ${estatistica.totalGeral} • Último: ${ultimo}${sequencia}`;
}

function renderizarEditorEscalaSabado(escala = null) {
  const turno = turnoCanonico($('turnoEscalaSabado')?.value || CONFIG.turno);
  const pessoas = pessoasAtivas().filter((pessoa) => mesmoTurno(pessoa.turno, turno))
    .slice().sort((a, b) => {
      const ea = estatisticaDoColaboradorSabado(a.id);
      const eb = estatisticaDoColaboradorSabado(b.id);
      return ea.totalAno - eb.totalAno
        || ea.total90Dias - eb.total90Dias
        || ea.consecutivos - eb.consecutivos
        || ea.totalGeral - eb.totalGeral
        || a.nome.localeCompare(b.nome, 'pt-BR');
    });
  const mapa = new Map((escala?.itens || []).map((item) => [item.colaboradorId, item]));
  const lista = $('listaEscalaSabado');
  if (!lista) return;
  renderizarPostosNecessariosSabado(escala);
  lista.innerHTML = pessoas.length ? pessoas.map((pessoa, indice) => {
    const item = mapa.get(pessoa.id);
    const selecionado = Boolean(item);
    const estatistica = estatisticaDoColaboradorSabado(pessoa.id);
    const postoFixo = pessoa.dias[diaDoMesDaData($('dataEscalaSabado')?.value || '') - 1] || '';
    const sugestaoFixa = postoFixo && !SITUACOES.has(postoFixo) ? ` • Fixo: ${postoFixo}` : '';
    return `<div class="linha-he ${selecionado ? '' : 'inativa'}" data-colaborador-id="${escaparHTML(pessoa.id)}">
      <input class="check-he participante-he" id="participanteHE_${indice}" type="checkbox" ${selecionado ? 'checked' : ''} onchange="atualizarResumoSabado()" aria-label="Incluir ${escaparHTML(pessoa.nome)}" />
      <label class="pessoa-he" for="participanteHE_${indice}"><strong>${escaparHTML(pessoa.nome)}</strong><small>${escaparHTML(pessoa.registro || 'Registro não cadastrado')} • ${escaparHTML(pessoa.turno)}${escaparHTML(sugestaoFixa)}</small><span class="historico-colaborador-he">${escaparHTML(textoHistoricoSabado(estatistica))}</span></label>
      <select class="posto-campo-he posto-he" onchange="atualizarResumoSabado()">${opcoesPostosHE(item?.posto || '')}</select>
      <input class="observacao-campo-he observacao-he-input" type="text" value="${escaparHTML(item?.observacao || '')}" placeholder="Observação opcional" oninput="atualizarResumoSabado()" />
    </div>`;
  }).join('') : '<div class="resultado-vazio">Nenhum colaborador ativo neste turno.</div>';
  lista.dataset.chave = chaveEscalaSabado($('dataEscalaSabado')?.value || '', turno);
  definirStatusEscalaSabado(escala?.status || 'VAZIA');
  atualizarResumoSabado();
}

async function carregarEditorEscalaSabado(forcar = true) {
  if (!exigirAdmin()) return;
  let dataISO;
  try { dataISO = validarDataEscalaSabado(); }
  catch (erro) {
    msgAdmin(erro.message, 'erro');
    definirStatusEscalaSabado('VAZIA');
    if ($('listaEscalaSabado')) $('listaEscalaSabado').innerHTML = `<div class="resultado-vazio">${escaparHTML(erro.message)}</div>`;
    return;
  }

  const turno = turnoCanonico($('turnoEscalaSabado')?.value || CONFIG.turno);
  if ($('turnoEscalaSabado')) $('turnoEscalaSabado').value = turno;
  const requisicaoAtual = ++requisicaoSabadoEditor;
  carregandoSabado = true;

  // Mostra os colaboradores imediatamente, sem depender da resposta da planilha.
  const escalaCache = obterCacheEscalaSabado(dataISO, turno);
  const cacheHistorico = lerCacheEstatisticasSabado()[chaveEstatisticasSabado(dataISO, turno)];
  escalaSabadoEditor = escalaCache || normalizarEscalaSabado({}, dataISO, turno);
  historicoSabadoDisponivel = Boolean(cacheHistorico);
  estatisticasSabadoEditor = new Map(
    normalizarEstatisticasSabado(cacheHistorico || {}).map((item) => [item.colaboradorId, item])
  );
  postosNecessariosSabadoEditor = new Set((escalaSabadoEditor.itens || []).map((item) => item.posto).filter(Boolean));
  renderizarEditorEscalaSabado(escalaSabadoEditor);

  try {
    const [escala, resultadoHistorico] = await Promise.all([
      carregarEscalaSabado(dataISO, turno, { forcar, incluirRascunho: true, silencioso: false }),
      carregarEstatisticasSabado(dataISO, turno, { forcar, silencioso: false })
    ]);

    // Ignora uma resposta antiga quando o usuário já selecionou outro turno ou data.
    if (requisicaoAtual !== requisicaoSabadoEditor) return;

    escalaSabadoEditor = escala;
    historicoSabadoDisponivel = Boolean(resultadoHistorico.disponivel);
    estatisticasSabadoEditor = new Map(resultadoHistorico.itens.map((item) => [item.colaboradorId, item]));
    postosNecessariosSabadoEditor = new Set((escala?.itens || []).map((item) => item.posto).filter(Boolean));
    renderizarEditorEscalaSabado(escalaSabadoEditor);
  } catch (erro) {
    if (requisicaoAtual === requisicaoSabadoEditor) {
      renderizarEditorEscalaSabado(escalaSabadoEditor);
      msgAdmin(`A lista foi carregada com os dados do aparelho, mas o histórico não pôde ser atualizado: ${erro.message}`, 'aviso');
    }
  } finally {
    if (requisicaoAtual === requisicaoSabadoEditor) carregandoSabado = false;
  }
}

function linhasEditorSabado() {
  return [...document.querySelectorAll('#listaEscalaSabado .linha-he')];
}

function coletarItensEscalaSabado({ validar = false } = {}) {
  const turno = $('turnoEscalaSabado')?.value || CONFIG.turno;
  const itens = [];
  const erros = [];
  linhasEditorSabado().forEach((linha) => {
    const marcado = linha.querySelector('.participante-he')?.checked;
    linha.classList.toggle('inativa', !marcado);
    if (!marcado) return;
    const pessoa = colaboradorPorId(linha.dataset.colaboradorId || '');
    const posto = linha.querySelector('.posto-he')?.value || '';
    const observacao = linha.querySelector('.observacao-he-input')?.value.trim() || '';
    if (!pessoa) return;
    if (!posto) erros.push(`${pessoa.nome} está sem posto.`);
    itens.push({ colaboradorId: pessoa.id, nome: pessoa.nome, registro: pessoa.registro || '', turno, posto, observacao });
  });
  if (validar && erros.length) throw new Error(erros[0]);
  return itens;
}

function conflitosDosItensSabado(itens) {
  const conflitos = [];
  const ocupacao = new Map();
  itens.forEach((item) => {
    if (!item.posto) return;
    if (!ocupacao.has(item.posto)) ocupacao.set(item.posto, []);
    ocupacao.get(item.posto).push(item.nome);
  });
  ocupacao.forEach((nomes, posto) => {
    if (nomes.length > 1) conflitos.push(`Posto ${posto}: ${nomes.join(' e ')}.`);
  });
  return conflitos;
}

function atualizarResumoSabado() {
  const itens = coletarItensEscalaSabado();
  const semPosto = itens.filter((item) => !item.posto).length;
  const conflitos = conflitosDosItensSabado(itens);
  const quantidadePostos = postosNecessariosSabadoEditor.size;
  if ($('resumoEscalaSabado')) $('resumoEscalaSabado').textContent = `${itens.length} colaborador(es) selecionado(s) • ${quantidadePostos} posto(s) necessário(s) • ${semPosto} sem posto • ${conflitos.length} possível(is) conflito(s)`;
  const campo = $('conflitosSabado');
  if (campo) {
    const avisos = [];
    if (semPosto) avisos.push(`${semPosto} colaborador(es) selecionado(s) ainda estão sem posto.`);
    avisos.push(...conflitos);
    campo.innerHTML = avisos.length
      ? avisos.map((texto) => `<div class="conflito-item">${escaparHTML(texto)}</div>`).join('')
      : '<div class="conflito-ok">Escala de sábado sem conflito aparente.</div>';
  }
}

function marcarTodosSabado(marcar) {
  linhasEditorSabado().forEach((linha) => {
    const campo = linha.querySelector('.participante-he');
    if (campo) campo.checked = Boolean(marcar);
  });
  atualizarResumoSabado();
}

function preencherPostosEscalaFixaSabado() {
  let dataISO;
  try { dataISO = validarDataEscalaSabado(); } catch (erro) { msgAdmin(erro.message, 'erro'); return; }
  const dia = diaDoMesDaData(dataISO);
  const turno = $('turnoEscalaSabado')?.value || CONFIG.turno;
  const postos = new Set();
  pessoasAtivas().filter((pessoa) => mesmoTurno(pessoa.turno, turno)).forEach((pessoa) => {
    const posto = pessoa?.dias[dia - 1] || '';
    if (posto && !SITUACOES.has(posto)) postos.add(posto);
  });
  postosNecessariosSabadoEditor = postos;
  renderizarPostosNecessariosSabado(escalaSabadoEditor);
  atualizarResumoSabado();
  toast(`${postos.size} posto(s) necessário(s) carregado(s) com base na escala fixa do dia ${String(dia).padStart(2, '0')}.`, 'info');
}

function pontuacaoCandidatoSabado(pessoa, posto, dataISO, linha) {
  const estatistica = estatisticaDoColaboradorSabado(pessoa.id);
  const postoFixo = pessoa.dias[diaDoMesDaData(dataISO) - 1] || '';
  const postoAtual = linha?.querySelector('.posto-he')?.value || '';
  let pontos = estatistica.totalAno * 10000
    + estatistica.total90Dias * 1000
    + estatistica.consecutivos * 200
    + estatistica.totalGeral * 10;
  if (postoFixo === posto) pontos -= 120;
  if (postoAtual === posto) pontos -= 40;
  if (estatistica.ultimoPosto === posto) pontos += 25;
  return pontos;
}

function montarEscalaSabadoAutomaticamente() {
  if (!exigirAdmin()) return;
  let dataISO;
  try { dataISO = validarDataEscalaSabado(); } catch (erro) { msgAdmin(erro.message, 'erro'); return; }
  if (!historicoSabadoDisponivel) {
    msgAdmin('O histórico de sábados não está disponível. Conecte-se à internet e carregue novamente antes de usar a montagem automática.', 'erro');
    return;
  }
  atualizarPostosNecessariosSabado();
  const postos = [...postosNecessariosSabadoEditor];
  if (!postos.length) {
    msgAdmin('Selecione os postos necessários antes de montar automaticamente.', 'erro');
    return;
  }
  const linhas = linhasEditorSabado();
  const disponiveis = linhas.filter((linha) => linha.querySelector('.participante-he')?.checked)
    .map((linha) => ({ linha, pessoa: colaboradorPorId(linha.dataset.colaboradorId || '') }))
    .filter((item) => item.pessoa);
  if (!disponiveis.length) {
    msgAdmin('Marque os colaboradores disponíveis para a hora extra.', 'erro');
    return;
  }
  if (postos.length > disponiveis.length) {
    msgAdmin(`Existem ${postos.length} postos, mas somente ${disponiveis.length} colaborador(es) disponível(is).`, 'erro');
    return;
  }

  const candidatosRestantes = [...disponiveis];
  const postosOrdenados = postos.slice().sort((a, b) => {
    const correspondenciasA = candidatosRestantes.filter(({ pessoa }) => pessoa.dias[diaDoMesDaData(dataISO) - 1] === a).length;
    const correspondenciasB = candidatosRestantes.filter(({ pessoa }) => pessoa.dias[diaDoMesDaData(dataISO) - 1] === b).length;
    return correspondenciasA - correspondenciasB || a.localeCompare(b, 'pt-BR');
  });
  const atribuicoes = [];
  postosOrdenados.forEach((posto) => {
    candidatosRestantes.sort((a, b) => {
      const diferenca = pontuacaoCandidatoSabado(a.pessoa, posto, dataISO, a.linha) - pontuacaoCandidatoSabado(b.pessoa, posto, dataISO, b.linha);
      return diferenca || a.pessoa.nome.localeCompare(b.pessoa.nome, 'pt-BR');
    });
    const escolhido = candidatosRestantes.shift();
    if (escolhido) atribuicoes.push({ ...escolhido, posto });
  });

  linhas.forEach((linha) => {
    const checkbox = linha.querySelector('.participante-he');
    const select = linha.querySelector('.posto-he');
    if (checkbox) checkbox.checked = false;
    if (select) select.value = '';
  });
  atribuicoes.forEach(({ linha, posto }) => {
    const checkbox = linha.querySelector('.participante-he');
    const select = linha.querySelector('.posto-he');
    if (checkbox) checkbox.checked = true;
    if (select) select.value = posto;
  });
  atualizarResumoSabado();
  definirStatusEscalaSabado('RASCUNHO');
  const resumo = atribuicoes.map(({ pessoa, posto }) => `${pessoa.nome}: ${posto}`).join(' • ');
  msgAdmin(`Escala automática montada com ${atribuicoes.length} colaborador(es). Revise antes de publicar.`, 'ok');
  toast(`Distribuição concluída. ${resumo}`, 'ok', 6500);
}

async function copiarSabadoAnterior() {
  if (!exigirAdmin()) return;
  let dataISO;
  try { dataISO = validarDataEscalaSabado(); } catch (erro) { msgAdmin(erro.message, 'erro'); return; }
  const turno = $('turnoEscalaSabado')?.value || CONFIG.turno;
  try {
    const resposta = await apiGet('sabadoAnterior', { equipe: APP.equipe || CONFIG.equipe, data: dataISO, turno });
    if (!resposta?.encontrada || !resposta.itens?.length) throw new Error('Nenhuma escala anterior encontrada para este turno.');
    escalaSabadoEditor = normalizarEscalaSabado({ ...resposta, dataISO, status: 'RASCUNHO' }, dataISO, turno);
    postosNecessariosSabadoEditor = new Set((escalaSabadoEditor.itens || []).map((item) => item.posto).filter(Boolean));
    renderizarEditorEscalaSabado(escalaSabadoEditor);
    definirStatusEscalaSabado('RASCUNHO');
    msgAdmin(`Escala de ${formatarDataBR(resposta.dataOrigem)} copiada. Revise e salve.`, 'ok');
    toast('Sábado anterior copiado para edição.', 'ok');
  } catch (erro) {
    msgAdmin(erro.message, 'erro');
  }
}

async function salvarEscalaSabado(status) {
  if (!exigirAdmin()) return;
  let dataISO;
  try { dataISO = validarDataEscalaSabado(); } catch (erro) { msgAdmin(erro.message, 'erro'); return; }
  const turno = $('turnoEscalaSabado')?.value || CONFIG.turno;
  let itens;
  try { itens = coletarItensEscalaSabado({ validar: true }); }
  catch (erro) { msgAdmin(erro.message, 'erro'); atualizarResumoSabado(); return; }
  if (!itens.length) { msgAdmin('Selecione pelo menos um colaborador.', 'erro'); return; }
  const conflitos = conflitosDosItensSabado(itens);
  if (conflitos.length && !confirm(`Foram encontrados ${conflitos.length} possível(is) conflito(s) de posto. Deseja continuar?`)) return;

  const statusFinal = String(status).toUpperCase() === 'PUBLICADA' ? 'PUBLICADA' : 'RASCUNHO';
  const botao = statusFinal === 'PUBLICADA' ? 'btnPublicarSabado' : 'btnSalvarRascunhoSabado';
  setLoadingBotao(botao, true, statusFinal === 'PUBLICADA' ? 'Publicando...' : 'Salvando...');

  // O aplicativo é a fonte imediata da escala de sábado. A planilha funciona apenas como sincronização/backup.
  const itensComStatus = itens.map((item) => ({ ...item, status: statusFinal }));
  postosNecessariosSabadoEditor = new Set(itensComStatus.map((item) => item.posto).filter(Boolean));
  const escala = {
    dataISO,
    turno,
    status: statusFinal,
    encontrada: true,
    itens: itensComStatus,
    atualizadoEm: new Date().toISOString()
  };

  try {
    salvarCacheEscalaSabado(escala);
    escalaSabadoEditor = normalizarEscalaSabado(escala, dataISO, turno);
    definirStatusEscalaSabado(statusFinal);

    msgAdmin(statusFinal === 'PUBLICADA'
      ? `Escala de sábado ${formatarDataBR(dataISO)} publicada no aplicativo.`
      : `Rascunho de sábado ${formatarDataBR(dataISO)} salvo no aplicativo.`, 'ok');
    toast(statusFinal === 'PUBLICADA'
      ? 'Escala publicada no aplicativo.'
      : 'Rascunho salvo no aplicativo.', 'ok');

    // Libera o botão imediatamente. A sincronização não bloqueia mais o salvamento nem a exibição.
    setLoadingBotao(botao, false);

    void apiPost({
      acao: 'salvarEscalaSabado',
      senha: adminSenhaSessao,
      equipe: APP.equipe || CONFIG.equipe,
      ...escala
    }).then((envio) => {
      if (envio?.enfileirado) {
        toast('Escala salva no aparelho; sincronização com a planilha aguardando conexão.', 'aviso');
      } else {
        toast('Cópia da escala sincronizada com a planilha.', 'info');
      }
    }).catch((erro) => {
      console.warn('Falha ao sincronizar a escala de sábado:', erro);
      toast('Escala salva no aparelho. A planilha não pôde ser sincronizada agora.', 'aviso');
    });
  } catch (erro) {
    setLoadingBotao(botao, false);
    msgAdmin(`Não foi possível salvar a escala de sábado no aplicativo: ${erro.message}`, 'erro');
  }
}

/* =========================
   Interface geral
   ========================= */
function atualizarInterfaceCompleta({ preservarAdmin = false } = {}) {
  normalizarDadosAtuais();
  preencherSelectTurnos();
  atualizarValorConsulta();
  montarLegenda();
  prepararModuloCargas();
  mostrarUltimaAtualizacao();
  if ($('areaAdmin') && (!$('areaAdmin').hidden || preservarAdmin)) preencherSelectsAdmin();
}

/* =========================
   PWA e atualização
   ========================= */
function mostrarModalAtualizacao() {
  if ($('modalAtualizacao')) $('modalAtualizacao').hidden = false;
}

function fecharModalAtualizacao() {
  if ($('modalAtualizacao')) $('modalAtualizacao').hidden = true;
}

function aplicarAtualizacaoPWA() {
  if (registroServiceWorker?.waiting) registroServiceWorker.waiting.postMessage({ tipo: 'SKIP_WAITING' });
  else location.reload();
}

async function registrarServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  try {
    registroServiceWorker = await navigator.serviceWorker.register('./service-worker.js');
    if (registroServiceWorker.waiting) mostrarModalAtualizacao();
    registroServiceWorker.addEventListener('updatefound', () => {
      const novo = registroServiceWorker.installing;
      if (!novo) return;
      novo.addEventListener('statechange', () => {
        if (novo.state === 'installed' && navigator.serviceWorker.controller) mostrarModalAtualizacao();
      });
    });
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (recarregandoPorAtualizacao) return;
      recarregandoPorAtualizacao = true;
      location.reload();
    });
  } catch (erro) {
    console.warn('Service Worker não registrado.', erro);
  }
}

window.addEventListener('beforeinstallprompt', (evento) => {
  evento.preventDefault();
  promptInstalacao = evento;
  if ($('btnInstalar')) $('btnInstalar').hidden = false;
});

async function instalarApp() {
  if (!promptInstalacao) return;
  promptInstalacao.prompt();
  await promptInstalacao.userChoice;
  promptInstalacao = null;
  $('btnInstalar').hidden = true;
}

/* =========================
   Inicialização
   ========================= */
async function iniciar() {
  if ($('versaoApp')) $('versaoApp').textContent = `Versão ${APP.versao || '2.4.1'}`;
  atualizarStatusConexao();
  atualizarFilaOfflineInfo();
  migrarCacheEscalaFixa();
  mesSelecionado = CHAVE_ESCALA_FIXA;
  if ($('cargaData')) $('cargaData').value = dataISOHoje();

  // Abre imediatamente com o último conteúdo salvo no aparelho.
  const cacheInicial = carregarCacheMes(CHAVE_ESCALA_FIXA);
  if (cacheInicial?.escala?.length) aplicarDados(cacheInicial, 'cache local');
  else aplicarDados(dadosPadrao(), 'dados iniciais');

  atualizarInterfaceCompleta();
  restaurarRascunhoCarga();
  ocultarCarregamentoInicial();
  mostrarHoje();
  registrarServiceWorker();
  processarFilaOffline();

  // A atualização do Google Sheets acontece em segundo plano e não bloqueia a abertura.
  carregarEscalaFixa({ forcar: true, silencioso: true }).then(() => {
    if (document.querySelector('.aba-hoje')?.classList.contains('ativa')) mostrarHoje();
  });
}

window.addEventListener('online', () => {
  atualizarStatusConexao();
  toast('Conexão restabelecida. Enviando pendências...', 'ok');
});
window.addEventListener('offline', () => {
  atualizarStatusConexao();
  toast('Sem internet. Os próximos lançamentos ficarão salvos no aparelho.', 'aviso', 5500);
});
window.addEventListener('load', iniciar);
window.addEventListener('keydown', (evento) => {
  if (evento.key !== 'Escape') return;
  fecharModalConsulta();
  fecharModalSalvamento();
  fecharModalAtualizacao();
});

document.addEventListener('input', (evento) => {
  if (['cargaTurnoFiltro', 'cargaColaborador', 'cargaData', 'cargaRegistro', 'cargaQuantidade'].includes(evento.target?.id)) salvarRascunhoCarga();
});

document.addEventListener('click', (evento) => {
  if (evento.target === $('modalConsulta')) fecharModalConsulta();
  if (evento.target === $('modalSalvoPlanilha')) fecharModalSalvamento();
  if (evento.target === $('modalAtualizacao')) fecharModalAtualizacao();
});

if ($('btnInstalar')) $('btnInstalar').addEventListener('click', instalarApp);

Object.assign(window, {
  abrirAba,
  abrirModalConsulta,
  fecharModalConsulta,
  executarConsultaModal,
  atualizarValorConsulta,
  trocarTurnoConsulta,
  mostrarHoje,
  mostrarProximoSabado,
  mostrarEscalaSabado,
  trocarTurnoCargas,
  preencherDadosCargaPorColaborador,
  abrirEditorSetorCarga,
  aplicarSetorManualCarga,
  restaurarSetorAutomaticoCarga,
  salvarPlanilhaCargas,
  fecharModalSalvamento,
  entrarAdmin,
  sairAdmin,
  selecionarModoColaborador,
  selecionarModoPosto,
  abrirModoPostoAdmin,
  carregarColaboradorAdmin,
  carregarPostoAdmin,
  recarregarEscala,
  salvarColaborador,
  excluirColaborador,
  salvarPosto,
  excluirPosto,
  carregarEscala,
  salvarEscala,
  substituirColaborador,
  sincronizarDadosComPlanilha,
  carregarEditorEscalaSabado,
  copiarSabadoAnterior,
  preencherPostosEscalaFixaSabado,
  montarEscalaSabadoAutomaticamente,
  atualizarPostosNecessariosSabado,
  marcarPostosNecessariosSabado,
  marcarTodosSabado,
  atualizarResumoSabado,
  salvarEscalaSabado,
  aplicarAtualizacaoPWA,
  fecharModalAtualizacao
});
