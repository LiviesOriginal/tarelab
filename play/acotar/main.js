import "./styles.css";
import { PUZZLES, VALID_GUESSES } from "./data.js";

const SAVE_KEY = "court-of-letters-v2";
const SPOILER_KEY = "court-spoilers";

// Everything is keyed to the player's local calendar day.
const NOW = new Date();
const pad = n => String(n).padStart(2, "0");
const DAY_KEY = `${NOW.getFullYear()}-${pad(NOW.getMonth() + 1)}-${pad(NOW.getDate())}`;
const DAYS_SINCE_START = Math.round(
  (Date.UTC(NOW.getFullYear(), NOW.getMonth(), NOW.getDate()) - Date.UTC(2026, 0, 1)) / 86400000
);
// One puzzle a day. After the last clue the list simply loops.
const DAILY_PUZZLE = PUZZLES[((DAYS_SINCE_START % PUZZLES.length) + PUZZLES.length) % PUZZLES.length];

// Saved data:
//   streak  - Victory Streak (days in a row solved before running out of guesses)
//   archive - { puzzleId: "won" | "lost" } for every clue that has been played
//   daily   - today's guesses and status, so a refresh can't be used to retry
function loadSave() {
  let s = null;
  try { s = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch {}
  s = s && typeof s === "object" ? s : {};
  const save = {
    streak: Number.isInteger(s.streak) && s.streak > 0 ? s.streak : 0,
    archive: s.archive && typeof s.archive === "object" ? s.archive : {},
    daily: s.daily
  };
  const d = save.daily;
  if (!d || d.day !== DAY_KEY || d.id !== DAILY_PUZZLE.id || !Array.isArray(d.guesses)) {
    save.daily = { day: DAY_KEY, id: DAILY_PUZZLE.id, guesses: [], status: "playing" };
  }
  return save;
}

const state = {
  view: "game",          // "game" or "archive"
  replay: false,         // true when playing a clue from the archive
  puzzle: DAILY_PUZZLE,
  guesses: [],
  current: "",
  gameOver: false,
  message: "",
  save: loadSave(),
  spoilerAccepted: localStorage.getItem(SPOILER_KEY) === "yes"
};

function persist() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state.save)); } catch {}
}

function resumeDaily() {
  const d = state.save.daily;
  state.view = "game";
  state.replay = false;
  state.puzzle = DAILY_PUZZLE;
  state.guesses = [...d.guesses];
  state.current = "";
  state.gameOver = d.status !== "playing";
  state.message = d.status === "won" ? "Solved. A new clue arrives tomorrow."
    : d.status === "lost" ? `The word was ${DAILY_PUZZLE.answer}.` : "";
}

function clueNumber(p) { return PUZZLES.indexOf(p) + 1; }

function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function evaluate(guess, answer) {
  const result = Array(5).fill("absent");
  const counts = {};
  [...answer].forEach(ch => counts[ch] = (counts[ch] || 0) + 1);
  [...guess].forEach((ch, i) => {
    if (ch === answer[i]) { result[i] = "correct"; counts[ch]--; }
  });
  [...guess].forEach((ch, i) => {
    if (result[i] === "correct") return;
    if (counts[ch] > 0) { result[i] = "present"; counts[ch]--; }
  });
  return result;
}

// Gold frame, corner art and castle. Sits behind everything on every screen.
function decorMarkup() {
  return `<div class="decor" aria-hidden="true">
    <div class="castle"></div>
    <div class="frame-line"></div><div class="frame-line inner"></div>
    <div class="piece p-tl"></div><div class="piece p-tr"></div>
    <div class="piece p-bl"></div><div class="piece p-br"></div>
  </div>`;
}

// The clue card: notched double border with a star at each side.
function clueCardMarkup() {
  return `<div class="clue-card">
      <span class="orn l">✦</span><span class="orn r">✦</span>
      <span class="clue-label">THE CLUE</span>
      <p>${esc(state.puzzle.clue)}</p>
    </div>`;
}

function heroMarkup() {
  if (state.view === "archive") {
    return `
      <div class="eyebrow">THE ARCHIVES</div>
      <h1>Clues You've Faced</h1>
      <div class="archive-intro">Every clue you play is kept here for another try. The answers stay hidden until you find them again.</div>
      <button class="secondary" data-action="today">BACK TO TODAY'S CLUE</button>
    `;
  }
  if (state.replay) {
    return `
      <div class="eyebrow">ARCHIVES · CLUE ${clueNumber(state.puzzle)}</div>
      <h1>Another Turn at the Word</h1>
      ${clueCardMarkup()}
      <button class="secondary" data-action="today">BACK TO TODAY'S CLUE</button>
    `;
  }
  return `
    <div class="eyebrow">TODAY'S GUESS</div>
    <h1>A Word Worth Guessing</h1>
    ${clueCardMarkup()}
    <div class="streak-pill">VICTORY STREAK <strong>${state.save.streak}</strong></div>
  `;
}

