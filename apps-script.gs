const VERSAO_API = '2.5.9';
const EQUIPE_PADRAO = '9132';
const CHAVE_ESCALA_FIXA = 'FIXA';
const HASH_ADMIN_PADRAO = 'fe2592b42a727e977f055947385b709cc82b16b9a87f88c6abf3900d65d0cdc3';
const PROPRIEDADE_HASH_ADMIN = 'ESCALA_9132_ADMIN_HASH';

const NOMES_ABAS = Object.freeze({
  config: 'Config',
  colaboradores: 'Colaboradores',
  postos: 'Postos',
  escala: 'Escala',
  fechamento: 'Fechamento',
  substituicoes: 'Substituicoes',
  historico: 'Historico',
  situacoes: 'Situacoes',
  coberturas: 'Coberturas',
  sabadosHE: 'Escala_Sabado_HE'
});

const CABECALHOS = Object.freeze({
  config: ['Chave', 'Valor', 'Atualizado Em'],
  colaboradores: ['ID', 'Nome', 'Registro', 'Turno', 'Ativo', 'Atualizado Em'],
  postos: ['Código', 'Localização', 'Setor', 'Ativo', 'Atualizado Em'],
  escala: ['Referência', 'ID Colaborador', 'Nome', 'Registro', 'Turno']
    .concat(Array.from({ length: 31 }, (_, i) => `Dia ${String(i + 1).padStart(2, '0')}`))
    .concat(['Ativo', 'Atualizado Em']),
  fechamento: ['Data', 'Colaborador', 'Registro', 'Turno', 'Setor/Posto', 'Quantidade', 'Protocolo', 'Data Envio', 'Hora Envio', 'ID Colaborador', 'Data ISO', 'Criado Em'],
  substituicoes: ['ID', 'Referência', 'ID Origem', 'Nome Origem', 'ID Destino', 'Nome Destino', 'Dia Início', 'Criado Em'],
  historico: ['Data/Hora', 'Ação', 'Detalhes', 'Usuário'],
  situacoes: ['ID', 'ID Colaborador', 'Nome', 'Turno', 'Situação', 'Data Inicial', 'Data Final', 'Ativo', 'Criado Em', 'Atualizado Em'],
  coberturas: ['ID', 'ID Origem', 'Nome Origem', 'ID Destino', 'Nome Destino', 'Data Inicial', 'Data Final', 'Ativo', 'Criado Em', 'Atualizado Em', 'Tipo Cobertura', 'Posto Fonte'],
  sabadosHE: ['ID Escala', 'Data ISO', 'Data', 'Turno', 'Status', 'ID Colaborador', 'Nome', 'Registro', 'Posto', 'Observação', 'Atualizado Em']
});

const DADOS_INICIAIS = {"postos":{"69":{"local":"Pátio central","setor":"Carregamento"},"70":{"local":"Pátio central","setor":"Carregamento"},"71":{"local":"G89","setor":"Caixaria"},"72":{"local":"G04","setor":"JIT"},"73":{"local":"G04","setor":"JIT"},"74":{"local":"Pensilina","setor":"Pensilina"},"75":{"local":"Pensilina","setor":"Pensilina"},"76":{"local":"Pensilina","setor":"Pensilina"},"77":{"local":"Pensilina","setor":"Pensilina"},"CMP":{"local":"Pátio central","setor":"Carregamento"},"G38":{"local":"Ilha ecológica","setor":"Ilha ecológica"},"G15":{"local":"Pátio de sucatas","setor":"Pátio de sucatas"},"G76":{"local":"Galpão 76","setor":"Expedição vasilhame"},"66AU":{"local":"G9","setor":"FTP"},"INT-89":{"local":"Interni","setor":"Interni"},"FPT/CX":{"local":"G8 FPT","setor":"Caixaria"},"RÁDIO":{"local":"Central de Segurança","setor":"Disponível para demandas"},"Pens.":{"local":"Pensilina","setor":"Pensilina"},"Ilha":{"local":"Ilha ecológica","setor":"Ilha ecológica"},"FPT-CX":{"local":"G8 FPT","setor":"Caixaria"}},"escala":[{"nome":"VANDER","turno":"1º Turno","dias":["G15","G15","G15","G15","G15","G15","G15","G15","G15","G15","G15","G15","G15","G15","G15","G15","G15","G15","G15","G15","G15","G15","G15","G15","G15","G15","G15","G15","G15","G15","G15"],"registro":"","ativo":true},{"nome":"PIERRE","turno":"1º Turno","dias":["G38","G38","G38","G38","G38","G38","G38","G38","G38","G38","G38","G38","G38","G38","G38","G38","G38","G38","G38","G38","G38","G38","G38","G38","G38","G38","G38","G38","G38","G38","G38"],"registro":"","ativo":true},{"nome":"DANIEL","turno":"1º Turno","dias":["Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens."],"registro":"","ativo":true},{"nome":"POLIANA S.","turno":"1º Turno","dias":["Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens."],"registro":"","ativo":true},{"nome":"VIANA","turno":"1º Turno","dias":["71","76","G76","RÁDIO","FPT/CX","69","72","74","INT-89","77","CMP","73","66AU","70","75","71","76","G76","RÁDIO","FPT/CX","69","72","74","INT-89","77","CMP","73","66AU","70","75","71"],"registro":"","ativo":true},{"nome":"JULIANO","turno":"1º Turno","dias":["69","72","74","INT-89","77","CMP","73","66AU","70","75","71","76","G76","RÁDIO","FPT/CX","69","72","74","INT-89","77","CMP","73","66AU","70","75","71","76","G76","RÁDIO","FPT/CX","69"],"registro":"","ativo":true},{"nome":"AIMEN","turno":"1º Turno","dias":["72","74","INT-89","77","CMP","73","66AU","70","75","71","76","G76","RÁDIO","FPT/CX","69","72","74","INT-89","77","CMP","73","66AU","70","75","71","76","G76","RÁDIO","FPT/CX","69","72"],"registro":"","ativo":true},{"nome":"CARLOS","turno":"1º Turno","dias":["74","INT-89","77","CMP","73","66AU","70","75","71","76","G76","RÁDIO","FPT/CX","69","72","74","INT-89","77","CMP","73","66AU","70","75","71","76","G76","RÁDIO","FPT/CX","69","72","74"],"registro":"","ativo":true},{"nome":"GINALDO","turno":"1º Turno","dias":["INT-89","77","CMP","73","66AU","70","75","71","76","G76","RÁDIO","FPT/CX","69","72","74","INT-89","77","CMP","73","66AU","70","75","71","76","G76","RÁDIO","FPT/CX","69","72","74","INT-89"],"registro":"","ativo":true},{"nome":"JAIR","turno":"1º Turno","dias":["77","CMP","73","66AU","70","75","71","76","G76","RÁDIO","FPT/CX","69","72","74","INT-89","77","CMP","73","66AU","70","75","71","76","G76","RÁDIO","FPT/CX","69","72","74","INT-89","77"],"registro":"","ativo":true},{"nome":"DORIEL","turno":"1º Turno","dias":["CMP","73","66AU","70","75","71","76","G76","RÁDIO","FPT/CX","69","72","74","INT-89","77","CMP","73","66AU","70","75","71","76","G76","RÁDIO","FPT/CX","69","72","74","INT-89","77","CMP"],"registro":"","ativo":true},{"nome":"POLIANA G.","turno":"1º Turno","dias":["73","66AU","70","75","71","76","G76","RÁDIO","FPT/CX","69","72","74","INT-89","77","CMP","73","66AU","70","75","71","76","G76","RÁDIO","FPT/CX","69","72","74","INT-89","77","CMP","73"],"registro":"","ativo":true},{"nome":"RENATO","turno":"1º Turno","dias":["66AU","70","75","71","76","G76","RÁDIO","FPT/CX","69","72","74","INT-89","77","CMP","73","66AU","70","75","71","76","G76","RÁDIO","FPT/CX","69","72","74","INT-89","77","CMP","73","66AU"],"registro":"","ativo":true},{"nome":"MAXILENE","turno":"1º Turno","dias":["70","75","71","76","G76","RÁDIO","FPT/CX","69","72","74","INT-89","77","CMP","73","66AU","70","75","71","76","G76","RÁDIO","FPT/CX","69","72","74","INT-89","77","CMP","73","66AU","70"],"registro":"","ativo":true},{"nome":"ADRIANA","turno":"1º Turno","dias":["75","71","76","G76","RÁDIO","FPT/CX","69","72","74","INT-89","77","CMP","73","66AU","70","75","71","76","G76","RÁDIO","FPT/CX","69","72","74","INT-89","77","CMP","73","66AU","70","75"],"registro":"","ativo":true},{"nome":"REGINALDO","turno":"1º Turno","dias":["76","G76","RÁDIO","FPT/CX","69","72","74","INT-89","77","CMP","73","66AU","70","75","71","76","G76","RÁDIO","FPT/CX","69","72","74","INT-89","77","CMP","73","66AU","70","75","71","76"],"registro":"","ativo":true},{"nome":"AMANDA","turno":"1º Turno","dias":["G76","RÁDIO","FPT/CX","69","72","74","INT-89","77","CMP","73","66AU","70","75","71","76","G76","RÁDIO","FPT/CX","69","72","74","INT-89","77","CMP","73","66AU","70","75","71","76","G76"],"registro":"","ativo":true},{"nome":"FABIANA","turno":"1º Turno","dias":["RÁDIO","FPT/CX","69","72","74","INT-89","77","CMP","73","66AU","70","75","71","76","G76","RÁDIO","FPT/CX","69","72","74","INT-89","77","CMP","73","66AU","70","75","71","76","G76","RÁDIO"],"registro":"","ativo":true},{"nome":"CINTIA","turno":"1º Turno","dias":["FPT/CX","69","72","74","INT-89","77","CMP","73","66AU","70","75","71","76","G76","RÁDIO","FPT/CX","69","72","74","INT-89","77","CMP","73","66AU","70","75","71","76","G76","RÁDIO","FPT/CX"],"registro":"","ativo":true},{"nome":"RENATO","turno":"2º Turno","dias":["Ilha","Ilha","Ilha","Ilha","Ilha","Ilha","Ilha","Ilha","Ilha","Ilha","Ilha","Ilha","Ilha","Ilha","Ilha","Ilha","Ilha","Ilha","Ilha","Ilha","Ilha","Ilha","Ilha","Ilha","Ilha","Ilha","Ilha","Ilha","Ilha","Ilha","Ilha"],"registro":"","ativo":true},{"nome":"GERMANO","turno":"2º Turno","dias":["Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens."],"registro":"","ativo":true},{"nome":"JUNIOR","turno":"2º Turno","dias":["Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens.","Pens."],"registro":"","ativo":true},{"nome":"ROGERIO","turno":"2º Turno","dias":["INT-89","77","FPT-CX","70","66AU","73","76","69","75","72","71","74","INT-89","77","FPT-CX","70","66AU","73","76","69","75","72","71","74","INT-89","77","FPT-CX","70","66AU","73","76"],"registro":"","ativo":true},{"nome":"CLAYTON","turno":"2º Turno","dias":["69","75","72","71","74","INT-89","77","FPT-CX","70","66AU","73","76","69","75","72","71","74","INT-89","77","FPT-CX","70","66AU","73","76","69","75","72","71","74","INT-89","77"],"registro":"","ativo":true},{"nome":"NOGUEIRA","turno":"2º Turno","dias":["FPT-CX","70","66AU","73","76","69","75","72","71","74","INT-89","77","FPT-CX","70","66AU","73","76","69","75","72","71","74","INT-89","77","FPT-CX","70","66AU","73","76","69","75"],"registro":"","ativo":true},{"nome":"WELINGTON","turno":"2º Turno","dias":["72","71","74","INT-89","77","FPT-CX","70","66AU","73","76","69","75","72","71","74","INT-89","77","FPT-CX","70","66AU","73","76","69","75","72","71","74","INT-89","77","FPT-CX","70"],"registro":"","ativo":true},{"nome":"GIDEÃO","turno":"2º Turno","dias":["66AU","73","76","69","75","72","71","74","INT-89","77","FPT-CX","70","66AU","73","76","69","75","72","71","74","INT-89","77","FPT-CX","70","66AU","73","76","69","75","72","71"],"registro":"","ativo":true},{"nome":"HUDSON","turno":"2º Turno","dias":["74","INT-89","77","FPT-CX","70","66AU","73","76","69","75","72","71","74","INT-89","77","FPT-CX","70","66AU","73","76","69","75","72","71","74","INT-89","77","FPT-CX","70","66AU","73"],"registro":"","ativo":true},{"nome":"AROLDO","turno":"2º Turno","dias":["76","69","75","72","71","74","INT-89","77","FPT-CX","70","66AU","73","76","69","75","72","71","74","INT-89","77","FPT-CX","70","66AU","73","76","69","75","72","71","74","INT-89"],"registro":"","ativo":true},{"nome":"JOSÉ","turno":"2º Turno","dias":["77","FPT-CX","70","66AU","73","76","69","75","72","71","74","INT-89","77","FPT-CX","70","66AU","73","76","69","75","72","71","74","INT-89","77","FPT-CX","70","66AU","73","76","69"],"registro":"","ativo":true},{"nome":"CAMILO","turno":"2º Turno","dias":["75","72","71","74","INT-89","77","FPT-CX","70","66AU","73","76","69","75","72","71","74","INT-89","77","FPT-CX","70","66AU","73","76","69","75","72","71","74","INT-89","77","FPT-CX"],"registro":"","ativo":true},{"nome":"ERCI","turno":"2º Turno","dias":["70","66AU","73","76","69","75","72","71","74","INT-89","77","FPT-CX","70","66AU","73","76","69","75","72","71","74","INT-89","77","FPT-CX","70","66AU","73","76","69","75","72"],"registro":"","ativo":true},{"nome":"MARCOS","turno":"2º Turno","dias":["71","74","INT-89","77","FPT-CX","70","66AU","73","76","69","75","72","71","74","INT-89","77","FPT-CX","70","66AU","73","76","69","75","72","71","74","INT-89","77","FPT-CX","70","66AU"],"registro":"","ativo":true},{"nome":"LEONEL","turno":"2º Turno","dias":["73","76","69","75","72","71","74","INT-89","77","FPT-CX","70","66AU","73","76","69","75","72","71","74","INT-89","77","FPT-CX","70","66AU","73","76","69","75","72","71","74"],"registro":"","ativo":true}]};

