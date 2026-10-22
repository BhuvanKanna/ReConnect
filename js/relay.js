(() => {
"use strict";
// Client for the message relay in relay/ (a Cloudflare Worker). Used when the phone and the
// computer can't reach each other directly, e.g. phone on mobile data and computer on school
// Wi-Fi. Connections mimic the PeerJS DataConnection surface that link.js and phone.html
// already use: .open, send(obj), close(), on("open" | "data" | "close"). A connection that
// never opens emits "fail" instead, with "nohost" or "unreachable".

function wsUrl(base, params) {
  const u = new URL("ws", base.replace(/^http/, "ws").replace(/\/?$/, "/"));
  for (const k in params) u.searchParams.set(k, params[k]);
  return u.href;
}
function wsSend(ws, s) { if (ws && ws.readyState === 1) { try { ws.send(s); } catch (_) {} } }

class Conn {
  constructor(send, close) { this.open = false; this.done = false; this._h = {}; this._send = send; this._close = close; }
  on(ev, fn) { (this._h[ev] = this._h[ev] || []).push(fn); return this; }
  emit(ev, a) { for (const fn of this._h[ev] || []) { try { fn(a); } catch (e) { console.error(e); } } }
  up() { if (this.done || this.open) return; this.open = true; this.emit("open"); }
  down(why) { if (this.done) return; this.done = true; const was = this.open; this.open = false; this.emit(was ? "close" : "fail", why); }
  send(obj) { if (this.open) this._send(JSON.stringify(obj)); }
  close() { if (this.done) return; this._close(); this.down("closed"); }
}

// Phone side: one connection to the computer showing `code`.
function dial(base, code) {
  const ws = new WebSocket(wsUrl(base, { role: "phone", code }));
  const c = new Conn((s) => wsSend(ws, s), () => { try { ws.close(1000); } catch (_) {} });
  ws.onmessage = (e) => {
    let m; try { m = JSON.parse(e.data); } catch (_) { return; }
    if (!m || typeof m !== "object") return;
    if (m.type === "_ready") c.up();
    else if (m.type === "_nohost") c.down("nohost");
    else if (m.type === "_bye") { c.down("closed"); try { ws.close(1000); } catch (_) {} }
    else if (c.open) c.emit("data", m);
  };
  ws.onclose = () => c.down("unreachable");
  return c;
}

// Computer side: register `code` and hand each phone that joins to onConnection as a Conn.
// Reconnects by itself until close() is called. `key` proves a reconnect is the same computer.
function host(base, code, key, h) {
  let ws = null, phone = null, closed = false, wait = 1000, timer = null, ping = null;
  const dropPhone = () => { const c = phone; phone = null; if (c) c.down("closed"); };
  function open() {
    const me = ws = new WebSocket(wsUrl(base, { role: "host", code, key }));
    const p = ping = setInterval(() => wsSend(me, "ping"), 30000);
    me.onmessage = (e) => {
      if (e.data === "pong") return;
      let m; try { m = JSON.parse(e.data); } catch (_) { return; }
      if (!m || typeof m !== "object") return;
      if (m.type === "_ready") { wait = 1000; h.onOpen && h.onOpen(); }
      else if (m.type === "_taken") { closed = true; h.onTaken && h.onTaken(); }
      else if (m.type === "_bye") { closed = true; try { me.close(1000); } catch (_) {} h.onDown && h.onDown(); } // replaced by a newer copy of this tab
      else if (m.type === "_join") {
        dropPhone();
        const id = m.id;
        const c = phone = new Conn((s) => wsSend(me, s), () => wsSend(me, JSON.stringify({ type: "_kick", id })));
        c.id = id;
        h.onConnection(c);
        c.up();
      } else if (m.type === "_leave") { if (phone && phone.id === m.id) dropPhone(); }
      else if (phone) phone.emit("data", m);
    };
    me.onclose = () => {
      clearInterval(p);
      if (ws !== me) return;
      dropPhone();
      if (closed) return;
      h.onDown && h.onDown();
      timer = setTimeout(open, wait); wait = Math.min(wait * 2, 15000);
    };
  }
  open();
  return { close() { closed = true; clearTimeout(timer); clearInterval(ping); dropPhone(); try { ws.close(1000); } catch (_) {} } };
}

window.MendRelay = { dial, host };
})();
