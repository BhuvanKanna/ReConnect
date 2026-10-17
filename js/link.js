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
const PEER_PREFIX = "mend-rehab-";
const Link = { hosted: false, peer: null, conn: null, code: null, retry: null };
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

function onPhoneMessage(m) {
  if (!m || typeof m !== "object") return;
  if (m.type === "m") {
    if (typeof m.b !== "number" || typeof m.g !== "number") return;
    Input.raw.b = clamp(m.b, -180, 180); Input.raw.g = clamp(m.g, -90, 90); Input.lastAt = performance.now();
    if (!Input.phone) setPhone(true);
  } else if (m.type === "recenter") {
    Input.neutral = { b: Input.raw.b, g: Input.raw.g };
    flash("Center reset", "Your current position is the new resting point.", "good");
  }
}

function startPeer() {
  clearTimeout(Link.retry);
  if (Link.peer) { try { Link.peer.destroy(); } catch (_) {} }
  const code = store.get("mend.code6", null) || String(Math.floor(100000 + Math.random() * 900000));
  const peer = new window.Peer(PEER_PREFIX + code, Object.assign({ debug: 0 }, window.MEND_PEER_OPTS || {}));
  Link.peer = peer;
  setPairStatus("Starting pairing…");
  peer.on("open", () => { Link.code = code; store.set("mend.code6", code); renderPairing(); setPairStatus("Waiting for your phone. Phone and computer can be on any network."); });
  peer.on("disconnected", () => { setPairStatus("Reconnecting to the pairing service…"); try { peer.reconnect(); } catch (_) {} });
  peer.on("error", (e) => {
    if (e.type === "unavailable-id") { store.set("mend.code6", null); Link.retry = setTimeout(startPeer, 300); return; }
    if (["network", "server-error", "socket-error", "socket-closed"].includes(e.type)) {
      setPairStatus("Can't reach the pairing service. Check the internet connection; retrying…");
      Link.retry = setTimeout(startPeer, 4000);
    }
  });
  peer.on("connection", (conn) => {
    conn.on("open", () => {
      if (Link.conn && Link.conn !== conn) { try { Link.conn.send({ type: "replaced" }); Link.conn.close(); } catch (_) {} }
      Link.conn = conn; setPhone(true); chime("success"); pushStatus(true);
      setPairStatus("Phone paired.");
    });
    conn.on("data", onPhoneMessage);
    const gone = () => { if (Link.conn === conn) { Link.conn = null; setPhone(false); setPairStatus("Phone disconnected. Waiting for it to reconnect."); } };
    conn.on("close", gone); conn.on("error", gone);
  });
}
window.addEventListener("beforeunload", () => { try { Link.peer && Link.peer.destroy(); } catch (_) {} });
function setPhone(on) {
  const was = Input.phone;
  Input.phone = on;
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
