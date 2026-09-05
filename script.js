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
  estatisticasHE: 'escala9132EstatisticasHEV1',
  listaSabadosAdmin: 'escala9132ListaSabadosAdminV1'
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
let resolverConfirmacaoPendente = null;
let contextoCrudModal = { tipo: '', modo: '', id: '' };
let editorSituacaoEscala = { colaboradorId: '', codigo: '' };
let turnoSituacaoFiltro = '';
let aplicandoSituacaoEscala = false;
let tipoCoberturaAdmin = 'COLABORADOR';
let SITUACOES_REGISTROS = [];
let COBERTURAS_REGISTROS = [];
let ultimaSincronizacaoServidor = '';
let sincronizandoAdmin = false;
let dataOperacionalAtual = dataISOHoje();
let temporizadorViradaDia = null;
let statusEscalaSabadoPreferido = '';
let previewEscalaSabadoAdmin = null;
let INCONSISTENCIAS_DADOS = [];
let selectModalAtual = null;
let selectModalFiltro = '';
let selectModalUltimoFoco = null;


const ACOES_ADMIN_DADOS = new Set([
  'salvarColaborador', 'excluirColaborador', 'retirarColaborador', 'assumirPosicao', 'preencherVaga', 'realocarColaborador', 'trocarPosicoes', 'salvarPosto', 'excluirPosto',
  'salvarEscala', 'salvarSituacao', 'removerSituacao',
  'salvarCobertura', 'removerCobertura',
  'salvarEscalaSabado', 'removerEscalaSabado'
]);

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


