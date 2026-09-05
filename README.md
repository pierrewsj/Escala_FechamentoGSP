## Versão 2.6.3 — revisão de listas, toque e menu do Admin

- Corrigido o texto “opções” nos modais de pesquisa.
- As listas de Trocar posições passam a usar a mesma base completa de colaboradores dos 1º, 2º e 3º turnos.
- Colaboradores sem escala fixa continuam visíveis nas listas, identificados como SEM ESCALA FIXA; eles ficam indisponíveis para uma troca de duas posições até receberem uma escala.
- O segundo seletor mantém a mesma lista do primeiro; a pessoa já escolhida aparece como JÁ SELECIONADO, evitando a impressão de que nomes desapareceram.
- No celular, deslizar o dedo sobre um campo de seleção não abre mais o modal. O modal só abre quando o gesto termina como toque.
- O campo de pesquisa dos modais não abre mais o teclado automaticamente em dispositivos touch.
- O Admin agora inicia com todos os módulos fechados e possui um Menu do Admin com quatro botões: Cadastros e movimentações, Escala fixa, Situações e coberturas e Sábado HE. Apenas um módulo fica aberto por vez.
- Apps Script permanece compatível com a versão 2.5.9; nenhuma alteração de servidor é necessária.


## Versão 2.6.2 — 3º turno restaurado e seletores revisados

- O 3º Turno volta a fazer parte de todos os seletores do aplicativo.
- Cadastro, consulta, escala fixa, situações, sábado HE e movimentações passam a aceitar 1º, 2º e 3º turnos.
- Troca de posições pode ocorrer entre quaisquer dos três turnos; os turnos dos colaboradores são atualizados junto com a posição.
- Mantida a correção da 2.6.1 que bloqueia o seletor nativo do Android/iOS e usa somente os modais do aplicativo.
- O Apps Script 2.5.9 já aceita o 3º Turno, portanto não precisa ser alterado nesta versão.

## Versão 2.6.1 — correção dos seletores e revisão geral

- Corrigido o seletor de turno no Android: o componente nativo fica totalmente bloqueado e somente o modal do aplicativo controla a escolha.
- Removido o 3º Turno da Equipe 9132; os seletores trabalham apenas com 1º e 2º Turno.
- Reforçada a captura de pointer, mouse, touch e click para impedir mudança involuntária do valor.
- Corrigido o controle de modais empilhados para não liberar a tela enquanto outro modal ainda estiver aberto.
- Mantidas as mesmas funções e eventos `input`/`change` dos selects originais.
- Revisão estática: sintaxe, IDs HTML, handlers, ações cliente/Apps Script e cache PWA conferidos.
- Apps Script permanece na versão 2.5.9; não há alteração de banco de dados nesta atualização.


- Todos os campos `<select>` do aplicativo passam a abrir em modal próprio no estilo visual do app.
- O seletor nativo do Android/iOS deixa de ser usado para colaboradores, postos, turnos, vagas e demais listas.
- Listas maiores recebem pesquisa.
- A opção atual fica marcada visualmente.
- A seleção continua disparando os mesmos eventos `input`/`change`, portanto as funções existentes são preservadas.
- Confirmações e advertências continuam usando os modais próprios já existentes; toasts permanecem apenas como notificações rápidas do próprio aplicativo.
- Nenhuma alteração de banco de dados/Apps Script é necessária nesta versão.


- **Trocar posições** agora permite selecionar colaboradores do 1º e do 2º turno.
- Se a troca for entre turnos diferentes, cada colaborador assume os 31 dias da posição recebida **e também o turno correspondente**.
- Exemplo: uma pessoa do 1º turno troca com uma pessoa do 2º turno → a primeira passa ao 2º turno e a segunda passa ao 1º.
- Nome, registro, ID interno, situações e histórico continuam vinculados à própria pessoa.
- O modal Antes/Depois destaca claramente quando haverá mudança de turno.
- Nenhuma vaga **A DEFINIR** é criada na troca direta.

# Escala Equipe 9132 — versão 2.6.1

