import { round, score } from './score.js';
import { timeToMs } from './time.js';

/**
 * Path to directory containing `_list.json` and all levels
 */
const dir = '/GDBLindfoldedList/data'; // /GDBLindfoldedList/data

export async function fetchList() {
    const listResult = await fetch(`${dir}/_list.json`);
    try {
        const list = await listResult.json();
        return await Promise.all(
            list.map(async (path, rank) => {
                const levelResult = await fetch(`${dir}/${path}.json`);
                try {
                    const level = await levelResult.json();
                    return [
                        {
                            ...level,
                            path,
                            records: level.platformer
                                ? level.records.sort((a, b) =>
                                    timeToMs(a.time) - timeToMs(b.time)
                                )
                                : level.records.sort((a, b) =>
                                    b.percent - a.percent
                                ),
                        },
                        null,
                    ];
                } catch {
                    console.error(`Failed to load level #${rank} ${path}.`);
                    return [null, path];
                }
            }),
        );
    } catch {
        console.error(`Failed to load list.`);
        return null;
    }
}

export async function fetchEditors() {
    try {
        const editorsResults = await fetch(`${dir}/_editors.json`);
        const editors = await editorsResults.json();
        return editors;
    } catch {
        return null;
    }
}

export async function fetchLeaderboard() {
    const list = await fetchList();

    const classic = [];
    const platformer = [];

    list.forEach(([level, err]) => {
        if (!level || err) return;
        if (level.platformer === true) {
            platformer.push(level);
        } else {
            classic.push(level);
        }
    });

    const classicRank = new Map(
        classic.map((lvl, i) => [lvl.name, i + 1])
    );
    const platformerRank = new Map(
        platformer.map((lvl, i) => [lvl.name, i + 1])
    );

    const scoreMap = {};
    const errs = [];
    list.forEach(([level, err]) => {
        const isPlatformer = level.platformer === true;
        const rank = isPlatformer
            ? platformerRank.get(level.name)
            : classicRank.get(level.name);
        if (err) {
            errs.push(err);
            return;
        }

        // Verification
        const verifier = Object.keys(scoreMap).find(
            (u) => u.toLowerCase() === level.verifier.toLowerCase(),
        ) || level.verifier;
        scoreMap[verifier] ??= {
            verified: [],
            completed: [],
            progressed: [],
        };
        const { verified } = scoreMap[verifier];
        verified.push({
            rank: rank,
            level: level.name,
            levelId: level.id,
            score: 0,
            link: level.verification,
            isPlatformer,
        });

        // Records
        level.records.forEach((record) => {
            const user =
                Object.keys(scoreMap).find(
                    (u) => u.toLowerCase() === record.user.toLowerCase(),
                ) || record.user;

            scoreMap[user] ??= {
                verified: [],
                completed: [],
                progressed: [],
            };

            // ---- PLATFORMER ----
            if (isPlatformer) {
                scoreMap[user].completed.push({
                    rank: rank,
                    level: level.name,
                    levelId: level.id,
                    time: record.time,
                    timeMs: timeToMs(record.time),
                    score: score(rank, 100, 100),
                    link: record.link,
                    isPlatformer,
                });
                return;
            }

            // ---- CLASSIC ----
            if (record.percent === 100) {
                scoreMap[user].completed.push({
                    rank: rank,
                    level: level.name,
                    levelId: level.id,
                    score: score(rank, 100, level.percentToQualify),
                    link: record.link,
                    isPlatformer,
                });
                return;
            }

            scoreMap[user].progressed.push({
                rank: rank,
                level: level.name,
                levelId: level.id,
                percent: record.percent,
                score: score(rank, record.percent, level.percentToQualify),
                link: record.link,
                isPlatformer,
            });
        });
    });

    const res = Object.entries(scoreMap).map(([user, scores]) => {
        const { verified, completed, progressed } = scores;
        const total = [verified, completed, progressed]
            .flat()
            .reduce((prev, cur) => prev + cur.score, 0);

        return {
            user,
            total: round(total),
            ...scores,
        };
    });

    return [res.sort((a, b) => b.total - a.total), errs];
}
