# One-time setup (owner only)

After this is done, moderators never need GitHub, Cloudflare, code, a password, or a bot command. They open **Mod Panel**, click **Sign in with Discord**, and edit the list.

The public GitHub repository contains **no Discord secret, bot token, or database credential**. All secrets live in Cloudflare's encrypted Worker secret storage.

## 1. Create the Discord application

1. Open the Discord Developer Portal and create an application called something like `Blindfolded List Moderator`.
2. On **OAuth2**, copy the **Client ID** and generate/copy the **Client Secret**. Do **not** put the secret in GitHub.
3. Open **Bot**, create the bot user, and copy/reset its **Bot Token**. Do **not** put the token in GitHub.
4. Add that bot to your Discord server. It needs **zero server permissions**. It is used only through Discord's REST API to check a signed-in user's server roles. It does not run a process and can appear offline forever.
5. In Discord, enable Developer Mode, right-click your server → **Copy Server ID**, then right-click the moderator role → **Copy Role ID**. You can authorize several roles by separating IDs with commas.

## 2. Create the free Cloudflare D1 database

1. Create a free Cloudflare account if needed.
2. In **Workers & Pages → D1**, create a database named `gd-blindfolded-list`.
3. Open its SQL console and run the contents of `worker/database.sql`.

That file creates the schema and seeds exactly **25 currently listed levels and 59 records**. The five JSON files that are currently unlisted are deliberately not inserted.

## 3. Create the Worker

1. Go to **Workers & Pages → Create → Worker**.
2. Give it a name such as `gd-blindfolded-list-api`.
3. Replace the starter code with the full contents of `worker/index.js`, then deploy.
4. In the Worker's **Settings → Bindings**, add a **D1 database binding** named exactly `DB` and select the database you created.
5. In **Settings → Variables and Secrets**, add these normal variables:

   - `SITE_URL` = `https://lutz127.github.io/GDBlindfoldedList/`
   - `DISCORD_CLIENT_ID` = your Discord application/client ID
   - `DISCORD_GUILD_ID` = your Discord server ID
   - `DISCORD_MOD_ROLE_IDS` = your moderator role ID (or comma-separated role IDs)
   - `DISCORD_ALLOWED_USER_IDS` = optional comma-separated Discord user IDs that should always have access; otherwise leave blank

6. Add these as **encrypted secrets**, not ordinary public variables:

   - `DISCORD_CLIENT_SECRET`
   - `DISCORD_BOT_TOKEN`

7. Deploy again and copy the Worker URL, for example `https://gd-blindfolded-list-api.example.workers.dev`.

## 4. Finish Discord OAuth

In the Discord application's **OAuth2 → Redirects**, add exactly:

`https://YOUR-WORKER.YOUR-SUBDOMAIN.workers.dev/api/auth/callback`

Use the real Worker hostname. No trailing slash after `callback`.

## 5. Connect GitHub Pages to the Worker

Open `js/config.js` and replace:

`https://YOUR-WORKER.YOUR-SUBDOMAIN.workers.dev`

with your real Worker URL. This URL is public and safe to commit. **Do not put any secret into `js/config.js`.**

Push the whole repository to GitHub. GitHub Pages can keep serving it exactly as before.

## 6. Test it

1. Visit your site and open **Mod Panel**.
2. Click **Sign in with Discord**.
3. A user with an allowed Discord role should see the editor.
4. Add a harmless test record, refresh the public list, then delete it.
5. Temporarily remove your moderator role and verify the next save is rejected. Put the role back afterward.

## What moderators do from then on

Nothing technical: **Mod Panel → Sign in with Discord → choose level → edit/save**, or add/delete records and levels. Ordering uses the ▲/▼ buttons. Every write re-checks the user's current Discord role, so removing the role removes editing access without changing code.

## Optional Wrangler route

`worker/wrangler.toml.example` is included if you prefer Cloudflare's CLI. Copy it to `worker/wrangler.toml`, fill only the non-secret IDs, use `wrangler secret put DISCORD_CLIENT_SECRET` and `wrangler secret put DISCORD_BOT_TOKEN`, then deploy. Never commit the filled secret values.
