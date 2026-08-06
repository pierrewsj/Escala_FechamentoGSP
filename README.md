# Escala Equipe 9132 — versão 2.1

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