function dataISOParaDiaMesAtual(dia) {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = hoje.getMonth();
  const data = new Date(ano, mes, Number(dia), 12, 0, 0);
  if (data.getFullYear() !== ano || data.getMonth() !== mes || data.getDate() !== Number(dia)) return '';
  return `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

function normalizarRegistroSituacao(item) {
  const tipo = normalizarCodigoSituacao(item?.tipo || item?.situacao || item?.codigo || '');
  return {
    id: String(item?.id || ''),
    colaboradorId: String(item?.colaboradorId || item?.idColaborador || ''),
    nome: String(item?.nome || '').toUpperCase(),
    turno: turnoCanonico(item?.turno || ''),
    tipo,
    inicio: String(item?.inicio || item?.dataInicial || ''),
    fim: String(item?.fim || item?.dataFinal || ''),
    ativo: item?.ativo !== false
  };
}

function normalizarRegistroCobertura(item) {
  const modoInformado = String(item?.modo || item?.tipoCobertura || item?.tipo || '').trim().toUpperCase();
  const modo = modoInformado === 'POSTO' ? 'POSTO' : 'COLABORADOR';
  return {
    id: String(item?.id || ''),
    origemId: String(item?.origemId || ''),
    nomeOrigem: String(item?.nomeOrigem || '').toUpperCase(),
    destinoId: String(item?.destinoId || ''),
    nomeDestino: String(item?.nomeDestino || '').toUpperCase(),
    postoFonte: normalizarCodigoPosto(item?.postoFonte || item?.postoOrigem || ''),
    modo,
    inicio: String(item?.inicio || item?.dataInicial || ''),
    fim: String(item?.fim || item?.dataFinal || ''),
    ativo: item?.ativo !== false
  };
}

function normalizarRegistrosTemporais() {
  SITUACOES_REGISTROS = (Array.isArray(SITUACOES_REGISTROS) ? SITUACOES_REGISTROS : [])
    .map(normalizarRegistroSituacao)
    .filter(item => item.id && item.colaboradorId && SITUACOES.has(item.tipo) && /^\d{4}-\d{2}-\d{2}$/.test(item.inicio) && /^\d{4}-\d{2}-\d{2}$/.test(item.fim) && item.ativo)
    .sort((a, b) => a.inicio.localeCompare(b.inicio));
  COBERTURAS_REGISTROS = (Array.isArray(COBERTURAS_REGISTROS) ? COBERTURAS_REGISTROS : [])
    .map(normalizarRegistroCobertura)
    .filter(item => item.id && item.origemId && (item.modo === 'POSTO' ? item.postoFonte : item.destinoId) && /^\d{4}-\d{2}-\d{2}$/.test(item.inicio) && /^\d{4}-\d{2}-\d{2}$/.test(item.fim) && item.ativo)
    .sort((a, b) => a.inicio.localeCompare(b.inicio));
}

function periodoContemData(item, dataISO) {
  return Boolean(item?.ativo !== false && dataISO && item?.inicio && item?.fim && item.inicio <= dataISO && item.fim >= dataISO);
}

function situacaoNaData(colaboradorId, dataISO) {
  if (!colaboradorId || !dataISO) return null;
  const hoje = dataISOHoje();
  // Situações finalizadas ficam no histórico, mas não mantêm o destaque amarelo no aplicativo.
  const candidatas = SITUACOES_REGISTROS.filter(item => item.colaboradorId === colaboradorId && item.fim >= hoje && periodoContemData(item, dataISO));
  return candidatas.sort((a, b) => b.inicio.localeCompare(a.inicio))[0] || null;
}

function coberturaNaDataPorOrigem(origemId, dataISO) {
  if (!origemId || !dataISO) return null;
  const hoje = dataISOHoje();
  return COBERTURAS_REGISTROS.find(item => item.origemId === origemId && item.fim >= hoje && periodoContemData(item, dataISO)) || null;
}

function coberturaNaDataPorDestino(destinoId, dataISO) {
  if (!destinoId || !dataISO) return null;
  const hoje = dataISOHoje();
  return COBERTURAS_REGISTROS.find(item => item.destinoId === destinoId && item.fim >= hoje && periodoContemData(item, dataISO)) || null;
}

function situacaoRegistradaNaData(colaboradorId, dataISO) {
  if (!colaboradorId || !dataISO) return null;
  const candidatas = SITUACOES_REGISTROS.filter(item => item.colaboradorId === colaboradorId && periodoContemData(item, dataISO));
  return candidatas.sort((a, b) => b.inicio.localeCompare(a.inicio))[0] || null;
}

function postoFixoColaboradorNaData(colaboradorOuId, dataISO) {
  const pessoa = typeof colaboradorOuId === 'string' ? colaboradorPorId(colaboradorOuId) : colaboradorOuId;
  if (!pessoa || !dataISO) return '';
  const dia = diaDoMesDaData(dataISO);
  return postoDoDia(pessoa.dias?.[dia - 1] || '');
}

function coberturasAtivasNaData(dataISO) {
  return COBERTURAS_REGISTROS.filter(item => periodoContemData(item, dataISO));
}

function colaboradorEhAlvoDeOutraCobertura(colaboradorId, dataISO, ignorarId = '') {
  return coberturasAtivasNaData(dataISO).some(item => item.id !== ignorarId && item.origemId === colaboradorId);
}

function colaboradorJaUsadoComoCobridor(colaboradorId, dataISO, ignorarId = '') {
  const pessoa = colaboradorPorId(colaboradorId);
  if (!pessoa) return false;
  return coberturasAtivasNaData(dataISO).some(item => {
    if (item.id === ignorarId) return false;
    if (item.modo === 'COLABORADOR') return item.destinoId === colaboradorId;
    const alvo = colaboradorPorId(item.origemId);
    if (!alvo || !mesmoTurno(alvo.turno, pessoa.turno)) return false;
    return postoFixoColaboradorNaData(pessoa, dataISO) === item.postoFonte;
  });
}

function avaliarCoberturaNoDia(itemEntrada, dataISO) {
  const item = normalizarRegistroCobertura(itemEntrada);
  const conflitos = [];
  const alvo = colaboradorPorId(item.origemId);
  if (!alvo) return { valido: false, conflitos: ['Colaborador a ser coberto não encontrado.'], item, alvo: null, cobridor: null, postoAlvo: '', postoFonte: item.postoFonte || '' };

  const postoAlvo = postoFixoColaboradorNaData(alvo, dataISO);
  if (!postoAlvo) conflitos.push(`${alvo.nome} está sem posto definido nesse dia.`);

  const outraCoberturaAlvo = coberturasAtivasNaData(dataISO).find(registro => registro.id !== item.id && registro.origemId === alvo.id);
  if (outraCoberturaAlvo) conflitos.push(`${alvo.nome} já possui outra cobertura nesse dia.`);

  let cobridor = null;
  let postoFonte = item.postoFonte || '';

  if (item.modo === 'POSTO') {
    if (!postoFonte) conflitos.push('Posto de origem da cobertura não informado.');
    if (postoFonte && postoFonte === postoAlvo) conflitos.push(`O posto ${postoFonte} é o próprio posto que precisa ser coberto.`);

    const candidatos = pessoasAtivas().filter(pessoa => pessoa.id !== alvo.id && mesmoTurno(pessoa.turno, alvo.turno) && postoFixoColaboradorNaData(pessoa, dataISO) === postoFonte);
    const disponiveis = candidatos.filter(pessoa => {
      if (situacaoRegistradaNaData(pessoa.id, dataISO)) return false;
      if (colaboradorEhAlvoDeOutraCobertura(pessoa.id, dataISO, item.id)) return false;
      if (colaboradorJaUsadoComoCobridor(pessoa.id, dataISO, item.id)) return false;
      return true;
    });

    if (!candidatos.length && postoFonte) conflitos.push(`Ninguém do ${alvo.turno} está escalado no posto ${postoFonte}.`);
    else if (!disponiveis.length && postoFonte) conflitos.push(`Quem está no posto ${postoFonte} não está disponível para essa cobertura.`);
    else if (disponiveis.length > 1) conflitos.push(`Há mais de um colaborador disponível no posto ${postoFonte}; defina a escala para deixar apenas um responsável.`);
    else cobridor = disponiveis[0] || null;
  } else {
    cobridor = colaboradorPorId(item.destinoId);
    if (!cobridor) conflitos.push('Colaborador que fará a cobertura não encontrado.');
    if (cobridor && cobridor.id === alvo.id) conflitos.push('O colaborador não pode cobrir a si mesmo.');
    if (cobridor && !mesmoTurno(cobridor.turno, alvo.turno)) conflitos.push('O cobridor precisa estar no mesmo turno do colaborador coberto.');
    if (cobridor && situacaoRegistradaNaData(cobridor.id, dataISO)) conflitos.push(`${cobridor.nome} possui uma situação cadastrada nesse dia.`);
    if (cobridor && colaboradorEhAlvoDeOutraCobertura(cobridor.id, dataISO, item.id)) conflitos.push(`${cobridor.nome} também está sendo coberto nesse dia e não pode ser deslocado.`);
    if (cobridor && colaboradorJaUsadoComoCobridor(cobridor.id, dataISO, item.id)) conflitos.push(`${cobridor.nome} já está cobrindo outra pessoa nesse dia.`);
    postoFonte = cobridor ? postoFixoColaboradorNaData(cobridor, dataISO) : '';
  }

  return {
    valido: conflitos.length === 0 && Boolean(cobridor) && Boolean(postoAlvo),
    conflitos,
    item,
    alvo,
    cobridor,
    postoAlvo,
    postoFonte,
    descricaoPostoAlvo: postoAlvo ? postoDescricao(postoAlvo) : '',
    descricaoPostoFonte: postoFonte ? postoDescricao(postoFonte) : ''
  };
}

function coberturaNaDataPorCobridor(colaboradorId, dataISO) {
  if (!colaboradorId || !dataISO) return null;
  for (const item of coberturasAtivasNaData(dataISO)) {
    const avaliacao = avaliarCoberturaNoDia(item, dataISO);
    if (avaliacao.valido && avaliacao.cobridor?.id === colaboradorId) return avaliacao;
  }
  return null;
}

function datasEntreISO(inicioISO, fimISO, limite = 370) {
  const datas = [];
  let atual = inicioISO;
  let seguranca = 0;
  while (atual && fimISO && atual <= fimISO && seguranca < limite) {
    datas.push(atual);
    atual = deslocarDataISO(atual, 1);
    seguranca += 1;
  }
  return datas;
}

function situacaoVigenteHoje(colaboradorId) {
  return situacaoNaData(colaboradorId, dataISOHoje());
}

function situacoesVisiveisAdmin() {
  const hoje = dataISOHoje();
  return SITUACOES_REGISTROS.slice().sort((a, b) => {
    const ativaA = periodoContemData(a, hoje) ? 0 : (a.fim >= hoje ? 1 : 2);
    const ativaB = periodoContemData(b, hoje) ? 0 : (b.fim >= hoje ? 1 : 2);
    return ativaA - ativaB || b.inicio.localeCompare(a.inicio);
  });
}

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
  // A Equipe 9132 passa a trabalhar com 1º, 2º e 3º turnos. O cadastro pode
  // receber colaboradores do 3º turno mesmo antes de a escala desse turno
  // estar totalmente preenchida na planilha.
  const configurados = Array.isArray(CONFIG.turnos) && CONFIG.turnos.length
    ? CONFIG.turnos
    : ['1º Turno', '2º Turno', '3º Turno'];

  const ordem = ['1 TURNO', '2 TURNO', '3 TURNO'];
  const canonicos = configurados
    .map((turno) => normalizarTurnoComparacao(turno))
    .filter((turno) => ordem.includes(turno))
    .map((turno) => `${turno.charAt(0)}º Turno`);

  const unicos = [...new Set(canonicos)];
  return unicos.length ? unicos : ['1º Turno', '2º Turno', '3º Turno'];
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
   Modais próprios do aplicativo
   ========================= */
function confirmarAcaoApp({
  titulo = 'Confirmar ação',
  mensagem = '',
  confirmarTexto = 'Confirmar',
  cancelarTexto = 'Cancelar',
  mostrarCancelar = true,
  tipo = 'perigo'
} = {}) {
  const modal = $('modalConfirmacaoApp');
  if (!modal) return Promise.resolve(false);

  if (resolverConfirmacaoPendente) resolverConfirmacaoPendente(false);
  $('tituloModalConfirmacaoApp').textContent = titulo;
  $('mensagemModalConfirmacaoApp').textContent = mensagem;
  $('btnConfirmarConfirmacaoApp').textContent = confirmarTexto;
  const btnCancelar = $('btnCancelarConfirmacaoApp');
  if (btnCancelar) {
    btnCancelar.textContent = cancelarTexto;
    btnCancelar.hidden = !mostrarCancelar;
  }
  const card = modal.querySelector('.modal-confirmacao-card');
  card?.classList.remove('perigo', 'aviso', 'info');
  card?.classList.add(tipo);
  $('iconeModalConfirmacaoApp').textContent = tipo === 'aviso' ? '⚠' : tipo === 'info' ? 'i' : '!';
  modal.hidden = false;
  document.body.classList.add('modal-aberto');
  setTimeout(() => $('btnConfirmarConfirmacaoApp')?.focus(), 20);

  return new Promise((resolve) => { resolverConfirmacaoPendente = resolve; });
}

function mostrarAvisoApp({ titulo = 'Atenção', mensagem = '', botaoTexto = 'Entendi', tipo = 'aviso' } = {}) {
  return confirmarAcaoApp({
    titulo,
    mensagem,
    confirmarTexto: botaoTexto,
    mostrarCancelar: false,
    tipo
  });
}

/* =========================
   Seleções em modal — substitui caixas nativas do navegador
   ========================= */
function haOutroModalAberto(excetoId = '') {
  return Array.from(document.querySelectorAll('.modal-app')).some((modal) => {
    if (modal.id === excetoId) return false;
    return modal.hidden === false;
  });
}

function obterRotuloSelect(select) {
  if (!select) return 'Selecionar opção';
  const porFor = select.id ? document.querySelector(`label[for="${CSS.escape(select.id)}"]`) : null;
  if (porFor?.textContent?.trim()) return porFor.textContent.trim();

  const bloco = select.closest('.modal-campo-bloco, .campo, .field, .form-group, div');
  const label = bloco?.querySelector?.('label');
  if (label?.textContent?.trim()) return label.textContent.trim();

  const aria = select.getAttribute('aria-label');
  if (aria) return aria;

  const idLegivel = String(select.id || '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim();
  return idLegivel ? idLegivel.charAt(0).toUpperCase() + idLegivel.slice(1) : 'Selecionar opção';
}

function opcoesSelectModal(select) {
  return Array.from(select?.options || []).map((opcao, indice) => ({
    indice,
    valor: opcao.value,
    texto: opcao.textContent?.trim() || opcao.label || opcao.value || 'Sem descrição',
    desabilitada: Boolean(opcao.disabled),
    selecionada: Boolean(opcao.selected)
  }));
}

function abrirSelectComoModal(select) {
  if (!(select instanceof HTMLSelectElement) || select.disabled) return;
  const modal = $('modalSelecaoApp');
  if (!modal) return;

  // Evita abrir novamente o mesmo seletor enquanto o modal está visível.
  if (selectModalAtual === select && modal.hidden === false) return;

  selectModalUltimoFoco = document.activeElement;
  selectModalAtual = select;
  selectModalFiltro = '';

  $('tituloModalSelecaoApp').textContent = obterRotuloSelect(select);
  $('subtituloModalSelecaoApp').textContent = select.dataset.modalAjuda || 'Toque em uma opção para selecionar.';
  const busca = $('buscaModalSelecaoApp');
  if (busca) {
    busca.value = '';
    const todasOpcoes = opcoesSelectModal(select);
    const qtdAtivas = todasOpcoes.filter((item) => String(item.valor || '').trim() || String(item.texto || '').trim()).length;
    busca.hidden = qtdAtivas <= 7;
    busca.placeholder = `Pesquisar em ${qtdAtivas} ${qtdAtivas === 1 ? 'opção' : 'opções'}...`;
  }

  renderizarOpcoesModalSelecao();
  modal.hidden = false;
  document.body.classList.add('modal-aberto');

  setTimeout(() => {
    const buscaVisivel = busca && !busca.hidden;
    const dispositivoToque = globalThis.matchMedia?.('(pointer: coarse)')?.matches;
    const alvo = (!dispositivoToque && buscaVisivel)
      ? busca
      : modal.querySelector('.modal-selecao-opcao.selecionada, .modal-selecao-opcao:not(:disabled)');
    alvo?.focus({ preventScroll: true });
  }, 20);
}

function renderizarOpcoesModalSelecao() {
  const lista = $('listaModalSelecaoApp');
  if (!lista || !selectModalAtual) return;

  const filtro = normalizarTextoBusca(selectModalFiltro);
  const opcoes = opcoesSelectModal(selectModalAtual).filter((item) => {
    if (!filtro) return true;
    return normalizarTextoBusca(item.texto).includes(filtro);
  });

  lista.innerHTML = opcoes.length
    ? opcoes.map((item) => `
      <button
        type="button"
        class="modal-opcao modal-selecao-opcao ${item.selecionada ? 'selecionada' : ''}"
        data-select-index="${item.indice}"
        ${item.desabilitada ? 'disabled' : ''}
        aria-pressed="${item.selecionada ? 'true' : 'false'}"
      >
        <span class="radio-modal" aria-hidden="true"></span>
        <span class="modal-selecao-textos">
          <strong>${escaparHTML(item.texto)}</strong>
          ${item.selecionada ? '<small>Selecionado atualmente</small>' : ''}
        </span>
      </button>`).join('')
    : '<div class="modal-vazio">Nenhuma opção encontrada.</div>';

  lista.querySelectorAll('[data-select-index]').forEach((botao) => {
    botao.addEventListener('click', () => selecionarOpcaoModalSelect(Number(botao.dataset.selectIndex)));
  });
}

function normalizarTextoBusca(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function filtrarModalSelecao(valor) {
  selectModalFiltro = String(valor || '');
  renderizarOpcoesModalSelecao();
}

function selecionarOpcaoModalSelect(indice) {
  const select = selectModalAtual;
  if (!select || !Number.isInteger(indice)) return;
  const opcao = select.options[indice];
  if (!opcao || opcao.disabled) return;

  const valorAnterior = select.value;
  select.selectedIndex = indice;

  // Mantém o mesmo comportamento funcional do select nativo.
  select.dispatchEvent(new Event('input', { bubbles: true }));
  if (select.value !== valorAnterior || opcao.value === valorAnterior) {
    select.dispatchEvent(new Event('change', { bubbles: true }));
  }

  fecharModalSelecaoApp();
}

function fecharModalSelecaoApp() {
  const modal = $('modalSelecaoApp');
  if (modal) modal.hidden = true;
  const foco = selectModalUltimoFoco;
  selectModalAtual = null;
  selectModalFiltro = '';
  selectModalUltimoFoco = null;

  sincronizarEstadoModalBody();
  setTimeout(() => {
    // Evita devolver foco a um <select>, pois alguns navegadores móveis podem
    // reabrir o seletor nativo ao recuperar o foco.
    if (foco && !(foco instanceof HTMLSelectElement) && document.contains(foco) && typeof foco.focus === 'function') {
      foco.focus({ preventScroll: true });
    }
  }, 0);
}

function sincronizarEstadoModalBody() {
  const algumAberto = Array.from(document.querySelectorAll('.modal-app')).some((modal) => modal.hidden === false);
  document.body.classList.toggle('modal-aberto', algumAberto);
}

let gestoSelectModal = {
  select: null,
  x: 0,
  y: 0,
  movido: false,
  abertoEm: 0
};

function selectDoEvento(evento) {
  return evento?.target?.closest?.('select') || null;
}

function registrarInicioGestoSelect(evento) {
  const select = selectDoEvento(evento);
  if (!select || select.disabled || select.closest('#modalSelecaoApp')) {
    gestoSelectModal = { select: null, x: 0, y: 0, movido: false, abertoEm: 0 };
    return;
  }
  const ponto = evento.touches?.[0] || evento;
  gestoSelectModal = {
    select,
    x: Number(ponto?.clientX || 0),
    y: Number(ponto?.clientY || 0),
    movido: false,
    abertoEm: 0
  };
}

function registrarMovimentoGestoSelect(evento) {
  if (!gestoSelectModal.select) return;
  const ponto = evento.touches?.[0] || evento;
  const dx = Number(ponto?.clientX || 0) - gestoSelectModal.x;
  const dy = Number(ponto?.clientY || 0) - gestoSelectModal.y;
  if (Math.hypot(dx, dy) > 10) gestoSelectModal.movido = true;
}

function finalizarToqueSelect(evento) {
  const select = selectDoEvento(evento) || gestoSelectModal.select;
  if (!select || select.disabled || select.closest('#modalSelecaoApp')) return;

  // No celular, abrir somente quando o gesto terminou como TOQUE.
  // Se o dedo percorreu a tela para rolar, o modal não abre.
  if (gestoSelectModal.select === select && !gestoSelectModal.movido) {
    if (evento.cancelable) evento.preventDefault();
    evento.stopPropagation();
    gestoSelectModal.abertoEm = Date.now();
    abrirSelectComoModal(select);
  }
}

function interceptarClickSelect(evento) {
  const select = selectDoEvento(evento);
  if (!select || select.disabled || select.closest('#modalSelecaoApp')) return;

  // Bloqueia o seletor nativo. Em touch, o modal já foi aberto no touchend.
  if (evento.cancelable) evento.preventDefault();
  evento.stopImmediatePropagation?.();
  evento.stopPropagation();

  const abriuAgora = gestoSelectModal.select === select && Date.now() - Number(gestoSelectModal.abertoEm || 0) < 700;
  const foiArrasto = gestoSelectModal.select === select && gestoSelectModal.movido;
  if (!abriuAgora && !foiArrasto) abrirSelectComoModal(select);

  setTimeout(() => {
    if (gestoSelectModal.select === select) {
      gestoSelectModal = { select: null, x: 0, y: 0, movido: false, abertoEm: 0 };
    }
  }, 0);
}

function instalarSelectsEmModal() {
  // Touch: observa o movimento sem impedir a rolagem. Só abre no final se foi um toque curto.
  document.addEventListener('touchstart', registrarInicioGestoSelect, { capture: true, passive: true });
  document.addEventListener('touchmove', registrarMovimentoGestoSelect, { capture: true, passive: true });
  document.addEventListener('touchend', finalizarToqueSelect, { capture: true, passive: false });
  document.addEventListener('touchcancel', () => {
    gestoSelectModal = { select: null, x: 0, y: 0, movido: false, abertoEm: 0 };
  }, true);

  // Mouse/trackpad: o click é bloqueado antes do comportamento nativo.
  document.addEventListener('click', interceptarClickSelect, true);

  // Suporte a teclado/acessibilidade.
  document.addEventListener('keydown', (evento) => {
    const select = evento.target instanceof HTMLSelectElement ? evento.target : null;
    if (!select || select.disabled) return;
    if (!['Enter', ' ', 'ArrowDown'].includes(evento.key)) return;
    evento.preventDefault();
    evento.stopPropagation();
    abrirSelectComoModal(select);
  }, true);
}

function resolverConfirmacaoApp(resultado) {
  const modal = $('modalConfirmacaoApp');
  if (modal) modal.hidden = true;
  sincronizarEstadoModalBody();
  const resolver = resolverConfirmacaoPendente;
  resolverConfirmacaoPendente = null;
  if (resolver) resolver(Boolean(resultado));
}

function fecharModalCrudAdmin() {
  const modal = $('modalCrudAdmin');
  if (modal) modal.hidden = true;
  sincronizarEstadoModalBody();
  contextoCrudModal = { tipo: '', modo: '', id: '' };
}

function tituloCrudModal(tipo, modo) {
  const entidade = tipo === 'colaborador' ? 'colaborador' : 'posto';
  if (modo === 'retirar') return 'Retirar colaborador da equipe';
  const acao = modo === 'adicionar' ? 'Adicionar' : modo === 'editar' ? 'Editar' : 'Excluir';
  return `${acao} ${entidade}`;
}

function abrirCrudAdmin(tipo, modo) {
  if (!exigirAdmin()) return;
  if (!['colaborador', 'posto'].includes(tipo) || !['adicionar', 'editar', 'excluir', 'retirar'].includes(modo)) return;
  contextoCrudModal = { tipo, modo, id: '' };
  const modal = $('modalCrudAdmin');
  if (!modal) return;
  $('tituloModalCrudAdmin').textContent = tituloCrudModal(tipo, modo);
  $('subtituloModalCrudAdmin').textContent = modo === 'adicionar'
    ? 'Preencha os dados e salve.'
    : modo === 'retirar'
      ? 'Escolha quem saiu da equipe. A escala será preservada como A DEFINIR.'
      : `Escolha ${tipo === 'colaborador' ? 'um colaborador' : 'um posto'} na lista.`;
  modal.hidden = false;
  document.body.classList.add('modal-aberto');
  if (modo === 'adicionar') renderizarFormularioCrud();
  else renderizarListaCrud();
}

function abrirRetiradaEquipe() {
  abrirCrudAdmin('colaborador', 'retirar');
}

function abrirPreencherVaga() {
  if (!exigirAdmin()) return;
  contextoCrudModal = { tipo: 'colaborador', modo: 'preencher-vaga', id: '' };
  const modal = $('modalCrudAdmin');
  if (!modal) return;
  $('tituloModalCrudAdmin').textContent = 'Preencher vaga aberta';
  $('subtituloModalCrudAdmin').textContent = 'Escolha a vaga e o novo colaborador. O novo colaborador precisa estar cadastrado e ainda sem postos na escala fixa.';
  modal.hidden = false;
  document.body.classList.add('modal-aberto');
  renderizarFormularioPreencherVaga();
}

function abrirAssumirPosicao() {
  if (!exigirAdmin()) return;
  contextoCrudModal = { tipo: 'colaborador', modo: 'assumir-posicao', id: '', destinoOcupante: 'MANTER' };
  const modal = $('modalCrudAdmin');
  if (!modal) return;
  $('tituloModalCrudAdmin').textContent = 'Assumir posição';
  $('subtituloModalCrudAdmin').textContent = 'Use quando um colaborador sem escala fixa assumir a posição de outra pessoa. Você decide se o ocupante atual permanece na equipe aguardando nova posição ou é retirado da equipe.';
  modal.hidden = false;
  document.body.classList.add('modal-aberto');
  renderizarFormularioAssumirPosicao();
}

function abrirRealocacaoColaborador() {
  if (!exigirAdmin()) return;
  contextoCrudModal = { tipo: 'colaborador', modo: 'realocar-colaborador', id: '' };
  const modal = $('modalCrudAdmin');
  if (!modal) return;
  $('tituloModalCrudAdmin').textContent = 'Realocar colaborador';
  $('subtituloModalCrudAdmin').textContent = 'Use quando alguém que já possui escala assumir uma vaga A DEFINIR. A posição atual dele será preservada como uma nova vaga A DEFINIR.';
  modal.hidden = false;
  document.body.classList.add('modal-aberto');
  renderizarFormularioRealocarColaborador();
}

function abrirTrocaPosicoes() {
  if (!exigirAdmin()) return;
  contextoCrudModal = { tipo: 'colaborador', modo: 'trocar-posicoes', id: '' };
  const modal = $('modalCrudAdmin');
  if (!modal) return;
  $('tituloModalCrudAdmin').textContent = 'Trocar posições';
  $('subtituloModalCrudAdmin').textContent = 'Use quando dois colaboradores ativos, do mesmo turno ou de turnos diferentes, precisarem trocar suas posições completas da escala fixa. Em trocas entre turnos, o turno de cada pessoa também será atualizado.';
  modal.hidden = false;
  document.body.classList.add('modal-aberto');
  renderizarFormularioTrocarPosicoes();
}

function colaboradorPossuiEscalaFixa(pessoa) {
  return Boolean(pessoa && (pessoa.dias || []).some((valor) => Boolean(postoDoDia(valor))));
}

function colaboradoresElegiveisTroca() {
  // Exibe TODOS os colaboradores ativos dos 1º, 2º e 3º turnos.
  // Quem ainda não possui escala aparece na lista, mas fica indisponível
  // para uma troca de duas posições (deve receber uma vaga/escala primeiro).
  return pessoasAtivas()
    .filter((pessoa) => !ehVagaAberta(pessoa))
    .slice()
    .sort((a, b) => {
      const ordemTurno = Number(normalizarTurnoComparacao(a.turno).match(/[123]/)?.[0] || 9)
        - Number(normalizarTurnoComparacao(b.turno).match(/[123]/)?.[0] || 9);
      return ordemTurno || `${a.nome}|${a.registro || ''}`.localeCompare(`${b.nome}|${b.registro || ''}`, 'pt-BR');
    });
}

function registrosTemporaisDaPessoa(colaboradorId) {
  const hoje = dataISOHoje();
  const situacoes = SITUACOES_REGISTROS.filter((item) => item.colaboradorId === colaboradorId && item.fim >= hoje);
  const coberturas = COBERTURAS_REGISTROS.filter((item) => (item.origemId === colaboradorId || item.destinoId === colaboradorId) && item.fim >= hoje);
  return { situacoes: situacoes.length, coberturas: coberturas.length };
}

function resumoPosicaoParaTroca(pessoa) {
  if (!pessoa) return 'Sem posição definida';
  const postos = [...new Set((pessoa.dias || []).map((valor) => postoDoDia(valor)).filter(Boolean))];
  if (!postos.length) return 'Sem postos definidos';
  const lista = postos.slice(0, 5).map((posto) => `${posto} • ${postoDescricao(posto)}`);
  return `${lista.join(' | ')}${postos.length > 5 ? ` +${postos.length - 5}` : ''}`;
}

function renderizarFormularioTrocarPosicoes(primeiroId = '', segundoId = '') {
  const conteudo = $('conteudoModalCrudAdmin');
  const acoes = $('acoesModalCrudAdmin');
  if (!conteudo || !acoes) return;

  const colaboradores = colaboradoresElegiveisTroca();
  const comEscala = colaboradores.filter(colaboradorPossuiEscalaFixa);

  if (colaboradores.length < 2 || comEscala.length < 2) {
    conteudo.innerHTML = `
      <div class="modal-vazio">
        Para trocar posições são necessários pelo menos dois colaboradores ativos com escala fixa.
        ${colaboradores.length ? `<br><br>Ativos encontrados: ${colaboradores.length}. Com escala definida: ${comEscala.length}.` : ''}
      </div>`;
    acoes.innerHTML = '<button type="button" class="btn secundario" onclick="fecharModalCrudAdmin()">Fechar</button>';
    return;
  }

  const primeiro = comEscala.find((item) => item.id === primeiroId) || comEscala[0];
  const segundo = comEscala.find((item) => item.id === segundoId && item.id !== primeiro.id)
    || comEscala.find((item) => item.id !== primeiro.id)
    || null;

  contextoCrudModal.id = primeiro.id;

  const rotuloOpcao = (item, selecionadoId, bloquearMesmo = '') => {
    const semEscala = !colaboradorPossuiEscalaFixa(item);
    const mesmaPessoa = Boolean(bloquearMesmo && item.id === bloquearMesmo);
    const bloqueado = semEscala || mesmaPessoa;
    const complemento = semEscala ? ' • SEM ESCALA FIXA' : (mesmaPessoa ? ' • JÁ SELECIONADO' : '');
    return `<option value="${escaparHTML(item.id)}" ${item.id === selecionadoId ? 'selected' : ''} ${bloqueado ? 'disabled' : ''}>${escaparHTML(item.nome)} • ${escaparHTML(item.turno)}${item.registro ? ` • Reg. ${escaparHTML(item.registro)}` : ''}${complemento}</option>`;
  };

  const vinculosPrimeiro = registrosTemporaisDaPessoa(primeiro.id);
  const vinculosSegundo = segundo ? registrosTemporaisDaPessoa(segundo.id) : { situacoes: 0, coberturas: 0 };
  const possuiVinculos = vinculosPrimeiro.situacoes || vinculosPrimeiro.coberturas || vinculosSegundo.situacoes || vinculosSegundo.coberturas;
  const trocaEntreTurnos = Boolean(segundo && !mesmoTurno(primeiro.turno, segundo.turno));

  const semEscala = colaboradores.filter((item) => !colaboradorPossuiEscalaFixa(item));

  conteudo.innerHTML = `
    <div class="form-preencher-vaga">
      <div class="alerta-lista-troca-completa">
        <strong>Lista completa da equipe</strong>
        <span>Os 1º, 2º e 3º turnos são exibidos nas duas listas. Colaboradores ainda sem escala fixa aparecem identificados, mas não podem participar de uma troca até receberem uma posição.</span>
        ${semEscala.length ? `<small>Sem escala fixa no momento: ${semEscala.map((item) => escaparHTML(item.nome)).join(', ')}.</small>` : ''}
      </div>
      <div class="modal-campo-bloco">
        <label for="selectPrimeiroTrocaPosicoes">1. Primeiro colaborador</label>
        <select id="selectPrimeiroTrocaPosicoes" data-modal-ajuda="Todos os colaboradores ativos dos três turnos aparecem aqui.">${colaboradores.map((item) => rotuloOpcao(item, primeiro.id)).join('')}</select>
      </div>
      <div class="modal-campo-bloco">
        <label for="selectSegundoTrocaPosicoes">2. Segundo colaborador</label>
        <select id="selectSegundoTrocaPosicoes" data-modal-ajuda="Escolha outro colaborador com escala fixa. A pessoa já escolhida permanece visível, porém indisponível.">${colaboradores.map((item) => rotuloOpcao(item, segundo?.id || '', primeiro.id)).join('')}</select>
        <small class="muted mini-ajuda">As duas listas usam a mesma base atualizada da equipe. Em troca entre turnos, cada pessoa assume também o turno da posição recebida.</small>
      </div>
      ${segundo ? `
        <div class="preview-troca-posicoes">
          <div class="preview-troca-bloco">
            <strong>Antes</strong>
            <div class="preview-troca-linha"><b>${escaparHTML(primeiro.nome)}</b><span>${escaparHTML(resumoPosicaoParaTroca(primeiro))}</span></div>
            <div class="preview-troca-linha"><b>${escaparHTML(segundo.nome)}</b><span>${escaparHTML(resumoPosicaoParaTroca(segundo))}</span></div>
          </div>
          <div class="preview-troca-bloco depois">
            <strong>Depois</strong>
            <div class="preview-troca-linha"><b>${escaparHTML(primeiro.nome)}</b><span>Assume a posição atual de ${escaparHTML(segundo.nome)}: ${escaparHTML(resumoPosicaoParaTroca(segundo))}</span></div>
            <div class="preview-troca-linha"><b>${escaparHTML(segundo.nome)}</b><span>Assume a posição atual de ${escaparHTML(primeiro.nome)}: ${escaparHTML(resumoPosicaoParaTroca(primeiro))}</span></div>
          </div>
          ${trocaEntreTurnos ? `<div class="aviso-troca-vinculos destaque-turno-troca"><b>Troca entre turnos:</b> ${escaparHTML(primeiro.nome)} passa de ${escaparHTML(primeiro.turno)} para ${escaparHTML(segundo.turno)} e ${escaparHTML(segundo.nome)} passa de ${escaparHTML(segundo.turno)} para ${escaparHTML(primeiro.turno)}.</div>` : ''}
          <div class="aviso-troca-vinculos">A troca altera os 31 postos da escala fixa${trocaEntreTurnos ? ' e o turno cadastrado de cada colaborador' : ''}. Nome, registro, situações (férias, atestado etc.) e coberturas continuam vinculados à própria pessoa.${possuiVinculos ? ` Há registros temporários futuros/ativos: ${escaparHTML(primeiro.nome)} (${vinculosPrimeiro.situacoes} situação(ões), ${vinculosPrimeiro.coberturas} cobertura(s)); ${escaparHTML(segundo.nome)} (${vinculosSegundo.situacoes} situação(ões), ${vinculosSegundo.coberturas} cobertura(s)).${trocaEntreTurnos && (vinculosPrimeiro.coberturas || vinculosSegundo.coberturas) ? ' Como existe cobertura vinculada e haverá mudança de turno, revise essas coberturas após a troca.' : ''}` : ''}</div>
        </div>` : '<div class="modal-vazio">Não existe outro colaborador ativo com escala fixa para realizar a troca.</div>'}
    </div>`;

  $('selectPrimeiroTrocaPosicoes')?.addEventListener('change', (evento) => renderizarFormularioTrocarPosicoes(evento.target.value, ''));
  $('selectSegundoTrocaPosicoes')?.addEventListener('change', (evento) => renderizarFormularioTrocarPosicoes(primeiro.id, evento.target.value));
  acoes.innerHTML = `
    <button type="button" class="btn secundario" onclick="fecharModalCrudAdmin()">Cancelar</button>
    <button id="btnTrocarPosicoesModal" type="button" class="btn principal" ${segundo ? '' : 'disabled'} onclick="trocarPosicoesPeloModal()"><span class="btn-texto">Trocar posições</span><span class="spinner-botao" hidden></span></button>`;
}

async function trocarPosicoesPeloModal() {
  if (!exigirAdmin()) return;
  const primeiroId = String($('selectPrimeiroTrocaPosicoes')?.value || '').trim();
  const segundoId = String($('selectSegundoTrocaPosicoes')?.value || '').trim();
  const primeiro = colaboradorPorId(primeiroId);
  const segundo = colaboradorPorId(segundoId);
  if (!primeiro || !segundo || ehVagaAberta(primeiro) || ehVagaAberta(segundo)) { await mostrarAvisoApp({ titulo: 'Troca de posições', mensagem: 'Selecione dois colaboradores válidos.', tipo: 'aviso' }); return; }
  if (primeiro.id === segundo.id) { await mostrarAvisoApp({ titulo: 'Troca de posições', mensagem: 'Escolha dois colaboradores diferentes.', tipo: 'aviso' }); return; }
  if (!colaboradorPossuiEscalaFixa(primeiro) || !colaboradorPossuiEscalaFixa(segundo)) {
    await mostrarAvisoApp({ titulo: 'Escala necessária', mensagem: 'Os dois colaboradores precisam possuir uma escala fixa antes de trocar posições. Quem ainda está sem escala aparece na lista apenas para identificação.', tipo: 'aviso' });
    return;
  }
  const turnoPrimeiroAntes = primeiro.turno;
  const turnoSegundoAntes = segundo.turno;
  const trocaEntreTurnos = !mesmoTurno(turnoPrimeiroAntes, turnoSegundoAntes);

  const diasPrimeiro = Array.from({ length: 31 }, (_, i) => postoDoDia(primeiro.dias?.[i] || ''));
  const diasSegundo = Array.from({ length: 31 }, (_, i) => postoDoDia(segundo.dias?.[i] || ''));
  if (!diasPrimeiro.some(Boolean) || !diasSegundo.some(Boolean)) {
    await mostrarAvisoApp({ titulo: 'Escala incompleta', mensagem: 'Os dois colaboradores precisam possuir uma posição na escala fixa. Para vaga aberta use Preencher vaga ou Realocar para vaga.', botaoTexto: 'Entendi', tipo: 'aviso' });
    return;
  }

  const confirmado = await confirmarAcaoApp({
    titulo: 'Confirmar troca de posições',
    mensagem: `${primeiro.nome} e ${segundo.nome} trocarão suas posições completas da escala fixa.${trocaEntreTurnos ? `\n\nEsta é uma TROCA ENTRE TURNOS:\n${primeiro.nome}: ${turnoPrimeiroAntes} → ${turnoSegundoAntes}\n${segundo.nome}: ${turnoSegundoAntes} → ${turnoPrimeiroAntes}` : `\n\nOs dois permanecem no ${turnoPrimeiroAntes}.`}\n\nANTES\n${primeiro.nome}: ${resumoPosicaoParaTroca(primeiro)}\n${segundo.nome}: ${resumoPosicaoParaTroca(segundo)}\n\nDEPOIS\n${primeiro.nome}: posição de ${segundo.nome}${trocaEntreTurnos ? ` e passa para ${turnoSegundoAntes}` : ''}\n${segundo.nome}: posição de ${primeiro.nome}${trocaEntreTurnos ? ` e passa para ${turnoPrimeiroAntes}` : ''}\n\nNenhum colaborador será removido e nenhuma vaga A DEFINIR será criada. Situações continuam vinculadas à própria pessoa.`,
    confirmarTexto: 'Confirmar troca',
    tipo: 'aviso'
  });
  if (!confirmado) return;

  const botao = $('btnTrocarPosicoesModal');
  setLoadingBotao(botao, true, 'Trocando...');
  try {
    primeiro.dias = diasSegundo.slice();
    segundo.dias = diasPrimeiro.slice();
    primeiro.turno = turnoSegundoAntes;
    segundo.turno = turnoPrimeiroAntes;
    if (trocaEntreTurnos) {
      SITUACOES_REGISTROS.forEach((item) => {
        if (item.colaboradorId === primeiro.id) item.turno = primeiro.turno;
        if (item.colaboradorId === segundo.id) item.turno = segundo.turno;
      });
    }
    normalizarDadosAtuais();
    salvarCacheMes();
    atualizarInterfaceCompleta({ preservarAdmin: true });
    fecharModalCrudAdmin();
    msgAdmin(`${primeiro.nome} e ${segundo.nome} trocaram suas posições da escala fixa${trocaEntreTurnos ? ` e seus turnos (${turnoPrimeiroAntes} ↔ ${turnoSegundoAntes})` : ''}.`);
    toast('Posições trocadas. Confirmando na planilha...', 'ok', 4500);
    await enviarAlteracaoAdmin({
      acao: 'trocarPosicoes',
      senha: adminSenhaSessao,
      equipe: APP.equipe || CONFIG.equipe,
      colaboradorAId: primeiro.id,
      colaboradorBId: segundo.id,
      diasAEsperados: diasSegundo,
      diasBEsperados: diasPrimeiro,
      turnoAEsperado: primeiro.turno,
      turnoBEsperado: segundo.turno
    });
  } finally {
    setLoadingBotao(botao, false);
  }
}


function colaboradoresSemEscalaFixa() {
  return pessoasAtivas()
    .filter((pessoa) => !ehVagaAberta(pessoa))
    .filter((pessoa) => !colaboradorPossuiEscalaFixa(pessoa))
    .slice()
    .sort((a, b) => {
      const turno = normalizarTurnoComparacao(a.turno).localeCompare(normalizarTurnoComparacao(b.turno), 'pt-BR');
      return turno || a.nome.localeCompare(b.nome, 'pt-BR');
    });
}

function colaboradoresComEscalaFixa() {
  return pessoasAtivas()
    .filter((pessoa) => !ehVagaAberta(pessoa))
    .filter(colaboradorPossuiEscalaFixa)
    .slice()
    .sort((a, b) => {
      const turno = normalizarTurnoComparacao(a.turno).localeCompare(normalizarTurnoComparacao(b.turno), 'pt-BR');
      return turno || a.nome.localeCompare(b.nome, 'pt-BR');
    });
}

function definirDestinoOcupanteAssumir(destino) {
  contextoCrudModal.destinoOcupante = destino === 'RETIRAR' ? 'RETIRAR' : 'MANTER';
  const novoId = String($('selectNovoAssumirPosicao')?.value || contextoCrudModal.id || '').trim();
  const atualId = String($('selectPosicaoAssumida')?.value || '').trim();
  renderizarFormularioAssumirPosicao(novoId, atualId);
}

function renderizarFormularioAssumirPosicao(novoId = '', atualId = '') {
  const conteudo = $('conteudoModalCrudAdmin');
  const acoes = $('acoesModalCrudAdmin');
  if (!conteudo || !acoes) return;

  const novos = colaboradoresSemEscalaFixa();
  const atuais = colaboradoresComEscalaFixa();
  if (!novos.length || !atuais.length) {
    conteudo.innerHTML = `<div class="modal-vazio">${!novos.length
      ? 'Não há colaborador ativo sem escala fixa. Quando alguém estiver aguardando posição, aparecerá aqui.'
      : 'Não há posição ativa com escala fixa disponível para ser assumida.'}</div>`;
    acoes.innerHTML = '<button type="button" class="btn secundario" onclick="fecharModalCrudAdmin()">Fechar</button>';
    return;
  }

  const novo = novos.find((item) => item.id === novoId) || null;
  let atuaisOrdenados = atuais;
  if (novo) {
    atuaisOrdenados = atuais.slice().sort((a, b) => {
      const mesmoA = mesmoTurno(a.turno, novo.turno) ? 0 : 1;
      const mesmoB = mesmoTurno(b.turno, novo.turno) ? 0 : 1;
      return mesmoA - mesmoB || `${a.turno}|${a.nome}`.localeCompare(`${b.turno}|${b.nome}`, 'pt-BR');
    });
  }
  const atual = atuaisOrdenados.find((item) => item.id === atualId) || null;
  contextoCrudModal.id = novo?.id || '';
  const destinoOcupante = contextoCrudModal.destinoOcupante === 'RETIRAR' ? 'RETIRAR' : 'MANTER';

  const vinculosAtual = atual ? registrosTemporaisDaPessoa(atual.id) : { situacoes: 0, coberturas: 0 };
  const vinculosNovo = novo ? registrosTemporaisDaPessoa(novo.id) : { situacoes: 0, coberturas: 0 };
  const trocaTurno = Boolean(novo && atual && !mesmoTurno(novo.turno, atual.turno));
  const textoDestino = destinoOcupante === 'RETIRAR'
    ? 'Será retirado da equipe. O cadastro ficará inativo e não será criada vaga A DEFINIR, porque a posição já foi preenchida.'
    : 'Continuará ativo na equipe, mas ficará SEM ESCALA FIXA / AGUARDANDO POSIÇÃO. Depois poderá assumir uma vaga ou outra posição.';

  conteudo.innerHTML = `
    <div class="form-preencher-vaga">
      <div class="alerta-lista-troca-completa">
        <strong>Substituição de posição</strong>
        <span>O colaborador sem escala recebe os 31 dias da posição escolhida. Antes de confirmar, defina o que deve acontecer com o ocupante atual.</span>
      </div>
      <div class="modal-campo-bloco">
        <label for="selectNovoAssumirPosicao">1. Colaborador que assumirá</label>
        <select id="selectNovoAssumirPosicao" data-modal-ajuda="Mostra colaboradores ativos que ainda não possuem escala fixa.">
          <option value="">Selecione o colaborador</option>
          ${novos.map((item) => `<option value="${escaparHTML(item.id)}" ${novo?.id === item.id ? 'selected' : ''}>${escaparHTML(item.nome)} • ${escaparHTML(item.turno)}${item.registro ? ` • Reg. ${escaparHTML(item.registro)}` : ''} • AGUARDANDO POSIÇÃO</option>`).join('')}
        </select>
      </div>
      <div class="modal-campo-bloco">
        <label for="selectPosicaoAssumida">2. Posição que será assumida</label>
        <select id="selectPosicaoAssumida" data-modal-ajuda="Escolha o colaborador cuja posição será transferida.">
          <option value="">Selecione a posição atual</option>
          ${atuaisOrdenados.map((item) => `<option value="${escaparHTML(item.id)}" ${atual?.id === item.id ? 'selected' : ''}>${escaparHTML(item.nome)} • ${escaparHTML(item.turno)}${item.registro ? ` • Reg. ${escaparHTML(item.registro)}` : ''}</option>`).join('')}
        </select>
        <small class="muted mini-ajuda">Posições do mesmo turno aparecem primeiro. Se a posição for de outro turno, quem assumir passará automaticamente para o turno daquela posição.</small>
      </div>
      ${atual ? `
        <div class="bloco-tipo-cobertura bloco-destino-ocupante">
          <span class="rotulo-cobertura">3. O que acontecerá com ${escaparHTML(atual.nome)}?</span>
          <div class="opcoes-tipo-cobertura" role="group" aria-label="Destino do ocupante atual">
            <button type="button" class="opcao-tipo-cobertura ${destinoOcupante === 'MANTER' ? 'ativo' : ''}" onclick="definirDestinoOcupanteAssumir('MANTER')">Manter na equipe</button>
            <button type="button" class="opcao-tipo-cobertura ${destinoOcupante === 'RETIRAR' ? 'ativo' : ''}" onclick="definirDestinoOcupanteAssumir('RETIRAR')">Retirar da equipe</button>
          </div>
          <small class="muted mini-ajuda">${destinoOcupante === 'MANTER'
            ? `${escaparHTML(atual.nome)} continuará ativo, mas sem os 31 postos atuais. Ficará identificado no Admin como aguardando posição e não aparecerá na escala diária até receber uma nova posição.`
            : `${escaparHTML(atual.nome)} ficará inativo no cadastro. Use esta opção apenas quando ele realmente deixar a equipe.`}</small>
        </div>` : ''}
      ${novo && atual ? `
        <div class="preview-troca-posicoes">
          <div class="preview-troca-bloco">
            <strong>Antes</strong>
            <div class="preview-troca-linha"><b>${escaparHTML(novo.nome)}</b><span>${escaparHTML(novo.turno)} • aguardando posição</span></div>
            <div class="preview-troca-linha"><b>${escaparHTML(atual.nome)}</b><span>${escaparHTML(atual.turno)} • ${escaparHTML(resumoPosicaoParaTroca(atual))}</span></div>
          </div>
          <div class="preview-troca-bloco depois">
            <strong>Depois</strong>
            <div class="preview-troca-linha"><b>${escaparHTML(novo.nome)}</b><span>Assume toda a posição de ${escaparHTML(atual.nome)}${trocaTurno ? ` e passa para ${escaparHTML(atual.turno)}` : ''}.</span></div>
            <div class="preview-troca-linha"><b>${escaparHTML(atual.nome)}</b><span>${escaparHTML(textoDestino)}</span></div>
          </div>
          ${(vinculosAtual.situacoes || vinculosAtual.coberturas || vinculosNovo.situacoes || vinculosNovo.coberturas)
            ? `<div class="aviso-troca-vinculos"><b>Atenção aos registros temporários:</b> ${escaparHTML(atual.nome)} possui ${vinculosAtual.situacoes} situação(ões) e ${vinculosAtual.coberturas} cobertura(s) futuras/ativas; ${escaparHTML(novo.nome)} possui ${vinculosNovo.situacoes} situação(ões) e ${vinculosNovo.coberturas} cobertura(s). Esses registros continuam vinculados às respectivas pessoas. Revise coberturas ativas após a substituição.</div>`
            : ''}
        </div>` : '<div class="modal-vazio">Selecione quem assumirá e a posição atual para ver a prévia completa.</div>'}
    </div>`;

  $('selectNovoAssumirPosicao')?.addEventListener('change', (evento) => renderizarFormularioAssumirPosicao(evento.target.value, atual?.id || ''));
  $('selectPosicaoAssumida')?.addEventListener('change', (evento) => renderizarFormularioAssumirPosicao(novo?.id || '', evento.target.value));
  acoes.innerHTML = `
    <button type="button" class="btn secundario" onclick="fecharModalCrudAdmin()">Cancelar</button>
    <button id="btnAssumirPosicaoModal" type="button" class="btn principal" ${novo && atual ? '' : 'disabled'} onclick="assumirPosicaoPeloModal()"><span class="btn-texto">Confirmar substituição</span><span class="spinner-botao" hidden></span></button>`;
}

async function assumirPosicaoPeloModal() {
  if (!exigirAdmin()) return;
  const novoId = String($('selectNovoAssumirPosicao')?.value || '').trim();
  const atualId = String($('selectPosicaoAssumida')?.value || '').trim();
  const destinoOcupante = contextoCrudModal.destinoOcupante === 'RETIRAR' ? 'RETIRAR' : 'MANTER';
  const novo = colaboradorPorId(novoId);
  const atual = colaboradorPorId(atualId);
  if (!novo || ehVagaAberta(novo) || !atual || ehVagaAberta(atual)) {
    await mostrarAvisoApp({ titulo: 'Assumir posição', mensagem: 'Selecione o colaborador que assumirá e a posição atual.', tipo: 'aviso' });
    return;
  }
  if (novo.id === atual.id) {
    await mostrarAvisoApp({ titulo: 'Assumir posição', mensagem: 'Os dois colaboradores precisam ser pessoas diferentes.', tipo: 'aviso' });
    return;
  }
  if (colaboradorPossuiEscalaFixa(novo)) {
    await mostrarAvisoApp({ titulo: 'Colaborador já possui escala', mensagem: `${novo.nome} já possui uma posição. Para duas pessoas com escala use “Trocar posições” ou “Realocar para vaga”.`, tipo: 'aviso' });
    return;
  }
  if (!colaboradorPossuiEscalaFixa(atual)) {
    await mostrarAvisoApp({ titulo: 'Posição sem escala', mensagem: `${atual.nome} não possui postos definidos para transferir.`, tipo: 'aviso' });
    return;
  }

  const diasRecebidos = Array.from({ length: 31 }, (_, i) => postoDoDia(atual.dias?.[i] || ''));
  const turnoAnteriorNovo = novo.turno;
  const turnoDestino = atual.turno;
  const mudaTurno = !mesmoTurno(turnoAnteriorNovo, turnoDestino);
  const destinoTexto = destinoOcupante === 'RETIRAR'
    ? `${atual.nome} será RETIRADO DA EQUIPE e ficará inativo.`
    : `${atual.nome} será MANTIDO NA EQUIPE, porém ficará SEM ESCALA FIXA / AGUARDANDO POSIÇÃO.`;
  const confirmado = await confirmarAcaoApp({
    titulo: 'Confirmar substituição na escala',
    mensagem: `${novo.nome} assumirá a posição completa de ${atual.nome}.\n\n${novo.nome}: ${turnoAnteriorNovo}${mudaTurno ? ` → ${turnoDestino}` : ''}\nPosição recebida: ${resumoPosicaoParaTroca(atual)}\n\n${destinoTexto}\n\nNenhuma vaga A DEFINIR será criada, porque a posição atual já será ocupada por ${novo.nome}.`,
    confirmarTexto: 'Confirmar substituição',
    tipo: destinoOcupante === 'RETIRAR' ? 'perigo' : 'aviso'
  });
  if (!confirmado) return;

  const botao = $('btnAssumirPosicaoModal');
  setLoadingBotao(botao, true, 'Substituindo...');
  try {
    novo.dias = diasRecebidos.slice();
    novo.turno = turnoCanonico(turnoDestino);
    if (mudaTurno) {
      SITUACOES_REGISTROS.forEach((item) => {
        if (item.colaboradorId === novo.id) item.turno = novo.turno;
      });
    }

    if (destinoOcupante === 'RETIRAR') {
      ESCALA = ESCALA.filter((item) => item.id !== atual.id);
    } else {
      atual.dias = Array(31).fill('');
      atual.ativo = true;
    }

    normalizarDadosAtuais();
    salvarCacheMes();
    atualizarInterfaceCompleta({ preservarAdmin: true });
    fecharModalCrudAdmin();
    const resultadoAtual = destinoOcupante === 'RETIRAR'
      ? `${atual.nome} foi retirado da equipe.`
      : `${atual.nome} permanece ativo e está aguardando nova posição.`;
    msgAdmin(`${novo.nome} assumiu a posição de ${atual.nome}. ${resultadoAtual}`);
    toast(`${novo.nome} assumiu a posição. Confirmando na planilha...`, 'ok', 5500);
    await enviarAlteracaoAdmin({
      acao: 'assumirPosicao',
      senha: adminSenhaSessao,
      equipe: APP.equipe || CONFIG.equipe,
      novoColaboradorId: novo.id,
      colaboradorSubstituidoId: atual.id,
      destinoOcupante,
      diasEsperados: diasRecebidos,
      turnoEsperado: novo.turno
    });
  } finally {
    setLoadingBotao(botao, false);
  }
}

function colaboradoresElegiveisRealocacao() {
  return pessoasAtivas()
    .filter((pessoa) => (pessoa.dias || []).some((valor) => Boolean(postoDoDia(valor))))
    .slice()
    .sort((a, b) => `${a.turno}|${a.nome}`.localeCompare(`${b.turno}|${b.nome}`, 'pt-BR'));
}

function resumoEscalaPessoa(pessoa) {
  const postos = [...new Set((pessoa?.dias || []).map((valor) => postoDoDia(valor)).filter(Boolean))];
  if (!postos.length) return 'Sem postos definidos';
  const primeiros = postos.slice(0, 4).map((posto) => `${posto} • ${postoDescricao(posto)}`);
  return `Escala atual: ${primeiros.join(' | ')}${postos.length > 4 ? ` +${postos.length - 4}` : ''}`;
}

function renderizarFormularioRealocarColaborador(colaboradorId = '', vagaId = '') {
  const conteudo = $('conteudoModalCrudAdmin');
  const acoes = $('acoesModalCrudAdmin');
  if (!conteudo || !acoes) return;

  const colaboradores = colaboradoresElegiveisRealocacao();
  if (!colaboradores.length) {
    conteudo.innerHTML = '<div class="modal-vazio">Não há colaborador com escala fixa disponível para realocação.</div>';
    acoes.innerHTML = '<button type="button" class="btn secundario" onclick="fecharModalCrudAdmin()">Fechar</button>';
    return;
  }

  const pessoa = colaboradores.find((item) => item.id === colaboradorId) || colaboradores[0];
  const vagas = vagasAbertas(pessoa.turno);
  const vaga = vagas.find((item) => item.id === vagaId) || vagas[0] || null;
  contextoCrudModal.id = pessoa.id;

  conteudo.innerHTML = `
    <div class="form-preencher-vaga">
      <div class="modal-campo-bloco">
        <label for="selectColaboradorRealocar">Colaborador que mudará de posição</label>
        <select id="selectColaboradorRealocar">${colaboradores.map((item) => `<option value="${escaparHTML(item.id)}" ${item.id === pessoa.id ? 'selected' : ''}>${escaparHTML(item.nome)} • ${escaparHTML(item.turno)}${item.registro ? ` • Reg. ${escaparHTML(item.registro)}` : ''}</option>`).join('')}</select>
        <small class="muted mini-ajuda">Este colaborador já possui escala. A escala atual dele será preservada como uma nova vaga A DEFINIR.</small>
      </div>
      <div class="resumo-vaga"><strong>${escaparHTML(pessoa.nome)} • posição atual</strong><span>${escaparHTML(resumoEscalaPessoa(pessoa))}</span></div>
      <div class="modal-campo-bloco">
        <label for="selectVagaDestinoRealocar">Vaga que será assumida</label>
        <select id="selectVagaDestinoRealocar">${vagas.length ? vagas.map((item) => `<option value="${escaparHTML(item.id)}" ${vaga?.id === item.id ? 'selected' : ''}>${escaparHTML(rotuloVagaAberta(item))} • ${escaparHTML(item.turno)} • ${escaparHTML(resumoVagaAberta(item))}</option>`).join('') : '<option value="">Nenhuma vaga A DEFINIR neste turno</option>'}</select>
        <small class="muted mini-ajuda">Somente vagas do mesmo turno são exibidas.</small>
      </div>
      ${vaga ? `<div class="resumo-vaga"><strong>Nova posição de ${escaparHTML(pessoa.nome)}</strong><span>${escaparHTML(resumoVagaAberta(vaga))}</span></div>` : '<div class="modal-vazio">Não existe vaga A DEFINIR no mesmo turno deste colaborador. Primeiro retire da equipe a pessoa cuja posição ficará disponível.</div>'}
      <div class="resumo-realocacao-admin">
        <strong>O que acontecerá</strong>
        <span>1. ${escaparHTML(pessoa.nome)} assume a escala da vaga selecionada.</span>
        <span>2. A escala atual de ${escaparHTML(pessoa.nome)} não é perdida: ela vira uma nova vaga A DEFINIR.</span>
        <span>3. A quantidade de posições da equipe permanece a mesma.</span>
      </div>
    </div>`;

  $('selectColaboradorRealocar')?.addEventListener('change', (evento) => renderizarFormularioRealocarColaborador(evento.target.value, ''));
  $('selectVagaDestinoRealocar')?.addEventListener('change', (evento) => renderizarFormularioRealocarColaborador(pessoa.id, evento.target.value));
  acoes.innerHTML = `
    <button type="button" class="btn secundario" onclick="fecharModalCrudAdmin()">Cancelar</button>
    <button id="btnRealocarColaboradorModal" type="button" class="btn principal" ${vaga ? '' : 'disabled'} onclick="realocarColaboradorPeloModal()"><span class="btn-texto">Realocar colaborador</span><span class="spinner-botao" hidden></span></button>`;
}

async function realocarColaboradorPeloModal() {
  if (!exigirAdmin()) return;
  const colaboradorId = String($('selectColaboradorRealocar')?.value || '').trim();
  const vagaDestinoId = String($('selectVagaDestinoRealocar')?.value || '').trim();
  const pessoa = colaboradorPorId(colaboradorId);
  const vagaDestino = colaboradorPorId(vagaDestinoId);
  if (!pessoa || ehVagaAberta(pessoa)) { toast('Selecione um colaborador válido.', 'erro'); return; }
  if (!vagaDestino || !ehVagaAberta(vagaDestino)) { toast('Selecione uma vaga A DEFINIR válida.', 'erro'); return; }
  if (!mesmoTurno(pessoa.turno, vagaDestino.turno)) { toast('O colaborador e a vaga precisam ser do mesmo turno.', 'erro'); return; }
  const diasAtuais = Array.from({ length: 31 }, (_, i) => postoDoDia(pessoa.dias?.[i] || ''));
  const diasDestino = Array.from({ length: 31 }, (_, i) => postoDoDia(vagaDestino.dias?.[i] || ''));
  if (!diasAtuais.some(Boolean)) {
    await mostrarAvisoApp({ titulo: 'Colaborador sem escala', mensagem: `${pessoa.nome} ainda não possui postos definidos. Neste caso use “Preencher vaga”, pois não existe uma posição atual para preservar como A DEFINIR.`, botaoTexto: 'Entendi', tipo: 'aviso' });
    return;
  }
  if (!diasDestino.some(Boolean)) { toast('A vaga selecionada não possui postos definidos.', 'erro'); return; }

  const confirmado = await confirmarAcaoApp({
    titulo: 'Confirmar realocação',
    mensagem: `${pessoa.nome} assumirá ${rotuloVagaAberta(vagaDestino)} (${vagaDestino.turno}).\n\nNova posição:\n${resumoVagaAberta(vagaDestino)}\n\nPosição atual de ${pessoa.nome}:\n${resumoEscalaPessoa(pessoa)}\n\nA posição atual NÃO será apagada. Ela será transformada em “A DEFINIR — vaga de ${pessoa.nome}” para ser preenchida depois.`,
    confirmarTexto: 'Realocar e preservar vaga',
    tipo: 'aviso'
  });
  if (!confirmado) return;

  const botao = $('btnRealocarColaboradorModal');
  setLoadingBotao(botao, true, 'Realocando...');
  const novaVagaId = criarIdVagaLocal(pessoa.turno);
  const novaVaga = {
    id: novaVagaId,
    nome: 'A DEFINIR',
    registro: registroReferenciaVaga(pessoa.nome),
    referenciaVaga: String(pessoa.nome || '').trim().toUpperCase(),
    turno: turnoCanonico(pessoa.turno),
    ativo: true,
    dias: diasAtuais
  };
  try {
    pessoa.dias = diasDestino;
    ESCALA = ESCALA.filter((item) => item.id !== vagaDestino.id);
    ESCALA.push(novaVaga);
    normalizarDadosAtuais();
    salvarCacheMes();
    atualizarInterfaceCompleta({ preservarAdmin: true });
    fecharModalCrudAdmin();
    msgAdmin(`${pessoa.nome} foi realocado. A posição anterior foi preservada como A DEFINIR.`);
    toast(`${pessoa.nome} realocado. A vaga anterior foi preservada.`, 'ok', 5500);
    await enviarAlteracaoAdmin({
      acao: 'realocarColaborador',
      senha: adminSenhaSessao,
      equipe: APP.equipe || CONFIG.equipe,
      colaboradorId: pessoa.id,
      vagaDestinoId: vagaDestino.id,
      novaVagaId
    });
  } finally {
    setLoadingBotao(botao, false);
  }
}

function colaboradoresElegiveisParaVaga(vaga) {
  if (!vaga) return [];
  return pessoasAtivas()
    .filter((pessoa) => mesmoTurno(pessoa.turno, vaga.turno))
    .filter((pessoa) => !(pessoa.dias || []).some((valor) => Boolean(postoDoDia(valor))))
    .slice()
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}

function renderizarFormularioPreencherVaga(vagaId = '') {
  const conteudo = $('conteudoModalCrudAdmin');
  const acoes = $('acoesModalCrudAdmin');
  if (!conteudo || !acoes) return;
  const vagas = vagasAbertas();
  if (!vagas.length) {
    conteudo.innerHTML = '<div class="modal-vazio">Não há nenhuma vaga A DEFINIR na escala fixa.</div>';
    acoes.innerHTML = '<button type="button" class="btn secundario" onclick="fecharModalCrudAdmin()">Fechar</button>';
    return;
  }
  const selecionada = vagas.find((item) => item.id === vagaId) || vagas[0];
  contextoCrudModal.id = selecionada.id;
  const candidatos = colaboradoresElegiveisParaVaga(selecionada);
  conteudo.innerHTML = `
    <div class="form-preencher-vaga">
      <div class="modal-campo-bloco">
        <label for="selectVagaAberta">Vaga aberta</label>
        <select id="selectVagaAberta">${vagas.map((vaga) => `<option value="${escaparHTML(vaga.id)}" ${vaga.id === selecionada.id ? 'selected' : ''}>${escaparHTML(rotuloVagaAberta(vaga))} • ${escaparHTML(vaga.turno)} • ${escaparHTML(resumoVagaAberta(vaga))}</option>`).join('')}</select>
      </div>
      <div class="resumo-vaga"><strong>${escaparHTML(rotuloVagaAberta(selecionada))} • ${escaparHTML(selecionada.turno)}</strong><span>${escaparHTML(resumoVagaAberta(selecionada))}</span></div>
      <div class="modal-campo-bloco">
        <label for="selectNovoColaboradorVaga">Novo colaborador</label>
        <select id="selectNovoColaboradorVaga">${candidatos.length ? '<option value="">Selecione o colaborador</option>' + candidatos.map((pessoa) => `<option value="${escaparHTML(pessoa.id)}">${escaparHTML(pessoa.nome)}${pessoa.registro ? ` • Registro ${escaparHTML(pessoa.registro)}` : ''}</option>`).join('') : '<option value="">Nenhum colaborador sem escala neste turno</option>'}</select>
        <small class="muted mini-ajuda">${candidatos.length ? 'A sequência de postos da vaga será transferida para o colaborador escolhido.' : 'Adicione primeiro o novo colaborador no mesmo turno. Ele aparecerá aqui enquanto estiver sem postos definidos.'}</small>
      </div>
    </div>`;
  $('selectVagaAberta')?.addEventListener('change', (evento) => renderizarFormularioPreencherVaga(evento.target.value));
  acoes.innerHTML = `
    <button type="button" class="btn secundario" onclick="fecharModalCrudAdmin()">Cancelar</button>
    <button id="btnPreencherVagaModal" type="button" class="btn principal" ${candidatos.length ? '' : 'disabled'} onclick="preencherVagaPeloModal()"><span class="btn-texto">Preencher vaga</span><span class="spinner-botao" hidden></span></button>`;
}

async function preencherVagaPeloModal() {
  if (!exigirAdmin()) return;
  const vaga = colaboradorPorId($('selectVagaAberta')?.value || contextoCrudModal.id);
  const pessoa = colaboradorPorId($('selectNovoColaboradorVaga')?.value || '');
  if (!vaga || !ehVagaAberta(vaga)) { toast('Selecione uma vaga válida.', 'erro'); return; }
  if (!pessoa || ehVagaAberta(pessoa)) { toast('Selecione o novo colaborador.', 'erro'); return; }
  if (!mesmoTurno(vaga.turno, pessoa.turno)) { toast('A vaga e o colaborador precisam ser do mesmo turno.', 'erro'); return; }
  if ((pessoa.dias || []).some((valor) => Boolean(postoDoDia(valor)))) {
    await mostrarAvisoApp({ titulo: 'Colaborador já possui escala', mensagem: `${pessoa.nome} já possui postos definidos. Para evitar perda de dados, somente colaboradores ainda sem escala podem preencher uma vaga.`, botaoTexto: 'Entendi', tipo: 'aviso' });
    return;
  }
  const confirmado = await confirmarAcaoApp({
    titulo: 'Preencher vaga A DEFINIR',
    mensagem: `Transferir ${rotuloVagaAberta(vaga)} para ${pessoa.nome}?\n\nTurno: ${vaga.turno}\n${resumoVagaAberta(vaga)}\n\nA vaga desaparecerá da escala operacional e ${pessoa.nome} assumirá os mesmos postos dos 31 dias.`,
    confirmarTexto: 'Preencher vaga',
    tipo: 'aviso'
  });
  if (!confirmado) return;
  const botao = $('btnPreencherVagaModal');
  setLoadingBotao(botao, true, 'Preenchendo...');
  try {
    pessoa.dias = Array.from({ length: 31 }, (_, i) => postoDoDia(vaga.dias?.[i] || ''));
    ESCALA = ESCALA.filter((item) => item.id !== vaga.id);
    normalizarDadosAtuais();
    salvarCacheMes();
    atualizarInterfaceCompleta({ preservarAdmin: true });
    fecharModalCrudAdmin();
    toast(`Vaga preenchida por ${pessoa.nome}.`, 'ok');
    msgAdmin(`${pessoa.nome} assumiu ${rotuloVagaAberta(vaga)} • ${vaga.turno}.`);
    await enviarAlteracaoAdmin({ acao: 'preencherVaga', senha: adminSenhaSessao, equipe: APP.equipe || CONFIG.equipe, vagaId: vaga.id, colaboradorId: pessoa.id });
  } finally { setLoadingBotao(botao, false); }
}

function itensCrudDisponiveis() {
  if (contextoCrudModal.tipo === 'colaborador') {
    return pessoasAtivas().slice().sort((a, b) => `${a.turno}${a.nome}`.localeCompare(`${b.turno}${b.nome}`, 'pt-BR')).map((pessoa) => ({
      id: pessoa.id,
      titulo: pessoa.nome,
      subtitulo: `${pessoa.turno}${pessoa.registro ? ` • Registro ${pessoa.registro}` : ''}`
    }));
  }
  return listaCodigosPostosAdmin().map((codigo) => ({ id: codigo, titulo: `${codigo} — ${postoDescricao(codigo)}`, subtitulo: LEGENDA[codigo]?.setor || LEGENDA[codigo]?.local || '' }));
}

function renderizarListaCrud(filtro = '') {
  const conteudo = $('conteudoModalCrudAdmin');
  const acoes = $('acoesModalCrudAdmin');
  if (!conteudo || !acoes) return;
  const termo = String(filtro || '').trim().toLocaleLowerCase('pt-BR');
  const itens = itensCrudDisponiveis().filter((item) => `${item.titulo} ${item.subtitulo}`.toLocaleLowerCase('pt-BR').includes(termo));
  conteudo.innerHTML = `
    <div class="modal-lista-topo">
      <input id="buscaCrudModal" class="modal-busca" type="search" placeholder="Pesquisar..." value="${escaparHTML(filtro)}" autocomplete="off" />
    </div>
    <div class="modal-lista-opcoes">
      ${itens.length ? itens.map((item) => `
        <button type="button" class="modal-opcao" data-crud-id="${escaparHTML(item.id)}">
          <strong>${escaparHTML(item.titulo)}</strong>
          <small>${escaparHTML(item.subtitulo)}</small>
        </button>`).join('') : '<div class="modal-vazio">Nenhum item encontrado.</div>'}
    </div>`;
  acoes.innerHTML = '<button type="button" class="btn secundario" onclick="fecharModalCrudAdmin()">Cancelar</button>';
  $('buscaCrudModal')?.addEventListener('input', (evento) => renderizarListaCrud(evento.target.value));
  conteudo.querySelectorAll('[data-crud-id]').forEach((botao) => botao.addEventListener('click', () => selecionarItemCrudModal(botao.dataset.crudId)));
  setTimeout(() => $('buscaCrudModal')?.focus(), 20);
}

async function selecionarItemCrudModal(id) {
  contextoCrudModal.id = String(id || '');
  if (contextoCrudModal.modo === 'editar') {
    $('subtituloModalCrudAdmin').textContent = 'Altere os dados necessários e toque em Salvar alterações.';
    renderizarFormularioCrud();
    return;
  }
  if (contextoCrudModal.modo === 'retirar') {
    const pessoa = colaboradorPorId(id);
    if (!pessoa || ehVagaAberta(pessoa)) return;
    const postos = [...new Set((pessoa.dias || []).map((valor) => postoDoDia(valor)).filter(Boolean))];
    const confirmado = await confirmarAcaoApp({
      titulo: 'Retirar colaborador da equipe',
      mensagem: `Retirar ${pessoa.nome} da equipe?\n\nO cadastro será desativado, mas a sequência de postos dos 31 dias será preservada como “A DEFINIR — vaga de ${pessoa.nome}” (${pessoa.turno}).${postos.length ? `\n\nPostos presentes na escala: ${postos.join(', ')}.` : '\n\nA escala atual não possui postos preenchidos.'}\n\nUse Excluir somente quando o cadastro estiver incorreto ou duplicado.`,
      confirmarTexto: 'Retirar e manter A DEFINIR',
      tipo: 'aviso'
    });
    if (!confirmado) return;
    await executarRetiradaEquipe(pessoa);
    return;
  }
  const tipo = contextoCrudModal.tipo;
  const item = tipo === 'colaborador' ? colaboradorPorId(id) : LEGENDA[id];
  if (!item) return;
  const nome = tipo === 'colaborador' ? `${item.nome} • ${item.turno}` : `${id} — ${postoDescricao(id)}`;
  const mensagem = tipo === 'colaborador'
    ? `Excluir definitivamente ${nome}?

Use esta opção somente para cadastro incorreto ou duplicado. Se a pessoa saiu da equipe, cancele e use “Retirar da equipe” para preservar a escala como A DEFINIR.

Ao excluir, o colaborador e a escala fixa serão removidos. Os registros antigos serão preservados.`
    : `Excluir definitivamente o posto ${nome}?

As posições desse posto serão limpas da escala fixa. Os registros antigos serão preservados.`;
  const confirmado = await confirmarAcaoApp({ titulo: `Excluir ${tipo}`, mensagem, confirmarTexto: 'Excluir definitivamente', tipo: 'perigo' });
  if (!confirmado) return;
  await executarExclusaoCrudModal();
}

function renderizarFormularioCrud() {
  const conteudo = $('conteudoModalCrudAdmin');
  const acoes = $('acoesModalCrudAdmin');
  if (!conteudo || !acoes) return;
  const editando = contextoCrudModal.modo === 'editar';

  if (contextoCrudModal.tipo === 'colaborador') {
    const pessoa = editando ? colaboradorPorId(contextoCrudModal.id) : null;
    const turnoReferenciaCrud = pessoa?.turno || $('selectTurnoConsulta')?.value || CONFIG.turno;
    const turnoAtual = turnosDisponiveis().find((turno) => mesmoTurno(turno, turnoReferenciaCrud)) || CONFIG.turno || turnosDisponiveis()[0];
    conteudo.innerHTML = `
      <div class="modal-form-grid">
        <div class="modal-campo-bloco"><label for="crudNome">Nome</label><input id="crudNome" type="text" value="${escaparHTML(pessoa?.nome || '')}" placeholder="Ex.: JOÃO" autocomplete="off" /></div>
        <div class="modal-campo-bloco"><label for="crudRegistro">Registro</label><input id="crudRegistro" type="text" inputmode="numeric" value="${escaparHTML(pessoa?.registro || '')}" placeholder="Registro do colaborador" /></div>
        <div class="modal-campo-bloco"><label for="crudTurno">Turno</label><select id="crudTurno">${turnosDisponiveis().map((turno) => `<option value="${escaparHTML(turno)}" ${mesmoTurno(turno, turnoAtual) ? 'selected' : ''}>${escaparHTML(turno)}</option>`).join('')}</select></div>
      </div>`;
  } else {
    const codigoOriginal = editando ? contextoCrudModal.id : '';
    const info = codigoOriginal ? LEGENDA[codigoOriginal] : null;
    conteudo.innerHTML = `
      <div class="modal-form-grid">
        <div class="modal-campo-bloco"><label for="crudCodigoPosto">Código do posto</label><input id="crudCodigoPosto" type="text" value="${escaparHTML(codigoOriginal)}" placeholder="Ex.: 78, G20, CMP" autocomplete="off" ${editando ? 'readonly aria-readonly="true"' : ''} /><small class="muted mini-ajuda">${editando ? 'O código identifica o posto e não é alterado na edição.' : 'Use um código único para o novo posto.'}</small></div>
        <div class="modal-campo-bloco"><label for="crudLocalizacao">Localização</label><input id="crudLocalizacao" type="text" value="${escaparHTML(typeof info === 'string' ? info : (info?.local || ''))}" placeholder="Ex.: Pátio central" /></div>
        <div class="modal-campo-bloco"><label for="crudSetor">Setor</label><input id="crudSetor" type="text" value="${escaparHTML(typeof info === 'string' ? info : (info?.setor || info?.local || ''))}" placeholder="Ex.: Carregamento" /></div>
      </div>`;
  }
  acoes.innerHTML = `
    <button type="button" class="btn secundario" onclick="${editando ? 'renderizarListaCrud()' : 'fecharModalCrudAdmin()'}">${editando ? 'Voltar à lista' : 'Cancelar'}</button>
    <button id="btnSalvarCrudModal" type="button" class="btn principal" onclick="salvarCrudModal()"><span class="btn-texto">${editando ? 'Salvar alterações' : 'Adicionar'}</span><span class="spinner-botao" hidden></span></button>`;
  setTimeout(() => (contextoCrudModal.tipo === 'colaborador' ? $('crudNome') : $('crudCodigoPosto'))?.focus(), 20);
}

async function salvarCrudModal() {
  if (!exigirAdmin()) return;
  if (contextoCrudModal.tipo === 'colaborador') await salvarColaboradorPeloModal();
  else await salvarPostoPeloModal();
}

async function salvarColaboradorPeloModal() {
  const editando = contextoCrudModal.modo === 'editar';
  const nome = String($('crudNome')?.value || '').trim().toUpperCase();
  const registro = String($('crudRegistro')?.value || '').trim();
  const turno = $('crudTurno')?.value || CONFIG.turno;
  if (!nome) { toast('Informe o nome do colaborador.', 'erro'); $('crudNome')?.focus(); return; }
  let pessoa = editando ? colaboradorPorId(contextoCrudModal.id) : null;
  if (editando && !pessoa) { toast('Colaborador não encontrado.', 'erro'); return; }
  const duplicado = pessoasAtivas().some((item) => item.id !== pessoa?.id && item.nome === nome && mesmoTurno(item.turno, turno));
  if (duplicado) { toast('Esse colaborador já existe neste turno.', 'erro'); return; }

  const confirmado = await confirmarAcaoApp({
    titulo: editando ? 'Salvar alterações do colaborador' : 'Adicionar colaborador',
    mensagem: editando
      ? `Confirmar as alterações de ${nome}?\n\nRegistro: ${registro || 'não informado'}\nTurno: ${turno}.`
      : `Adicionar ${nome} ao cadastro?\n\nRegistro: ${registro || 'não informado'}\nTurno: ${turno}.`,
    confirmarTexto: editando ? 'Salvar alterações' : 'Adicionar colaborador',
    tipo: editando ? 'aviso' : 'info'
  });
  if (!confirmado) return;

  const botao = $('btnSalvarCrudModal');
  setLoadingBotao(botao, true, 'Salvando...');
  try {
    if (!pessoa) {
      pessoa = { id: criarId('col', `${nome}-${turno}`), nome, registro, turno, ativo: true, dias: Array(31).fill('') };
      ESCALA.push(pessoa);
    } else {
      pessoa.nome = nome; pessoa.registro = registro; pessoa.turno = turno; pessoa.ativo = true;
    }
    normalizarDadosAtuais();
    salvarCacheMes();
    atualizarInterfaceCompleta({ preservarAdmin: true });
    fecharModalCrudAdmin();
    msgAdmin(editando ? `Dados de ${nome} atualizados.` : `Colaborador ${nome} adicionado.`);
    toast(editando ? 'Colaborador atualizado.' : 'Colaborador adicionado.', 'ok');
    await enviarAlteracaoAdmin({ acao: 'salvarColaborador', senha: adminSenhaSessao, mesAno: mesSelecionado, equipe: APP.equipe || CONFIG.equipe, colaborador: pessoa });
  } finally {
    setLoadingBotao(botao, false);
  }
}

async function salvarPostoPeloModal() {
  const editando = contextoCrudModal.modo === 'editar';
  const codigoOriginal = editando ? normalizarCodigoPosto(contextoCrudModal.id) : '';
  const codigo = editando ? codigoOriginal : normalizarCodigoPosto(String($('crudCodigoPosto')?.value || '').trim().toUpperCase());
  const local = String($('crudLocalizacao')?.value || '').trim();
  const setor = String($('crudSetor')?.value || '').trim();
  if (!codigo || !local) { toast('Informe o código e a localização.', 'erro'); return; }
  if (!editando && LEGENDA[codigo]?.ativo !== false) { toast('Esse código já existe. Use Editar.', 'erro'); return; }

  const confirmado = await confirmarAcaoApp({
    titulo: editando ? `Editar posto ${codigo}` : `Adicionar posto ${codigo}`,
    mensagem: `${editando ? 'Salvar as alterações deste posto?' : 'Adicionar este posto ao cadastro?'}\n\nLocal: ${local}\nSetor: ${setor || local}.`,
    confirmarTexto: editando ? 'Salvar alterações' : 'Adicionar posto',
    tipo: editando ? 'aviso' : 'info'
  });
  if (!confirmado) return;

  const botao = $('btnSalvarCrudModal');
  setLoadingBotao(botao, true, 'Salvando...');
  try {
    LEGENDA[codigo] = { local, setor: setor || local, ativo: true };
    salvarCacheMes();
    atualizarInterfaceCompleta({ preservarAdmin: true });
    fecharModalCrudAdmin();
    msgAdmin(editando ? `Posto ${codigo} atualizado.` : `Posto ${codigo} adicionado.`);
    toast(editando ? 'Posto atualizado.' : 'Posto adicionado.', 'ok');
    await enviarAlteracaoAdmin({ acao: 'salvarPosto', senha: adminSenhaSessao, equipe: APP.equipe || CONFIG.equipe, codigoOriginal, posto: { codigo, local, setor: setor || local, ativo: true } });
  } finally {
    setLoadingBotao(botao, false);
  }
}

async function executarRetiradaEquipe(pessoa) {
  if (!pessoa || ehVagaAberta(pessoa)) return;
  const vagaId = criarIdVagaLocal(pessoa.turno);
  const vaga = {
    id: vagaId,
    nome: 'A DEFINIR',
    registro: registroReferenciaVaga(pessoa.nome),
    referenciaVaga: String(pessoa.nome || '').trim().toUpperCase(),
    turno: turnoCanonico(pessoa.turno),
    ativo: true,
    dias: Array.from({ length: 31 }, (_, i) => postoDoDia(pessoa.dias?.[i] || ''))
  };
  ESCALA = ESCALA.filter((item) => item.id !== pessoa.id);
  ESCALA.push(vaga);
  normalizarDadosAtuais();
  salvarCacheMes();
  atualizarInterfaceCompleta({ preservarAdmin: true });
  fecharModalCrudAdmin();
  msgAdmin(`${pessoa.nome} foi retirado da equipe. A escala foi preservada como A DEFINIR — vaga de ${pessoa.nome}.`);
  toast(`Colaborador retirado. Criada A DEFINIR — vaga de ${pessoa.nome}.`, 'ok', 5000);
  await enviarAlteracaoAdmin({ acao: 'retirarColaborador', senha: adminSenhaSessao, equipe: APP.equipe || CONFIG.equipe, colaboradorId: pessoa.id, vagaId });
}

async function executarExclusaoCrudModal() {
  const tipo = contextoCrudModal.tipo;
  const id = contextoCrudModal.id;
  if (tipo === 'colaborador') {
    const pessoa = colaboradorPorId(id);
    if (!pessoa) return;
    ESCALA = ESCALA.filter((item) => item.id !== pessoa.id);
    salvarCacheMes();
    atualizarInterfaceCompleta({ preservarAdmin: true });
    fecharModalCrudAdmin();
    msgAdmin(`${pessoa.nome} foi excluído.`);
    toast('Colaborador excluído.', 'ok');
    await enviarAlteracaoAdmin({ acao: 'excluirColaborador', senha: adminSenhaSessao, colaboradorId: pessoa.id, equipe: APP.equipe || CONFIG.equipe });
    return;
  }
  const codigo = normalizarCodigoPosto(id);
  if (!codigo || !LEGENDA[codigo]) return;
  delete LEGENDA[codigo];
  ESCALA.forEach((pessoa) => { pessoa.dias = pessoa.dias.map((valorDia) => { const partes = decomporDiaEscala(valorDia); return comporDiaEscala(partes.posto === codigo ? '' : partes.posto, partes.situacao); }); });
  salvarCacheMes();
  atualizarInterfaceCompleta({ preservarAdmin: true });
  fecharModalCrudAdmin();
  msgAdmin(`Posto ${codigo} excluído.`);
  toast('Posto excluído.', 'ok');
  await enviarAlteracaoAdmin({ acao: 'excluirPosto', senha: adminSenhaSessao, equipe: APP.equipe || CONFIG.equipe, codigo });
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
    'FPT-X': 'FPT-CX', 'FPT/CX': 'FPT-CX', 'FPT CX': 'FPT-CX',
    'FALTA': 'AUSÊNCIA', 'AUSENCIA': 'AUSÊNCIA'
  };
  return mapa[chave] || original;
}

const SEPARADOR_SITUACAO_DIA = '@@SITUACAO@@';

function normalizarCodigoSituacao(valor) {
  const original = String(valor || '').trim().toUpperCase();
  const semAcento = original.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const mapa = {
    'FALTA': 'AUSÊNCIA',
    'AUSENCIA': 'AUSÊNCIA',
    'ATESTADO MEDICO': 'ATESTADO',
    'LICENCA MEDICA': 'ATESTADO'
  };
  return mapa[semAcento] || original;
}

function descricaoSituacao(codigo) {
  const normalizado = normalizarCodigoSituacao(codigo);
  const item = (typeof STATUS_ESCALA !== 'undefined' ? STATUS_ESCALA : [])
    .find((opcao) => normalizarCodigoSituacao(opcao.codigo) === normalizado);
  return item?.descricao || normalizado;
}

function decomporDiaEscala(valor) {
  const texto = String(valor || '').trim();
  if (!texto) return { posto: '', situacao: '' };

  const indice = texto.indexOf(SEPARADOR_SITUACAO_DIA);
  if (indice >= 0) {
    const posto = normalizarCodigoPosto(texto.slice(0, indice));
    const situacao = normalizarCodigoSituacao(texto.slice(indice + SEPARADOR_SITUACAO_DIA.length));
    return {
      posto: posto && !SITUACOES.has(posto) ? posto : '',
      situacao: SITUACOES.has(situacao) ? situacao : ''
    };
  }

  const normalizado = normalizarCodigoPosto(texto);
  const situacao = normalizarCodigoSituacao(normalizado);
  if (SITUACOES.has(situacao)) return { posto: '', situacao };
  return { posto: normalizado, situacao: '' };
}

function comporDiaEscala(posto = '', situacao = '') {
  const postoNormalizado = normalizarCodigoPosto(String(posto || '').trim());
  const situacaoNormalizada = normalizarCodigoSituacao(situacao);
  const postoValido = postoNormalizado && !SITUACOES.has(postoNormalizado) ? postoNormalizado : '';
  const situacaoValida = SITUACOES.has(situacaoNormalizada) ? situacaoNormalizada : '';
  if (postoValido && situacaoValida) return `${postoValido}${SEPARADOR_SITUACAO_DIA}${situacaoValida}`;
  return situacaoValida || postoValido || '';
}

function normalizarValorDiaEscala(valor) {
  const partes = decomporDiaEscala(valor);
  return comporDiaEscala(partes.posto, partes.situacao);
}

function postoDoDia(valor) { return decomporDiaEscala(valor).posto; }
function situacaoDoDia(valor) { return decomporDiaEscala(valor).situacao; }
function diaTemSituacao(valor) { return Boolean(situacaoDoDia(valor)); }

function resumoDiaEscala(valor, colaboradorId = '', dataISO = '') {
  const partes = decomporDiaEscala(valor);
  const registroSituacao = colaboradorId && dataISO ? situacaoNaData(colaboradorId, dataISO) : null;
  const situacao = registroSituacao?.tipo || partes.situacao || '';
  const cobertura = colaboradorId && dataISO ? coberturaNaDataPorOrigem(colaboradorId, dataISO) : null;
  const avaliacaoCobertura = cobertura && dataISO ? avaliarCoberturaNoDia(cobertura, dataISO) : null;
  const coberturaComoCobridor = colaboradorId && dataISO ? coberturaNaDataPorCobridor(colaboradorId, dataISO) : null;

  const postoOriginal = partes.posto;
  const postoOperacional = coberturaComoCobridor?.postoAlvo || postoOriginal;
  const descricaoOperacional = postoOperacional ? postoDescricao(postoOperacional) : 'Sem posto definido';
  const cobrindoTexto = coberturaComoCobridor
    ? `Cobrindo posto ${coberturaComoCobridor.postoAlvo}${coberturaComoCobridor.descricaoPostoAlvo ? ` • ${coberturaComoCobridor.descricaoPostoAlvo}` : ''}`
    : '';
  const origemCoberturaTexto = coberturaComoCobridor && postoOriginal
    ? `Origem: ${postoOriginal} • ${postoDescricao(postoOriginal)}`
    : '';

  return {
    posto: postoOperacional,
    postoOriginal,
    situacao,
    situacaoRegistro: registroSituacao,
    descricaoPosto: descricaoOperacional,
    descricaoSituacao: situacao ? descricaoSituacao(situacao) : '',
    cobertura,
    coberturaNome: avaliacaoCobertura?.cobridor?.nome || '',
    coberturaModo: cobertura?.modo || '',
    coberturaConflitos: avaliacaoCobertura?.conflitos || [],
    cobrindo: Boolean(coberturaComoCobridor),
    cobrindoTexto,
    origemCoberturaTexto,
    coberturaComoCobridor
  };
}

function nomeCanonicoReferencia(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ');
}

function encontrarColaboradorReferencia(pessoa) {
  const fontes = [
    ...(typeof ESCALA_PRIMEIRO_TURNO !== 'undefined' ? ESCALA_PRIMEIRO_TURNO : []),
    ...(typeof ESCALA_SEGUNDO_TURNO_2023 !== 'undefined' ? ESCALA_SEGUNDO_TURNO_2023 : [])
  ];
  const nome = nomeCanonicoReferencia(pessoa?.nome);
  return fontes.find((item) =>
    nomeCanonicoReferencia(item?.nome) === nome && mesmoTurno(item?.turno, pessoa?.turno)
  ) || null;
}

function postoReferenciaPadrao(pessoa, indiceDia) {
  const referencia = encontrarColaboradorReferencia(pessoa);
  const valor = referencia?.dias?.[indiceDia] || '';
  return postoDoDia(valor);
}

function recuperarPostosDeSituacoesLegadas() {
  let recuperados = 0;
  ESCALA.forEach((pessoa) => {
    const nomeReferencia = nomeCanonicoReferencia(pessoa.nome);
    pessoa.dias = Array.from({ length: 31 }, (_, indice) => {
      const valor = pessoa.dias?.[indice] || '';
      const partes = decomporDiaEscala(valor);
      if (partes.posto) return valor;
      const deveRecuperar = Boolean(partes.situacao);
      if (!deveRecuperar) return valor;
      const postoReferencia = postoReferenciaPadrao(pessoa, indice);
      if (!postoReferencia) return valor;
      recuperados += 1;
      return comporDiaEscala(postoReferencia, partes.situacao);
    });
  });
  return recuperados;
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


const PREFIXO_REFERENCIA_VAGA = 'VAGA_DE|';

function ehVagaAberta(pessoa) {
  const id = String(pessoa?.id || '').trim().toLowerCase();
  const nome = nomeCanonicoReferencia(pessoa?.nome || '');
  return id.startsWith('vaga-') || nome === 'A DEFINIR';
}

function registroReferenciaVaga(nome) {
  const referencia = String(nome || '').trim().toUpperCase();
  return referencia ? `${PREFIXO_REFERENCIA_VAGA}${referencia}` : '';
}

function referenciaVagaAberta(pessoa) {
  if (!ehVagaAberta(pessoa)) return '';
  const referenciaDireta = String(pessoa?.referenciaVaga || '').trim().toUpperCase();
  if (referenciaDireta) return referenciaDireta;
  const registro = String(pessoa?.registro || '').trim();
  if (registro.toUpperCase().startsWith(PREFIXO_REFERENCIA_VAGA)) {
    return registro.slice(PREFIXO_REFERENCIA_VAGA.length).trim().toUpperCase();
  }
  return '';
}

function rotuloVagaAberta(pessoa) {
  const referencia = referenciaVagaAberta(pessoa);
  return referencia ? `A DEFINIR — vaga de ${referencia}` : 'A DEFINIR';
}

function nomeExibicaoPessoa(pessoa) {
  return ehVagaAberta(pessoa) ? 'A DEFINIR' : String(pessoa?.nome || '').trim();
}

function pessoasEscalaAtivas() {
  return ESCALA.filter((pessoa) => pessoa.ativo !== false);
}

function atualizarContadorVagasAbertasAdmin() {
  const elemento = $('contadorVagasAbertasAdmin');
  if (!elemento) return;
  const quantidade = vagasAbertas().length;
  elemento.textContent = `Vagas abertas: ${quantidade}`;
  elemento.classList.toggle('tem-vagas', quantidade > 0);
}

function vagasAbertas(turno = 'todos') {
  return pessoasEscalaAtivas()
    .filter((pessoa) => ehVagaAberta(pessoa) && (turno === 'todos' || mesmoTurno(pessoa.turno, turno)))
    .slice()
    .sort((a, b) => `${a.turno}${a.id}`.localeCompare(`${b.turno}${b.id}`, 'pt-BR'));
}

function resumoVagaAberta(pessoa) {
  const referencia = referenciaVagaAberta(pessoa);
  const postos = [...new Set((pessoa?.dias || []).map((valor) => postoDoDia(valor)).filter(Boolean))];
  const prefixo = referencia ? `Vaga de ${referencia}. ` : '';
  if (!postos.length) return `${prefixo}Sem postos definidos`;
  const primeiros = postos.slice(0, 3).map((posto) => `${posto} • ${postoDescricao(posto)}`);
  return `${prefixo}Referências: ${primeiros.join(' | ')}${postos.length > 3 ? ` +${postos.length - 3}` : ''}`;
}

function criarIdVagaLocal(turno) {
  const bruto = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const sufixo = String(bruto).replace(/[^a-zA-Z0-9]/g, '').slice(0, 10);
  return `vaga-${textoSlug(turno || 'turno')}-${sufixo}`;
}

function chavePessoaLocal(pessoa) {
  if (ehVagaAberta(pessoa)) return `VAGA|${String(pessoa?.id || '').trim()}`;
  const turno = turnoCanonico(pessoa?.turno || '');
  const registro = String(pessoa?.registro || '').trim();
  if (registro) return `${turno}|REG|${registro}`;
  const nome = String(pessoa?.nome || '').trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ');
  return `${turno}|NOME|${nome}`;
}

function mesclarPessoaDuplicada(base, candidata) {
  const diasBase = Array.isArray(base?.dias) ? base.dias : [];
  const diasCand = Array.isArray(candidata?.dias) ? candidata.dias : [];
  const preenchidosBase = diasBase.filter((valor) => postoDoDia(valor)).length;
  const preenchidosCand = diasCand.filter((valor) => postoDoDia(valor)).length;
  const fonteDias = preenchidosCand > preenchidosBase ? candidata : base;
  const preferida = String(base?.registro || '').trim() ? base : (String(candidata?.registro || '').trim() ? candidata : base);
  return {
    ...preferida,
    id: preferida.id || candidata.id || base.id,
    nome: preferida.nome || candidata.nome || base.nome,
    registro: preferida.registro || candidata.registro || base.registro || '',
    turno: turnoCanonico(preferida.turno || candidata.turno || base.turno || CONFIG.turno || '1º Turno'),
    ativo: preferida.ativo !== false && candidata.ativo !== false,
    dias: Array.from({ length: 31 }, (_, indice) => fonteDias.dias?.[indice] || preferida.dias?.[indice] || candidata.dias?.[indice] || '')
  };
}

function deduplicarEscalaLocal(lista) {
  const porChave = new Map();
  (Array.isArray(lista) ? lista : []).forEach((pessoa) => {
    const chave = chavePessoaLocal(pessoa);
    if (!chave || chave.endsWith('|NOME|')) return;
    if (!porChave.has(chave)) porChave.set(chave, pessoa);
    else porChave.set(chave, mesclarPessoaDuplicada(porChave.get(chave), pessoa));
  });

  const saida = [...porChave.values()];
  const porNomeTurno = new Map();
  const final = [];
  saida.forEach((pessoa) => {
    if (ehVagaAberta(pessoa)) { final.push(pessoa); return; }
    const nome = String(pessoa.nome || '').trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ');
    const chave = `${turnoCanonico(pessoa.turno)}|${nome}`;
    if (!porNomeTurno.has(chave)) porNomeTurno.set(chave, []);
    porNomeTurno.get(chave).push(pessoa);
  });

  porNomeTurno.forEach((grupo) => {
    const comRegistro = grupo.filter((pessoa) => String(pessoa.registro || '').trim());
    const semRegistro = grupo.filter((pessoa) => !String(pessoa.registro || '').trim());
    if (comRegistro.length === 1 && semRegistro.length) {
      let consolidada = comRegistro[0];
      semRegistro.forEach((pessoa) => { consolidada = mesclarPessoaDuplicada(consolidada, pessoa); });
      final.push(consolidada);
      return;
    }
    final.push(...grupo);
  });
  return final;
}

function atualizarInconsistenciasDados(resposta, { mostrarModal = false } = {}) {
  INCONSISTENCIAS_DADOS = Array.isArray(resposta?.inconsistencias) ? resposta.inconsistencias : [];
  const alerta = $('alertaInconsistenciasAdmin');
  if (alerta) {
    alerta.hidden = !INCONSISTENCIAS_DADOS.length;
    alerta.innerHTML = INCONSISTENCIAS_DADOS.length
      ? `<strong>⚠ ${INCONSISTENCIAS_DADOS.length} inconsistência(s) encontrada(s)</strong><span>O aplicativo corrigiu a leitura automaticamente. Revise os cadastros na planilha quando possível.</span>`
      : '';
  }
  if (mostrarModal && INCONSISTENCIAS_DADOS.length) {
    const exemplos = INCONSISTENCIAS_DADOS.slice(0, 5).map((item) => `• ${item.mensagem}`).join('\n');
    const restante = Math.max(0, INCONSISTENCIAS_DADOS.length - 5);
    mostrarAvisoApp({
      titulo: 'Cadastros inconsistentes',
      mensagem: `O aplicativo encontrou ${INCONSISTENCIAS_DADOS.length} inconsistência(s) entre Colaboradores e Escala e corrigiu a exibição automaticamente.\n\n${exemplos}${restante ? `\n• +${restante} outro(s) caso(s).` : ''}\n\nA identificação principal agora usa Registro + Turno; o ID e Nome + Turno são usados como recuperação.`,
      botaoTexto: 'Entendi',
      tipo: 'aviso'
    });
  }
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

  ESCALA = deduplicarEscalaLocal((Array.isArray(ESCALA) ? ESCALA : []).map((pessoa) => ({
    id: pessoa.id || '',
    nome: String(pessoa.nome || '').trim().toUpperCase(),
    registro: String(pessoa.registro || '').trim(),
    turno: turnoCanonico(pessoa.turno || CONFIG.turno || '1º Turno'),
    ativo: pessoa.ativo !== false,
    dias: Array.from({ length: 31 }, (_, indice) => normalizarValorDiaEscala(Array.isArray(pessoa.dias) ? (pessoa.dias[indice] || '') : ''))
  })).filter((pessoa) => pessoa.nome));

  const postosRecuperados = recuperarPostosDeSituacoesLegadas();
  // A partir da 2.5.1, a escala fixa guarda somente o posto. Situações têm datas reais e ficam separadas.
  ESCALA.forEach((pessoa) => {
    pessoa.dias = Array.from({ length: 31 }, (_, indice) => postoDoDia(pessoa.dias?.[indice] || ''));
  });
  normalizarRegistrosTemporais();
  garantirIdsColaboradores();
  ESCALA.sort((a, b) => `${a.turno}${a.nome}`.localeCompare(`${b.turno}${b.nome}`, 'pt-BR'));
  return postosRecuperados;
}

function dadosPadrao() {
  return {
    legenda: clonar(LEGENDA_PADRAO),
    escala: [
      ...clonar(ESCALA_PRIMEIRO_TURNO),
      ...clonar(ESCALA_SEGUNDO_TURNO_2023)
    ].map((pessoa) => ({ ...pessoa, registro: '', ativo: true })),
    situacoes: [],
    coberturas: []
  };
}

function aplicarDados(payload, origem = 'local') {
  if (payload?.postos || payload?.legenda) {
    LEGENDA = clonar(payload.postos || payload.legenda);
  }
  if (Array.isArray(payload?.escala)) ESCALA = clonar(payload.escala);
  if (Array.isArray(payload?.situacoes)) SITUACOES_REGISTROS = clonar(payload.situacoes);
  if (Array.isArray(payload?.coberturas)) COBERTURAS_REGISTROS = clonar(payload.coberturas);
  const postosRecuperados = normalizarDadosAtuais();
  origemDadosAtual = origem;
  return postosRecuperados;
}

function colaboradorPorId(id) {
  return ESCALA.find((pessoa) => pessoa.id === id && pessoa.ativo !== false);
}

function pessoasAtivas() {
  return pessoasEscalaAtivas().filter((pessoa) => !ehVagaAberta(pessoa));
}

function pessoasPorTurno(turno = 'todos') {
  // Consulta pública mostra posições efetivamente definidas e vagas A DEFINIR.
  // Colaborador ativo sem escala continua disponível no Admin, mas não polui a escala diária.
  const pessoas = pessoasEscalaAtivas().filter((pessoa) => ehVagaAberta(pessoa) || colaboradorPossuiEscalaFixa(pessoa));
  return turno === 'todos' ? pessoas : pessoas.filter((pessoa) => mesmoTurno(pessoa.turno, turno));
}

function postosDisponiveis(pessoas = pessoasAtivas()) {
  const codigos = new Set(Object.entries(LEGENDA)
    .filter(([, info]) => info?.ativo !== false)
    .map(([codigo]) => codigo));
  pessoas.forEach((pessoa) => pessoa.dias.forEach((valorDia) => { const posto = postoDoDia(valorDia); if (posto) codigos.add(posto); }));
  return [...codigos].sort((a, b) => a.localeCompare(b, 'pt-BR', { numeric: true }));
}

function postoDescricao(posto) {
  if (!posto) return 'Sem posto definido';
  const partesDia = decomporDiaEscala(posto);
  if (partesDia.situacao && !partesDia.posto) return descricaoSituacao(partesDia.situacao);
  posto = partesDia.posto || normalizarCodigoPosto(posto);
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
    situacoes: SITUACOES_REGISTROS,
    coberturas: COBERTURAS_REGISTROS,
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

function chaveEscalaSabadoStatus(dataISO, turno, status) {
  return `${chaveEscalaSabado(dataISO, turno)}|${String(status || '').toUpperCase()}`;
}

function obterCacheEscalaSabado(dataISO, turno = 'todos', { incluirRascunho = true } = {}) {
  const cache = lerCacheSabados();
  if (turno !== 'todos') {
    const chaveBase = chaveEscalaSabado(dataISO, turno);
    const rascunho = cache[chaveEscalaSabadoStatus(dataISO, turno, 'RASCUNHO')];
    const publicada = cache[chaveEscalaSabadoStatus(dataISO, turno, 'PUBLICADA')];
    const base = cache[chaveBase];
    const escolhida = incluirRascunho
      ? (rascunho || (base?.status === 'RASCUNHO' ? base : null) || publicada || base)
      : (publicada || (base?.status === 'PUBLICADA' ? base : null));
    return escolhida ? normalizarEscalaSabado(escolhida, dataISO, turno) : null;
  }

  // Na consulta de todos os turnos, usa somente uma cópia por turno/status.
  const porTurno = new Map();
  Object.values(cache).forEach(item => {
    if (item?.dataISO !== dataISO) return;
    const normalizada = normalizarEscalaSabado(item, dataISO, item?.turno || 'todos');
    if (!normalizada.turno || normalizada.turno === 'todos') return;
    const chaveTurno = turnoCanonico(normalizada.turno);
    const atual = porTurno.get(chaveTurno);
    if (!atual || (incluirRascunho && normalizada.status === 'RASCUNHO') || (!incluirRascunho && normalizada.status === 'PUBLICADA')) {
      if (incluirRascunho || normalizada.status === 'PUBLICADA') porTurno.set(chaveTurno, normalizada);
    }
  });
  const escalas = [...porTurno.values()].filter(item => incluirRascunho || item.status === 'PUBLICADA');
  if (!escalas.length) return null;
  const itens = escalas.flatMap(item => item.itens || []);
  const status = itens.some(item => String(item.status || '').toUpperCase() === 'RASCUNHO') ? 'RASCUNHO' : 'PUBLICADA';
  return normalizarEscalaSabado({ dataISO, turno: 'todos', status, encontrada: itens.length > 0, itens }, dataISO, 'todos');
}

function salvarCacheEscalaSabado(escala) {
  if (!escala?.dataISO) return;
  const cache = lerCacheSabados();
  const turno = escala.turno || 'todos';
  const normalizada = normalizarEscalaSabado(escala, escala.dataISO, turno);
  const pacote = { ...normalizada, salvoLocalEm: new Date().toISOString() };
  const chaveBase = chaveEscalaSabado(normalizada.dataISO, turno);
  cache[chaveBase] = pacote;
  cache[chaveEscalaSabadoStatus(normalizada.dataISO, turno, normalizada.status)] = pacote;
  if (normalizada.status === 'PUBLICADA') {
    // A nova publicação encerra o rascunho local daquela data/turno.
    delete cache[chaveEscalaSabadoStatus(normalizada.dataISO, turno, 'RASCUNHO')];
  }
  delete cache[chaveEscalaSabado(normalizada.dataISO, 'todos')];
  const chaves = Object.keys(cache).sort((a, b) => String(cache[b]?.salvoLocalEm || '').localeCompare(String(cache[a]?.salvoLocalEm || '')));
  const reduzido = {};
  chaves.slice(0, 120).forEach((chave) => { reduzido[chave] = cache[chave]; });
  localStorage.setItem(STORAGE.sabadosHE, JSON.stringify(reduzido));
}

function removerCacheEscalaSabado(dataISO, turno, status = '') {
  const cache = lerCacheSabados();
  const chaveBase = chaveEscalaSabado(dataISO, turno);
  const filtro = String(status || '').trim().toUpperCase();
  if (filtro) {
    delete cache[chaveEscalaSabadoStatus(dataISO, turno, filtro)];
    if (cache[chaveBase]?.status === filtro) delete cache[chaveBase];
    const outra = filtro === 'RASCUNHO'
      ? cache[chaveEscalaSabadoStatus(dataISO, turno, 'PUBLICADA')]
      : cache[chaveEscalaSabadoStatus(dataISO, turno, 'RASCUNHO')];
    if (outra) cache[chaveBase] = outra;
  } else {
    delete cache[chaveBase];
    delete cache[chaveEscalaSabadoStatus(dataISO, turno, 'RASCUNHO')];
    delete cache[chaveEscalaSabadoStatus(dataISO, turno, 'PUBLICADA')];
  }
  localStorage.setItem(STORAGE.sabadosHE, JSON.stringify(cache));
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


function filtrarEscalaSabadoPorTurno(escala, dataISO, turno = 'todos') {
  const normalizada = normalizarEscalaSabado(escala, dataISO, escala?.turno || 'todos');
  const itens = turno === 'todos'
    ? normalizada.itens
    : normalizada.itens.filter((item) => mesmoTurno(item.turno, turno));
  return {
    ...normalizada,
    dataISO: normalizada.dataISO || dataISO,
    turno: turno || 'todos',
    status: itens.some((item) => String(item.status || '').toUpperCase() === 'PUBLICADA') ? 'PUBLICADA' : (itens[0]?.status || 'VAZIA'),
    encontrada: itens.length > 0,
    itens
  };
}

async function consultarEscalaSabadoServidor(dataISO, turno = 'todos', incluirRascunho = false) {
  const parametros = {
    equipe: APP.equipe || CONFIG.equipe,
    data: dataISO,
    incluirRascunho: incluirRascunho ? '1' : ''
  };

  // A consulta pública não depende do turno no servidor. Todos os registros da data
  // são trazidos e o filtro do turno é feito no próprio aplicativo.
  // Isso elimina diferenças de "1º", "1°" e espaços entre aparelhos/planilha.
  let resposta;
  try {
    resposta = await apiGet('escalaSabadoPublica', parametros);
  } catch (_) {
    // Compatibilidade com implantações antigas do Apps Script.
    resposta = await apiGet('escalaSabado', parametros);
  }
  return filtrarEscalaSabadoPorTurno(resposta, dataISO, turno);
}

async function carregarEscalaSabado(dataISO, turno = 'todos', { forcar = false, incluirRascunho = false, silencioso = true, tentativas = 1 } = {}) {
  if (!dataEhSabado(dataISO)) return normalizarEscalaSabado({}, dataISO, turno);
  const cache = obterCacheEscalaSabado(dataISO, turno, { incluirRascunho });
  if (cache && !forcar) {
    if (incluirRascunho || cache.status === 'PUBLICADA') return cache;
  }

  let ultimoErro = null;
  const totalTentativas = Math.max(1, Number(tentativas || 1));
  for (let tentativa = 1; tentativa <= totalTentativas; tentativa += 1) {
    try {
      if (!navigator.onLine) throw new Error('Sem conexão.');
      const escala = await consultarEscalaSabadoServidor(dataISO, turno, incluirRascunho);
      if (escala.encontrada && escala.itens?.length) {
        salvarCacheEscalaSabado(escala);
        return escala;
      }
      ultimoErro = null;
      if (tentativa < totalTentativas) await esperar(650 * tentativa);
    } catch (erro) {
      ultimoErro = erro;
      if (tentativa < totalTentativas) await esperar(650 * tentativa);
    }
  }

  // Uma resposta vazia nunca apaga uma escala publicada já armazenada neste aparelho.
  if (cache && (incluirRascunho || cache.status === 'PUBLICADA') && cache.itens?.length) return cache;
  if (!silencioso && ultimoErro) toast(`Não foi possível consultar a escala de sábado. ${ultimoErro.message}`, 'aviso');
  return normalizarEscalaSabado({}, dataISO, turno);
}

function esperar(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function assinaturaItensSabado(itens = []) {
  return (Array.isArray(itens) ? itens : [])
    .map((item) => `${String(item.colaboradorId || '')}|${normalizarCodigoPosto(String(item.posto || ''))}`)
    .filter(Boolean)
    .sort();
}

function escalaSabadoConfereComStatus(escalaServidor, escalaLocal, statusEsperado) {
  const status = String(statusEsperado || '').toUpperCase();
  if (!escalaServidor?.encontrada || escalaServidor.status !== status) return false;
  if (!mesmoTurno(escalaServidor.turno, escalaLocal.turno)) return false;
  const esperado = assinaturaItensSabado(escalaLocal.itens);
  const recebido = assinaturaItensSabado(escalaServidor.itens);
  return esperado.length > 0 && esperado.length === recebido.length && esperado.every((valor, i) => valor === recebido[i]);
}

async function verificarEscalaSabadoNoServidor(escalaLocal, statusEsperado, { tentativas = 6 } = {}) {
  let ultimaResposta = null;
  const status = String(statusEsperado || '').toUpperCase();
  for (let tentativa = 1; tentativa <= tentativas; tentativa += 1) {
    try {
      ultimaResposta = await consultarEscalaSabadoServidor(escalaLocal.dataISO, escalaLocal.turno, status === 'RASCUNHO');
      if (escalaSabadoConfereComStatus(ultimaResposta, escalaLocal, status)) {
        salvarCacheEscalaSabado(ultimaResposta);
        return { ok: true, escala: ultimaResposta };
      }
    } catch (erro) {
      ultimaResposta = { erro };
    }
    if (tentativa < tentativas) await esperar(700 * tentativa);
  }
  return { ok: false, escala: ultimaResposta };
}

async function verificarPublicacaoSabadoNoServidor(escalaLocal, opcoes = {}) {
  return verificarEscalaSabadoNoServidor(escalaLocal, 'PUBLICADA', opcoes);
}

function garantirPayloadNaFila(payload) {
  let fila = lerFila();
  const acao = String(payload?.acao || '');
  if (acao === 'salvarEscalaSabado') {
    const status = String(payload?.status || 'RASCUNHO').toUpperCase();
    const mesmaEscala = (item) => item?.payload?.acao === acao
      && item?.payload?.dataISO === payload.dataISO
      && mesmoTurno(item?.payload?.turno, payload.turno);
    if (status === 'PUBLICADA') {
      // A publicação substitui qualquer envio antigo da mesma data/turno.
      fila = fila.filter((item) => !mesmaEscala(item));
    } else {
      const jaExiste = fila.some((item) => mesmaEscala(item) && String(item?.payload?.status || 'RASCUNHO').toUpperCase() === status);
      if (jaExiste) return;
    }
    fila.push({ id: criarId('fila'), criadoEm: new Date().toISOString(), payload });
    salvarFila(fila);
    return;
  }
  const jaExiste = fila.some((item) => item?.payload?.acao === acao
    && String(item?.payload?.id || item?.id || '') === String(payload?.id || ''));
  if (!jaExiste) enfileirarPayload(payload);
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
      if (item?.payload?.acao === 'salvarEscalaSabado') {
        const statusFila = String(item.payload.status || 'RASCUNHO').toUpperCase();
        const escalaFila = normalizarEscalaSabado(item.payload, item.payload.dataISO, item.payload.turno);
        const verificacao = await verificarEscalaSabadoNoServidor(escalaFila, statusFila, { tentativas: 3 });
        if (!verificacao.ok) {
          restantes.push(item);
          continue;
        }
      }
      if (['salvarColaborador','excluirColaborador','retirarColaborador','assumirPosicao','preencherVaga','realocarColaborador','trocarPosicoes','salvarPosto','excluirPosto','salvarEscala','salvarSituacao','removerSituacao','salvarCobertura','removerCobertura'].includes(String(item?.payload?.acao || ''))) {
        const confirmado = await confirmarAlteracaoAdminNoServidor(item.payload, 3);
        if (!confirmado) {
          restantes.push(item);
          continue;
        }
      }
      enviados += 1;
    } catch {
      restantes.push(item);
    }
  }
  salvarFila(restantes);
  if (enviados) toast(`${enviados} registro(s) pendente(s) sincronizado(s) com a planilha.`, 'ok');
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
    atualizarInconsistenciasDados(resposta, { mostrarModal: false });
    aplicarDados({ postos: resposta.postos, escala: resposta.escala, situacoes: resposta.situacoes || [], coberturas: resposta.coberturas || [] }, 'Google Sheets');
    salvarCacheMes(CHAVE_ESCALA_FIXA, { mesAno: CHAVE_ESCALA_FIXA, legenda: LEGENDA, escala: ESCALA, situacoes: SITUACOES_REGISTROS, coberturas: COBERTURAS_REGISTROS, atualizadoEm: resposta.atualizadoEm || new Date().toISOString(), origem: 'Google Sheets' });
    ultimaSincronizacaoServidor = resposta.atualizadoEm || new Date().toISOString();
    atualizarStatusAdmin();
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

function card({ titulo, badge, descricao, hoje = false, subtitulo = '', situacao = false, vaga = false }) {
  return `
    <article class="item ${hoje ? 'hoje' : ''} ${situacao ? 'situacao' : ''} ${vaga ? 'vaga-aberta' : ''}">
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
  if (id === 'admin' && $('areaAdmin') && !$('areaAdmin').hidden) fecharTodosModulosAdmin();
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
      ${pessoa.dias.slice(0, limite).map((valorDia, indice) => {
        const diaEscala = resumoDiaEscala(valorDia, pessoa.id, dataISOParaDiaMesAtual(indice + 1));
        const subtitulo = [diaEscala.descricaoSituacao, diaEscala.cobrindoTexto, diaEscala.coberturaNome ? `Cobertura: ${diaEscala.coberturaNome}` : ''].filter(Boolean).join(' • ');
        const descricao = diaEscala.cobrindo
          ? diaEscala.origemCoberturaTexto
          : (diaEscala.situacao && diaEscala.posto ? `Posto de referência: ${diaEscala.posto} — ${diaEscala.descricaoPosto}` : diaEscala.descricaoPosto);
        return card({
          titulo: `Dia ${String(indice + 1).padStart(2, '0')}`,
          badge: diaEscala.posto || '—',
          descricao,
          subtitulo,
          hoje: indice + 1 === destaque,
          situacao: Boolean(diaEscala.situacao)
        });
      }).join('')}
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
        const dataReferencia = dataISOParaDiaMesAtual(dia);
        const diaEscala = resumoDiaEscala(pessoa.dias[dia - 1] || '', pessoa.id, dataReferencia);
        const referenciaVaga = referenciaVagaAberta(pessoa);
        const subtitulo = [pessoa.turno, ehVagaAberta(pessoa) ? (referenciaVaga ? `Vaga aberta • antigo ocupante: ${referenciaVaga}` : 'Vaga aberta') : '', diaEscala.descricaoSituacao, diaEscala.cobrindoTexto, diaEscala.coberturaNome ? `Cobertura: ${diaEscala.coberturaNome}` : ''].filter(Boolean).join(' • ');
        const descricao = diaEscala.cobrindo
          ? diaEscala.origemCoberturaTexto
          : (diaEscala.situacao && diaEscala.posto ? `Posto de referência: ${diaEscala.posto} — ${diaEscala.descricaoPosto}` : diaEscala.descricaoPosto);
        return card({ titulo: nomeExibicaoPessoa(pessoa), badge: diaEscala.posto || '—', descricao, subtitulo, hoje: dia === destaque, situacao: Boolean(diaEscala.situacao), vaga: ehVagaAberta(pessoa) });
      }).join('') : '<div class="resultado-vazio">Nenhum colaborador neste turno.</div>'}
    </div>`;
}

function buscarPorPosto(postoBusca) {
  abrirResultado();
  const turno = $('selectTurnoConsulta')?.value || 'todos';
  const destaque = diaParaDestaque();
  const itens = [];
  pessoasPorTurno(turno).forEach((pessoa) => {
    pessoa.dias.slice(0, diasNoMes()).forEach((valorDia, indice) => {
      const diaEscala = resumoDiaEscala(valorDia, pessoa.id, dataISOParaDiaMesAtual(indice + 1));
      if (diaEscala.posto === postoBusca) {
        const referenciaVaga = referenciaVagaAberta(pessoa);
        itens.push(card({
          titulo: nomeExibicaoPessoa(pessoa),
          badge: `Dia ${String(indice + 1).padStart(2, '0')}`,
          descricao: `${postoBusca} • ${postoDescricao(postoBusca)}`,
          subtitulo: [pessoa.turno, ehVagaAberta(pessoa) ? (referenciaVaga ? `Vaga aberta • antigo ocupante: ${referenciaVaga}` : 'Vaga aberta') : '', diaEscala.descricaoSituacao, diaEscala.cobrindoTexto, diaEscala.coberturaNome ? `Cobertura: ${diaEscala.coberturaNome}` : ''].filter(Boolean).join(' • '),
          hoje: indice + 1 === destaque,
          situacao: Boolean(diaEscala.situacao),
          vaga: ehVagaAberta(pessoa)
        }));
      }
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
  const cache = obterCacheEscalaSabado(dataISO, turnoSelecionado, { incluirRascunho: false });

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
  const aPartirDe = dataISOHoje();
  $('resultadoConteudo').innerHTML = '<div class="resultado-vazio">Buscando a próxima escala de sábado publicada...</div>';
  try {
    const resposta = await apiGet('proximaEscalaSabado', { equipe: APP.equipe || CONFIG.equipe, data: aPartirDe, turno: turnoSelecionado === 'todos' ? '' : turnoSelecionado });
    const dataAlvo = resposta?.dataISO || proximoSabadoISO(true);
    const escala = filtrarEscalaSabadoPorTurno(resposta, dataAlvo, turnoSelecionado);
    if (escala?.status === 'PUBLICADA' && escala.itens?.length) {
      salvarCacheEscalaSabado(escala);
      renderizarEscalaSabadoPublica(dataAlvo, turnoSelecionado, escala);
      return;
    }
    renderizarEscalaSabadoPublica(dataAlvo, turnoSelecionado, escala || normalizarEscalaSabado({}, dataAlvo, turnoSelecionado));
  } catch (erro) {
    const dataAlvo = proximoSabadoISO(true);
    const escala = await carregarEscalaSabado(dataAlvo, turnoSelecionado, { forcar: true, incluirRascunho: false, silencioso: true, tentativas: 2 });
    renderizarEscalaSabadoPublica(dataAlvo, turnoSelecionado, escala || normalizarEscalaSabado({}, dataAlvo, turnoSelecionado));
    toast(`Não foi possível procurar uma publicação posterior. ${erro.message}`, 'aviso');
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
  const valorDiaCarga = pessoa.dias[Math.max(0, Math.min(30, diaDaDataCarga() - 1))] || '';
  const resumoCarga = resumoDiaEscala(valorDiaCarga, pessoa.id, dataCarga);
  let posto = resumoCarga.posto;
  let origemPosto = resumoCarga.descricaoSituacao ? ` • ${resumoCarga.descricaoSituacao}` : '';
  if (resumoCarga.coberturaNome) origemPosto += ` • Cobertura: ${resumoCarga.coberturaNome}`;
  if (resumoCarga.cobrindoTexto) origemPosto += ` • ${resumoCarga.cobrindoTexto}`;
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
  if (recente && !(await confirmarAcaoApp({ titulo: 'Possível lançamento duplicado', mensagem: 'Um lançamento idêntico foi registrado nos últimos 10 minutos. Deseja enviar novamente?', confirmarTexto: 'Enviar novamente', tipo: 'aviso' }))) return;

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
    fecharTodosModulosAdmin();
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
  fecharTodosModulosAdmin();
  toast('Sessão administrativa encerrada.', 'info');
}

function exigirAdmin() {
  if (!adminSenhaSessao) {
    msgAdmin('Entre novamente na administração.', 'erro');
    return false;
  }
  return true;
}

const MODULOS_ADMIN = {
  cadastros: 'moduloAdminCadastros',
  escala: 'moduloAdminEscala',
  situacoes: 'moduloAdminSituacoes',
  sabado: 'moduloAdminSabado'
};

function fecharTodosModulosAdmin(opcoes = {}) {
  const { mostrarMenu = true, rolarMenu = false } = opcoes || {};
  Object.entries(MODULOS_ADMIN).forEach(([chave, id]) => {
    const modulo = $(id);
    if (modulo) modulo.hidden = true;
    const botao = document.querySelector(`[data-modulo-admin="${chave}"]`);
    if (botao) {
      botao.classList.remove('ativo');
      botao.setAttribute('aria-expanded', 'false');
    }
  });

  const menu = $('menuAdminCard');
  if (menu) menu.hidden = !mostrarMenu;

  const status = $('statusMenuAdmin');
  if (status) status.textContent = 'Escolha uma opção do menu para abrir.';

  if (mostrarMenu && rolarMenu && menu) {
    requestAnimationFrame(() => menu.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }
}

function voltarMenuAdmin() {
  fecharTodosModulosAdmin({ mostrarMenu: true, rolarMenu: true });
}

function alternarModuloAdmin(chave) {
  if (!exigirAdmin()) return;
  const id = MODULOS_ADMIN[chave];
  const modulo = id ? $(id) : null;
  if (!modulo) return;

  // Fecha qualquer módulo anterior e esconde o menu principal para liberar a tela do celular.
  fecharTodosModulosAdmin({ mostrarMenu: false });

  modulo.hidden = false;
  const botao = document.querySelector(`[data-modulo-admin="${chave}"]`);
  if (botao) {
    botao.classList.add('ativo');
    botao.setAttribute('aria-expanded', 'true');
  }

  // Atualiza o conteúdo apenas quando ele é realmente necessário.
  if (chave === 'escala') {
    montarGradeDiasAdmin();
    carregarEscala();
  } else if (chave === 'situacoes') {
    prepararCoberturasAdmin();
    renderizarPainelSituacoesAdmin();
    renderizarPainelCoberturasAdmin();
  } else if (chave === 'sabado') {
    prepararEditorEscalaSabado();
    carregarListaEscalasSabadoAdmin();
  } else if (chave === 'cadastros') {
    atualizarContadorVagasAbertasAdmin();
  }

  setTimeout(() => modulo.scrollIntoView({ behavior: 'smooth', block: 'start' }), 40);

}


function preencherSelectsAdmin() {
  const pessoas = pessoasAtivas().slice().sort((a, b) => `${a.turno}${a.nome}`.localeCompare(`${b.turno}${b.nome}`, 'pt-BR'));
  const pessoasEscala = pessoasEscalaAtivas().slice().sort((a, b) => `${a.turno}${a.nome}${a.id}`.localeCompare(`${b.turno}${b.nome}${b.id}`, 'pt-BR'));
  const opcoes = pessoas.map((pessoa) => `<option value="${escaparHTML(pessoa.id)}">${escaparHTML(pessoa.nome)} • ${escaparHTML(pessoa.turno)}</option>`).join('');
  const opcoesEscala = pessoasEscala.map((pessoa) => `<option value="${escaparHTML(pessoa.id)}">${escaparHTML(ehVagaAberta(pessoa) ? rotuloVagaAberta(pessoa) : pessoa.nome)} • ${escaparHTML(pessoa.turno)}${ehVagaAberta(pessoa) ? ' • VAGA ABERTA' : ''}</option>`).join('');
  const turnos = turnosDisponiveis().map((turno) => `<option value="${escaparHTML(turno)}">${escaparHTML(turno)}</option>`).join('');

  if ($('turnoEscalaSabado')) {
    const turnoAtualHE = $('turnoEscalaSabado').value || $('selectTurnoConsulta')?.value || CONFIG.turno;
    $('turnoEscalaSabado').innerHTML = turnos;
    $('turnoEscalaSabado').value = turnosDisponiveis().find((turno) => mesmoTurno(turno, turnoAtualHE)) || CONFIG.turno;
  }
  if ($('adminColaborador')) $('adminColaborador').innerHTML = opcoesEscala || '<option value="">Nenhum colaborador</option>';
  if ($('coberturaOrigem')) $('coberturaOrigem').innerHTML = '<option value="">Selecione quem será coberto</option>' + opcoes;
  if ($('coberturaDestino')) $('coberturaDestino').innerHTML = '<option value="">Selecione o colaborador</option>' + opcoes;
  if ($('coberturaPostoFonte')) {
    $('coberturaPostoFonte').innerHTML = '<option value="">Selecione o posto</option>' + listaCodigosPostosAdmin().map(codigo => `<option value="${escaparHTML(codigo)}">${escaparHTML(codigo)} — ${escaparHTML(postoDescricao(codigo))}</option>`).join('');
  }

  montarGradeDiasAdmin();
  carregarEscala();
  prepararEditorEscalaSabado();
  prepararCoberturasAdmin();
  renderizarPainelSituacoesAdmin();
  renderizarPainelCoberturasAdmin();
  carregarListaEscalasSabadoAdmin();
  atualizarStatusAdmin();
}

function listaCodigosPostosAdmin() {
  return Object.entries(LEGENDA || {})
    .filter(([codigo, info]) => String(codigo || '').trim() && info?.ativo !== false)
    .map(([codigo]) => String(codigo).trim())
    .sort((a, b) => a.localeCompare(b, 'pt-BR', { numeric: true }));
}

function montarGradeDiasAdmin() {
  const campo = $('gradeDiasAdmin');
  if (!campo) return;
  const opcoesPostos = postosDisponiveis().map((posto) => `<option value="${escaparHTML(posto)}">${escaparHTML(posto)}</option>`).join('');
  campo.innerHTML = diasDisponiveis().map((dia) => `
    <div id="diaAdminBloco_${dia}" class="dia-admin">
      <label for="diaAdmin_${dia}">${String(dia).padStart(2, '0')}</label>
      <select id="diaAdmin_${dia}" onchange="aoAlterarPostoDia(${dia})">
        <option value="">Sem posto</option>
        ${opcoesPostos}
      </select>
      <small id="situacaoDia_${dia}" class="situacao-dia-label" hidden></small>
    </div>`).join('');
}

function atualizarDestaqueSituacaoDia(dia, valorDia = '', pessoa = null) {
  const bloco = $(`diaAdminBloco_${dia}`);
  const etiqueta = $(`situacaoDia_${dia}`);
  const dataISO = dataISOParaDiaMesAtual(dia);
  const registro = pessoa && dataISO ? situacaoNaData(pessoa.id, dataISO) : null;
  const ehSituacao = Boolean(registro);
  const posto = postoDoDia(valorDia);
  bloco?.classList.toggle('situacao-aplicada', ehSituacao);
  if (etiqueta) {
    etiqueta.hidden = !ehSituacao;
    etiqueta.textContent = ehSituacao ? `${descricaoSituacao(registro.tipo)} • Posto de referência: ${posto || 'não definido'} • até ${formatarDataBR(registro.fim)}` : '';
  }
}

function aoAlterarPostoDia(dia) {
  const pessoa = colaboradorPorId($('adminColaborador')?.value || '');
  const postoSelecionado = $(`diaAdmin_${dia}`)?.value || '';
  atualizarDestaqueSituacaoDia(dia, postoSelecionado, pessoa);
}

function carregarEscala() {
  const pessoa = colaboradorPorId($('adminColaborador')?.value || '');
  diasDisponiveis().forEach((dia) => {
    const campo = $(`diaAdmin_${dia}`);
    const valor = pessoa?.dias?.[dia - 1] || '';
    if (campo) campo.value = postoDoDia(valor);
    atualizarDestaqueSituacaoDia(dia, valor, pessoa);
  });
}


function dataInicialPadraoSituacao() {
  return '';
}

function turnosComColaboradoresAtivos() {
  const vistos = [];
  pessoasAtivas().forEach(pessoa => {
    const turno = turnoCanonico(pessoa.turno);
    if (turno && !vistos.some(item => mesmoTurno(item, turno))) vistos.push(turno);
  });
  return vistos.length ? vistos : turnosDisponiveis();
}

function abrirModalSituacaoEscala() {
  if (!exigirAdmin()) return;
  const turnos = turnosComColaboradoresAtivos();
  const turnoReferencia = turnoCanonico($('selectTurnoConsulta')?.value || CONFIG.turno || turnos[0]);
  turnoSituacaoFiltro = turnos.find(turno => mesmoTurno(turno, turnoReferencia)) || turnos[0] || CONFIG.turno;
  editorSituacaoEscala = { colaboradorId: '', codigo: '' };
  if ($('buscaColaboradorSituacao')) $('buscaColaboradorSituacao').value = '';
  if ($('situacaoDataInicio')) $('situacaoDataInicio').value = '';
  if ($('situacaoDataFim')) { $('situacaoDataFim').value = ''; $('situacaoDataFim').min = ''; }
  renderizarFiltroTurnoSituacao();
  renderizarColaboradoresSituacao();
  renderizarSituacoesEscala();
  renderizarSituacoesDoColaboradorModal();
  if ($('modalSituacaoEscala')) $('modalSituacaoEscala').hidden = false;
  document.body.classList.add('modal-aberto');
}

function fecharModalSituacaoEscala() {
  if ($('modalSituacaoEscala')) $('modalSituacaoEscala').hidden = true;
  sincronizarEstadoModalBody();
}

function renderizarFiltroTurnoSituacao() {
  const campo = $('filtroTurnoSituacao');
  if (!campo) return;
  const turnos = turnosComColaboradoresAtivos();
  campo.innerHTML = turnos.map(turno => `
    <button type="button" class="filtro-turno-opcao ${mesmoTurno(turno, turnoSituacaoFiltro) ? 'ativo' : ''}" onclick="aoTrocarTurnoSituacao('${escaparHTML(turno)}')">
      <span class="radio-modal" aria-hidden="true"></span><strong>${escaparHTML(turno)}</strong>
    </button>`).join('');
}

function aoTrocarTurnoSituacao(turno) {
  turnoSituacaoFiltro = turnoCanonico(turno);
  const pessoaAtual = colaboradorPorId(editorSituacaoEscala.colaboradorId);
  if (pessoaAtual && !mesmoTurno(pessoaAtual.turno, turnoSituacaoFiltro)) editorSituacaoEscala.colaboradorId = '';
  renderizarFiltroTurnoSituacao();
  renderizarColaboradoresSituacao();
  renderizarSituacoesEscala();
  renderizarSituacoesDoColaboradorModal();
}

function renderizarColaboradoresSituacao() {
  const campo = $('listaColaboradoresSituacao');
  if (!campo) return;
  const busca = String($('buscaColaboradorSituacao')?.value || '').trim().toLocaleUpperCase('pt-BR');
  const pessoas = pessoasAtivas()
    .filter((pessoa) => mesmoTurno(pessoa.turno, turnoSituacaoFiltro))
    .filter((pessoa) => !busca || `${pessoa.nome} ${pessoa.turno} ${pessoa.registro}`.toLocaleUpperCase('pt-BR').includes(busca))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  campo.innerHTML = pessoas.length ? pessoas.map((pessoa) => `
    <button type="button" class="modal-opcao opcao-situacao ${editorSituacaoEscala.colaboradorId === pessoa.id ? 'selecionado' : ''}" aria-pressed="${editorSituacaoEscala.colaboradorId === pessoa.id}" onclick="selecionarColaboradorSituacao('${escaparHTML(pessoa.id)}')">
      <span class="radio-modal" aria-hidden="true"></span>
      <span><strong>${escaparHTML(pessoa.nome)}</strong><small>${escaparHTML(pessoa.turno)}${pessoa.registro ? ` • Registro ${escaparHTML(pessoa.registro)}` : ''}</small></span>
    </button>`).join('') : '<div class="modal-vazio">Nenhum colaborador encontrado neste turno.</div>';
}

function selecionarColaboradorSituacao(id) {
  editorSituacaoEscala.colaboradorId = editorSituacaoEscala.colaboradorId === id ? '' : id;
  editorSituacaoEscala.codigo = '';
  renderizarColaboradoresSituacao();
  renderizarSituacoesEscala();
  renderizarSituacoesDoColaboradorModal();
}

function periodoSituacaoPronto() {
  const pessoa = colaboradorPorId(editorSituacaoEscala.colaboradorId);
  const inicioISO = $('situacaoDataInicio')?.value || '';
  const fimISO = $('situacaoDataFim')?.value || '';
  const inicio = dataPorISO(inicioISO);
  const fim = dataPorISO(fimISO);
  return Boolean(pessoa && inicio && fim && fim >= inicio);
}

function renderizarSituacoesEscala() {
  const campo = $('listaSituacoesEscala');
  if (!campo) return;
  const opcoes = typeof STATUS_ESCALA !== 'undefined' ? STATUS_ESCALA : [];
  const pronto = periodoSituacaoPronto();
  const ajuda = $('ajudaSituacaoSelecao');
  if (ajuda) ajuda.textContent = pronto
    ? 'Período definido. Toque em uma situação para abrir a confirmação.'
    : 'Escolha primeiro o colaborador e o período. Depois as situações serão liberadas para confirmação.';
  campo.innerHTML = opcoes.map((item) => `
    <button type="button" ${pronto ? '' : 'disabled'} class="situacao-opcao ${editorSituacaoEscala.codigo === item.codigo ? 'selecionado' : ''}" aria-pressed="${editorSituacaoEscala.codigo === item.codigo}" onclick="selecionarSituacaoEscala('${escaparHTML(item.codigo)}')">
      <span class="radio-modal" aria-hidden="true"></span>
      <strong>${escaparHTML(item.descricao)}</strong>
    </button>`).join('');
}

function renderizarSituacoesDoColaboradorModal() {
  const campo = $('situacoesAtuaisColaborador');
  if (!campo) return;
  const id = editorSituacaoEscala.colaboradorId;
  const hoje = dataISOHoje();
  const itens = SITUACOES_REGISTROS.filter(item => item.colaboradorId === id).sort((a, b) => b.inicio.localeCompare(a.inicio));
  campo.innerHTML = itens.length ? itens.map(item => {
    const estado = periodoContemData(item, hoje) ? 'Ativa agora' : item.inicio > hoje ? 'Programada' : 'Finalizada';
    return `<div class="registro-temporal ${periodoContemData(item, hoje) ? 'ativo' : ''}">
      <div><strong>${escaparHTML(descricaoSituacao(item.tipo))}</strong><small>${escaparHTML(formatarDataBR(item.inicio))} a ${escaparHTML(formatarDataBR(item.fim))} • ${estado}</small></div>
      ${item.fim >= hoje ? `<button type="button" class="btn-mini-remover" onclick="removerSituacaoPorId('${escaparHTML(item.id)}')">Remover</button>` : ''}
    </div>`;
  }).join('') : '<div class="modal-vazio">Nenhuma situação cadastrada para este colaborador.</div>';
}

async function selecionarSituacaoEscala(codigo) {
  if (aplicandoSituacaoEscala) return;
  if (editorSituacaoEscala.codigo === codigo) {
    editorSituacaoEscala.codigo = '';
    renderizarSituacoesEscala();
    return;
  }
  editorSituacaoEscala.codigo = codigo;
  renderizarSituacoesEscala();
  try {
    const { pessoa, codigo: codigoValidado, inicioISO, fimISO } = validarPeriodoSituacao();
    const nomeSituacao = descricaoSituacao(codigoValidado);
    const periodo = inicioISO === fimISO ? formatarDataBR(inicioISO) : `${formatarDataBR(inicioISO)} a ${formatarDataBR(fimISO)}`;
    const confirmado = await confirmarAcaoApp({
      titulo: `Confirmar ${nomeSituacao}`,
      mensagem: `Aplicar ${nomeSituacao} para ${pessoa.nome}?

