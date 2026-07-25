const $ = (id) => document.getElementById(id);
const SENHA_ADMIN = '4321';
const STORAGE_KEY = 'escalaEquipe9132DadosV7';
const STORAGE_KEYS_ANTERIORES = ['escalaEquipe9132DadosV6', 'escalaEquipe9132DadosV5', 'escalaEquipe9132DadosV4'];
const REGISTROS_CARGAS_KEY = 'escalaEquipe9132RegistrosCargasV1';
const ULTIMO_ENVIO_CARGAS_KEY = 'escalaEquipe9132UltimoEnvioCargasV1';
const ASSINATURA_ENVIO_CARGAS_KEY = 'escalaEquipe9132AssinaturaEnvioCargasV1';
const VERSAO_ESCALA_SEGUNDO_TURNO = '2023-renato-v1';

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
    'Interni': 'INT-89',
    'Int-89': 'INT-89',
    'FPT-X': 'FPT-CX',
    'FPT/CX': 'FPT-CX',
    'FPT CX': 'FPT-CX'
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

function aplicarEscalaSegundoTurnoPadrao() {
  if (typeof ESCALA_SEGUNDO_TURNO_2023 === 'undefined' || !Array.isArray(ESCALA_SEGUNDO_TURNO_2023)) return;
  const demaisTurnos = ESCALA.filter(pessoa => pessoa.turno !== '2º Turno');
  const segundoTurno = ESCALA_SEGUNDO_TURNO_2023.map(pessoa => ({
    nome: pessoa.nome,
    turno: '2º Turno',
    dias: Array.isArray(pessoa.dias) ? [...pessoa.dias] : Array(31).fill('Pens.')
  }));
  ESCALA.splice(0, ESCALA.length, ...demaisTurnos, ...segundoTurno);
}

function carregarDadosSalvos() {
  let salvo = localStorage.getItem(STORAGE_KEY);
  let versaoSegundoTurnoSalva = '';
  if (!salvo) {
    const chaveAntiga = STORAGE_KEYS_ANTERIORES.find(chave => localStorage.getItem(chave));
    if (chaveAntiga) salvo = localStorage.getItem(chaveAntiga);
  }

  if (!salvo) {
    corrigirDadosAntigos();
    aplicarEscalaSegundoTurnoPadrao();
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
      versaoSegundoTurnoSalva = dados.versaoSegundoTurno || '';
    }
  } catch (erro) {
    console.warn('Não foi possível carregar dados salvos.', erro);
  }

  corrigirDadosAntigos();
  if (versaoSegundoTurnoSalva !== VERSAO_ESCALA_SEGUNDO_TURNO) aplicarEscalaSegundoTurnoPadrao();
  normalizarEscala();
  salvarDadosLocais();
}

function salvarDadosLocais() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    legenda: LEGENDA,
    escala: ESCALA,
    atualizadoEm: new Date().toISOString(),
    versaoSegundoTurno: VERSAO_ESCALA_SEGUNDO_TURNO
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
  mostrarHoje();
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

