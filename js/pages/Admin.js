import { store } from "../main.js";
import { APP_CONFIG, isApiConfigured } from "../config.js";
import {
    fetchLiveList,
    getAuthResult,
    getSession,
    moderatorAction,
    signInWithDiscord,
    signOut,
} from "../api.js";

const blankLevel = (platformer = false) => ({
    databaseId: null,
    id: "",
    name: platformer ? "🌙 " : "⭐ ",
    author: "",
    creators: [],
    verifier: "",
    verification: "",
    percentToQualify: platformer ? 100 : 10,
    platformer,
    difficulty: "",
    rank: null,
    records: [],
});

const blankRecord = () => ({
    recordId: null,
    user: "",
    link: "",
    percent: 100,
    time: "0:00.000",
    mobile: false,
});

function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

export default {
    template: `
        <main class="page-admin">
            <section v-if="state === 'loading'" class="admin-center">
                <h1>Moderator panel</h1>
                <p>Checking your Discord session…</p>
            </section>

            <section v-else-if="state === 'setup'" class="admin-center admin-card">
                <h1>Moderator panel is not configured yet</h1>
                <p>
                    The website code is ready, but <code>js/config.js</code> still has the placeholder
                    Cloudflare Worker URL. Follow <code>SETUP.md</code> once, then this page becomes live.
                </p>
            </section>

            <section v-else-if="state === 'signed-out'" class="admin-center admin-card">
                <h1>Moderator panel</h1>
                <p class="admin-auth-copy">
                    Sign in with Discord. Access is granted only if your account currently has one of the configured moderator roles in the Blindfolded List server.
                </p>
                <span class="admin-status error" v-if="message">{{ message }}</span>
                <button class="admin-primary admin-login-button" @click="login" :disabled="busy">Sign in with Discord</button>
            </section>

            <section v-else-if="state === 'unauthorized'" class="admin-center admin-card">
                <h1>No moderator access</h1>
                <p>You successfully signed in as <strong>{{ identityLabel }}</strong>, but this Discord account does not currently have an allowed moderator role.</p>
                <div class="admin-actions-row">
                    <button class="admin-secondary" @click="refreshAccess" :disabled="busy">Check again</button>
                    <button class="admin-danger-outline" @click="logout" :disabled="busy">Sign out</button>
                </div>
            </section>

            <section v-else class="admin-shell">
                <aside class="admin-sidebar">
                    <div class="admin-sidebar-header">
                        <div class="admin-sidebar-title-row">
                            <div>
                                <h1>Moderator panel</h1>
                                <p class="admin-identity">Signed in as <strong>{{ identityLabel }}</strong></p>
                            </div>
                            <button class="admin-secondary admin-small" @click="logout" :disabled="busy">Sign out</button>
                        </div>

                        <div class="admin-tools">
                            <a class="admin-link-button admin-small" :href="submissionReviewUrl" target="_blank" rel="noopener">Review submissions ↗</a>
                            <a class="admin-link-button admin-small" :href="submissionFormUrl" target="_blank" rel="noopener">Open public form ↗</a>
                        </div>
                    </div>

                    <div class="admin-tabs">
                        <button :class="{ active: tab === 'classic' }" @click="switchTab('classic')">Classic</button>
                        <button :class="{ active: tab === 'platformer' }" @click="switchTab('platformer')">Platformer</button>
                    </div>

                    <button class="admin-primary admin-new" @click="newLevel">+ Add level</button>

                    <div class="admin-level-list hide-scrollbar">
                        <div
                            v-for="(level, index) in levelsForTab"
                            :key="level.databaseId"
                            class="admin-level-row"
                            :class="{ selected: selectedLevelId === level.databaseId }"
                        >
                            <button class="admin-level-select" @click="selectLevel(level)">
                                <span class="admin-rank">#{{ index + 1 }}</span>
                                <span>{{ level.name }}</span>
                            </button>
                            <div class="admin-order-buttons">
                                <button title="Move up" aria-label="Move level up" @click="moveLevel(index, -1)" :disabled="busy || index === 0">▲</button>
                                <button title="Move down" aria-label="Move level down" @click="moveLevel(index, 1)" :disabled="busy || index === levelsForTab.length - 1">▼</button>
                            </div>
                        </div>
                    </div>
                </aside>

                <section class="admin-editor hide-scrollbar" v-if="draftLevel">
                    <div class="admin-editor-inner">
                        <div class="admin-editor-heading">
                            <div>
                                <h2>{{ draftLevel.databaseId ? 'Edit level' : 'Add level' }}</h2>
                                <p class="admin-editor-subtitle" v-if="draftLevel.databaseId">Rank #{{ draftLevel.rank }} · changes go live immediately after saving.</p>
                            </div>
                            <span class="admin-status" v-if="message" :class="{ error: messageIsError }">{{ message }}</span>
                        </div>

                        <form class="admin-form" @submit.prevent="saveLevel">
                            <label>
                                <span>Geometry Dash level ID</span>
                                <input v-model.trim="draftLevel.id" type="number" min="1" step="1" required />
                            </label>

                            <label>
                                <span>Display name</span>
                                <input v-model.trim="draftLevel.name" maxlength="120" required />
                            </label>

                            <label>
                                <span>Publisher / author</span>
                                <input v-model.trim="draftLevel.author" maxlength="120" required />
                            </label>

                            <label>
                                <span>Creators <small>(comma separated)</small></span>
                                <input v-model="creatorsText" maxlength="600" placeholder="RobTop, AnotherCreator" required />
                            </label>

                            <label>
                                <span>Verifier</span>
                                <input v-model.trim="draftLevel.verifier" maxlength="120" required />
                            </label>

                            <label class="admin-wide">
                                <span>Verification video URL</span>
                                <input v-model.trim="draftLevel.verification" type="url" maxlength="500" placeholder="https://youtube.com/watch?v=..." required />
                            </label>

                            <label>
                                <span>Difficulty</span>
                                <input v-model.trim="draftLevel.difficulty" list="difficulty-options" maxlength="50" required />
                                <datalist id="difficulty-options">
                                    <option value="Auto"></option>
                                    <option value="Easy"></option>
                                    <option value="Normal"></option>
                                    <option value="Hard"></option>
                                    <option value="Harder"></option>
                                    <option value="Insane"></option>
                                    <option value="Easy Demon"></option>
                                    <option value="Medium Demon"></option>
                                    <option value="Hard Demon"></option>
                                    <option value="Insane Demon"></option>
                                    <option value="Extreme Demon"></option>
                                </datalist>
                            </label>

                            <label>
                                <span>Type</span>
                                <select v-model="draftLevel.platformer" :disabled="draftLevel.records.length > 0">
                                    <option :value="false">Classic</option>
                                    <option :value="true">Platformer</option>
                                </select>
                                <small v-if="draftLevel.records.length > 0">Delete this level's records first to change type.</small>
                            </label>

                            <label v-if="!draftLevel.platformer">
                                <span>Minimum % to qualify</span>
                                <input v-model.number="draftLevel.percentToQualify" type="number" min="1" max="100" required />
                            </label>

                            <div class="admin-form-actions admin-wide">
                                <button type="submit" class="admin-primary" :disabled="busy">{{ busy ? 'Saving…' : 'Save level' }}</button>
                                <button v-if="draftLevel.databaseId" type="button" class="admin-danger" @click="deleteLevel" :disabled="busy">Delete level</button>
                            </div>
                        </form>

                        <div class="admin-records" v-if="draftLevel.databaseId">
                            <div class="admin-section-heading">
                                <div>
                                    <h2>Records</h2>
                                    <p class="admin-muted">{{ draftLevel.platformer ? 'Platformer records sort by fastest time.' : 'Classic records sort by highest percentage.' }}</p>
                                </div>
                                <button class="admin-primary admin-small" @click="startRecord">+ Add record</button>
                            </div>

                            <div class="admin-record-table" v-if="draftLevel.records.length">
                                <div class="admin-record-row admin-record-head">
                                    <span>Player</span>
                                    <span>{{ draftLevel.platformer ? 'Time' : 'Progress' }}</span>
                                    <span>Video</span>
                                    <span></span>
                                </div>
                                <div class="admin-record-row" v-for="record in draftLevel.records" :key="record.recordId">
                                    <span>{{ record.user }}</span>
                                    <span>{{ draftLevel.platformer ? record.time : record.percent + '%' }}</span>
                                    <span><a v-if="record.link" :href="record.link" target="_blank" rel="noopener">Open</a><span v-else>—</span></span>
                                    <span class="admin-record-actions">
                                        <button class="admin-secondary admin-small" @click="editRecord(record)">Edit</button>
                                        <button class="admin-danger-outline admin-small" @click="deleteRecord(record)">Delete</button>
                                    </span>
                                </div>
                            </div>
                            <p v-else class="admin-empty">No records yet.</p>

                            <form v-if="draftRecord" class="admin-record-editor" @submit.prevent="saveRecord">
                                <h3>{{ draftRecord.recordId ? 'Edit record' : 'Add record' }}</h3>
                                <label>
                                    <span>Player</span>
                                    <input v-model.trim="draftRecord.user" maxlength="120" required />
                                </label>
                                <label v-if="!draftLevel.platformer">
                                    <span>Percent</span>
                                    <input v-model.number="draftRecord.percent" type="number" min="1" max="100" required />
                                </label>
                                <label v-else>
                                    <span>Time</span>
                                    <input v-model.trim="draftRecord.time" placeholder="2:36:48.871 or 9:36.637" maxlength="30" required />
                                </label>
                                <label class="admin-wide">
                                    <span>Video / proof URL <small>(optional)</small></span>
                                    <input v-model.trim="draftRecord.link" type="url" maxlength="500" placeholder="https://..." />
                                </label>
                                <label class="admin-check">
                                    <input v-model="draftRecord.mobile" type="checkbox" />
                                    <span>Mobile record</span>
                                </label>
                                <div class="admin-form-actions admin-wide">
                                    <button class="admin-primary" type="submit" :disabled="busy">{{ busy ? 'Saving…' : 'Save record' }}</button>
                                    <button class="admin-secondary" type="button" @click="draftRecord = null" :disabled="busy">Cancel</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </section>

                <section class="admin-editor admin-empty-editor" v-else>
                    <h2>Select a level</h2>
                    <p>Choose a level on the left or add a new one.</p>
                </section>
            </section>
        </main>
    `,

    data: () => ({
        store,
        submissionFormUrl: APP_CONFIG.submissionFormUrl,
        submissionReviewUrl: APP_CONFIG.submissionReviewUrl,
        state: "loading",
        busy: false,
        tab: "classic",
        levels: [],
        selectedLevelId: null,
        draftLevel: null,
        creatorsText: "",
        draftRecord: null,
        identityLabel: "Discord user",
        message: "",
        messageIsError: false,
    }),

    computed: {
        levelsForTab() {
            return this.levels
                .filter((level) => level.platformer === (this.tab === "platformer"))
                .sort((a, b) => (a.rank ?? 999999) - (b.rank ?? 999999));
        },
    },

    async mounted() {
        await this.initialize();
    },

    methods: {
        async initialize() {
            const authResult = getAuthResult();
            if (authResult === "denied") {
                this.setMessage("Your Discord account does not have an allowed moderator role.", true);
            } else if (authResult === "error") {
                this.setMessage("Discord sign-in failed. Please try again.", true);
            }

            if (!isApiConfigured()) {
                this.state = "setup";
                return;
            }

            try {
                const session = await getSession();
                if (!session) {
                    this.state = "signed-out";
                    return;
                }
                await this.refreshAccess();
            } catch (error) {
                this.setMessage(error.message, true);
                this.state = "signed-out";
            }
        },

        async login() {
            this.busy = true;
            try {
                await signInWithDiscord();
            } catch (error) {
                this.setMessage(error.message, true);
                this.busy = false;
            }
        },

        async logout() {
            this.busy = true;
            try {
                await signOut();
            } finally {
                this.busy = false;
                this.identityLabel = "Discord user";
                this.state = "signed-out";
                this.levels = [];
                this.draftLevel = null;
            }
        },

        async refreshAccess() {
            this.busy = true;
            this.state = "loading";
            try {
                const status = await moderatorAction("status");
                this.identityLabel = status.displayName || status.username || "Discord user";
                if (!status.authorized) {
                    this.state = "unauthorized";
                    return;
                }
                this.state = "ready";
                await this.loadLevels();
            } catch (error) {
                this.setMessage(error.message, true);
                const session = await getSession().catch(() => null);
                this.state = session ? "unauthorized" : "signed-out";
            } finally {
                this.busy = false;
            }
        },

        async loadLevels(preferredId = null) {
            // The admin panel never falls back to bundled JSON: edits must always target live D1 data.
            const result = await fetchLiveList();
            if (!Array.isArray(result.levels)) throw new Error("Could not load the live level list.");
            this.levels = result.levels;

            const targetId = preferredId || this.selectedLevelId;
            const selected = this.levels.find((level) => level.databaseId === targetId);
            if (selected) {
                this.selectLevel(selected);
            } else if (this.levelsForTab.length) {
                this.selectLevel(this.levelsForTab[0]);
            } else {
                this.draftLevel = null;
                this.selectedLevelId = null;
            }
        },

        switchTab(tab) {
            if (this.tab === tab) return;
            this.tab = tab;
            this.draftRecord = null;
            const first = this.levelsForTab[0];
            if (first) this.selectLevel(first);
            else {
                this.selectedLevelId = null;
                this.draftLevel = null;
            }
        },

        selectLevel(level) {
            this.selectedLevelId = level.databaseId;
            this.draftLevel = clone(level);
            this.creatorsText = (level.creators || []).join(", ");
            this.draftRecord = null;
            this.clearMessage();
        },

        newLevel() {
            this.selectedLevelId = null;
            this.draftLevel = blankLevel(this.tab === "platformer");
            this.creatorsText = "";
            this.draftRecord = null;
            this.clearMessage();
        },

        normalizeCreators() {
            return this.creatorsText
                .split(",")
                .map((creator) => creator.trim())
                .filter(Boolean);
        },

        async saveLevel() {
            this.busy = true;
            this.clearMessage();
            try {
                const result = await moderatorAction("saveLevel", {
                    level: {
                        levelUuid: this.draftLevel.databaseId,
                        gdId: Number(this.draftLevel.id),
                        name: this.draftLevel.name,
                        author: this.draftLevel.author,
                        creators: this.normalizeCreators(),
                        verifier: this.draftLevel.verifier,
                        verification: this.draftLevel.verification,
                        percentToQualify: this.draftLevel.platformer ? 100 : Number(this.draftLevel.percentToQualify),
                        platformer: Boolean(this.draftLevel.platformer),
                        difficulty: this.draftLevel.difficulty,
                    },
                });
                this.setMessage("Level saved.");
                this.tab = this.draftLevel.platformer ? "platformer" : "classic";
                await this.loadLevels(result.levelUuid);
            } catch (error) {
                this.setMessage(error.message, true);
            } finally {
                this.busy = false;
            }
        },

        async deleteLevel() {
            if (!this.draftLevel?.databaseId) return;
            const ok = window.confirm(`Delete ${this.draftLevel.name} and all of its records? This cannot be undone from the panel.`);
            if (!ok) return;

            this.busy = true;
            this.clearMessage();
            try {
                await moderatorAction("deleteLevel", { levelUuid: this.draftLevel.databaseId });
                this.selectedLevelId = null;
                this.draftLevel = null;
                await this.loadLevels();
                this.setMessage("Level deleted.");
            } catch (error) {
                this.setMessage(error.message, true);
            } finally {
                this.busy = false;
            }
        },

        async moveLevel(index, delta) {
            const items = [...this.levelsForTab];
            const nextIndex = index + delta;
            if (nextIndex < 0 || nextIndex >= items.length) return;

            this.busy = true;
            this.clearMessage();
            try {
                await moderatorAction("moveLevel", {
                    platformer: this.tab === "platformer",
                    levelUuid: items[index].databaseId,
                    delta,
                });
                await this.loadLevels(this.selectedLevelId);
                this.setMessage("Order updated.");
            } catch (error) {
                this.setMessage(error.message, true);
            } finally {
                this.busy = false;
            }
        },

        startRecord() {
            this.draftRecord = blankRecord();
            this.clearMessage();
        },

        editRecord(record) {
            this.draftRecord = clone(record);
            this.clearMessage();
        },

        async saveRecord() {
            if (!this.draftLevel?.databaseId || !this.draftRecord) return;
            this.busy = true;
            this.clearMessage();
            try {
                await moderatorAction("saveRecord", {
                    record: {
                        recordUuid: this.draftRecord.recordId,
                        levelUuid: this.draftLevel.databaseId,
                        user: this.draftRecord.user,
                        link: this.draftRecord.link,
                        percent: this.draftLevel.platformer ? null : Number(this.draftRecord.percent),
                        time: this.draftLevel.platformer ? this.draftRecord.time : null,
                        mobile: Boolean(this.draftRecord.mobile),
                    },
                });
                const selected = this.draftLevel.databaseId;
                await this.loadLevels(selected);
                this.draftRecord = null;
                this.setMessage("Record saved.");
            } catch (error) {
                this.setMessage(error.message, true);
            } finally {
                this.busy = false;
            }
        },

        async deleteRecord(record) {
            const ok = window.confirm(`Delete ${record.user}'s record?`);
            if (!ok) return;
            this.busy = true;
            this.clearMessage();
            try {
                await moderatorAction("deleteRecord", { recordUuid: record.recordId });
                await this.loadLevels(this.draftLevel.databaseId);
                this.setMessage("Record deleted.");
            } catch (error) {
                this.setMessage(error.message, true);
            } finally {
                this.busy = false;
            }
        },

        setMessage(message, isError = false) {
            this.message = message;
            this.messageIsError = isError;
        },

        clearMessage() {
            this.message = "";
            this.messageIsError = false;
        },
    },
};
