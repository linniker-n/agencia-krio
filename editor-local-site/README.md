# Editor Local de Sites

Editor visual local para abrir um arquivo HTML ou uma pasta de site, editar no preview e exportar um HTML final.

## Como abrir

Opcao simples:

```bash
python -m http.server 8787
```

Depois acesse:

```text
http://127.0.0.1:8787/editor-local-site/
```

Tambem funciona abrindo `index.html` diretamente no navegador, mas o servidor local evita limitacoes de alguns browsers.

## Fluxo recomendado

1. Clique em `Abrir HTML` para importar um arquivo `.html`.
2. Se o HTML usa imagens, CSS ou JS relativos, prefira `Abrir pasta` e selecione a pasta inteira do site.
3. Clique em qualquer elemento no preview para selecionar.
4. Use o painel direito para mudar cor, fundo, tamanho, padding, margem, radius, opacidade, layout e transformacao.
5. Arraste componentes do painel esquerdo para o preview ou clique neles para inserir.
6. Use `Escolher imagem` para trocar uma imagem selecionada ou inserir uma nova.
7. Use `Usar como fundo` para aplicar imagem no bloco selecionado, depois ajuste `Fundo fit` e `Fundo foco`.
8. Use `Exportar HTML` para baixar o arquivo editado.

## Recursos incluidos

- Importa HTML unico.
- Importa pasta inteira e reescreve assets relativos para preview local.
- Preview em iframe com tamanhos desktop, tablet, mobile e fluido.
- O modo Desktop usa viewport real de 1440px e escala automaticamente para caber na tela do editor.
- Modo seguro ativo por padrao: scripts importados nao rodam no preview, mas sao restaurados no HTML exportado.
- Selecao visual de elementos.
- Painel de camadas.
- Drag para movimentar elementos selecionados.
- Ajuste numerico fino de largura, altura minima, fonte, radius, padding, margem, opacidade e camada.
- Painel `Transformar` com X, Y, rotacao, escala, skew X e skew Y.
- Insercao de faixas, containers, textos, botoes, imagens e espacadores.
- Upload de imagens como `data:` para exportacao independente.
- Fundo com imagem no elemento selecionado, incluindo fit/foco/remocao.
- Presets de animacao CSS e JS: fade, float, pulse, reveal on scroll e parallax leve.
- CSS e JS extras exportaveis.
- Undo, redo e snapshots locais preservando a posicao do preview.
- Atalhos: `Ctrl+C`, `Ctrl+V`, `Ctrl+X`, `Ctrl+Z`, `Ctrl+Y`, `Ctrl+Shift+Z` e `Ctrl+D`.

## Observacoes

- O editor trabalha direto no DOM renderizado. Para evitar interferencia de scripts externos, mantenha `Modo seguro` ativo durante a edicao.
- Se voce desligar o modo seguro, scripts importados podem rodar no preview e alterar comportamento, scroll ou navegacao.
- Para manter o HTML exportado independente, imagens adicionadas pelo editor sao embutidas como `data URL`.
- Ao importar uma pasta, o editor procura `index.html`; se nao encontrar, usa o primeiro `.html`.