function doGet(e) {
  try {
    garantirEstruturaSeNecessario_();
    const parametros = (e && e.parameter) || {};
    const acao = String(parametros.acao || 'status');
    let resposta;

    if (acao === 'bootstrap') {
      resposta = obterBootstrap_();
    } else if (acao === 'escalaSabadoPublica') {
      resposta = obterEscalaSabadoPublica_(parametros.data, parametros.turno, String(parametros.incluirRascunho || '') === '1');
    } else if (acao === 'escalaSabado') {
      resposta = obterEscalaSabadoPublica_(parametros.data, parametros.turno, String(parametros.incluirRascunho || '') === '1');
    } else if (acao === 'proximaEscalaSabado') {
      resposta = obterProximaEscalaSabado_(parametros.data, parametros.turno);
    } else if (acao === 'sabadoAnterior') {
      resposta = obterSabadoAnterior_(parametros.data, parametros.turno);
    } else if (acao === 'estatisticasSabado') {
      resposta = obterEstatisticasSabado_(parametros.data, parametros.turno);
    } else if (acao === 'listarEscalasSabado') {
      resposta = listarEscalasSabado_(parametros.limite);
    } else {
      resposta = {
        sucesso: true,
        mensagem: 'API Escala Equipe 9132 ativa',
        versao: VERSAO_API,
        dataHora: new Date().toISOString()
      };
    }

    return responder_(resposta, parametros.callback);
  } catch (erro) {
    return responder_({ sucesso: false, mensagem: mensagemErro_(erro), versao: VERSAO_API }, e && e.parameter && e.parameter.callback);
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    garantirEstruturaSeNecessario_();
    const dados = lerCorpo_(e);
    const acao = String(dados.acao || 'salvarFechamento');
    let resposta;

    if (acao === 'salvarFechamento') {
      resposta = salvarFechamento_(dados);
    } else {
      validarAdmin_(dados.senha);
      switch (acao) {
        case 'salvarColaborador': resposta = salvarColaborador_(dados); break;
        case 'excluirColaborador': resposta = excluirColaborador_(dados); break;
        case 'retirarColaborador': resposta = retirarColaborador_(dados); break;
        case 'preencherVaga': resposta = preencherVaga_(dados); break;
        case 'realocarColaborador': resposta = realocarColaborador_(dados); break;
        case 'trocarPosicoes': resposta = trocarPosicoes_(dados); break;
        case 'salvarPosto': resposta = salvarPosto_(dados); break;
        case 'excluirPosto': resposta = excluirPosto_(dados); break;
        case 'salvarEscala': resposta = salvarEscala_(dados); break;
        case 'salvarSituacao': resposta = salvarSituacao_(dados); break;
        case 'removerSituacao': resposta = removerSituacao_(dados); break;
        case 'salvarCobertura': resposta = salvarCobertura_(dados); break;
        case 'removerCobertura': resposta = removerCobertura_(dados); break;
        case 'substituirColaborador': resposta = substituirColaborador_(dados); break; // compatibilidade legada
        case 'sincronizarTudo': resposta = sincronizarTudo_(dados); break; // compatibilidade legada
        case 'salvarEscalaSabado': resposta = salvarEscalaSabado_(dados); break;
        case 'removerEscalaSabado': resposta = removerEscalaSabado_(dados); break;
        default: throw new Error(`Ação desconhecida: ${acao}`);
      }
    }

    SpreadsheetApp.flush();
    return responder_(resposta);
  } catch (erro) {
    return responder_({ sucesso: false, mensagem: mensagemErro_(erro), versao: VERSAO_API });
  } finally {
    try { lock.releaseLock(); } catch (_) { /* lock não adquirido */ }
  }
}

/** Execute manualmente apenas se desejar preparar a planilha antes do primeiro acesso. */
function configurarSistema() {
  const migradas = garantirEstrutura_();
  return `Sistema configurado com sucesso. Situações legadas migradas: ${migradas || 0}.`;
}

/** Execute manualmente para trocar a senha administrativa. */
function definirSenhaAdmin(novaSenha) {
  if (!novaSenha || String(novaSenha).length < 4) throw new Error('A nova senha deve ter pelo menos 4 caracteres.');
  PropertiesService.getScriptProperties().setProperty(PROPRIEDADE_HASH_ADMIN, sha256_(String(novaSenha)));
  registrarHistorico_('ALTERAR SENHA', 'Senha administrativa alterada.', 'Administrador');
  return 'Senha alterada com sucesso.';
}

function garantirEstruturaSeNecessario_() {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const nomesObrigatorios = Object.values(NOMES_ABAS);
  const abasPresentes = nomesObrigatorios.every((nome) => Boolean(planilha.getSheetByName(nome)));
  const abaCoberturas = planilha.getSheetByName(NOMES_ABAS.coberturas);
  const coberturaAtualizada = Boolean(abaCoberturas && abaCoberturas.getMaxColumns() >= CABECALHOS.coberturas.length
    && String(abaCoberturas.getRange(1, 11).getValue() || '') === 'Tipo Cobertura'
    && String(abaCoberturas.getRange(1, 12).getValue() || '') === 'Posto Fonte');
  if (!abasPresentes || !coberturaAtualizada) garantirEstrutura_();
}

function garantirEstrutura_() {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  prepararAba_(planilha, NOMES_ABAS.config, CABECALHOS.config);
  prepararAba_(planilha, NOMES_ABAS.colaboradores, CABECALHOS.colaboradores);
  prepararAba_(planilha, NOMES_ABAS.postos, CABECALHOS.postos);
  prepararAba_(planilha, NOMES_ABAS.escala, CABECALHOS.escala);
  prepararAba_(planilha, NOMES_ABAS.fechamento, CABECALHOS.fechamento);
  prepararAba_(planilha, NOMES_ABAS.substituicoes, CABECALHOS.substituicoes);
  prepararAba_(planilha, NOMES_ABAS.historico, CABECALHOS.historico);
  prepararAba_(planilha, NOMES_ABAS.situacoes, CABECALHOS.situacoes);
  prepararAba_(planilha, NOMES_ABAS.coberturas, CABECALHOS.coberturas);
  prepararAba_(planilha, NOMES_ABAS.sabadosHE, CABECALHOS.sabadosHE);

  const propriedades = PropertiesService.getScriptProperties();
  if (!propriedades.getProperty(PROPRIEDADE_HASH_ADMIN)) propriedades.setProperty(PROPRIEDADE_HASH_ADMIN, HASH_ADMIN_PADRAO);

  const abaColaboradores = planilha.getSheetByName(NOMES_ABAS.colaboradores);
  const abaPostos = planilha.getSheetByName(NOMES_ABAS.postos);
  if (abaColaboradores.getLastRow() <= 1 && abaPostos.getLastRow() <= 1) popularDadosIniciais_();
  garantirEscalaFixa_();
  return migrarSituacoesLegadas_();
}

function garantirEscalaFixa_() {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const aba = planilha.getSheetByName(NOMES_ABAS.escala);
  if (!aba || aba.getLastRow() <= 1) return;
  const valores = obterValoresSemCabecalho_(aba, CABECALHOS.escala.length);
  if (valores.some(linha => String(linha[0]) === CHAVE_ESCALA_FIXA && valorBooleano_(linha[36]))) return;
  const referencias = [...new Set(valores.filter(linha => valorBooleano_(linha[36]) && /^\d{4}-\d{2}$/.test(String(linha[0] || ''))).map(linha => String(linha[0])))].sort().reverse();
  if (!referencias.length) return;
  const referenciaOrigem = referencias.includes(mesAtual_()) ? mesAtual_() : referencias[0];
  const linhasOrigem = valores.filter(linha => String(linha[0]) === referenciaOrigem && valorBooleano_(linha[36]));
  linhasOrigem.forEach(linha => { const nova = linha.slice(); nova[0] = CHAVE_ESCALA_FIXA; nova[37] = new Date(); aba.appendRow(nova); });
  registrarHistorico_('MIGRAÇÃO ESCALA FIXA', `${linhasOrigem.length} colaborador(es) copiados da referência ${referenciaOrigem}.`, 'Sistema');
}

function prepararAba_(planilha, nome, cabecalhos) {
  let aba = planilha.getSheetByName(nome);
  if (!aba) aba = planilha.insertSheet(nome);

  if (aba.getMaxColumns() < cabecalhos.length) {
    aba.insertColumnsAfter(aba.getMaxColumns(), cabecalhos.length - aba.getMaxColumns());
  }

  const primeiraLinha = aba.getRange(1, 1, 1, cabecalhos.length).getValues()[0];
  const vazia = primeiraLinha.every(valor => valor === '');
  const primeiraCelula = String(primeiraLinha[0] || '').toLowerCase();
  const pareceCabecalho = primeiraCelula === String(cabecalhos[0]).toLowerCase()
    || (nome === NOMES_ABAS.escala && primeiraCelula === 'mês');
  if (vazia || pareceCabecalho || aba.getLastRow() === 0) {
    aba.getRange(1, 1, 1, cabecalhos.length).setValues([cabecalhos]);
  } else {
    // Se a primeira linha já contém dados, cria o cabeçalho sem apagar nenhum registro.
    aba.insertRowBefore(1);
    aba.getRange(1, 1, 1, cabecalhos.length).setValues([cabecalhos]);
  }

  const cabecalho = aba.getRange(1, 1, 1, cabecalhos.length);
  cabecalho
    .setFontWeight('bold')
    .setFontColor('#06111d')
    .setBackground('#22d3ee')
    .setHorizontalAlignment('center');
  aba.setFrozenRows(1);
  aba.getDataRange().setVerticalAlignment('middle');
  if (nome === NOMES_ABAS.fechamento) {
    aba.setColumnWidth(1, 95);
    aba.setColumnWidth(2, 170);
    aba.setColumnWidth(5, 240);
    aba.setColumnWidth(7, 220);
  }
  if (nome === NOMES_ABAS.sabadosHE) {
    aba.setColumnWidth(2, 105);
    aba.setColumnWidth(3, 105);
    aba.setColumnWidth(4, 105);
    aba.setColumnWidth(7, 180);
    aba.setColumnWidth(9, 110);
    aba.setColumnWidth(10, 220);
  }
  if (nome === NOMES_ABAS.situacoes || nome === NOMES_ABAS.coberturas) {
    aba.setColumnWidth(2, 150);
    aba.setColumnWidth(3, 180);
    aba.setColumnWidth(6, 110);
    aba.setColumnWidth(7, 110);
  }
}

function popularDadosIniciais_() {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const agora = new Date();
  const mes = CHAVE_ESCALA_FIXA;
  const postos = DADOS_INICIAIS.postos || {};
  const escala = DADOS_INICIAIS.escala || [];

  const linhasPostos = Object.keys(postos).map(codigo => [
    codigo,
    postos[codigo].local || postos[codigo].setor || codigo,
    postos[codigo].setor || postos[codigo].local || codigo,
    true,
    agora
  ]);
  if (linhasPostos.length) planilha.getSheetByName(NOMES_ABAS.postos).getRange(2, 1, linhasPostos.length, CABECALHOS.postos.length).setValues(linhasPostos);

  const usados = {};
  const linhasColaboradores = [];
  const linhasEscala = [];
  escala.forEach((pessoa, indice) => {
    let base = `${slug_(pessoa.nome)}-${slug_(pessoa.turno || 'turno')}` || `colaborador-${indice + 1}`;
    let id = base;
    let contador = 2;
    while (usados[id]) id = `${base}-${contador++}`;
    usados[id] = true;
    const dias = Array.from({ length: 31 }, (_, i) => pessoa.dias && pessoa.dias[i] || '');
    linhasColaboradores.push([id, String(pessoa.nome || '').toUpperCase(), pessoa.registro || '', pessoa.turno || '1º Turno', true, agora]);
    linhasEscala.push([mes, id, String(pessoa.nome || '').toUpperCase(), pessoa.registro || '', pessoa.turno || '1º Turno'].concat(dias).concat([true, agora]));
  });

  if (linhasColaboradores.length) planilha.getSheetByName(NOMES_ABAS.colaboradores).getRange(2, 1, linhasColaboradores.length, CABECALHOS.colaboradores.length).setValues(linhasColaboradores);
  if (linhasEscala.length) planilha.getSheetByName(NOMES_ABAS.escala).getRange(2, 1, linhasEscala.length, CABECALHOS.escala.length).setValues(linhasEscala);

  registrarHistorico_('CONFIGURAÇÃO INICIAL', `Dados iniciais criados para ${mes}.`, 'Sistema');
}

