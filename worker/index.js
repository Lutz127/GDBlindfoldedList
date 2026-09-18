const DISCORD_API = 'https://discord.com/api/v10';
const MAX_JSON_BYTES = 32 * 1024;
const SESSION_TTL_SECONDS = 8 * 60 * 60;

export default {
    async fetch(request, env) {
        try {
            return await route(request, env);
        } catch (error) {
            console.error(error);
            const status = error instanceof HttpError ? error.status : 500;
            const message = status >= 500
                ? 'Server error. Please try again.'
                : (error instanceof Error ? error.message : 'Request failed.');
            return json(request, env, { error: message }, status, { noStore: true });
        }
    },
};

async function route(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') return preflight(request, env);
    if (request.method === 'GET' && url.pathname === '/api/health') {
        return json(request, env, { ok: true, service: 'GDBlindfoldedList API' });
    }
    if (request.method === 'GET' && url.pathname === '/api/list') return publicList(request, env);
    if (request.method === 'GET' && url.pathname === '/api/auth/login') return authLogin(request, env);
    if (request.method === 'GET' && url.pathname === '/api/auth/callback') return authCallback(request, env);
    if (request.method === 'POST' && url.pathname === '/api/auth/logout') return authLogout(request, env);
    if (request.method === 'POST' && url.pathname === '/api/admin') return adminAction(request, env);

    return json(request, env, { error: 'Not found.' }, 404, { noStore: true });
}

async function publicList(request, env) {
    requireBinding(env, 'DB');
    const [levelResult, recordResult] = await Promise.all([
        env.DB.prepare(`
            SELECT level_uuid, gd_id, name, author, creators_json, verifier, verification,
                   percent_to_qualify, platformer, difficulty, rank
            FROM levels
            ORDER BY platformer ASC, rank ASC
        `).all(),
        env.DB.prepare(`
            SELECT record_uuid, level_uuid, user, link, percent, time, mobile
            FROM records
            ORDER BY created_at ASC
        `).all(),
    ]);

    const byLevel = new Map();
    for (const row of recordResult.results || []) {
        if (!byLevel.has(row.level_uuid)) byLevel.set(row.level_uuid, []);
        byLevel.get(row.level_uuid).push({
            recordId: row.record_uuid,
            user: row.user,
            link: row.link || '',
            percent: row.percent == null ? undefined : Number(row.percent),
            time: row.time || undefined,
            mobile: Boolean(row.mobile),
        });
    }

    const levels = (levelResult.results || []).map((row) => {
        let creators = [];
        try { creators = JSON.parse(row.creators_json || '[]'); } catch { creators = []; }
        return {
            databaseId: row.level_uuid,
            id: Number(row.gd_id),
            name: row.name,
            author: row.author,
            creators,
            verifier: row.verifier,
            verification: row.verification,
            percentToQualify: Boolean(row.platformer) ? 100 : Number(row.percent_to_qualify),
            platformer: Boolean(row.platformer),
            difficulty: row.difficulty,
            rank: Number(row.rank),
            records: byLevel.get(row.level_uuid) || [],
        };
    });

    return json(request, env, { levels }, 200, { publicCache: true });
}

async function authLogin(request, env) {
    requireConfig(env);
    const state = randomToken(24);
    const redirectUri = callbackUrl(request);
    const params = new URLSearchParams({
        client_id: env.DISCORD_CLIENT_ID,
        response_type: 'code',
        redirect_uri: redirectUri,
        scope: 'identify',
        state,
    });
    const response = redirect(`https://discord.com/oauth2/authorize?${params.toString()}`);
    response.headers.set('Set-Cookie', oauthStateCookie(state, 600));
    return response;
}

