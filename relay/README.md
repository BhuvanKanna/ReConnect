# ReConnect relay

A small Cloudflare Worker that passes messages between the computer and the phone. With it, pairing
works across any two networks (phone on mobile data, computer on school or clinic Wi-Fi), because
both devices only make an ordinary secure WebSocket connection to the relay. It runs on the Workers
free plan, with no card needed.

## Deploy (about 5 minutes, once)

1. Make a free Cloudflare account at <https://dash.cloudflare.com/sign-up>.
2. From this folder:

   ```bash
   npm install
   npx wrangler login      # opens the browser to sign in
   npx wrangler deploy
   ```

   The last line prints the relay's address, like `https://reconnect-relay.<you>.workers.dev`.
   Opening that address in a browser should say "ReConnect relay is running."
3. Put that address in `../js/config.js`:

   ```js
   window.MEND_RELAY_URL = window.MEND_RELAY_URL || "https://reconnect-relay.<you>.workers.dev";
   ```

4. Publish the site again (commit and push for GitHub Pages).

Optional: to stop other sites from using your free allowance, set `ALLOWED_ORIGINS` in
`wrangler.jsonc` to your site's origin (for example `"https://yourname.github.io"`) and deploy again.
`.dev.vars` turns that check off for `wrangler dev`, so local tests from localhost still work.

## Free plan limits

The free plan resets daily. One hour of play uses roughly 4,500 requests and 450 GB-s of Durable
Object time, so the daily allowance covers about 20 hours of play in total. If it runs out, you are
not charged: the relay stops answering until the next day, and the phone falls back to the direct
link, which still works on a shared network.

## How it works

- One Durable Object ("Room") per 6-digit pairing code.
- The computer connects as `host` with a per-tab key. The same tab reconnecting (after sleep or a
  network change) gets its code back. A different computer that picks a code already in use is told
  it's taken and picks another.
- The phone connects as `phone`. If no computer is on that code, it's told so right away. A new
  phone takes over from the previous one, the same as with the direct link.
- Every other message is forwarded unchanged. Control messages start with `_`, and only the relay
  sends them: `_ready`, `_taken`, `_nohost`, `_join`, `_leave`, `_bye`, plus `_kick` from the computer.

## Local testing

```bash
npx wrangler dev                                                     # relay on http://127.0.0.1:8787
python ../tests/smoke_test.py --relay http://127.0.0.1:8787 --relay-only
```

`--relay-only` blocks PeerJS, so a pass means pairing really went through the relay.