function textoChavePessoa_(valor) {
  return String(valor || '').trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ');
}

function chaveRegistroTurno_(registro, turno) {
  const reg = String(registro || '').trim();
  return reg ? `${turnoCanonico_(turno || '')}|REG|${reg}` : '';
}

function chaveNomeTurno_(nome, turno) {
  const nomeNormalizado = textoChavePessoa_(nome);
  return nomeNormalizado ? `${turnoCanonico_(turno || '')}|NOME|${nomeNormalizado}` : '';
}

function pontuacaoEscala_(item, idPreferido) {
  const diasPreenchidos = (item.dias || []).filter(Boolean).length;
  const bonusId = idPreferido && item.id === idPreferido ? 1000 : 0;
  const atualizado = item.atualizadoEm ? new Date(item.atualizadoEm).getTime() || 0 : 0;
  return bonusId + diasPreenchidos * 10 + atualizado / 1e13;
}

function escolherMelhorEscala_(candidatos, idPreferido) {
  return (candidatos || []).slice().sort((a, b) => pontuacaoEscala_(b, idPreferido) - pontuacaoEscala_(a, idPreferido))[0] || null;
}

const PREFIXO_REFERENCIA_VAGA_ = 'VAGA_DE|';

function ehVagaAberta_(item) {
  const id = String(item && item.id || '').trim().toLowerCase();
  const nome = textoChavePessoa_(item && item.nome || '');
  return id.indexOf('vaga-') === 0 || nome === 'A DEFINIR';
}

function registroReferenciaVaga_(nome) {
  const referencia = String(nome || '').trim().toUpperCase();
  return referencia ? PREFIXO_REFERENCIA_VAGA_ + referencia : '';
}

function referenciaVagaAberta_(item) {
  if (!ehVagaAberta_(item)) return '';
  const registro = String(item && item.registro || '').trim();
  return registro.toUpperCase().indexOf(PREFIXO_REFERENCIA_VAGA_) === 0
    ? registro.slice(PREFIXO_REFERENCIA_VAGA_.length).trim().toUpperCase()
    : '';
}

function deduplicarColaboradores_(colaboradores, escalasAtivas, inconsistencias) {
  const idsEscala = new Set(escalasAtivas.map(item => item.id).filter(Boolean));
  const grupos = new Map();

  colaboradores.forEach(item => {
    const chave = ehVagaAberta_(item)
      ? `VAGA|${item.id}`
      : (chaveRegistroTurno_(item.registro, item.turno)
        || chaveNomeTurno_(item.nome, item.turno)
        || `ID|${item.id}`);
    if (!grupos.has(chave)) grupos.set(chave, []);
    grupos.get(chave).push(item);
  });

  const saida = [];
  grupos.forEach(grupo => {
    if (grupo.length > 1) {
      inconsistencias.push({
        tipo: 'COLABORADOR_DUPLICADO',
        mensagem: `${grupo[0].nome} • ${turnoCanonico_(grupo[0].turno)} possui ${grupo.length} cadastros ativos na aba Colaboradores.`,
        ids: grupo.map(item => item.id)
      });
    }
    const ordenados = grupo.slice().sort((a, b) => {
      const bonusA = idsEscala.has(a.id) ? 1000 : 0;
      const bonusB = idsEscala.has(b.id) ? 1000 : 0;
      const dataA = a.atualizadoEm ? new Date(a.atualizadoEm).getTime() || 0 : 0;
      const dataB = b.atualizadoEm ? new Date(b.atualizadoEm).getTime() || 0 : 0;
      return (bonusB + dataB / 1e13) - (bonusA + dataA / 1e13);
    });
    saida.push(ordenados[0]);
  });
  return saida;
}

function obterBootstrap_() {
  const mesAno = CHAVE_ESCALA_FIXA;
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const colaboradoresBrutos = lerColaboradoresAtivos_();
  const postos = lerPostosAtivos_();
  const situacoes = lerSituacoes_();
  const coberturas = lerCoberturas_();
  const abaEscala = planilha.getSheetByName(NOMES_ABAS.escala);
  const valores = obterValoresSemCabecalho_(abaEscala, CABECALHOS.escala.length);
  const inconsistencias = [];

  const escalasAtivas = valores
    .filter(linha => String(linha[0]) === mesAno && valorBooleano_(linha[36]))
    .map(linha => ({
      id: String(linha[1] || '').trim(),
      nome: String(linha[2] || '').trim().toUpperCase(),
      registro: String(linha[3] || '').trim(),
      turno: turnoCanonico_(linha[4] || '1º Turno'),
      dias: linha.slice(5, 36).map(valor => String(valor || '').trim()),
      ativo: true,
      atualizadoEm: linha[37] instanceof Date ? linha[37].toISOString() : String(linha[37] || '')
    }))
    .filter(item => item.id || item.nome);

  const colaboradores = deduplicarColaboradores_(colaboradoresBrutos, escalasAtivas, inconsistencias);

  const porId = new Map();
  const porRegistroTurno = new Map();
  const porNomeTurno = new Map();
  escalasAtivas.forEach(item => {
    if (item.id) {
      if (!porId.has(item.id)) porId.set(item.id, []);
      porId.get(item.id).push(item);
    }
    const chaveReg = chaveRegistroTurno_(item.registro, item.turno);
    if (chaveReg) {
      if (!porRegistroTurno.has(chaveReg)) porRegistroTurno.set(chaveReg, []);
      porRegistroTurno.get(chaveReg).push(item);
    }
    const chaveNome = chaveNomeTurno_(item.nome, item.turno);
    if (chaveNome) {
      if (!porNomeTurno.has(chaveNome)) porNomeTurno.set(chaveNome, []);
      porNomeTurno.get(chaveNome).push(item);
    }
  });

  // Registra duplicidades também na própria aba Escala.
  const identidadesEscala = new Map();
  escalasAtivas.forEach(item => {
    const chave = ehVagaAberta_(item) ? `VAGA|${item.id}` : (chaveRegistroTurno_(item.registro, item.turno) || chaveNomeTurno_(item.nome, item.turno) || `ID|${item.id}`);
    if (!identidadesEscala.has(chave)) identidadesEscala.set(chave, []);
    identidadesEscala.get(chave).push(item);
  });
  identidadesEscala.forEach(grupo => {
    if (grupo.length > 1) inconsistencias.push({
      tipo: 'ESCALA_DUPLICADA',
      mensagem: `${grupo[0].nome} • ${grupo[0].turno} possui ${grupo.length} linhas ativas na aba Escala. O sistema usou a linha mais completa.`,
      ids: grupo.map(item => item.id)
    });
  });

  const escalasUsadas = new Set();
  const escala = colaboradores.map(item => {
    const turno = turnoCanonico_(item.turno || '1º Turno');
    const chaveReg = chaveRegistroTurno_(item.registro, turno);
    const chaveNome = chaveNomeTurno_(item.nome, turno);

    let candidatos = [];
    let origemMatch = '';
    if (ehVagaAberta_(item)) {
      candidatos = item.id ? (porId.get(item.id) || []) : [];
      origemMatch = candidatos.length ? 'ID' : '';
    } else {
      // Registro + turno é a identidade principal. ID e nome/turno são recuperações.
      candidatos = chaveReg ? (porRegistroTurno.get(chaveReg) || []) : [];
      origemMatch = candidatos.length ? 'REGISTRO' : '';
      if (!candidatos.length && item.id) {
        candidatos = porId.get(item.id) || [];
        origemMatch = candidatos.length ? 'ID' : '';
      }
      if (!candidatos.length && chaveNome) {
        candidatos = porNomeTurno.get(chaveNome) || [];
        origemMatch = candidatos.length ? 'NOME_TURNO' : '';
      }
    }

    const existente = escolherMelhorEscala_(candidatos, item.id);
    if (existente) {
      escalasUsadas.add(existente);
      if (existente.id && item.id && existente.id !== item.id) {
        inconsistencias.push({
          tipo: 'ID_DIVERGENTE',
          mensagem: `${item.nome} • ${turno}: ID da aba Colaboradores (${item.id}) difere do ID da aba Escala (${existente.id}). A associação foi recuperada por ${origemMatch === 'REGISTRO' ? 'registro' : 'nome e turno'}.`,
          ids: [item.id, existente.id]
        });
      }
      return {
        id: item.id || existente.id,
        nome: item.nome || existente.nome,
        registro: item.registro || existente.registro,
        turno,
        dias: existente.dias,
        ativo: true
      };
    }

    inconsistencias.push({
      tipo: 'SEM_ESCALA',
      mensagem: `${item.nome} • ${turno} está ativo em Colaboradores, mas ainda não possui uma escala fixa associada.`,
      ids: [item.id]
    });
    return {
      id: item.id,
      nome: item.nome,
      registro: item.registro,
      turno,
      dias: Array(31).fill(''),
      ativo: true
    };
  });

  escalasAtivas.forEach(item => {
    if (escalasUsadas.has(item)) return;
    const existePessoa = colaboradores.some(pessoa => {
      if (ehVagaAberta_(item) || ehVagaAberta_(pessoa)) return pessoa.id === item.id;
      const turno = turnoCanonico_(pessoa.turno);
      const mesmaReg = pessoa.registro && item.registro && String(pessoa.registro) === String(item.registro) && mesmoTurno_(turno, item.turno);
      return mesmaReg || pessoa.id === item.id || (textoChavePessoa_(pessoa.nome) === textoChavePessoa_(item.nome) && mesmoTurno_(turno, item.turno));
    });
    if (!existePessoa) inconsistencias.push({
      tipo: 'ESCALA_ORFA',
      mensagem: `${item.nome || item.id} • ${item.turno} possui linha na Escala, mas não existe como colaborador ativo.`,
      ids: [item.id]
    });
  });

  escala.sort((a, b) => `${a.turno}${a.nome}`.localeCompare(`${b.turno}${b.nome}`));
  return {
    sucesso: true,
    versao: VERSAO_API,
    equipe: EQUIPE_PADRAO,
    mesAno,
    postos,
    colaboradores,
    escala,
    situacoes,
    coberturas,
    inconsistencias,
    resumoInconsistencias: {
      total: inconsistencias.length,
      duplicidades: inconsistencias.filter(item => item.tipo.includes('DUPLIC')).length,
      idsDivergentes: inconsistencias.filter(item => item.tipo === 'ID_DIVERGENTE').length,
      semEscala: inconsistencias.filter(item => item.tipo === 'SEM_ESCALA').length
    },
    atualizadoEm: new Date().toISOString()
  };
}

function obterEscalaSabado_(dataISO, turno, incluirRascunho) {
  return obterEscalaSabadoPublica_(dataISO, turno, incluirRascunho);
}

