const CONFIG = {
  mes: '09/2025',
  equipe: '9132',
  turno: '1º Turno',
  turnos: ['1º Turno', '2º Turno', '3º Turno'],
  titulo: 'Escala de Trabalho - Equipe 9132'
};

const LEGENDA = {
  '69': { local: 'Pátio central', setor: 'Carregamento' },
  '70': { local: 'Pátio central', setor: 'Carregamento' },
  'CMP': { local: 'Pátio central', setor: 'Carregamento' },
  '71': { local: 'G89', setor: 'Caixaria' },
  '72': { local: 'G04', setor: 'JIT' },
  '73': { local: 'G04', setor: 'JIT' },
  '74': { local: 'Pensilina', setor: 'Pensilina' },
  '75': { local: 'Pensilina', setor: 'Pensilina' },
  '76': { local: 'Pensilina', setor: 'Pensilina' },
  '77': { local: 'Pensilina', setor: 'Pensilina' },
  'G38': { local: 'Ilha ecológica', setor: 'Ilha ecológica' },
  'G15': { local: 'Pátio de sucatas', setor: 'Pátio de sucatas' },
  'G76': { local: 'Galpão 76', setor: 'Expedição vasilhame' },
  '66AU': { local: 'G9', setor: 'FTP' },
  'INT-89': { local: 'Interni', setor: 'Interni' },
  'FPT/CX': { local: 'G8 FPT', setor: 'Caixaria' },
  'RÁDIO': { local: 'Central de Segurança', setor: 'Disponível para demandas' },
  'Pens.': { local: 'Pensilina', setor: 'Pensilina' },
  'Ilha': { local: 'Ilha ecológica', setor: 'Ilha ecológica' },
  'FPT-CX': { local: 'G8 FPT', setor: 'Caixaria' }
};

const CICLO = ['69','72','74','INT-89','77','CMP','73','66AU','70','75','71','76','G76','RÁDIO','FPT/CX'];
function cicloAPartir(inicio, qtd = 31) {
  const i = CICLO.indexOf(inicio);
  const start = i >= 0 ? i : 0;
  return Array.from({ length: qtd }, (_, n) => CICLO[(start + n) % CICLO.length]);
}

