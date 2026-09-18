# Security model

## What is safe to be public

The GitHub Pages repository is intentionally fully public. `js/config.js` contains only the public Worker URL. Discord IDs, role IDs and the Worker URL are identifiers, not authentication secrets.

## What must never be committed

Never put any of these in GitHub, JavaScript, JSON, screenshots, issues, or Discord messages:

- Discord Client Secret
- Discord Bot Token
- Cloudflare API tokens
- moderator session bearer tokens

The Client Secret and Bot Token belong only in **Cloudflare Worker encrypted secrets**.

## Authorization

A moderator signs in through Discord OAuth. The Worker creates a random 256-bit session token, stores only its SHA-256 hash in D1, and returns the token in the URL fragment. The browser immediately removes it from the URL and keeps it in `sessionStorage`, so closing the browser tab clears the client copy. Sessions expire server-side after 8 hours.

The session alone is not enough to write. On **every moderator API request**, the Worker asks Discord for that user's current membership and roles in the configured server using the bot token. The request is accepted only when the user currently has an allowed role (or is explicitly allow-listed). Removing a Discord role therefore revokes write access on the next action.

The bot requires no Discord permissions and no running bot process. The token is used only for authenticated REST requests from the Worker.

## Database

The browser never receives a database credential and cannot talk to D1 directly. Public visitors can only call the Worker's read-only `/api/list` route. All inserts, updates, deletes and reorders go through the authenticated Worker. SQL values use D1 bound parameters.

Every successful mutation is also written to `audit_log` with the moderator's Discord ID, username, action, target and timestamp.

## Browser protections

- Bearer-token API auth instead of cross-site cookies, avoiding cookie-CSRF issues.
- OAuth `state` values are random and matched against a short-lived `HttpOnly; Secure; SameSite=Lax` cookie that is cleared on callback.
- Moderator tokens are in `sessionStorage`, not `localStorage`.
- The Worker allows cross-origin browser requests only from the configured site origin (plus explicitly configured development origins).
- The site has a restrictive Content Security Policy. Vue's current runtime-template design requires `unsafe-eval`; removing that would require precompiling/refactoring the Vue templates.
- All moderator-entered text is rendered through normal Vue interpolation, not `v-html`. URLs are validated server-side as HTTP/HTTPS.

## Recovery

The bundled `data/*.json` files remain a read-only backup. The live D1 database is the source of truth after setup. Cloudflare D1 also provides Time Travel within the limits of the account plan.

If the Discord Bot Token or Client Secret is ever exposed, rotate it immediately in Discord and update the Cloudflare secret. If a moderator browser session is suspected compromised, removing the moderator's Discord role immediately blocks further writes; their server session will also expire automatically.