function obterEscalaSabadoPublica_(dataISO, turno, incluirRascunho) {
  const data = normalizarDataISO_(dataISO);
  if (!data) throw new Error('Data do sábado não informada.');
  if (!dataEhSabado_(data)) throw new Error('A data informada não é um sábado.');

  const turnoFiltro = turnoCanonico_(turno || '');
  const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(NOMES_ABAS.sabadosHE);
  if (!aba || aba.getLastRow() <= 1) {
    return { sucesso: true, encontrada: false, dataISO: data, turno: turnoFiltro || 'todos', status: 'VAZIA', itens: [], atualizadoEm: new Date().toISOString(), versaoApi: VERSAO_API };
  }

  const quantidade = aba.getLastRow() - 1;
  const faixa = aba.getRange(2, 1, quantidade, CABECALHOS.sabadosHE.length);
  const valores = faixa.getValues();
  const exibidos = faixa.getDisplayValues();
  const candidatos = [];

  for (let i = 0; i < valores.length; i += 1) {
    const linha = valores[i];
    const texto = exibidos[i] || [];
    // Aceita Data ISO como texto ou como Date convertido automaticamente pelo Sheets.
    const dataLinha = normalizarDataISO_(linha[1]) || normalizarDataISO_(texto[1]);
    if (dataLinha !== data) continue;

    const turnoLinha = turnoCanonico_(linha[3] || texto[3]);
    if (turnoFiltro && !mesmoTurno_(turnoLinha, turnoFiltro)) continue;

    const statusLinha = statusEscalaSabado_(linha[4] || texto[4]);
    if (!['RASCUNHO', 'PUBLICADA'].includes(statusLinha)) continue;
    candidatos.push({
      idEscala: String(linha[0] || texto[0] || ''),
      dataISO: dataLinha,
      turno: turnoLinha,
      status: statusLinha,
      colaboradorId: String(linha[5] || texto[5] || '').trim(),
      nome: String(linha[6] || texto[6] || '').trim().toUpperCase(),
      registro: String(linha[7] || texto[7] || '').trim(),
      posto: String(linha[8] || texto[8] || '').trim(),
      observacao: String(linha[9] || texto[9] || '').trim()
    });
  }

  // Cada turno é tratado separadamente. No Admin, o rascunho tem prioridade;
  // na consulta pública, somente a publicação é entregue.
  const grupos = new Map();
  candidatos.forEach(item => {
    const chave = turnoCanonico_(item.turno || '');
    if (!grupos.has(chave)) grupos.set(chave, []);
    grupos.get(chave).push(item);
  });

  const itens = [];
  grupos.forEach(grupo => {
    const rascunhos = grupo.filter(item => item.status === 'RASCUNHO');
    const publicadas = grupo.filter(item => item.status === 'PUBLICADA');
    const escolhidos = incluirRascunho && rascunhos.length ? rascunhos : publicadas;
    itens.push(...escolhidos);
  });

  const status = itens.some(item => item.status === 'RASCUNHO')
    ? 'RASCUNHO'
    : itens.some(item => item.status === 'PUBLICADA') ? 'PUBLICADA' : 'VAZIA';
  return {
    sucesso: true,
    encontrada: itens.length > 0,
    dataISO: data,
    turno: turnoFiltro || 'todos',
    status,
    quantidade: itens.length,
    itens,
    atualizadoEm: new Date().toISOString(),
    versaoApi: VERSAO_API
  };
}
function obterProximaEscalaSabado_(dataISO, turno) {
  const dataInicial = normalizarDataISO_(dataISO) || Utilities.formatDate(new Date(), fuso_(), 'yyyy-MM-dd');
  const turnoFiltro = turnoCanonico_(turno || '');
  const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(NOMES_ABAS.sabadosHE);
  const datas = obterValoresSemCabecalho_(aba, CABECALHOS.sabadosHE.length)
    .filter(linha => statusEscalaSabado_(linha[4]) === 'PUBLICADA')
    .filter(linha => !turnoFiltro || mesmoTurno_(linha[3], turnoFiltro))
    .map(linha => normalizarDataISO_(linha[1]))
    .filter(data => data && data >= dataInicial)
    .sort();
  const proximaData = datas[0] || '';
  if (!proximaData) {
    return { sucesso: true, encontrada: false, dataISO: dataInicial, turno: turnoFiltro || 'todos', status: 'VAZIA', itens: [], atualizadoEm: new Date().toISOString() };
  }
  return obterEscalaSabado_(proximaData, turnoFiltro, false);
}

function obterEstatisticasSabado_(dataISO, turno) {
  const dataAlvo = normalizarDataISO_(dataISO);
  const turnoFiltro = turnoCanonico_(turno || '');
  if (!dataAlvo || !dataEhSabado_(dataAlvo)) throw new Error('Informe uma data válida de sábado.');
  if (!turnoFiltro) throw new Error('Informe o turno.');

  const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(NOMES_ABAS.sabadosHE);
  const linhas = obterValoresSemCabecalho_(aba, CABECALHOS.sabadosHE.length)
    .filter(linha => { const dataLinha = normalizarDataISO_(linha[1]); return dataLinha && dataLinha < dataAlvo; })
    .filter(linha => mesmoTurno_(linha[3], turnoFiltro))
    .filter(linha => statusEscalaSabado_(linha[4]) === 'PUBLICADA');

  const porColaborador = new Map();
  linhas.forEach(linha => {
    const colaboradorId = String(linha[5] || '').trim();
    const data = normalizarDataISO_(linha[1]);
    if (!colaboradorId || !data) return;
    if (!porColaborador.has(colaboradorId)) {
      porColaborador.set(colaboradorId, {
        colaboradorId,
        nome: String(linha[6] || '').toUpperCase(),
        datas: new Map()
      });
    }
    porColaborador.get(colaboradorId).datas.set(data, String(linha[8] || ''));
  });

  const inicioAno = `${dataAlvo.slice(0, 4)}-01-01`;
  const inicio90Dias = deslocarDataISO_(dataAlvo, -90);
  const estatisticas = [...porColaborador.values()].map(item => {
    const datas = [...item.datas.keys()].sort();
    const ultimoSabado = datas[datas.length - 1] || '';
    let consecutivos = 0;
    let esperado = deslocarDataISO_(dataAlvo, -7);
    while (esperado && item.datas.has(esperado)) {
      consecutivos += 1;
      esperado = deslocarDataISO_(esperado, -7);
    }
    return {
      colaboradorId: item.colaboradorId,
      nome: item.nome,
      totalAno: datas.filter(data => data >= inicioAno && data < dataAlvo).length,
      total90Dias: datas.filter(data => data >= inicio90Dias && data < dataAlvo).length,
      totalGeral: datas.length,
      consecutivos,
      ultimoSabado,
      ultimoPosto: ultimoSabado ? String(item.datas.get(ultimoSabado) || '') : ''
    };
  });

  return {
    sucesso: true,
    dataISO: dataAlvo,
    turno: turnoFiltro,
    estatisticas,
    atualizadoEm: new Date().toISOString()
  };
}

function obterSabadoAnterior_(dataISO, turno) {
  const data = normalizarDataISO_(dataISO);
  const turnoFiltro = turnoCanonico_(turno || '');
  if (!data || !turnoFiltro) throw new Error('Informe a data e o turno.');
  const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(NOMES_ABAS.sabadosHE);
  const linhas = obterValoresSemCabecalho_(aba, CABECALHOS.sabadosHE.length)
    .filter(linha => { const dataLinha = normalizarDataISO_(linha[1]); return dataLinha && dataLinha < data && mesmoTurno_(linha[3], turnoFiltro); })
    .filter(linha => statusEscalaSabado_(linha[4]) === 'PUBLICADA');
  const datas = [...new Set(linhas.map(linha => normalizarDataISO_(linha[1])).filter(Boolean))].sort().reverse();
  if (!datas.length) return { sucesso: true, encontrada: false, itens: [] };
  const dataOrigem = datas[0];
  const itens = linhas.filter(linha => normalizarDataISO_(linha[1]) === dataOrigem).map(linha => ({
    colaboradorId: String(linha[5] || ''),
    nome: String(linha[6] || '').toUpperCase(),
    registro: String(linha[7] || ''),
    turno: String(linha[3] || turnoFiltro),
    posto: String(linha[8] || ''),
    observacao: String(linha[9] || ''),
    status: 'RASCUNHO'
  }));
  return { sucesso: true, encontrada: itens.length > 0, dataOrigem, dataISO: data, turno: turnoFiltro, status: 'RASCUNHO', itens };
}


function listarEscalasSabado_(limite) {
  const maximo = Math.max(1, Math.min(40, Number(limite || 16)));
  const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(NOMES_ABAS.sabadosHE);
  const linhas = obterValoresSemCabecalho_(aba, CABECALHOS.sabadosHE.length);
  const mapa = new Map();
  linhas.forEach(linha => {
    const dataISO = normalizarDataISO_(linha[1]);
    const turno = turnoCanonico_(linha[3] || '');
    const status = statusEscalaSabado_(linha[4]);
    if (!dataISO || !turno || !['RASCUNHO', 'PUBLICADA'].includes(status)) return;
    // Rascunho e publicação da mesma data/turno são registros independentes.
    const chave = `${dataISO}|${turno}|${status}`;
    if (!mapa.has(chave)) mapa.set(chave, { dataISO, turno, status, quantidade: 0, atualizadoEm: '' });
    const item = mapa.get(chave);
    item.quantidade += 1;
    const atualizado = linha[10] instanceof Date ? linha[10].toISOString() : String(linha[10] || '');
    if (atualizado > item.atualizadoEm) item.atualizadoEm = atualizado;
  });
  const itens = [...mapa.values()]
    .sort((a, b) => b.dataISO.localeCompare(a.dataISO) || a.turno.localeCompare(b.turno) || a.status.localeCompare(b.status))
    .slice(0, maximo);
  return { sucesso: true, itens, atualizadoEm: new Date().toISOString() };
}
function salvarEscalaSabado_(dados) {
  const dataISO = normalizarDataISO_(dados.dataISO || dados.data);
  const turno = turnoCanonico_(dados.turno || '');
  const status = statusEscalaSabado_(dados.status);
  const itens = Array.isArray(dados.itens) ? dados.itens : [];
  if (!dataISO || !dataEhSabado_(dataISO)) throw new Error('Escolha uma data válida de sábado.');
  if (!turno) throw new Error('Turno não informado.');
  if (!itens.length) throw new Error('Selecione pelo menos um colaborador.');

  const ids = new Set();
  itens.forEach(item => {
    const id = String(item.colaboradorId || '').trim();
    const posto = String(item.posto || '').trim();
    if (!id || !String(item.nome || '').trim()) throw new Error('Há colaborador com dados incompletos.');
    if (!posto) throw new Error(`Informe o posto de ${item.nome || 'todos os colaboradores'}.`);
    if (ids.has(id)) throw new Error(`O colaborador ${item.nome} está repetido.`);
    ids.add(id);
  });

  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const aba = planilha.getSheetByName(NOMES_ABAS.sabadosHE);
  removerLinhasEscalaSabado_(aba, dataISO, turno, status === 'RASCUNHO' ? 'RASCUNHO' : '');
  const idEscala = Utilities.getUuid();
  const agora = new Date();
  const dataBR = Utilities.formatDate(dataPorISO_(dataISO), fuso_(), 'dd/MM/yyyy');
  const linhas = itens.map(item => [
    idEscala,
    dataISO,
    dataBR,
    turno,
    status,
    String(item.colaboradorId || ''),
    String(item.nome || '').toUpperCase(),
    String(item.registro || ''),
    String(item.posto || ''),
    String(item.observacao || ''),
    agora
  ]);
  aba.getRange(aba.getLastRow() + 1, 1, linhas.length, CABECALHOS.sabadosHE.length).setValues(linhas);
  SpreadsheetApp.flush();
  registrarHistorico_(status === 'PUBLICADA' ? 'PUBLICAR ESCALA SÁBADO HE' : 'SALVAR RASCUNHO SÁBADO HE', `${dataBR} • ${turno} • ${linhas.length} colaborador(es).`, 'Administrador');
  return { sucesso: true, mensagem: status === 'PUBLICADA' ? 'Escala de sábado publicada.' : 'Rascunho da escala de sábado salvo.', idEscala, dataISO, turno, status, quantidade: linhas.length, versaoApi: VERSAO_API };
}


function removerEscalaSabado_(dados) {
  const dataISO = normalizarDataISO_(dados.dataISO || dados.data);
  const turno = turnoCanonico_(dados.turno || '');
  const status = statusEscalaSabado_(dados.status || 'RASCUNHO');
  if (!dataISO || !dataEhSabado_(dataISO)) throw new Error('Escolha uma data válida de sábado.');
  if (!turno) throw new Error('Turno não informado.');
  if (!['RASCUNHO', 'PUBLICADA'].includes(status)) throw new Error('Status inválido para exclusão.');

  const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(NOMES_ABAS.sabadosHE);
  removerLinhasEscalaSabado_(aba, dataISO, turno, status);
  SpreadsheetApp.flush();
  const dataBR = Utilities.formatDate(dataPorISO_(dataISO), fuso_(), 'dd/MM/yyyy');
  registrarHistorico_(
    status === 'RASCUNHO' ? 'EXCLUIR RASCUNHO SÁBADO HE' : 'EXCLUIR PUBLICAÇÃO SÁBADO HE',
    `${dataBR} • ${turno}`,
    'Administrador'
  );
  return { sucesso: true, dataISO, turno, status, mensagem: status === 'RASCUNHO' ? 'Rascunho excluído.' : 'Publicação excluída.', versaoApi: VERSAO_API };
}

function removerLinhasEscalaSabado_(aba, dataISO, turno, statusFiltro) {
  if (!aba || aba.getLastRow() <= 1) return;
  const quantidade = aba.getLastRow() - 1;
  const valores = aba.getRange(2, 1, quantidade, CABECALHOS.sabadosHE.length).getValues();
  const filtro = String(statusFiltro || '').trim().toUpperCase();
  const mantidas = valores.filter((linha) => {
    const mesmaEscala = normalizarDataISO_(linha[1]) === dataISO && mesmoTurno_(linha[3], turno);
    if (!mesmaEscala) return true;
    // Ao salvar rascunho, preserva a última publicação. Ao publicar, substitui
    // publicação e rascunho da data/turno por uma única versão oficial.
    if (filtro) return statusEscalaSabado_(linha[4]) !== filtro;
    return false;
  });
  aba.getRange(2, 1, quantidade, CABECALHOS.sabadosHE.length).clearContent();
  if (mantidas.length) {
    aba.getRange(2, 1, mantidas.length, CABECALHOS.sabadosHE.length).setValues(mantidas);
  }
}
function dataEhSabado_(dataISO) {
  const data = dataPorISO_(dataISO);
  return Boolean(data && data.getDay() === 6);
}

function dataPorISO_(dataISO) {
  const partes = String(dataISO || '').split('-').map(Number);
  if (partes.length !== 3 || !partes[0] || !partes[1] || !partes[2]) return null;
  const data = new Date(partes[0], partes[1] - 1, partes[2], 12, 0, 0);
  return isNaN(data) ? null : data;
}

function deslocarDataISO_(dataISO, quantidadeDias) {
  const data = dataPorISO_(dataISO);
  if (!data) return '';
  data.setDate(data.getDate() + Number(quantidadeDias || 0));
  return Utilities.formatDate(data, fuso_(), 'yyyy-MM-dd');
}