async function authCallback(request, env) {
    requireConfig(env);
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const expectedState = readCookie(request, 'gdbfl_oauth_state');
    if (!code || !state || !expectedState || state !== expectedState) return callbackRedirect(env, 'error');

    const now = unixNow();
    const tokenResponse = await fetch(`${DISCORD_API}/oauth2/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: env.DISCORD_CLIENT_ID,
            client_secret: env.DISCORD_CLIENT_SECRET,
            grant_type: 'authorization_code',
            code,
            redirect_uri: callbackUrl(request),
        }),
    });
    if (!tokenResponse.ok) return callbackRedirect(env, 'error');
    const oauth = await tokenResponse.json();

    const userResponse = await fetch(`${DISCORD_API}/users/@me`, {
        headers: { Authorization: `Bearer ${oauth.access_token}` },
    });
    if (!userResponse.ok) return callbackRedirect(env, 'error');
    const user = await userResponse.json();

    let access;
    try {
        access = await checkDiscordAccess(env, user.id);
    } catch (error) {
        console.error('Discord role check failed during login', error);
        return callbackRedirect(env, 'error');
    }
    if (!access.authorized) return callbackRedirect(env, 'denied');

    const sessionToken = randomToken(32);
    const tokenHash = await sha256Hex(sessionToken);
    const expiresAt = now + SESSION_TTL_SECONDS;
    await env.DB.prepare('DELETE FROM sessions WHERE expires_at < ?').bind(now).run();
    await env.DB.prepare(`
        INSERT INTO sessions (token_hash, discord_user_id, username, global_name, avatar, expires_at)
        VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
        tokenHash,
        String(user.id),
        String(user.username || 'Discord user').slice(0, 100),
        user.global_name ? String(user.global_name).slice(0, 100) : null,
        user.avatar ? String(user.avatar).slice(0, 200) : null,
        expiresAt,
    ).run();

    return callbackRedirect(env, null, sessionToken);
}

async function authLogout(request, env) {
    const token = bearerToken(request);
    if (token) {
        const hash = await sha256Hex(token);
        await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(hash).run();
    }
    return json(request, env, { ok: true }, 200, { noStore: true });
}

async function adminAction(request, env) {
    requireConfig(env);
    const moderator = await requireModerator(request, env);
    const body = await readJson(request);
    const action = body?.action;

    if (action === 'status') {
        return json(request, env, {
            authorized: true,
            username: moderator.username,
            displayName: moderator.displayName,
            discordUserId: moderator.discordUserId,
        }, 200, { noStore: true });
    }

    if (action === 'saveLevel') return saveLevel(request, env, moderator, body.level);
    if (action === 'deleteLevel') return deleteLevel(request, env, moderator, body.levelUuid);
    if (action === 'moveLevel') return moveLevel(request, env, moderator, body.platformer, body.levelUuid, body.delta);
    if (action === 'saveRecord') return saveRecord(request, env, moderator, body.record);
    if (action === 'deleteRecord') return deleteRecord(request, env, moderator, body.recordUuid);

    throw httpError(400, 'Unknown moderator action.');
}

