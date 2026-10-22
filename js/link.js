(() => {
"use strict";
const RC = window.RC;
const { $, clamp, lerp, TAU, reduceMotion, store, settings, saveSettings, T, alpha, txt, rr, chime, esc, fmtTime, Game, readTheme } = RC;
const { Input } = RC;
const flash = (...a) => RC.flash(...a);
const pauseForPhone = (...a) => RC.pauseForPhone(...a);
const resume = (...a) => RC.resume(...a);
const renderSetup = (...a) => RC.renderSetup(...a);
// ---------------------------------------------------------------- phone link
// The computer registers a short code with the free PeerJS broker; the phone connects to it
// and the two talk peer-to-peer over WebRTC. No server of our own is needed, so the site can
// be hosted as static files (GitHub Pages). PeerJS falls back to its public TURN relay when a
// network blocks direct connections.
// When MEND_RELAY_URL is set (js/config.js), the same code is also registered with our own
// relay (relay/, js/relay.js), which works across any two networks. The phone tries the relay
// first and falls back to the direct link; this side accepts whichever arrives.
const PEER_PREFIX = "mend-rehab-";
const RELAY = window.MEND_RELAY_URL || "";
const Link = { hosted: false, peer: null, relay: null, relayUp: false, conn: null, code: null, retry: null, directRetry: null, lastMsg: 0 };
const SILENT_MS = 6000; // the phone sends a heartbeat every 2 s
function sendPhone(obj) { if (Link.conn && Link.conn.open && Input.phone) { try { Link.conn.send(obj); } catch (_) {} } }

function phoneUrl() { return new URL("phone.html", location.href).href.split("#")[0].split("?")[0]; }
function renderPairing() {
  if (!Link.hosted) return;
  $("pCode").textContent = Link.code || "······";
  const url = phoneUrl() + (Link.code ? "?c=" + Link.code : "");
  $("pUrl").textContent = url;
  if (Link.code && window.qrcode) {
    const qr = window.qrcode(0, "M"); qr.addData(url); qr.make();
    $("qrBox").innerHTML = qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
  }
}
function setPairStatus(t) { $("pStatus").textContent = t; }

// Treat the phone as gone (it said goodbye, or went quiet) and close the connection.
function dropPhone(msg) {
  const c = Link.conn; if (!c) return;
  Link.conn = null; try { c.close(); } catch (_) {}
  setPhone(false); setPairStatus(msg || "Phone disconnected. Waiting for it to reconnect.");
}
setInterval(() => { if (Link.conn && Input.phone && performance.now() - Link.lastMsg > SILENT_MS) dropPhone(); }, 1000);

function onPhoneMessage(m) {
  if (!m || typeof m !== "object") return;
  Link.lastMsg = performance.now();
  if (m.type === "bye") { dropPhone(); return; }
  if (m.type === "m") {
    if (typeof m.b !== "number" || typeof m.g !== "number") return;
    Input.raw.b = clamp(m.b, -180, 180); Input.raw.g = clamp(m.g, -90, 90); Input.lastAt = performance.now();
    if (typeof m.a === "number") Input.raw.a = m.a;
    if (typeof m.mag === "number") { Input.raw.mag = m.mag; Input.raw.lin = m.lin !== false; }
    if (!Input.phone) setPhone(true);
  } else if (m.type === "tap") {
    if (Game.state === "play" && Game.inst && Game.inst.pad) Game.inst.pad({ type: "tap", key: String(m.key) });
  } else if (m.type === "recenter") {
    Input.neutral = { b: Input.raw.b, g: Input.raw.g };
    flash("Center reset", "Your current position is the new resting point.", "good");
  }
}

// Identifies this tab to the relay, so a reload or network change gets its own code back.
// Kept per tab (sessionStorage): a second tab is a different computer and gets a new code.
let tabKey = null;
function relayKey() {
  try { tabKey = tabKey || sessionStorage.getItem("mend.relayKey"); } catch (_) {}
  if (!tabKey) {
    tabKey = window.crypto && crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2) + Date.now();
    try { sessionStorage.setItem("mend.relayKey", tabKey); } catch (_) {}
  }
  return tabKey;
}

function startPeer() {
  clearTimeout(Link.retry);
  if (Link.relay) { Link.relay.close(); Link.relay = null; Link.relayUp = false; }
  const code = store.get("mend.code6", null) || String(Math.floor(100000 + Math.random() * 900000));
  setPairStatus("Starting pairing…");
  const ready = () => {
    if (Link.code !== code) { Link.code = code; store.set("mend.code6", code); renderPairing(); }
    if (!Link.conn) setPairStatus("Waiting for your phone. Phone and computer can be on any network.");
  };
  if (RELAY && window.MendRelay) {
    Link.relay = window.MendRelay.host(RELAY, code, relayKey(), {
      onOpen: () => { Link.relayUp = true; ready(); },
      onDown: () => { Link.relayUp = false; if (!Link.conn && !(Link.peer && Link.peer.open)) setPairStatus("Reconnecting to the pairing service…"); },
      onTaken: () => { store.set("mend.code6", null); Link.retry = setTimeout(startPeer, 300); },
      onConnection: acceptConn,
    });
  }
  startDirect(code, ready);
}

// The direct PeerJS link. With the relay running it only retries itself and keeps the code.
function startDirect(code, ready) {
  clearTimeout(Link.directRetry);
  if (Link.peer) { try { Link.peer.destroy(); } catch (_) {} Link.peer = null; }
  if (typeof window.Peer !== "function") return;
  const peer = new window.Peer(PEER_PREFIX + code, Object.assign({ debug: 0 }, window.MEND_PEER_OPTS || {}));
  Link.peer = peer;
  peer.on("open", ready);
  peer.on("disconnected", () => { if (!Link.relayUp) setPairStatus("Reconnecting to the pairing service…"); try { peer.reconnect(); } catch (_) {} });
  peer.on("error", (e) => {
    if (Link.peer !== peer) return;
    if (e.type === "unavailable-id") {
      // Usually our own last session, still held by the broker for a minute: try again later.
      if (Link.relay) { Link.directRetry = setTimeout(() => startDirect(code, ready), 10000); return; }
      store.set("mend.code6", null); Link.retry = setTimeout(startPeer, 300); return;
    }
    if (["network", "server-error", "socket-error", "socket-closed"].includes(e.type)) {
      if (!Link.relayUp) setPairStatus("Can't reach the pairing service. Check the internet connection; retrying…");
      Link.directRetry = setTimeout(() => startDirect(code, ready), 4000);
    }
  });
  peer.on("connection", acceptConn);
}

function acceptConn(conn) {
  conn.on("open", () => {
    if (Link.conn && Link.conn !== conn) { try { Link.conn.send({ type: "replaced" }); Link.conn.close(); } catch (_) {} }
    Link.conn = conn; Link.lastMsg = performance.now(); setPhone(true); chime("success"); pushStatus(true);
    setPairStatus("Phone paired.");
  });
  conn.on("data", onPhoneMessage);
  const gone = () => { if (Link.conn === conn) { Link.conn = null; setPhone(false); setPairStatus("Phone disconnected. Waiting for it to reconnect."); } };
  conn.on("close", gone); conn.on("error", gone);
}
window.addEventListener("beforeunload", () => {
  try { Link.relay && Link.relay.close(); } catch (_) {}
  try { Link.peer && Link.peer.destroy(); } catch (_) {}
});
function setPhone(on) {
  const was = Input.phone;
  Input.phone = on;
  if (!on && RC.padDisconnected && RC.padDisconnected()) { Input.mode = "mouse"; renderConn(); return; }
  if (!on && Input.mode === "phone" && Game.state === "play") pauseForPhone();
  if (on && Input.mode === "phone" && Game.state === "paused") resume();
  if (on !== was && Game.state === "setup") renderSetup();
  renderConn();
}
function renderConn() {
  const c = $("conn");
  if (Input.phone && !settings.mouse) { c.className = "conn on"; $("connText").textContent = "Phone connected"; }
  else if (settings.mouse || !Link.hosted) { c.className = "conn demo-mode"; $("connText").textContent = "Mouse mode"; }
  else { c.className = "conn"; $("connText").textContent = "No phone"; }
  $("pLive").hidden = !(Input.phone && !settings.mouse);
  $("useMouse").checked = !!settings.mouse || !Link.hosted;
  $("useMouse").disabled = !Link.hosted;
}
$("useMouse").addEventListener("change", (e) => {
  settings.mouse = e.target.checked; saveSettings();
  Input.mode = settings.mouse || !Input.phone ? "mouse" : "phone";
  renderConn();
});

// Tell the phone what to do, so the person never has to look away to read instructions.
let lastStatus = "", lastStatusAt = 0;
function pushStatus(force) {
  if (!force && performance.now() - lastStatusAt < 300) return;
  const st = Game.current ? Game.statusText() : { title: "Choose an activity on your computer", text: "Keep this screen open while you play.", tone: "" };
  const msg = { type: "status", task: Game.current ? Game.current.def.name : "Paired", title: st.title, text: st.text || "", tone: st.tone || "" };
  const key = JSON.stringify(msg);
  if (!force && key === lastStatus) return;
  lastStatus = key; lastStatusAt = performance.now(); sendPhone(msg);
}
Object.assign(RC, { Link, sendPhone, pushStatus, renderConn, setPhone, startPeer, renderPairing });
})();