function salvarFechamento_(dados) {
  const obrigatorios = ['data', 'colaborador', 'registro', 'turno', 'setorPosto', 'quantidade', 'protocolo'];
  obrigatorios.forEach(campo => {
    if (dados[campo] === undefined || dados[campo] === null || String(dados[campo]).trim() === '') throw new Error(`Campo obrigatório não informado: ${campo}.`);
  });
  const quantidade = Number(dados.quantidade);
  if (!Number.isInteger(quantidade) || quantidade <= 0) throw new Error('A quantidade deve ser um número inteiro maior que zero.');

  const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(NOMES_ABAS.fechamento);
  const protocolo = String(dados.protocolo).trim();
  if (protocoloExiste_(aba, protocolo)) {
    return { sucesso: true, duplicado: true, protocolo, mensagem: 'Protocolo já registrado. Nenhuma linha duplicada foi criada.' };
  }

  const criadoEm = new Date();
  const linha = [
    dados.data,
    String(dados.colaborador).trim().toUpperCase(),
    String(dados.registro).trim(),
    String(dados.turno).trim(),
    String(dados.setorPosto).trim(),
    quantidade,
    protocolo,
    dados.dataEnvio || Utilities.formatDate(criadoEm, fuso_(), 'dd/MM/yyyy'),
    dados.horaEnvio || Utilities.formatDate(criadoEm, fuso_(), 'HH:mm:ss'),
    dados.colaboradorId || '',
    dados.dataISO || normalizarDataISO_(dados.data),
    criadoEm
  ];
  aba.appendRow(linha);
  const ultimaLinha = aba.getLastRow();
  aba.getRange(ultimaLinha, 6).setNumberFormat('0');
  aba.getRange(ultimaLinha, 12).setNumberFormat('dd/MM/yyyy HH:mm:ss');
  if (ultimaLinha % 2 === 0) aba.getRange(ultimaLinha, 1, 1, CABECALHOS.fechamento.length).setBackground('#e6faff');

  atualizarRegistroColaborador_(dados.colaboradorId, dados.registro);
  registrarHistorico_('FECHAMENTO DE CARGAS', `${protocolo} • ${dados.colaborador} • ${quantidade} carga(s).`, dados.registro);
  return { sucesso: true, protocolo, mensagem: 'Registro salvo com sucesso.' };
}

function salvarColaborador_(dados) {
  const pessoa = dados.colaborador || {};
  if (!pessoa.id || !pessoa.nome || !pessoa.turno) throw new Error('Dados do colaborador incompletos.');
  const agora = new Date();
  const linha = [pessoa.id, String(pessoa.nome).toUpperCase(), pessoa.registro || '', pessoa.turno, pessoa.ativo !== false, agora];
  upsertPorChave_(NOMES_ABAS.colaboradores, CABECALHOS.colaboradores.length, 1, pessoa.id, linha);
  salvarLinhaEscala_(CHAVE_ESCALA_FIXA, pessoa);
  registrarHistorico_('SALVAR COLABORADOR', `${pessoa.nome} • ${pessoa.turno}.`, 'Administrador');
  return { sucesso: true, mensagem: 'Colaborador salvo.' };
}

function retirarColaborador_(dados) {
  const id = String(dados.colaboradorId || '').trim();
  if (!id) throw new Error('ID do colaborador não informado.');
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const abaCol = planilha.getSheetByName(NOMES_ABAS.colaboradores);
  const abaEscala = planilha.getSheetByName(NOMES_ABAS.escala);
  const linhaCol = localizarLinha_(abaCol, 1, id);
  if (!linhaCol) throw new Error('Colaborador não encontrado.');
  const col = abaCol.getRange(linhaCol, 1, 1, CABECALHOS.colaboradores.length).getValues()[0];
  const pessoa = { id: String(col[0] || '').trim(), nome: String(col[1] || '').trim().toUpperCase(), registro: String(col[2] || '').trim(), turno: turnoCanonico_(col[3] || '1º Turno') };
  if (ehVagaAberta_(pessoa)) throw new Error('Uma vaga A DEFINIR não pode ser retirada da equipe.');

  const valoresEscala = obterValoresSemCabecalho_(abaEscala, CABECALHOS.escala.length);
  const candidatas = [];
  valoresEscala.forEach((linha, indice) => {
    if (String(linha[0] || '') !== CHAVE_ESCALA_FIXA || !valorBooleano_(linha[36])) return;
    const idEscala = String(linha[1] || '').trim();
    const regEscala = String(linha[3] || '').trim();
    const turnoEscala = turnoCanonico_(linha[4] || '');
    const nomeEscala = String(linha[2] || '').trim().toUpperCase();
    const match = idEscala === pessoa.id
      || (pessoa.registro && regEscala === pessoa.registro && mesmoTurno_(turnoEscala, pessoa.turno))
      || (!pessoa.registro && !regEscala && textoChavePessoa_(nomeEscala) === textoChavePessoa_(pessoa.nome) && mesmoTurno_(turnoEscala, pessoa.turno));
    if (match) candidatas.push({ linha: indice + 2, valores: linha });
  });
  const melhor = candidatas.slice().sort((a, b) => b.valores.slice(5, 36).filter(Boolean).length - a.valores.slice(5, 36).filter(Boolean).length)[0];
  const dias = melhor ? melhor.valores.slice(5, 36).map(valor => String(valor || '').trim()) : Array(31).fill('');
  const agora = new Date();
  const vagaId = String(dados.vagaId || '').trim() || `vaga-${slug_(pessoa.turno)}-${Utilities.getUuid().replace(/-/g, '').slice(0, 10)}`;

  const colaboradores = obterValoresSemCabecalho_(abaCol, CABECALHOS.colaboradores.length);
  colaboradores.forEach((linha, indice) => {
    if (!valorBooleano_(linha[4])) return;
    const idLinha = String(linha[0] || '').trim();
    const regLinha = String(linha[2] || '').trim();
    const turnoLinha = turnoCanonico_(linha[3] || '');
    const nomeLinha = String(linha[1] || '').trim().toUpperCase();
    const match = idLinha === pessoa.id
      || (pessoa.registro && regLinha === pessoa.registro && mesmoTurno_(turnoLinha, pessoa.turno))
      || (!pessoa.registro && !regLinha && textoChavePessoa_(nomeLinha) === textoChavePessoa_(pessoa.nome) && mesmoTurno_(turnoLinha, pessoa.turno));
    if (match) { abaCol.getRange(indice + 2, 5).setValue(false); abaCol.getRange(indice + 2, 6).setValue(agora); }
  });
  candidatas.forEach(item => { abaEscala.getRange(item.linha, 37).setValue(false); abaEscala.getRange(item.linha, 38).setValue(agora); });

  const referenciaVaga = registroReferenciaVaga_(pessoa.nome);
  upsertPorChave_(NOMES_ABAS.colaboradores, CABECALHOS.colaboradores.length, 1, vagaId, [vagaId, 'A DEFINIR', referenciaVaga, pessoa.turno, true, agora]);
  salvarLinhaEscala_(CHAVE_ESCALA_FIXA, { id: vagaId, nome: 'A DEFINIR', registro: referenciaVaga, turno: pessoa.turno, ativo: true, dias });
  registrarHistorico_('RETIRAR DA EQUIPE', `${pessoa.nome} • ${pessoa.turno} → A DEFINIR (${vagaId}).`, 'Administrador');
  return { sucesso: true, vagaId, referenciaVaga: pessoa.nome, mensagem: `Colaborador retirado e escala preservada como A DEFINIR — vaga de ${pessoa.nome}.` };
}

function preencherVaga_(dados) {
  const vagaId = String(dados.vagaId || '').trim();
  const colaboradorId = String(dados.colaboradorId || '').trim();
  if (!vagaId || !colaboradorId) throw new Error('Vaga e colaborador precisam ser informados.');
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const abaCol = planilha.getSheetByName(NOMES_ABAS.colaboradores);
  const abaEscala = planilha.getSheetByName(NOMES_ABAS.escala);
  const linhaVagaCol = localizarLinha_(abaCol, 1, vagaId);
  const linhaPessoaCol = localizarLinha_(abaCol, 1, colaboradorId);
  if (!linhaVagaCol) throw new Error('Vaga A DEFINIR não encontrada.');
  if (!linhaPessoaCol) throw new Error('Novo colaborador não encontrado.');
  const vagaCol = abaCol.getRange(linhaVagaCol, 1, 1, CABECALHOS.colaboradores.length).getValues()[0];
  const pessoaCol = abaCol.getRange(linhaPessoaCol, 1, 1, CABECALHOS.colaboradores.length).getValues()[0];
  const vaga = { id: String(vagaCol[0] || ''), nome: String(vagaCol[1] || ''), registro: String(vagaCol[2] || '').trim(), turno: turnoCanonico_(vagaCol[3] || '') };
  const pessoa = { id: String(pessoaCol[0] || ''), nome: String(pessoaCol[1] || '').trim().toUpperCase(), registro: String(pessoaCol[2] || '').trim(), turno: turnoCanonico_(pessoaCol[3] || ''), ativo: valorBooleano_(pessoaCol[4]) };
  if (!ehVagaAberta_(vaga) || !valorBooleano_(vagaCol[4])) throw new Error('A vaga selecionada não está ativa.');
  if (!pessoa.ativo || ehVagaAberta_(pessoa)) throw new Error('Novo colaborador inválido ou inativo.');
  if (!mesmoTurno_(vaga.turno, pessoa.turno)) throw new Error('A vaga e o novo colaborador precisam ser do mesmo turno.');

  const valoresEscala = obterValoresSemCabecalho_(abaEscala, CABECALHOS.escala.length);
  const linhaVaga = valoresEscala.findIndex(linha => String(linha[0] || '') === CHAVE_ESCALA_FIXA && String(linha[1] || '').trim() === vagaId && valorBooleano_(linha[36]));
  if (linhaVaga < 0) throw new Error('Escala da vaga A DEFINIR não encontrada.');
  const diasVaga = valoresEscala[linhaVaga].slice(5, 36).map(valor => String(valor || '').trim());
  const linhasPessoa = valoresEscala.filter(linha => String(linha[0] || '') === CHAVE_ESCALA_FIXA && String(linha[1] || '').trim() === colaboradorId && valorBooleano_(linha[36]));
  if (linhasPessoa.some(linha => linha.slice(5, 36).some(valor => String(valor || '').trim()))) throw new Error('O novo colaborador já possui postos definidos.');

  const agora = new Date();
  // Desativa a vaga antes de salvar a escala do novo colaborador para evitar deslocamento de linha caso o upsert remova duplicidades.
  abaCol.getRange(linhaVagaCol, 5).setValue(false); abaCol.getRange(linhaVagaCol, 6).setValue(agora);
  abaEscala.getRange(linhaVaga + 2, 37).setValue(false); abaEscala.getRange(linhaVaga + 2, 38).setValue(agora);
  salvarLinhaEscala_(CHAVE_ESCALA_FIXA, { ...pessoa, dias: diasVaga, ativo: true });
  const referenciaAnterior = referenciaVagaAberta_(vaga);
  registrarHistorico_('PREENCHER VAGA', `${vagaId}${referenciaAnterior ? ` (vaga de ${referenciaAnterior})` : ''} → ${pessoa.nome} • ${pessoa.turno}.`, 'Administrador');
  return { sucesso: true, mensagem: `Vaga preenchida por ${pessoa.nome}.` };
}