Período: ${periodo}
O posto da escala fixa será preservado. O destaque amarelo aparecerá somente dentro desse período e sairá automaticamente após ${formatarDataBR(fimISO)}.`,
      confirmarTexto: `Confirmar ${nomeSituacao}`,
      tipo: 'aviso'
    });
    if (!confirmado) {
      editorSituacaoEscala.codigo = '';
      renderizarSituacoesEscala();
      return;
    }
    aplicandoSituacaoEscala = true;
    await aplicarSituacaoEscala({ fecharAoConcluir: false });
  } catch (erro) {
    editorSituacaoEscala.codigo = '';
    renderizarSituacoesEscala();
    toast(erro.message, 'erro', 5500);
  } finally {
    aplicandoSituacaoEscala = false;
  }
}

function ajustarDatasSituacao() {
  const inicio = $('situacaoDataInicio')?.value || '';
  const fim = $('situacaoDataFim');
  if (!fim) return;
  fim.min = inicio;
  if (inicio && fim.value && fim.value < inicio) fim.value = inicio;
  editorSituacaoEscala.codigo = '';
  renderizarSituacoesEscala();
}

function validarPeriodoSituacao({ exigirSituacao = true } = {}) {
  const pessoa = colaboradorPorId(editorSituacaoEscala.colaboradorId);
  const codigo = editorSituacaoEscala.codigo;
  const inicioISO = $('situacaoDataInicio')?.value || '';
  const fimISO = $('situacaoDataFim')?.value || '';
  const inicio = dataPorISO(inicioISO);
  const fim = dataPorISO(fimISO);
  if (!pessoa) throw new Error('Selecione um colaborador.');
  if (exigirSituacao && !SITUACOES.has(codigo)) throw new Error('Selecione uma situação.');
  if (!inicio || !fim) throw new Error('Informe a data inicial e a data final.');
  if (fim < inicio) throw new Error('A data final não pode ser anterior à data inicial.');
  return { pessoa, codigo, inicioISO, fimISO };
}

async function aplicarSituacaoEscala({ fecharAoConcluir = false } = {}) {
  if (!exigirAdmin()) return false;
  const { pessoa, codigo, inicioISO, fimISO } = validarPeriodoSituacao();
  const registro = {
    id: criarId('sit', `${pessoa.id}-${codigo}`),
    colaboradorId: pessoa.id,
    nome: pessoa.nome,
    turno: pessoa.turno,
    tipo: codigo,
    inicio: inicioISO,
    fim: fimISO,
    ativo: true
  };
  SITUACOES_REGISTROS.push(registro);
  normalizarRegistrosTemporais();
  salvarCacheMes();
  atualizarInterfaceCompleta({ preservarAdmin: true });
  renderizarSituacoesDoColaboradorModal();
  renderizarPainelSituacoesAdmin();
  const descricao = descricaoSituacao(codigo);
  msgAdmin(`${descricao} aplicada para ${pessoa.nome}: ${formatarDataBR(inicioISO)} a ${formatarDataBR(fimISO)}.`);
  toast(`${descricao} aplicada. O destaque será automático pelo período.`, 'ok');
  await enviarAlteracaoAdmin({ acao: 'salvarSituacao', senha: adminSenhaSessao, equipe: APP.equipe || CONFIG.equipe, situacao: registro });
  editorSituacaoEscala.codigo = '';
  renderizarSituacoesEscala();
  if (fecharAoConcluir) fecharModalSituacaoEscala();
  return true;
}

async function removerSituacaoPorId(id) {
  if (!exigirAdmin()) return;
  const item = SITUACOES_REGISTROS.find(registro => registro.id === id);
  if (!item) return;
  const pessoa = colaboradorPorId(item.colaboradorId);
  const confirmado = await confirmarAcaoApp({ titulo: 'Remover situação', mensagem: `Remover ${descricaoSituacao(item.tipo)} de ${pessoa?.nome || item.nome}?

