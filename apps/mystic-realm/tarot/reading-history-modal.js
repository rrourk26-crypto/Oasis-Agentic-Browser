/* =====================================================================
   MYSTIC REALM — PER-MODULE READING HISTORY MODAL
   A drop-in, self-contained popup that shows ONLY the readings that
   belong to the module it was opened from (Tarot, Astragalomancy,
   Numerology, Horoscope, Dreams, Selene, etc). It never navigates
   away from the page it's opened on — it just opens a modal on top
   of whatever module you're already in, and closes back into it.

   Requires reading-history.js (window.ReadingHistory) to be loaded
   first. All styles/markup are namespaced under "mrhm-" so this can't
   collide with a host page's own CSS.

   Usage from a module page:

       MysticHistoryModal.open({
           title: "Tarot Readings",
           icon: "🔮",
           filter: (entry) => (entry.app || "Mystic Tarot") === "Mystic Tarot"
       });
===================================================================== */

(function () {
  "use strict";

  if (window.MysticHistoryModal) {
    return; // already injected on this page
  }

  const STYLE_ID = "mrhmStyles";
  const OVERLAY_ID = "mrhmOverlay";

  let state = {
    title: "Past Readings",
    icon: "📜",
    filter: () => true,
  };

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
#${OVERLAY_ID} {
    display: none;
    position: fixed;
    inset: 0;
    z-index: 9999;
    padding: 25px;
    background: rgba(3, 1, 7, 0.82);
    backdrop-filter: blur(9px);
    align-items: center;
    justify-content: center;
    font-family: 'Cinzel', Georgia, serif;
}
#${OVERLAY_ID}.mrhm-active { display: flex; }

.mrhm-modal {
    width: min(900px, 100%);
    max-height: min(820px, 90vh);
    display: flex;
    flex-direction: column;
    border: 1px solid rgba(255, 215, 0, 0.4);
    border-radius: 8px;
    background:
        radial-gradient(circle at top right, rgba(126, 65, 163, 0.2), transparent 35%),
        rgba(14, 6, 22, 0.97);
    box-shadow: 0 30px 100px rgba(0, 0, 0, 0.75), 0 0 50px rgba(141, 92, 255, 0.12);
    overflow: hidden;
    color: #f7f0ff;
}

.mrhm-header {
    padding: 22px 25px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 15px;
    border-bottom: 1px solid rgba(255, 215, 0, 0.16);
}
.mrhm-header h2 {
    margin: 0;
    color: #ffd700;
    font-size: 1.1rem;
    letter-spacing: 0.08em;
}
.mrhm-close {
    border: 0;
    background: transparent;
    color: #ffd700;
    font-size: 1.5rem;
    line-height: 1;
    cursor: pointer;
}

.mrhm-tools {
    padding: 17px 20px;
    display: flex;
    gap: 10px;
    border-bottom: 1px solid rgba(255, 215, 0, 0.1);
}
.mrhm-tools input {
    flex: 1;
    min-width: 0;
    padding: 12px 14px;
    border: 1px solid rgba(255, 215, 0, 0.2);
    border-radius: 4px;
    outline: none;
    color: white;
    background: rgba(0, 0, 0, 0.3);
    font-family: inherit;
}
.mrhm-tools input:focus { border-color: rgba(255, 215, 0, 0.55); }

.mrhm-clear {
    padding: 10px 14px;
    border: 1px solid rgba(157, 32, 72, 0.55);
    border-radius: 4px;
    color: #f2a7bb;
    background: rgba(100, 15, 46, 0.25);
    font-family: inherit;
    font-size: 0.85rem;
    cursor: pointer;
    white-space: nowrap;
}

.mrhm-list { flex: 1; padding: 20px; overflow-y: auto; }

.mrhm-footer {
    padding: 12px 20px;
    border-top: 1px solid rgba(255, 215, 0, 0.16);
    text-align: center;
}
.mrhm-footer a {
    color: #ffd700;
    font-size: 0.82em;
    text-decoration: none;
    opacity: 0.85;
}
.mrhm-footer a:hover { opacity: 1; text-decoration: underline; }

.mrhm-empty {
    padding: 55px 20px;
    text-align: center;
    color: #806d8d;
    font-family: Georgia, serif;
}

.mrhm-entry {
    margin-bottom: 14px;
    padding: 18px;
    border: 1px solid rgba(255, 215, 0, 0.12);
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.025);
}
.mrhm-entry:last-child { margin-bottom: 0; }

