// This file is public because it is served by GitHub Pages.
// Put ONLY your public Cloudflare Worker URL here. Never put secrets/tokens here.
export const APP_CONFIG = Object.freeze({
    apiBaseUrl: "https://gd-blindfolded-list-api.lutzdg2.workers.dev",
});

export function isApiConfigured() {
    const value = APP_CONFIG.apiBaseUrl.trim();
    return /^https:\/\//i.test(value) && !value.includes("YOUR-WORKER");
}

export function apiBaseUrl() {
    return APP_CONFIG.apiBaseUrl.replace(/\/$/, "");
}