Período: ${formatarDataBR(item.inicio)} a ${formatarDataBR(item.fim)}.`, confirmarTexto: 'Remover situação', tipo: 'perigo' });
  if (!confirmado) return;
  SITUACOES_REGISTROS = SITUACOES_REGISTROS.filter(registro => registro.id !== id);
  salvarCacheMes();
  atualizarInterfaceCompleta({ preservarAdmin: true });
  renderizarSituacoesDoColaboradorModal();
  renderizarPainelSituacoesAdmin();
  await enviarAlteracaoAdmin({ acao: 'removerSituacao', senha: adminSenhaSessao, equipe: APP.equipe || CONFIG.equipe, situacaoId: id });
  toast('Situação removida. O destaque amarelo foi retirado.', 'ok');
}

async function removerSituacaoEscala() {
  if (!exigirAdmin()) return;
  try {
    const { pessoa, inicioISO, fimISO } = validarPeriodoSituacao({ exigirSituacao: false });
    const correspondentes = SITUACOES_REGISTROS.filter(item => item.colaboradorId === pessoa.id && item.inicio <= fimISO && item.fim >= inicioISO);
    if (!correspondentes.length) throw new Error('Não existe situação aplicada para esse colaborador no período informado.');
    if (!(await confirmarAcaoApp({ titulo: 'Remover situação do período', mensagem: `Remover ${correspondentes.length} situação(ões) de ${pessoa.nome} que coincidem com ${formatarDataBR(inicioISO)} a ${formatarDataBR(fimISO)}?`, confirmarTexto: 'Remover', tipo: 'perigo' }))) return;
    for (const item of correspondentes) {
      SITUACOES_REGISTROS = SITUACOES_REGISTROS.filter(registro => registro.id !== item.id);
      await enviarAlteracaoAdmin({ acao: 'removerSituacao', senha: adminSenhaSessao, equipe: APP.equipe || CONFIG.equipe, situacaoId: item.id });
    }
    salvarCacheMes();
    atualizarInterfaceCompleta({ preservarAdmin: true });
    editorSituacaoEscala.codigo = '';
    renderizarSituacoesEscala();
    renderizarSituacoesDoColaboradorModal();
    renderizarPainelSituacoesAdmin();
    if ($('situacaoDataInicio')) $('situacaoDataInicio').value = '';
    if ($('situacaoDataFim')) { $('situacaoDataFim').value = ''; $('situacaoDataFim').min = ''; }
    toast('Situação removida. Período zerado e destaque retirado.', 'ok');
    await confirmarDadosServidor({ silencioso: true });
  } catch (erro) {
    toast(erro.message, 'erro', 5500);
  }
}

async function salvarEscala() {
  if (!exigirAdmin()) return;
  const pessoa = colaboradorPorId($('adminColaborador')?.value || '');
  if (!pessoa) return;
  const novosDias = diasDisponiveis().map((dia) => normalizarCodigoPosto($(`diaAdmin_${dia}`)?.value || ''));
  const anteriores = (pessoa.dias || []).map(valor => normalizarCodigoPosto(valor || ''));
  const alterados = novosDias.reduce((total, valor, indice) => total + (valor !== (anteriores[indice] || '') ? 1 : 0), 0);
  if (!alterados) {
    await confirmarAcaoApp({ titulo: 'Nenhuma alteração', mensagem: `A escala fixa de ${pessoa.nome} já está igual aos dados exibidos.`, confirmarTexto: 'OK', tipo: 'info' });
    return;
  }
  const confirmado = await confirmarAcaoApp({
    titulo: 'Salvar escala fixa',
    mensagem: `Salvar ${alterados} alteração(ões) na escala fixa de ${pessoa.nome}?\n\nOs postos destes dias serão enviados para a planilha Google.`,
    confirmarTexto: 'Salvar escala',
    tipo: 'aviso'
  });
  if (!confirmado) return;
  pessoa.dias = novosDias;
  salvarCacheMes();
  atualizarInterfaceCompleta({ preservarAdmin: true });
  await enviarAlteracaoAdmin({ acao: 'salvarEscala', senha: adminSenhaSessao, equipe: APP.equipe || CONFIG.equipe, colaborador: pessoa });
  msgAdmin(`Escala fixa de ${pessoa.nome} salva.`);
  toast('Escala fixa salva.', 'ok');
}

function itensPendentesAdmin() {
  return lerFila().filter(item => ACOES_ADMIN_DADOS.has(String(item?.payload?.acao || '')));
}

function descartarFilaAdminLocal() {
  const fila = lerFila();
  const mantidos = fila.filter(item => !ACOES_ADMIN_DADOS.has(String(item?.payload?.acao || '')));
  salvarFila(mantidos);
}

async function sincronizarDadosComPlanilha() {
  if (!exigirAdmin()) return;
  if (!navigator.onLine) {
    await confirmarAcaoApp({ titulo: 'Sem conexão', mensagem: 'É necessário estar conectado à internet para atualizar os dados oficiais da planilha.', confirmarTexto: 'Entendi', tipo: 'aviso' });
    return;
  }
  const pendentes = itensPendentesAdmin().length;
  const confirmado = await confirmarAcaoApp({
    titulo: 'Atualizar da planilha',
    mensagem: `Buscar agora a versão oficial dos dados no Google Sheets?${pendentes ? `\n\nAtenção: existem ${pendentes} alteração(ões) administrativa(s) pendente(s) neste aparelho. Atualizar não apaga essas pendências; use “Desfazer ações” para descartá-las.` : ''}`,
    confirmarTexto: 'Atualizar agora',
    tipo: pendentes ? 'aviso' : 'info'
  });
  if (!confirmado) return;
  await confirmarDadosServidor({ silencioso: false, tentativas: 3 });
}

async function desfazerAcoesAdmin() {
  if (!exigirAdmin()) return;
  if (!navigator.onLine) {
    await confirmarAcaoApp({ titulo: 'Não é possível desfazer offline', mensagem: 'Para voltar aos dados oficiais, o aplicativo precisa consultar a planilha Google. Conecte-se à internet e tente novamente.', confirmarTexto: 'Entendi', tipo: 'aviso' });
    return;
  }

  const pendentes = itensPendentesAdmin().length;
  const confirmado = await confirmarAcaoApp({
    titulo: 'Desfazer ações administrativas',
    mensagem: `O aplicativo descartará as alterações administrativas pendentes neste aparelho e recarregará Colaboradores, Postos, Escala fixa, Situações, Coberturas e escalas de sábado a partir da planilha Google.${pendentes ? `\n\nPendências locais que serão descartadas: ${pendentes}.` : ''}\n\nIMPORTANTE: alterações que já foram sincronizadas e estão gravadas na planilha NÃO serão revertidas por este botão.`,
    confirmarTexto: 'Voltar aos dados da planilha',
    tipo: 'perigo'
  });
  if (!confirmado) return;

  const botao = $('btnDesfazerAdmin');
  setLoadingBotao(botao, true, 'Restaurando...');
  try {
    // Primeiro confirma que a fonte oficial está acessível. Só depois descarta dados locais.
    const resposta = await apiGet('bootstrap', { equipe: APP.equipe || CONFIG.equipe });

    descartarFilaAdminLocal();
    localStorage.removeItem(`${STORAGE.cachePrefixo}${CHAVE_ESCALA_FIXA}`);
    localStorage.removeItem(STORAGE.sabadosHE);
    localStorage.removeItem(STORAGE.listaSabadosAdmin);

    aplicarDados({
      postos: resposta.postos,
      escala: resposta.escala,
      situacoes: resposta.situacoes || [],
      coberturas: resposta.coberturas || []
    }, 'Google Sheets');
    ultimaSincronizacaoServidor = resposta.atualizadoEm || new Date().toISOString();
    salvarCacheMes(CHAVE_ESCALA_FIXA, {
      mesAno: CHAVE_ESCALA_FIXA, legenda: LEGENDA, escala: ESCALA,
      situacoes: SITUACOES_REGISTROS, coberturas: COBERTURAS_REGISTROS,
      atualizadoEm: ultimaSincronizacaoServidor, origem: 'Google Sheets'
    });

    escalaSabadoEditor = null;
    previewEscalaSabadoAdmin = null;
    postosNecessariosSabadoEditor = new Set();
    statusEscalaSabadoPreferido = '';
    atualizarInterfaceCompleta({ preservarAdmin: true });
    await carregarListaEscalasSabadoAdmin();
    if ($('dataEscalaSabado')?.value && $('turnoEscalaSabado')?.value) {
      await carregarEditorEscalaSabado(true).catch(() => null);
    }
    atualizarStatusAdmin();

    await confirmarAcaoApp({
      titulo: 'Dados restaurados',
      mensagem: 'O aplicativo voltou aos dados atualmente gravados na planilha Google. Alterações locais pendentes foram descartadas.',
      confirmarTexto: 'OK',
      tipo: 'info'
    });
  } catch (erro) {
    await confirmarAcaoApp({
      titulo: 'Não foi possível restaurar',
      mensagem: `Os dados locais foram preservados porque a planilha não pôde ser confirmada.\n\n${erro.message}`,
      confirmarTexto: 'Entendi',
      tipo: 'aviso'
    });
  } finally {
    setLoadingBotao(botao, false);
  }
}


function atualizarStatusAdmin() {
  const campo = $('statusSincronizacaoAdmin');
  const detalhe = $('detalheSincronizacaoAdmin');
  if (!campo) return;
  const pendentes = lerFila().filter(item => item?.payload?.acao !== 'salvarFechamento').length;
  const online = navigator.onLine;
  campo.classList.remove('ok', 'pendente', 'offline');
  if (!online) {
    campo.classList.add('offline');
    campo.textContent = 'Offline';
  } else if (sincronizandoAdmin || pendentes) {
    campo.classList.add('pendente');
    campo.textContent = sincronizandoAdmin ? 'Sincronizando…' : `${pendentes} pendente(s)`;
  } else {
    campo.classList.add('ok');
    campo.textContent = 'Sincronizado';
  }
  if (detalhe) detalhe.textContent = ultimaSincronizacaoServidor ? `Planilha consultada em ${formatarDataHora(ultimaSincronizacaoServidor)}` : 'Aguardando primeira consulta da planilha';
}

async function confirmarDadosServidor({ silencioso = false, tentativas = 3 } = {}) {
  if (!navigator.onLine) { atualizarStatusAdmin(); return false; }
  sincronizandoAdmin = true;
  atualizarStatusAdmin();
  let ultimoErro = null;
  for (let tentativa = 1; tentativa <= tentativas; tentativa += 1) {
    try {
      if (tentativa > 1) await esperar(550 * tentativa);
      const resposta = await apiGet('bootstrap', { equipe: APP.equipe || CONFIG.equipe });
      atualizarInconsistenciasDados(resposta, { mostrarModal: !silencioso });
      aplicarDados({ postos: resposta.postos, escala: resposta.escala, situacoes: resposta.situacoes || [], coberturas: resposta.coberturas || [] }, 'Google Sheets');
      ultimaSincronizacaoServidor = resposta.atualizadoEm || new Date().toISOString();
      salvarCacheMes(CHAVE_ESCALA_FIXA, { mesAno: CHAVE_ESCALA_FIXA, legenda: LEGENDA, escala: ESCALA, situacoes: SITUACOES_REGISTROS, coberturas: COBERTURAS_REGISTROS, atualizadoEm: ultimaSincronizacaoServidor, origem: 'Google Sheets' });
      sincronizandoAdmin = false;
      atualizarInterfaceCompleta({ preservarAdmin: true });
      atualizarStatusAdmin();
      if (!silencioso) toast('Dados confirmados pela planilha.', 'ok');
      return true;
    } catch (erro) { ultimoErro = erro; }
  }
  sincronizandoAdmin = false;
  atualizarStatusAdmin();
  if (!silencioso && ultimoErro) toast(`Não foi possível confirmar na planilha. ${ultimoErro.message}`, 'aviso', 5500);
  return false;
}

function payloadAdminConfirmadoNoBootstrap(payload, resposta) {
  const acao = String(payload?.acao || '');
  const escala = Array.isArray(resposta?.escala) ? resposta.escala : [];
  const situacoes = Array.isArray(resposta?.situacoes) ? resposta.situacoes : [];
  const coberturas = Array.isArray(resposta?.coberturas) ? resposta.coberturas : [];
  const postos = resposta?.postos || {};
  if (acao === 'salvarColaborador') return escala.some(item => item.id === payload?.colaborador?.id && item.nome === payload?.colaborador?.nome);
  if (acao === 'excluirColaborador') return !escala.some(item => item.id === payload?.colaboradorId);
  if (acao === 'retirarColaborador') return !escala.some(item => item.id === payload?.colaboradorId) && escala.some(item => item.id === payload?.vagaId && ehVagaAberta(item));
  if (acao === 'assumirPosicao') {
    const novo = escala.find(item => item.id === payload?.novoColaboradorId);
    const antigo = escala.find(item => item.id === payload?.colaboradorSubstituidoId);
    if (!novo) return false;
    const destino = String(payload?.destinoOcupante || 'MANTER').toUpperCase();
    const estadoAntigoOk = destino === 'RETIRAR'
      ? !antigo
      : Boolean(antigo && !colaboradorPossuiEscalaFixa(antigo));
    if (!estadoAntigoOk) return false;
    const recebido = (novo.dias || []).map(valor => postoDoDia(valor));
    const esperado = (payload?.diasEsperados || []).map(valor => postoDoDia(valor));
    const turnoOk = !payload?.turnoEsperado || mesmoTurno(novo.turno, payload.turnoEsperado);
    return turnoOk && esperado.length === recebido.length && esperado.every((valor, indice) => valor === recebido[indice]);
  }
  if (acao === 'preencherVaga') return !escala.some(item => item.id === payload?.vagaId) && escala.some(item => item.id === payload?.colaboradorId);
  if (acao === 'realocarColaborador') return !escala.some(item => item.id === payload?.vagaDestinoId) && escala.some(item => item.id === payload?.colaboradorId) && escala.some(item => item.id === payload?.novaVagaId && ehVagaAberta(item));
  if (acao === 'trocarPosicoes') {
    const pessoaA = escala.find(item => item.id === payload?.colaboradorAId);
    const pessoaB = escala.find(item => item.id === payload?.colaboradorBId);
    if (!pessoaA || !pessoaB) return false;
    const recebidoA = (pessoaA.dias || []).map(valor => postoDoDia(valor));
    const recebidoB = (pessoaB.dias || []).map(valor => postoDoDia(valor));
    const esperadoA = (payload?.diasAEsperados || []).map(valor => postoDoDia(valor));
    const esperadoB = (payload?.diasBEsperados || []).map(valor => postoDoDia(valor));
    const turnoAOk = !payload?.turnoAEsperado || mesmoTurno(pessoaA.turno, payload.turnoAEsperado);
    const turnoBOk = !payload?.turnoBEsperado || mesmoTurno(pessoaB.turno, payload.turnoBEsperado);
    return turnoAOk && turnoBOk
      && esperadoA.length === recebidoA.length && esperadoB.length === recebidoB.length
      && esperadoA.every((valor, indice) => valor === recebidoA[indice])
      && esperadoB.every((valor, indice) => valor === recebidoB[indice]);
  }
  if (acao === 'salvarPosto') return Boolean(postos[payload?.posto?.codigo]);
  if (acao === 'excluirPosto') return !postos[payload?.codigo];
  if (acao === 'salvarEscala') {
    const pessoa = escala.find(item => item.id === payload?.colaborador?.id);
    if (!pessoa) return false;
    const esperado = (payload.colaborador.dias || []).map(valor => postoDoDia(valor));
    const recebido = (pessoa.dias || []).map(valor => postoDoDia(valor));
    return esperado.length === recebido.length && esperado.every((valor, indice) => valor === recebido[indice]);
  }
  if (acao === 'salvarSituacao') return situacoes.some(item => item.id === payload?.situacao?.id);
  if (acao === 'removerSituacao') return !situacoes.some(item => item.id === payload?.situacaoId);
  if (acao === 'salvarCobertura') return coberturas.some(item => item.id === payload?.cobertura?.id);
  if (acao === 'removerCobertura') return !coberturas.some(item => item.id === payload?.coberturaId);
  return true;
}

async function confirmarAlteracaoAdminNoServidor(payload, tentativas = 4) {
  let ultimaResposta = null;
  for (let tentativa = 1; tentativa <= tentativas; tentativa += 1) {
    try {
      if (tentativa > 1) await esperar(600 * tentativa);
      const resposta = await apiGet('bootstrap', { equipe: APP.equipe || CONFIG.equipe });
      ultimaResposta = resposta;
      atualizarInconsistenciasDados(resposta, { mostrarModal: false });
      if (!payloadAdminConfirmadoNoBootstrap(payload, resposta)) continue;
      aplicarDados({ postos: resposta.postos, escala: resposta.escala, situacoes: resposta.situacoes || [], coberturas: resposta.coberturas || [] }, 'Google Sheets');
      ultimaSincronizacaoServidor = resposta.atualizadoEm || new Date().toISOString();
      salvarCacheMes(CHAVE_ESCALA_FIXA, { mesAno: CHAVE_ESCALA_FIXA, legenda: LEGENDA, escala: ESCALA, situacoes: SITUACOES_REGISTROS, coberturas: COBERTURAS_REGISTROS, atualizadoEm: ultimaSincronizacaoServidor, origem: 'Google Sheets' });
      atualizarInterfaceCompleta({ preservarAdmin: $('areaAdmin')?.hidden === false });
      atualizarStatusAdmin();
      return true;
    } catch (_) { /* nova tentativa */ }
  }
  return false;
}

function garantirPayloadAdminNaFila(payload) {
  const fila = lerFila();
  const chave = JSON.stringify({
    acao: payload?.acao,
    id: payload?.situacao?.id || payload?.cobertura?.id || payload?.vagaId || payload?.vagaDestinoId || payload?.novaVagaId || (payload?.colaboradorAId && payload?.colaboradorBId ? `${payload.colaboradorAId}|${payload.colaboradorBId}` : '') || payload?.colaborador?.id || payload?.colaboradorId || payload?.codigo || payload?.posto?.codigo || '',
    inicio: payload?.situacao?.inicio || payload?.cobertura?.inicio || ''
  });
  const existe = fila.some(item => JSON.stringify({
    acao: item?.payload?.acao,
    id: item?.payload?.situacao?.id || item?.payload?.cobertura?.id || item?.payload?.vagaId || item?.payload?.vagaDestinoId || item?.payload?.novaVagaId || (item?.payload?.colaboradorAId && item?.payload?.colaboradorBId ? `${item.payload.colaboradorAId}|${item.payload.colaboradorBId}` : '') || item?.payload?.colaborador?.id || item?.payload?.colaboradorId || item?.payload?.codigo || item?.payload?.posto?.codigo || '',
    inicio: item?.payload?.situacao?.inicio || item?.payload?.cobertura?.inicio || ''
  }) === chave);
  if (!existe) enfileirarPayload(payload);
}

async function enviarAlteracaoAdmin(payload) {
  const resposta = await apiPost(payload);
  if (resposta?.enfileirado) {
    atualizarStatusAdmin();
    toast('Alteração salva neste aparelho e aguardando sincronização.', 'aviso');
    return false;
  }
  sincronizandoAdmin = true;
  atualizarStatusAdmin();
  const confirmada = await confirmarAlteracaoAdminNoServidor(payload, 4);
  sincronizandoAdmin = false;
  if (!confirmada) {
    garantirPayloadAdminNaFila(payload);
    atualizarStatusAdmin();
    toast('Alteração salva neste aparelho; a confirmação da planilha está pendente.', 'aviso');
    return false;
  }
  atualizarStatusAdmin();
  return true;
}

function prepararCoberturasAdmin() {
  const inicio = $('coberturaDataInicio');
  const fim = $('coberturaDataFim');
  if (inicio && !inicio.value) inicio.value = dataISOHoje();
  if (fim && !fim.value) fim.value = inicio?.value || dataISOHoje();
  ajustarDatasCobertura();
  definirTipoCobertura(tipoCoberturaAdmin, { atualizarPreview: false });
  renderizarPreviaCoberturaAdmin();
}

function ajustarDatasCobertura() {
  const inicio = $('coberturaDataInicio')?.value || '';
  const fim = $('coberturaDataFim');
  if (!fim) return;
  fim.min = inicio;
  if (!fim.value || (inicio && fim.value < inicio)) fim.value = inicio;
}

function definirTipoCobertura(tipo, { atualizarPreview = true } = {}) {
  tipoCoberturaAdmin = String(tipo || '').toUpperCase() === 'POSTO' ? 'POSTO' : 'COLABORADOR';
  $('btnCoberturaPorColaborador')?.classList.toggle('ativo', tipoCoberturaAdmin === 'COLABORADOR');
  $('btnCoberturaPorPosto')?.classList.toggle('ativo', tipoCoberturaAdmin === 'POSTO');
  if ($('coberturaFonteColaborador')) $('coberturaFonteColaborador').hidden = tipoCoberturaAdmin !== 'COLABORADOR';
  if ($('coberturaFontePosto')) $('coberturaFontePosto').hidden = tipoCoberturaAdmin !== 'POSTO';
  if (atualizarPreview) renderizarPreviaCoberturaAdmin();
}

function dadosFormularioCobertura() {
  const origemId = $('coberturaOrigem')?.value || '';
  const destinoId = $('coberturaDestino')?.value || '';
  const postoFonte = normalizarCodigoPosto($('coberturaPostoFonte')?.value || '');
  const inicio = $('coberturaDataInicio')?.value || '';
  const fim = $('coberturaDataFim')?.value || '';
  const origem = colaboradorPorId(origemId);
  const destino = colaboradorPorId(destinoId);
  return { origemId, destinoId, postoFonte, inicio, fim, origem, destino, modo: tipoCoberturaAdmin };
}

function montarItemCoberturaFormulario(id = 'preview-cobertura') {
  const dados = dadosFormularioCobertura();
  return normalizarRegistroCobertura({
    id,
    origemId: dados.origemId,
    nomeOrigem: dados.origem?.nome || '',
    destinoId: dados.modo === 'COLABORADOR' ? dados.destinoId : '',
    nomeDestino: dados.modo === 'COLABORADOR' ? (dados.destino?.nome || '') : '',
    postoFonte: dados.modo === 'POSTO' ? dados.postoFonte : '',
    modo: dados.modo,
    inicio: dados.inicio,
    fim: dados.fim,
    ativo: true
  });
}

function validarFormularioCoberturaBasico() {
  const dados = dadosFormularioCobertura();
  if (!dados.origem) throw new Error('Selecione o colaborador a ser coberto.');
  if (!dados.inicio || !dados.fim || dados.fim < dados.inicio) throw new Error('Informe um período válido.');
  if (dados.modo === 'COLABORADOR') {
    if (!dados.destino || dados.destinoId === dados.origemId) throw new Error('Selecione outro colaborador para fazer a cobertura.');
  } else if (!dados.postoFonte) {
    throw new Error('Selecione o posto que fornecerá a cobertura.');
  }
  return dados;
}

function calcularPreviaCobertura() {
  const dados = validarFormularioCoberturaBasico();
  const item = montarItemCoberturaFormulario('preview-cobertura');
  const datas = datasEntreISO(dados.inicio, dados.fim, 370);
  if (!datas.length) throw new Error('Período inválido.');
  if (datas.length >= 370 && datas[datas.length - 1] !== dados.fim) throw new Error('O período da cobertura é muito longo.');
  const avaliacoes = datas.map(dataISO => avaliarCoberturaNoDia(item, dataISO));
  return { dados, item, avaliacoes, valido: avaliacoes.every(avaliacao => avaliacao.valido) };
}

function renderizarPreviaCoberturaAdmin() {
  const campo = $('previewCoberturaAdmin');
  if (!campo) return null;
  let previa;
  try {
    previa = calcularPreviaCobertura();
  } catch (erro) {
    campo.innerHTML = `<div class="resultado-vazio compacto">${escaparHTML(erro.message)}</div>`;
    return null;
  }

  const conflitos = previa.avaliacoes.filter(item => !item.valido).length;
  const limiteVisual = 45;
  const linhas = previa.avaliacoes.slice(0, limiteVisual).map((avaliacao, indice) => {
    const cobridor = avaliacao.cobridor?.nome || 'Sem cobridor';
    const origem = avaliacao.postoFonte ? `${avaliacao.postoFonte} • ${avaliacao.descricaoPostoFonte}` : '—';
    const destino = avaliacao.postoAlvo ? `${avaliacao.postoAlvo} • ${avaliacao.descricaoPostoAlvo}` : 'Sem posto';
    const detalhe = avaliacao.valido
      ? `${cobridor} sai de ${origem} e fica cobrindo posto ${destino}.`
      : avaliacao.conflitos.join(' ');
    return `<div class="linha-preview-cobertura ${avaliacao.valido ? 'ok' : 'conflito'}">
      <span class="data-preview-cobertura">${escaparHTML(formatarDataBR(avaliacao.item ? deslocarDataISO(avaliacao.item.inicio, indice) : ''))}</span>
      <div><strong>${escaparHTML(avaliacao.valido ? 'Cobertura válida' : 'Conflito')}</strong><small>${escaparHTML(detalhe)}</small></div>
      <span class="icone-preview-cobertura">${avaliacao.valido ? '✓' : '⚠'}</span>
    </div>`;
  }).join('');

  campo.innerHTML = `
    <div class="cabecalho-preview-cobertura ${conflitos ? 'com-conflito' : 'sem-conflito'}">
      <strong>Prévia da cobertura</strong>
      <span>${conflitos ? `${conflitos} conflito(s) — corrija antes de registrar` : `${previa.avaliacoes.length} dia(s) verificados • sem conflitos`}</span>
    </div>
    <div class="lista-preview-cobertura">${linhas}</div>
    ${previa.avaliacoes.length > limiteVisual ? `<p class="muted mini-ajuda">Mostrando os primeiros ${limiteVisual} dias de ${previa.avaliacoes.length}.</p>` : ''}`;
  return previa;
}

function renderizarPainelSituacoesAdmin() {
  const campo = $('listaSituacoesAdmin');
  if (!campo) return;
  const hoje = dataISOHoje();
  const itens = situacoesVisiveisAdmin().slice(0, 12);
  campo.innerHTML = itens.length ? itens.map(item => {
    const pessoa = colaboradorPorId(item.colaboradorId);
    const estado = periodoContemData(item, hoje) ? 'Em andamento' : item.inicio > hoje ? 'Programada' : 'Finalizada';
    return `<div class="linha-resumo-admin ${periodoContemData(item, hoje) ? 'situacao-vigente' : ''}">
      <div><strong>${escaparHTML(pessoa?.nome || item.nome || 'Colaborador')}</strong><small>${escaparHTML(descricaoSituacao(item.tipo))} • ${formatarDataBR(item.inicio)} a ${formatarDataBR(item.fim)} • ${estado}</small></div>
      ${item.fim >= hoje ? `<button class="btn-mini-remover" type="button" onclick="removerSituacaoPorId('${escaparHTML(item.id)}')">Remover</button>` : ''}
    </div>`;
  }).join('') : '<div class="resultado-vazio compacto">Nenhuma situação cadastrada.</div>';
}

function renderizarPainelCoberturasAdmin() {
  const campo = $('listaCoberturasAdmin');
  if (!campo) return;
  const hoje = dataISOHoje();
  const itens = COBERTURAS_REGISTROS.slice().sort((a,b) => b.inicio.localeCompare(a.inicio)).slice(0, 12);
  campo.innerHTML = itens.length ? itens.map(item => {
    const origem = colaboradorPorId(item.origemId);
    const destino = colaboradorPorId(item.destinoId);
    const estado = periodoContemData(item, hoje) ? 'Em andamento' : item.inicio > hoje ? 'Programada' : 'Finalizada';
    const fonte = item.modo === 'POSTO'
      ? `Quem estiver no posto ${item.postoFonte} → ${origem?.nome || item.nomeOrigem || 'Colaborador'}`
      : `${destino?.nome || item.nomeDestino || 'Substituto'} → ${origem?.nome || item.nomeOrigem || 'Colaborador'}`;
    return `<div class="linha-resumo-admin ${periodoContemData(item, hoje) ? 'cobertura-vigente' : ''}">
      <div><strong>${escaparHTML(fonte)}</strong><small>${formatarDataBR(item.inicio)} a ${formatarDataBR(item.fim)} • ${estado}${item.modo === 'POSTO' ? ' • posto de origem fica vazio' : ''}</small></div>
      ${item.fim >= hoje ? `<button class="btn-mini-remover" type="button" onclick="removerCobertura('${escaparHTML(item.id)}')">Remover</button>` : ''}
    </div>`;
  }).join('') : '<div class="resultado-vazio compacto">Nenhuma cobertura cadastrada.</div>';
}

async function registrarCobertura() {
  if (!exigirAdmin()) return;
  let previa;
  try {
    previa = calcularPreviaCobertura();
  } catch (erro) {
    toast(erro.message, 'erro', 5500);
    renderizarPreviaCoberturaAdmin();
    return;
  }
  if (!previa.valido) {
    renderizarPreviaCoberturaAdmin();
    toast('Existem conflitos na cobertura. Corrija a prévia antes de registrar.', 'erro', 6000);
    return;
  }

  const { dados } = previa;
  const origem = dados.origem;
  const textoFonte = dados.modo === 'POSTO'
    ? `Quem estiver no posto ${dados.postoFonte} em cada dia cobrirá ${origem.nome}. O posto ${dados.postoFonte} ficará vazio após o deslocamento e não precisará de nova cobertura.`
    : `${dados.destino.nome} cobrirá ${origem.nome}. O posto de origem de ${dados.destino.nome} ficará vazio enquanto ele estiver deslocado.`;
  const confirmado = await confirmarAcaoApp({
    titulo: 'Registrar cobertura',
    mensagem: `${textoFonte}\n\nPeríodo: ${formatarDataBR(dados.inicio)} a ${formatarDataBR(dados.fim)}.\nA escala fixa continuará intacta. Na consulta, o cobridor aparecerá com a indicação “cobrindo posto” e o nome do posto de destino.`,
    confirmarTexto: 'Registrar cobertura',
    tipo: 'aviso'
  });
  if (!confirmado) return;

  const item = montarItemCoberturaFormulario(criarId('cob', `${dados.origemId}-${dados.modo === 'POSTO' ? dados.postoFonte : dados.destinoId}`));
  COBERTURAS_REGISTROS.push(item);
  normalizarRegistrosTemporais();
  salvarCacheMes();
  renderizarPainelCoberturasAdmin();
  atualizarInterfaceCompleta({ preservarAdmin: true });
  await enviarAlteracaoAdmin({ acao: 'salvarCobertura', senha: adminSenhaSessao, equipe: APP.equipe || CONFIG.equipe, cobertura: item });
  renderizarPreviaCoberturaAdmin();
  toast('Cobertura registrada sem alterar a escala fixa.', 'ok');
}

async function removerCobertura(id) {
  if (!exigirAdmin()) return;
  const item = COBERTURAS_REGISTROS.find(registro => registro.id === id);
  if (!item) return;
  if (!(await confirmarAcaoApp({ titulo: 'Remover cobertura', mensagem: `Remover a cobertura de ${item.nomeOrigem || 'colaborador'} no período ${formatarDataBR(item.inicio)} a ${formatarDataBR(item.fim)}?`, confirmarTexto: 'Remover', tipo: 'perigo' }))) return;
  COBERTURAS_REGISTROS = COBERTURAS_REGISTROS.filter(registro => registro.id !== id);
  salvarCacheMes();
  renderizarPainelCoberturasAdmin();
  atualizarInterfaceCompleta({ preservarAdmin: true });
  await enviarAlteracaoAdmin({ acao: 'removerCobertura', senha: adminSenhaSessao, equipe: APP.equipe || CONFIG.equipe, coberturaId: id });
  renderizarPreviaCoberturaAdmin();
  toast('Cobertura removida.', 'ok');
}

async function carregarListaEscalasSabadoAdmin() {
  const campo = $('listaEscalasSabadoAdmin');
  if (!campo) return;
  let itens = [];
  try {
    if (navigator.onLine) {
      const resposta = await apiGet('listarEscalasSabado', { limite: 24 });
      itens = Array.isArray(resposta?.itens) ? resposta.itens : [];
      localStorage.setItem(STORAGE.listaSabadosAdmin, JSON.stringify(itens));
    } else {
      itens = JSON.parse(localStorage.getItem(STORAGE.listaSabadosAdmin) || '[]');
    }
  } catch {
    try { itens = JSON.parse(localStorage.getItem(STORAGE.listaSabadosAdmin) || '[]'); } catch { itens = []; }
  }

  const ordenar = (lista) => lista.slice().sort((a, b) =>
    String(b.dataISO || '').localeCompare(String(a.dataISO || ''))
    || String(a.turno || '').localeCompare(String(b.turno || ''), 'pt-BR')
  );
  const rascunhos = ordenar(itens.filter(item => String(item.status).toUpperCase() === 'RASCUNHO')).slice(0, 8);
  const publicadas = ordenar(itens.filter(item => String(item.status).toUpperCase() === 'PUBLICADA')).slice(0, 8);

  const bloco = (titulo, lista, classe) => `<div class="grupo-escalas-sabado-admin"><h5>${titulo}</h5>${
    lista.length
      ? lista.map(item => `<button type="button" class="atalho-sabado ${classe}" onclick="visualizarEscalaSabadoAdmin('${escaparHTML(item.dataISO)}','${escaparHTML(item.turno)}','${escaparHTML(item.status)}')"><span><strong>${formatarDataBR(item.dataISO)}</strong><small>${escaparHTML(item.turno)}</small></span><small>${item.quantidade || 0} colaborador(es)<br>Ver escala</small></button>`).join('')
      : '<small class="muted">Nenhuma.</small>'
  }</div>`;

  campo.innerHTML = bloco('Rascunhos', rascunhos, 'rascunho') + bloco('Publicadas', publicadas, 'publicada');
}

function abrirEscalaSabadoAdmin(dataISO, turno, status = '') {
  visualizarEscalaSabadoAdmin(dataISO, turno, status);
}

function abrirModalPreviewSabado() {
  const modal = $('modalPreviewSabado');
  if (!modal) return;
  modal.hidden = false;
  document.body.classList.add('modal-aberto');
}

function fecharPreviewSabado() {
  const modal = $('modalPreviewSabado');
  if (modal) modal.hidden = true;
  sincronizarEstadoModalBody();
  previewEscalaSabadoAdmin = null;
}

function renderizarPreviewSabado(escala) {
  const status = String(escala?.status || '').toUpperCase();
  const rascunho = status === 'RASCUNHO';
  const dataISO = escala?.dataISO || '';
  const turno = turnoCanonico(escala?.turno || '');
  const itens = (escala?.itens || []).slice().sort((a, b) => String(a.nome || '').localeCompare(String(b.nome || ''), 'pt-BR'));

  if ($('tituloModalPreviewSabado')) $('tituloModalPreviewSabado').textContent = rascunho ? 'Rascunho de sábado' : 'Escala publicada';
  if ($('subtituloModalPreviewSabado')) $('subtituloModalPreviewSabado').textContent = rascunho
    ? 'Confira colaboradores, postos e observações antes de publicar.'
    : 'Visualização da escala que está disponível para os colaboradores.';

  if ($('resumoModalPreviewSabado')) {
    $('resumoModalPreviewSabado').innerHTML = `
      <strong>${escaparHTML(formatarDataBR(dataISO))}</strong>
      <span>${escaparHTML(turno)}</span>
      <span>${itens.length} colaborador(es)</span>
      <span class="preview-status ${rascunho ? 'rascunho' : 'publicada'}">${rascunho ? 'Rascunho' : 'Publicada'}</span>`;
  }

  if ($('listaModalPreviewSabado')) {
    $('listaModalPreviewSabado').innerHTML = itens.length ? itens.map(item => `
      <div class="preview-sabado-item">
        <div class="preview-pessoa">
          <strong>${escaparHTML(item.nome || 'Colaborador')}</strong>
          <small>${escaparHTML(item.registro || 'Registro não cadastrado')}</small>
          ${item.observacao ? `<span class="preview-observacao">${escaparHTML(item.observacao)}</span>` : ''}
        </div>
        <div class="preview-sabado-posto">
          <strong>${escaparHTML(item.posto || '—')}</strong>
          <small>${escaparHTML(item.posto ? postoDescricao(item.posto) : 'Sem posto')}</small>
        </div>
      </div>`).join('') : '<div class="resultado-vazio">Nenhum colaborador nesta escala.</div>';
  }

  if ($('btnEditarPreviewSabado')) $('btnEditarPreviewSabado').textContent = rascunho ? 'Editar rascunho' : 'Criar rascunho desta escala';
  if ($('btnExcluirPreviewSabado')) $('btnExcluirPreviewSabado').hidden = !rascunho;
  if ($('btnPublicarPreviewSabado')) $('btnPublicarPreviewSabado').hidden = !rascunho;
}

async function obterEscalaSabadoAdminPorStatus(dataISO, turno, status) {
  const desejado = String(status || '').trim().toUpperCase();
  const incluirRascunho = desejado === 'RASCUNHO';
  let escala = obterCacheEscalaSabado(dataISO, turno, { incluirRascunho });

  if (navigator.onLine) {
    try {
      const resposta = await consultarEscalaSabadoServidor(dataISO, turno, incluirRascunho);
      if (resposta?.encontrada && resposta.itens?.length && String(resposta.status || '').toUpperCase() === desejado) {
        escala = resposta;
        salvarCacheEscalaSabado(escala);
      }
    } catch (_) { /* usa cache abaixo */ }
  }

  if (!escala || !escala.itens?.length || String(escala.status || '').toUpperCase() !== desejado) {
    throw new Error(`${desejado === 'RASCUNHO' ? 'Rascunho' : 'Publicação'} não encontrado(a) para ${formatarDataBR(dataISO)} • ${turnoCanonico(turno)}.`);
  }
  return normalizarEscalaSabado(escala, dataISO, turno);
}

async function visualizarEscalaSabadoAdmin(dataISO, turno, status = 'RASCUNHO') {
  if (!exigirAdmin()) return;
  previewEscalaSabadoAdmin = null;
  abrirModalPreviewSabado();
  if ($('tituloModalPreviewSabado')) $('tituloModalPreviewSabado').textContent = 'Carregando escala...';
  if ($('subtituloModalPreviewSabado')) $('subtituloModalPreviewSabado').textContent = `${formatarDataBR(dataISO)} • ${turnoCanonico(turno)}`;
  if ($('resumoModalPreviewSabado')) $('resumoModalPreviewSabado').innerHTML = '';
  if ($('listaModalPreviewSabado')) $('listaModalPreviewSabado').innerHTML = '<div class="preview-sabado-carregando">Consultando a planilha...</div>';
  if ($('acoesModalPreviewSabado')) $('acoesModalPreviewSabado').hidden = true;

  try {
    const escala = await obterEscalaSabadoAdminPorStatus(dataISO, turno, status);
    previewEscalaSabadoAdmin = escala;
    renderizarPreviewSabado(escala);
    if ($('acoesModalPreviewSabado')) $('acoesModalPreviewSabado').hidden = false;
  } catch (erro) {
    if ($('tituloModalPreviewSabado')) $('tituloModalPreviewSabado').textContent = 'Não foi possível abrir';
    if ($('listaModalPreviewSabado')) $('listaModalPreviewSabado').innerHTML = `<div class="resultado-vazio">${escaparHTML(erro.message)}</div>`;
  }
}

async function editarEscalaSabadoDoPreview() {
  const escala = previewEscalaSabadoAdmin;
  if (!escala) return;
  const status = String(escala.status || '').toUpperCase();
  const confirmado = await confirmarAcaoApp({
    titulo: status === 'PUBLICADA' ? 'Editar escala publicada' : 'Editar rascunho',
    mensagem: status === 'PUBLICADA'
      ? `Carregar a publicação de ${formatarDataBR(escala.dataISO)} • ${turnoCanonico(escala.turno)} para edição?\n\nA publicação atual continuará visível para os colaboradores até você publicar uma nova versão.`
      : `Abrir o rascunho de ${formatarDataBR(escala.dataISO)} • ${turnoCanonico(escala.turno)} para edição?`,
    confirmarTexto: status === 'PUBLICADA' ? 'Criar edição em rascunho' : 'Editar rascunho',
    tipo: 'info'
  });
  if (!confirmado) return;
  if ($('dataEscalaSabado')) $('dataEscalaSabado').value = escala.dataISO;
  if ($('turnoEscalaSabado')) $('turnoEscalaSabado').value = turnoCanonico(escala.turno);
  statusEscalaSabadoPreferido = status;
  fecharPreviewSabado();
  carregarEditorEscalaSabado(true);
  $('dataEscalaSabado')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  toast(status === 'PUBLICADA' ? 'Escala publicada carregada para criar um novo rascunho.' : 'Rascunho aberto para edição.', 'info');
}

async function excluirRascunhoSabadoDoPreview() {
  const escala = previewEscalaSabadoAdmin;
  if (!escala || String(escala.status || '').toUpperCase() !== 'RASCUNHO') return;
  if (!navigator.onLine) {
    toast('Conecte-se à internet para excluir o rascunho da planilha com segurança.', 'aviso');
    return;
  }
  const confirmado = await confirmarAcaoApp({
    titulo: 'Excluir rascunho',
    mensagem: `Excluir o rascunho de ${formatarDataBR(escala.dataISO)} • ${turnoCanonico(escala.turno)}?\n\nA escala publicada, se existir, não será alterada.`,
    confirmarTexto: 'Excluir rascunho',
    tipo: 'perigo'
  });
  if (!confirmado) return;

  try {
    await apiPost({
      acao: 'removerEscalaSabado',
      senha: adminSenhaSessao,
      equipe: APP.equipe || CONFIG.equipe,
      dataISO: escala.dataISO,
      turno: escala.turno,
      status: 'RASCUNHO'
    }, { permitirFila: false });

    let removido = false;
    for (let tentativa = 1; tentativa <= 4; tentativa += 1) {
      if (tentativa > 1) await esperar(450 * tentativa);
      try {
        const resposta = await apiGet('listarEscalasSabado', { limite: 40 });
        const aindaExiste = (resposta?.itens || []).some(item =>
          item.dataISO === escala.dataISO
          && mesmoTurno(item.turno, escala.turno)
          && String(item.status || '').toUpperCase() === 'RASCUNHO'
        );
        if (!aindaExiste) { removido = true; break; }
      } catch (_) {}
    }
    if (!removido) throw new Error('A planilha ainda não confirmou a exclusão.');

    removerCacheEscalaSabado(escala.dataISO, escala.turno, 'RASCUNHO');
    fecharPreviewSabado();
    await carregarListaEscalasSabadoAdmin();
    toast('Rascunho excluído. A publicação anterior foi preservada.', 'ok');
  } catch (erro) {
    toast(`Não foi possível excluir o rascunho. ${erro.message}`, 'erro', 6500);
  }
}

async function publicarRascunhoSabadoDoPreview() {
  const escala = previewEscalaSabadoAdmin;
  if (!escala || String(escala.status || '').toUpperCase() !== 'RASCUNHO') return;
  if (!navigator.onLine) {
    toast('Conecte-se à internet para publicar a escala para os outros aparelhos.', 'aviso');
    return;
  }
  const conflitos = conflitosDosItensSabado(escala.itens || []);
  const confirmado = await confirmarAcaoApp({
    titulo: 'Publicar rascunho',
    mensagem: `Publicar a escala de ${formatarDataBR(escala.dataISO)} • ${turnoCanonico(escala.turno)} com ${escala.itens.length} colaborador(es)?${conflitos.length ? `\n\nAtenção: ${conflitos.length} possível(is) conflito(s) de posto.` : ''}`,
    confirmarTexto: 'Publicar escala',
    tipo: conflitos.length ? 'aviso' : 'info'
  });
  if (!confirmado) return;

  setLoadingBotao('btnPublicarPreviewSabado', true, 'Publicando...');
  const publicada = normalizarEscalaSabado({
    ...escala,
    status: 'PUBLICADA',
    itens: escala.itens.map(item => ({ ...item, status: 'PUBLICADA' })),
    atualizadoEm: new Date().toISOString()
  }, escala.dataISO, escala.turno);

  try {
    await apiPost({
      acao: 'salvarEscalaSabado',
      senha: adminSenhaSessao,
      equipe: APP.equipe || CONFIG.equipe,
      ...publicada
    }, { permitirFila: false });

    const verificacao = await verificarPublicacaoSabadoNoServidor(publicada, { tentativas: 6 });
    if (!verificacao.ok) throw new Error('A planilha ainda não confirmou a nova publicação.');

    salvarCacheEscalaSabado(verificacao.escala);
    removerCacheEscalaSabado(escala.dataISO, escala.turno, 'RASCUNHO');
    fecharPreviewSabado();
    await carregarListaEscalasSabadoAdmin();
    definirStatusEscalaSabado('PUBLICADA');
    msgAdmin(`Escala de sábado ${formatarDataBR(escala.dataISO)} publicada e sincronizada.`, 'ok');
    toast('Rascunho publicado. A nova escala já pode ser vista nos outros aparelhos.', 'ok', 6500);
  } catch (erro) {
    toast(`A publicação não foi confirmada. O rascunho foi preservado. ${erro.message}`, 'erro', 7000);
  } finally {
    setLoadingBotao('btnPublicarPreviewSabado', false);
  }
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

async function marcarPostosNecessariosSabado(marcar) {
  if (!exigirAdmin()) return;
  const confirmado = await confirmarAcaoApp({
    titulo: marcar ? 'Selecionar todos os postos' : 'Limpar postos necessários',
    mensagem: marcar
      ? 'Selecionar todos os postos cadastrados como necessários para esta escala de sábado?'
      : 'Remover todos os postos da lista de postos necessários deste rascunho?',
    confirmarTexto: marcar ? 'Selecionar todos' : 'Limpar postos',
    tipo: marcar ? 'info' : 'aviso'
  });
  if (!confirmado) return;
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
    const dataSabado = $('dataEscalaSabado')?.value || '';
    const valorDiaFixo = pessoa.dias[diaDoMesDaData(dataSabado) - 1] || '';
    const postoFixo = postoDoDia(valorDiaFixo);
    const situacaoFixa = situacaoNaData(pessoa.id, dataSabado);
    const sugestaoFixa = postoFixo ? ` • Fixo: ${postoFixo}${situacaoFixa ? ` • ${descricaoSituacao(situacaoFixa.tipo)}` : ''}` : '';
    return `<div class="linha-he ${selecionado ? '' : 'inativa'} ${situacaoFixa ? 'colaborador-indisponivel' : ''}" data-colaborador-id="${escaparHTML(pessoa.id)}">
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
  const preferirPublicada = statusEscalaSabadoPreferido === 'PUBLICADA';
  const incluirRascunhoEditor = !preferirPublicada;
  statusEscalaSabadoPreferido = '';
  const escalaCache = obterCacheEscalaSabado(dataISO, turno, { incluirRascunho: incluirRascunhoEditor });
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
      carregarEscalaSabado(dataISO, turno, { forcar, incluirRascunho: incluirRascunhoEditor, silencioso: false }),
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