Aplicativo PWA para consulta da escala fixa e fechamento de cargas, com sincronização pelo Google Sheets.

## Alterações
- Removido o botão Relatórios e todas as funções associadas.
- Removida a seleção de mês da tela principal e da administração.
- Mantido somente o seletor de turno na parte superior.
- A escala usa sempre os dias 01 a 31, independentemente do mês.
- Removida a função de copiar escala para outro mês.
- O Apps Script migra automaticamente a escala mais recente para a referência fixa `FIXA`.

Substitua o Apps Script, execute `configurarSistema`, publique uma nova versão da implantação e depois substitua os arquivos no GitHub.


## Atualização 2.3 — Histórico e montagem automática de sábado

- Exibe, ao lado de cada colaborador, a quantidade de sábados publicados trabalhados no ano, nos últimos 90 dias e no total.
- Mostra o último sábado trabalhado e a quantidade de sábados consecutivos.
- Permite selecionar os postos necessários para a hora extra.
- A montagem automática usa somente os colaboradores marcados como disponíveis.
- A distribuição prioriza quem trabalhou menos sábados, evita sequências quando possível, considera o posto da escala fixa e reduz repetição do último posto.
- A escala gerada permanece como rascunho para revisão antes da publicação.
- A cópia do sábado anterior considera somente escalas publicadas.

### Como usar a montagem automática

1. Escolha a data do sábado e o turno.
2. Marque os colaboradores disponíveis.
3. Selecione os postos necessários ou use **Carregar postos da escala fixa**.
4. Clique em **Montar automaticamente**.
5. Revise os nomes e postos.
6. Salve como rascunho ou publique.

> A contagem começa a partir das escalas de sábado que estiverem registradas na aba `Escala_Sabado_HE`. Sábados antigos que nunca foram cadastrados nessa aba não podem ser contabilizados automaticamente.


## Correção 2.3.1

- A lista de colaboradores da escala de sábado aparece imediatamente ao selecionar o turno.
- A lista não depende mais da resposta do histórico no Google Sheets.
- Variações como `1º Turno`, `1° Turno` e diferenças de espaços são tratadas como o mesmo turno.
- Respostas atrasadas da planilha não substituem a seleção atual do usuário.


## Atualização 2.3.4

- Endpoint do Google Apps Script atualizado para a nova implantação informada.
- Cache do PWA renovado para distribuir a configuração atualizada aos aparelhos.


## Ajustes da versão 2.3.4

- Cada botão da tela inicial possui uma cor exclusiva e texto branco maior.
- O fechamento de cargas agora exige escolher primeiro o turno e depois mostra somente os colaboradores daquele turno.
- A abertura utiliza primeiro os dados salvos no aparelho; a atualização do Google Sheets acontece em segundo plano.
- O Service Worker usa a página em cache para acelerar as aberturas seguintes.


## Correção 2.3.6 — publicação da escala de sábado

- O Apps Script não reformata mais todas as abas a cada consulta.
- A remoção da escala anterior do mesmo sábado/turno passou a ser feita em lote.
- O tempo máximo da consulta foi ampliado para 30 segundos.
- A escala publicada salva no aparelho aparece imediatamente enquanto a planilha é atualizada.
- Após publicar, o aplicativo consulta novamente a planilha e informa se a gravação foi confirmada.
- O POST usa `text/plain`, compatível com o corpo JSON lido pelo Apps Script.


## Link do Apps Script

O aplicativo está configurado para usar:

`https://script.google.com/macros/s/AKfycbyqOkI6XlCjD-LMVM1D7DzE5irvdlYBlEep_4Ry7mu15THTglIf34LZiQLuRZAzyBV0qw/exec`


## Versão 2.3.8

- Corrige a leitura da escala publicada quando data, turno ou status possuem formatação diferente na planilha.
- O botão Sábado HE procura a próxima escala publicada a partir da data atual.
- Em um sábado, se não houver escala para o dia atual, o aplicativo pode mostrar a escala do sábado seguinte.
- Uma resposta vazia da planilha não apaga imediatamente a escala publicada armazenada no aparelho.


