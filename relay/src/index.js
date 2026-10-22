// ReConnect message relay. The computer and the phone each open a WebSocket here and the
// relay passes messages between them, so pairing works on any network that can load a
// website (no direct peer-to-peer link needed). One Room (Durable Object) per pairing code.
import { DurableObject } from "cloudflare:workers";

const MAX_MSG = 2048; // motion samples are ~80 bytes

const att = (ws) => { try { return ws.deserializeAttachment() || {}; } catch (_) { return {}; } };
const send = (ws, m) => { try { ws.send(typeof m === "string" ? m : JSON.stringify(m)); } catch (_) {} };
const shut = (ws, code, reason) => { try { ws.close(code, reason); } catch (_) {} };
// Ask the client to hang up as well: a close started by the server isn't always noticed
// promptly on the other end, and the phone must know at once so it can reconnect.
const bye = (ws, code, reason) => { send(ws, { type: "_bye" }); shut(ws, code, reason); };

// Answer the upgrade, tell the client why, and hang up.
function reject(type, code) {
  const { 0: client, 1: server } = new WebSocketPair();
  server.accept();
  send(server, { type });
  shut(server, code, type);
  return new Response(null, { status: 101, webSocket: client });
}

export class Room extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    // Keep-alive pings from the computer are answered without waking the object.
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair("ping", "pong"));
  }

  live(tag, except) { return this.ctx.getWebSockets(tag).filter((w) => w !== except && w.readyState === WebSocket.OPEN); }

  async fetch(request) {
    const url = new URL(request.url);
    const role = url.searchParams.get("role");
    const hosts = this.live("host");
    const { 0: client, 1: server } = new WebSocketPair();

    if (role === "host") {
      // The key is a random id the computer keeps in local storage. The same computer
      // reconnecting (sleep, network change) replaces its old socket; anyone else is told the
      // code is taken and picks a new one.
      const key = url.searchParams.get("key") || "";
      if (!key || hosts.some((w) => att(w).key !== key)) return reject("_taken", 4009);
      for (const w of hosts) bye(w, 4001, "replaced");
      for (const p of this.live("phone")) bye(p, 4004, "computer reconnected");
      server.serializeAttachment({ role: "host", key });
      this.ctx.acceptWebSocket(server, ["host"]);
      send(server, { type: "_ready" });
    } else if (role === "phone") {
      if (!hosts.length) return reject("_nohost", 4004);
      // One phone at a time: a new phone takes over, as with the direct link.
      for (const p of this.live("phone")) this.dropPhone(p, true);
      const id = crypto.randomUUID().slice(0, 8);
      server.serializeAttachment({ role: "phone", id });
      this.ctx.acceptWebSocket(server, ["phone"]);
      send(server, { type: "_ready" });
      for (const h of hosts) send(h, { type: "_join", id });
    } else {
      return new Response("role must be host or phone", { status: 400 });
    }
    return new Response(null, { status: 101, webSocket: client });
  }

  dropPhone(p, replaced) {
    if (replaced) send(p, { type: "replaced" });
    bye(p, 4001, replaced ? "replaced" : "closed by computer");
    for (const h of this.live("host")) send(h, { type: "_leave", id: att(p).id });
  }

  async webSocketMessage(ws, msg) {
    if (typeof msg !== "string" || msg.length > MAX_MSG) return;
    let m; try { m = JSON.parse(msg); } catch (_) { return; }
    if (!m || typeof m !== "object" || typeof m.type !== "string") return;
    const me = att(ws);
    if (me.role === "phone") {
      if (m.type[0] === "_") return; // control messages only come from the relay itself
      for (const h of this.live("host")) send(h, msg);
    } else if (me.role === "host") {
      if (m.type === "_kick") { for (const p of this.live("phone")) if (att(p).id === m.id) this.dropPhone(p, false); return; }
      for (const p of this.live("phone")) send(p, msg);
    }
  }

  async webSocketClose(ws) { this.gone(ws); shut(ws, 1000, "bye"); }
  async webSocketError(ws) { this.gone(ws); }

  gone(ws) {
    const me = att(ws);
    if (me.role === "host") {
      if (!this.live("host", ws).length) for (const p of this.live("phone")) bye(p, 4004, "computer left");
    } else if (me.role === "phone") {
      for (const h of this.live("host")) send(h, { type: "_leave", id: me.id });
    }
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/") return new Response("ReConnect relay is running.\n");
    if (url.pathname !== "/ws") return new Response("Not found", { status: 404 });
    if (request.headers.get("Upgrade") !== "websocket") return new Response("Expected a WebSocket", { status: 426 });
    // Optional: only accept pages served from your own site (comma-separated origins).
    const allowed = (env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean);
    if (allowed.length && !allowed.includes(request.headers.get("Origin") || "")) return new Response("Origin not allowed", { status: 403 });
    const code = url.searchParams.get("code") || "";
    if (!/^\d{6}$/.test(code)) return new Response("code must be 6 digits", { status: 400 });
    return env.ROOMS.get(env.ROOMS.idFromName(code)).fetch(request);
  },
};
