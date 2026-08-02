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