## Versão 2.3.9 — escala de sábado salva pelo aplicativo

- A escala de sábado é salva imediatamente no próprio aparelho por `localStorage`.
- A publicação aparece no botão **Sábado HE** sem aguardar resposta do Google Sheets.
- A planilha passa a funcionar como sincronização e backup em segundo plano.
- Falhas ou demora do Apps Script não apagam nem escondem a escala salva no aparelho.
- Corrigido o status dos itens salvos localmente, inclusive para escalas já publicadas em versões anteriores.
- Outros aparelhos ainda dependem da sincronização com a planilha para receber a mesma escala.


## Versão 2.4.0 — administração simplificada

- Colaboradores e postos agora possuem ações separadas: Adicionar, Editar e Excluir.
- Adicionar abre um formulário vazio.
- Editar abre a lista e carrega os dados selecionados.
- Excluir remove definitivamente o cadastro; históricos de cargas e sábados são preservados.
- Ao excluir um posto, as posições dele são limpas da escala fixa.
- O botão Legenda passou para a cor cinza.


## Versão 2.4.2 — correção do editor de postos

- Corrigido o botão **Editar** em **Postos, local e setor**.
- A lista de postos é reconstruída sempre que o modo Editar ou Excluir é aberto.
- O primeiro posto é carregado automaticamente e a troca na lista atualiza os campos.
- Adicionado retorno visual e foco automático para facilitar o uso no celular.
- Não exige alteração no Apps Script da versão 2.4.0.

## Versão 2.4.4 — Situações separadas dos postos

- Remove Folga, Férias, Ausência, Afastamento e Treinamento das listas de postos.
- Adiciona o botão **Situação** em **Admin → Montar escala**.
- O novo modal permite escolher o colaborador, a situação, a data inicial e a data final.
- As opções de colaborador e situação usam listas personalizadas no estilo do aplicativo, sem caixas nativas do navegador.
- A situação é aplicada aos dias correspondentes da escala fixa.
- Dias com situação aparecem em amarelo na montagem da escala.
- Na consulta por dia, o cartão e o nome do colaborador aparecem em amarelo quando houver uma situação.
- O botão **Remover situação** limpa somente situações no período escolhido, preservando os demais postos.
- Registros antigos com o código `FALTA` são convertidos automaticamente para `AUSÊNCIA`.

Esta atualização não exige alteração no Apps Script. Substitua somente os arquivos do aplicativo no GitHub.


## Situações com posto preservado — versão 2.4.4

Ao aplicar férias, folga, ausência, atestado, afastamento ou treinamento, o sistema mantém o posto que já estava definido para cada dia. Na consulta, o nome fica destacado em amarelo, a situação é exibida e o posto permanece visível como referência para a cobertura/substituição.


## Versão 2.4.5 — recuperação de postos e seleção alternável

- Recupera automaticamente o posto de referência de situações antigas que haviam apagado o posto, usando a escala-base do colaborador.
- Corrige especialmente registros legados como Adriana e Junior que ficaram com situação, mas sem posto.
- Aplicar ou remover Férias, Atestado, Folga, Ausência, Afastamento ou Treinamento preserva/restaura o posto do dia.
- No modal Situação do colaborador, tocar novamente no colaborador ou na situação selecionada desmarca a bolinha.


## Versão 2.4.6 — situação aplicada ao tocar

- O botão **Aplicar situação** foi removido.
- Após selecionar colaborador e período, tocar em Folga, Férias, Ausência, Atestado, Afastamento ou Treinamento abre uma confirmação.
- Confirmando, a situação é aplicada imediatamente, preservando o posto e destacando o colaborador em amarelo.
- Tocar novamente em uma opção selecionada a desmarca.
- **Remover situação** limpa a situação do período, mantém/restaura o posto, zera os campos de data e retira o destaque amarelo.


## Versão 2.4.7 — publicação compartilhada do sábado

