import { round, score } from './score.js';
import { timeToMs } from './time.js';
import { isApiConfigured } from './config.js';
import { fetchLiveList } from './api.js';

/**
 * Bundled JSON remains as a read-only emergency fallback and makes a fresh clone
 * usable before the Cloudflare backend is configured. Normal operation uses D1.
 */
let dir;

if (window.location.hostname.endsWith('pages.dev')) {
    dir = '/data';
} else if (window.location.hostname.endsWith('github.io')) {
    dir = '/GDBlindfoldedList/data';
} else {
    dir = './data';
}

function normalizeRecords(level) {
    const records = Array.isArray(level.records) ? [...level.records] : [];
    records.sort(
        level.platformer
            ? (a, b) => timeToMs(a.time) - timeToMs(b.time)
            : (a, b) => (b.percent ?? 0) - (a.percent ?? 0),
    );
    return { ...level, records };
}

async function fetchListFromApi() {
    const payload = await fetchLiveList();
    if (!Array.isArray(payload.levels)) throw new Error('Backend returned an invalid level list.');
    return payload.levels.map((level) => [normalizeRecords(level), null]);
}

async function fetchListFromStaticJson() {
    const listResult = await fetch(`${dir}/_list.json`, { cache: 'no-store' });
    try {
        const list = await listResult.json();
        return await Promise.all(
            list.map(async (path, rank) => {
                const levelResult = await fetch(`${dir}/${path}.json`, { cache: 'no-store' });
                try {
                    const level = await levelResult.json();
                    return [normalizeRecords({ ...level, path, rank: rank + 1 }), null];
                } catch {
                    console.error(`Failed to load level #${rank + 1} ${path}.`);
                    return [null, path];
                }
            }),
        );
    } catch {
        console.error('Failed to load bundled list.');
        return null;
    }
}

export async function fetchList() {
    if (isApiConfigured()) {
        try {
            return await fetchListFromApi();
        } catch (error) {
            console.error('Live backend unavailable; using bundled JSON backup.', error);
        }
    }
    return await fetchListFromStaticJson();
}

export async function fetchEditors() {
    try {
        const editorsResults = await fetch(`${dir}/_editors.json`, { cache: 'no-store' });
        return await editorsResults.json();
    } catch {
        return null;
    }
}

export async function fetchLeaderboard() {
    const list = await fetchList();
    if (!list) return [[], ['Failed to load list.']];

    const classic = [];
    const platformer = [];

    list.forEach(([level, err]) => {
        if (!level || err) return;
        if (level.platformer === true) platformer.push(level);
        else classic.push(level);
    });

    const classicRank = new Map(classic.map((lvl, i) => [lvl.name, i + 1]));
    const platformerRank = new Map(platformer.map((lvl, i) => [lvl.name, i + 1]));

    const scoreMap = {};
    const errs = [];
    list.forEach(([level, err]) => {
        if (err || !level) {
            if (err) errs.push(err);
            return;
        }

        const isPlatformer = level.platformer === true;
        const rank = isPlatformer ? platformerRank.get(level.name) : classicRank.get(level.name);

        const verifier = Object.keys(scoreMap).find(
            (u) => u.toLowerCase() === level.verifier.toLowerCase(),
        ) || level.verifier;
        scoreMap[verifier] ??= { verified: [], completed: [], progressed: [] };
        scoreMap[verifier].verified.push({
            rank, level: level.name, levelId: level.id, score: 0,
            link: level.verification, isPlatformer,
        });

        level.records.forEach((record) => {
            const user = Object.keys(scoreMap).find(
                (u) => u.toLowerCase() === record.user.toLowerCase(),
            ) || record.user;
            scoreMap[user] ??= { verified: [], completed: [], progressed: [] };

            if (isPlatformer) {
                scoreMap[user].completed.push({
                    rank, level: level.name, levelId: level.id, time: record.time,
                    timeMs: timeToMs(record.time), score: score(rank, 100, 100),
                    link: record.link, isPlatformer,
                });
                return;
            }

            if (record.percent === 100) {
                scoreMap[user].completed.push({
                    rank, level: level.name, levelId: level.id,
                    score: score(rank, 100, level.percentToQualify),
                    link: record.link, isPlatformer,
                });
                return;
            }

            scoreMap[user].progressed.push({
                rank, level: level.name, levelId: level.id, percent: record.percent,
                score: score(rank, record.percent, level.percentToQualify),
                link: record.link, isPlatformer,
            });
        });
    });

    const res = Object.entries(scoreMap).map(([user, scores]) => {
        const { verified, completed, progressed } = scores;
        const total = [verified, completed, progressed]
            .flat()
            .reduce((prev, cur) => prev + cur.score, 0);
        return { user, total: round(total), ...scores };
    });

    return [res.sort((a, b) => b.total - a.total), errs];
}