function obterEstadoMontagemAutomaticaSabado() {
  const dataISO = $('dataEscalaSabado')?.value || '';
  const turno = turnoCanonico($('turnoEscalaSabado')?.value || '');
  let dataValida = false;
  let erroData = '';

  try {
    if (!dataISO) throw new Error('Escolha a data do sábado.');
    validarDataEscalaSabado();
    dataValida = true;
  } catch (erro) {
    erroData = erro?.message || 'Escolha uma data de sábado válida.';
  }

  const linhas = linhasEditorSabado();
  const selecionados = linhas
    .filter((linha) => linha.querySelector('.participante-he')?.checked)
    .map((linha) => colaboradorPorId(linha.dataset.colaboradorId || ''))
    .filter(Boolean);

  const disponiveis = selecionados.filter((pessoa) => {
    const situacao = dataValida ? situacaoNaData(pessoa.id, dataISO) : null;
    return !situacao || situacao.tipo === 'FOLGA';
  });

  const indisponiveisSelecionados = Math.max(0, selecionados.length - disponiveis.length);
  const postos = [...postosNecessariosSabadoEditor];
  const quantidadePostos = postos.length;
  const quantidadeDisponiveis = disponiveis.length;
  const quantidadeSelecionados = selecionados.length;
  const historicoOk = Boolean(historicoSabadoDisponivel);
  const turnoOk = Boolean(turno);
  const quantidadeSuficiente = quantidadePostos > 0 && quantidadeDisponiveis >= quantidadePostos;

  const pendencias = [];
  if (!dataValida) pendencias.push(erroData || 'Escolha uma data de sábado válida.');
  if (!turnoOk) pendencias.push('Escolha o turno.');
  if (!quantidadeSelecionados) pendencias.push('Marque pelo menos um colaborador disponível.');
  if (!quantidadePostos) pendencias.push('Selecione os postos necessários.');
  if (indisponiveisSelecionados) pendencias.push(`${indisponiveisSelecionados} colaborador(es) marcado(s) está(ão) indisponível(is) nesta data.`);
  if (quantidadePostos && quantidadeDisponiveis && !quantidadeSuficiente) {
    pendencias.push(`Há ${quantidadePostos} posto(s), mas somente ${quantidadeDisponiveis} colaborador(es) disponível(is).`);
  }
  if (!historicoOk) pendencias.push('O histórico de sábados ainda não foi carregado.');

  return {
    dataISO,
    turno,
    dataValida,
    turnoOk,
    historicoOk,
    quantidadePostos,
    quantidadeDisponiveis,
    quantidadeSelecionados,
    indisponiveisSelecionados,
    quantidadeSuficiente,
    pendencias,
    pronto: pendencias.length === 0
  };
}