function trocarTurnoConsulta() {
  atualizarValorConsulta();
  mostrarHoje();
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
  if ($('excluirPosto')) preencherSelectExcluirPosto();
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

function preencherSelectExcluirPosto() {
  const campo = $('excluirPosto');
  if (!campo) return;
  const opcoes = postosDisponiveis()
    .map(posto => `<option value="${posto}">${posto} - ${postoDescricao(posto)}</option>`)
    .join('');
  campo.innerHTML = opcoes || '<option value="">Nenhum posto cadastrado</option>';
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

function abrirModalConsulta(botao = null) {
  abrirAba('resultado', botao || document.querySelector('.aba-consulta'));
  atualizarValorConsulta();
  const modal = $('modalConsulta');
  if (modal) modal.hidden = false;
  setTimeout(() => $('tipoConsulta')?.focus(), 50);
}

function fecharModalConsulta() {
  const modal = $('modalConsulta');
  if (modal) modal.hidden = true;
}

function executarConsultaModal() {
  consultarUnico();
  fecharModalConsulta();
}

function mostrarModalSalvamento(info = {}) {
  const modal = $('modalSalvoPlanilha');
  const mensagem = $('modalSalvoMensagem');
  if (mensagem) {
    const protocolo = info.protocolo ? ` Protocolo: ${info.protocolo}.` : '';
    const horario = info.horaEnvio ? ` Horário: ${info.horaEnvio}.` : '';
    mensagem.textContent = `Registro enviado com sucesso para a planilha.${protocolo}${horario}`;
  }
  if (modal) modal.hidden = false;
}

function fecharModalSalvamento() {
  const modal = $('modalSalvoPlanilha');
  if (modal) modal.hidden = true;
  $('cargaColaborador')?.focus();
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
  prepararModuloCargas();
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

function excluirPosto() {
  const campo = $('excluirPosto');
  const codigo = campo?.value || '';

  if (!codigo) {
    msgAdmin('Selecione um posto para excluir.', 'erro');
    return;
  }

  const usadoNaEscala = ESCALA.some(pessoa => Array.isArray(pessoa.dias) && pessoa.dias.includes(codigo));
  const avisoUso = usadoNaEscala ? '\n\nAtenção: esse posto está usado na escala. Ao excluir, ele será removido dos dias onde aparece.' : '';
  const confirmar = confirm(`Deseja excluir o posto ${codigo}?${avisoUso}`);
  if (!confirmar) return;

  delete LEGENDA[codigo];
  ESCALA.forEach(pessoa => {
    if (Array.isArray(pessoa.dias)) {
      pessoa.dias = pessoa.dias.map(posto => posto === codigo ? '' : posto);
    }
  });

  atualizarAppAposEdicao();
  carregarEscalaMensal();
  msgAdmin(`Posto ${codigo} excluído.`);
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
  return postosDisponiveis()
    .map(posto => `${posto} - ${postoDescricao(posto)}`)
    .filter(Boolean);
}

function registrosCargasSalvos() {
  try { return JSON.parse(localStorage.getItem(REGISTROS_CARGAS_KEY) || '{}'); } catch { return {}; }
}

function salvarRegistroColaboradorCargas(id, registro) {
  if (!id || !registro) return;
  const registros = registrosCargasSalvos();
  registros[id] = registro;
  localStorage.setItem(REGISTROS_CARGAS_KEY, JSON.stringify(registros));
}

function preencherRegistroSalvoCargas(id) {
  const campo = $('cargaRegistro');
  if (!campo || !id) return;
  const registros = registrosCargasSalvos();
  if (!campo.value && registros[id]) campo.value = registros[id];
}

function gerarProtocoloCarga(dados) {
  const agora = new Date();
  const dataBase = (dados.data || '').replace(/\D/g, '') || dataISOHoje().replace(/\D/g, '');
  const hora = String(agora.getHours()).padStart(2, '0') + String(agora.getMinutes()).padStart(2, '0') + String(agora.getSeconds()).padStart(2, '0');
  const registro = String(dados.registro || '').replace(/\D/g, '').slice(-4) || '0000';
  return `FC-${dataBase}-${hora}-${registro}`;
}

function assinaturaLancamentoCarga(dados) {
  return [dados.data, dados.colaborador, dados.registro, dados.turno, dados.setorPosto, dados.quantidade].join('|');
}

function atualizarStatusEnvioCargas(info = null) {
  const el = $('statusEnvioCargas');
  if (!el) return;
  const dados = info || (() => {
    try { return JSON.parse(localStorage.getItem(ULTIMO_ENVIO_CARGAS_KEY) || 'null'); } catch { return null; }
  })();
  if (!dados) {
    el.innerHTML = '<span>Último envio</span><strong>Nenhum envio realizado neste aparelho</strong>';
    return;
  }
  el.innerHTML = `<span>Último envio</span><strong>${dados.protocolo} • ${dados.dataEnvio} às ${dados.horaEnvio}</strong>`;
}

function colaboradorNoDiaPorId(id, dia = diaAtualDoMes()) {
  const pessoa = colaboradorPorId(id);
  if (!pessoa) return null;
  const posto = pessoa.dias[Math.max(0, Math.min(30, dia - 1))] || '';
  return {
    pessoa,
    data: dataISOHoje(),
    dataBR: formatarDataBR(dataISOHoje()),
    turno: pessoa.turno || '',
    posto,
    setor: posto ? `${posto} - ${postoDescricao(posto)}` : 'Sem posto definido'
  };
}

function prepararModuloCargas() {
  const dataHoje = dataISOHoje();
  if ($('cargaData')) $('cargaData').value = dataHoje;
  const opcoesColaboradores = ESCALA
    .slice()
    .sort((a,b) => ((a.turno || '') + (a.nome || '')).localeCompare((b.turno || '') + (b.nome || ''), 'pt-BR'))
    .map(p => `<option value="${p.id}">${p.nome} • ${p.turno}</option>`)
    .join('');

  if ($('cargaColaborador')) {
    const valorAtual = $('cargaColaborador').value;
    $('cargaColaborador').innerHTML = '<option value="">Selecione o colaborador</option>' + opcoesColaboradores;
    if (valorAtual && colaboradorPorId(valorAtual)) $('cargaColaborador').value = valorAtual;
  }

  preencherDadosCargaPorColaborador(false);
  atualizarStatusEnvioCargas();
}

function preencherDadosCargaPorColaborador(resetarSetorManual = false) {
  const id = $('cargaColaborador')?.value || '';
  const dados = colaboradorNoDiaPorId(id);

  if (resetarSetorManual) {
    if ($('cargaSetor')) $('cargaSetor').dataset.manual = 'false';
    if ($('editorSetorCarga')) $('editorSetorCarga').hidden = true;
  }

  if (!dados) {
    if ($('cargaTurno')) $('cargaTurno').value = '';
    if ($('cargaSetor')) {
      $('cargaSetor').value = '';
      $('cargaSetor').dataset.auto = '';
      $('cargaSetor').dataset.manual = 'false';
    }
    if ($('cargaTurnoInfo')) $('cargaTurnoInfo').textContent = 'Selecione um colaborador';
    if ($('cargaSetorInfo')) $('cargaSetorInfo').textContent = 'Selecione um colaborador';
    if ($('editorSetorCarga')) $('editorSetorCarga').hidden = true;
    return;
  }

  if ($('cargaTurno')) $('cargaTurno').value = dados.turno;
  if ($('cargaTurnoInfo')) $('cargaTurnoInfo').textContent = dados.turno || 'Não informado';

  const setorInput = $('cargaSetor');
  const setorManualAtivo = setorInput?.dataset.manual === 'true';
  if (setorInput) setorInput.dataset.auto = dados.setor || '';

  if (!setorManualAtivo) {
    if (setorInput) setorInput.value = dados.setor || '';
    if ($('cargaSetorInfo')) $('cargaSetorInfo').textContent = dados.setor || 'Sem posto definido';
  }

  preencherOpcoesSetorManualCarga();
  preencherRegistroSalvoCargas(id);
}

function preencherOpcoesSetorManualCarga() {
  const select = $('cargaSetorManual');
  if (!select) return;

  const setorAtual = $('cargaSetor')?.value || '';
  const opcoes = setoresCargasDisponiveis();
  select.innerHTML = '<option value="">Selecione o setor/posto</option>' + opcoes
    .map(setor => `<option value="${setor}">${setor}</option>`)
    .join('');
  if (setorAtual && opcoes.includes(setorAtual)) select.value = setorAtual;
}

function abrirEditorSetorCarga() {
  const pessoa = colaboradorPorId($('cargaColaborador')?.value || '');
  if (!pessoa) {
    msgCargas('Selecione o colaborador antes de editar o setor/posto.', 'erro');
    return;
  }
  preencherOpcoesSetorManualCarga();
  if ($('editorSetorCarga')) $('editorSetorCarga').hidden = false;
}

function aplicarSetorManualCarga() {
  const setorEscolhido = $('cargaSetorManual')?.value || '';
  if (!setorEscolhido) {
    msgCargas('Selecione o setor/posto que será lançado.', 'erro');
    return;
  }
  if ($('cargaSetor')) {
    $('cargaSetor').value = setorEscolhido;
    $('cargaSetor').dataset.manual = 'true';
  }
  if ($('cargaSetorInfo')) $('cargaSetorInfo').textContent = setorEscolhido + ' (editado)';
  if ($('editorSetorCarga')) $('editorSetorCarga').hidden = true;
  msgCargas('Setor/posto alterado para este lançamento.');
}

function restaurarSetorAutomaticoCarga() {
  const setorInput = $('cargaSetor');
  const setorAuto = setorInput?.dataset.auto || '';
  if (setorInput) {
    setorInput.value = setorAuto;
    setorInput.dataset.manual = 'false';
  }
  if ($('cargaSetorInfo')) $('cargaSetorInfo').textContent = setorAuto || 'Sem posto definido';
  if ($('editorSetorCarga')) $('editorSetorCarga').hidden = true;
  msgCargas('Setor/posto automático restaurado.');
}

function msgCargas(texto, tipo = 'ok') {
  const el = $('msgCargas');
  if (!el) return;
  el.textContent = texto;
  el.className = `msg ${tipo}`;
  setTimeout(() => { el.textContent = ''; }, 4500);
}

const GOOGLE_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbzK3qWWsEa1n3mkS1ADmVcw2LBlrJ3ZyGjFzNTUQpePtnxAM8WNgaxj1e5_a9cOvtWZgg/exec';

function dadosLancamentoCargaAtual(acao = 'enviar') {
  preencherDadosCargaPorColaborador();

  const pessoa = colaboradorPorId($('cargaColaborador')?.value || '');
  const data = $('cargaData')?.value || '';
  const turno = $('cargaTurno')?.value || '';
  const setor = $('cargaSetor')?.value || '';
  const registro = ($('cargaRegistro')?.value || '').trim();
  const quantidade = Number($('cargaQuantidade')?.value || 0);

  if (!pessoa) {
    msgCargas(`Selecione o colaborador antes de ${acao}.`, 'erro');
    return null;
  }

  if (!data) {
    msgCargas(`Informe a data antes de ${acao}.`, 'erro');
    return null;
  }

  if (!registro) {
    msgCargas(`Informe o registro antes de ${acao}.`, 'erro');
    return null;
  }

  if (!quantidade || quantidade < 0) {
    msgCargas(`Informe a quantidade de cargas liberadas antes de ${acao}.`, 'erro');
    return null;
  }

  return {
    data: formatarDataBR(data),
    dataISO: data,
    colaborador: pessoa.nome,
    registro,
    turno: turno || 'Não informado',
    setorPosto: setor || 'Sem posto definido',
    quantidade
  };
}

async function salvarPlanilhaCargas() {
  const dados = dadosLancamentoCargaAtual('salvar na planilha');
  if (!dados) return;

  const assinatura = assinaturaLancamentoCarga(dados);
  const ultimaAssinatura = localStorage.getItem(ASSINATURA_ENVIO_CARGAS_KEY);
  if (ultimaAssinatura === assinatura) {
    const reenviar = confirm('Este lançamento parece já ter sido enviado para a planilha. Deseja enviar novamente?');
    if (!reenviar) return;
  }

  const botao = document.querySelector('.btn.sheets');
  if (botao) {
    botao.disabled = true;
    botao.textContent = 'Salvando...';
  }

  const agora = new Date();
  const dataEnvio = formatarDataBR(agora.toISOString().slice(0, 10));
  const horaEnvio = String(agora.getHours()).padStart(2, '0') + ':' + String(agora.getMinutes()).padStart(2, '0') + ':' + String(agora.getSeconds()).padStart(2, '0');
  const protocolo = gerarProtocoloCarga(dados);

  const payload = {
    protocolo,
    data: dados.data,
    colaborador: dados.colaborador,
    registro: dados.registro,
    turno: dados.turno,
    setorPosto: dados.setorPosto,
    quantidade: String(dados.quantidade),
    dataEnvio,
    horaEnvio
  };

  try {
    await fetch(GOOGLE_SHEETS_URL, {
      method: 'POST',
      mode: 'no-cors',
      body: JSON.stringify(payload)
    });

    salvarRegistroColaboradorCargas($('cargaColaborador')?.value || '', dados.registro);
    localStorage.setItem(ASSINATURA_ENVIO_CARGAS_KEY, assinatura);
    const infoEnvio = { protocolo, dataEnvio, horaEnvio };
    localStorage.setItem(ULTIMO_ENVIO_CARGAS_KEY, JSON.stringify(infoEnvio));
    atualizarStatusEnvioCargas(infoEnvio);
    if ($('cargaQuantidade')) $('cargaQuantidade').value = '';
    mostrarModalSalvamento(infoEnvio);
    msgCargas(`Envio realizado. Confira na planilha. Protocolo: ${protocolo}`);
  } catch (erro) {
    console.error(erro);
    msgCargas('Não foi possível gravar na planilha. Verifique a internet e tente novamente.', 'erro');
  } finally {
    if (botao) {
      botao.disabled = false;
      botao.textContent = 'Salvar na Planilha';
    }
  }
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

Object.assign(window, {
  abrirAba,
  abrirModalConsulta,
  fecharModalConsulta,
  executarConsultaModal,
  fecharModalSalvamento,
  consultarUnico,
  mostrarHoje,
  atualizarValorConsulta,
  trocarTurnoConsulta,
  entrarAdmin,
  sairAdmin,
  salvarColaborador,
  excluirColaborador,
  salvarPosto,
  excluirPosto,
  substituirColaborador,
  salvarEscalaMensal,
  preencherDadosCargaPorColaborador,
  abrirEditorSetorCarga,
  aplicarSetorManualCarga,
  restaurarSetorAutomaticoCarga,
  salvarPlanilhaCargas
});

window.addEventListener('load', iniciar);
