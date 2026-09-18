import { apiBaseUrl, isApiConfigured } from './config.js';

const SESSION_KEY = 'gdbfl-moderator-session';

function consumeAuthResult() {
    const hash = window.location.hash || '';
    const question = hash.indexOf('?');
    if (question === -1) return null;

    const route = hash.slice(0, question);
    const params = new URLSearchParams(hash.slice(question + 1));
    const token = params.get('session');
    const auth = params.get('auth');

    if (token) sessionStorage.setItem(SESSION_KEY, token);

    if (token || auth) {
        // OAuth tokens are returned in the URL fragment so they never reach GitHub's server.
        // Remove them from browser history immediately after consuming them.
        history.replaceState(null, '', `${location.pathname}${location.search}${route || '#/admin'}`);
    }

    return auth;
}

export async function getSession() {
    consumeAuthResult();
    return sessionStorage.getItem(SESSION_KEY);
}

export function getAuthResult() {
    return consumeAuthResult();
}

async function apiRequest(path, { method = 'GET', body = null, auth = false } = {}) {
    if (!isApiConfigured()) throw new Error('The moderator backend is not configured yet.');

    const headers = { Accept: 'application/json' };
    if (body !== null) headers['Content-Type'] = 'application/json';

    if (auth) {
        const token = sessionStorage.getItem(SESSION_KEY);
        if (!token) throw new Error('Your moderator session has ended. Sign in again.');
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${apiBaseUrl()}${path}`, {
        method,
        headers,
        body: body === null ? undefined : JSON.stringify(body),
        cache: 'no-store',
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
            sessionStorage.removeItem(SESSION_KEY);
        }
        throw new Error(payload.error || `Request failed (${response.status}).`);
    }
    return payload;
}

export async function fetchLiveList() {
    return await apiRequest('/api/list');
}

export async function moderatorAction(action, payload = {}) {
    return await apiRequest('/api/admin', {
        method: 'POST',
        body: { action, ...payload },
        auth: true,
    });
}

export async function signInWithDiscord() {
    if (!isApiConfigured()) throw new Error('The moderator backend is not configured yet.');
    window.location.assign(`${apiBaseUrl()}/api/auth/login`);
}

export async function signOut() {
    const token = sessionStorage.getItem(SESSION_KEY);
    try {
        if (token && isApiConfigured()) {
            await apiRequest('/api/auth/logout', { method: 'POST', auth: true });
        }
    } finally {
        sessionStorage.removeItem(SESSION_KEY);
    }
}
