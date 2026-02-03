import { fetchLeaderboard } from '../content.js';
import { localize } from '../util.js';
import { round } from '../score.js';

import Spinner from '../components/Spinner.js';

export default {
    components: {
        Spinner,
    },
    data: () => ({
        leaderboard: [],
        loading: true,
        selected: 0,
        err: [],
    }),
    template: `
        <main v-if="loading">
            <Spinner></Spinner>
        </main>
        <main v-else class="page-leaderboard-container">
            <div class="level-background" :style="backgroundStyle"></div>
            <div class="leaderboard-tabs">
                <div class="list-tabs">
                    <button class="list-tab" :class="{ selected: tab === 'all' }" @click="switchTab('all')">All</button>
                    <button class="list-tab" :class="{ selected: tab === 'classic' }" @click="switchTab('classic')">Classic</button>
                    <button class="list-tab" :class="{ selected: tab === 'platformer' }" @click="switchTab('platformer')">Platformer</button>
                </div>
            </div>
            <div class="page-leaderboard">
                <div class="error-container">
                    <p class="error" v-if="err.length > 0">
                        Leaderboard may be incorrect, as the following levels could not be loaded: {{ err.join(', ') }}
                    </p>
                </div>
                <div class="board-container">
                    <table class="board">
                        <tr v-for="(ientry, i) in filteredLeaderboard">
                            <td class="rank">
                                <p class="type-label-lg">#{{ i + 1 }}</p>
                            </td>
                            <td class="total">
                                <p class="type-label-lg">{{ Math.round(ientry.total) }}</p>
                            </td>
                            <td class="user" :class="{ 'active': selected == i }">
                                <button @click="selected = i">
                                    <span class="type-label-lg">{{ ientry.user }}</span>
                                </button>
                            </td>
                        </tr>
                    </table>
                </div>
                <div class="player-container">
                    <div class="player">
                        <h1>#{{ selected + 1 }} {{ entry.user }}</h1>
                        <h3><h3>{{ Math.round(entry.total) }}</h3></h3>
                        <h2 v-if="entry.verified.length > 0">Verified ({{ entry.verified.length}})</h2>
                        <!-- ALL TAB -->
                        <template v-if="isAllTab">

                            <h3 v-if="verifiedClassic.length">
                                Classic ({{ verifiedClassic.length }})
                            </h3>
                            <table class="table" v-if="verifiedClassic.length">
                                <tr v-for="score in verifiedClassic">
                                    <td class="rank"><p>#{{ score.rank }}</p></td>
                                    <td class="level">
                                        <a class="type-label-lg" :href="score.link" target="_blank">
                                            {{ score.level }}
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <h3 v-if="verifiedPlatformer.length">
                                Platformer ({{ verifiedPlatformer.length }})
                            </h3>
                            <table class="table" v-if="verifiedPlatformer.length">
                                <tr v-for="score in verifiedPlatformer">
                                    <td class="rank"><p>#{{ score.rank }}</p></td>
                                    <td class="level">
                                        <a class="type-label-lg" :href="score.link" target="_blank">
                                            {{ score.level }}
                                        </a>
                                    </td>
                                </tr>
                            </table>

                        </template>

                        <!-- CLASSIC / PLATFORMER TAB -->
                        <table class="table" v-else>
                            <tr v-for="score in entry.verified">
                                <td class="rank"><p>#{{ score.rank }}</p></td>
                                <td class="level">
                                    <a class="type-label-lg" :href="score.link" target="_blank">
                                        {{ score.level }}
                                    </a>
                                </td>
                            </tr>
                        </table>
                        <h2 v-if="entry.completed.length">
                            Completed ({{ entry.completed.length }})
                        </h2>

                        <!-- ALL TAB -->
                        <template v-if="isAllTab">

                            <h3 v-if="completedClassic.length">
                                Classic ({{ completedClassic.length }})
                            </h3>
                            <table class="table" v-if="completedClassic.length">
                                <tr v-for="score in completedClassic">
                                    <td class="rank"><p>#{{ score.rank }}</p></td>
                                    <td class="level">
                                        <a class="type-label-lg" :href="score.link" target="_blank">
                                            {{ score.level }}
                                        </a>
                                    </td>
                                    <td class="score">
                                        <p>+{{ localize(score.score) }}</p>
                                    </td>
                                </tr>
                            </table>

                            <h3 v-if="completedPlatformer.length">
                                Platformer ({{ completedPlatformer.length }})
                            </h3>
                            <table class="table" v-if="completedPlatformer.length">
                                <tr v-for="score in completedPlatformer">
                                    <td class="rank"><p>#{{ score.rank }}</p></td>
                                    <td class="level">
                                        <a class="type-label-lg" :href="score.link" target="_blank">
                                            {{ score.level }}
                                        </a>
                                    </td>
                                    <td class="time"><p>{{ score.time }}</p></td>
                                    <td class="score">
                                        <p>+{{ localize(score.score) }}</p>
                                    </td>
                                </tr>
                            </table>

                        </template>

                        <!-- CLASSIC / PLATFORMER TAB -->
                        <table class="table" v-else>
                            <tr v-for="score in entry.completed">
                                <td class="rank"><p>#{{ score.rank }}</p></td>
                                <td class="level">
                                    <a class="type-label-lg" :href="score.link" target="_blank">
                                        {{ score.level }}
                                    </a>
                                </td>
                                <td class="time"><p v-if="score.time">{{ score.time }}</p></td>
                                <td class="score">
                                    <p>+{{ localize(score.score) }}</p>
                                </td>
                            </tr>
                        </table>
                        <h2 v-if="!isPlatformerEntry && entry.progressed.length > 0">
                            Progressed ({{ entry.progressed.length }})
                        </h2>
                        <table v-if="!isPlatformerEntry" class="table">
                            <tr v-for="score in entry.progressed">
                                <td class="rank">
                                    <p>#{{ score.rank }}</p>
                                </td>
                                <td class="level">
                                    <a class="type-label-lg" target="_blank" :href="score.link">{{ score.percent != null ? score.percent + '%' : '' }} {{ score.level }}</a>
                                </td>
                                <td class="score">
                                    <p>+{{ localize(score.score) }}</p>
                                </td>
                            </tr>
                        </table>
                    </div>
                </div>
            </div>
        </main>
    `,
    data: () => ({
        leaderboard: [],
        loading: true,
        selected: 0,
        err: [],
        tab: "all",
    }),
    computed: {
        entry() {
            return this.filteredLeaderboard[this.selected];
        },

        filteredLeaderboard() {
            if (this.tab === "all") return this.leaderboard;

            return this.leaderboard
                .map(player => {
                    const filterFn =
                        this.tab === "platformer"
                            ? s => s.isPlatformer
                            : s => !s.isPlatformer;

                    return {
                        ...player,
                        verified: player.verified.filter(filterFn),
                        completed: player.completed.filter(filterFn),
                        progressed: player.progressed.filter(filterFn),
                        total: round(
                            [...player.verified, ...player.completed, ...player.progressed]
                                .filter(filterFn)
                                .reduce((a, b) => a + b.score, 0)
                        ),
                    };
                })
                .filter(p => p.total > 0)
                .sort((a, b) => b.total - a.total);
        },

        isPlatformerEntry() {
            return this.entry?.completed?.some(s => s.isPlatformer);
        },

        verifiedClassic() {
            return this.entry?.verified.filter(v => !v.isPlatformer) ?? [];
        },
        verifiedPlatformer() {
            return this.entry?.verified.filter(v => v.isPlatformer) ?? [];
        },

        completedClassic() {
            return this.entry?.completed.filter(v => !v.isPlatformer) ?? [];
        },
        completedPlatformer() {
            return this.entry?.completed.filter(v => v.isPlatformer) ?? [];
        },

        isAllTab() {
            return this.tab === "all";
        },

        backgroundLevel() {
            if (!this.entry) return null;

            const completed = this.entry.completed;
            if (!completed.length) return null;

            const classic = completed.filter(s => !s.isPlatformer);
            const platformer = completed.filter(s => s.isPlatformer);

            if (this.tab === "classic") {
                if (!classic.length) return null;
                return classic.reduce((best, cur) =>
                    cur.rank < best.rank ? cur : best
                );
            }

            if (this.tab === "platformer") {
                if (!platformer.length) return null;
                return platformer.reduce((best, cur) =>
                    cur.rank < best.rank ? cur : best
                );
            }

            // === ALL TAB LOGIC ===

            // top 1 platformer
            const topPlatformer = platformer.find(s => s.rank === 1);
            if (topPlatformer) return topPlatformer;

            // 2Find hardest of each category
            const bestPlatformer =
                platformer.length
                    ? platformer.reduce((best, cur) =>
                        cur.rank < best.rank ? cur : best
                    )
                    : null;

            const bestClassic =
                classic.length
                    ? classic.reduce((best, cur) =>
                        cur.rank < best.rank ? cur : best
                    )
                    : null;

            // 3Pick the harder one
            if (bestPlatformer && bestClassic) {
                return bestPlatformer.rank < bestClassic.rank
                    ? bestPlatformer
                    : bestClassic;
            }

            return bestPlatformer ?? bestClassic ?? null;
        },

        backgroundStyle() {
            if (!this.backgroundLevel) return {};

            return {
                backgroundImage: `url(https://levelthumbs.prevter.me/thumbnail/${this.backgroundLevel.levelId ?? this.backgroundLevel.rank})`
            };
        },
    },
    async mounted() {
        const [leaderboard, err] = await fetchLeaderboard();
        this.leaderboard = leaderboard;
        this.err = err;
        // Hide loading spinner
        this.loading = false;
    },
    methods: {
        localize,

        sortMixed(arr) {
            if (this.tab !== "all") return arr;
            return [
                ...arr.filter(x => x.isPlatformer),
                ...arr.filter(x => !x.isPlatformer),
            ];
        },

        switchTab(tab) {
            if (this.tab !== tab) {
                this.tab = tab;
                this.selected = 0;
            }
        },
    },
};