- Publicar sábado continua salvando primeiro no aparelho para não perder a escala.
- A publicação só é informada como compartilhada depois que o aplicativo lê novamente o Google Sheets e confirma os mesmos colaboradores/postos.
- Se a confirmação falhar, o envio fica na fila e o aplicativo avisa claramente que a escala ainda pode existir somente naquele aparelho.
- Outros celulares repetem a leitura do servidor ao abrir Sábado HE, reduzindo telas vazias por atraso de sincronização.
- Service worker atualizado para ativar a nova versão imediatamente.
## Versão 2.5.0 — Administração refatorada

- Google Sheets passa a ser a fonte oficial; o aparelho mantém cache local e fila de alterações pendentes.
- O Admin foi reorganizado em quatro módulos: **Cadastros**, **Escala fixa**, **Situações e coberturas** e **Sábado HE**.
- Férias, folga, ausência, atestado, afastamento e treinamento ficam na nova aba `Situacoes`, separados dos postos da escala fixa.
- Situações usam **datas reais**, inclusive períodos que atravessam meses. O destaque amarelo só existe durante o período; após a data final ele desaparece automaticamente, enquanto o registro permanece no histórico administrativo.
- A escala fixa preserva sempre o posto original do colaborador.
- Substituições temporárias passam a ser registradas como **coberturas** na aba `Coberturas`, sem apagar a escala do titular.
- Colaboradores cadastrados diretamente na aba `Colaboradores` aparecem no aplicativo mesmo antes de terem uma linha de escala.
- O código do posto fica protegido durante a edição; localização e setor continuam editáveis.
- O botão antigo de sincronização completa foi removido da interface. **Atualizar da planilha** baixa a fonte oficial, e alterações locais são confirmadas no servidor individualmente.
- Rascunhos de sábado não substituem mais uma publicação existente. Uma publicação continua visível aos colaboradores enquanto um novo rascunho é preparado.
- A tela de sábado lista separadamente rascunhos e publicações e confirma a gravação na planilha.
- Cada rascunho de sábado pode ser **visualizado antes da publicação**, separado por data e turno, mostrando colaborador, posto e observação. Na visualização é possível editar, excluir ou publicar o rascunho.
- Escalas já publicadas também podem ser visualizadas no Admin; ao editar uma publicação, o aplicativo cria um novo rascunho sem tirar do ar a versão que os colaboradores já veem.
- O botão público **Sábado HE** procura a próxima escala publicada.
- Pessoas em situação temporária ficam fora da montagem automática do sábado, exceto `Folga`, que permanece elegível para HE.

### Atualização obrigatória

1. Substitua o código do Apps Script pelo arquivo da versão 2.5.0.
2. Salve e execute `configurarSistema`. Isso cria as abas `Situacoes` e `Coberturas` e migra situações antigas encontradas dentro da escala fixa.
3. Em **Implantar → Gerenciar implantações**, edite a implantação atual, escolha **Nova versão** e implante. Não crie uma nova implantação se quiser manter o mesmo endereço `/exec`.
4. Substitua todos os arquivos do repositório GitHub pelos arquivos do ZIP 2.5.0.
5. Reabra o PWA e confirme **Versão 2.5.0**.

> Situações antigas das versões 2.4.x não possuíam mês/ano. Na migração, o sistema associa esses registros legados ao mês em que a versão 2.5.0 é configurada. Revise esses registros uma vez após a atualização.



## Versão 2.5.1 — Situações e cobertura por posto

- Situação do colaborador reorganizada em: **1. Colaborador → 2. Período → 3. Situação**.
- A lista de colaboradores em Situação pode ser filtrada por turno.
- As opções de situação ficam bloqueadas até colaborador e período estarem definidos, evitando confirmações prematuras.
- Cobertura temporária pode ser feita por **colaborador** ou por **posto**.
- Na cobertura por posto, quem estiver escalado naquele posto em cada dia é deslocado para o posto do colaborador coberto; o posto de origem fica vazio e não gera nova pendência.
- O Admin mostra uma prévia dia a dia e bloqueia o registro quando detectar conflitos (ninguém no posto, cobridor indisponível, dupla cobertura, turno diferente etc.).
- Na consulta operacional, quem estiver cobrindo aparece com a frase **“Cobrindo posto <código> • <descrição>”**.
- A escala fixa permanece intacta; situações e coberturas continuam em camadas temporárias separadas.