function atualizarEstadoMontagemAutomaticaSabado() {
  const campo = $('statusMontagemAutomaticaSabado');
  const botao = $('btnMontarAutomaticamenteSabado');
  if (!campo && !botao) return;

  const estado = obterEstadoMontagemAutomaticaSabado();
  const item = (ok, rotulo, detalhe) => `
    <div class="status-montagem-item ${ok ? 'ok' : 'pendente'}">
      <span class="status-montagem-icone" aria-hidden="true">${ok ? '✓' : '!'}</span>
      <span><strong>${escaparHTML(rotulo)}</strong><small>${escaparHTML(detalhe)}</small></span>
    </div>`;

  const dataTexto = estado.dataValida ? formatarDataBR(estado.dataISO) : 'Escolha uma data de sábado';
  const turnoTexto = estado.turnoOk ? estado.turno : 'Escolha o turno';
  const colaboradoresOk = estado.quantidadeDisponiveis > 0 && estado.indisponiveisSelecionados === 0;
  const postosOk = estado.quantidadePostos > 0;
  const equilibrioOk = estado.quantidadePostos > 0 && estado.quantidadeDisponiveis > 0 && estado.quantidadeSuficiente;

  if (campo) {
    campo.classList.toggle('pronto', estado.pronto);
    campo.classList.toggle('pendente', !estado.pronto);
    campo.innerHTML = `
      <div class="status-montagem-titulo">${estado.pronto ? 'Pronto para montar automaticamente' : 'Complete os itens abaixo'}</div>
      <div class="status-montagem-grade">
        ${item(estado.dataValida && estado.turnoOk, '1. Data e turno', `${dataTexto} • ${turnoTexto}`)}
        ${item(colaboradoresOk, '2. Colaboradores disponíveis', estado.quantidadeSelecionados
          ? `${estado.quantidadeDisponiveis} disponível(is) selecionado(s)${estado.indisponiveisSelecionados ? ` • ${estado.indisponiveisSelecionados} indisponível(is)` : ''}`
          : 'Marque quem poderá trabalhar neste sábado')}
        ${item(postosOk, '3. Postos necessários', postosOk ? `${estado.quantidadePostos} posto(s) selecionado(s)` : 'Selecione os postos que precisam ser ocupados')}
        ${item(estado.historicoOk, '4. Histórico HE', estado.historicoOk ? 'Carregado e pronto para balanceamento' : 'Aguardando dados da planilha')}
        ${item(equilibrioOk, '5. Capacidade', estado.quantidadePostos && estado.quantidadeDisponiveis
          ? (estado.quantidadeSuficiente
            ? `${estado.quantidadeDisponiveis} colaborador(es) para ${estado.quantidadePostos} posto(s)`
            : `Faltam ${estado.quantidadePostos - estado.quantidadeDisponiveis} colaborador(es)`)
          : 'Defina colaboradores e postos')}
      </div>
      ${estado.pronto
        ? '<div class="status-montagem-rodape ok">Tudo certo. Toque em “Montar automaticamente”.</div>'
        : `<div class="status-montagem-rodape aviso">${escaparHTML(estado.pendencias[0] || 'Complete os dados acima.')}</div>`}
    `;
  }

  if (botao) {
    botao.classList.toggle('bloqueado-orientacao', !estado.pronto);
    botao.setAttribute('aria-disabled', estado.pronto ? 'false' : 'true');
    botao.title = estado.pronto ? 'Montar distribuição automática' : (estado.pendencias[0] || 'Complete os dados necessários');
  }
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
  atualizarEstadoMontagemAutomaticaSabado();
}