function render() {
  const inGame = state.view === "game";
  document.querySelector("#app").innerHTML = `
    ${decorMarkup()}
    <main class="shell">
      <div class="ambient ambient-a"></div><div class="ambient ambient-b"></div>
      <header class="topbar">
        <div class="wordmark">
          <span>A Court of</span>
          <strong>Letters &amp; Guesses</strong>
        </div>
      </header>

      <section class="hero">
        <div class="thorn-rule">
          <button class="icon-btn" data-action="archive" aria-label="${inGame ? "Open the archives" : "Close the archives"}">☰</button>
          <i></i><span>✦</span><i></i>
          <button class="icon-btn" data-action="stats" aria-label="View your Victory Streak">♢</button>
        </div>
        ${heroMarkup()}
      </section>

      ${inGame ? gameMarkup() : archiveMarkup()}
      ${inGame ? keyboardMarkup() : ""}

      <footer>
        <div class="footer-rule"></div>
        <span>A FAN-MADE WORD GAME</span>
        <span>FOR READERS OF PRYTHIAN</span>
      </footer>
    </main>
    ${state.spoilerAccepted ? "" : spoilerOverlay()}
  `;
  bind();
}

function gameMarkup() {
  return `
    <section class="game">
      <div class="board" aria-label="Guess board">
        ${Array.from({ length: 6 }, (_, r) => `
          <div class="row ${r < state.guesses.length ? "submitted" : ""}">
            ${Array.from({ length: 5 }, (_, c) => {
              const guess = state.guesses[r] || "";
              const letter = guess[c] || (r === state.guesses.length ? state.current[c] || "" : "");
              const status = r < state.guesses.length ? evaluate(state.guesses[r], state.puzzle.answer)[c] : "";
              return `<div class="tile ${status} ${letter ? "filled" : ""}" style="--i:${c}">${esc(letter)}</div>`;
            }).join("")}
          </div>`).join("")}
      </div>
      <div class="game-status" aria-live="polite">
        <span>${esc(state.message || "Guess the five-letter word.")}</span>
        ${state.gameOver ? `<button class="link-btn" data-action="view-result">VIEW RESULT</button>` : ""}
      </div>
    </section>
  `;
}

function keyboardMarkup() {
  const keys = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
  const used = {};
  state.guesses.forEach(g => [...g].forEach((ch, i) => {
    const s = evaluate(g, state.puzzle.answer)[i];
    if (used[ch] !== "correct") used[ch] = s === "correct" ? "correct" : (s === "present" ? "present" : (used[ch] || "absent"));
  }));
  return `<section class="keyboard">
    ${keys.map(line => `<div class="keyrow">${[...line].map(k => `<button class="key ${used[k] || ""}" data-key="${k}">${k}</button>`).join("")}</div>`).join("")}
    <div class="keyrow"><button class="key wide" data-key="BACK">⌫</button><button class="key enter" data-key="ENTER">ENTER</button></div>
  </section>`;
}

// The archive lists only clues that have been played, and never shows answers.
function archiveMarkup() {
  const played = PUZZLES
    .map((p, i) => ({ p, n: i + 1, status: state.save.archive[p.id] }))
    .filter(x => x.status);
  if (!played.length) {
    return `<p class="archive-empty">Nothing here yet. Play today's clue and it will be kept in the archives.</p>`;
  }
  return `<section class="archive-grid">${played.map(({ p, n, status }) => `
    <button class="archive-card ${status}" data-puzzle="${esc(p.id)}">
      <strong>Clue ${n}</strong>
      <small>${status === "won" ? "SOLVED" : "MISSED"}</small>
    </button>`).join("")}</section>`;
}

function spoilerOverlay() {
  return `<div class="spoiler-screen">
    ${decorMarkup()}
    <div class="spoiler-mark">✦</div>
    <div class="eyebrow">BEFORE YOU ENTER</div>
    <h2>The Cauldron has no secrets.</h2>
    <p>This game draws from the full published <em>A Court of Thorns and Roses</em> series. Clues may reference major characters, relationships, events, powers, deaths, and reveals.</p>
    <p class="warning">SPOILERS THROUGH <em>A COURT OF SILVER FLAMES</em></p>
    <button class="primary" data-action="accept-spoilers">I ACCEPT THE SPOILERS</button>
    <small>Fan-made, unofficial, and not affiliated with Sarah J. Maas.</small>
  </div>`;
}

function closeModals() {
  document.querySelectorAll(".modal-backdrop").forEach(m => m.remove());
}

function showStats() {
  closeModals();
  document.querySelector("#app").insertAdjacentHTML("beforeend", `<div class="modal-backdrop"><div class="modal stats-modal">
    <button class="close" data-action="close-modal" aria-label="Close">×</button>
    <div class="eyebrow">YOUR RECORD</div><h2>Victory Streak.</h2>
    <div class="stat-grid"><div><strong>${state.save.streak}</strong><span>DAYS IN A ROW</span></div></div>
    <p>Solve each day's clue before you run out of guesses. Running out sends the streak back to zero.</p>
  </div></div>`);
  document.querySelector(".stats-modal .close").onclick = closeModals;
}

function recordArchive(id, won) {
  const prev = state.save.archive[id];
  if (won) state.save.archive[id] = "won";
  else if (!prev) state.save.archive[id] = "lost";
}

