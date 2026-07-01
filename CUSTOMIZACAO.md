# Customização rápida do site

Edite principalmente o arquivo `site-config.js`. A ideia é evitar mexer no `index.html` para tarefas simples.

## Trocar o logo

1. Coloque o arquivo em `assets/`, por exemplo `assets/logo-krio.svg`.
2. No `site-config.js`, altere:

```js
logo: {
  image: "assets/logo-krio.svg",
  alt: "Agência Krio",
  markImage: "assets/logo-simbolo.svg"
}
```

Se quiser manter o logo do rodapé em texto:

```js
useImageInFooter: false
```

## Trocar a imagem principal

Jeito simples, com um único arquivo:

```js
images: {
  hero: {
    single: "assets/nova-imagem-hero.jpg",
    alt: "Descrição da imagem"
  }
}
```

## Adicionar imagens nos placeholders

Os blocos dos pilares usam `pillar1`, `pillar2` e `pillar3`:

```js
mediaBlocks: {
  pillar1: {
    image: "assets/estrategia.jpg",
    overlay: "rgba(17, 17, 18, 0.18)",
    position: "center",
    size: "cover"
  }
}
```

Os cards finais usam `social1` até `social5`.

## Colocar imagem de fundo em uma faixa

Use `backgrounds`. Exemplos de chaves: `hero`, `autoridade`, `pilares`, `servicos`, `processo`, `diagnostico`, `social`, `footer`.

```js
backgrounds: {
  servicos: {
    image: "assets/fundo-servicos.jpg",
    overlay: "rgba(244, 244, 237, 0.82)",
    position: "center",
    size: "cover"
  }
}
```

## Alterar tamanhos

Use `layout` para ajustes globais:

```js
layout: {
  heroMediaHeight: "46rem",
  sectionPadding: "clamp(5rem, 9vw, 10rem)",
  pillarMediaHeight: "22rem",
  socialCardWidth: "20rem"
}
```

Use `blocks` para ajustes individuais:

```js
blocks: {
  pillar1: { padding: "8rem 2rem 3rem" },
  service1: { padding: "2.4rem" },
  social3: { width: "22rem", aspectRatio: "0.8" }
}
```

Depois de editar, atualize também `dist/site-config.js` antes de publicar se estiver usando deploy direto pelo Wrangler.
