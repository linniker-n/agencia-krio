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
      const progress = clamp((viewport - rect.top) / (viewport * 0.85), 0, 1);
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
