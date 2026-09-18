-- GDBlindfoldedList Cloudflare D1 database
-- Run this ONCE on a new, empty D1 database. It creates the tables and seeds
-- only the levels currently present in data/_list.json. Archived/unlisted JSONs stay unlisted.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS levels (
    level_uuid TEXT PRIMARY KEY,
    gd_id INTEGER NOT NULL UNIQUE,
    name TEXT NOT NULL,
    author TEXT NOT NULL,
    creators_json TEXT NOT NULL,
    verifier TEXT NOT NULL,
    verification TEXT NOT NULL,
    percent_to_qualify REAL NOT NULL,
    platformer INTEGER NOT NULL DEFAULT 0 CHECK (platformer IN (0, 1)),
    difficulty TEXT NOT NULL,
    rank INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_levels_type_rank ON levels(platformer, rank);

CREATE TABLE IF NOT EXISTS records (
    record_uuid TEXT PRIMARY KEY,
    level_uuid TEXT NOT NULL REFERENCES levels(level_uuid) ON DELETE CASCADE,
    user TEXT NOT NULL,
    link TEXT NOT NULL DEFAULT '',
    percent REAL,
    time TEXT,
    mobile INTEGER NOT NULL DEFAULT 0 CHECK (mobile IN (0, 1)),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_records_level ON records(level_uuid);

CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    discord_user_id TEXT NOT NULL,
    username TEXT NOT NULL,
    global_name TEXT,
    avatar TEXT,
    expires_at INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    discord_user_id TEXT NOT NULL,
    username TEXT NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    details_json TEXT,
    created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at);

-- Initial public list data
INSERT INTO levels (level_uuid, gd_id, name, author, creators_json, verifier, verification, percent_to_qualify, platformer, difficulty, rank, created_at, updated_at) VALUES ('seed-98163412', 98163412, '🌙 The Abyss (+sfx)', 'Lutz127', '["MadisonYuko"]', 'Lutz127', 'https://www.youtube.com/watch?v=OnqxpiswPbc', 100, 1, 'Extreme Demon', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO records (record_uuid, level_uuid, user, link, percent, time, mobile, created_at, updated_at) VALUES ('seed-98163412-1', 'seed-98163412', 'Lutz127', 'https://www.youtube.com/watch?v=OnqxpiswPbc', NULL, '7:34:31.409', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO levels (level_uuid, gd_id, name, author, creators_json, verifier, verification, percent_to_qualify, platformer, difficulty, rank, created_at, updated_at) VALUES ('seed-97713011', 97713011, '🌙 Tower of Infinity (+sfx)', 'Lutz127', '["MadisonYuko"]', 'Lutz127', 'https://www.youtube.com/watch?v=Xl8edv-z66A', 100, 1, 'Extreme Demon', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO records (record_uuid, level_uuid, user, link, percent, time, mobile, created_at, updated_at) VALUES ('seed-97713011-1', 'seed-97713011', 'Lutz127', 'https://www.youtube.com/watch?v=Xl8edv-z66A', NULL, '3:33:07.975', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO levels (level_uuid, gd_id, name, author, creators_json, verifier, verification, percent_to_qualify, platformer, difficulty, rank, created_at, updated_at) VALUES ('seed-97543536', 97543536, '🌙 I wanna be the guy', 'Aless50', '["Aless50"]', 'Lutz127', 'https://www.youtube.com/watch?v=DYIp8Rmr4fU', 100, 1, 'Insane Demon', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO records (record_uuid, level_uuid, user, link, percent, time, mobile, created_at, updated_at) VALUES ('seed-97543536-1', 'seed-97543536', 'Lutz127', 'https://www.youtube.com/watch?v=DYIp8Rmr4fU', NULL, '2:36:48.871', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO levels (level_uuid, gd_id, name, author, creators_json, verifier, verification, percent_to_qualify, platformer, difficulty, rank, created_at, updated_at) VALUES ('seed-98695499', 98695499, '🌙 dashing over it', 'Halapeenyo', '["Halapeenyo"]', 'Aibyou', 'https://www.youtube.com/watch?v=ZqjW2V-JwOE', 100, 1, 'Medium Demon', 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO records (record_uuid, level_uuid, user, link, percent, time, mobile, created_at, updated_at) VALUES ('seed-98695499-1', 'seed-98695499', 'Aibyou', 'https://www.youtube.com/watch?v=ZqjW2V-JwOE', NULL, '5:12.562', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO levels (level_uuid, gd_id, name, author, creators_json, verifier, verification, percent_to_qualify, platformer, difficulty, rank, created_at, updated_at) VALUES ('seed-124799293', 124799293, '🌙 Feel The Game', 'NDagger', '["NDagger"]', 'Lutz127', 'https://www.youtube.com/watch?v=JK-vNcQCCfs', 100, 1, 'Insane Demon', 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO records (record_uuid, level_uuid, user, link, percent, time, mobile, created_at, updated_at) VALUES ('seed-124799293-1', 'seed-124799293', 'Lutz127', 'https://www.youtube.com/watch?v=JK-vNcQCCfs', NULL, '9:36.637', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO levels (level_uuid, gd_id, name, author, creators_json, verifier, verification, percent_to_qualify, platformer, difficulty, rank, created_at, updated_at) VALUES ('seed-102712977', 102712977, '🌙 In Visible', 'Bjh6078', '["Bjh6078"]', 'Lutz127', 'https://www.youtube.com/watch?v=RQhHyfnBRd4', 100, 1, 'Easy Demon', 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO records (record_uuid, level_uuid, user, link, percent, time, mobile, created_at, updated_at) VALUES ('seed-102712977-1', 'seed-102712977', 'Lutz127', 'https://www.youtube.com/watch?v=RQhHyfnBRd4', NULL, '29:28.462', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO levels (level_uuid, gd_id, name, author, creators_json, verifier, verification, percent_to_qualify, platformer, difficulty, rank, created_at, updated_at) VALUES ('seed-98079761', 98079761, '🌙 Shiftleaf Temple', 'trideapthbear', '["trideapthbear"]', 'Lutz127', 'https://www.youtube.com/watch?v=9o4d01Mrt3Q', 100, 1, 'Easy Demon', 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO records (record_uuid, level_uuid, user, link, percent, time, mobile, created_at, updated_at) VALUES ('seed-98079761-1', 'seed-98079761', 'Lutz127', 'https://www.youtube.com/watch?v=9o4d01Mrt3Q', NULL, '18:34.195', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO levels (level_uuid, gd_id, name, author, creators_json, verifier, verification, percent_to_qualify, platformer, difficulty, rank, created_at, updated_at) VALUES ('seed-97459509', 97459509, '🌙 The Cellar', 'RobTop', '["RobTop"]', 'RaiinWing', 'https://www.youtube.com/watch?v=myDqRGpHYr8', 100, 1, 'Harder', 8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO records (record_uuid, level_uuid, user, link, percent, time, mobile, created_at, updated_at) VALUES ('seed-97459509-1', 'seed-97459509', 'RaiinWing', 'https://www.youtube.com/watch?v=myDqRGpHYr8', NULL, '1:47.033', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO levels (level_uuid, gd_id, name, author, creators_json, verifier, verification, percent_to_qualify, platformer, difficulty, rank, created_at, updated_at) VALUES ('seed-77236593', 77236593, '⭐ Dry Out', 'RobTop', '["RobTop"]', '598', 'https://youtu.be/2gTwggMcC78', 100, 0, 'Normal', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO records (record_uuid, level_uuid, user, link, percent, time, mobile, created_at, updated_at) VALUES ('seed-77236593-1', 'seed-77236593', '598', 'https://youtu.be/2gTwggMcC78', 100, NULL, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO levels (level_uuid, gd_id, name, author, creators_json, verifier, verification, percent_to_qualify, platformer, difficulty, rank, created_at, updated_at) VALUES ('seed-77237542', 77237542, '⭐ Cant Let Go', 'RobTop', '["RobTop"]', 'RaiinWing', 'https://www.youtube.com/watch?v=pTSSyFm98EM', 100, 0, 'Hard', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO records (record_uuid, level_uuid, user, link, percent, time, mobile, created_at, updated_at) VALUES ('seed-77237542-1', 'seed-77237542', 'RaiinWing', 'https://www.youtube.com/watch?v=pTSSyFm98EM', 100, NULL, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO levels (level_uuid, gd_id, name, author, creators_json, verifier, verification, percent_to_qualify, platformer, difficulty, rank, created_at, updated_at) VALUES ('seed-77237540', 77237540, '⭐ Base After Base', 'RobTop', '["RobTop"]', '598', 'https://youtu.be/rERIfKSRfi8', 100, 0, 'Hard', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO records (record_uuid, level_uuid, user, link, percent, time, mobile, created_at, updated_at) VALUES ('seed-77237540-1', 'seed-77237540', '598', 'https://youtu.be/rERIfKSRfi8', 100, NULL, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO levels (level_uuid, gd_id, name, author, creators_json, verifier, verification, percent_to_qualify, platformer, difficulty, rank, created_at, updated_at) VALUES ('seed-97459505', 97459505, '🌙 The Sewers', 'RobTop', '["RobTop"]', 'RaiinWing', 'https://www.youtube.com/watch?v=zbixAs-fxlE', 100, 1, 'Hard', 9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO records (record_uuid, level_uuid, user, link, percent, time, mobile, created_at, updated_at) VALUES ('seed-97459505-1', 'seed-97459505', 'RaiinWing', 'https://www.youtube.com/watch?v=zbixAs-fxlE', NULL, '1:17.658', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO levels (level_uuid, gd_id, name, author, creators_json, verifier, verification, percent_to_qualify, platformer, difficulty, rank, created_at, updated_at) VALUES ('seed-81391957', 81391957, '⭐ PXTTXRN SXXKXR', 'Viot', '["Viot"]', 'zachhax', 'https://youtu.be/10qeMHPakXI', 100, 0, 'Easy Demon', 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO records (record_uuid, level_uuid, user, link, percent, time, mobile, created_at, updated_at) VALUES ('seed-81391957-1', 'seed-81391957', 'zachhax', 'https://youtu.be/10qeMHPakXI', 100, NULL, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO records (record_uuid, level_uuid, user, link, percent, time, mobile, created_at, updated_at) VALUES ('seed-81391957-2', 'seed-81391957', '598', 'https://youtu.be/yeXTyy51VpU', 100, NULL, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO levels (level_uuid, gd_id, name, author, creators_json, verifier, verification, percent_to_qualify, platformer, difficulty, rank, created_at, updated_at) VALUES ('seed-77236592', 77236592, '⭐ Polargeist', 'RobTop', '["RobTop"]', 'RaiinWing', 'https://www.youtube.com/watch?v=-UmLSMtfe3s', 100, 0, 'Normal', 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO records (record_uuid, level_uuid, user, link, percent, time, mobile, created_at, updated_at) VALUES ('seed-77236592-1', 'seed-77236592', 'RaiinWing', 'https://www.youtube.com/watch?v=-UmLSMtfe3s', 100, NULL, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO records (record_uuid, level_uuid, user, link, percent, time, mobile, created_at, updated_at) VALUES ('seed-77236592-2', 'seed-77236592', '598', 'https://youtu.be/40JEwUdLAW4', 100, NULL, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO records (record_uuid, level_uuid, user, link, percent, time, mobile, created_at, updated_at) VALUES ('seed-77236592-3', 'seed-77236592', 'Lutz127', 'https://youtu.be/qlHsFUiyEsA', 100, NULL, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO levels (level_uuid, gd_id, name, author, creators_json, verifier, verification, percent_to_qualify, platformer, difficulty, rank, created_at, updated_at) VALUES ('seed-77236587', 77236587, '⭐ Stereo Madness', 'RobTop', '["RobTop"]', 'FroggiBoy', 'https://www.youtube.com/watch?v=3QnqTsezBW8', 10, 0, 'Easy', 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO records (record_uuid, level_uuid, user, link, percent, time, mobile, created_at, updated_at) VALUES ('seed-77236587-1', 'seed-77236587', 'FroggiBoy', 'https://www.youtube.com/watch?v=3QnqTsezBW8', 100, NULL, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO records (record_uuid, level_uuid, user, link, percent, time, mobile, created_at, updated_at) VALUES ('seed-77236587-2', 'seed-77236587', 'RaiinWing', 'https://www.youtube.com/watch?v=VX4Fg3PmnSo', 100, NULL, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO records (record_uuid, level_uuid, user, link, percent, time, mobile, created_at, updated_at) VALUES ('seed-77236587-3', 'seed-77236587', 'iBrow', 'https://youtu.be/aN-2hXT-_tI', 100, NULL, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO records (record_uuid, level_uuid, user, link, percent, time, mobile, created_at, updated_at) VALUES ('seed-77236587-4', 'seed-77236587', 'Lutz127', 'https://www.youtube.com/watch?v=kTnhLrIPeIM', 100, NULL, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO records (record_uuid, level_uuid, user, link, percent, time, mobile, created_at, updated_at) VALUES ('seed-77236587-5', 'seed-77236587', '598', 'https://www.youtube.com/watch?v=HnQ7JGxu-sg&t=138&feature=youtu.be', 100, NULL, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO records (record_uuid, level_uuid, user, link, percent, time, mobile, created_at, updated_at) VALUES ('seed-77236587-6', 'seed-77236587', 'Thisisadam', 'https://youtu.be/kmo9yk87TuY', 93, NULL, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO records (record_uuid, level_uuid, user, link, percent, time, mobile, created_at, updated_at) VALUES ('seed-77236587-7', 'seed-77236587', 'Firedox532', 'https://www.twitch.tv/videos/2685861441', 51, NULL, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO records (record_uuid, level_uuid, user, link, percent, time, mobile, created_at, updated_at) VALUES ('seed-77236587-8', 'seed-77236587', 'Vonix', 'https://www.youtube.com/watch?v=_I6onRkx60I', 48, NULL, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO records (record_uuid, level_uuid, user, link, percent, time, mobile, created_at, updated_at) VALUES ('seed-77236587-9', 'seed-77236587', 'CalamitySam', 'https://www.youtube.com/watch?v=sMS5BNRG8AE', 18, NULL, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO levels (level_uuid, gd_id, name, author, creators_json, verifier, verification, percent_to_qualify, platformer, difficulty, rank, created_at, updated_at) VALUES ('seed-76071635', 76071635, '⭐ 3D Dash', 'GirlyAle02', '["GirlyAle02"]', 'GirlyAle02', 'https://www.youtube.com/watch?v=O3lRSfFBmdc', 100, 0, 'Hard', 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO records (record_uuid, level_uuid, user, link, percent, time, mobile, created_at, updated_at) VALUES ('seed-76071635-1', 'seed-76071635', 'GirlyAle02', 'https://www.youtube.com/watch?v=O3lRSfFBmdc', 100, NULL, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO levels (level_uuid, gd_id, name, author, creators_json, verifier, verification, percent_to_qualify, platformer, difficulty, rank, created_at, updated_at) VALUES ('seed-97459496', 97459496, '🌙 The Tower', 'RobTop', '["RobTop"]', 'Lutz127', 'https://www.youtube.com/watch?v=0HPw5rQuMsU', 100, 1, 'Normal', 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO records (record_uuid, level_uuid, user, link, percent, time, mobile, created_at, updated_at) VALUES ('seed-97459496-1', 'seed-97459496', 'RaiinWing', 'https://www.youtube.com/watch?v=iGeniJddogw', NULL, '1:15.275', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO records (record_uuid, level_uuid, user, link, percent, time, mobile, created_at, updated_at) VALUES ('seed-97459496-2', 'seed-97459496', 'Hamid ScorpiOn', 'https://www.youtube.com/watch?v=qamej9QBY_M', NULL, '1:18.104', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO records (record_uuid, level_uuid, user, link, percent, time, mobile, created_at, updated_at) VALUES ('seed-97459496-3', 'seed-97459496', 'realnono', 'https://www.youtube.com/watch?v=593Zpzfx48k', NULL, '1:23.795', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO records (record_uuid, level_uuid, user, link, percent, time, mobile, created_at, updated_at) VALUES ('seed-97459496-4', 'seed-97459496', 'Lutz127', 'https://www.youtube.com/watch?v=0HPw5rQuMsU', NULL, '7:07.937', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO records (record_uuid, level_uuid, user, link, percent, time, mobile, created_at, updated_at) VALUES ('seed-97459496-5', 'seed-97459496', 'Walgrey', 'https://www.youtube.com/watch?v=mrHVq2YKVU8', NULL, '10:11.404', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO levels (level_uuid, gd_id, name, author, creators_json, verifier, verification, percent_to_qualify, platformer, difficulty, rank, created_at, updated_at) VALUES ('seed-77236588', 77236588, '⭐ Back On Track', 'RobTop', '["RobTop"]', 'paper2222', 'https://www.youtube.com/watch?v=nen3YmTCJDE', 100, 0, 'Easy', 8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO records (record_uuid, level_uuid, user, link, percent, time, mobile, created_at, updated_at) VALUES ('seed-77236588-1', 'seed-77236588', 'paper2222', 'https://www.youtube.com/watch?v=nen3YmTCJDE', 100, NULL, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO records (record_uuid, level_uuid, user, link, percent, time, mobile, created_at, updated_at) VALUES ('seed-77236588-2', 'seed-77236588', 'RaiinWing', 'https://www.twitch.tv/videos/2626640200', 100, NULL, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO records (record_uuid, level_uuid, user, link, percent, time, mobile, created_at, updated_at) VALUES ('seed-77236588-3', 'seed-77236588', '598', 'https://youtu.be/RKJ-pVIDeCQ', 100, NULL, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO records (record_uuid, level_uuid, user, link, percent, time, mobile, created_at, updated_at) VALUES ('seed-77236588-4', 'seed-77236588', 'Lutz127', '', 100, NULL, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO levels (level_uuid, gd_id, name, author, creators_json, verifier, verification, percent_to_qualify, platformer, difficulty, rank, created_at, updated_at) VALUES ('seed-77241653', 77241653, '⭐ Frontlines', 'RobTop', '["RobTop"]', '598', 'https://youtu.be/fH4fGAWXDm4', 100, 0, 'Easy', 9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO records (record_uuid, level_uuid, user, link, percent, time, mobile, created_at, updated_at) VALUES ('seed-77241653-1', 'seed-77241653', '598', 'https://youtu.be/fH4fGAWXDm4', 100, NULL, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO levels (level_uuid, gd_id, name, author, creators_json, verifier, verification, percent_to_qualify, platformer, difficulty, rank, created_at, updated_at) VALUES ('seed-77241651', 77241651, '⭐ Machina', 'RobTop', '["RobTop"]', 'Lutz127', 'https://youtu.be/uAUOG7XzUbU', 100, 0, 'Normal', 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO records (record_uuid, level_uuid, user, link, percent, time, mobile, created_at, updated_at) VALUES ('seed-77241651-1', 'seed-77241651', 'Lutz127', 'https://youtu.be/uAUOG7XzUbU', 100, NULL, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO records (record_uuid, level_uuid, user, link, percent, time, mobile, created_at, updated_at) VALUES ('seed-77241651-2', 'seed-77241651', '598', 'https://youtu.be/oo-ryVd7PjY', 100, NULL, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO levels (level_uuid, gd_id, name, author, creators_json, verifier, verification, percent_to_qualify, platformer, difficulty, rank, created_at, updated_at) VALUES ('seed-77243245', 77243245, '⭐ The Challenge', 'RobTop', '["RobTop"]', '598', 'https://www.youtube.com/watch?v=h38dUWyPGsE', 100, 0, 'Easy', 11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO records (record_uuid, level_uuid, user, link, percent, time, mobile, created_at, updated_at) VALUES ('seed-77243245-1', 'seed-77243245', '598', 'https://www.youtube.com/watch?v=h38dUWyPGsE', 100, NULL, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO records (record_uuid, level_uuid, user, link, percent, time, mobile, created_at, updated_at) VALUES ('seed-77243245-2', 'seed-77243245', 'Lutz127', 'https://youtu.be/lu2hsfr6zpc', 100, NULL, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO levels (level_uuid, gd_id, name, author, creators_json, verifier, verification, percent_to_qualify, platformer, difficulty, rank, created_at, updated_at) VALUES ('seed-30468868', 30468868, '⭐ LETs GO', 'izhar', '["izhar"]', 'Crystal', 'https://www.youtube.com/watch?v=EpLlmbng3N8', 100, 0, 'Normal', 12, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO records (record_uuid, level_uuid, user, link, percent, time, mobile, created_at, updated_at) VALUES ('seed-30468868-1', 'seed-30468868', 'Crystal', 'https://www.youtube.com/watch?v=EpLlmbng3N8', 100, NULL, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO levels (level_uuid, gd_id, name, author, creators_json, verifier, verification, percent_to_qualify, platformer, difficulty, rank, created_at, updated_at) VALUES ('seed-77241647', 77241647, '⭐ Beast Mode', 'RobTop', '["RobTop"]', 'Lutz127', 'https://youtu.be/ubeNaRTl8Do', 100, 0, 'Easy', 13, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO records (record_uuid, level_uuid, user, link, percent, time, mobile, created_at, updated_at) VALUES ('seed-77241647-1', 'seed-77241647', 'Lutz127', 'https://youtu.be/ubeNaRTl8Do', 100, NULL, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO records (record_uuid, level_uuid, user, link, percent, time, mobile, created_at, updated_at) VALUES ('seed-77241647-2', 'seed-77241647', '598', 'https://youtu.be/O8-19YWWSJs', 100, NULL, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO levels (level_uuid, gd_id, name, author, creators_json, verifier, verification, percent_to_qualify, platformer, difficulty, rank, created_at, updated_at) VALUES ('seed-77241646', 77241646, '⭐ Payload', 'RobTop', '["RobTop"]', 'Lutz127', 'https://youtu.be/xSYajTG7_MU', 100, 0, 'Easy', 14, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO records (record_uuid, level_uuid, user, link, percent, time, mobile, created_at, updated_at) VALUES ('seed-77241646-1', 'seed-77241646', 'Lutz127', 'https://youtu.be/xSYajTG7_MU', 100, NULL, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO records (record_uuid, level_uuid, user, link, percent, time, mobile, created_at, updated_at) VALUES ('seed-77241646-2', 'seed-77241646', '598', 'https://youtu.be/NUXf3jGBZUU', 100, NULL, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO records (record_uuid, level_uuid, user, link, percent, time, mobile, created_at, updated_at) VALUES ('seed-77241646-3', 'seed-77241646', 'BlackScreen23', 'https://youtu.be/gY3U6Qt6QGk', 100, NULL, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO levels (level_uuid, gd_id, name, author, creators_json, verifier, verification, percent_to_qualify, platformer, difficulty, rank, created_at, updated_at) VALUES ('seed-6508283', 6508283, '⭐ ReTraY', 'DiVaMiKuLov26', '["DiVaMiKuLov26"]', 'Polygon Donut', 'https://www.youtube.com/watch?v=klLM_3aeXYk', 100, 0, 'Easy', 15, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO records (record_uuid, level_uuid, user, link, percent, time, mobile, created_at, updated_at) VALUES ('seed-6508283-1', 'seed-6508283', 'Polygon Donut', 'https://www.youtube.com/watch?v=klLM_3aeXYk', 100, NULL, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO records (record_uuid, level_uuid, user, link, percent, time, mobile, created_at, updated_at) VALUES ('seed-6508283-2', 'seed-6508283', 'Lol amaZon', 'https://www.youtube.com/watch?v=NvCDdEszCuw', 100, NULL, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO records (record_uuid, level_uuid, user, link, percent, time, mobile, created_at, updated_at) VALUES ('seed-6508283-3', 'seed-6508283', 'Thisisadam', 'https://www.youtube.com/watch?v=Py4Jimldojg', 100, NULL, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO records (record_uuid, level_uuid, user, link, percent, time, mobile, created_at, updated_at) VALUES ('seed-6508283-4', 'seed-6508283', 'Lutz127', 'https://youtu.be/UrorE7esJO0', 100, NULL, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO records (record_uuid, level_uuid, user, link, percent, time, mobile, created_at, updated_at) VALUES ('seed-6508283-5', 'seed-6508283', '598', 'https://youtu.be/vggYht4Jz2c', 100, NULL, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO records (record_uuid, level_uuid, user, link, percent, time, mobile, created_at, updated_at) VALUES ('seed-6508283-6', 'seed-6508283', 'ivi', '', 100, NULL, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO records (record_uuid, level_uuid, user, link, percent, time, mobile, created_at, updated_at) VALUES ('seed-6508283-7', 'seed-6508283', 'Specsyee', 'https://drive.google.com/file/d/1Y9fo5QbdTqsJXqJYvL2RNerFb0atBeml/view?usp=sharing', 100, NULL, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO records (record_uuid, level_uuid, user, link, percent, time, mobile, created_at, updated_at) VALUES ('seed-6508283-8', 'seed-6508283', 'klouwd', '', 100, NULL, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO records (record_uuid, level_uuid, user, link, percent, time, mobile, created_at, updated_at) VALUES ('seed-6508283-9', 'seed-6508283', 'DuckyGD', 'https://youtu.be/6d6jaFg0BF4', 100, NULL, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO records (record_uuid, level_uuid, user, link, percent, time, mobile, created_at, updated_at) VALUES ('seed-6508283-10', 'seed-6508283', 'BlackScreen23', 'https://www.youtube.com/shorts/KANivMvVDLY', 100, NULL, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO records (record_uuid, level_uuid, user, link, percent, time, mobile, created_at, updated_at) VALUES ('seed-6508283-11', 'seed-6508283', 'DAXdash', 'https://www.youtube.com/watch?v=j_LgG5fC6Jo', 100, NULL, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO records (record_uuid, level_uuid, user, link, percent, time, mobile, created_at, updated_at) VALUES ('seed-6508283-12', 'seed-6508283', 'Crystal', 'https://www.youtube.com/watch?v=3SC_Pu1OxZM', 100, NULL, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