async function saveLevel(request, env, moderator, input) {
    const level = validateLevel(input);
    const nowIso = new Date().toISOString();
    const existing = level.levelUuid
        ? await env.DB.prepare('SELECT * FROM levels WHERE level_uuid = ?').bind(level.levelUuid).first()
        : null;

    if (level.levelUuid && !existing) throw httpError(404, 'That level no longer exists.');

    const duplicate = await env.DB.prepare('SELECT level_uuid FROM levels WHERE gd_id = ? AND level_uuid != ?')
        .bind(level.gdId, level.levelUuid || '').first();
    if (duplicate) throw httpError(409, 'Another level already uses that Geometry Dash ID.');

    let levelUuid = level.levelUuid || crypto.randomUUID();
    let rank;
    let oldPlatformer = existing ? Boolean(existing.platformer) : level.platformer;

    if (!existing) {
        const maxRow = await env.DB.prepare('SELECT COALESCE(MAX(rank), 0) AS max_rank FROM levels WHERE platformer = ?')
            .bind(level.platformer ? 1 : 0).first();
        rank = Number(maxRow?.max_rank || 0) + 1;
    } else if (oldPlatformer !== level.platformer) {
        const count = await env.DB.prepare('SELECT COUNT(*) AS count FROM records WHERE level_uuid = ?')
            .bind(levelUuid).first();
        if (Number(count?.count || 0) > 0) {
            throw httpError(409, 'Delete this level’s records before changing its type.');
        }
        const maxRow = await env.DB.prepare('SELECT COALESCE(MAX(rank), 0) AS max_rank FROM levels WHERE platformer = ?')
            .bind(level.platformer ? 1 : 0).first();
        rank = Number(maxRow?.max_rank || 0) + 1;
    } else {
        rank = Number(existing.rank);
    }

    if (existing) {
        await env.DB.prepare(`
            UPDATE levels SET gd_id = ?, name = ?, author = ?, creators_json = ?, verifier = ?,
                verification = ?, percent_to_qualify = ?, platformer = ?, difficulty = ?, rank = ?, updated_at = ?
            WHERE level_uuid = ?
        `).bind(
            level.gdId, level.name, level.author, JSON.stringify(level.creators), level.verifier,
            level.verification, level.platformer ? 100 : level.percentToQualify,
            level.platformer ? 1 : 0, level.difficulty, rank, nowIso, levelUuid,
        ).run();
    } else {
        await env.DB.prepare(`
            INSERT INTO levels (
                level_uuid, gd_id, name, author, creators_json, verifier, verification,
                percent_to_qualify, platformer, difficulty, rank, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
            levelUuid, level.gdId, level.name, level.author, JSON.stringify(level.creators), level.verifier,
            level.verification, level.platformer ? 100 : level.percentToQualify,
            level.platformer ? 1 : 0, level.difficulty, rank, nowIso, nowIso,
        ).run();
    }

    if (existing && oldPlatformer !== level.platformer) await compactRanks(env, oldPlatformer);
    await audit(env, moderator, existing ? 'level.update' : 'level.create', 'level', levelUuid, { before: existing, after: level });
    return json(request, env, { ok: true, levelUuid }, 200, { noStore: true });
}

async function deleteLevel(request, env, moderator, levelUuidRaw) {
    const levelUuid = requiredString(levelUuidRaw, 'levelUuid', 100);
    const existing = await env.DB.prepare('SELECT * FROM levels WHERE level_uuid = ?').bind(levelUuid).first();
    if (!existing) throw httpError(404, 'That level no longer exists.');

    await env.DB.prepare('DELETE FROM levels WHERE level_uuid = ?').bind(levelUuid).run();
    await compactRanks(env, Boolean(existing.platformer));
    await audit(env, moderator, 'level.delete', 'level', levelUuid, { before: existing });
    return json(request, env, { ok: true }, 200, { noStore: true });
}

async function moveLevel(request, env, moderator, platformerRaw, levelUuidRaw, deltaRaw) {
    if (typeof platformerRaw !== 'boolean') throw httpError(400, 'Invalid level type.');
    const platformer = platformerRaw;
    const levelUuid = requiredString(levelUuidRaw, 'levelUuid', 100);
    const delta = Number(deltaRaw);
    if (delta !== -1 && delta !== 1) throw httpError(400, 'Move direction must be -1 or 1.');

    const current = await env.DB.prepare('SELECT level_uuid, rank, platformer FROM levels WHERE level_uuid = ?')
        .bind(levelUuid).first();
    if (!current || Boolean(current.platformer) !== platformer) throw httpError(404, 'That level no longer exists in this list.');

    const targetRank = Number(current.rank) + delta;
    const neighbor = await env.DB.prepare('SELECT level_uuid, rank FROM levels WHERE platformer = ? AND rank = ?')
        .bind(platformer ? 1 : 0, targetRank).first();
    if (!neighbor) return json(request, env, { ok: true }, 200, { noStore: true });

    const nowIso = new Date().toISOString();
    await env.DB.prepare(`
        UPDATE levels
        SET rank = CASE
            WHEN level_uuid = ? THEN ?
            WHEN level_uuid = ? THEN ?
            ELSE rank
        END, updated_at = ?
        WHERE level_uuid IN (?, ?)
    `).bind(
        current.level_uuid, Number(neighbor.rank),
        neighbor.level_uuid, Number(current.rank),
        nowIso, current.level_uuid, neighbor.level_uuid,
    ).run();

    await audit(env, moderator, 'level.move', 'level', levelUuid, {
        platformer, fromRank: Number(current.rank), toRank: Number(neighbor.rank),
    });
    return json(request, env, { ok: true }, 200, { noStore: true });
}

async function saveRecord(request, env, moderator, input) {
    if (!input || typeof input !== 'object') throw httpError(400, 'Record data is required.');
    const recordUuid = input.recordUuid ? requiredString(input.recordUuid, 'recordUuid', 100) : crypto.randomUUID();
    const levelUuid = requiredString(input.levelUuid, 'levelUuid', 100);
    const user = requiredString(input.user, 'Player', 120);
    const link = optionalHttpUrl(input.link, 'Record video URL');
    if (typeof input.mobile !== 'boolean') throw httpError(400, 'Mobile must be true or false.');
    const mobile = input.mobile;

    const level = await env.DB.prepare('SELECT level_uuid, platformer FROM levels WHERE level_uuid = ?').bind(levelUuid).first();
    if (!level) throw httpError(404, 'That level no longer exists.');

    let percent = null;
    let time = null;
    if (Boolean(level.platformer)) {
        time = requiredString(input.time, 'Time', 40);
        if (!Number.isFinite(parseTimeToMs(time))) throw httpError(400, 'Use a time like 1:23.456 or 2:36:48.871.');
    } else {
        percent = Number(input.percent);
        if (!Number.isFinite(percent) || percent < 1 || percent > 100) throw httpError(400, 'Progress must be between 1 and 100.');
    }

    const existing = input.recordUuid
        ? await env.DB.prepare('SELECT * FROM records WHERE record_uuid = ?').bind(recordUuid).first()
        : null;
    if (input.recordUuid && !existing) throw httpError(404, 'That record no longer exists.');
    if (existing && existing.level_uuid !== levelUuid) throw httpError(400, 'A record cannot be moved to another level.');

    const nowIso = new Date().toISOString();
    if (existing) {
        await env.DB.prepare(`
            UPDATE records SET user = ?, link = ?, percent = ?, time = ?, mobile = ?, updated_at = ?
            WHERE record_uuid = ?
        `).bind(user, link, percent, time, mobile ? 1 : 0, nowIso, recordUuid).run();
    } else {
        await env.DB.prepare(`
            INSERT INTO records (record_uuid, level_uuid, user, link, percent, time, mobile, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(recordUuid, levelUuid, user, link, percent, time, mobile ? 1 : 0, nowIso, nowIso).run();
    }

    await audit(env, moderator, existing ? 'record.update' : 'record.create', 'record', recordUuid, { before: existing, after: { levelUuid, user, link, percent, time, mobile } });
    return json(request, env, { ok: true, recordUuid }, 200, { noStore: true });
}

async function deleteRecord(request, env, moderator, recordUuidRaw) {
    const recordUuid = requiredString(recordUuidRaw, 'recordUuid', 100);
    const existing = await env.DB.prepare('SELECT * FROM records WHERE record_uuid = ?').bind(recordUuid).first();
    if (!existing) throw httpError(404, 'That record no longer exists.');
    await env.DB.prepare('DELETE FROM records WHERE record_uuid = ?').bind(recordUuid).run();
    await audit(env, moderator, 'record.delete', 'record', recordUuid, { before: existing });
    return json(request, env, { ok: true }, 200, { noStore: true });
}

async function requireModerator(request, env) {
    const token = bearerToken(request);
    if (!token) throw httpError(401, 'Sign in with Discord first.');
    const tokenHash = await sha256Hex(token);
    const now = unixNow();
    const session = await env.DB.prepare(`
        SELECT token_hash, discord_user_id, username, global_name, expires_at
        FROM sessions WHERE token_hash = ? AND expires_at >= ?
    `).bind(tokenHash, now).first();
    if (!session) throw httpError(401, 'Your moderator session has expired. Sign in again.');

    let access;
    try {
        access = await checkDiscordAccess(env, session.discord_user_id);
    } catch (error) {
        console.error('Discord role check failed', error);
        throw httpError(502, 'Discord could not be reached to verify your moderator role. Try again.');
    }
    if (!access.authorized) {
        await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(tokenHash).run();
        throw httpError(403, 'Your Discord account does not currently have moderator access.');
    }

    return {
        discordUserId: String(session.discord_user_id),
        username: String(session.username),
        displayName: access.member?.nick || session.global_name || session.username,
    };
}

async function checkDiscordAccess(env, discordUserId) {
    const response = await fetch(`${DISCORD_API}/guilds/${encodeURIComponent(env.DISCORD_GUILD_ID)}/members/${encodeURIComponent(discordUserId)}`, {
        headers: { Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` },
    });
    if (response.status === 404) return { authorized: false, member: null };
    if (!response.ok) throw new Error(`Discord member lookup failed (${response.status}).`);
    const member = await response.json();

    const allowedRoles = csvSet(env.DISCORD_MOD_ROLE_IDS);
    const allowedUsers = csvSet(env.DISCORD_ALLOWED_USER_IDS || '');
    if (!allowedRoles.size && !allowedUsers.size) throw new Error('No moderator role/user IDs are configured.');

    const authorized = allowedUsers.has(String(discordUserId)) ||
        (Array.isArray(member.roles) && member.roles.some((roleId) => allowedRoles.has(String(roleId))));
    return { authorized, member };
}

function validateLevel(input) {
    if (!input || typeof input !== 'object') throw httpError(400, 'Level data is required.');
    if (typeof input.platformer !== 'boolean') throw httpError(400, 'Level type must be classic or platformer.');
    const platformer = input.platformer;
    const gdId = Number(input.gdId);
    if (!Number.isSafeInteger(gdId) || gdId < 1) throw httpError(400, 'Geometry Dash level ID must be a positive integer.');

    const creators = Array.isArray(input.creators)
        ? input.creators.map((value) => requiredString(value, 'Creator', 120)).filter(Boolean)
        : [];
    if (!creators.length || creators.length > 20) throw httpError(400, 'Enter between 1 and 20 creators.');

    let percentToQualify = 100;
    if (!platformer) {
        percentToQualify = Number(input.percentToQualify);
        if (!Number.isFinite(percentToQualify) || percentToQualify < 1 || percentToQualify > 100) {
            throw httpError(400, 'Minimum percentage to qualify must be between 1 and 100.');
        }
    }

    return {
        levelUuid: input.levelUuid ? requiredString(input.levelUuid, 'levelUuid', 100) : null,
        gdId,
        name: requiredString(input.name, 'Display name', 120),
        author: requiredString(input.author, 'Author', 120),
        creators,
        verifier: requiredString(input.verifier, 'Verifier', 120),
        verification: requiredHttpUrl(input.verification, 'Verification video URL'),
        percentToQualify,
        platformer,
        difficulty: requiredString(input.difficulty, 'Difficulty', 50),
    };
}

async function compactRanks(env, platformer) {
    const nowIso = new Date().toISOString();
    await env.DB.prepare(`
        WITH ranked AS (
            SELECT level_uuid, ROW_NUMBER() OVER (ORDER BY rank ASC, created_at ASC) AS new_rank
            FROM levels
            WHERE platformer = ?
        )
        UPDATE levels
        SET rank = (SELECT new_rank FROM ranked WHERE ranked.level_uuid = levels.level_uuid),
            updated_at = ?
        WHERE level_uuid IN (SELECT level_uuid FROM ranked)
    `).bind(platformer ? 1 : 0, nowIso).run();
}

async function audit(env, moderator, action, entityType, entityId, details) {
    const safeDetails = JSON.stringify(details ?? null).slice(0, 20000);
    await env.DB.prepare(`
        INSERT INTO audit_log (discord_user_id, username, action, entity_type, entity_id, details_json, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
        moderator.discordUserId, moderator.username, action, entityType, String(entityId), safeDetails,
        new Date().toISOString(),
    ).run();
}

async function readJson(request) {
    const length = Number(request.headers.get('Content-Length') || 0);
    if (length > MAX_JSON_BYTES) throw httpError(413, 'Request is too large.');
    const text = await request.text();
    if (text.length > MAX_JSON_BYTES) throw httpError(413, 'Request is too large.');
    try { return text ? JSON.parse(text) : {}; }
    catch { throw httpError(400, 'Invalid JSON.'); }
}

function parseTimeToMs(value) {
    if (typeof value !== 'string') return NaN;
    const parts = value.trim().split(':');
    if (parts.length !== 2 && parts.length !== 3) return NaN;
    const hasHours = parts.length === 3;
    const seconds = Number(parts.pop());
    const minutes = Number(parts.pop());
    const hours = hasHours ? Number(parts.pop()) : 0;
    if (![seconds, minutes, hours].every(Number.isFinite)) return NaN;
    if (hours < 0 || minutes < 0 || seconds < 0 || seconds >= 60) return NaN;
    if (hasHours && minutes >= 60) return NaN;
    return ((hours * 60 + minutes) * 60 + seconds) * 1000;
}

function requiredString(value, label, max) {
    const string = String(value ?? '').trim();
    if (!string) throw httpError(400, `${label} is required.`);
    if (string.length > max) throw httpError(400, `${label} is too long.`);
    return string;
}

function requiredHttpUrl(value, label) {
    const string = requiredString(value, label, 500);
    validateHttpUrl(string, label);
    return string;
}

function optionalHttpUrl(value, label) {
    const string = String(value ?? '').trim();
    if (!string) return '';
    if (string.length > 500) throw httpError(400, `${label} is too long.`);
    validateHttpUrl(string, label);
    return string;
}

function validateHttpUrl(value, label) {
    let url;
    try { url = new URL(value); } catch { throw httpError(400, `${label} must be a valid URL.`); }
    if (url.protocol !== 'https:' && url.protocol !== 'http:') throw httpError(400, `${label} must use http:// or https://.`);
}

function bearerToken(request) {
    const header = request.headers.get('Authorization') || '';
    const match = header.match(/^Bearer\s+(.+)$/i);
    return match ? match[1].trim() : null;
}

function callbackUrl(request) {
    const url = new URL(request.url);
    return `${url.origin}/api/auth/callback`;
}

function readCookie(request, name) {
    const cookie = request.headers.get('Cookie') || '';
    for (const part of cookie.split(';')) {
        const [key, ...rest] = part.trim().split('=');
        if (key === name) return decodeURIComponent(rest.join('='));
    }
    return null;
}

function oauthStateCookie(value, maxAge) {
    return `gdbfl_oauth_state=${encodeURIComponent(value)}; Path=/api/auth; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

function callbackRedirect(env, authResult = null, sessionToken = null) {
    const response = siteRedirect(env, authResult, sessionToken);
    response.headers.append('Set-Cookie', oauthStateCookie('', 0));
    return response;
}

function siteRedirect(env, authResult = null, sessionToken = null) {
    const base = String(env.SITE_URL || '').replace(/#.*$/, '').replace(/\/$/, '');
    if (!base.startsWith('https://')) throw new Error('SITE_URL must be an https:// URL.');
    let fragment = '#/admin';
    if (sessionToken) fragment += `?session=${encodeURIComponent(sessionToken)}`;
    else if (authResult) fragment += `?auth=${encodeURIComponent(authResult)}`;
    return redirect(`${base}/${fragment}`);
}

function redirect(location) {
    return new Response(null, {
        status: 302,
        headers: {
            Location: location,
            'Cache-Control': 'no-store',
            'Referrer-Policy': 'no-referrer',
            'X-Content-Type-Options': 'nosniff',
        },
    });
}

function preflight(request, env) {
    const headers = corsHeaders(request, env);
    return new Response(null, { status: 204, headers });
}

function json(request, env, payload, status = 200, options = {}) {
    const headers = corsHeaders(request, env);
    headers.set('Content-Type', 'application/json; charset=utf-8');
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('Referrer-Policy', 'no-referrer');
    headers.set('Cross-Origin-Resource-Policy', 'cross-origin');
    headers.set('Cache-Control', options.publicCache ? 'public, max-age=15' : 'no-store');
    return new Response(JSON.stringify(payload), { status, headers });
}

function corsHeaders(request, env) {
    const headers = new Headers({
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type',
        'Access-Control-Max-Age': '86400',
        Vary: 'Origin',
    });
    const origin = request.headers.get('Origin');
    const allowed = allowedOrigins(env);
    if (origin && allowed.has(origin)) headers.set('Access-Control-Allow-Origin', origin);
    return headers;
}

function allowedOrigins(env) {
    const set = new Set();
    try { set.add(new URL(env.SITE_URL).origin); } catch {}
    for (const origin of String(env.EXTRA_ALLOWED_ORIGINS || '').split(',')) {
        const trimmed = origin.trim();
        if (trimmed) set.add(trimmed);
    }
    return set;
}

function requireConfig(env) {
    requireBinding(env, 'DB');
    const required = ['SITE_URL', 'DISCORD_CLIENT_ID', 'DISCORD_CLIENT_SECRET', 'DISCORD_BOT_TOKEN', 'DISCORD_GUILD_ID'];
    for (const key of required) if (!env[key]) throw new Error(`Missing Worker setting: ${key}`);
}

function requireBinding(env, key) {
    if (!env[key]) throw new Error(`Missing Worker binding: ${key}`);
}

function csvSet(value) {
    return new Set(String(value || '').split(',').map((v) => v.trim()).filter(Boolean));
}

function unixNow() { return Math.floor(Date.now() / 1000); }

function randomToken(bytes) {
    const data = new Uint8Array(bytes);
    crypto.getRandomValues(data);
    let binary = '';
    for (const byte of data) binary += String.fromCharCode(byte);
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

async function sha256Hex(value) {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
    return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

class HttpError extends Error {
    constructor(status, message) {
        super(message);
        this.name = 'HttpError';
        this.status = status;
    }
}

function httpError(status, message) {
    return new HttpError(status, message);
}
