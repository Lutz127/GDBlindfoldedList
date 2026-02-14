import { store } from "../main.js";
import { embed } from "../util.js";
import { score } from "../score.js";
import { fetchEditors, fetchList } from "../content.js";

import Spinner from "../components/Spinner.js";
import LevelAuthors from "../components/List/LevelAuthors.js";

const roleIconMap = {
    owner: "crown",
    admin: "user-gear",
    helper: "user-shield",
    dev: "code",
    trial: "user-lock",
};

export default {
    components: { Spinner, LevelAuthors },
    template: `
        <main v-if="loading">
            <Spinner></Spinner>
        </main>
        <main v-else class="page-list">
            <div
                class="level-background"
                :style="backgroundStyle"
            ></div>
            <div class="list-container">
                <div class="list-tabs">
                    <button
                    class="list-tab"
                    :class="{ selected: tab === 'classic' }"
                    @click="switchTab('classic')"
                    >
                    Classic
                    </button>

                    <button
                    class="list-tab"
                    :class="{ selected: tab === 'platformer' }"
                    @click="switchTab('platformer')"
                    >
                    Platformer
                    </button>
                </div>
                <div class="list-scroll hide-scrollbar">
                    <table class="list" v-if="filteredList.length">
                        <tr v-for="({ entry: [level, err] }, i) in filteredList">
                            <td class="rank">
                                <p v-if="i + 1 <= 150" class="type-label-lg">#{{ i + 1 }}</p>
                                <p v-else class="type-label-lg">Legacy</p>
                            </td>
                            <td class="level" :class="{ 'active': selectedIndex === i, 'error': !level }">
                                <button @click="selectedIndex = i">
                                    <span class="type-label-lg">{{ level?.name || \`Error (\${err}.json)\` }}</span>
                                </button>
                            </td>
                        </tr>
                    </table>
                </div>
            </div>
            <div class="level-container">
                <div class="level" v-if="level">
                    <h1>{{ level.name }}</h1>
                    <LevelAuthors :author="level.author" :creators="level.creators" :verifier="level.verifier"></LevelAuthors>
                    <iframe class="video" id="videoframe" :src="video" frameborder="0"></iframe>
                    <ul class="stats">
                        <li>
                            <div class="type-title-sm">Points when completed</div>
                            <p>
                            {{
                                score(
                                selectedIndex + 1,
                                100,
                                isPlatformer ? 100 : level.percentToQualify
                                )
                            }}
                            </p>
                        </li>
                        <li>
                            <div class="type-title-sm">ID</div>
                            <p>{{ level.id }}</p>
                        </li>
                        <li>
                            <div class="type-title-sm">Difficulty</div>
                            <p>{{ level.password || 'Free to Copy' }}</p>
                        </li>
                    </ul>
                    <h2>Records</h2>
                    <table class="records">
                        <tr v-for="record in level.records" class="record">
                            <td class="percent">
                                <p v-if="!isPlatformer">{{ record.percent }}%</p>
                                <p v-else>{{ record.time }}</p>
                            </td>
                            <td class="user">
                                <a :href="record.link" target="_blank" class="type-label-lg">{{ record.user }}</a>
                            </td>
                            <td class="mobile">
                                <img v-if="record.mobile" :src="\`./assets/phone-landscape\${store.dark ? '-dark' : ''}.svg\`" alt="Mobile">
                            </td>
                        </tr>
                    </table>
                </div>
                <div v-else class="level" style="height: 100%; justify-content: center; align-items: center;">
                    <p>(ノಠ益ಠ)ノ彡┻━┻</p>
                </div>
            </div>
            <div class="meta-container">
                <div class="meta-scroll hide-scrollbar">
                    <div class="meta">
                        <div class="errors" v-show="errors.length > 0">
                            <p class="error" v-for="error of errors">{{ error }}</p>
                        </div>
                        <p class="type-label-sm" style="color: #fffaad;">(Discord server is finished, feel free to join!)</p>
                        <template v-if="editors">
                            <h3>List Editors</h3>
                            <ol class="editors">
                                <li v-for="editor in editors">
                                    <img :src="\`./assets/\${roleIconMap[editor.role]}\${store.dark ? '-dark' : ''}.svg\`" :alt="editor.role">
                                    <a v-if="editor.link" class="type-label-lg link" target="_blank" :href="editor.link">{{ editor.name }}</a>
                                    <p v-else>{{ editor.name }}</p>
                                </li>
                            </ol>
                        </template>
                        <h3>Submission Requirements</h3>
                        <p>
                            Runs are included based on plausibility of claim, alignment of practice with the recorded run, and extent of proof. (Notably, Blind Dasher's runs are not included in this list.)
                        </p>
                        <p>
                            Effective 20 Nov 2025, entries must shine a flashlight through the blindfold at the camera to verify its opacity AND have either a handcam or audible keypresses. We may also request the full recording of attempts leading up to the successful run.
                        </p>
                        <p>
                            The difficulty baseline for the list is ReTraY, so any levels easier than it will not be placed. Using audio cues or custom music is also not allowed.
                        </p>
                        <h3>
                            Blindfolded Leaderboards Spreadsheet
                        </h3>
                        <p>
                            <a href="https://docs.google.com/spreadsheets/d/1kGK6w2plz3wknw7Uz6ifaE3hjZa0NaRnGEiia8tulDU/edit?usp=sharing/" target="_blank" style="color: #b486ff;; text-decoration: underline;">Click here to view the spreadsheet.</a> 
                        </p>
                    </div> 
                </div> 
            </div>
        </main>
    `,
    data: () => ({
        list: [],
        editors: [],
        loading: true,
        selectedIndex: 0,
        errors: [],
        roleIconMap,
        store,
        tab: "classic",
    }),
    computed: {
        level() {
            const item = this.filteredList[this.selectedIndex];
            return item ? item.entry[0] : null;
        },
        isPlatformer() {
            return this.level?.platformer === true;
        },
        video() {
            if (!this.level.showcase) {
                return embed(this.level.verification);
            }

            return embed(
                this.toggledShowcase
                    ? this.level.showcase
                    : this.level.verification
            );
        },
        backgroundStyle() {
            if (!this.level) return {};

            return {
                backgroundImage: `url(https://levelthumbs.prevter.me/thumbnail/${this.level.id})`,
            };
        },
        filteredList() {
            if (!this.list) return [];

            return this.list
                .map((entry, originalIndex) => ({
                    entry,
                    originalIndex,
                }))
                .filter(({ entry }) => {
                    const level = entry[0];
                    if (!level) return false;

                    return this.tab === "platformer"
                        ? level.platformer === true
                        : level.platformer !== true;
                });
        },
    },
    async mounted() {
        // Hide loading spinner
        this.list = await fetchList();
        this.editors = await fetchEditors();

        // Error handling
        if (!this.list) {
            this.errors = [
                "Failed to load list. Retry in a few minutes or notify list staff.",
            ];
        } else {
            this.errors.push(
                ...this.list
                    .filter(([_, err]) => err)
                    .map(([_, err]) => {
                        return `Failed to load level. (${err}.json)`;
                    })
            );
            if (!this.editors) {
                this.errors.push("Failed to load list editors.");
            }
        }
        this.selectTopOfTab();
        this.loading = false;
    },
    methods: {
        embed,
        score,

        switchTab(newTab) {
            if (this.tab !== newTab) {
            this.tab = newTab;
            this.selectTopOfTab();
            }
        },

        selectTopOfTab() {
            this.selectedIndex = 0;
        },
    },
};
