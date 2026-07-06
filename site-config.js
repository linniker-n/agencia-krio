/*
  Configuração rápida do site Krio

  Como usar:
  1. Coloque novas imagens dentro da pasta assets/.
  2. Preencha os campos vazios com caminhos como "assets/minha-imagem.webp".
  3. Para tamanhos, use CSS normal: "20rem", "720px", "clamp(4rem, 8vw, 9rem)".
  4. Se deixar um campo vazio, o site mantém o visual padrão.
*/

window.KRIO_SITE_CONFIG = {
  logo: {
    // Para aplicar um logo em imagem no menu, preloader e rodapé:
    // image: "assets/logo-krio.svg",
    image: "",
    alt: "Agência Krio",

    // Usado quando image está vazio.
    navText: ["Agência", "Krio"],
    footerText: "Krio",

    // Opcional: use uma versão reduzida para o círculo central.
    // markImage: "assets/logo-simbolo.svg",
    markImage: "",
    markText: "",

    // Se quiser manter o rodapé em texto mesmo usando logo no menu, troque para false.
    useImageInFooter: true
  },

  images: {
    hero: {
      // Jeito mais simples: preencha single e ignore os outros formatos.
      // single: "assets/nova-imagem-hero.jpg",
      single: "",

      // Jeito otimizado: use avif/webp/src com versões responsivas.
      avif: "assets/krio-hero-640.avif 640w, assets/krio-hero-960.avif 960w, assets/krio-hero-1280.avif 1280w",
      webp: "assets/krio-hero-640.webp 640w, assets/krio-hero-960.webp 960w, assets/krio-hero-1280.webp 1280w",
      src: "assets/krio-hero.png",
      sizes: "(max-width: 860px) 92vw, 44vw",
      alt: "Composição editorial da Agência Krio com painéis de gestão de social media, identidade visual e métricas de campanhas.",
      position: "57% center",
      fit: "cover"
    },

    menuHome: {
      single: "",
      webp: "assets/krio-hero-640.webp",
      src: "assets/krio-hero.png",
      alt: ""
    },

    menuDiagnostico: {
      single: "",
      webp: "assets/krio-hero-640.webp",
      src: "assets/krio-hero.png",
      alt: ""
    }
  },

  // Imagens de fundo para faixas inteiras.
  backgrounds: {
    hero: {
      image: "",
      overlay: "rgba(244, 244, 237, 0.72)",
      opacity: 1,
      position: "center",
      size: "cover",
      blend: "normal"
    },
    autoridade: { image: "", overlay: "rgba(244, 244, 237, 0.82)", opacity: 1, position: "center", size: "cover" },
    pilares: { image: "", overlay: "rgba(17, 17, 18, 0.42)", opacity: 1, position: "center", size: "cover" },
    servicos: { image: "", overlay: "rgba(244, 244, 237, 0.82)", opacity: 1, position: "center", size: "cover" },
    processo: { image: "", overlay: "rgba(17, 17, 18, 0.58)", opacity: 1, position: "center", size: "cover" },
    diagnostico: { image: "", overlay: "rgba(244, 244, 237, 0.84)", opacity: 1, position: "center", size: "cover" },
    social: { image: "", overlay: "rgba(244, 244, 237, 0.82)", opacity: 1, position: "center", size: "cover" },
    footer: { image: "", overlay: "rgba(17, 17, 18, 0.62)", opacity: 1, position: "center", size: "cover" }
  },

  // Imagens para placeholders e cards.
  mediaBlocks: {
    menuPilares: { image: "", overlay: "rgba(17, 17, 18, 0.18)", position: "center", size: "cover" },
    menuServicos: { image: "", overlay: "rgba(17, 17, 18, 0.18)", position: "center", size: "cover" },

    pillar1: { image: "", overlay: "rgba(17, 17, 18, 0.16)", position: "center", size: "cover" },
    pillar2: { image: "", overlay: "rgba(17, 17, 18, 0.16)", position: "center", size: "cover" },
    pillar3: { image: "", overlay: "rgba(17, 17, 18, 0.16)", position: "center", size: "cover" },

    social1: { image: "", overlay: "rgba(17, 17, 18, 0.18)", position: "center", size: "cover", patternOpacity: 0.22 },
    social2: { image: "", overlay: "rgba(17, 17, 18, 0.18)", position: "center", size: "cover", patternOpacity: 0.22 },
    social3: { image: "", overlay: "rgba(17, 17, 18, 0.18)", position: "center", size: "cover", patternOpacity: 0.22 },
    social4: { image: "", overlay: "rgba(17, 17, 18, 0.18)", position: "center", size: "cover", patternOpacity: 0.22 },
    social5: { image: "", overlay: "rgba(17, 17, 18, 0.18)", position: "center", size: "cover", patternOpacity: 0.22 }
  },

  // Tamanhos globais dos principais blocos.
  layout: {
    logoNavWidth: "8rem",
    logoNavMaxHeight: "4.25rem",
    logoMarkSize: "3.35rem",
    logoPreloaderWidth: "7.5rem",
    logoFooterWidth: "min(38rem, 82vw)",

    container: "min(calc(100vw - 2rem), 1560px)",
    heroMinHeight: "88dvh",
    heroPadding: "clamp(6.4rem, 8vw, 8rem) 0 4.2rem",
    heroGridColumns: "minmax(0, 0.98fr) minmax(22rem, 0.86fr)",
    heroGridGap: "clamp(1.5rem, 4vw, 4.75rem)",
    heroMediaHeight: "min(62dvh, 41rem)",
    heroMediaPadding: "0.55rem",
    heroMediaRadius: "0.8rem",

    sectionPadding: "clamp(6rem, 11vw, 12rem)",
    compactSectionPadding: "clamp(4rem, 8vw, 8rem)",

    pillarHeight: "100dvh",
    pillarPadding: "9.6rem clamp(1.25rem, 3vw, 3.2rem) 3rem",
    pillarMediaHeight: "16rem",

    serviceBlockPadding: "clamp(1.2rem, 2.5vw, 2rem)",
    socialFanHeight: "40rem",
    socialCardWidth: "min(18rem, 34vw)",
    socialCardRatio: "0.72"
  },

  // Ajustes individuais. Use apenas quando quiser alterar um bloco específico.
  blocks: {
    // Exemplos:
    // heroMedia: { minHeight: "46rem", borderRadius: "1rem" },
    // pillar1: { padding: "8rem 2rem 3rem" },
    // pillar1: { minHeight: "92dvh" },
    // service1: { padding: "2.4rem" },
    // social3: { width: "22rem", aspectRatio: "0.8" }
  }
};