async function marcarTodosSabado(marcar) {
  if (!exigirAdmin()) return;
  const confirmado = await confirmarAcaoApp({
    titulo: marcar ? 'Marcar colaboradores disponíveis' : 'Limpar seleção',
    mensagem: marcar
      ? 'Marcar todos os colaboradores disponíveis neste turno? Pessoas indisponíveis por situação serão mantidas fora da seleção.'
      : 'Limpar toda a seleção atual de colaboradores deste rascunho?',
    confirmarTexto: marcar ? 'Marcar disponíveis' : 'Limpar seleção',
    tipo: marcar ? 'info' : 'aviso'
  });
  if (!confirmado) return;
  const dataISO = $('dataEscalaSabado')?.value || '';
  linhasEditorSabado().forEach((linha) => {
    const campo = linha.querySelector('.participante-he');
    const pessoa = colaboradorPorId(linha.dataset.colaboradorId || '');
    const situacao = pessoa ? situacaoNaData(pessoa.id, dataISO) : null;
    const indisponivel = Boolean(situacao && situacao.tipo !== 'FOLGA');
    if (campo) campo.checked = Boolean(marcar) && !indisponivel;
  });
  atualizarResumoSabado();
}

async function preencherPostosEscalaFixaSabado() {
  if (!exigirAdmin()) return;
  let dataISO;
  try { dataISO = validarDataEscalaSabado(); } catch (erro) { msgAdmin(erro.message, 'erro'); return; }
  const dia = diaDoMesDaData(dataISO);
  const turno = $('turnoEscalaSabado')?.value || CONFIG.turno;
  const postos = new Set();
  pessoasEscalaAtivas().filter((pessoa) => mesmoTurno(pessoa.turno, turno)).forEach((pessoa) => {
    const posto = postoDoDia(pessoa?.dias[dia - 1] || '');
    if (posto) postos.add(posto);
  });
  const confirmado = await confirmarAcaoApp({
    titulo: 'Carregar postos da escala fixa',
    mensagem: `Usar os ${postos.size} posto(s) da escala fixa do dia ${String(dia).padStart(2, '0')} como postos necessários para ${formatarDataBR(dataISO)} • ${turno}?\n\nA seleção atual de postos necessários será substituída.`,
    confirmarTexto: 'Carregar postos',
    tipo: 'aviso'
  });
  if (!confirmado) return;
  postosNecessariosSabadoEditor = postos;
  renderizarPostosNecessariosSabado(escalaSabadoEditor);
  atualizarResumoSabado();
  toast(`${postos.size} posto(s) necessário(s) carregado(s) com base na escala fixa do dia ${String(dia).padStart(2, '0')}.`, 'info');
}