function finish(won) {
  state.gameOver = true;
  state.message = won
    ? ["The stars remember.", "The Cauldron approves.", "You found the word.", "A court-worthy guess.", "Well played, High Lady."][Math.floor(Math.random() * 5)]
    : `The word was ${state.puzzle.answer}.`;
  if (!state.replay) {
    state.save.daily.status = won ? "won" : "lost";
    state.save.streak = won ? state.save.streak + 1 : 0;
  }
  recordArchive(state.puzzle.id, won);
  persist();
  render();
  setTimeout(() => { if (state.view === "game") showResult(); }, 500);
}

function showResult() {
  closeModals();
  const won = state.guesses[state.guesses.length - 1] === state.puzzle.answer;
  const grid = state.guesses.map(g => evaluate(g, state.puzzle.answer).map(s => s === "correct" ? "🟩" : s === "present" ? "🟨" : "⬛").join("")).join("\n");
  const title = state.replay ? `A Court of Letters & Guesses · Clue ${clueNumber(state.puzzle)}` : "A Court of Letters & Guesses";
  const streakLine = !state.replay ? `\nVictory Streak: ${state.save.streak}` : "";
  const share = `${title}\n${won ? state.guesses.length : "X"}/6\n${grid}${streakLine}`;
  const footer = state.replay
    ? ""
    : `<p>Victory Streak: <strong>${state.save.streak}</strong><br>A new clue arrives tomorrow.</p>`;
  document.querySelector("#app").insertAdjacentHTML("beforeend", `<div class="modal-backdrop"><div class="modal result-modal">
    <div class="eyebrow">${won ? "THE WORD IS YOURS" : "THE WORD ESCAPED"}</div><h2>${won ? "Well guessed." : "The Cauldron keeps its secrets."}</h2>
    <p class="answer">${esc(state.puzzle.answer)}</p>
    <p>${esc(state.puzzle.clue)}</p>
    <div class="share-grid">${grid.replaceAll("\n", "<br>")}</div>
    ${footer}
    <button class="primary" id="share-result">SHARE RESULT</button>
    <button class="secondary" data-action="open-archive">VISIT THE ARCHIVES</button>
    <button class="secondary" data-action="close-result">RETURN TO GAME</button>
  </div></div>`);
  const modal = document.querySelector(".result-modal");
  const shareBtn = modal.querySelector("#share-result");
  shareBtn.onclick = async () => {
    try { await navigator.clipboard.writeText(share); shareBtn.textContent = "COPIED TO CLIPBOARD"; }
    catch { shareBtn.textContent = "COPY FAILED"; }
  };
  modal.querySelector('[data-action="open-archive"]').onclick = () => { closeModals(); state.view = "archive"; render(); };
  modal.querySelector('[data-action="close-result"]').onclick = closeModals;
}

function handleKey(k) {
  if (state.view !== "game" || state.gameOver || !state.spoilerAccepted || document.querySelector(".modal-backdrop")) return;
  if (k === "ENTER") {
    if (state.current.length !== 5) { state.message = "Five letters. The word will not yield to four."; render(); return; }
    const guess = state.current.toUpperCase();
    if (!VALID_GUESSES.has(guess) && !PUZZLES.some(p => p.answer === guess)) { state.message = "That word is not in the archives."; render(); return; }
    state.guesses.push(guess);
    state.current = "";
    if (!state.replay) { state.save.daily.guesses = [...state.guesses]; persist(); }
    if (guess === state.puzzle.answer) finish(true);
    else if (state.guesses.length === 6) finish(false);
    else { state.message = ""; render(); }
  } else if (k === "BACK") { state.current = state.current.slice(0, -1); render(); }
  else if (/^[A-Z]$/.test(k) && state.current.length < 5) { state.current += k; render(); }
}

function startReplay(id) {
  const puzzle = PUZZLES.find(p => p.id === id);
  if (!puzzle || !state.save.archive[id]) return;
  state.puzzle = puzzle;
  state.replay = true;
  state.view = "game";
  state.guesses = [];
  state.current = "";
  state.gameOver = false;
  state.message = "";
  render();
}

function bind() {
  document.querySelectorAll("[data-key]").forEach(b => b.onclick = () => handleKey(b.dataset.key));
  document.onkeydown = e => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === "Enter") handleKey("ENTER");
    else if (e.key === "Backspace") handleKey("BACK");
    else if (/^[a-zA-Z]$/.test(e.key)) handleKey(e.key.toUpperCase());
  };
  const actions = {
    stats: showStats,
    archive: () => { state.view = state.view === "archive" ? "game" : "archive"; render(); },
    today: () => { resumeDaily(); render(); },
    "view-result": showResult,
    "accept-spoilers": () => { state.spoilerAccepted = true; localStorage.setItem(SPOILER_KEY, "yes"); render(); }
  };
  Object.entries(actions).forEach(([name, fn]) => {
    document.querySelectorAll(`[data-action="${name}"]`).forEach(el => el.onclick = fn);
  });
  document.querySelectorAll("[data-puzzle]").forEach(b => b.onclick = () => startReplay(b.dataset.puzzle));
}

resumeDaily();
render();
