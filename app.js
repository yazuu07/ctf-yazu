// ════════════════════════════════════════════════════════════
// STATE
// ════════════════════════════════════════════════════════════
const STORAGE_KEY = "yazu_ctf_v1";
const TOTAL = window.CHALLENGES.reduce((s, c) => s + c.points, 0);
const MAX_PLAYER_LEN = 24;
const MAX_SCORE      = 1000000;
const MAX_CMD_LEN    = 500;

const defaultState = () => ({ player: "guest", solved: [], score: 0 });

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return defaultState();
    let player = String(parsed.player ?? "guest").slice(0, MAX_PLAYER_LEN);
    if (!/^[\w .\-_]+$/.test(player)) player = "guest";
    const solved = Array.isArray(parsed.solved)
      ? parsed.solved.filter(x => typeof x === "string" && x.length < 64).slice(0, 200)
      : [];
    let score = Number(parsed.score);
    if (!Number.isFinite(score) || score < 0) score = 0;
    score = Math.min(score, MAX_SCORE);
    return { player, solved, score };
  } catch { return defaultState(); }
}
function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

let state = loadState();
let selectedId = null;

const challengeSession = {};
function resetSession(challengeOrId) {
  const id = typeof challengeOrId === "string" ? challengeOrId : challengeOrId.id;
  const c = window.CHALLENGES.find(x => x.id === id);
  challengeSession[id] = { cwd: (c && c.startDir) || "/home/player" };
}
let pendingPrompt = null;
const browserState = { history: [], index: -1 };

function difficultyOf(c) {
  if (c.points >= 200) return "hard";
  if (c.points >= 150) return "medium";
  return "easy";
}

// ════════════════════════════════════════════════════════════
// DOM
// ════════════════════════════════════════════════════════════
const el = {
  libraryView:     document.getElementById("library-view"),
  challengeView:   document.getElementById("challenge-view"),

  libScore:        document.getElementById("lib-score"),
  libTotal:        document.getElementById("lib-total"),
  player:          document.getElementById("player"),
  newgame:         document.getElementById("newgame"),
  reset:           document.getElementById("reset"),

  progressPanel:   document.getElementById("progress-panel"),
  progressToggle:  document.getElementById("progress-toggle"),
  progressToggleLabel: document.getElementById("progress-toggle-label"),
  progressBarFill: document.getElementById("progress-bar-fill"),
  statSolved:      document.getElementById("stat-solved"),
  statTotal:       document.getElementById("stat-total"),
  statScore:       document.getElementById("stat-score"),
  statPct:         document.getElementById("stat-pct"),
  progressPerCat:  document.getElementById("progress-per-cat"),

  filterSearch:    document.getElementById("filter-search"),
  filterCategory:  document.getElementById("filter-category"),
  filterDifficulty:document.getElementById("filter-difficulty"),
  filterStatus:    document.getElementById("filter-status"),
  toggleHideSolved:document.getElementById("toggle-hide-solved"),
  toggleOnlyEasy:  document.getElementById("toggle-only-easy"),
  toggleOnlyMedium:document.getElementById("toggle-only-medium"),
  filterClear:     document.getElementById("filter-clear"),

  grid:            document.getElementById("challenge-grid"),
  noResults:       document.getElementById("no-results"),

  backToLibrary:   document.getElementById("back-to-library"),
  chalScore:       document.getElementById("chal-score"),
  chalTotal:       document.getElementById("chal-total"),
  playerChal:      document.getElementById("player-chal"),
  newgameChal:     document.getElementById("newgame-chal"),
  resetChal:       document.getElementById("reset-chal"),
  progressFill:    document.getElementById("progress-fill"),

  chTitle:         document.getElementById("ch-title"),
  chCat:           document.getElementById("ch-cat"),
  chDiff:          document.getElementById("ch-diff"),
  chPts:           document.getElementById("ch-pts"),
  chDesc:          document.getElementById("ch-desc"),

  paneTabs:        document.getElementById("pane-tabs"),
  terminalPanel:   document.getElementById("terminal-panel"),
  browserPanel:    document.getElementById("browser-panel"),
  termOut:         document.getElementById("terminal-output"),
  termIn:          document.getElementById("terminal-input"),

  browserBack:     document.getElementById("browser-back"),
  browserForward:  document.getElementById("browser-forward"),
  browserReload:   document.getElementById("browser-reload"),
  browserUrl:      document.getElementById("browser-url"),
  browserGo:       document.getElementById("browser-go"),
  browserViewport: document.getElementById("browser-viewport"),

  quickActions:    document.getElementById("quick-actions"),
  flagRow:         document.getElementById("flag-row"),
  toastContainer:  document.getElementById("toast-container"),
};

// ════════════════════════════════════════════════════════════
// VIEW SWITCHING
// ════════════════════════════════════════════════════════════
function showLibrary() {
  el.libraryView.hidden = false;
  el.challengeView.hidden = true;
  selectedId = null;
  renderLibrary();
}

function showChallenge(id) {
  selectedId = id;
  el.libraryView.hidden = true;
  el.challengeView.hidden = false;
  renderChallenge();
}

// ════════════════════════════════════════════════════════════
// LIBRARY
// ════════════════════════════════════════════════════════════
function renderLibrary() {
  renderProgress();
  renderGrid();
}

function renderProgress() {
  const solved = state.solved.length;
  const total  = window.CHALLENGES.length;
  const pct    = total ? Math.round((solved / total) * 100) : 0;

  el.statSolved.textContent = solved;
  el.statTotal.textContent  = total;
  el.statScore.textContent  = state.score;
  el.statPct.textContent    = pct + "%";
  el.progressBarFill.style.width = pct + "%";

  el.progressPerCat.innerHTML = "";
  for (const cat of window.CATEGORIES) {
    const items = window.CHALLENGES.filter(c => c.category === cat);
    if (!items.length) continue;
    const solvedInCat = items.filter(c => state.solved.includes(c.id)).length;
    const catPct = Math.round((solvedInCat / items.length) * 100);

    const chip = document.createElement("div");
    chip.className = "progress-cat-chip";
    const name = document.createElement("span");
    name.className = "cat-name";
    name.textContent = cat;
    const bar = document.createElement("span");
    bar.className = "cat-bar";
    const fill = document.createElement("span");
    fill.className = "cat-bar-fill";
    fill.style.width = catPct + "%";
    bar.appendChild(fill);
    const count = document.createElement("span");
    count.className = "cat-count";
    count.textContent = `${solvedInCat}/${items.length}`;
    chip.append(name, bar, count);
    el.progressPerCat.appendChild(chip);
  }

  updateProgressToggleLabel();
}