function pontuacaoCandidatoSabado(pessoa, posto, dataISO, linha) {
  const estatistica = estatisticaDoColaboradorSabado(pessoa.id);
  const postoFixo = postoDoDia(pessoa.dias[diaDoMesDaData(dataISO) - 1] || '');
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

async function montarEscalaSabadoAutomaticamente() {
  if (!exigirAdmin()) return;

  atualizarPostosNecessariosSabado();
  const estado = obterEstadoMontagemAutomaticaSabado();
  if (!estado.pronto) {
    const passos = [];
    if (!estado.dataValida) passos.push('• Escolha uma data válida de sábado.');
    if (!estado.turnoOk) passos.push('• Escolha o turno.');
    if (!estado.quantidadeSelecionados) passos.push('• Marque os colaboradores disponíveis para trabalhar.');
    if (!estado.quantidadePostos) passos.push('• Selecione os postos que precisam ser ocupados.');
    if (estado.indisponiveisSelecionados) passos.push(`• Desmarque ${estado.indisponiveisSelecionados} colaborador(es) indisponível(is) nesta data.`);
    if (estado.quantidadePostos && estado.quantidadeDisponiveis && !estado.quantidadeSuficiente) {
      passos.push(`• Selecione mais ${estado.quantidadePostos - estado.quantidadeDisponiveis} colaborador(es) ou reduza a quantidade de postos.`);
    }
    if (!estado.historicoOk) passos.push('• Aguarde o histórico HE carregar. Se necessário, use “Atualizar da planilha”.');

    await mostrarAvisoApp({
      titulo: 'Montagem automática',
      mensagem: `Antes de montar a escala, complete o que está faltando:\n\n${passos.join('\n')}\n\nOrdem recomendada: 1. Data e turno → 2. Colaboradores → 3. Postos necessários → 4. Montar automaticamente.`,
      botaoTexto: 'Entendi',
      tipo: 'aviso'
    });
    atualizarEstadoMontagemAutomaticaSabado();
    return;
  }

  const dataISO = estado.dataISO;
  const postos = [...postosNecessariosSabadoEditor];
  const linhas = linhasEditorSabado();
  const disponiveis = linhas.filter((linha) => linha.querySelector('.participante-he')?.checked)
    .map((linha) => ({ linha, pessoa: colaboradorPorId(linha.dataset.colaboradorId || '') }))
    .filter((item) => item.pessoa)
    .filter((item) => {
      const situacao = situacaoNaData(item.pessoa.id, dataISO);
      return !situacao || situacao.tipo === 'FOLGA';
    });

  const candidatosRestantes = [...disponiveis];
  const postosOrdenados = postos.slice().sort((a, b) => {
    const correspondenciasA = candidatosRestantes.filter(({ pessoa }) => postoDoDia(pessoa.dias[diaDoMesDaData(dataISO) - 1] || '') === a).length;
    const correspondenciasB = candidatosRestantes.filter(({ pessoa }) => postoDoDia(pessoa.dias[diaDoMesDaData(dataISO) - 1] || '') === b).length;
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

  const confirmado = await confirmarAcaoApp({
    titulo: 'Montar escala automaticamente',
    mensagem: `Aplicar a distribuição automática para ${atribuicoes.length} colaborador(es) em ${formatarDataBR(dataISO)}?\n\nA distribuição atual do editor será substituída. Depois você ainda poderá revisar antes de salvar ou publicar.`,
    confirmarTexto: 'Aplicar distribuição',
    tipo: 'aviso'
  });
  if (!confirmado) return;

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
    const confirmado = await confirmarAcaoApp({
      titulo: 'Copiar sábado anterior',
      mensagem: `Copiar a escala de ${formatarDataBR(resposta.dataOrigem)} para o editor de ${formatarDataBR(dataISO)} • ${turno}?\n\nA montagem atual do editor será substituída, mas nada será gravado na planilha até você salvar o rascunho ou publicar.`,
      confirmarTexto: 'Copiar para o editor',
      tipo: 'aviso'
    });
    if (!confirmado) return;
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
  const statusFinal = String(status).toUpperCase() === 'PUBLICADA' ? 'PUBLICADA' : 'RASCUNHO';
  const confirmado = await confirmarAcaoApp({
    titulo: statusFinal === 'PUBLICADA' ? 'Publicar escala de sábado' : 'Salvar rascunho de sábado',
    mensagem: `${statusFinal === 'PUBLICADA' ? 'Publicar' : 'Salvar como rascunho'} a escala de ${formatarDataBR(dataISO)} • ${turno} com ${itens.length} colaborador(es)?${conflitos.length ? `\n\nATENÇÃO: foram encontrados ${conflitos.length} possível(is) conflito(s) de posto.` : ''}${statusFinal === 'PUBLICADA' ? '\n\nDepois de confirmada na planilha, esta versão ficará visível nos outros aparelhos.' : '\n\nO rascunho não ficará visível aos colaboradores até ser publicado.'}`,
    confirmarTexto: statusFinal === 'PUBLICADA' ? 'Publicar escala' : 'Salvar rascunho',
    tipo: statusFinal === 'PUBLICADA' || conflitos.length ? 'aviso' : 'info'
  });
  if (!confirmado) return;

  const botao = statusFinal === 'PUBLICADA' ? 'btnPublicarSabado' : 'btnSalvarRascunhoSabado';
  setLoadingBotao(botao, true, statusFinal === 'PUBLICADA' ? 'Publicando...' : 'Salvando...');

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

  const payload = {
    acao: 'salvarEscalaSabado',
    senha: adminSenhaSessao,
    equipe: APP.equipe || CONFIG.equipe,
    ...escala
  };

  try {
    // Salva primeiro no aparelho para não perder o trabalho.
    salvarCacheEscalaSabado(escala);
    escalaSabadoEditor = normalizarEscalaSabado(escala, dataISO, turno);
    definirStatusEscalaSabado(statusFinal);

    if (statusFinal !== 'PUBLICADA') {
      if (!navigator.onLine) {
        garantirPayloadNaFila(payload);
        msgAdmin(`Rascunho de sábado ${formatarDataBR(dataISO)} salvo neste aparelho. A sincronização está pendente.`, 'aviso');
        toast('Rascunho salvo; sincronização pendente.', 'aviso');
        return;
      }
      await apiPost(payload, { permitirFila: false });
      const verificacaoRascunho = await verificarEscalaSabadoNoServidor(escala, 'RASCUNHO', { tentativas: 4 });
      if (verificacaoRascunho.ok) {
        escalaSabadoEditor = normalizarEscalaSabado(verificacaoRascunho.escala, dataISO, turno);
        definirStatusEscalaSabado('RASCUNHO');
        msgAdmin(`Rascunho de sábado ${formatarDataBR(dataISO)} salvo e confirmado na planilha. A publicação anterior, se existir, continua visível para os colaboradores.`, 'ok');
        toast('Rascunho salvo e confirmado.', 'ok');
      } else {
        garantirPayloadNaFila(payload);
        msgAdmin(`Rascunho salvo neste aparelho, mas a planilha ainda não confirmou. A publicação anterior não foi alterada.`, 'aviso');
        toast('Rascunho com sincronização pendente.', 'aviso');
      }
      carregarListaEscalasSabadoAdmin();
      return;
    }

    if (!navigator.onLine) {
      garantirPayloadNaFila(payload);
      msgAdmin('Escala salva neste aparelho, mas ainda NÃO está disponível nos outros celulares porque não há conexão.', 'aviso');
      toast('Publicação compartilhada pendente.', 'aviso', 6500);
      return;
    }

    await apiPost(payload, { permitirFila: false });
    msgAdmin('Escala salva neste aparelho. Confirmando a publicação compartilhada...', 'info');

    const verificacao = await verificarPublicacaoSabadoNoServidor(escala, { tentativas: 6 });
    if (verificacao.ok) {
      escalaSabadoEditor = normalizarEscalaSabado(verificacao.escala, dataISO, turno);
      definirStatusEscalaSabado('PUBLICADA');
      msgAdmin(`Escala de sábado ${formatarDataBR(dataISO)} PUBLICADA E SINCRONIZADA. Já pode ser vista nos outros celulares.`, 'ok');
      toast('Escala disponível para todos os colaboradores.', 'ok', 6500);
      carregarListaEscalasSabadoAdmin();
    } else {
      garantirPayloadNaFila(payload);
      msgAdmin('A escala ficou salva neste aparelho, mas a planilha não confirmou a publicação. Ela ainda pode não aparecer nos outros celulares. O aplicativo tentará sincronizar novamente.', 'aviso');
      toast('Publicação compartilhada ainda não confirmada.', 'aviso', 7000);
    }
  } catch (erro) {
    if (statusFinal === 'PUBLICADA') garantirPayloadNaFila(payload);
    msgAdmin(`Escala salva neste aparelho, mas a sincronização compartilhada falhou: ${erro.message}`, 'erro');
    toast('Escala ainda não está confirmada para os outros celulares.', 'aviso', 7000);
  } finally {
    setLoadingBotao(botao, false);
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
  renderizarPainelSituacoesAdmin();
  renderizarPainelCoberturasAdmin();
  atualizarStatusAdmin();
  atualizarContadorVagasAbertasAdmin();
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
    registroServiceWorker = await navigator.serviceWorker.register('./service-worker.js', { updateViaCache: 'none' });
    await registroServiceWorker.update().catch(() => null);
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

function verificarViradaDeDia() {
  const hoje = dataISOHoje();
  if (hoje === dataOperacionalAtual) return;
  dataOperacionalAtual = hoje;
  if ($('cargaData') && !$('cargaData').value) $('cargaData').value = hoje;
  atualizarInterfaceCompleta({ preservarAdmin: true });
  if (document.querySelector('.aba-hoje')?.classList.contains('ativa')) mostrarHoje();
  // Situações finalizadas permanecem no histórico, mas deixam de gerar destaque amarelo.
  renderizarPainelSituacoesAdmin();
}

function iniciarMonitorViradaDia() {
  if (temporizadorViradaDia) clearInterval(temporizadorViradaDia);
  dataOperacionalAtual = dataISOHoje();
  temporizadorViradaDia = setInterval(verificarViradaDeDia, 60000);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) verificarViradaDeDia();
  });
}

/* =========================
   Inicialização
   ========================= */
async function iniciar() {
  if ($('versaoApp')) $('versaoApp').textContent = `Versão ${APP.versao || '2.6.6'}`;
  atualizarStatusConexao();
  atualizarFilaOfflineInfo();
  migrarCacheEscalaFixa();
  mesSelecionado = CHAVE_ESCALA_FIXA;
  if ($('cargaData')) $('cargaData').value = dataISOHoje();

  // Abre imediatamente com o último conteúdo salvo no aparelho.
  const cacheInicial = carregarCacheMes(CHAVE_ESCALA_FIXA);
  const postosRecuperados = cacheInicial?.escala?.length
    ? aplicarDados(cacheInicial, 'cache local')
    : aplicarDados(dadosPadrao(), 'dados iniciais');
  if (postosRecuperados) salvarCacheMes(CHAVE_ESCALA_FIXA);

  atualizarInterfaceCompleta();
  restaurarRascunhoCarga();
  ocultarCarregamentoInicial();
  mostrarHoje();
  registrarServiceWorker();
  iniciarMonitorViradaDia();
  instalarSelectsEmModal();
  processarFilaOffline();

  // A atualização do Google Sheets acontece em segundo plano e não bloqueia a abertura.
  carregarEscalaFixa({ forcar: true, silencioso: true }).then(() => {
    if (document.querySelector('.aba-hoje')?.classList.contains('ativa')) mostrarHoje();
  });
}

window.addEventListener('online', () => {
  atualizarStatusConexao();
  atualizarStatusAdmin();
  toast('Conexão restabelecida. Enviando pendências...', 'ok');
});
window.addEventListener('offline', () => {
  atualizarStatusConexao();
  atualizarStatusAdmin();
  toast('Sem internet. Os próximos lançamentos ficarão salvos no aparelho.', 'aviso', 5500);
});
window.addEventListener('load', iniciar);
window.addEventListener('keydown', (evento) => {
  if (evento.key !== 'Escape') return;
  fecharModalConsulta();
  fecharModalSalvamento();
  fecharModalAtualizacao();
  fecharModalCrudAdmin();
  fecharModalSituacaoEscala();
  fecharModalSelecaoApp();
  resolverConfirmacaoApp(false);
});

document.addEventListener('input', (evento) => {
  if (['cargaTurnoFiltro', 'cargaColaborador', 'cargaData', 'cargaRegistro', 'cargaQuantidade'].includes(evento.target?.id)) salvarRascunhoCarga();
});

document.addEventListener('click', (evento) => {
  if (evento.target === $('modalConsulta')) fecharModalConsulta();
  if (evento.target === $('modalSalvoPlanilha')) fecharModalSalvamento();
  if (evento.target === $('modalAtualizacao')) fecharModalAtualizacao();
  if (evento.target === $('modalCrudAdmin')) fecharModalCrudAdmin();
  if (evento.target === $('modalSituacaoEscala')) fecharModalSituacaoEscala();
  if (evento.target === $('modalSelecaoApp')) fecharModalSelecaoApp();
  if (evento.target === $('modalConfirmacaoApp')) resolverConfirmacaoApp(false);
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
  abrirCrudAdmin,
  abrirRetiradaEquipe,
  abrirPreencherVaga,
  abrirAssumirPosicao,
  abrirRealocacaoColaborador,
  abrirTrocaPosicoes,
  trocarPosicoesPeloModal,
  definirDestinoOcupanteAssumir,
  assumirPosicaoPeloModal,
  preencherVagaPeloModal,
  fecharModalCrudAdmin,
  abrirModalSituacaoEscala,
  fecharModalSituacaoEscala,
  renderizarColaboradoresSituacao,
  selecionarColaboradorSituacao,
  renderizarFiltroTurnoSituacao,
  aoTrocarTurnoSituacao,
  selecionarSituacaoEscala,
  ajustarDatasSituacao,
  aplicarSituacaoEscala,
  removerSituacaoEscala,
  aoAlterarPostoDia,
  renderizarListaCrud,
  salvarCrudModal,
  abrirSelectComoModal,
  filtrarModalSelecao,
  fecharModalSelecaoApp,
  alternarModuloAdmin,
  fecharTodosModulosAdmin,
  voltarMenuAdmin,
  resolverConfirmacaoApp,
  recarregarEscala,
  carregarEscala,
  salvarEscala,
  sincronizarDadosComPlanilha,
  desfazerAcoesAdmin,
  carregarEditorEscalaSabado,
  copiarSabadoAnterior,
  preencherPostosEscalaFixaSabado,
  montarEscalaSabadoAutomaticamente,
  atualizarPostosNecessariosSabado,
  marcarPostosNecessariosSabado,
  marcarTodosSabado,
  atualizarResumoSabado,
  salvarEscalaSabado,
  removerSituacaoPorId,
  definirTipoCobertura,
  renderizarPreviaCoberturaAdmin,
  registrarCobertura,
  removerCobertura,
  ajustarDatasCobertura,
  carregarListaEscalasSabadoAdmin,
  abrirEscalaSabadoAdmin,
  confirmarDadosServidor,
  aplicarAtualizacaoPWA,
  fecharModalAtualizacao
});