### Atualização

Esta versão exige atualizar também o Apps Script e executar `configurarSistema` uma vez para acrescentar as novas colunas da aba `Coberturas`.


## Versão 2.5.2 — Desfazer ações e confirmações do Admin

- Novo botão **Desfazer ações** na Administração.
- O botão consulta primeiro o Google Sheets e só então descarta alterações administrativas pendentes no aparelho.
- Alterações já sincronizadas na planilha não são revertidas; o recurso restaura o aplicativo para o estado atualmente gravado no Google Sheets.
- Cadastros, escala fixa, situações, coberturas e operações importantes da escala de sábado usam confirmação em modal antes de alterar dados ou substituir montagens do editor.
- Atualizar da planilha também exibe confirmação e avisa quando existem pendências locais.


## Versão 2.5.3 — Montagem automática guiada

- A área **Montagem automática equilibrada** agora mostra um checklist visual com data/turno, colaboradores disponíveis, postos necessários, histórico HE e capacidade.
- O botão **Montar automaticamente** continua clicável para orientação, mas aparece visualmente bloqueado enquanto faltarem dados.
- Ao tocar no botão com informações incompletas, o aplicativo abre um modal explicando exatamente o que falta e a ordem correta de preenchimento.
- As mensagens não dependem mais do `msgAdmin` no rodapé da página.
- Nenhuma alteração no Apps Script é necessária nesta versão.


## Versão 2.5.4 — identificação por registro e remoção de duplicidades

- Registro + Turno passa a ser a identidade principal para cruzar `Colaboradores` e `Escala`.
- ID é usado como segunda chave e Nome + Turno como recuperação.
- Cadastros duplicados deixam de gerar cartões repetidos no aplicativo.
- Linhas de escala com ID antigo podem ser associadas ao colaborador correto pelo registro.
- A linha de escala mais completa é priorizada quando existem duplicidades.
- Ao salvar uma escala, duplicidades antigas da mesma pessoa são consolidadas.
- O Admin avisa quando encontra inconsistências entre as abas.
- O aplicativo também deduplica o cache local para evitar repetições antes da sincronização.


## Versão 2.5.5 — vaga A DEFINIR ao retirar colaborador

- **Retirar da equipe** desativa o colaborador e preserva os 31 dias como uma vaga **A DEFINIR**.
- A vaga aparece na consulta diária com o posto correspondente e pode ser editada em Escala fixa.
- A vaga não entra em HE, cargas, situações ou coberturas como se fosse uma pessoa.
- **Preencher vaga** transfere os 31 dias para um colaborador novo do mesmo turno que ainda esteja sem postos definidos.
- **Excluir** permanece apenas para cadastro incorreto ou duplicado.


## Versão 2.5.6 — realocação de colaborador

- Novo botão **Realocar colaborador** em Admin > Cadastros.
- Use quando um colaborador que já possui escala assumir uma vaga **A DEFINIR**.
- A escala da vaga é transferida para o colaborador.
- A escala anterior desse colaborador é preservada automaticamente como uma nova vaga **A DEFINIR**.
- A realocação só permite vaga do mesmo turno e exige confirmação em modal.
- **Preencher vaga** continua reservado para colaborador novo/sem escala.

## Versão 2.5.7 — referência da vaga
- Vagas abertas continuam com o nome principal **A DEFINIR**.
- Ao retirar alguém da equipe, a vaga mostra **A DEFINIR — vaga de NOME**.
- A referência aparece na escala diária, busca por posto, edição da escala, Preencher vaga e Realocar colaborador.
- Ao preencher a vaga, a referência sai da operação, mas a origem continua registrada no histórico.
- Ao realocar alguém, a posição antiga vira automaticamente **A DEFINIR — vaga de NOME**.
- A referência usa o campo de registro somente nas linhas especiais de vaga; não cria novas colunas.