function updateProgressToggleLabel() {
  if (!el.progressToggleLabel) return;
  const solved = state.solved.length;
  const total  = window.CHALLENGES.length;
  const pct    = total ? Math.round((solved / total) * 100) : 0;
  el.progressToggleLabel.textContent = `Progress Tracker · ${solved}/${total} · ${pct}%`;
}

function applyFilters(list) {
  const q       = el.filterSearch.value.trim().toLowerCase();
  const cat     = el.filterCategory.value;
  const diff    = el.filterDifficulty.value;
  const status  = el.filterStatus.value;
  const hideSolved = el.toggleHideSolved.checked;
  const onlyEasy   = el.toggleOnlyEasy.checked;
  const onlyMedium = el.toggleOnlyMedium.checked;

  return list.filter(c => {
    if (cat && c.category !== cat) return false;
    if (diff && difficultyOf(c) !== diff) return false;
    if (onlyEasy   && difficultyOf(c) !== "easy")   return false;
    if (onlyMedium && difficultyOf(c) !== "medium") return false;
    const isSolved = state.solved.includes(c.id);
    if (hideSolved && isSolved) return false;
    if (status === "solved"   && !isSolved) return false;
    if (status === "unsolved" &&  isSolved) return false;
    if (q) {
      const hay = (c.title + " " + c.category + " " + (c.description || "")).toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

function renderGrid() {
  const list = applyFilters(window.CHALLENGES);
  el.grid.innerHTML = "";

  if (!list.length) {
    el.noResults.hidden = false;
    return;
  }
  el.noResults.hidden = true;

  for (const c of list) el.grid.appendChild(buildCard(c));
}

function buildCard(c) {
  const solved = state.solved.includes(c.id);
  const diff   = difficultyOf(c);

  const card = document.createElement("div");
  card.className = "ch-card" + (solved ? " solved" : "");
  card.setAttribute("role", "button");
  card.setAttribute("tabindex", "0");

  const top = document.createElement("div");
  top.className = "ch-card-top";
  const title = document.createElement("div");
  title.className = "ch-card-title";
  title.textContent = c.title;
  const catBadge = document.createElement("span");
  catBadge.className = "ch-card-cat";
  catBadge.textContent = c.category;
  top.append(title, catBadge);

  const author = document.createElement("div");
  author.className = "ch-card-author";
  author.textContent = "by YAZU Team";

  const diffWrap = document.createElement("div");
  diffWrap.className = "ch-card-diff diff-" + diff;
  const bars = document.createElement("span");
  bars.className = "diff-bars";
  for (let i = 0; i < 3; i++) {
    const b = document.createElement("span");
    if (diff === "easy" && i > 0) b.className = "off";
    if (diff === "medium" && i > 1) b.className = "off";
    bars.appendChild(b);
  }
  const diffLabel = document.createElement("span");
  diffLabel.textContent = diff.charAt(0).toUpperCase() + diff.slice(1);
  diffWrap.append(bars, diffLabel);

  const divider = document.createElement("div");
  divider.className = "ch-card-divider";

  const footer = document.createElement("div");
  footer.className = "ch-card-footer";
  const track = document.createElement("span");
  track.className = "ch-card-track";
  const trackIcon = document.createElement("span");
  trackIcon.className = "ch-card-track-icon";
  trackIcon.textContent = "▤";
  const trackName = document.createElement("span");
  trackName.textContent = c.category;
  track.append(trackIcon, trackName);

  if (solved) {
    const stat = document.createElement("span");
    stat.className = "ch-card-stat ch-card-solved-badge";
    stat.textContent = "✓ Solved";
    footer.append(track, stat);
  } else {
    const stat = document.createElement("span");
    stat.className = "ch-card-stat";
    stat.textContent = c.points + " pts";
    footer.append(track, stat);
  }

  card.append(top, author, diffWrap, divider, footer);

  const open = () => showChallenge(c.id);
  card.addEventListener("click", open);
  card.addEventListener("keydown", e => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
  });
  return card;
}

// ════════════════════════════════════════════════════════════
// CHALLENGE VIEW
// ════════════════════════════════════════════════════════════
const currentChallenge = () => window.CHALLENGES.find(c => c.id === selectedId);

function renderChallenge() {
  const c = currentChallenge();
  if (!c) return;
  if (!challengeSession[c.id]) resetSession(c);
  pendingPrompt = null;

  el.chTitle.textContent = c.title;
  el.chCat.textContent   = c.category;
  el.chPts.textContent   = c.points + " pts";
  el.chDesc.textContent  = c.description;

  const diff = difficultyOf(c);
  el.chDiff.textContent = diff.charAt(0).toUpperCase() + diff.slice(1);
  el.chDiff.className = "badge diff-badge diff-" + diff;

  const header = document.querySelector(".challenge-header");
  header.style.animation = "none";
  void header.offsetWidth;
  header.style.animation = "";

  el.termOut.innerHTML = "";
  appendTerminal(`YAZU shell — ${c.title}`, "info");
  appendTerminal(`Type 'help' for hints.  Click a chip below to insert a command.`, "info");
  if (c.web) appendTerminal(`A Browser tab is available.`, "info");
  appendTerminal("");
  el.termIn.value = "";

  if (c.web) {
    el.paneTabs.hidden = false;
    resetBrowser(c);
    switchPane("terminal");
  } else {
    el.paneTabs.hidden = true;
    el.terminalPanel.hidden = false;
    el.browserPanel.hidden = true;
    browserState.history = [];
    browserState.index = -1;
    el.termIn.focus();
  }
  renderQuickActions(c);
  renderFlagRow();
  renderHeaderScores();
}

function renderHeaderScores() {
  const solved = state.solved.length;
  const total  = window.CHALLENGES.length;
  const pct    = total ? (solved / total) * 100 : 0;
  el.libScore.textContent  = state.score;
  el.chalScore.textContent = state.score;
  el.libTotal.textContent  = TOTAL;
  el.chalTotal.textContent = TOTAL;
  el.progressFill.style.width = pct + "%";
  if (document.activeElement !== el.player) el.player.value = state.player;
  if (document.activeElement !== el.playerChal) el.playerChal.value = state.player;
}

function renderQuickActions(c) {
  el.quickActions.innerHTML = "";
  const cmds = (c.commands && c.commands.help)
    ? deriveChipsFromHelp(c.commands.help)
    : [];
  if (!cmds.length) return;

  const label = document.createElement("span");
  label.className = "chip-label";
  label.textContent = "Try:";
  el.quickActions.appendChild(label);

  for (const cmd of cmds.slice(0, 6)) {
    const chip = document.createElement("button");
    chip.className = "chip";
    chip.textContent = cmd;
    chip.title = "Click to insert";
    chip.addEventListener("click", () => {
      el.termIn.value = cmd;
      el.termIn.focus();
    });
    el.quickActions.appendChild(chip);
  }
}

function deriveChipsFromHelp(helpLines) {
  const out = [];
  for (const line of helpLines) {
    const tryMatch = line.match(/try:\s*(.+)/i);
    if (tryMatch) {
      tryMatch[1].split("|").forEach(s => {
        const t = s.trim().replace(/^["']|["']$/g, "");
        if (t && !t.includes("…") && t.length < 50) out.push(t);
      });
      continue;
    }
    const stepMatch = line.match(/^\s*\d+\.\s+(.+)/);
    if (stepMatch) {
      let cmd = stepMatch[1].trim();
      cmd = cmd.split(/\s{2,}/)[0];
      if (cmd && cmd.length < 50 && !cmd.includes("submit") && !cmd.includes("<")) out.push(cmd);
    }
  }
  return [...new Set(out)];
}

function renderFlagRow() {
  const c = currentChallenge();
  const solved = state.solved.includes(c.id);
  el.flagRow.innerHTML = "";
  if (solved) {
    const b = document.createElement("div");
    b.className = "solved-banner";
    b.textContent = "✓ Challenge solved";
    el.flagRow.appendChild(b);
    return;
  }
  const input = document.createElement("input");
  input.className = "flag-input";
  input.placeholder = "YAZU{...}";
  input.spellcheck = false;
  const btn = document.createElement("button");
  btn.className = "submit-btn";
  btn.textContent = "Submit";
  const msg = document.createElement("span");
  msg.className = "flag-msg";

  const submit = () => {
    const val = input.value.trim().toLowerCase();
    const exp = c.flag.trim().toLowerCase();
    if (val === exp) {
      msg.textContent = "✅ Correct!";
      msg.className = "flag-msg ok";
      markSolved(c);
    } else {
      msg.textContent = "❌ Incorrect flag";
      msg.className = "flag-msg err";
      el.flagRow.classList.remove("shake");
      void el.flagRow.offsetWidth;
      el.flagRow.classList.add("shake");
      setTimeout(() => { msg.textContent = ""; msg.className = "flag-msg"; }, 2000);
    }
  };
  btn.addEventListener("click", submit);
  input.addEventListener("keydown", e => { if (e.key === "Enter") submit(); });
  el.flagRow.append(input, btn, msg);
}

// ════════════════════════════════════════════════════════════
// TOASTS
// ════════════════════════════════════════════════════════════
function showToast(title, body, duration = 3500) {
  const toast = document.createElement("div");
  toast.className = "toast";
  const t = document.createElement("div");
  t.className = "toast-title";
  t.textContent = title;
  const b = document.createElement("div");
  b.className = "toast-body";
  b.textContent = body;
  toast.append(t, b);
  el.toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.classList.add("out");
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ════════════════════════════════════════════════════════════
// TERMINAL
// ════════════════════════════════════════════════════════════
function appendTerminal(line, kind = "") {
  const div = document.createElement("div");
  if (kind) div.className = kind;
  div.textContent = line;
  el.termOut.appendChild(div);
  el.termOut.scrollTop = el.termOut.scrollHeight;
}

function switchPane(name) {
  document.querySelectorAll(".pane-tab").forEach(t => t.classList.toggle("active", t.dataset.pane === name));
  if (name === "browser") {
    el.terminalPanel.hidden = true; el.browserPanel.hidden = false; el.browserUrl.focus();
  } else {
    el.terminalPanel.hidden = false; el.browserPanel.hidden = true; el.termIn.focus();
  }
}

// ════════════════════════════════════════════════════════════
// BROWSER
// ════════════════════════════════════════════════════════════
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, ch => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[ch]));
}

function normalizeUrl(input) {
  input = String(input).trim();
  if (!input) return null;
  if (/^\s*(javascript|data|vbscript|file|blob)\s*:/i.test(input)) return null;
  if (!/^https?:\/\//i.test(input)) input = "http://" + input;
  try {
    const u = new URL(input);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    if (!u.pathname) u.pathname = "/";
    return u;
  } catch { return null; }
}

function tryPath(portMap, fullPath) {
  if (!portMap) return null;
  if (portMap[fullPath] != null) {
    const v = portMap[fullPath];
    const html = typeof v === "function" ? v(fullPath) : v;
    if (html != null) return { kind: "page", html, path: fullPath };
  }
  const qIdx = fullPath.indexOf("?");
  const pathname = qIdx === -1 ? fullPath : fullPath.slice(0, qIdx);
  if (qIdx !== -1 && portMap[pathname] != null) {
    const v = portMap[pathname];
    const html = typeof v === "function" ? v(fullPath) : v;
    if (html != null) return { kind: "page", html, path: fullPath };
  }
  const candidates = [];
  if (pathname.endsWith("/") && pathname.length > 1) candidates.push(pathname.slice(0, -1));
  if (!pathname.endsWith("/")) candidates.push(pathname + "/");
  for (const p of candidates) {
    if (portMap[p] != null) {
      const v = portMap[p];
      const html = typeof v === "function" ? v(fullPath) : v;
      if (html != null) return { kind: "page", html, path: fullPath };
    }
  }
  return null;
}

function resolvePage(host, port, fullPath, challenge) {
  const web = challenge.web;
  if (!web || !web.ports) return { kind: "error", text: "No web server." };
  const w = window.__world || {};
  const validHosts = [web.host, w.targetIP, "localhost", "127.0.0.1"];
  if (!validHosts.includes(host)) return { kind: "error", text: `DNS_PROBE_FINISHED_NXDOMAIN — ${host} not found` };
  if (web.requiresNmap) {
    const sess = challengeSession[challenge.id] || {};
    if (!sess.nmapDone) return { kind: "error", text: `ERR_CONNECTION_REFUSED — ${host}:${port}` };
  }
  const portMap = web.ports[port];
  if (!portMap) return { kind: "error", text: `ERR_CONNECTION_REFUSED — ${host}:${port}` };
  const r = tryPath(portMap, fullPath);
  if (r) return r;
  return { kind: "notfound", path: fullPath };
}

function renderBrowser() {
  if (browserState.index < 0 || !browserState.history[browserState.index]) {
    el.browserUrl.value = "";
    el.browserViewport.innerHTML = `<div style="padding:16px;color:#9ca3af;">Type a URL above and press Enter.</div>`;
    updateBrowserNav();
    return;
  }
  const entry = browserState.history[browserState.index];
  el.browserUrl.value = entry.url;
  const r = entry.result;
  if (r.kind === "page") el.browserViewport.innerHTML = r.html;
  else if (r.kind === "notfound")
    el.browserViewport.innerHTML = `<div class="site"><div class="site-container"><h1>404 Not Found</h1><div class="site-error"><code>${escapeHtml(r.path)}</code> not found.</div></div></div>`;
  else
    el.browserViewport.innerHTML = `<div style="padding:24px;font-family:system-ui;color:#dc2626;"><h1>This site can't be reached</h1><p><code>${escapeHtml(r.text)}</code></p></div>`;
  updateBrowserNav();
}

function updateBrowserNav() {
  el.browserBack.disabled = browserState.index <= 0;
  el.browserForward.disabled = browserState.index >= browserState.history.length - 1;
}

function navigateBrowser(input, replace = false) {
  if (String(input).length > 2000) {
    el.browserViewport.innerHTML = `<div style="padding:24px;color:#dc2626;"><h1>URL too long</h1></div>`;
    return;
  }
  const challenge = currentChallenge();
  const u = normalizeUrl(input);
  if (!u) { el.browserViewport.innerHTML = `<div style="padding:24px;color:#dc2626;"><h1>Invalid URL</h1></div>`; return; }
  const url = u.toString();
  const host = u.hostname;
  const port = u.port ? parseInt(u.port, 10) : 80;
  const fullPath = u.pathname + (u.search || "");
  const result = resolvePage(host, port, fullPath, challenge);
  const entry = { url, host, port, fullPath, result };
  if (replace) { browserState.history = [entry]; browserState.index = 0; }
  else {
    browserState.history = browserState.history.slice(0, browserState.index + 1);
    browserState.history.push(entry);
    browserState.index = browserState.history.length - 1;
  }
  renderBrowser();
}

function browserGoTo(url) { navigateBrowser(url); }
function browserBack() { if (browserState.index > 0) { browserState.index--; renderBrowser(); } }
function browserForward() { if (browserState.index < browserState.history.length - 1) { browserState.index++; renderBrowser(); } }
function browserReload() {
  const entry = browserState.history[browserState.index];
  if (!entry) return;
  navigateBrowser(entry.url, true);
}

function resetBrowser(challenge) {
  browserState.history = [];
  browserState.index = -1;
  if (challenge.web && challenge.web.ports) {
    const ports = Object.keys(challenge.web.ports).map(Number).sort((a, b) => a - b);
    const defaultPort = ports[0] || 80;
    const host = challenge.web.host;
    const url = defaultPort === 80 ? `http://${host}/` : `http://${host}:${defaultPort}/`;
    navigateBrowser(url, true);
  }
}

el.browserViewport.addEventListener("click", (e) => {
  const a = e.target.closest("a");
  if (!a) return;
  const href = a.getAttribute("href");
  if (!href) return;
  e.preventDefault();
  if (/^\s*(javascript|data|vbscript|file|blob)\s*:/i.test(href)) return;
  const entry = browserState.history[browserState.index];
  if (!entry) return;
  const baseOrigin = `http://${entry.host}${entry.port === 80 ? "" : ":" + entry.port}`;
  let target;
  if (/^https?:\/\//i.test(href)) target = href;
  else if (href.startsWith("/")) target = baseOrigin + href;
  else target = baseOrigin + "/" + href;
  navigateBrowser(target);
});

el.browserViewport.addEventListener("submit", (e) => {
  const form = e.target.closest("form");
  if (!form) return;
  e.preventDefault();
  const action = form.getAttribute("action") || "";
  const data = new FormData(form);
  const params = new URLSearchParams();
  for (const [k, v] of data.entries()) params.append(k, v);
  const entry = browserState.history[browserState.index];
  if (!entry) return;
  const baseOrigin = `http://${entry.host}${entry.port === 80 ? "" : ":" + entry.port}`;
  let target;
  if (/^https?:\/\//i.test(action)) target = action;
  else if (action.startsWith("/")) target = baseOrigin + action;
  else target = baseOrigin + "/" + action;
  const qs = params.toString();
  target += (target.includes("?") ? "&" : "?") + qs;
  navigateBrowser(target);
});

// ════════════════════════════════════════════════════════════
// MINI SHELL
// ════════════════════════════════════════════════════════════
const USAGE = {
  nmap: ["Nmap 7.94 ( https://nmap.org )","Usage: nmap [Scan Type(s)] [Options] {target specification}","","Try: nmap target"],
  hydra: ["Hydra v9.5 (c) 2023 by van Hauser/THC","Example: hydra -l admin -P wordlist.txt ssh://target"],
  ssh: ["usage: ssh destination [command]","","Try: ssh admin@target"],
  curl: ["curl: try 'curl --help' for more information"],
  wget: ["wget: missing URL","Usage: wget [OPTION]... [URL]..."],
  tr: ["Usage: tr [OPTION]... SET1 [SET2]"],
  nc: ["usage: nc hostname port"],
  strings: ["Usage: strings [-n len] file..."],
  exiftool: ["Usage: exiftool [OPTIONS] FILE"],
  zsteg: ["Usage: zsteg [options] filename"],
  binwalk: ["Usage: binwalk [OPTIONS] FILE"],
  grep: ["Usage: grep [OPTION]... PATTERNS [FILE]..."],
  file: ["Usage: file file..."],
  whois: ["Usage: whois <domain>"],
  dig: ["Usage: dig [@server] [name] [type]"],
  nslookup: ["Usage: nslookup <domain>"],
  host: ["Usage: host <domain>"],
  unzip: ["Usage: unzip [-l|-p] file.zip [member]"],
  git: ["Usage: git <command> [args]"],
  gpg: ["Usage: gpg [--show-keys] file"],
  cd:  ["Usage: cd [dir]"],
  pwd: ["Usage: pwd"],
  ls:  ["Usage: ls [-la] [path]"],
  cat: ["Usage: cat [file...]"],
};

const DEFAULT_DIRS = {
  "/":              ["bin","boot","dev","etc","home","lib","proc","root","tmp","uploads","usr","var"],
  "/home":          ["player"],
  "/home/player":   ["readme.txt", ".bashrc"],
  "/etc":           ["hostname", "passwd", "hosts"],
  "/tmp":           [],
  "/uploads":       [],
  "/var":           ["log", "www"],
  "/var/log":       ["auth.log", "syslog"],
  "/var/www":       ["html"],
};
const DEFAULT_FILES = {
  "/home/player/readme.txt": "Welcome to the YAZU lab.\nNothing interesting in this file.\n",
  "/home/player/.bashrc":    "# ~/.bashrc\nexport PS1='$ '\nalias ll='ls -la'\n",
  "/etc/hostname":           "yazu-target\n",
  "/etc/passwd":             "root:x:0:0:root:/root:/bin/bash\nwww-data:x:33:33:www-data:/var/www:/usr/sbin/nologin\nplayer:x:1000:1000::/home/player:/bin/bash\n",
  "/etc/hosts":              "127.0.0.1   localhost\n10.10.14.23 yazu-target\n",
  "/var/log/auth.log":       "Oct 14 10:12:01 yazu-target sshd[1234]: Failed password for invalid user admin\n",
  "/var/log/syslog":         "Oct 14 10:00:00 yazu-target systemd[1]: Started Daily apt download.\n",
};

function buildFS(challenge) {
  const dirs  = Object.assign({}, DEFAULT_DIRS);
  const files = Object.assign({}, DEFAULT_FILES);
  if (challenge.dirs) {
    for (const k of Object.keys(challenge.dirs)) {
      const base = DEFAULT_DIRS[k] || [];
      dirs[k] = Array.from(new Set([...base, ...challenge.dirs[k]]));
    }
  }
  if (challenge.files) for (const k of Object.keys(challenge.files)) files[k] = challenge.files[k];
  return { dirs, files };
}

function fsNormalize(path, cwd) {
  if (!path) return cwd || "/";
  let p = path;
  if (!p.startsWith("/")) p = (cwd === "/" ? "" : cwd) + "/" + p;
  const parts = [];
  for (const seg of p.split("/")) {
    if (seg === "" || seg === ".") continue;
    if (seg === "..") { parts.pop(); continue; }
    parts.push(seg);
  }
  return "/" + parts.join("/");
}
function fsBase(path) { if (path === "/") return "/"; const i = path.lastIndexOf("/"); return path.slice(i + 1); }
function fsJoin(dir, name) { return dir === "/" ? "/" + name : dir + "/" + name; }

function tokenize(s) {
  const tokens = [];
  const re = /'([^']*)'|"([^"]*)"|(\S+)/g;
  let m;
  while ((m = re.exec(s)) !== null) tokens.push(m[1] ?? m[2] ?? m[3]);
  return tokens;
}
const normalizeCommand = s => s.trim().toLowerCase().replace(/\s+/g, " ");
const rawCommand = s => s.trim().replace(/\s+/g, " ");

function rot13(s) { return s.replace(/[A-Za-z]/g, ch => { const base = ch <= "Z" ? 65 : 97; return String.fromCharCode(((ch.charCodeAt(0) - base + 13) % 26) + base); }); }
function md5(str) { return window.__md5(str); }

function applyRedirect(segment, challenge) {
  const m = segment.match(/^(.+?)\s*<\s*(\S+)\s*$/);
  if (m) {
    const content = (challenge.files || {})[m[2]];
    return { cmd: m[1].trim(), stdinOverride: content ?? "" };
  }
  return { cmd: segment, stdinOverride: null };
}

function execOne(segment, stdin, challenge) {
  const tokens = tokenize(segment);
  if (!tokens.length) return { out: "" };
  const cmd = tokens[0].toLowerCase();
  const args = tokens.slice(1);
  const normRaw = rawCommand(segment);
  const normLower = normalizeCommand(segment);

  if (challenge.commands && Object.prototype.hasOwnProperty.call(challenge.commands, normLower)) {
    return { out: challenge.commands[normLower].join("\n") };
  }

  if (challenge.patterns) {
    for (const p of challenge.patterns) {
      const flags = p.re.flags.includes("i") ? p.re.flags : p.re.flags + "i";
      const ri = new RegExp(p.re.source, flags);
      if (!ri.test(normRaw)) continue;
      const sess = challengeSession[challenge.id] || {};
      if (p.requires && !sess[p.requires]) return { out: (p.missingOutput || ["Permission denied."]).join("\n") };
      if (p.sets) { challengeSession[challenge.id] = challengeSession[challenge.id] || {}; challengeSession[challenge.id][p.sets] = true; }
      if (p.promptPassword) {
        const pp = p.promptPassword;
        pendingPrompt = { validate(input) { return input === pp.correct ? { out: pp.onSuccess } : { out: pp.onFail }; } };
        return { out: pp.prompt };
      }
      return { out: p.output.join("\n") };
    }
  }

  const BARE_USAGE = new Set([
    "nmap","hydra","ssh","curl","wget","nc",
    "strings","exiftool","zsteg","binwalk",
    "whois","dig","nslookup","host",
    "unzip","git","gpg","openssl",
  ]);
  if (args.length === 0 && BARE_USAGE.has(cmd) && USAGE[cmd]) {
    return { out: USAGE[cmd].join("\n") + "\n" };
  }

  if (cmd === "echo") {
    const noNl = args[0] === "-n";
    const words = noNl ? args.slice(1) : args;
    return { out: words.join(" ") + (noNl ? "" : "\n") };
  }

  if (cmd === "whois") {
    if (!args.length) return { out: USAGE.whois.join("\n") + "\n" };
    const domain = args[0].toLowerCase();
    const data = (window.__whoisData || {})[domain];
    if (!data) return { out: `No match for "${domain}".\n` };
    return { out: data.join("\n") + "\n\n>>> Last update of WHOIS database: 2026-10-09 <<<\n" };
  }
  if (cmd === "dig" || cmd === "nslookup" || cmd === "host") {
    if (!args.length) return { out: USAGE[cmd].join("\n") + "\n" };
    const domain = args.filter(a => !a.startsWith("@") && !a.startsWith("-") && a !== "A" && a !== "MX" && a !== "TXT")[0];
    if (!domain) return { out: `;; no domain specified` };
    return { out: `; <<>> DiG 9.18 <<>> ${domain}\n;; ANSWER SECTION:\n${domain}.  300  IN  A  10.10.14.23\n\n;; Query time: 12 msec` };
  }

  const sess = challengeSession[challenge.id] || (challengeSession[challenge.id] = { cwd: "/home/player" });
  const cwd = sess.cwd || "/home/player";
  const { dirs: fsDirs, files: fsFiles } = buildFS(challenge);

  if (cmd === "pwd") return { out: cwd };

  if (cmd === "cd") {
    const target = args[0] || "/home/player";
    const abs = fsNormalize(target, cwd);
    if (!fsDirs[abs]) return { error: `bash: cd: ${target}: No such file or directory` };
    sess.cwd = abs;
    return { out: "" };
  }

  if (cmd === "cat") {
    if (args.length === 0) return { out: stdin ?? "" };
    const out = args.map(name => {
      const abs = fsNormalize(name, cwd);
      if (fsFiles[abs] != null) return fsFiles[abs];
      if (fsDirs[abs]) return `cat: ${name}: Is a directory`;
      return `cat: ${name}: No such file or directory`;
    }).join("\n");
    return { out: out + "\n" };
  }

  if (cmd === "ls" || cmd === "dir") {
    const showAll = args.some(a => /^-[a-z]*a/i.test(a) || /^--all$/i.test(a));
    const long    = args.some(a => /^-[a-z]*l/i.test(a));
    const pathArg = args.find(a => !a.startsWith("-"));
    const target  = pathArg ? fsNormalize(pathArg, cwd) : cwd;

    if (fsFiles[target] != null && !fsDirs[target]) return { out: fsBase(target) + "\n" };
    if (!fsDirs[target]) return { error: `ls: cannot access '${pathArg || target}': No such file or directory` };

    let entries = [...fsDirs[target]];
    if (!showAll) entries = entries.filter(e => !e.startsWith("."));
    entries.sort();

    if (!long) return { out: entries.length ? entries.join("   ") + "\n" : "" };

    const lines = [`total ${entries.length * 4}`];
    for (const n of entries) {
      const full = fsJoin(target, n);
      const isDir = !!fsDirs[full];
      const mode = isDir ? "drwxr-xr-x" : (n.startsWith(".") ? "-rw-------" : "-rw-r--r--");
      const size = isDir ? 4096 : ((fsFiles[full] || "").length || 42);
      lines.push(`${mode}  1 player player ${String(size).padStart(5)} ${n}`);
    }
    return { out: lines.join("\n") + "\n" };
  }

  if (cmd === "find") {
    const startArg = args.find(a => !a.startsWith("-"));
    const start = startArg ? fsNormalize(startArg, cwd) : cwd;
    if (!fsDirs[start]) return { error: `find: '${startArg || start}': No such file or directory` };
    const results = [];
    (function walk(dir) {
      for (const e of (fsDirs[dir] || [])) {
        const full = fsJoin(dir, e);
        results.push(full);
        if (fsDirs[full]) walk(full);
      }
    })(start);
    return { out: results.join("\n") + (results.length ? "\n" : "") };
  }

  if (cmd === "base64" || cmd === "openssl") {
    const knownFlags = ["-d","--decode","-D","-decode","-in","-i"];
    const unknown = args.find(a => a.startsWith("-") && !knownFlags.includes(a));
    if (unknown) return { error: `base64: invalid option -- '${unknown.replace(/^-+/, "")}'` };
    const decode = args.some(a => ["-d","--decode","-D","-decode"].includes(a));
    if (!decode) return { out: stdin ?? "" };
    let data = "";
    const inIdx = args.indexOf("-in");
    if (inIdx !== -1 && args[inIdx + 1]) data = (challenge.files || {})[args[inIdx + 1]] ?? "";
    else {
      const fileArg = args.find(a => !a.startsWith("-"));
      if (fileArg) data = (challenge.files || {})[fileArg] ?? stdin ?? "";
      else data = stdin ?? "";
    }
    try { return { out: atob(data.trim()) + "\n" }; } catch { return { out: data }; }
  }

  if (cmd === "tr") {
    const norm = args.join(" ").replace(/['"\[\]]/g, "");
    if (/^A-Za-z\s+N-ZA-Mn-za-m$/.test(norm)) return { out: rot13(stdin ?? "") };
    return { out: stdin ?? "" };
  }

  if (cmd === "md5sum") {
    if (args.length === 0) return { out: md5(stdin ?? "") + "  -\n" };
    const fname = args[0];
    const content = (challenge.files || {})[fname];
    if (content != null) {
      const lines = content.split("\n");
      return { out: lines.map(l => md5(l) + "  " + fname).join("\n") + "\n" };
    }
    return { out: md5(stdin ?? "") + "  " + fname + "\n" };
  }

  if (cmd === "rev") {
    const src = args.length ? ((challenge.files || {})[args[0]] ?? "") : (stdin ?? "");
    return { out: src.split("\n").map(l => l.split("").reverse().join("")).join("\n") };
  }

  if (cmd === "grep") {
    const nonFlags = args.filter(a => !a.startsWith("-"));
    const pattern = nonFlags[0] || "";
    const fileArg = nonFlags[1];
    const src = fileArg ? ((challenge.files || {})[fileArg] ?? "") : (stdin ?? "");
    let re;
    try { re = new RegExp(pattern, "i"); }
    catch { re = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"); }
    const matched = src.split("\n").filter(l => re.test(l)).join("\n");
    return { out: matched + (matched ? "\n" : "") };
  }

  if (cmd === "sort") {
    const src = args.length ? ((challenge.files || {})[args[0]] ?? "") : (stdin ?? "");
    return { out: src.split("\n").sort().join("\n") };
  }
  if (cmd === "uniq") {
    const countFlag = args.includes("-c");
    const src = stdin ?? "";
    const lines = src.split("\n");
    if (countFlag) {
      const counts = new Map();
      for (const l of lines) counts.set(l, (counts.get(l) || 0) + 1);
      return { out: [...counts.entries()].map(([l, n]) => `${String(n).padStart(7)} ${l}`).join("\n") };
    }
    return { out: lines.filter((l, i) => l !== lines[i - 1]).join("\n") };
  }
  if (cmd === "wc") {
    const src = args.length ? ((challenge.files || {})[args[0]] ?? "") : (stdin ?? "");
    const lines = src.split("\n");
    const words = src.split(/\s+/).filter(Boolean);
    return { out: `${lines.length} ${words.length} ${src.length} ${args[0] || "-"}` };
  }

  if (cmd === "head" || cmd === "tail") {
    let n = 10;
    const nIdx = args.indexOf("-n");
    if (nIdx !== -1 && args[nIdx + 1]) n = parseInt(args[nIdx + 1], 10);
    const fileArg = args.find(a => !a.startsWith("-") && a !== String(n));
    const src = fileArg ? ((challenge.files || {})[fileArg] ?? "") : (stdin ?? "");
    const lines = src.split("\n");
    return { out: (cmd === "head" ? lines.slice(0, n) : lines.slice(-n)).join("\n") };
  }

  if (cmd === "cut") {
    const dArg = args.find(a => a.startsWith("-d"));
    const fArg = args.find(a => a.startsWith("-f"));
    const cArg = args.find(a => a.startsWith("-c"));
    const src = stdin ?? "";
    if (cArg) {
      const range = cArg.replace(/^-c/, "");
      const [a, b] = range.split("-").map(n => parseInt(n, 10));
      return { out: src.split("\n").map(l => l.slice((a || 1) - 1, b || undefined)).join("\n") };
    }
    const delim = dArg ? dArg.slice(2) : "\t";
    const fields = fArg ? fArg.replace(/^-f/, "").split(",").map(n => parseInt(n, 10)) : [1];
    return { out: src.split("\n").map(l => {
      const parts = l.split(delim);
      return fields.map(f => parts[f - 1] ?? "").join(delim);
    }).join("\n") };
  }
  if (cmd === "awk") {
    const fs = args.find(a => a.startsWith("-F"));
    const delim = fs ? fs.slice(2) : /\s+/;
    const prog = args.filter(a => !a.startsWith("-"))[0] || "";
    const m = prog.match(/\{?\s*print\s+\$(\d+)\s*\}?/);
    if (!m) return { out: stdin ?? "" };
    const field = parseInt(m[1], 10);
    const src = stdin ?? "";
    return { out: src.split("\n").map(l => {
      const parts = l.split(delim);
      return parts[field - 1] ?? "";
    }).join("\n") };
  }

  if (cmd === "unzip") {
    const listFlag = args.includes("-l");
    const pipeFlag = args.includes("-p");
    const fname = args.find(a => !a.startsWith("-"));
    const inner = args[args.length - 1];
    if (fname === "photo.zip" && pipeFlag && inner === "flag.txt") {
      const chal = window.CHALLENGES.find(c => c.id === "steg-zip");
      return { out: (chal ? chal.flag : "flag not found") + "\n" };
    }
    if (fname === "photo.zip" && listFlag) {
      return { out: "Archive:  photo.zip\n  Length      Date    Time    Name\n---------  ---------- -----   ----\n     1024  2026-06-12 14:22   readme.txt\n   45678  2026-06-12 14:22   photo.jpg\n      512  2026-06-12 14:22   notes.md\n      128  2026-06-12 14:22   flag.txt\n" };
    }
    return { out: `unzip: cannot find or open ${fname}` };
  }
  if (cmd === "git") {
    const sub = args[0];
    if (sub === "log") {
      const chal = window.CHALLENGES.find(c => c.id === "osint-github");
      return { out: (chal?.files?.["git.log"] || "fatal: not a git repository") + "\n" };
    }
    return { out: `git: '${sub}' is not a git command.` };
  }
  if (cmd === "gpg") {
    const show = args.includes("--show-keys");
    const chal = window.CHALLENGES.find(c => c.id === "osint-pgp");
    if (show && chal) return { out: chal.files["pubkey.asc"] + "\n" };
    return { out: "gpg: no valid OpenPGP data found." };
  }

  if (cmd === "strings") {
    const fname = args[0];
    const content = (challenge.files || {})[fname];
    if (content == null) return { error: `strings: ${fname}: No such file or directory` };
    const extracted = content.match(/[\x20-\x7e]{4,}/g) || [];
    return { out: extracted.join("\n") + "\n" };
  }

  if (cmd === "file") {
    const fname = args[0];
    if (fname && challenge.files?.[fname] != null) return { out: `${fname}: ASCII text` };
    return { out: `${fname || "stdin"}: data` };
  }

  if (cmd === "xxd") {
    const fname = args[0];
    const content = fname ? ((challenge.files || {})[fname] ?? "") : (stdin ?? "");
    const lines = [];
    for (let i = 0; i < content.length; i += 16) {
      const chunk = content.slice(i, i + 16);
      const hex = Array.from(chunk).map(c => c.charCodeAt(0).toString(16).padStart(2, "0")).join(" ");
      const ascii = chunk.replace(/[^\x20-\x7e]/g, ".");
      lines.push(`${i.toString(16).padStart(8, "0")}: ${hex.padEnd(48)}  ${ascii}`);
    }
    return { out: lines.join("\n") + "\n" };
  }

  if (cmd === "help") {
    if (challenge.commands && challenge.commands.help) return { out: challenge.commands.help.join("\n") };
    return { out: "No help for this challenge." };
  }
  if (cmd === "clear") return { clear: true };

  if (cmd === "curl" || cmd === "wget") {
    if (challenge.web) return handleWebFetch(cmd, args, challenge.web, challenge.id);
  }

  if (/\//.test(cmd)) return { error: `bash: ${cmd}: No such file or directory` };
  if (/-P\s+wordlist\.txt/.test(normRaw) && !/^hydra\b/i.test(normRaw)) {
    return { error: `bash: ${cmd}: command not found\n\nHint: did you mean: hydra ${normRaw}` };
  }
  return { error: `bash: ${cmd}: command not found` };
}

function handleWebFetch(cmd, args, web, challengeId) {
  const urlTok = args.find(a => /^https?:\/\//.test(a));
  let host = web.host, port = null, fullPath = "/";
  if (urlTok) {
    try {
      const u = new URL(urlTok);
      host = u.hostname;
      port = u.port ? parseInt(u.port, 10) : 80;
      fullPath = u.pathname + (u.search || "");
    } catch { /* ignore */ }
  } else {
    const ports = Object.keys(web.ports).map(Number).sort((a, b) => a - b);
    port = ports[0] || 80;
  }
  if (web.requiresNmap) {
    const sess = challengeSession[challengeId] || {};
    if (!sess.nmapDone) return { out: `${cmd}: (7) Failed to connect to ${host} port ${port}: Connection refused` };
  }
  const portMap = web.ports[port];
  if (!portMap) return { out: `${cmd}: (7) Failed to connect to ${host} port ${port}: Connection refused` };
  const r = tryPath(portMap, fullPath);
  if (r) {
    if (cmd === "wget") return { out: `--2024-01-01--  http://${host}:${port}${r.path}\nHTTP request sent, awaiting response... 200 OK\n\n${r.html}\n` };
    return { out: r.html + "\n" };
  }
  return { out: `<html><body><h1>404 Not Found</h1></body></html>\n` };
}

function runPipeline(input, challenge) {
  const segments = input.split("|").map(s => s.trim()).filter(Boolean);
  if (!segments.length) return { out: "" };
  let stdin = null;
  for (const seg of segments) {
    const { cmd: cleaned, stdinOverride } = applyRedirect(seg, challenge);
    const effectiveStdin = stdinOverride !== null ? stdinOverride : stdin;
    const r = execOne(cleaned, effectiveStdin, challenge);
    if (r.error) return { error: r.error };
    if (r.clear) return { clear: true };
    stdin = r.out;
  }
  return { out: stdin ?? "" };
}

function runCommand() {
  const raw = el.termIn.value;
  if (!raw.trim()) return;
  if (raw.length > MAX_CMD_LEN) {
    appendTerminal(`bash: input too long (max ${MAX_CMD_LEN} chars)`, "err");
    el.termIn.value = "";
    return;
  }
  el.termIn.value = "";
  if (pendingPrompt) {
    const r = pendingPrompt.validate(raw.trim());
    pendingPrompt = null;
    if (r.out) r.out.forEach(l => appendTerminal(l));
    appendTerminal("");
    return;
  }
  appendTerminal(`$ ${raw.trim()}`, "cmd");
  const c = currentChallenge();
  const res = runPipeline(raw.trim(), c);
  if (res.clear) { el.termOut.innerHTML = ""; return; }
  if (res.error) { res.error.split("\n").forEach(l => appendTerminal(l, "err")); appendTerminal(""); return; }
  const out = (res.out || "").replace(/\n$/, "");
  if (out) out.split("\n").forEach(l => appendTerminal(l));
  appendTerminal("");
}

// ════════════════════════════════════════════════════════════
// ACTIONS
// ════════════════════════════════════════════════════════════
function markSolved(c) {
  const wasNew = !state.solved.includes(c.id);
  if (wasNew) {
    state.solved.push(c.id);
    state.score += c.points;
    saveState();
  }
  renderHeaderScores();
  renderFlagRow();
  if (wasNew) showToast("Flag captured", `${c.title} · +${c.points} pts`);
}

function setPlayer(name) {
  let n = String(name || "guest").slice(0, MAX_PLAYER_LEN);
  if (!/^[\w .\-_]*$/.test(n)) n = n.replace(/[^\w .\-_]/g, "");
  state.player = n || "guest";
  saveState();
}

function resetProgress() {
  if (!confirm("Reset all progress?")) return;
  state = defaultState(); saveState();
  renderHeaderScores();
  if (selectedId) renderChallenge();
  else renderLibrary();
}

// ════════════════════════════════════════════════════════════
// EVENTS
// ════════════════════════════════════════════════════════════
el.player.addEventListener("input", e => { setPlayer(e.target.value); el.playerChal.value = e.target.value; });
el.playerChal.addEventListener("input", e => { setPlayer(e.target.value); el.player.value = e.target.value; });
el.reset.addEventListener("click", resetProgress);
el.resetChal.addEventListener("click", resetProgress);
el.newgame.addEventListener("click", () => {
  if (!confirm("Start a new game? This rerolls everything and wipes progress.")) return;
  window.__newGame();
});
el.newgameChal.addEventListener("click", () => {
  if (!confirm("Start a new game? This rerolls everything and wipes progress.")) return;
  window.__newGame();
});

el.backToLibrary.addEventListener("click", showLibrary);

el.progressToggle.addEventListener("click", () => {
  el.progressPanel.classList.toggle("collapsed");
  el.progressToggle.setAttribute("aria-expanded", String(!el.progressPanel.classList.contains("collapsed")));
  updateProgressToggleLabel();
});

el.filterSearch.addEventListener("input", renderGrid);
el.filterCategory.addEventListener("change", renderGrid);
el.filterDifficulty.addEventListener("change", renderGrid);
el.filterStatus.addEventListener("change", renderGrid);
el.toggleHideSolved.addEventListener("change", renderGrid);
el.toggleOnlyEasy.addEventListener("change", () => {
  if (el.toggleOnlyEasy.checked) el.toggleOnlyMedium.checked = false;
  renderGrid();
});
el.toggleOnlyMedium.addEventListener("change", () => {
  if (el.toggleOnlyMedium.checked) el.toggleOnlyEasy.checked = false;
  renderGrid();
});
el.filterClear.addEventListener("click", () => {
  el.filterSearch.value = "";
  el.filterCategory.value = "";
  el.filterDifficulty.value = "";
  el.filterStatus.value = "";
  el.toggleHideSolved.checked = false;
  el.toggleOnlyEasy.checked = false;
  el.toggleOnlyMedium.checked = false;
  renderGrid();
});

el.termIn.addEventListener("keydown", e => {
  if (e.key === "Enter") runCommand();
  if (e.key === "l" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); el.termOut.innerHTML = ""; }
});
document.querySelectorAll(".pane-tab").forEach(t => t.addEventListener("click", () => switchPane(t.dataset.pane)));
el.browserGo.addEventListener("click", () => browserGoTo(el.browserUrl.value));
el.browserUrl.addEventListener("keydown", e => { if (e.key === "Enter") browserGoTo(el.browserUrl.value); });
el.browserBack.addEventListener("click", browserBack);
el.browserForward.addEventListener("click", browserForward);
el.browserReload.addEventListener("click", browserReload);
document.addEventListener("click", e => {
  if (e.target.closest(".chal-main") && !e.target.closest("input, button, .browser-viewport, .chip")) {
    const active = document.querySelector(".pane-tab.active");
    if (!active || active.dataset.pane === "terminal") el.termIn.focus();
  }
});

// ════════════════════════════════════════════════════════════
// INIT
// ════════════════════════════════════════════════════════════
// Populate category filter
for (const cat of window.CATEGORIES) {
  const opt = document.createElement("option");
  opt.value = cat;
  opt.textContent = cat;
  el.filterCategory.appendChild(opt);
}

// On mobile, start with the Progress Tracker collapsed so the grid is visible.
const isMobile = window.matchMedia("(max-width: 700px)").matches;
if (isMobile) {
  el.progressPanel.classList.add("collapsed");
  el.progressToggle.setAttribute("aria-expanded", "false");
}

renderHeaderScores();
showLibrary();