const ESCALA_SEGUNDO_TURNO_2023 = [
  { nome: 'RENATO', turno: '2º Turno', dias: ['Ilha', 'Ilha', 'Ilha', 'Ilha', 'Ilha', 'Ilha', 'Ilha', 'Ilha', 'Ilha', 'Ilha', 'Ilha', 'Ilha', 'Ilha', 'Ilha', 'Ilha', 'Ilha', 'Ilha', 'Ilha', 'Ilha', 'Ilha', 'Ilha', 'Ilha', 'Ilha', 'Ilha', 'Ilha', 'Ilha', 'Ilha', 'Ilha', 'Ilha', 'Ilha', 'Ilha'] },
  { nome: 'GERMANO', turno: '2º Turno', dias: ['Pens.', 'Pens.', 'Pens.', 'Pens.', 'Pens.', 'Pens.', 'Pens.', 'Pens.', 'Pens.', 'Pens.', 'Pens.', 'Pens.', 'Pens.', 'Pens.', 'Pens.', 'Pens.', 'Pens.', 'Pens.', 'Pens.', 'Pens.', 'Pens.', 'Pens.', 'Pens.', 'Pens.', 'Pens.', 'Pens.', 'Pens.', 'Pens.', 'Pens.', 'Pens.', 'Pens.'] },
  { nome: 'JUNIOR', turno: '2º Turno', dias: ['Pens.', 'Pens.', 'Pens.', 'Pens.', 'Pens.', 'Pens.', 'Pens.', 'Pens.', 'Pens.', 'Pens.', 'Pens.', 'Pens.', 'Pens.', 'Pens.', 'Pens.', 'Pens.', 'Pens.', 'Pens.', 'Pens.', 'Pens.', 'Pens.', 'Pens.', 'Pens.', 'Pens.', 'Pens.', 'Pens.', 'Pens.', 'Pens.', 'Pens.', 'Pens.', 'Pens.'] },
  { nome: 'ROGERIO', turno: '2º Turno', dias: ['INT-89', '77', 'FPT-CX', '70', '66AU', '73', '76', '69', '75', '72', '71', '74', 'INT-89', '77', 'FPT-CX', '70', '66AU', '73', '76', '69', '75', '72', '71', '74', 'INT-89', '77', 'FPT-CX', '70', '66AU', '73', '76'] },
  { nome: 'CLAYTON', turno: '2º Turno', dias: ['69', '75', '72', '71', '74', 'INT-89', '77', 'FPT-CX', '70', '66AU', '73', '76', '69', '75', '72', '71', '74', 'INT-89', '77', 'FPT-CX', '70', '66AU', '73', '76', '69', '75', '72', '71', '74', 'INT-89', '77'] },
  { nome: 'NOGUEIRA', turno: '2º Turno', dias: ['FPT-CX', '70', '66AU', '73', '76', '69', '75', '72', '71', '74', 'INT-89', '77', 'FPT-CX', '70', '66AU', '73', '76', '69', '75', '72', '71', '74', 'INT-89', '77', 'FPT-CX', '70', '66AU', '73', '76', '69', '75'] },
  { nome: 'WELINGTON', turno: '2º Turno', dias: ['72', '71', '74', 'INT-89', '77', 'FPT-CX', '70', '66AU', '73', '76', '69', '75', '72', '71', '74', 'INT-89', '77', 'FPT-CX', '70', '66AU', '73', '76', '69', '75', '72', '71', '74', 'INT-89', '77', 'FPT-CX', '70'] },
  { nome: 'GIDEÃO', turno: '2º Turno', dias: ['66AU', '73', '76', '69', '75', '72', '71', '74', 'INT-89', '77', 'FPT-CX', '70', '66AU', '73', '76', '69', '75', '72', '71', '74', 'INT-89', '77', 'FPT-CX', '70', '66AU', '73', '76', '69', '75', '72', '71'] },
  { nome: 'HUDSON', turno: '2º Turno', dias: ['74', 'INT-89', '77', 'FPT-CX', '70', '66AU', '73', '76', '69', '75', '72', '71', '74', 'INT-89', '77', 'FPT-CX', '70', '66AU', '73', '76', '69', '75', '72', '71', '74', 'INT-89', '77', 'FPT-CX', '70', '66AU', '73'] },
  { nome: 'AROLDO', turno: '2º Turno', dias: ['76', '69', '75', '72', '71', '74', 'INT-89', '77', 'FPT-CX', '70', '66AU', '73', '76', '69', '75', '72', '71', '74', 'INT-89', '77', 'FPT-CX', '70', '66AU', '73', '76', '69', '75', '72', '71', '74', 'INT-89'] },
  { nome: 'JOSÉ', turno: '2º Turno', dias: ['77', 'FPT-CX', '70', '66AU', '73', '76', '69', '75', '72', '71', '74', 'INT-89', '77', 'FPT-CX', '70', '66AU', '73', '76', '69', '75', '72', '71', '74', 'INT-89', '77', 'FPT-CX', '70', '66AU', '73', '76', '69'] },
  { nome: 'CAMILO', turno: '2º Turno', dias: ['75', '72', '71', '74', 'INT-89', '77', 'FPT-CX', '70', '66AU', '73', '76', '69', '75', '72', '71', '74', 'INT-89', '77', 'FPT-CX', '70', '66AU', '73', '76', '69', '75', '72', '71', '74', 'INT-89', '77', 'FPT-CX'] },
  { nome: 'ERCI', turno: '2º Turno', dias: ['70', '66AU', '73', '76', '69', '75', '72', '71', '74', 'INT-89', '77', 'FPT-CX', '70', '66AU', '73', '76', '69', '75', '72', '71', '74', 'INT-89', '77', 'FPT-CX', '70', '66AU', '73', '76', '69', '75', '72'] },
  { nome: 'MARCOS', turno: '2º Turno', dias: ['71', '74', 'INT-89', '77', 'FPT-CX', '70', '66AU', '73', '76', '69', '75', '72', '71', '74', 'INT-89', '77', 'FPT-CX', '70', '66AU', '73', '76', '69', '75', '72', '71', '74', 'INT-89', '77', 'FPT-CX', '70', '66AU'] },
  { nome: 'LEONEL', turno: '2º Turno', dias: ['73', '76', '69', '75', '72', '71', '74', 'INT-89', '77', 'FPT-CX', '70', '66AU', '73', '76', '69', '75', '72', '71', '74', 'INT-89', '77', 'FPT-CX', '70', '66AU', '73', '76', '69', '75', '72', '71', '74'] }
];

const ESCALA = [
  { nome: 'VANDER', turno: '1º Turno', dias: Array(31).fill('G15') },
  { nome: 'PIERRE', turno: '1º Turno', dias: Array(31).fill('G38') },
  { nome: 'DANIEL', turno: '1º Turno', dias: Array(31).fill('Pens.') },
  { nome: 'POLIANA S.', turno: '1º Turno', dias: Array(31).fill('Pens.') },
  { nome: 'VIANA', turno: '1º Turno', dias: cicloAPartir('71') },
  { nome: 'JULIANO', turno: '1º Turno', dias: cicloAPartir('69') },
  { nome: 'AIMEN', turno: '1º Turno', dias: cicloAPartir('72') },
  { nome: 'CARLOS', turno: '1º Turno', dias: cicloAPartir('74') },
  { nome: 'GINALDO', turno: '1º Turno', dias: cicloAPartir('INT-89') },
  { nome: 'JAIR', turno: '1º Turno', dias: cicloAPartir('77') },
  { nome: 'DORIEL', turno: '1º Turno', dias: cicloAPartir('CMP') },
  { nome: 'POLIANA G.', turno: '1º Turno', dias: cicloAPartir('73') },
  { nome: 'RENATO', turno: '1º Turno', dias: cicloAPartir('66AU') },
  { nome: 'MAXILENE', turno: '1º Turno', dias: cicloAPartir('70') },
  { nome: 'ADRIANA', turno: '1º Turno', dias: cicloAPartir('75') },
  { nome: 'REGINALDO', turno: '1º Turno', dias: cicloAPartir('76') },
  { nome: 'AMANDA', turno: '1º Turno', dias: cicloAPartir('G76') },
  { nome: 'FABIANA', turno: '1º Turno', dias: cicloAPartir('RÁDIO') },
  { nome: 'CINTIA', turno: '1º Turno', dias: cicloAPartir('FPT/CX') }
];