function realocarColaborador_(dados) {
  const colaboradorId = String(dados.colaboradorId || '').trim();
  const vagaDestinoId = String(dados.vagaDestinoId || '').trim();
  const novaVagaId = String(dados.novaVagaId || '').trim() || `vaga-${Utilities.getUuid().replace(/-/g, '').slice(0, 10)}`;
  if (!colaboradorId || !vagaDestinoId || !novaVagaId) throw new Error('Colaborador, vaga de destino e nova vaga precisam ser informados.');
  if (colaboradorId === vagaDestinoId || novaVagaId === colaboradorId || novaVagaId === vagaDestinoId) throw new Error('Identificadores inválidos para a realocação.');

  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const abaCol = planilha.getSheetByName(NOMES_ABAS.colaboradores);
  const abaEscala = planilha.getSheetByName(NOMES_ABAS.escala);
  const linhaPessoaCol = localizarLinha_(abaCol, 1, colaboradorId);
  const linhaVagaCol = localizarLinha_(abaCol, 1, vagaDestinoId);
  if (!linhaPessoaCol) throw new Error('Colaborador a realocar não encontrado.');
  if (!linhaVagaCol) throw new Error('Vaga A DEFINIR de destino não encontrada.');
  if (localizarLinha_(abaCol, 1, novaVagaId)) throw new Error('Já existe uma vaga com o identificador gerado. Tente novamente.');

  const pessoaCol = abaCol.getRange(linhaPessoaCol, 1, 1, CABECALHOS.colaboradores.length).getValues()[0];
  const vagaCol = abaCol.getRange(linhaVagaCol, 1, 1, CABECALHOS.colaboradores.length).getValues()[0];
  const pessoa = {
    id: String(pessoaCol[0] || '').trim(),
    nome: String(pessoaCol[1] || '').trim().toUpperCase(),
    registro: String(pessoaCol[2] || '').trim(),
    turno: turnoCanonico_(pessoaCol[3] || ''),
    ativo: valorBooleano_(pessoaCol[4])
  };
  const vaga = {
    id: String(vagaCol[0] || '').trim(),
    nome: String(vagaCol[1] || '').trim().toUpperCase(),
    registro: String(vagaCol[2] || '').trim(),
    turno: turnoCanonico_(vagaCol[3] || ''),
    ativo: valorBooleano_(vagaCol[4])
  };
  if (!pessoa.ativo || ehVagaAberta_(pessoa)) throw new Error('O colaborador selecionado é inválido ou está inativo.');
  if (!vaga.ativo || !ehVagaAberta_(vaga)) throw new Error('A vaga de destino não está ativa.');
  if (!mesmoTurno_(pessoa.turno, vaga.turno)) throw new Error('O colaborador e a vaga precisam ser do mesmo turno.');

  const valoresEscala = obterValoresSemCabecalho_(abaEscala, CABECALHOS.escala.length);
  const candidatasPessoa = [];
  let indiceVagaDestino = -1;
  valoresEscala.forEach((linha, indice) => {
    if (String(linha[0] || '') !== CHAVE_ESCALA_FIXA || !valorBooleano_(linha[36])) return;
    const idEscala = String(linha[1] || '').trim();
    if (idEscala === vagaDestinoId) indiceVagaDestino = indice;
    const regEscala = String(linha[3] || '').trim();
    const turnoEscala = turnoCanonico_(linha[4] || '');
    const nomeEscala = String(linha[2] || '').trim().toUpperCase();
    const matchPessoa = idEscala === pessoa.id
      || (pessoa.registro && regEscala === pessoa.registro && mesmoTurno_(turnoEscala, pessoa.turno))
      || (!pessoa.registro && !regEscala && textoChavePessoa_(nomeEscala) === textoChavePessoa_(pessoa.nome) && mesmoTurno_(turnoEscala, pessoa.turno));
    if (matchPessoa) candidatasPessoa.push({ indice, linha });
  });
  if (indiceVagaDestino < 0) throw new Error('A escala da vaga A DEFINIR de destino não foi encontrada.');
  const melhorPessoa = candidatasPessoa.slice().sort((a, c) => c.linha.slice(5, 36).filter(Boolean).length - a.linha.slice(5, 36).filter(Boolean).length)[0];
  if (!melhorPessoa) throw new Error('A escala atual do colaborador não foi encontrada.');

  const diasAtuais = melhorPessoa.linha.slice(5, 36).map(valor => String(valor || '').trim());
  const diasDestino = valoresEscala[indiceVagaDestino].slice(5, 36).map(valor => String(valor || '').trim());
  if (!diasAtuais.some(Boolean)) throw new Error('O colaborador não possui uma escala atual para preservar. Use Preencher vaga.');
  if (!diasDestino.some(Boolean)) throw new Error('A vaga de destino não possui postos definidos.');

  const agora = new Date();
  // A vaga de destino deixa de existir porque será assumida pelo colaborador.
  abaCol.getRange(linhaVagaCol, 5).setValue(false);
  abaCol.getRange(linhaVagaCol, 6).setValue(agora);
  abaEscala.getRange(indiceVagaDestino + 2, 37).setValue(false);
  abaEscala.getRange(indiceVagaDestino + 2, 38).setValue(agora);

  // O colaborador recebe os 31 dias da vaga de destino.
  salvarLinhaEscala_(CHAVE_ESCALA_FIXA, { ...pessoa, dias: diasDestino, ativo: true });

  // A posição antiga do colaborador é preservada como uma nova vaga A DEFINIR,
  // mantendo uma referência visual ao antigo ocupante.
  const referenciaNovaVaga = registroReferenciaVaga_(pessoa.nome);
  upsertPorChave_(NOMES_ABAS.colaboradores, CABECALHOS.colaboradores.length, 1, novaVagaId, [novaVagaId, 'A DEFINIR', referenciaNovaVaga, pessoa.turno, true, agora]);
  salvarLinhaEscala_(CHAVE_ESCALA_FIXA, { id: novaVagaId, nome: 'A DEFINIR', registro: referenciaNovaVaga, turno: pessoa.turno, ativo: true, dias: diasAtuais });

  const referenciaDestino = referenciaVagaAberta_(vaga);
  registrarHistorico_('REALOCAR COLABORADOR', `${pessoa.nome} • ${pessoa.turno} assumiu ${vagaDestinoId}${referenciaDestino ? ` (vaga de ${referenciaDestino})` : ''}; posição anterior preservada como ${novaVagaId} (vaga de ${pessoa.nome}).`, 'Administrador');
  return { sucesso: true, novaVagaId, referenciaVaga: pessoa.nome, mensagem: `${pessoa.nome} realocado e posição anterior preservada como A DEFINIR — vaga de ${pessoa.nome}.` };
}

function trocarPosicoes_(dados) {
  const colaboradorAId = String(dados.colaboradorAId || '').trim();
  const colaboradorBId = String(dados.colaboradorBId || '').trim();
  if (!colaboradorAId || !colaboradorBId) throw new Error('Informe os dois colaboradores para realizar a troca.');
  if (colaboradorAId === colaboradorBId) throw new Error('Escolha dois colaboradores diferentes.');

  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const abaCol = planilha.getSheetByName(NOMES_ABAS.colaboradores);
  const abaEscala = planilha.getSheetByName(NOMES_ABAS.escala);
  const linhaACol = localizarLinha_(abaCol, 1, colaboradorAId);
  const linhaBCol = localizarLinha_(abaCol, 1, colaboradorBId);
  if (!linhaACol || !linhaBCol) throw new Error('Um dos colaboradores não foi encontrado no cadastro.');

  const lerPessoa = (linha) => {
    const valores = abaCol.getRange(linha, 1, 1, CABECALHOS.colaboradores.length).getValues()[0];
    return {
      id: String(valores[0] || '').trim(),
      nome: String(valores[1] || '').trim().toUpperCase(),
      registro: String(valores[2] || '').trim(),
      turno: turnoCanonico_(valores[3] || ''),
      ativo: valorBooleano_(valores[4])
    };
  };
  const pessoaA = lerPessoa(linhaACol);
  const pessoaB = lerPessoa(linhaBCol);
  if (!pessoaA.ativo || !pessoaB.ativo) throw new Error('Os dois colaboradores precisam estar ativos.');
  if (ehVagaAberta_(pessoaA) || ehVagaAberta_(pessoaB)) throw new Error('Trocar posições é exclusivo para colaboradores ativos. Para A DEFINIR use Preencher vaga ou Realocar para vaga.');
  const turnoAOriginal = pessoaA.turno;
  const turnoBOriginal = pessoaB.turno;
  const trocaEntreTurnos = !mesmoTurno_(turnoAOriginal, turnoBOriginal);

  const valoresEscala = obterValoresSemCabecalho_(abaEscala, CABECALHOS.escala.length);
  const encontrarMelhor = (pessoa) => {
    const candidatas = [];
    valoresEscala.forEach((linha, indice) => {
      if (String(linha[0] || '') !== CHAVE_ESCALA_FIXA || !valorBooleano_(linha[36])) return;
      const idEscala = String(linha[1] || '').trim();
      const nomeEscala = String(linha[2] || '').trim().toUpperCase();
      const regEscala = String(linha[3] || '').trim();
      const turnoEscala = turnoCanonico_(linha[4] || '');
      const match = idEscala === pessoa.id
        || (pessoa.registro && regEscala === pessoa.registro && mesmoTurno_(turnoEscala, pessoa.turno))
        || (!pessoa.registro && !regEscala && textoChavePessoa_(nomeEscala) === textoChavePessoa_(pessoa.nome) && mesmoTurno_(turnoEscala, pessoa.turno));
      if (match) candidatas.push({ indice, linha });
    });
    return candidatas.sort((a, b) => b.linha.slice(5, 36).filter(Boolean).length - a.linha.slice(5, 36).filter(Boolean).length)[0] || null;
  };

  const escalaA = encontrarMelhor(pessoaA);
  const escalaB = encontrarMelhor(pessoaB);
  if (!escalaA || !escalaB) throw new Error('Não foi possível localizar a escala fixa dos dois colaboradores.');
  const diasA = escalaA.linha.slice(5, 36).map(valor => String(valor || '').trim());
  const diasB = escalaB.linha.slice(5, 36).map(valor => String(valor || '').trim());
  if (!diasA.some(Boolean) || !diasB.some(Boolean)) throw new Error('Os dois colaboradores precisam possuir uma posição na escala fixa.');

  // Os 31 dias são trocados. Quando os colaboradores pertencem a turnos diferentes,
  // cada pessoa também assume o turno da posição recebida. IDs, registros, situações e
  // coberturas continuam vinculados às próprias pessoas.
  const novoTurnoA = turnoBOriginal;
  const novoTurnoB = turnoAOriginal;
  const agora = new Date();
  abaCol.getRange(linhaACol, 4).setValue(novoTurnoA);
  abaCol.getRange(linhaBCol, 4).setValue(novoTurnoB);
  abaCol.getRange(linhaACol, 6).setValue(agora);
  abaCol.getRange(linhaBCol, 6).setValue(agora);

  pessoaA.turno = novoTurnoA;
  pessoaB.turno = novoTurnoB;

  // Situações ativas acompanham a pessoa. Em uma troca entre turnos, atualizamos
  // somente o turno de exibição dessas situações; tipo e período permanecem iguais.
  if (trocaEntreTurnos) {
    const abaSituacoes = planilha.getSheetByName(NOMES_ABAS.situacoes);
    if (abaSituacoes && abaSituacoes.getLastRow() > 1) {
      const valoresSituacoes = obterValoresSemCabecalho_(abaSituacoes, CABECALHOS.situacoes.length);
      valoresSituacoes.forEach((linha, indice) => {
        if (!valorBooleano_(linha[7])) return;
        const colaboradorId = String(linha[1] || '').trim();
        if (colaboradorId === pessoaA.id) {
          abaSituacoes.getRange(indice + 2, 4).setValue(novoTurnoA);
          abaSituacoes.getRange(indice + 2, 10).setValue(agora);
        } else if (colaboradorId === pessoaB.id) {
          abaSituacoes.getRange(indice + 2, 4).setValue(novoTurnoB);
          abaSituacoes.getRange(indice + 2, 10).setValue(agora);
        }
      });
    }
  }

  salvarLinhaEscala_(CHAVE_ESCALA_FIXA, { ...pessoaA, dias: diasB, ativo: true });
  salvarLinhaEscala_(CHAVE_ESCALA_FIXA, { ...pessoaB, dias: diasA, ativo: true });

  const detalheTurno = trocaEntreTurnos
    ? ` Turnos também trocados: ${pessoaA.nome} ${turnoAOriginal}→${novoTurnoA}; ${pessoaB.nome} ${turnoBOriginal}→${novoTurnoB}.`
    : ` Ambos permanecem no ${turnoAOriginal}.`;
  registrarHistorico_('TROCAR POSIÇÕES', `${pessoaA.nome} ↔ ${pessoaB.nome}.${detalheTurno} Os 31 dias da escala fixa foram trocados.`, 'Administrador');
  return { sucesso: true, trocaEntreTurnos, turnoA: novoTurnoA, turnoB: novoTurnoB, mensagem: `${pessoaA.nome} e ${pessoaB.nome} trocaram suas posições${trocaEntreTurnos ? ' e turnos' : ''}.` };
}

function excluirColaborador_(dados) {
  const id = String(dados.colaboradorId || '');
  if (!id) throw new Error('ID do colaborador não informado.');
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const abaColaboradores = planilha.getSheetByName(NOMES_ABAS.colaboradores);
  const abaEscala = planilha.getSheetByName(NOMES_ABAS.escala);
  let removido = false;

  for (let linha = abaColaboradores.getLastRow(); linha >= 2; linha -= 1) {
    if (String(abaColaboradores.getRange(linha, 1).getValue()) === id) {
      abaColaboradores.deleteRow(linha);
      removido = true;
    }
  }

  for (let linha = abaEscala.getLastRow(); linha >= 2; linha -= 1) {
    if (String(abaEscala.getRange(linha, 2).getValue()) === id) {
      abaEscala.deleteRow(linha);
      removido = true;
    }
  }

  if (!removido) throw new Error('Colaborador não encontrado.');
  registrarHistorico_('EXCLUIR COLABORADOR', id, 'Administrador');
  return { sucesso: true, mensagem: 'Colaborador excluído.' };
}

function salvarPosto_(dados) {
  const posto = dados.posto || {};
  if (!posto.codigo || !posto.local) throw new Error('Dados do posto incompletos.');
  const codigoOriginal = String(dados.codigoOriginal || '').trim();
  const codigo = String(posto.codigo || '').trim();
  if (codigoOriginal && codigoOriginal !== codigo) {
    throw new Error('O código do posto não pode ser alterado na edição. Crie um novo posto caso precise de outro código.');
  }
  const linha = [codigo, posto.local, posto.setor || posto.local, posto.ativo !== false, new Date()];
  upsertPorChave_(NOMES_ABAS.postos, CABECALHOS.postos.length, 1, codigo, linha);
  registrarHistorico_('SALVAR POSTO', `${codigo} • ${posto.local}.`, 'Administrador');
  return { sucesso: true, mensagem: 'Posto salvo.' };
}

