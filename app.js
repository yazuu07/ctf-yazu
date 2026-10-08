// ════════════════════════════════════════════════════════════
// STATE
// ════════════════════════════════════════════════════════════
const STORAGE_KEY = "yazu_ctf_v1";
const TOTAL = window.CHALLENGES.reduce((s, c) => s + c.points, 0);

const defaultState = () => ({ player: "guest", solved: [], score: 0 });
function loadState() {
  try {
    const r = localStorage.getItem(STORAGE_KEY);
    return r ? JSON.parse(r) : defaultState();
  } catch { return defaultState(); }
}
function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

let state = loadState();
let selectedId = window.CHALLENGES[0].id;

const challengeSession = {};
function resetSession(id) { challengeSession[id] = {}; }
let pendingPrompt = null;
const browserState = { history: [], index: -1 };

// ════════════════════════════════════════════════════════════
// DOM
// ════════════════════════════════════════════════════════════
const el = {
  score:           document.getElementById("score"),
  total:           document.getElementById("total"),
  player:          document.getElementById("player"),
  reset:           document.getElementById("reset"),
  newgame:         document.getElementById("newgame"),
  list:            document.getElementById("challenge-list"),
  leaderboard:     document.getElementById("leaderboard"),
  chTitle:         document.getElementById("ch-title"),
  chCat:           document.getElementById("ch-cat"),
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
  flagRow:         document.getElementById("flag-row"),
};

// ════════════════════════════════════════════════════════════
// RENDER
// ════════════════════════════════════════════════════════════
function renderHeader() {
  el.score.textContent = state.score;
  el.total.textContent = TOTAL;
  if (document.activeElement !== el.player) el.player.value = state.player;
}

function renderSidebar() {
  el.list.innerHTML = "";
  for (const cat of window.CATEGORIES) {
    const items = window.CHALLENGES.filter(x => x.category === cat);
    if (!items.length) continue;
    const label = document.createElement("div");
    label.className = "cat-label";
    label.textContent = cat;
    el.list.appendChild(label);
    for (const c of items) {
      const solved = state.solved.includes(c.id);
      const btn = document.createElement("button");
      btn.className = "ch-btn" + (solved ? " solved" : "") + (selectedId === c.id ? " selected" : "");
      btn.innerHTML = `<span>${c.title}</span><span class="mark">${solved ? "✓" : "•"}</span>`;
      btn.addEventListener("click", () => selectChallenge(c.id));
      el.list.appendChild(btn);
    }
  }
}

function renderLeaderboard() {
  const board = [...window.SEEDED_PLAYERS, { name: state.player || "guest", score: state.score, you: true }]
    .sort((a, b) => b.score - a.score).slice(0, 8);
  el.leaderboard.innerHTML = "";
  board.forEach((p, i) => {
    const li = document.createElement("li");
    if (p.you) li.className = "you";
    li.innerHTML = `<span>${i + 1}. ${p.name}</span><span>${p.score}</span>`;
    el.leaderboard.appendChild(li);
  });
}

const currentChallenge = () => window.CHALLENGES.find(c => c.id === selectedId);

function renderChallenge() {
  const c = currentChallenge();
  resetSession(c.id);
  pendingPrompt = null;

  el.chTitle.textContent = c.title;
  el.chCat.textContent = c.category;
  el.chPts.textContent = c.points + " pts";
  el.chDesc.textContent = c.description;

  el.termOut.innerHTML = "";
  appendTerminal(`YAZU shell — ${c.title}`, "info");
  appendTerminal(`Type 'help' for hints.  Pipes work: cat file | base64 -d`, "info");
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
  renderFlagRow();
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
      setTimeout(() => { msg.textContent = ""; msg.className = "flag-msg"; }, 2000);
    }
  };
  btn.addEventListener("click", submit);
  input.addEventListener("keydown", e => { if (e.key === "Enter") submit(); });
  el.flagRow.append(input, btn, msg);
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

