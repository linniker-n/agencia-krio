/* ==========================================================================
   KRIO — motion layer
   Structure and copy live in index.html. This file only adds behaviour:
   inertia scroll, scroll-scrubbed parallax, masked word reveals and hovers.
   ========================================================================== */
(() => {
  "use strict";

  const root = document.documentElement;
  const body = document.body;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(pointer: fine)");
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  let motionOn = !reduceMotion.matches;

  /* ------------------------------------------------------------------ */
  /* Footer year                                                         */
  /* ------------------------------------------------------------------ */
  document.querySelectorAll("[data-year]").forEach((node) => {
    node.textContent = new Date().getFullYear();
  });

  /* ------------------------------------------------------------------ */
  /* Entrance state                                                      */
  /* ------------------------------------------------------------------ */
  const markReady = () => root.classList.add("is-ready");

  if (document.readyState === "complete") {
    requestAnimationFrame(markReady);
  } else {
    window.addEventListener("load", markReady, { once: true });
    window.setTimeout(markReady, 1600);
  }

  /* ------------------------------------------------------------------ */
  /* Inertia scroll                                                      */
  /* Keeps the native scroll position (so sticky/fixed still work) and    */
  /* eases towards it, which is what gives the page its weight.           */
  /* ------------------------------------------------------------------ */
  const scroller = (() => {
    const EASE = 0.1;
    let target = window.scrollY;
    let current = target;
    let frame = 0;
    let selfDriven = false;
    let active = false;

    const limit = () =>
      Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

    const run = () => {
      const delta = target - current;

      if (Math.abs(delta) < 0.35) {
        current = target;
        frame = 0;
        selfDriven = true;
        window.scrollTo(0, current);
        return;
      }

      current += delta * EASE;
      selfDriven = true;
      window.scrollTo(0, current);
      frame = requestAnimationFrame(run);
    };

    const request = () => {
      if (!frame) frame = requestAnimationFrame(run);
    };

    const sync = () => {
      target = current = window.scrollY;
      if (frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    };

    const onWheel = (event) => {
      if (!active || event.ctrlKey || body.classList.contains("menu-open")) return;

      let delta = event.deltaY;
      if (event.deltaMode === 1) delta *= 18;
      else if (event.deltaMode === 2) delta *= window.innerHeight;

      event.preventDefault();
      target = clamp(target + delta, 0, limit());
      request();
    };

    const onScroll = () => {
      if (selfDriven) {
        selfDriven = false;
        return;
      }
      // keyboard, scrollbar drag or anything else native: take their value
      sync();
    };

    const enable = () => {
      if (active) return;
      active = true;
      sync();
      window.addEventListener("wheel", onWheel, { passive: false });
    };

    const disable = () => {
      if (!active) return;
      active = false;
      window.removeEventListener("wheel", onWheel);
      sync();
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", sync, { passive: true });

    return {
      enable,
      disable,
      sync,
      isActive: () => active,
      scrollTo(value) {
        target = clamp(value, 0, limit());
        if (active) request();
        else window.scrollTo({ top: target, behavior: motionOn ? "smooth" : "auto" });
      },
    };
  })();

  const syncScroller = () => {
    if (motionOn && finePointer.matches) scroller.enable();
    else scroller.disable();
  };

  syncScroller();
  finePointer.addEventListener?.("change", syncScroller);

  /* ------------------------------------------------------------------ */
  /* Word splitting — wraps each word in a mask without touching copy     */
  /* ------------------------------------------------------------------ */
  const splitWords = (element) => {
    if (element.dataset.split === "done" || element.dataset.scrub === "done") return [];

    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);

    textNodes.forEach((node) => {
      if (!node.textContent.trim()) return;

      const fragment = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach((chunk) => {
        if (!chunk) return;

        if (!chunk.trim()) {
          fragment.appendChild(document.createTextNode(chunk));
          return;
        }

        const mask = document.createElement("span");
        const inner = document.createElement("span");
        mask.className = "word";
        inner.textContent = chunk;
        mask.appendChild(inner);
        fragment.appendChild(mask);
      });

      node.parentNode.replaceChild(fragment, node);
    });

    const words = [...element.querySelectorAll(".word")];
    words.forEach((word, index) => word.style.setProperty("--i", index));
    return words;
  };

  const splitTargets = [
    ".hero-copy h1",
    ".services-head h2",
    ".method-copy h2",
    ".contact h2",
  ];

  const scrubTargets = [".intro-title", ".manifesto h2"];

  if (motionOn) {
    splitTargets.forEach((selector) => {
      document.querySelectorAll(selector).forEach((node) => {
        node.setAttribute("data-split", "");
        splitWords(node);
        node.dataset.split = "done";
      });
    });

    scrubTargets.forEach((selector) => {
      document.querySelectorAll(selector).forEach((node) => {
        node.setAttribute("data-scrub", "");
        node.__words = splitWords(node);
        node.dataset.scrub = "done";
      });
    });
  }

  // the hero headline plays on load instead of on scroll
  const heroHeadline = document.querySelector(".hero-copy h1");
  if (heroHeadline && motionOn) {
    heroHeadline.style.setProperty("--delay", "380ms");
    const play = () => heroHeadline.classList.add("is-revealed");
    if (root.classList.contains("is-ready")) play();
    else window.setTimeout(play, 120);
  }

  /* ------------------------------------------------------------------ */
  /* Reveals                                                             */
  /* ------------------------------------------------------------------ */
  const revealNodes = [
    ...document.querySelectorAll(
      ".reveal, .section-index, .services-head h2, .method-copy h2, .contact h2, .method-steps li",
    ),
  ].filter((node) => node !== heroHeadline);

  if (motionOn && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-revealed");
          obs.unobserve(entry.target);
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8%" },
    );

    // stagger siblings so rows cascade instead of popping together
    const groups = new Map();
    revealNodes.forEach((node) => {
      const parent = node.parentElement;
      if (!groups.has(parent)) groups.set(parent, 0);
      const index = groups.get(parent);
      node.style.setProperty("--delay", `${Math.min(index, 6) * 90}ms`);
      groups.set(parent, index + 1);
      observer.observe(node);
    });
  } else {
    revealNodes.forEach((node) => node.classList.add("is-revealed"));
  }

  /* ------------------------------------------------------------------ */
  /* Scroll-driven work: hero parallax, header, progress, scrub headlines */
  /* ------------------------------------------------------------------ */
  const header = document.querySelector("[data-header]");
  const hero = document.querySelector(".hero");
  const footerMark = document.querySelector(".footer-wordmark");
  const scrubNodes = [...document.querySelectorAll("[data-scrub]")];

  let scrollFrame = 0;

  const renderScroll = () => {
    scrollFrame = 0;

    const scrollY = window.scrollY;
    const viewport = window.innerHeight;
    const max = Math.max(
      1,
      document.documentElement.scrollHeight - viewport,
    );

    root.style.setProperty("--scroll-progress", (scrollY / max).toFixed(4));
    header?.classList.toggle("is-scrolled", scrollY > 24);

    if (!motionOn) return;

    if (hero) {
      const travel = Math.max(hero.offsetHeight, 1);
      const progress = clamp(scrollY / travel, 0, 1);

      hero.style.setProperty("--hero-progress", progress.toFixed(4));
      hero.style.setProperty("--statue-y", `${-progress * 150}px`);
      hero.style.setProperty("--statue-scale", (1 + progress * 0.04).toFixed(4));
      hero.style.setProperty("--wordmark-y", `${progress * 46}px`);
      hero.style.setProperty("--copy-y", `${progress * 34}px`);
      hero.style.setProperty("--copy-opacity", clamp(1 - progress * 1.3, 0, 1).toFixed(3));
    }

    if (footerMark) {
      const rect = footerMark.getBoundingClientRect();
      // 0 quando o bloco encosta na base da janela, 1 quando ele cabe inteiro
      // nela. Antes dividia por 85% da janela e no fim da pagina so chegava a
      // ~0.58, deixando o wordmark cortado para sempre.
      const span = Math.max(rect.height, 1);
      const progress = clamp((viewport - rect.top) / span, 0, 1);
      footerMark.style.setProperty("--footer-reveal", progress.toFixed(4));
    }

    scrubNodes.forEach((node) => {
      const words = node.__words;
      if (!words || !words.length) return;

      const rect = node.getBoundingClientRect();
      const start = viewport * 0.86;
      const end = viewport * 0.34;
      const progress = clamp((start - rect.top) / Math.max(start - end, 1), 0, 1);
      const lit = Math.round(progress * words.length);

      words.forEach((word, index) => {
        word.classList.toggle("is-lit", index < lit);
      });
    });
  };

  const requestScroll = () => {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(renderScroll);
  };

  renderScroll();
  window.addEventListener("scroll", requestScroll, { passive: true });
  window.addEventListener("resize", requestScroll, { passive: true });

  /* ------------------------------------------------------------------ */
  /* Hero pointer parallax, eased                                        */
  /* ------------------------------------------------------------------ */
  if (hero && motionOn && finePointer.matches) {
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let frame = 0;

    const render = () => {
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;

      hero.style.setProperty("--pointer-x", `${currentX.toFixed(2)}px`);
      hero.style.setProperty("--pointer-y", `${currentY.toFixed(2)}px`);

      if (Math.abs(targetX - currentX) > 0.1 || Math.abs(targetY - currentY) > 0.1) {
        frame = requestAnimationFrame(render);
      } else {
        frame = 0;
      }
    };

    const request = () => {
      if (!frame) frame = requestAnimationFrame(render);
    };

    hero.addEventListener("pointermove", (event) => {
      const bounds = hero.getBoundingClientRect();
      targetX = ((event.clientX - bounds.left) / bounds.width - 0.5) * 28;
      targetY = ((event.clientY - bounds.top) / bounds.height - 0.5) * 22;
      request();
    });

    hero.addEventListener("pointerleave", () => {
      targetX = 0;
      targetY = 0;
      request();
    });
  }

  /* ------------------------------------------------------------------ */
  /* Service rows — cursor spotlight                                     */
  /* ------------------------------------------------------------------ */
  if (motionOn && finePointer.matches) {
    document.querySelectorAll(".service-row").forEach((row) => {
      row.addEventListener("pointermove", (event) => {
        const bounds = row.getBoundingClientRect();
        row.style.setProperty("--mx", `${event.clientX - bounds.left}px`);
        row.style.setProperty("--my", `${event.clientY - bounds.top}px`);
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /* Magnetic buttons                                                    */
  /* ------------------------------------------------------------------ */
  if (motionOn && finePointer.matches) {
    document.querySelectorAll(".button").forEach((element) => {
      const strength = 0.22;

      element.addEventListener("pointermove", (event) => {
        const bounds = element.getBoundingClientRect();
        const offsetX = (event.clientX - bounds.left - bounds.width / 2) * strength;
        const offsetY = (event.clientY - bounds.top - bounds.height / 2) * strength;
        element.style.setProperty("--magnet-x", `${offsetX.toFixed(2)}px`);
        element.style.setProperty("--magnet-y", `${offsetY.toFixed(2)}px`);
      });

      element.addEventListener("pointerleave", () => {
        element.style.setProperty("--magnet-x", "0px");
        element.style.setProperty("--magnet-y", "0px");
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /* Nav roll-over — duplicates the label for the hover state only       */
  /* ------------------------------------------------------------------ */
  document.querySelectorAll(".desktop-nav a").forEach((link) => {
    const label = link.textContent.trim();
    if (!label) return;

    link.textContent = "";

    const base = document.createElement("span");
    base.className = "roll roll--base";
    base.textContent = label;

    const ghost = document.createElement("span");
    ghost.className = "roll roll--ghost";
    ghost.setAttribute("aria-hidden", "true");
    ghost.textContent = label;

    link.append(base, ghost);
  });

  /* ------------------------------------------------------------------ */
  /* Mobile menu                                                         */
  /* ------------------------------------------------------------------ */
  const menuButton = document.querySelector(".menu-button");
  const mobileMenu = document.querySelector(".mobile-menu");

  const setMenu = (open, returnFocus = true) => {
    body.classList.toggle("menu-open", open);
    menuButton?.setAttribute("aria-expanded", String(open));
    menuButton?.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    if (mobileMenu) mobileMenu.inert = !open;

    if (open) {
      window.setTimeout(() => mobileMenu?.querySelector("a")?.focus(), 420);
    } else if (returnFocus) {
      menuButton?.focus({ preventScroll: true });
    }
  };

  menuButton?.addEventListener("click", () => {
    setMenu(!body.classList.contains("menu-open"));
  });

  mobileMenu?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setMenu(false, false));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && body.classList.contains("menu-open")) setMenu(false);
  });

  /* ------------------------------------------------------------------ */
  /* Anchors — routed through the scroller so easing stays consistent    */
  /* ------------------------------------------------------------------ */
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const selector = link.getAttribute("href");
      if (!selector || selector === "#") return;

      const target = document.querySelector(selector);
      if (!target) return;

      event.preventDefault();

      const offset =
        selector === "#topo"
          ? 0
          : target.getBoundingClientRect().top + window.scrollY;

      if (body.classList.contains("menu-open")) {
        setMenu(false, false);
        window.setTimeout(() => scroller.scrollTo(offset), 420);
      } else {
        scroller.scrollTo(offset);
      }

      history.replaceState(null, "", selector);
    });
  });

  /* ------------------------------------------------------------------ */
  /* Giroscopio — no celular, inclinar o aparelho move a estatua e as    */
  /* cartas. Alimenta as mesmas --pointer-x/y que o mouse usa no desktop */
  /* e transmite a inclinacao normalizada em krio:tilt.                  */
  /* ------------------------------------------------------------------ */
  (() => {
    if (typeof DeviceOrientationEvent === "undefined") return;

    const LIMITE = 24; // graus de inclinacao do aparelho ate o extremo
    let neutro = null;
    let alvoX = 0;
    let alvoY = 0;
    let atualX = 0;
    let atualY = 0;
    let tiltFrame = 0;

    const render = () => {
      tiltFrame = 0;
      atualX += (alvoX - atualX) * 0.12;
      atualY += (alvoY - atualY) * 0.12;

      if (hero) {
        hero.style.setProperty("--pointer-x", `${(atualX * 18).toFixed(2)}px`);
        hero.style.setProperty("--pointer-y", `${(atualY * 14).toFixed(2)}px`);
      }

      window.dispatchEvent(
        new CustomEvent("krio:tilt", { detail: { x: atualX, y: atualY } }),
      );

      if (Math.abs(alvoX - atualX) > 0.002 || Math.abs(alvoY - atualY) > 0.002) {
        tiltFrame = requestAnimationFrame(render);
      }
    };

    const pedir = () => {
      if (!tiltFrame) tiltFrame = requestAnimationFrame(render);
    };

    const onOrient = (event) => {
      if (!motionOn) return;
      const { beta, gamma } = event;
      if (beta == null || gamma == null) return;

      // a primeira leitura vira o repouso: serve com o aparelho deitado ou
      // de pe, sem obrigar o usuario a segurar de um jeito especifico
      if (!neutro) neutro = { beta, gamma };

      alvoX = clamp((gamma - neutro.gamma) / LIMITE, -1, 1);
      alvoY = clamp((beta - neutro.beta) / LIMITE, -1, 1);
      pedir();
    };

    const escutar = () => {
      window.addEventListener("deviceorientation", onOrient, { passive: true });
    };

    if (finePointer.matches) return; // no desktop quem comanda e o mouse

    // iOS so entrega o sensor apos permissao, e so a partir de um gesto real.
    //
    // Usa "click", nao "touchend": touchend dispara tambem ao terminar uma
    // rolagem, e um touchend de scroll nao carrega ativacao do usuario no
    // Safari — a permissao era negada em silencio. Click so nasce de um
    // toque de verdade, o que de quebra evita a caixa aparecer enquanto a
    // pessoa apenas rola a pagina.
    //
    // O listener so sai depois do sim: uma tentativa frustrada nao pode
    // queimar a unica chance. No Android nao ha pedido nenhum.
    if (typeof DeviceOrientationEvent.requestPermission === "function") {
      const pedir = () => {
        DeviceOrientationEvent.requestPermission()
          .then((estado) => {
            if (estado !== "granted") return;
            document.removeEventListener("click", pedir);
            escutar();
          })
          .catch(() => {});
      };
      document.addEventListener("click", pedir);
    } else {
      escutar();
    }
  })();

  /* ------------------------------------------------------------------ */
  /* Contact mesh — trama geometrica que responde ao ponteiro            */
  /* ------------------------------------------------------------------ */
  /* Cada [data-mesh] vira uma trama propria. Os data-* ajustam densidade,
     alcance e deslocamento, para a mesma malha servir tanto ao rodape quanto
     a fundos mais discretos, sem duplicar o codigo. */
  document.querySelectorAll("[data-mesh]").forEach((mesh) => {
    if (!mesh.getContext) return;

    const ctx = mesh.getContext("2d");
    const host = mesh.parentElement;
    const tune = (name, fallback) => {
      const value = parseFloat(mesh.dataset[name]);
      return Number.isFinite(value) ? value : fallback;
    };
    const SPACING = tune("meshSpacing", 78);
    const REACH = tune("meshReach", 240);
    const PUSH = tune("meshPush", 20);

    let grid = [];
    let width = 0;
    let height = 0;
    let meshFrame = 0;
    let onScreen = false;
    let pointerOn = false;
    let px = -9999;
    let py = -9999;
    let tx = -9999;
    let ty = -9999;

    const build = () => {
      const rect = mesh.getBoundingClientRect();
      width = Math.max(1, Math.round(rect.width));
      height = Math.max(1, Math.round(rect.height));

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      mesh.width = Math.round(width * dpr);
      mesh.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const cols = Math.ceil(width / SPACING) + 3;
      const rows = Math.ceil(height / SPACING) + 3;

      grid = [];
      for (let r = 0; r < rows; r += 1) {
        const line = [];
        for (let c = 0; c < cols; c += 1) {
          // deslocamento alternado: trama triangular, nao quadriculado
          const x = c * SPACING + (r % 2) * SPACING * 0.5 - SPACING;
          const y = r * SPACING * 0.86 - SPACING;
          line.push({ ox: x, oy: y, x, y });
        }
        grid.push(line);
      }
    };

    const edge = (a, b) => {
      // intensidade pela proximidade do ponteiro ao meio do segmento
      const mx = (a.x + b.x) * 0.5;
      const my = (a.y + b.y) * 0.5;
      const d = Math.hypot(mx - px, my - py);
      const k = pointerOn ? clamp(1 - d / REACH, 0, 1) : 0;
      const heat = k * k;

      ctx.strokeStyle = heat > 0.01
        ? `rgba(207, 251, 36, ${(0.05 + heat * 0.5).toFixed(3)})`
        : "rgba(244, 242, 234, 0.05)";
      ctx.lineWidth = 1 + heat * 0.9;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    };

    const draw = () => {
      meshFrame = 0;
      ctx.clearRect(0, 0, width, height);

      // quanto os pontos ainda estao longe do destino: enquanto houver sobra,
      // o loop continua, senao a trama congelaria no meio do caminho de volta
      let drift = 0;

      px += (tx - px) * 0.12;
      py += (ty - py) * 0.12;

      for (let r = 0; r < grid.length; r += 1) {
        for (let c = 0; c < grid[r].length; c += 1) {
          const p = grid[r][c];
          let gx = p.ox;
          let gy = p.oy;

          if (pointerOn) {
            const dx = p.ox - px;
            const dy = p.oy - py;
            const d = Math.hypot(dx, dy);
            if (d < REACH && d > 0.01) {
              const force = (1 - d / REACH) ** 2 * PUSH;
              gx += (dx / d) * force;
              gy += (dy / d) * force;
            }
          }

          p.x += (gx - p.x) * 0.16;
          p.y += (gy - p.y) * 0.16;

          const rest = Math.abs(gx - p.x) + Math.abs(gy - p.y);
          if (rest > drift) drift = rest;
        }
      }

      for (let r = 0; r < grid.length; r += 1) {
        for (let c = 0; c < grid[r].length; c += 1) {
          const p = grid[r][c];
          const right = grid[r][c + 1];
          const below = grid[r + 1] && grid[r + 1][c];
          const diag = grid[r + 1] && grid[r + 1][c + (r % 2 ? 1 : -1)];

          if (right) edge(p, right);
          if (below) edge(p, below);
          if (diag) edge(p, diag);
        }
      }

      // nos acesos perto do ponteiro
      if (pointerOn) {
        for (let r = 0; r < grid.length; r += 1) {
          for (let c = 0; c < grid[r].length; c += 1) {
            const p = grid[r][c];
            const d = Math.hypot(p.x - px, p.y - py);
            if (d > REACH * 0.62) continue;
            const heat = clamp(1 - d / (REACH * 0.62), 0, 1) ** 2;
            ctx.fillStyle = `rgba(207, 251, 36, ${(heat * 0.85).toFixed(3)})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 1 + heat * 2.4, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      if (onScreen && (pointerOn || drift > 0.4)) meshFrame = requestAnimationFrame(draw);
    };

    const requestDraw = () => {
      if (!meshFrame) meshFrame = requestAnimationFrame(draw);
    };

    const movable = () => motionOn && finePointer.matches;

    window.addEventListener("pointermove", (event) => {
      if (!onScreen || !movable()) return;
      const rect = mesh.getBoundingClientRect();
      tx = event.clientX - rect.left;
      ty = event.clientY - rect.top;
      if (!pointerOn) {
        pointerOn = true;
        px = tx;
        py = ty;
      }
      requestDraw();
    }, { passive: true });

    if (host) {
      host.addEventListener("pointerleave", () => {
        pointerOn = false;
        tx = -9999;
        ty = -9999;
        requestDraw();
      });
    }

    new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        onScreen = entry.isIntersecting;
        if (onScreen) requestDraw();
      });
    }, { rootMargin: "120px" }).observe(mesh);

    let resizeFrame = 0;
    const onResize = () => {
      window.cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => {
        build();
        // redimensionar o canvas apaga o conteudo, entao repinta direto em vez
        // de pedir quadro: um requestDraw e engolido se ja houver um pendente,
        // e a trama ficaria em branco ate o ponteiro se mexer
        draw();
      });
    };

    window.addEventListener("resize", onResize, { passive: true });

    build();
    draw(); // primeiro quadro sincrono: a trama ja nasce desenhada
    mesh.classList.add("is-live");
  });

  /* ------------------------------------------------------------------ */
  /* Respect a mid-session motion preference change                      */
  /* ------------------------------------------------------------------ */
  reduceMotion.addEventListener?.("change", (event) => {
    motionOn = !event.matches;

    if (!motionOn) {
      revealNodes.forEach((node) => node.classList.add("is-revealed"));
      document.querySelectorAll(".word").forEach((word) => word.classList.add("is-lit"));
    }

    syncScroller();
    requestScroll();
  });
})();

/* ==========================================================================
   KRIO — cartas de serviço
   Inclinação 3D e deslocamento do verniz conforme o ponteiro.
   Só escreve custom properties; toda a aparência está no styles.css.
   ========================================================================== */
(() => {
  "use strict";

  const cards = [...document.querySelectorAll("[data-holo]")];
  if (!cards.length) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)");
  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

  const TILT_X = 9; // graus, eixo vertical do ponteiro
  const TILT_Y = 11; // graus, eixo horizontal

  const active = () => canHover.matches && !reduceMotion.matches;

  cards.forEach((card) => {
    const face = card.querySelector(".holo-card__face");
    if (!face) return;

    let frame = 0;
    let pending = null;

    const apply = () => {
      frame = 0;
      if (!pending) return;

      const { nx, ny, mx, my } = pending;

      // nx/ny vão de -0.5 a 0.5 a partir do centro da carta.
      // O sinal do eixo X é invertido: mouse acima do centro inclina o topo
      // para trás, que é como uma carta real responde na mão.
      face.style.setProperty("--ry", `${(nx * TILT_Y * 2).toFixed(2)}deg`);
      face.style.setProperty("--rx", `${(-ny * TILT_X * 2).toFixed(2)}deg`);
      face.style.setProperty("--mx", `${mx.toFixed(1)}%`);
      face.style.setProperty("--my", `${my.toFixed(1)}%`);

      // o verniz corre mais que o ponteiro, senão parece colado na superfície
      face.style.setProperty("--fx", `${(mx * 1.6 - 30).toFixed(1)}%`);
      face.style.setProperty("--fy", `${(my * 1.6 - 30).toFixed(1)}%`);
    };

    const onMove = (event) => {
      if (!active()) return;

      const rect = face.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const px = (event.clientX - rect.left) / rect.width;
      const py = (event.clientY - rect.top) / rect.height;

      pending = {
        nx: clamp(px - 0.5, -0.5, 0.5),
        ny: clamp(py - 0.5, -0.5, 0.5),
        mx: clamp(px * 100, 0, 100),
        my: clamp(py * 100, 0, 100),
      };

      if (!frame) frame = requestAnimationFrame(apply);
    };

    const onEnter = () => {
      if (!active()) return;
      face.classList.add("is-tracking", "is-lit");
      face.style.setProperty("--holo", "1");
    };

    const onLeave = () => {
      // tira o is-tracking para a transição voltar e a carta assentar sozinha
      face.classList.remove("is-tracking", "is-lit");
      face.style.setProperty("--holo", "0");
      face.style.setProperty("--rx", "0deg");
      face.style.setProperty("--ry", "0deg");
      face.style.setProperty("--mx", "50%");
      face.style.setProperty("--my", "50%");
      pending = null;
      if (frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    };

    card.addEventListener("pointerenter", onEnter);
    card.addEventListener("pointermove", onMove, { passive: true });
    card.addEventListener("pointerleave", onLeave);

    // teclado e leitores de tela: foco acende a carta, sem inclinar
    card.addEventListener("focusin", onEnter);
    card.addEventListener("focusout", onLeave);
  });

  /* ---------------------------------------------------------------- */
  /* Sem ponteiro: o giroscopio comanda a inclinacao; onde nao houver   */
  /* sensor (ou a permissao for negada), a carta se inclina conforme    */
  /* atravessa a tela. Nenhum dos dois disputa o gesto de rolagem.      */
  /* ---------------------------------------------------------------- */
  if (!canHover.matches && !reduceMotion.matches) {
    const faces = cards
      .map((card) => card.querySelector(".holo-card__face"))
      .filter(Boolean);
    let temGyro = false;
    let scrollFrame = 0;

    const aplicar = (face, x, y, brilho) => {
      face.style.setProperty("--ry", `${(x * 10).toFixed(2)}deg`);
      face.style.setProperty("--rx", `${(-y * 8).toFixed(2)}deg`);
      face.style.setProperty("--holo", brilho.toFixed(3));
      face.style.setProperty("--mx", `${(50 + x * 32).toFixed(1)}%`);
      face.style.setProperty("--my", `${(50 + y * 32).toFixed(1)}%`);
      face.style.setProperty("--fx", `${(50 + x * 58).toFixed(1)}%`);
      face.style.setProperty("--fy", `${(50 + y * 58).toFixed(1)}%`);
    };

    window.addEventListener("krio:tilt", (event) => {
      const { x, y } = event.detail;
      temGyro = true;
      const brilho = clamp(Math.hypot(x, y) * 1.25, 0, 1);
      faces.forEach((face) => aplicar(face, x, y, brilho));
    });

    const porScroll = () => {
      scrollFrame = 0;
      if (temGyro) return;

      const meio = (window.innerHeight || 1) / 2;
      faces.forEach((face) => {
        const rect = face.getBoundingClientRect();
        // -1 entrando por baixo, 0 no centro da tela, 1 saindo por cima
        const t = clamp((rect.top + rect.height / 2 - meio) / meio, -1, 1);
        aplicar(face, -t * 0.4, t * 0.6, clamp(1 - Math.abs(t), 0, 1));
      });
    };

    const pedirScroll = () => {
      if (!scrollFrame) scrollFrame = requestAnimationFrame(porScroll);
    };

    // São cinco cartas: aplicar em todas sai mais barato que manter um
    // IntersectionObserver vivo, e remove um ponto de falha — a entrega do
    // observer depende do ciclo de renderização, que nem sempre roda.
    faces.forEach((face) => face.classList.add("is-tracking"));

    window.addEventListener("scroll", pedirScroll, { passive: true });
    window.addEventListener("resize", pedirScroll, { passive: true });
    pedirScroll();

    // encostar na carta responde na hora, sem depender de sensor
    cards.forEach((card) => {
      const face = card.querySelector(".holo-card__face");
      if (!face) return;
      card.addEventListener("touchstart", () => face.classList.add("is-pressed"), {
        passive: true,
      });
      ["touchend", "touchcancel"].forEach((evento) =>
        card.addEventListener(evento, () => face.classList.remove("is-pressed"), {
          passive: true,
        }),
      );
    });
  }

  // se a preferência mudar no meio da sessão, tudo volta ao repouso
  reduceMotion.addEventListener?.("change", () => {
    if (reduceMotion.matches) {
      document.querySelectorAll(".holo-card__face").forEach((face) => {
        face.classList.remove("is-tracking", "is-lit");
        face.style.setProperty("--holo", "0");
        face.style.setProperty("--rx", "0deg");
        face.style.setProperty("--ry", "0deg");
      });
    }
  });
})();
