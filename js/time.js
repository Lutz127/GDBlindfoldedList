export function timeToMs(time) {
    // "mm:ss.mmm"
    const [min, rest] = time.split(":");
    const [sec, ms] = rest.split(".");

    return (
        Number(min) * 60 * 1000 +
        Number(sec) * 1000 +
        Number(ms)
    );
}