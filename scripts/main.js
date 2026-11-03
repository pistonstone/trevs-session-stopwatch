import {emptyClock, elapsed, transition, formatTime} from "./clock.mjs";
import {legacyTotal} from "./migration.mjs";

const ID = "trevs-session-stopwatch";
const LEGACY_ID = "gm-session-tools";
let panel;
let queue = Promise.resolve();

function isKeeper() {
  return game.user.isGM && game.users.activeGM?.id === game.user.id && !game.modules.get(LEGACY_ID)?.active;
}

function readClock() {
  return game.settings.get(ID, "clock") ?? emptyClock();
}

async function migrateLegacyClock() {
  if (game.settings.get(ID, "legacyMigrationDone")) return;
  try {
    const raw = game.settings.storage.get("world").getItem(`${LEGACY_ID}.clock`);
    const imported = legacyTotal(raw);
    // A total already recorded by the new module always wins.
    if (imported && elapsed(readClock(), Date.now()) === 0) {
      await game.settings.set(ID, "clock", imported);
      if (imported.elapsedMs > 0) ui.notifications.info("Trev's Session Stopwatch copied your saved time from the old module.");
    }
    await game.settings.set(ID, "legacyMigrationDone", true);
  } catch (error) {
    console.error(`${ID} | Could not copy the old stopwatch total`, error);
    ui.notifications.warn("Trev's stopwatch could not copy the old total. Your old data has not been changed.");
  }
}

function changeClock(action, paused = game.paused) {
  // Serialize clicks, pause hooks, and checkpoints so writes cannot overtake one another.
  queue = queue.then(async () => {
    if (!isKeeper()) return;
    const next = transition(readClock(), action, Date.now(), paused);
    await game.settings.set(ID, "clock", next);
    if (action === "reset") await game.settings.set(ID, "lastLoggedTotal", -1);
    refreshPanel();
  }).catch(error => {
    console.error(`${ID} | Stopwatch update failed`, error);
    ui.notifications.error("Session stopwatch could not save. See the console for details.");
  });
  return queue;
}

function escapeText(value) {
  return String(value).replace(/[&<>"']/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"})[c]);
}

function saveSessionLog() {
  queue = queue.then(async () => {
    if (!isKeeper()) return;
    const stopped = transition(readClock(), "stop", Date.now());
    await game.settings.set(ID, "clock", stopped);
    const total = stopped.elapsedMs;
    if (total <= 0) {
      ui.notifications.warn("Start the stopwatch before saving a session.");
      return;
    }
    if (game.settings.get(ID, "lastLoggedTotal") === total) {
      ui.notifications.info("This stopwatch total has already been saved. Reset for a new session.");
      return;
    }
    let journal = game.journal.find(entry => entry.getFlag(ID, "sessionLog") === true);
    if (!journal) {
      journal = await JournalEntry.create({
        name: "Trev's Session Log",
        ownership: {default: CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE},
        flags: {[ID]: {sessionLog: true}}
      });
    }
    const date = new Date();
    const stamp = date.toLocaleString(undefined, {dateStyle: "medium", timeStyle: "short"});
    const players = game.users.filter(user => user.active && !user.isGM).map(user => user.name);
    await journal.createEmbeddedDocuments("JournalEntryPage", [{
      name: `Session — ${stamp}`,
      type: "text",
      text: {format: CONST.JOURNAL_ENTRY_PAGE_FORMATS.HTML, content:
        `<h2>Session log</h2><p><strong>Saved:</strong> ${escapeText(stamp)}</p>` +
        `<p><strong>Playing time:</strong> ${formatTime(total)}</p>` +
        `<p><strong>Players connected when saved:</strong> ${players.length ? players.map(escapeText).join(", ") : "None"}</p>`},
      flags: {[ID]: {loggedAt: date.toISOString(), elapsedMs: total}}
    }]);
    await game.settings.set(ID, "lastLoggedTotal", total);
    ui.notifications.info("Session saved to Trev's Session Log in Journals. Timer stopped.");
    refreshPanel();
  }).catch(error => {
    console.error(`${ID} | Could not save session log`, error);
    ui.notifications.error("Session log could not be saved. Your stopwatch total is kept; try again.");
  });
  return queue;
}