function excluirPosto_(dados) {
  const codigo = String(dados.codigo || '');
  if (!codigo) throw new Error('Código do posto não informado.');
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const abaPostos = planilha.getSheetByName(NOMES_ABAS.postos);
  const abaEscala = planilha.getSheetByName(NOMES_ABAS.escala);
  let removido = false;

  for (let linha = abaPostos.getLastRow(); linha >= 2; linha -= 1) {
    if (String(abaPostos.getRange(linha, 1).getValue()) === codigo) {
      abaPostos.deleteRow(linha);
      removido = true;
    }
  }

  const quantidadeLinhas = abaEscala.getLastRow() - 1;
  if (quantidadeLinhas > 0) {
    const faixa = abaEscala.getRange(2, 1, quantidadeLinhas, CABECALHOS.escala.length);
    const valores = faixa.getValues();
    let escalaAlterada = false;
    valores.forEach((linha) => {
      for (let coluna = 5; coluna <= 35; coluna += 1) {
        if (String(linha[coluna] || '') === codigo) {
          linha[coluna] = '';
          escalaAlterada = true;
        }
      }
    });
    if (escalaAlterada) faixa.setValues(valores);
  }

  if (!removido) throw new Error('Posto não encontrado.');
  registrarHistorico_('EXCLUIR POSTO', codigo, 'Administrador');
  return { sucesso: true, mensagem: 'Posto excluído.' };
}

function salvarEscala_(dados) {
  const mesAno = CHAVE_ESCALA_FIXA;
  const pessoa = dados.colaborador || {};
  if (!pessoa.id || !pessoa.nome) throw new Error('Colaborador da escala não informado.');
  salvarLinhaEscala_(mesAno, pessoa);
  registrarHistorico_('SALVAR ESCALA', `${pessoa.nome}.`, 'Administrador');
  return { sucesso: true, mensagem: 'Escala salva.' };
}

function salvarLinhaEscala_(mesAno, pessoa) {
  const dias = Array.from({ length: 31 }, (_, i) => pessoa.dias && pessoa.dias[i] || '');
  const turno = turnoCanonico_(pessoa.turno || '1º Turno');
  const registro = String(pessoa.registro || '').trim();
  const nome = String(pessoa.nome || '').trim().toUpperCase();
  const linha = [mesAno, pessoa.id, nome, registro, turno]
    .concat(dias)
    .concat([pessoa.ativo !== false, new Date()]);
  const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(NOMES_ABAS.escala);
  const valores = obterValoresSemCabecalho_(aba, CABECALHOS.escala.length);
  const candidatas = [];

  valores.forEach((existente, indice) => {
    if (String(existente[0] || '') !== String(mesAno)) return;
    const idExistente = String(existente[1] || '').trim();
    const registroExistente = String(existente[3] || '').trim();
    const turnoExistente = turnoCanonico_(existente[4] || '');
    const nomeExistente = String(existente[2] || '').trim().toUpperCase();
    const mesmoId = pessoa.id && idExistente === pessoa.id;
    const vaga = ehVagaAberta_(pessoa);
    const mesmoRegistro = !vaga && registro && registroExistente === registro && mesmoTurno_(turnoExistente, turno);
    const mesmoNomeSemRegistro = !vaga && !registro && !registroExistente && textoChavePessoa_(nomeExistente) === textoChavePessoa_(nome) && mesmoTurno_(turnoExistente, turno);
    if (mesmoId || mesmoRegistro || mesmoNomeSemRegistro) candidatas.push(indice + 2);
  });

  let linhaAlvo = candidatas.find(numeroLinha => String(aba.getRange(numeroLinha, 2).getValue() || '').trim() === String(pessoa.id || '').trim()) || candidatas[0] || 0;
  if (linhaAlvo) {
    aba.getRange(linhaAlvo, 1, 1, linha.length).setValues([linha]);
    // Remove linhas duplicadas antigas da mesma pessoa, preservando apenas a linha atualizada.
    candidatas.filter(numeroLinha => numeroLinha !== linhaAlvo).sort((a, b) => b - a).forEach(numeroLinha => aba.deleteRow(numeroLinha));
  } else {
    aba.appendRow(linha);
  }
}


function normalizarSituacao_(valor) {
  const original = String(valor || '').trim().toUpperCase();
  const semAcento = original.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const mapa = {
    'FALTA': 'AUSÊNCIA',
    'AUSENCIA': 'AUSÊNCIA',
    'FERIAS': 'FÉRIAS',
    'ATESTADO MEDICO': 'ATESTADO',
    'LICENCA MEDICA': 'ATESTADO',
    'AFASTAMENTO': 'AFASTAMENTO',
    'TREINAMENTO': 'TREINAMENTO',
    'FOLGA': 'FOLGA'
  };
  return mapa[semAcento] || original;
}

function situacaoValida_(valor) {
  return ['FOLGA', 'FÉRIAS', 'AUSÊNCIA', 'ATESTADO', 'AFASTAMENTO', 'TREINAMENTO'].includes(normalizarSituacao_(valor));
}

function lerSituacoes_() {
  const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(NOMES_ABAS.situacoes);
  if (!aba) return [];
  return obterValoresSemCabecalho_(aba, CABECALHOS.situacoes.length)
    .map(linha => ({
      id: String(linha[0] || ''),
      colaboradorId: String(linha[1] || ''),
      nome: String(linha[2] || '').toUpperCase(),
      turno: turnoCanonico_(linha[3] || ''),
      tipo: normalizarSituacao_(linha[4] || ''),
      inicio: normalizarDataISO_(linha[5]),
      fim: normalizarDataISO_(linha[6]),
      ativo: valorBooleano_(linha[7]),
      criadoEm: linha[8] instanceof Date ? linha[8].toISOString() : String(linha[8] || ''),
      atualizadoEm: linha[9] instanceof Date ? linha[9].toISOString() : String(linha[9] || '')
    }))
    .filter(item => item.id && item.colaboradorId && situacaoValida_(item.tipo) && item.inicio && item.fim && item.ativo);
}

function lerCoberturas_() {
  const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(NOMES_ABAS.coberturas);
  if (!aba) return [];
  return obterValoresSemCabecalho_(aba, CABECALHOS.coberturas.length)
    .map(linha => {
      const modo = String(linha[10] || '').trim().toUpperCase() === 'POSTO' ? 'POSTO' : 'COLABORADOR';
      return {
        id: String(linha[0] || ''),
        origemId: String(linha[1] || ''),
        nomeOrigem: String(linha[2] || '').toUpperCase(),
        destinoId: String(linha[3] || ''),
        nomeDestino: String(linha[4] || '').toUpperCase(),
        inicio: normalizarDataISO_(linha[5]),
        fim: normalizarDataISO_(linha[6]),
        ativo: valorBooleano_(linha[7]),
        criadoEm: linha[8] instanceof Date ? linha[8].toISOString() : String(linha[8] || ''),
        atualizadoEm: linha[9] instanceof Date ? linha[9].toISOString() : String(linha[9] || ''),
        modo,
        postoFonte: String(linha[11] || '').trim()
      };
    })
    .filter(item => item.id && item.origemId && (item.modo === 'POSTO' ? item.postoFonte : item.destinoId) && item.inicio && item.fim && item.ativo);
}

function salvarSituacao_(dados) {
  const item = dados.situacao || {};
  const colaboradorId = String(item.colaboradorId || '').trim();
  const tipo = normalizarSituacao_(item.tipo || item.situacao);
  const inicio = normalizarDataISO_(item.inicio || item.dataInicial);
  const fim = normalizarDataISO_(item.fim || item.dataFinal);
  if (!colaboradorId || !situacaoValida_(tipo) || !inicio || !fim) throw new Error('Dados da situação incompletos.');
  if (fim < inicio) throw new Error('A data final não pode ser anterior à data inicial.');
  const colaborador = lerColaboradoresAtivos_().find(p => p.id === colaboradorId);
  if (!colaborador) throw new Error('Colaborador não encontrado.');
  const agora = new Date();
  const id = String(item.id || Utilities.getUuid());
  const linha = [id, colaboradorId, colaborador.nome, turnoCanonico_(colaborador.turno), tipo, inicio, fim, true, item.criadoEm ? new Date(item.criadoEm) : agora, agora];
  upsertPorChave_(NOMES_ABAS.situacoes, CABECALHOS.situacoes.length, 1, id, linha);
  registrarHistorico_('SALVAR SITUAÇÃO', `${colaborador.nome} • ${tipo} • ${inicio} a ${fim}.`, 'Administrador');
  return { sucesso: true, id, mensagem: 'Situação salva.' };
}

function removerSituacao_(dados) {
  const id = String(dados.situacaoId || dados.id || '').trim();
  const colaboradorId = String(dados.colaboradorId || '').trim();
  const inicio = normalizarDataISO_(dados.inicio || dados.dataInicial);
  const fim = normalizarDataISO_(dados.fim || dados.dataFinal);
  const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(NOMES_ABAS.situacoes);
  if (!aba || aba.getLastRow() <= 1) throw new Error('Nenhuma situação cadastrada.');
  const valores = obterValoresSemCabecalho_(aba, CABECALHOS.situacoes.length);
  let removidos = 0;
  valores.forEach((linha, idx) => {
    const mesmoId = id && String(linha[0] || '') === id;
    const mesmoColaborador = colaboradorId && String(linha[1] || '') === colaboradorId;
    const iniLinha = normalizarDataISO_(linha[5]);
    const fimLinha = normalizarDataISO_(linha[6]);
    const sobrepoe = inicio && fim && iniLinha && fimLinha && iniLinha <= fim && fimLinha >= inicio;
    if ((mesmoId || (mesmoColaborador && sobrepoe)) && valorBooleano_(linha[7])) {
      aba.getRange(idx + 2, 8).setValue(false);
      aba.getRange(idx + 2, 10).setValue(new Date());
      removidos += 1;
    }
  });
  if (!removidos) throw new Error('Não existe situação ativa correspondente ao período informado.');
  registrarHistorico_('REMOVER SITUAÇÃO', id || `${colaboradorId} • ${inicio} a ${fim}`, 'Administrador');
  return { sucesso: true, removidos, mensagem: 'Situação removida.' };
}

function salvarCobertura_(dados) {
  const item = dados.cobertura || {};
  const origemId = String(item.origemId || '').trim();
  const modo = String(item.modo || item.tipoCobertura || '').trim().toUpperCase() === 'POSTO' ? 'POSTO' : 'COLABORADOR';
  const destinoId = modo === 'COLABORADOR' ? String(item.destinoId || '').trim() : '';
  const postoFonte = modo === 'POSTO' ? String(item.postoFonte || item.postoOrigem || '').trim() : '';
  const inicio = normalizarDataISO_(item.inicio || item.dataInicial);
  const fim = normalizarDataISO_(item.fim || item.dataFinal);
  if (!origemId || !inicio || !fim) throw new Error('Dados da cobertura incompletos.');
  if (modo === 'COLABORADOR' && (!destinoId || origemId === destinoId)) throw new Error('Selecione outro colaborador para a cobertura.');
  if (modo === 'POSTO' && !postoFonte) throw new Error('Posto de origem da cobertura não informado.');
  if (fim < inicio) throw new Error('A data final não pode ser anterior à data inicial.');

  const colaboradores = lerColaboradoresAtivos_();
  const origem = colaboradores.find(p => p.id === origemId);
  if (!origem) throw new Error('Colaborador a ser coberto não encontrado.');
  const destino = modo === 'COLABORADOR' ? colaboradores.find(p => p.id === destinoId) : null;
  if (modo === 'COLABORADOR' && !destino) throw new Error('Colaborador que fará a cobertura não encontrado.');
  if (modo === 'POSTO') {
    const postos = lerPostosAtivos_();
    if (!postos[postoFonte]) throw new Error('Posto escolhido para cobertura não encontrado ou inativo.');
  }

  const agora = new Date();
  const id = String(item.id || Utilities.getUuid());
  const nomeDestino = destino ? destino.nome : '';
  const linha = [id, origemId, origem.nome, destinoId, nomeDestino, inicio, fim, true, item.criadoEm ? new Date(item.criadoEm) : agora, agora, modo, postoFonte];
  upsertPorChave_(NOMES_ABAS.coberturas, CABECALHOS.coberturas.length, 1, id, linha);
  const detalhe = modo === 'POSTO'
    ? `Quem estiver no posto ${postoFonte} cobre ${origem.nome} • ${inicio} a ${fim}.`
    : `${destino.nome} cobre ${origem.nome} • ${inicio} a ${fim}.`;
  registrarHistorico_('SALVAR COBERTURA', detalhe, 'Administrador');
  return { sucesso: true, id, mensagem: 'Cobertura salva.' };
}

function removerCobertura_(dados) {
  const id = String(dados.coberturaId || dados.id || '').trim();
  if (!id) throw new Error('Cobertura não informada.');
  const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(NOMES_ABAS.coberturas);
  const linha = localizarLinha_(aba, 1, id);
  if (!linha) throw new Error('Cobertura não encontrada.');
  aba.getRange(linha, 8).setValue(false);
  aba.getRange(linha, 10).setValue(new Date());
  registrarHistorico_('REMOVER COBERTURA', id, 'Administrador');
  return { sucesso: true, mensagem: 'Cobertura removida.' };
}

