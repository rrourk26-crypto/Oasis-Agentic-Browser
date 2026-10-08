/* Oasis -> Element launcher.
   Element handles signup/login and the actual Oasis room chat.
   Nothing from Matrix is embedded in the main app.
*/
(function () {
  "use strict";

  const ELEMENT_ROOM_URL = "https://app.element.io/#/room/#oasis-lobby:matrix.org";

  function openOasisElement() {
    const width = Math.min(1450, Math.max(1000, window.screen.availWidth - 120));
    const height = Math.min(900, Math.max(700, window.screen.availHeight - 120));
    const left = Math.max(0, Math.round((window.screen.availWidth - width) / 2));
    const top = Math.max(0, Math.round((window.screen.availHeight - height) / 2));

    const features = [
      "popup=yes",
      "width=" + width,
      "height=" + height,
      "left=" + left,
      "top=" + top,
      "resizable=yes",
      "scrollbars=yes"
    ].join(",");

    const win = window.open(ELEMENT_ROOM_URL, "oasisElement", features);

    if (win) {
      try { win.focus(); } catch (e) {}
    } else {
      // Browser popup blockers normally allow a user-initiated click,
      // but if this browser blocks it, open the same room in a normal tab.
      const a = document.createElement("a");
      a.href = ELEMENT_ROOM_URL;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.click();
    }
  }

  function init() {
    const btn = document.getElementById("openOasisElement");
    if (!btn) return;
    btn.addEventListener("click", openOasisElement);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