Hooks.once("init", () => {
  game.settings.register(ID, "clock", {
    scope: "world", config: false, type: Object, default: emptyClock(),
    onChange: () => refreshPanel()
  });
  game.settings.register(ID, "showTimer", {
    name: "Show session stopwatch", hint: "Show the floating stopwatch to GMs only.",
    scope: "client", config: true, type: Boolean, default: true,
    onChange: () => buildPanel()
  });
  game.settings.register(ID, "collapsed", {
    scope: "client", config: false, type: Boolean, default: false,
    onChange: () => refreshPanel()
  });
  game.settings.register(ID, "legacyMigrationDone", {
    scope: "world", config: false, type: Boolean, default: false
  });
  game.settings.register(ID, "lastLoggedTotal", {
    scope: "world", config: false, type: Number, default: -1,
    onChange: () => refreshPanel()
  });
});

function buildPanel() {
  panel?.remove();
  panel = undefined;
  if (!game.user.isGM || !game.settings.get(ID, "showTimer")) return;
  panel = document.createElement("section");
  panel.id = ID;
  panel.setAttribute("aria-label", "GM session stopwatch");
  panel.innerHTML = `
    <button type="button" class="gst-heading" data-action="collapse" aria-expanded="true">
      <span>SESSION TIME</span><span class="gst-collapse" aria-hidden="true">−</span>
    </button>
    <output class="gst-time" aria-label="Elapsed playing time">00:00:00</output>
    <div class="gst-body">
      <p class="gst-state"></p>
      <div class="gst-buttons">
        <button type="button" data-action="start">Start</button>
        <button type="button" data-action="stop">Stop</button>
        <button type="button" data-action="reset">Reset</button>
      </div>
      <button type="button" class="gst-save" data-action="save">Save session</button>
      <p class="gst-help">Pauses with Foundry. Stop before closing.</p>
    </div>`;
  panel.addEventListener("click", async event => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const action = button.dataset.action;
    if (action === "collapse") {
      await game.settings.set(ID, "collapsed", !game.settings.get(ID, "collapsed"));
      return;
    }
    if (!isKeeper()) return;
    if (action === "save") { await saveSessionLog(); return; }
    if (action === "reset" && !window.confirm("Reset session time to 00:00:00?")) return;
    await changeClock(action);
  });
  document.body.append(panel);
  refreshPanel();
}

function refreshPanel() {
  if (!panel) return;
  const state = readClock();
  const keeper = isKeeper();
  const collapsed = game.settings.get(ID, "collapsed");
  panel.classList.toggle("gst-collapsed", collapsed);
  panel.classList.toggle("gst-running", state.enabled && state.since !== null);
  panel.querySelector(".gst-heading").setAttribute("aria-expanded", String(!collapsed));
  panel.querySelector(".gst-collapse").textContent = collapsed ? "+" : "−";
  panel.querySelector(".gst-time").textContent = formatTime(elapsed(state, Date.now()));
  panel.querySelector(".gst-state").textContent = !keeper
    ? "Controlled by the primary connected GM"
    : !state.enabled ? "Stopped" : state.since === null ? "Paused with Foundry" : "Counting playing time";
  panel.querySelector('[data-action="start"]').disabled = !keeper || state.enabled;
  panel.querySelector('[data-action="stop"]').disabled = !keeper || !state.enabled;
  panel.querySelector('[data-action="reset"]').disabled = !keeper;
  panel.querySelector('[data-action="save"]').disabled = !keeper;
}

Hooks.once("ready", async () => {
  if (game.modules.get(LEGACY_ID)?.active) {
    if (game.user.isGM) ui.notifications.warn("Disable Trev's GM Session Tools (the old combined module), then reload to use Trev's Session Stopwatch.");
    return;
  }
  // Copy the old saved total once, then stop until the GM explicitly starts.
  if (isKeeper()) {
    await migrateLegacyClock();
    await changeClock("restore");
  }
  buildPanel();
  let ticks = 0;
  setInterval(() => {
    refreshPanel();
    if (++ticks % 15 === 0 && isKeeper() && readClock().enabled) void changeClock("checkpoint");
  }, 1000);
});

Hooks.on("pauseGame", paused => {
  if (isKeeper()) void changeClock(paused ? "pause" : "resume", paused);
});

Hooks.on("userConnected", () => refreshPanel());

// Public helper for an optional hotbar Script macro:
// game.modules.get("trevs-session-stopwatch").api.togglePanel();
Hooks.once("ready", () => {
  game.modules.get(ID).api = {
    togglePanel: async () => {
      await game.settings.set(ID, "showTimer", !game.settings.get(ID, "showTimer"));
    },
    start: () => changeClock("start"),
    stop: () => changeClock("stop"),
    saveSession: () => saveSessionLog(),
    getElapsedMs: () => elapsed(readClock(), Date.now())
  };
});