.mrhm-entry-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 15px;
}
.mrhm-entry-title { color: #ffd700; font-size: 0.9rem; }
.mrhm-entry-date { margin-top: 5px; color: #776783; font-size: 0.7rem; }

.mrhm-delete {
    border: 0;
    background: transparent;
    color: #8d697b;
    cursor: pointer;
    font-size: 1rem;
}
.mrhm-delete:hover { color: #ff8cae; }

.mrhm-cards { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 13px; }
.mrhm-card {
    padding: 6px 9px;
    border: 1px solid rgba(255, 215, 0, 0.12);
    border-radius: 4px;
    color: #bfaecc;
    background: rgba(0, 0, 0, 0.22);
    font-size: 0.67rem;
}

.mrhm-ai-block {
    margin-top: 14px;
    padding: 14px 16px;
    border: 1px solid rgba(255, 215, 0, 0.14);
    border-radius: 6px;
    background: rgba(0, 0, 0, 0.2);
    color: #d9cce2;
    font-family: Georgia, serif;
    font-size: 0.85rem;
    line-height: 1.7;
}
.mrhm-ai-none {
    margin-top: 14px;
    color: #766681;
    font-family: Georgia, serif;
    font-size: 0.8rem;
    font-style: italic;
}

@media (max-width: 600px) {
    #${OVERLAY_ID} { padding: 12px; }
    .mrhm-header { padding: 18px 18px; }
    .mrhm-tools { flex-direction: column; }
}
`;
    document.head.appendChild(style);
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function journalHref() {
    // Journal lives at mystic-realm/journal/index.html. This modal is
    // injected on pages at two possible depths: the site root (which
    // loads reading-history.js as "tarot/reading-history.js"), or one
    // folder down (every module page, which loads it as either
    // "reading-history.js" from inside tarot/ itself, or
    // "../tarot/reading-history.js" from every other module).
    const s = document.querySelector('script[src*="reading-history.js"]');
    const src = s ? s.getAttribute("src") || "" : "";
    return src.indexOf("tarot/") === 0 ? "journal/index.html" : "../journal/index.html";
  }

  function injectMarkup() {
    if (document.getElementById(OVERLAY_ID)) return;

    const overlay = document.createElement("div");
    overlay.id = OVERLAY_ID;
    overlay.innerHTML = `
      <div class="mrhm-modal">
        <div class="mrhm-header">
          <h2 id="mrhmTitle">📜 Past Readings</h2>
          <button class="mrhm-close" type="button" aria-label="Close">×</button>
        </div>
        <div class="mrhm-tools">
          <input id="mrhmSearch" type="search" placeholder="Search these readings...">
          <button class="mrhm-clear" type="button" id="mrhmClearBtn">Clear These</button>
        </div>
        <div class="mrhm-list" id="mrhmList"></div>
        <div class="mrhm-footer"><a href="${journalHref()}">📖 Open your full Book of Shadows (every realm, with notes) →</a></div>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.addEventListener("click", function (event) {
      if (event.target === overlay) close();
    });
    overlay.querySelector(".mrhm-close").addEventListener("click", close);
    overlay.querySelector("#mrhmSearch").addEventListener("input", render);
    overlay.querySelector("#mrhmClearBtn").addEventListener("click", clearThese);

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") close();
    });
  }

  function currentEntries() {
    if (!window.ReadingHistory) return [];
    return window.ReadingHistory.loadAll().filter(state.filter);
  }

  function render() {
    const list = document.getElementById("mrhmList");
    const search = document.getElementById("mrhmSearch");
    if (!list) return;

    if (!window.ReadingHistory) {
      list.innerHTML = `<div class="mrhm-empty">History module not loaded.</div>`;
      return;
    }

    const query = String(search?.value || "").trim().toLowerCase();

    let entries = currentEntries();

    if (query) {
      entries = entries.filter((entry) => {
        const spreadTitle = String(entry.spreadTitle || "").toLowerCase();
        if (spreadTitle.includes(query)) return true;

        return (entry.cards || []).some((c) => {
          if (c.cardName) {
            return String(c.cardName)
              .replace(/\.jpg$/i, "")
              .replace(/_/g, " ")
              .toLowerCase()
              .includes(query);
          }
          if (c.text) {
            return String(c.text).toLowerCase().includes(query);
          }
          return false;
        });
      });
    }

    if (!entries.length) {
      list.innerHTML = query
        ? `<div class="mrhm-empty">No readings matched your search.</div>`
        : `
            <div class="mrhm-empty">
                <div style="font-size:2rem;margin-bottom:12px;">${escapeHtml(state.icon)}</div>
                No readings have been recorded here yet.
                <br><br>
                Your future readings will appear here.
            </div>
        `;
      return;
    }

    list.innerHTML = entries
      .map((entry) => {
        let dateText = "";
        try {
          if (entry.timestamp) dateText = new Date(entry.timestamp).toLocaleString();
        } catch (e) {
          dateText = String(entry.timestamp || "");
        }

        const cards = Array.isArray(entry.cards) ? entry.cards : [];

        const cardsHtml = cards.length
          ? `
            <div class="mrhm-cards">
                ${cards
                  .map((card) => {
                    if (card && card.cardName) {
                      const cleanName = String(card.cardName).replace(/\.jpg$/i, "").replace(/_/g, " ");
                      const orientation = card.reversed ? "Reversed" : "Upright";
                      const pos = card.position ? escapeHtml(card.position) + ": " : "";
                      return `<span class="mrhm-card">${pos}${escapeHtml(cleanName)} (${orientation})</span>`;
                    }
                    return `<span class="mrhm-card">${escapeHtml((card && card.text) || "")}</span>`;
                  })
                  .join("")}
            </div>
          `
          : "";

        const aiHtml = entry.aiText
          ? `<div class="mrhm-ai-block">🤖 ${escapeHtml(entry.aiText)}</div>`
          : `<div class="mrhm-ai-none">No AI interpretation was generated for this reading.</div>`;

        const title = entry.spreadTitle || entry.title || state.title || "Reading";

        return `
            <div class="mrhm-entry">
                <div class="mrhm-entry-top">
                    <div>
                        <div class="mrhm-entry-title">${escapeHtml(state.icon)} ${escapeHtml(title)}</div>
                        <div class="mrhm-entry-date">${escapeHtml(dateText)}</div>
                    </div>
                    <button class="mrhm-delete" type="button" data-id="${escapeHtml(entry.id)}" aria-label="Delete reading">🗑️</button>
                </div>
                ${cardsHtml}
                ${aiHtml}
            </div>
        `;
      })
      .join("");

    list.querySelectorAll(".mrhm-delete").forEach((btn) => {
      btn.addEventListener("click", function () {
        const id = this.getAttribute("data-id");
        if (!window.ReadingHistory || !id) return;
        if (!confirm("Delete this reading?")) return;
        window.ReadingHistory.deleteOne(id);
        render();
      });
    });
  }

  function clearThese() {
    if (!window.ReadingHistory) return;
    if (!confirm(`Clear all ${state.title.toLowerCase()}? This cannot be undone.`)) return;

    if (typeof window.ReadingHistory.deleteWhere === "function") {
      window.ReadingHistory.deleteWhere(state.filter);
    } else {
      // fallback for older reading-history.js without deleteWhere
      currentEntries().forEach((e) => window.ReadingHistory.deleteOne(e.id));
    }
    render();
  }

  function open(options) {
    injectStyles();
    injectMarkup();

    state = Object.assign(
      { title: "Past Readings", icon: "📜", filter: () => true },
      options || {}
    );

    const titleEl = document.getElementById("mrhmTitle");
    if (titleEl) titleEl.textContent = `${state.icon} ${state.title}`;

    const clearBtn = document.getElementById("mrhmClearBtn");
    if (clearBtn) clearBtn.textContent = `Clear These`;

    const search = document.getElementById("mrhmSearch");
    if (search) search.value = "";

    document.getElementById(OVERLAY_ID).classList.add("mrhm-active");
    render();
  }

  function close() {
    const overlay = document.getElementById(OVERLAY_ID);
    if (overlay) overlay.classList.remove("mrhm-active");
  }

  window.MysticHistoryModal = { open, close };
})();
