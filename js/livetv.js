/* ===========================================================
   Live TV (added)
   Opens the bundled tv.html (IPTV/M3U player) in a themed panel
   from the toolbar. Runs entirely locally, no internet needed
   beyond whatever stream you tune in to.
   =========================================================== */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const panel = $("liveTV"), openBtn = $("openLiveTV"), frame = $("ltFrame");
  if (!panel || !openBtn || !frame) return;

  function openPanel() {
    panel.hidden = false;
    openBtn.classList.add("active");
    openBtn.setAttribute("aria-expanded", "true");
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
    /* Stop the stream when you leave, unless you've popped it into
       picture-in-picture, in which case it should keep playing. */
    try { frame.contentWindow.postMessage({ lt: "pause" }, "*"); } catch (e) {}
  }

  openBtn.addEventListener("click", () => {
    window.open(frame.getAttribute("src") || "tv.html", "_blank", "noopener,width=1000,height=650");
  });
  $("ltClose").addEventListener("click", closePanel);
  $("ltPop").addEventListener("click", () => window.open(frame.src, "_blank", "noopener"));

  /* Going back to chat or history closes the panel too */
  ["newChat", "showHistory", "openCodeLab", "openBrowserTab"].forEach((id) => { const b = $(id); if (b) b.addEventListener("click", closePanel); });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !panel.hidden && !document.querySelector("dialog[open]")) closePanel();
  });
})();
