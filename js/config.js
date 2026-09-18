// This file is public because it is served by GitHub Pages.
// Put ONLY public URLs/IDs here. Never put secrets or tokens here.
export const APP_CONFIG = Object.freeze({
    apiBaseUrl: "https://gd-blindfolded-list-api.lutzdg2.workers.dev",
    submissionFormUrl: "https://docs.google.com/forms/d/e/1FAIpQLSfnNxf_lojS9jpukp2zkupfevpLW9l89ohINNniyEq276sezg/viewform?usp=publish-editor",
    submissionReviewUrl: "https://docs.google.com/forms/d/1hNwcJ-G73V25jVZ2l9218ZSZZIidGq54SBHgZ9HRLzo/edit#responses",
});

export function isApiConfigured() {
    const value = APP_CONFIG.apiBaseUrl.trim();
    return /^https:\/\//i.test(value) && !value.includes("YOUR-WORKER");
}

export function apiBaseUrl() {
    return APP_CONFIG.apiBaseUrl.replace(/\/$/, "");
}
