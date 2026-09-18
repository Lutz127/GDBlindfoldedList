/**
 * Convert platformer time strings to milliseconds.
 * Supports M:SS.mmm and H:MM:SS.mmm (and longer hour values).
 * @param {String} time
 * @returns {Number}
 */
export function timeToMs(time) {
    if (typeof time !== "string") return Number.POSITIVE_INFINITY;

    const trimmed = time.trim();
    const parts = trimmed.split(":");
    if (parts.length < 2 || parts.length > 3) return Number.POSITIVE_INFINITY;

    const last = parts.pop();
    const [secondsPart, fractionPart = "0"] = last.split(".");
    const seconds = Number(secondsPart);
    const minutes = Number(parts.pop());
    const hours = parts.length ? Number(parts.pop()) : 0;

    if (![hours, minutes, seconds].every(Number.isFinite)) {
        return Number.POSITIVE_INFINITY;
    }

    const milliseconds = Number((fractionPart + "000").slice(0, 3));
    if (!Number.isFinite(milliseconds)) return Number.POSITIVE_INFINITY;

    return (
        hours * 60 * 60 * 1000 +
        minutes * 60 * 1000 +
        seconds * 1000 +
        milliseconds
    );
}
