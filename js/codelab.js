/* ===========================================================
   Code Lab (added)
   A themed code editor / coding-challenge panel opened from the
   toolbar. It embeds OneCompiler (needs an internet connection).
   Nothing else in the page is touched.
   =========================================================== */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const panel = $("codeLab"), openBtn = $("openCodeLab");
  if (!panel || !openBtn) return;

  const BASE = "https://onecompiler.com/embed/";
  const TABS = {
    editor: {
      src: BASE + "python?theme=dark&hideNew=true&listenToEvents=true",
      pop: "https://onecompiler.com/python",
      title: "Code editor"
    },
    challenges: {
      src: BASE + "challenges/3w7dby3mt/beginners-coding-challenge?theme=dark",
      pop: BASE + "challenges/3w7dby3mt/beginners-coding-challenge",
      title: "Coding challenges"
    }
  };

  const framesEl = $("clFrames"), note = $("clNote"), runBtn = $("clRun"), pop = $("clPop");
  const frames = {};
  let current = "editor";

  function frameFor(name) {
    if (frames[name]) return frames[name];
    const f = document.createElement("iframe");
    f.title = TABS[name].title;
    f.setAttribute("frameborder", "0");
    f.setAttribute("allow", "clipboard-read; clipboard-write");
    f.setAttribute("referrerpolicy", "no-referrer");
    f.addEventListener("load", () => { note.hidden = true; });
    f.src = TABS[name].src;
    framesEl.appendChild(f);
    frames[name] = f;
    return f;
  }

  function showTab(name) {
    current = name;
    frameFor(name);
    Object.keys(frames).forEach((k) => { frames[k].hidden = k !== name; });
    panel.querySelectorAll(".cl-tab").forEach((t) => t.setAttribute("aria-selected", String(t.dataset.tab === name)));
    runBtn.style.display = name === "editor" ? "" : "none";
    pop.href = TABS[name].pop;
  }

  function openPanel() {
    panel.hidden = false;
    openBtn.classList.add("active");
    openBtn.setAttribute("aria-expanded", "true");
    showTab(current);
    /* On phones the expanded toolbar slides over the page, so tuck it away */
    const rail = $("rail");
    if (rail && rail.classList.contains("open") && window.matchMedia("(max-width: 600px)").matches) {
      rail.classList.remove("open");
      const t = $("toggleRail"); if (t) t.title = "Expand sidebar";
    }
  }
  function closePanel() {
    if (panel.hidden) return;
    panel.hidden = true;
    openBtn.classList.remove("active");
    openBtn.setAttribute("aria-expanded", "false");
  }

  openBtn.addEventListener("click", () => {
    window.open(TABS[current].pop, "_blank", "noopener,width=1100,height=750");
  });
  $("clClose").addEventListener("click", closePanel);
  panel.querySelectorAll(".cl-tab").forEach((t) => t.addEventListener("click", () => showTab(t.dataset.tab)));

  runBtn.addEventListener("click", () => {
    const f = frames.editor;
    if (f && f.contentWindow) f.contentWindow.postMessage({ eventType: "triggerRun" }, "*");
  });

  /* Going back to chat or history from the toolbar closes Code Lab (your code stays loaded) */
  ["newChat", "showHistory", "openLiveTV", "openBrowserTab"].forEach((id) => { const b = $(id); if (b) b.addEventListener("click", closePanel); });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !panel.hidden && !document.querySelector("dialog[open]")) closePanel();
  });
})();