// ════════════════════════════════════════════════════════════
// PANE SWITCHING
// ════════════════════════════════════════════════════════════
function switchPane(name) {
  document.querySelectorAll(".pane-tab").forEach(t => {
    t.classList.toggle("active", t.dataset.pane === name);
  });
  if (name === "browser") {
    el.terminalPanel.hidden = true;
    el.browserPanel.hidden = false;
    el.browserUrl.focus();
  } else {
    el.terminalPanel.hidden = false;
    el.browserPanel.hidden = true;
    el.termIn.focus();
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
  if (!/^https?:\/\//i.test(input)) input = "http://" + input;
  try {
    const u = new URL(input);
    if (!u.pathname) u.pathname = "/";
    return u;
  } catch { return null; }
}

function getPortMap(challenge, port) {
  if (!challenge.web || !challenge.web.ports) return null;
  return challenge.web.ports[port] || null;
}

function tryPath(portMap, fullPath) {
  if (!portMap) return null;
  // 1) exact match
  if (portMap[fullPath] != null) {
    const v = portMap[fullPath];
    const html = typeof v === "function" ? v(fullPath) : v;
    if (html != null) return { kind: "page", html, path: fullPath };
  }
  // 2) pathname-only match (drop query)
  const qIdx = fullPath.indexOf("?");
  const pathname = qIdx === -1 ? fullPath : fullPath.slice(0, qIdx);
  if (qIdx !== -1 && portMap[pathname] != null) {
    const v = portMap[pathname];
    const html = typeof v === "function" ? v(fullPath) : v;
    if (html != null) return { kind: "page", html, path: fullPath };
  }
  // 3) slash variants
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
  if (!web || !web.ports) return { kind: "error", text: "This challenge has no web server." };
  const w = window.__world || {};
  const validHosts = [web.host, w.targetIP, "localhost", "127.0.0.1"];
  if (!validHosts.includes(host)) {
    return { kind: "error", text: `DNS_PROBE_FINISHED_NXDOMAIN — ${host} not found` };
  }
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
  if (r.kind === "page") {
    el.browserViewport.innerHTML = r.html;
  } else if (r.kind === "notfound") {
    el.browserViewport.innerHTML =
      `<div class="site"><div class="site-container">
        <h1>404 Not Found</h1>
        <div class="site-error"><code>${escapeHtml(r.path)}</code> not found on this server.</div>
      </div></div>`;
  } else {
    el.browserViewport.innerHTML =
      `<div style="padding:24px;font-family:system-ui;color:#dc2626;">
        <h1>This site can't be reached</h1>
        <p><code>${escapeHtml(r.text)}</code></p>
      </div>`;
  }
  updateBrowserNav();
}

function updateBrowserNav() {
  el.browserBack.disabled = browserState.index <= 0;
  el.browserForward.disabled = browserState.index >= browserState.history.length - 1;
}

function navigateBrowser(input, replace = false) {
  const challenge = currentChallenge();
  const u = normalizeUrl(input);
  if (!u) {
    el.browserViewport.innerHTML = `<div style="padding:24px;color:#dc2626;"><h1>Invalid URL</h1></div>`;
    return;
  }
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

// browser click/submit — links and forms
el.browserViewport.addEventListener("click", (e) => {
  const a = e.target.closest("a");
  if (!a) return;
  const href = a.getAttribute("href");
  if (!href) return;
  e.preventDefault();
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
  hydra: ["Hydra v9.5 (c) 2023 by van Hauser/THC","Syntax: hydra [[[-l LOGIN|-L FILE] [-p PASS|-P FILE]] | [-C FILE]]","Example: hydra -l admin -P wordlist.txt ssh://target"],
  ssh: ["usage: ssh [-46AaCfGgKkMNnqsTtVvXxYy] destination [command]","","Try: ssh admin@target"],
  curl: ["curl: try 'curl --help' or 'curl --manual' for more information"],
  wget: ["wget: missing URL","Usage: wget [OPTION]... [URL]..."],
  tr: ["Usage: tr [OPTION]... SET1 [SET2]"],
  nc: ["usage: nc [-46CDdFhklNnrStUuvZz] hostname port"],
  strings: ["Usage: strings [-n len] file..."],
  exiftool: ["Usage: exiftool [OPTIONS] FILE"],
  zsteg: ["Usage: zsteg [options] filename"],
  binwalk: ["Usage: binwalk [OPTIONS] FILE"],
  grep: ["Usage: grep [OPTION]... PATTERNS [FILE]..."],
  find: ["Usage: find [path...] [expression]"],
  file: ["Usage: file [-bchiklLNnprsvz0] file..."],
};

function tokenize(s) {
  const tokens = [];
  const re = /'([^']*)'|"([^"]*)"|(\S+)/g;
  let m;
  while ((m = re.exec(s)) !== null) tokens.push(m[1] ?? m[2] ?? m[3]);
  return tokens;
}
const normalizeCommand = s => s.trim().toLowerCase().replace(/\s+/g, " ");
const rawCommand = s => s.trim().replace(/\s+/g, " ");

function rot13(s) {
  return s.replace(/[A-Za-z]/g, ch => {
    const base = ch <= "Z" ? 65 : 97;
    return String.fromCharCode(((ch.charCodeAt(0) - base + 13) % 26) + base);
  });
}
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

  if (cmd === "echo") {
    const noNl = args[0] === "-n";
    const words = noNl ? args.slice(1) : args;
    return { out: words.join(" ") + (noNl ? "" : "\n") };
  }
  if (args.length === 0 && USAGE[cmd]) return { out: USAGE[cmd].join("\n") + "\n" };

  if (cmd === "cat") {
    if (args.length === 0) return { out: stdin ?? "" };
    const out = args.map(name => {
      if (name === ".*") return Object.keys(challenge.files || {}).filter(n => n.startsWith(".")).map(n => challenge.files[n]).join("\n");
      const cleanName = name.replace(/^\.\//, "");
      const f = (challenge.files || {})[cleanName];
      if (f == null) return `cat: ${name}: No such file or directory`;
      return f;
    }).join("\n");
    return { out: out + "\n" };
  }

  if (cmd === "ls" || cmd === "dir") {
    const showAll = args.some(a => /^-[a-z]*a/i.test(a) || /^--all$/i.test(a));
    const long    = args.some(a => /^-[a-z]*l/i.test(a));
    const names   = Object.keys(challenge.files || {});
    const visible = showAll ? names : names.filter(n => !n.startsWith("."));
    if (!long) return { out: visible.join("   ") + "\n" };
    const lines = [`total ${visible.length * 4}`];
    for (const n of visible) {
      const size = (challenge.files[n] || "").length;
      const mode = n.startsWith(".") ? "-rw-------" : "-rw-r--r--";
      lines.push(`${mode}  1 player player ${String(size).padStart(4)} ${n}`);
    }
    return { out: lines.join("\n") + "\n" };
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
    try { return { out: atob(data.trim()) + "\n" }; }
    catch { return { out: data }; }
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
    if (cmd === "wget") {
      return { out: `--2024-01-01--  http://${host}:${port}${r.path}\nHTTP request sent, awaiting response... 200 OK\n\n${r.html}\n` };
    }
    return { out: r.html + "\n" };
  }
  return { out: `<html><body><h1>404 Not Found</h1></body></html>\n` };
}

// ════════════════════════════════════════════════════════════
// PIPELINE
// ════════════════════════════════════════════════════════════
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
  if (res.error) {
    res.error.split("\n").forEach(l => appendTerminal(l, "err"));
    appendTerminal("");
    return;
  }
  const out = (res.out || "").replace(/\n$/, "");
  if (out) out.split("\n").forEach(l => appendTerminal(l));
  appendTerminal("");
}

// ════════════════════════════════════════════════════════════
// ACTIONS
// ════════════════════════════════════════════════════════════
function selectChallenge(id) { selectedId = id; renderSidebar(); renderChallenge(); }
function markSolved(c) {
  if (!state.solved.includes(c.id)) {
    state.solved.push(c.id);
    state.score += c.points;
    saveState();
  }
  renderHeader(); renderSidebar(); renderLeaderboard(); renderFlagRow();
}
function setPlayer(name) { state.player = name || "guest"; saveState(); renderLeaderboard(); }
function resetProgress() {
  if (!confirm("Reset all progress?")) return;
  state = defaultState(); saveState();
  renderHeader(); renderSidebar(); renderLeaderboard(); renderChallenge();
}

// ════════════════════════════════════════════════════════════
// EVENTS
// ════════════════════════════════════════════════════════════
el.player.addEventListener("input", e => setPlayer(e.target.value));
el.reset.addEventListener("click", resetProgress);
el.newgame.addEventListener("click", () => {
  if (!confirm("Start a new game? This rerolls everything and wipes progress.")) return;
  window.__newGame();
});
el.termIn.addEventListener("keydown", e => { if (e.key === "Enter") runCommand(); });
document.querySelectorAll(".pane-tab").forEach(t => t.addEventListener("click", () => switchPane(t.dataset.pane)));
el.browserGo.addEventListener("click", () => browserGoTo(el.browserUrl.value));
el.browserUrl.addEventListener("keydown", e => { if (e.key === "Enter") browserGoTo(el.browserUrl.value); });
el.browserBack.addEventListener("click", browserBack);
el.browserForward.addEventListener("click", browserForward);
el.browserReload.addEventListener("click", browserReload);
document.addEventListener("click", e => {
  if (e.target.closest(".main") && !e.target.closest("input, button, .browser-viewport")) {
    const active = document.querySelector(".pane-tab.active");
    if (!active || active.dataset.pane === "terminal") el.termIn.focus();
  }
});

// ════════════════════════════════════════════════════════════
// INIT
// ════════════════════════════════════════════════════════════
renderHeader(); renderSidebar(); renderLeaderboard(); renderChallenge();