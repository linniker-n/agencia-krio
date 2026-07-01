(() => {
  "use strict";

  const state = {
    iframe: null,
    doc: null,
    selected: null,
    hovered: null,
    currentName: "site-editado.html",
    assetUrls: new Map(),
    history: [],
    future: [],
    moving: null,
    lastImageDataUrl: "",
    saveTimer: 0
  };

  const qs = (selector, root = document) => root.querySelector(selector);
  const qsa = (selector, root = document) => [...root.querySelectorAll(selector)];

  const els = {
    iframe: qs("#preview"),
    empty: qs("#emptyState"),
    htmlFile: qs("#htmlFile"),
    folderInput: qs("#folderInput"),
    newPageBtn: qs("#newPageBtn"),
    emptyNewBtn: qs("#emptyNewBtn"),
    exportBtn: qs("#exportBtn"),
    undoBtn: qs("#undoBtn"),
    redoBtn: qs("#redoBtn"),
    saveSnapshotBtn: qs("#saveSnapshotBtn"),
    documentName: qs("#documentName"),
    statusText: qs("#statusText"),
    selectedTag: qs("#selectedTag"),
    selectedName: qs("#selectedName"),
    selectedPath: qs("#selectedPath"),
    layers: qs("#layers"),
    layerCount: qs("#layerCount"),
    imageInput: qs("#imageInput"),
    imageDrop: qs("#imageDrop"),
    bgImageBtn: qs("#bgImageBtn"),
    hiddenBgInput: qs("#hiddenBgInput"),
    componentGrid: qs("#componentGrid"),
    animationPreset: qs("#animationPreset"),
    applyAnimationBtn: qs("#applyAnimationBtn"),
    customCss: qs("#customCss"),
    customJs: qs("#customJs"),
    applyCodeBtn: qs("#applyCodeBtn"),
    previewShell: qs("#previewShell"),
    editTextBtn: qs("#editTextBtn"),
    duplicateBtn: qs("#duplicateBtn"),
    deleteBtn: qs("#deleteBtn"),
    makeFlexBtn: qs("#makeFlexBtn"),
    makeGridBtn: qs("#makeGridBtn"),
    wrapBtn: qs("#wrapBtn"),
    resetMoveBtn: qs("#resetMoveBtn"),
    stageWrap: qs("#stageWrap")
  };

  state.iframe = els.iframe;

  const editorStyle = `
    html.ve-editor-active * {
      outline-offset: 2px;
    }

    [data-ve-hover] {
      outline: 1px dashed rgba(15, 23, 42, 0.42) !important;
      cursor: crosshair !important;
    }

    [data-ve-selected] {
      outline: 2px solid #b9e736 !important;
      box-shadow: 0 0 0 5px rgba(185, 231, 54, 0.18) !important;
    }

    [contenteditable="true"] {
      caret-color: #111827;
    }
  `;

  const effectsCss = `
    .ve-fade-up { animation: veFadeUp 760ms cubic-bezier(0.16, 1, 0.3, 1) both; }
    .ve-fade-in { animation: veFadeIn 680ms cubic-bezier(0.16, 1, 0.3, 1) both; }
    .ve-slide-left { animation: veSlideLeft 740ms cubic-bezier(0.16, 1, 0.3, 1) both; }
    .ve-float { animation: veFloat 5.8s ease-in-out infinite; will-change: transform; }
    .ve-pulse { animation: vePulse 3.4s ease-in-out infinite; will-change: transform, opacity; }
    .ve-scroll-reveal { opacity: 0; transform: translate3d(0, 32px, 0); transition: opacity 720ms cubic-bezier(0.16, 1, 0.3, 1), transform 720ms cubic-bezier(0.16, 1, 0.3, 1); }
    .ve-scroll-reveal.ve-in-view { opacity: 1; transform: translate3d(0, 0, 0); }
    .ve-parallax-lite { transform: translate3d(0, var(--ve-parallax-y, 0px), 0); will-change: transform; }
    @keyframes veFadeUp {
      from { opacity: 0; transform: translate3d(0, 30px, 0); }
      to { opacity: 1; transform: translate3d(0, 0, 0); }
    }
    @keyframes veFadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes veSlideLeft {
      from { opacity: 0; transform: translate3d(38px, 0, 0); }
      to { opacity: 1; transform: translate3d(0, 0, 0); }
    }
    @keyframes veFloat {
      0%, 100% { transform: translate3d(0, 0, 0); }
      50% { transform: translate3d(0, -12px, 0); }
    }
    @keyframes vePulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.78; transform: scale(1.025); }
    }
    @media (prefers-reduced-motion: reduce) {
      .ve-fade-up,
      .ve-fade-in,
      .ve-slide-left,
      .ve-float,
      .ve-pulse,
      .ve-scroll-reveal,
      .ve-parallax-lite {
        animation: none !important;
        opacity: 1 !important;
        transform: none !important;
        transition: none !important;
      }
    }
  `;

  const effectsJs = `
    (() => {
      const revealItems = [...document.querySelectorAll(".ve-scroll-reveal")];
      if (revealItems.length && "IntersectionObserver" in window) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("ve-in-view");
              observer.unobserve(entry.target);
            }
          });
        }, { threshold: 0.18 });
        revealItems.forEach((item) => observer.observe(item));
      } else {
        revealItems.forEach((item) => item.classList.add("ve-in-view"));
      }

      const parallaxItems = [...document.querySelectorAll(".ve-parallax-lite")];
      if (parallaxItems.length) {
        let ticking = false;
        const update = () => {
          const viewport = window.innerHeight || 1;
          parallaxItems.forEach((item) => {
            const rect = item.getBoundingClientRect();
            const progress = (rect.top + rect.height / 2 - viewport / 2) / viewport;
            item.style.setProperty("--ve-parallax-y", Math.max(-24, Math.min(24, progress * -42)) + "px");
          });
          ticking = false;
        };
        const request = () => {
          if (!ticking) {
            ticking = true;
            requestAnimationFrame(update);
          }
        };
        window.addEventListener("scroll", request, { passive: true });
        window.addEventListener("resize", request);
        update();
      }
    })();
  `;

  function setStatus(text) {
    els.statusText.textContent = text;
  }

  function currentViewportSize(mode = els.stageWrap.dataset.viewport || "desktop") {
    const sizes = {
      desktop: { width: 1440, height: 900 },
      tablet: { width: 820, height: 900 },
      mobile: { width: 390, height: 844 }
    };
    return sizes[mode] || null;
  }

  function updatePreviewScale() {
    if (!els.stageWrap) return;
    const mode = els.stageWrap.dataset.viewport || "desktop";
    const size = currentViewportSize(mode);
    if (!size) {
      els.stageWrap.style.setProperty("--preview-scale", "1");
      return;
    }
    const availableWidth = Math.max(320, els.stageWrap.clientWidth - 32);
    const availableHeight = Math.max(360, els.stageWrap.clientHeight - 32);
    const widthScale = availableWidth / size.width;
    const heightScale = availableHeight / size.height;
    const scale = Math.min(1, Math.max(0.38, Math.min(widthScale, heightScale)));
    els.stageWrap.style.setProperty("--preview-scale", scale.toFixed(3));
  }

  function safeText(text, fallback = "") {
    return typeof text === "string" && text.trim() ? text.trim() : fallback;
  }

  function createBlankDocument() {
    return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Pagina criada no editor</title>
    <style>
      :root { --ink: #161817; --paper: #f5f6ef; --accent: #c5e84a; }
      * { box-sizing: border-box; }
      body { margin: 0; background: var(--paper); color: var(--ink); font-family: Arial, sans-serif; }
      section { padding: clamp(64px, 12vw, 150px) clamp(20px, 6vw, 96px); }
      .hero { min-height: 100dvh; display: grid; align-items: center; background: linear-gradient(135deg, rgba(197, 232, 74, 0.28), transparent 45%), var(--paper); }
      .hero-inner { max-width: 980px; }
      .eyebrow { text-transform: uppercase; font-size: 12px; font-weight: 800; letter-spacing: 0.08em; color: #61710d; }
      h1 { margin: 18px 0; max-width: 10ch; font-size: clamp(58px, 12vw, 150px); line-height: 0.9; letter-spacing: -0.07em; }
      p { max-width: 62ch; font-size: 20px; line-height: 1.55; }
      .button { display: inline-flex; margin-top: 24px; padding: 14px 18px; background: var(--ink); color: white; text-decoration: none; font-weight: 800; border-radius: 10px; }
    </style>
  </head>
  <body>
    <section class="hero">
      <div class="hero-inner">
        <span class="eyebrow">pagina editavel</span>
        <h1>Comece pelo visual.</h1>
        <p>Selecione este texto, mova blocos, adicione imagens, crie faixas e exporte o HTML final.</p>
        <a class="button" href="#conteudo">Editar agora</a>
      </div>
    </section>
    <section id="conteudo">
      <h2>Nova faixa</h2>
      <p>Use o painel lateral para alterar cores, tamanhos, espacamentos, fundos e animacoes.</p>
    </section>
  </body>
</html>`;
  }

  function readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  function isAbsoluteUrl(value) {
    return /^(https?:|data:|blob:|mailto:|tel:|#|\/)/i.test(value || "");
  }

  function normalizePath(path) {
    return String(path || "").replace(/\\/g, "/").replace(/^\.\//, "");
  }

  function fileName(path) {
    return normalizePath(path).split("/").pop();
  }

  function findAsset(path, assetFiles) {
    const wanted = normalizePath(decodeURIComponent(path)).split(/[?#]/)[0];
    if (!wanted || isAbsoluteUrl(wanted)) return "";
    const exact = assetFiles.get(wanted);
    if (exact) return exact;
    const bySuffix = [...assetFiles.entries()].find(([key]) => key.endsWith(`/${wanted}`));
    if (bySuffix) return bySuffix[1];
    const byName = [...assetFiles.entries()].find(([key]) => fileName(key) === fileName(wanted));
    return byName ? byName[1] : "";
  }

  async function buildAssetMap(files) {
    state.assetUrls.forEach((url) => URL.revokeObjectURL(url));
    state.assetUrls.clear();
    const map = new Map();
    for (const file of files) {
      const path = normalizePath(file.webkitRelativePath || file.name);
      const url = URL.createObjectURL(file);
      state.assetUrls.set(path, url);
      map.set(path, url);
    }
    return map;
  }

  async function rewriteHtmlAssets(html, files) {
    const assetFiles = await buildAssetMap(files);
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    qsa("[src]", doc).forEach((el) => {
      const found = findAsset(el.getAttribute("src"), assetFiles);
      if (found) el.setAttribute("src", found);
    });

    qsa("[srcset]", doc).forEach((el) => {
      const parts = el
        .getAttribute("srcset")
        .split(",")
        .map((part) => {
          const [url, ...rest] = part.trim().split(/\s+/);
          const found = findAsset(url, assetFiles);
          return [found || url, ...rest].join(" ");
        });
      el.setAttribute("srcset", parts.join(", "));
    });

    for (const link of qsa('link[href]', doc)) {
      const href = link.getAttribute("href");
      const found = findAsset(href, assetFiles);
      if (!found) continue;
      if ((link.getAttribute("rel") || "").toLowerCase().includes("stylesheet")) {
        const cssFile = files.find((file) => normalizePath(file.webkitRelativePath || file.name).endsWith(normalizePath(href)));
        if (cssFile) {
          const css = await readFileAsText(cssFile);
          const rewritten = rewriteCssUrls(css, assetFiles);
          const blob = new Blob([rewritten], { type: "text/css" });
          link.setAttribute("href", URL.createObjectURL(blob));
        } else {
          link.setAttribute("href", found);
        }
      } else {
        link.setAttribute("href", found);
      }
    }

    qsa("[style]", doc).forEach((el) => {
      el.setAttribute("style", rewriteCssUrls(el.getAttribute("style"), assetFiles));
    });

    qsa("style", doc).forEach((style) => {
      style.textContent = rewriteCssUrls(style.textContent, assetFiles);
    });

    return `<!doctype html>\n${doc.documentElement.outerHTML}`;
  }

  function rewriteCssUrls(css, assetFiles) {
    return String(css || "").replace(/url\((['"]?)(.*?)\1\)/g, (match, quote, rawUrl) => {
      const found = findAsset(rawUrl, assetFiles);
      return found ? `url("${found}")` : match;
    });
  }

  function setDocument(html, name = "site-editado.html", options = {}) {
    const remember = options.remember !== false;
    state.currentName = name;
    els.documentName.textContent = name;
    els.empty.classList.add("is-hidden");
    els.iframe.classList.remove("is-hidden");
    els.previewShell.classList.remove("is-hidden");
    state.iframe.onload = () => {
      state.doc = state.iframe.contentDocument;
      state.selected = null;
      prepareDocument();
      if (remember) pushHistory(true);
      refreshPanels();
      updatePreviewScale();
      setStatus("Preview carregado. Clique em qualquer elemento para editar.");
    };
    state.iframe.srcdoc = html;
  }

  function prepareDocument() {
    const doc = state.doc;
    if (!doc) return;
    doc.documentElement.classList.add("ve-editor-active");
    ensureEditorStyle();
    ensureEffects();
    bindFrameEvents();
    assignIds();
  }

  function ensureEditorStyle() {
    const doc = state.doc;
    if (!doc || doc.querySelector("style[data-ve-editor-style]")) return;
    const style = doc.createElement("style");
    style.setAttribute("data-ve-editor-style", "");
    style.textContent = editorStyle;
    doc.head.appendChild(style);
  }

  function ensureEffects() {
    const doc = state.doc;
    if (!doc) return;
    if (!doc.querySelector("style[data-ve-effects-style]")) {
      const style = doc.createElement("style");
      style.setAttribute("data-ve-effects-style", "");
      style.textContent = effectsCss;
      doc.head.appendChild(style);
    }
    if (!doc.querySelector("script[data-ve-effects-script]")) {
      const script = doc.createElement("script");
      script.setAttribute("data-ve-effects-script", "");
      script.textContent = effectsJs;
      doc.body.appendChild(script);
    }
  }

  function bindFrameEvents() {
    const doc = state.doc;
    doc.addEventListener("click", onFrameClick, true);
    doc.addEventListener("mouseover", onFrameHover, true);
    doc.addEventListener("mouseout", onFrameOut, true);
    doc.addEventListener("pointerdown", onFramePointerDown, true);
    doc.addEventListener("dragover", (event) => event.preventDefault());
    doc.addEventListener("drop", onFrameDrop, true);
    doc.addEventListener("input", scheduleHistory, true);
  }

  function assignIds() {
    if (!state.doc) return;
    let index = 1;
    qsa("body *", state.doc).forEach((el) => {
      if (!el.dataset.veId) {
        el.dataset.veId = `ve-${index}`;
        index += 1;
      }
    });
  }

  function canSelect(el) {
    return el && el.nodeType === 1 && el !== state.doc.documentElement && el !== state.doc.body;
  }

  function onFrameClick(event) {
    const el = event.target;
    if (!canSelect(el)) return;
    event.preventDefault();
    event.stopPropagation();
    selectElement(el);
  }

  function onFrameHover(event) {
    const el = event.target;
    if (!canSelect(el) || el === state.selected) return;
    if (state.hovered) state.hovered.removeAttribute("data-ve-hover");
    state.hovered = el;
    el.setAttribute("data-ve-hover", "");
  }

  function onFrameOut() {
    if (state.hovered) {
      state.hovered.removeAttribute("data-ve-hover");
      state.hovered = null;
    }
  }

  function onFramePointerDown(event) {
    if (!state.selected || event.button !== 0 || !state.selected.contains(event.target)) return;
    if (event.target.closest("a, button, input, textarea, select")) return;
    if (state.selected.getAttribute("contenteditable") === "true") return;

    event.preventDefault();
    const startX = event.clientX;
    const startY = event.clientY;
    const currentX = Number(state.selected.dataset.veMoveX || 0);
    const currentY = Number(state.selected.dataset.veMoveY || 0);
    state.moving = {
      el: state.selected,
      startX,
      startY,
      currentX,
      currentY,
      frame: 0
    };
    state.doc.addEventListener("pointermove", onFramePointerMove, true);
    state.doc.addEventListener("pointerup", onFramePointerUp, true);
  }

  function onFramePointerMove(event) {
    if (!state.moving) return;
    const dx = event.clientX - state.moving.startX;
    const dy = event.clientY - state.moving.startY;
    const nextX = state.moving.currentX + dx;
    const nextY = state.moving.currentY + dy;
    cancelAnimationFrame(state.moving.frame);
    state.moving.frame = requestAnimationFrame(() => {
      state.moving.el.dataset.veMoveX = String(Math.round(nextX));
      state.moving.el.dataset.veMoveY = String(Math.round(nextY));
      state.moving.el.style.transform = `translate3d(${Math.round(nextX)}px, ${Math.round(nextY)}px, 0)`;
      state.moving.el.style.willChange = "transform";
    });
  }

  function onFramePointerUp() {
    if (!state.moving) return;
    state.moving.el.style.willChange = "";
    state.doc.removeEventListener("pointermove", onFramePointerMove, true);
    state.doc.removeEventListener("pointerup", onFramePointerUp, true);
    state.moving = null;
    pushHistory();
  }

  async function onFrameDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    const type = event.dataTransfer.getData("text/ve-component");
    if (!type) return;
    const target = canSelect(event.target) ? event.target : state.doc.body;
    const component = await createComponent(type);
    insertIntoTarget(target, component);
    selectElement(component);
    pushHistory();
  }

  function selectElement(el) {
    if (!canSelect(el)) return;
    if (state.selected) {
      state.selected.removeAttribute("data-ve-selected");
      state.selected.removeAttribute("contenteditable");
    }
    state.selected = el;
    el.setAttribute("data-ve-selected", "");
    refreshPanels();
  }

  function refreshPanels() {
    updateSelectedPanel();
    renderLayers();
    updateStyleInputs();
  }

  function updateSelectedPanel() {
    const el = state.selected;
    if (!el) {
      els.selectedTag.textContent = "nada selecionado";
      els.selectedName.textContent = "Clique em um elemento";
      els.selectedPath.textContent = "O painel sera atualizado automaticamente.";
      return;
    }
    els.selectedTag.textContent = el.tagName.toLowerCase();
    els.selectedName.textContent = describeElement(el);
    els.selectedPath.textContent = getElementPath(el);
  }

  function describeElement(el) {
    const id = el.id ? `#${el.id}` : "";
    const cls = el.className && typeof el.className === "string" ? `.${el.className.trim().split(/\s+/).slice(0, 2).join(".")}` : "";
    const text = (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 48);
    return `${el.tagName.toLowerCase()}${id}${cls}${text ? ` - ${text}` : ""}`;
  }

  function getElementPath(el) {
    const path = [];
    let current = el;
    while (current && current !== state.doc.body && current.nodeType === 1) {
      let name = current.tagName.toLowerCase();
      if (current.id) name += `#${current.id}`;
      path.unshift(name);
      current = current.parentElement;
    }
    return `body > ${path.join(" > ")}`;
  }

  function renderLayers() {
    if (!state.doc) {
      els.layers.innerHTML = "";
      els.layerCount.textContent = "0 itens";
      return;
    }
    const nodes = qsa("body *", state.doc)
      .filter((el) => !el.matches("script, style, meta, link") && !el.hasAttribute("data-ve-editor-style"))
      .slice(0, 180);
    els.layerCount.textContent = `${nodes.length} itens`;
    els.layers.innerHTML = "";
    const fragment = document.createDocumentFragment();
    nodes.forEach((el) => {
      const item = document.createElement("button");
      item.type = "button";
      item.className = `layer-item${el === state.selected ? " is-selected" : ""}`;
      item.style.paddingLeft = `${Math.min(2.4, depthOf(el) * 0.45)}rem`;
      item.innerHTML = `<code>${el.tagName.toLowerCase()}</code><span>${escapeHtml(layerLabel(el))}</span>`;
      item.addEventListener("click", () => selectElement(el));
      fragment.appendChild(item);
    });
    els.layers.appendChild(fragment);
  }

  function layerLabel(el) {
    return el.id || el.getAttribute("aria-label") || (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 44) || el.className || "elemento";
  }

  function depthOf(el) {
    let depth = 0;
    let current = el.parentElement;
    while (current && current !== state.doc.body) {
      depth += 1;
      current = current.parentElement;
    }
    return depth;
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => {
      const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
      return entities[char];
    });
  }

  function updateStyleInputs() {
    const el = state.selected;
    qsa("[data-style]").forEach((input) => {
      if (!el) {
        if (input.type !== "color") input.value = input.type === "range" ? "1" : "";
        return;
      }
      const prop = input.dataset.style;
      const value = el.style[prop] || "";
      if (input.type === "color") {
        input.value = toHexColor(value || getComputedStyle(el)[prop] || "#ffffff");
      } else if (input.type === "range") {
        input.value = value || "1";
      } else {
        input.value = value;
      }
    });
  }

  function toHexColor(value) {
    if (/^#[0-9a-f]{6}$/i.test(value)) return value;
    const match = String(value).match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    if (!match) return "#ffffff";
    return [match[1], match[2], match[3]]
      .map((num) => Number(num).toString(16).padStart(2, "0"))
      .join("")
      .replace(/^/, "#");
  }

  function applyStyle(prop, value) {
    if (!state.selected) return;
    if (value === "") {
      state.selected.style[prop] = "";
    } else {
      state.selected.style[prop] = value;
    }
    scheduleHistory();
  }

  function insertIntoTarget(target, component) {
    const host = isContainerLike(target) ? target : target.parentElement || state.doc.body;
    host.appendChild(component);
    assignIds();
  }

  function isContainerLike(el) {
    if (!el) return false;
    const tag = el.tagName.toLowerCase();
    return ["body", "main", "section", "article", "div", "header", "footer", "nav", "aside"].includes(tag);
  }

  async function createComponent(type) {
    const doc = state.doc;
    let el;
    if (type === "section") {
      el = doc.createElement("section");
      el.innerHTML = "<div><span>nova faixa</span><h2>Titulo da secao</h2><p>Edite este conteudo pelo painel visual.</p></div>";
      Object.assign(el.style, {
        padding: "96px 32px",
        background: "#f7f8f1",
        color: "#171817"
      });
    } else if (type === "container") {
      el = doc.createElement("div");
      el.innerHTML = "<h3>Novo container</h3><p>Use este bloco para agrupar textos, imagens e botoes.</p>";
      Object.assign(el.style, {
        maxWidth: "1120px",
        margin: "24px auto",
        padding: "32px",
        border: "1px solid rgba(17,24,39,.14)",
        borderRadius: "16px",
        background: "#ffffff"
      });
    } else if (type === "text") {
      el = doc.createElement("p");
      el.textContent = "Clique em Editar texto para alterar este conteudo.";
      Object.assign(el.style, {
        fontSize: "22px",
        lineHeight: "1.45"
      });
    } else if (type === "button") {
      el = doc.createElement("a");
      el.href = "#";
      el.textContent = "Nova chamada";
      Object.assign(el.style, {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "14px 18px",
        borderRadius: "10px",
        background: "#171817",
        color: "#ffffff",
        textDecoration: "none",
        fontWeight: "800"
      });
    } else if (type === "image") {
      el = doc.createElement("img");
      el.src = state.lastImageDataUrl || placeholderSvg();
      el.alt = "Imagem adicionada";
      Object.assign(el.style, {
        width: "min(100%, 720px)",
        display: "block",
        borderRadius: "16px",
        objectFit: "cover"
      });
    } else {
      el = doc.createElement("div");
      el.setAttribute("aria-hidden", "true");
      Object.assign(el.style, {
        minHeight: "80px"
      });
    }
    return el;
  }

  function placeholderSvg() {
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="720" viewBox="0 0 1200 720"><rect width="1200" height="720" fill="#e9ece1"/><circle cx="300" cy="220" r="90" fill="#c5e84a"/><path d="M130 560 430 330l190 150 160-110 290 190H130Z" fill="#171817" opacity=".88"/><text x="80" y="100" fill="#171817" font-family="Arial" font-size="44" font-weight="800">Imagem</text></svg>`)}`;
  }

  function scheduleHistory() {
    window.clearTimeout(state.saveTimer);
    state.saveTimer = window.setTimeout(() => pushHistory(), 450);
  }

  function pushHistory(force = false) {
    if (!state.doc) return;
    const html = serializeDocument({ keepEditor: true });
    if (!force && state.history[state.history.length - 1] === html) return;
    state.history.push(html);
    if (state.history.length > 40) state.history.shift();
    state.future = [];
  }

  function restoreHistory(html) {
    setDocument(html, state.currentName, { remember: false });
  }

  function undo() {
    if (state.history.length < 2) return;
    const current = state.history.pop();
    state.future.push(current);
    restoreHistory(state.history[state.history.length - 1]);
  }

  function redo() {
    const next = state.future.pop();
    if (!next) return;
    state.history.push(next);
    restoreHistory(next);
  }

  function serializeDocument({ keepEditor = false } = {}) {
    if (!state.doc) return "";
    const clone = state.doc.documentElement.cloneNode(true);
    clone.classList.remove("ve-editor-active");
    qsa("[data-ve-selected], [data-ve-hover]", clone).forEach((el) => {
      el.removeAttribute("data-ve-selected");
      el.removeAttribute("data-ve-hover");
    });
    qsa("[contenteditable]", clone).forEach((el) => el.removeAttribute("contenteditable"));
    if (!keepEditor) {
      qsa("[data-ve-id]", clone).forEach((el) => el.removeAttribute("data-ve-id"));
      qsa("style[data-ve-editor-style]", clone).forEach((el) => el.remove());
    }
    if (!qsa("style[data-ve-custom-css]", clone).length && els.customCss.value.trim()) {
      const style = clone.ownerDocument.createElement("style");
      style.setAttribute("data-ve-custom-css", "");
      style.textContent = els.customCss.value;
      clone.querySelector("head")?.appendChild(style);
    }
    if (!qsa("script[data-ve-custom-js]", clone).length && els.customJs.value.trim()) {
      const script = clone.ownerDocument.createElement("script");
      script.setAttribute("data-ve-custom-js", "");
      script.textContent = els.customJs.value;
      clone.querySelector("body")?.appendChild(script);
    }
    return `<!doctype html>\n${clone.outerHTML}`;
  }

  function downloadHtml() {
    if (!state.doc) return;
    const html = serializeDocument();
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const base = state.currentName.replace(/\.(html|htm)$/i, "");
    a.href = url;
    a.download = `${base || "site"}-editado.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setStatus("HTML exportado com edicoes aplicadas.");
  }

  function applyCustomCode() {
    if (!state.doc) return;
    qsa("style[data-ve-custom-css]", state.doc).forEach((el) => el.remove());
    qsa("script[data-ve-custom-js]", state.doc).forEach((el) => el.remove());
    if (els.customCss.value.trim()) {
      const style = state.doc.createElement("style");
      style.setAttribute("data-ve-custom-css", "");
      style.textContent = els.customCss.value;
      state.doc.head.appendChild(style);
    }
    if (els.customJs.value.trim()) {
      const script = state.doc.createElement("script");
      script.setAttribute("data-ve-custom-js", "");
      script.textContent = els.customJs.value;
      state.doc.body.appendChild(script);
    }
    pushHistory();
    setStatus("CSS e JS extras aplicados no preview.");
  }

  async function handleHtmlFile(file) {
    if (!file) return;
    const html = await readFileAsText(file);
    setDocument(html, file.name);
  }

  async function handleFolder(files) {
    const all = [...files];
    const htmlFile = all.find((file) => /(^|\/)index\.html?$/i.test(file.webkitRelativePath || file.name)) || all.find((file) => /\.html?$/i.test(file.name));
    if (!htmlFile) {
      setStatus("Nenhum arquivo HTML encontrado na pasta.");
      return;
    }
    const html = await readFileAsText(htmlFile);
    const rewritten = await rewriteHtmlAssets(html, all);
    setDocument(rewritten, htmlFile.name);
  }

  async function applyImageFile(file, asBackground = false) {
    if (!file || !state.doc) return;
    const dataUrl = await readFileAsDataUrl(file);
    state.lastImageDataUrl = dataUrl;
    const selected = state.selected;
    if (asBackground && selected) {
      selected.style.backgroundImage = `url("${dataUrl}")`;
      selected.style.backgroundSize = "cover";
      selected.style.backgroundPosition = "center";
      selected.style.backgroundRepeat = "no-repeat";
      pushHistory();
      return;
    }
    if (selected && selected.tagName.toLowerCase() === "img") {
      selected.src = dataUrl;
      selected.alt = safeText(file.name, "Imagem");
      pushHistory();
      return;
    }
    const img = await createComponent("image");
    img.src = dataUrl;
    img.alt = safeText(file.name, "Imagem adicionada");
    insertIntoTarget(selected || state.doc.body, img);
    selectElement(img);
    pushHistory();
  }

  function applyAnimation() {
    if (!state.selected) return;
    ensureEffects();
    const preset = els.animationPreset.value;
    const classes = ["ve-fade-up", "ve-fade-in", "ve-float", "ve-pulse", "ve-slide-left", "ve-scroll-reveal", "ve-parallax-lite"];
    state.selected.classList.remove(...classes);
    if (preset) state.selected.classList.add(preset);
    if (preset === "ve-scroll-reveal") state.selected.classList.remove("ve-in-view");
    pushHistory();
  }

  function wrapSelected() {
    if (!state.selected) return;
    const wrapper = state.doc.createElement("div");
    Object.assign(wrapper.style, {
      maxWidth: "1180px",
      margin: "0 auto",
      padding: "24px",
      border: "1px solid rgba(17, 24, 39, .12)",
      borderRadius: "16px"
    });
    const selected = state.selected;
    selected.parentNode.insertBefore(wrapper, selected);
    wrapper.appendChild(selected);
    selectElement(wrapper);
    pushHistory();
  }

  function resetMove() {
    if (!state.selected) return;
    delete state.selected.dataset.veMoveX;
    delete state.selected.dataset.veMoveY;
    state.selected.style.transform = "";
    state.selected.style.willChange = "";
    pushHistory();
  }

  function initEvents() {
    els.htmlFile.addEventListener("change", (event) => handleHtmlFile(event.target.files[0]));
    qsa("[data-proxy-for]").forEach((input) => {
      input.addEventListener("change", (event) => handleHtmlFile(event.target.files[0]));
    });
    els.folderInput.addEventListener("change", (event) => handleFolder(event.target.files));
    els.newPageBtn.addEventListener("click", () => setDocument(createBlankDocument(), "pagina-nova.html"));
    els.emptyNewBtn.addEventListener("click", () => setDocument(createBlankDocument(), "pagina-nova.html"));
    els.exportBtn.addEventListener("click", downloadHtml);
    els.undoBtn.addEventListener("click", undo);
    els.redoBtn.addEventListener("click", redo);
    els.saveSnapshotBtn.addEventListener("click", () => {
      pushHistory(true);
      setStatus("Estado salvo no historico local.");
    });

    qsa("[data-style]").forEach((input) => {
      input.addEventListener("input", () => applyStyle(input.dataset.style, input.value));
      input.addEventListener("change", () => applyStyle(input.dataset.style, input.value));
    });

    els.componentGrid.addEventListener("click", async (event) => {
      const btn = event.target.closest("[data-component]");
      if (!btn || !state.doc) return;
      const component = await createComponent(btn.dataset.component);
      insertIntoTarget(state.selected || state.doc.body, component);
      selectElement(component);
      pushHistory();
    });

    qsa("[data-component]").forEach((btn) => {
      btn.addEventListener("dragstart", (event) => {
        event.dataTransfer.setData("text/ve-component", btn.dataset.component);
        event.dataTransfer.effectAllowed = "copy";
      });
    });

    els.imageInput.addEventListener("change", (event) => applyImageFile(event.target.files[0]));
    els.hiddenBgInput.addEventListener("change", (event) => applyImageFile(event.target.files[0], true));
    els.bgImageBtn.addEventListener("click", () => els.hiddenBgInput.click());

    ["dragenter", "dragover"].forEach((type) => {
      els.imageDrop.addEventListener(type, (event) => {
        event.preventDefault();
        els.imageDrop.classList.add("is-hot");
      });
    });
    ["dragleave", "drop"].forEach((type) => {
      els.imageDrop.addEventListener(type, () => els.imageDrop.classList.remove("is-hot"));
    });
    els.imageDrop.addEventListener("drop", (event) => {
      event.preventDefault();
      applyImageFile(event.dataTransfer.files[0]);
    });

    els.editTextBtn.addEventListener("click", () => {
      if (!state.selected) return;
      state.selected.setAttribute("contenteditable", "true");
      state.selected.focus();
      setStatus("Edicao de texto ativa. Clique fora ou exporte quando terminar.");
    });
    els.duplicateBtn.addEventListener("click", () => {
      if (!state.selected) return;
      const clone = state.selected.cloneNode(true);
      clone.removeAttribute("data-ve-selected");
      state.selected.after(clone);
      assignIds();
      selectElement(clone);
      pushHistory();
    });
    els.deleteBtn.addEventListener("click", () => {
      if (!state.selected) return;
      const next = state.selected.parentElement;
      state.selected.remove();
      state.selected = null;
      if (canSelect(next)) selectElement(next);
      refreshPanels();
      pushHistory();
    });
    els.makeFlexBtn.addEventListener("click", () => {
      if (!state.selected) return;
      Object.assign(state.selected.style, {
        display: "flex",
        gap: "24px",
        alignItems: "center",
        flexWrap: "wrap"
      });
      pushHistory();
    });
    els.makeGridBtn.addEventListener("click", () => {
      if (!state.selected) return;
      Object.assign(state.selected.style, {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "24px"
      });
      pushHistory();
    });
    els.wrapBtn.addEventListener("click", wrapSelected);
    els.resetMoveBtn.addEventListener("click", resetMove);
    els.applyAnimationBtn.addEventListener("click", applyAnimation);
    els.applyCodeBtn.addEventListener("click", applyCustomCode);

    qsa("[data-viewport]").forEach((btn) => {
      btn.addEventListener("click", () => {
        qsa("[data-viewport]").forEach((item) => item.classList.remove("active"));
        btn.classList.add("active");
        els.stageWrap.dataset.viewport = btn.dataset.viewport;
        updatePreviewScale();
      });
    });

    window.addEventListener("resize", updatePreviewScale);
  }

  initEvents();
  els.stageWrap.dataset.viewport = "desktop";
  updatePreviewScale();
  els.iframe.classList.add("is-hidden");
  els.previewShell.classList.add("is-hidden");
})();
