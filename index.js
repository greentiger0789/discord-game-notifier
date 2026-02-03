import {
    ActivityType,
    ChannelType,
    Client,
    GatewayIntentBits
} from 'discord.js';
import 'dotenv/config';
import { readFileSync } from 'fs';
import i18next from 'i18next';

// i18nの初期化
const language = process.env.LANGUAGE || 'ja';
const en = JSON.parse(readFileSync('./locales/en.json', 'utf-8'));
const ja = JSON.parse(readFileSync('./locales/ja.json', 'utf-8'));

i18next.init({
    lng: language,
    fallbackLng: 'en',
    resources: {
        en: { translation: en },
        ja: { translation: ja }
    }
});

const t = i18next.t.bind(i18next);

const TEXT_CHANNEL_ID = process.env.TEXT_CHANNEL_ID;

// 環境変数の検証
if (!process.env.DISCORD_TOKEN) {
    console.error(t('error.discord_token_missing'));
    process.exit(1);
}

if (!TEXT_CHANNEL_ID) {
    console.error(t('error.text_channel_id_missing'));
    process.exit(1);
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMembers
    ]
});

// 通知済みゲームを追跡 (userId -> Set<gameName>)
const notifiedGames = new Map();

client.once('clientReady', () => {
    console.log(t('success.login', { userTag: client.user.tag }));
});

client.on('error', (error) => {
    console.error(t('error.client'), error);
});

client.on('warn', (warning) => {
    console.warn(t('warning.default'), warning);
});

import handleVoiceStateUpdate from './src/voiceHandler.js';

client.on('voiceStateUpdate', (oldState, newState) => {
    try {
        handleVoiceStateUpdate(oldState, newState, {
            notifiedGames,
            t,
            TEXT_CHANNEL_ID,
            ActivityType,
            ChannelType
        });
    } catch (error) {
        console.error(t('error.voice_state_update_failed'), error);
    }
});

// グレースフルシャットダウン
process.on('SIGTERM', () => {
    console.log(t('info.shutting_down_sigterm'));
    client.destroy();
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log(t('info.shutting_down_sigint'));
    client.destroy();
    process.exit(0);
});

// 予期しない例外ハンドリング
process.on('unhandledRejection', (reason) => {
    console.error(t('error.unhandled_rejection'), reason);
});

process.on('uncaughtException', (err) => {
    console.error(t('error.uncaught_exception'), err);
});

client.login(process.env.DISCORD_TOKEN).catch((error) => {
    console.error(t('error.login_failed'), error);
    process.exit(1);
});