function separarValorDiaLegado_(valor) {
  const texto = String(valor || '').trim();
  if (!texto) return { posto: '', situacao: '' };
  const separador = '@@SITUACAO@@';
  const indice = texto.indexOf(separador);
  if (indice >= 0) {
    const posto = String(texto.slice(0, indice) || '').trim();
    const situacao = normalizarSituacao_(texto.slice(indice + separador.length));
    return { posto, situacao: situacaoValida_(situacao) ? situacao : '' };
  }
  const situacao = normalizarSituacao_(texto);
  if (situacaoValida_(situacao)) return { posto: '', situacao };
  return { posto: texto, situacao: '' };
}

function postoReferenciaInicial_(nome, turno, indiceDia) {
  const nomeAlvo = slug_(nome);
  const turnoAlvo = normalizarTurnoComparacao_(turno);
  const pessoa = (DADOS_INICIAIS.escala || []).find(item => slug_(item.nome) === nomeAlvo && normalizarTurnoComparacao_(item.turno) === turnoAlvo);
  return String(pessoa && pessoa.dias && pessoa.dias[indiceDia] || '');
}

function dataISOParaDiaNoMes_(anoMes, dia) {
  const valor = `${anoMes}-${String(dia).padStart(2, '0')}`;
  const data = dataPorISO_(valor);
  if (!data || Utilities.formatDate(data, fuso_(), 'yyyy-MM-dd') !== valor) return '';
  return valor;
}

function migrarSituacoesLegadas_() {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const abaEscala = planilha.getSheetByName(NOMES_ABAS.escala);
  const abaSituacoes = planilha.getSheetByName(NOMES_ABAS.situacoes);
  if (!abaEscala || !abaSituacoes || abaEscala.getLastRow() <= 1) return 0;
  const anoMes = mesAtual_();
  const existentes = lerSituacoes_();
  const chaveExistente = new Set(existentes.map(item => `${item.colaboradorId}|${item.tipo}|${item.inicio}|${item.fim}`));
  const valores = obterValoresSemCabecalho_(abaEscala, CABECALHOS.escala.length);
  let migradas = 0;

  valores.forEach((linha, idx) => {
    if (String(linha[0] || '') !== CHAVE_ESCALA_FIXA || !valorBooleano_(linha[36])) return;
    const colaboradorId = String(linha[1] || '');
    const nome = String(linha[2] || '').toUpperCase();
    const turno = turnoCanonico_(linha[4] || '');
    let alterouLinha = false;
    let bloco = null;
    const blocos = [];

    for (let dia = 1; dia <= 31; dia += 1) {
      const indice = 4 + dia;
      const partes = separarValorDiaLegado_(linha[indice]);
      if (partes.situacao) {
        const posto = partes.posto || postoReferenciaInicial_(nome, turno, dia - 1);
        linha[indice] = posto;
        alterouLinha = true;
        if (bloco && bloco.tipo === partes.situacao && bloco.fimDia === dia - 1) {
          bloco.fimDia = dia;
        } else {
          bloco = { tipo: partes.situacao, inicioDia: dia, fimDia: dia };
          blocos.push(bloco);
        }
      } else {
        bloco = null;
      }
    }

    if (alterouLinha) {
      linha[37] = new Date();
      abaEscala.getRange(idx + 2, 1, 1, CABECALHOS.escala.length).setValues([linha]);
    }

    blocos.forEach(item => {
      const inicio = dataISOParaDiaNoMes_(anoMes, item.inicioDia);
      const fim = dataISOParaDiaNoMes_(anoMes, item.fimDia);
      if (!inicio || !fim) return;
      const chave = `${colaboradorId}|${item.tipo}|${inicio}|${fim}`;
      if (chaveExistente.has(chave)) return;
      const agora = new Date();
      abaSituacoes.appendRow([Utilities.getUuid(), colaboradorId, nome, turno, item.tipo, inicio, fim, true, agora, agora]);
      chaveExistente.add(chave);
      migradas += 1;
    });
  });

  if (migradas) registrarHistorico_('MIGRAR SITUAÇÕES LEGADAS', `${migradas} período(s) convertido(s) para datas reais.`, 'Sistema');
  return migradas;
}

function substituirColaborador_(dados) {
  const mesAno = CHAVE_ESCALA_FIXA;
  const diaInicio = Number(dados.diaInicio || 1);
  if (diaInicio < 1 || diaInicio > 31) throw new Error('Dia inicial inválido.');
  const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(NOMES_ABAS.escala);
  const linhaOrigem = localizarLinhaComposta_(aba, 1, mesAno, 2, dados.origemId);
  const linhaDestino = localizarLinhaComposta_(aba, 1, mesAno, 2, dados.destinoId);
  if (!linhaOrigem || !linhaDestino) throw new Error('As duas escalas precisam estar cadastradas.');

  const origem = aba.getRange(linhaOrigem, 1, 1, CABECALHOS.escala.length).getValues()[0];
  const destino = aba.getRange(linhaDestino, 1, 1, CABECALHOS.escala.length).getValues()[0];
  for (let dia = diaInicio; dia <= 31; dia++) {
    const indice = 4 + dia;
    destino[indice] = origem[indice] || '';
    origem[indice] = '';
  }
  origem[37] = new Date();
  destino[37] = new Date();
  aba.getRange(linhaOrigem, 1, 1, origem.length).setValues([origem]);
  aba.getRange(linhaDestino, 1, 1, destino.length).setValues([destino]);

  const nomeOrigem = origem[2];
  const nomeDestino = destino[2];
  SpreadsheetApp.getActiveSpreadsheet().getSheetByName(NOMES_ABAS.substituicoes).appendRow([
    Utilities.getUuid(), mesAno, dados.origemId, nomeOrigem, dados.destinoId, nomeDestino, diaInicio, new Date()
  ]);
  registrarHistorico_('SUBSTITUIÇÃO', `${nomeOrigem} → ${nomeDestino} • dia ${diaInicio}.`, 'Administrador');
  return { sucesso: true, mensagem: 'Substituição aplicada.' };
}

function sincronizarTudo_(dados) {
  const mesAno = CHAVE_ESCALA_FIXA;
  const postos = dados.postos || {};
  const escala = Array.isArray(dados.escala) ? dados.escala : [];
  Object.keys(postos).forEach(codigo => salvarPosto_({ posto: { codigo, ...postos[codigo] } }));
  escala.forEach(pessoa => {
    salvarColaborador_({ colaborador: pessoa });
    salvarLinhaEscala_(mesAno, pessoa);
  });
  registrarHistorico_('SINCRONIZAÇÃO COMPLETA', `${escala.length} colaborador(es).`, 'Administrador');
  return { sucesso: true, mensagem: 'Sincronização concluída.' };
}

function lerColaboradoresAtivos_() {
  const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(NOMES_ABAS.colaboradores);
  return obterValoresSemCabecalho_(aba, CABECALHOS.colaboradores.length)
    .map(linha => ({
      id: String(linha[0] || '').trim(),
      nome: String(linha[1] || '').trim().toUpperCase(),
      registro: String(linha[2] || '').trim(),
      turno: turnoCanonico_(linha[3] || ''),
      ativo: valorBooleano_(linha[4]),
      atualizadoEm: linha[5] instanceof Date ? linha[5].toISOString() : String(linha[5] || '')
    }))
    .filter(item => item.id && item.nome && item.ativo);
}

function lerPostosAtivos_() {
  const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(NOMES_ABAS.postos);
  const postos = {};
  obterValoresSemCabecalho_(aba, CABECALHOS.postos.length).forEach(linha => {
    const codigo = String(linha[0] || '');
    if (codigo && valorBooleano_(linha[3])) postos[codigo] = { local: String(linha[1] || codigo), setor: String(linha[2] || linha[1] || codigo), ativo: true };
  });
  return postos;
}

function atualizarRegistroColaborador_(id, registro) {
  if (!id || !registro) return;
  const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(NOMES_ABAS.colaboradores);
  const linha = localizarLinha_(aba, 1, id);
  if (!linha) return;
  aba.getRange(linha, 3).setValue(String(registro));
  aba.getRange(linha, 6).setValue(new Date());
}

function protocoloExiste_(aba, protocolo) {
  if (aba.getLastRow() <= 1) return false;
  return Boolean(aba.getRange(2, 7, aba.getLastRow() - 1, 1).createTextFinder(protocolo).matchEntireCell(true).findNext());
}

function upsertPorChave_(nomeAba, quantidadeColunas, colunaChave, chave, linha) {
  const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(nomeAba);
  const existente = localizarLinha_(aba, colunaChave, chave);
  if (existente) aba.getRange(existente, 1, 1, quantidadeColunas).setValues([linha]);
  else aba.appendRow(linha);
}

function localizarLinha_(aba, coluna, valor) {
  if (!valor || aba.getLastRow() <= 1) return 0;
  const encontrado = aba.getRange(2, coluna, aba.getLastRow() - 1, 1).createTextFinder(String(valor)).matchEntireCell(true).findNext();
  return encontrado ? encontrado.getRow() : 0;
}

function localizarLinhaComposta_(aba, colunaA, valorA, colunaB, valorB) {
  if (aba.getLastRow() <= 1) return 0;
  const valores = aba.getRange(2, 1, aba.getLastRow() - 1, Math.max(colunaA, colunaB)).getValues();
  for (let i = 0; i < valores.length; i++) {
    if (String(valores[i][colunaA - 1]) === String(valorA) && String(valores[i][colunaB - 1]) === String(valorB)) return i + 2;
  }
  return 0;
}

function obterValoresSemCabecalho_(aba, colunas) {
  const linhas = aba.getLastRow() - 1;
  return linhas > 0 ? aba.getRange(2, 1, linhas, colunas).getValues() : [];
}

function validarAdmin_(senha) {
  if (!senha) throw new Error('Senha administrativa não informada.');
  const esperado = PropertiesService.getScriptProperties().getProperty(PROPRIEDADE_HASH_ADMIN) || HASH_ADMIN_PADRAO;
  if (sha256_(String(senha)) !== esperado) throw new Error('Senha administrativa inválida.');
}

function registrarHistorico_(acao, detalhes, usuario) {
  const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(NOMES_ABAS.historico);
  if (aba) aba.appendRow([new Date(), acao, detalhes, usuario || 'Sistema']);
}

function lerCorpo_(e) {
  if (e && e.postData && e.postData.contents) {
    try { return JSON.parse(e.postData.contents); } catch (_) { /* tenta parâmetros */ }
  }
  return (e && e.parameter) || {};
}

function responder_(objeto, callback) {
  const json = JSON.stringify(objeto);
  const callbackSeguro = String(callback || '');
  if (callbackSeguro && /^[A-Za-z_$][0-9A-Za-z_$]*$/.test(callbackSeguro)) {
    return ContentService.createTextOutput(`${callbackSeguro}(${json});`).setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

function sha256_(texto) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, texto, Utilities.Charset.UTF_8)
    .map(byte => (byte < 0 ? byte + 256 : byte).toString(16).padStart(2, '0'))
    .join('');
}

function slug_(texto) {
  return String(texto || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase();
}

function valorBooleano_(valor) {
  if (valor === false || String(valor).toLowerCase() === 'false' || String(valor) === '0') return false;
  return true;
}

function mesAtual_() {
  return Utilities.formatDate(new Date(), fuso_(), 'yyyy-MM');
}

function fuso_() {
  return Session.getScriptTimeZone() || 'America/Sao_Paulo';
}

function normalizarTurnoComparacao_(valor) {
  const texto = String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[º°ª]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
  const numero = (texto.match(/[123]/) || [])[0];
  return numero ? `${numero} TURNO` : texto;
}

function mesmoTurno_(valorA, valorB) {
  return normalizarTurnoComparacao_(valorA) === normalizarTurnoComparacao_(valorB);
}

function turnoCanonico_(valor) {
  const normalizado = normalizarTurnoComparacao_(valor);
  const numero = (normalizado.match(/[123]/) || [])[0];
  return numero ? `${numero}º Turno` : String(valor || '').trim();
}

function statusEscalaSabado_(valor) {
  return String(valor || 'RASCUNHO').trim().toUpperCase() === 'PUBLICADA' ? 'PUBLICADA' : 'RASCUNHO';
}

function normalizarDataISO_(valor) {
  if (valor instanceof Date && !isNaN(valor)) return Utilities.formatDate(valor, fuso_(), 'yyyy-MM-dd');
  const texto = String(valor || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) return texto;
  const partes = texto.split('/');
  if (partes.length === 3) return `${partes[2]}-${partes[1].padStart(2, '0')}-${partes[0].padStart(2, '0')}`;
  return '';
}

function textoData_(valor) {
  if (valor instanceof Date && !isNaN(valor)) return Utilities.formatDate(valor, fuso_(), 'dd/MM/yyyy');
  return String(valor || '');
}

function textoHora_(valor) {
  if (valor instanceof Date && !isNaN(valor)) return Utilities.formatDate(valor, fuso_(), 'HH:mm:ss');
  return String(valor || '');
}

function mensagemErro_(erro) {
  return erro && erro.message ? erro.message : String(erro || 'Erro desconhecido.');
}
