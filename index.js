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

const TARGET_VC_ID = process.env.TARGET_VC_ID;
const TEXT_CHANNEL_ID = process.env.TEXT_CHANNEL_ID;

// 環境変数の検証
if (!process.env.DISCORD_TOKEN) {
    console.error(t('error.discord_token_missing'));
    process.exit(1);
}

if (!TARGET_VC_ID) {
    console.error(t('error.target_vc_id_missing'));
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

// 通知済みゲームを追跡 (ゲーム名 -> {userId, timestamp})
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

client.on('voiceStateUpdate', (oldState, newState) => {
    try {
        // ボイスチャンネルから退出時
        if (oldState.channelId === TARGET_VC_ID && newState.channelId === null) {
            const member = oldState.member;
            if (!member?.presence) return;

            const playing = member.presence.activities.find(
                a => a.type === ActivityType.Playing
            );

            // ゲームをプレイしていない場合のみ記録をクリア
            if (!playing) {
                // このユーザーが記録されているゲームを全て削除
                for (const [gameName, notified] of notifiedGames.entries()) {
                    if (notified.userId === member.id) {
                        notifiedGames.delete(gameName);
                        console.log(t('info.notification_cleared', { gameName, displayName: member.displayName }));
                    }
                }
            }
            // ゲームをプレイしている場合は記録を保持（出入りしてもメッセージ送信なし）
            return;
        }

        // ボイスチャンネルに入場時：通知を送信
        if (
            oldState.channelId === null &&
            newState.channelId === TARGET_VC_ID
        ) {
            const member = newState.member;
            if (!member?.presence) return;

            const playing = member.presence.activities.find(
                a => a.type === ActivityType.Playing
            );

            if (!playing) {
                // Presence遅延対策：数秒後に再確認
                setTimeout(() => {
                    const retry = member.presence?.activities.find(
                        a => a.type === ActivityType.Playing
                    );
                    if (!retry) return;

                    // 同じゲームが既に通知されているかチェック
                    const notified = notifiedGames.get(retry.name);
                    if (notified) {
                        console.log(t('info.already_notified', { gameName: retry.name, userId: notified.userId }));
                        return;
                    }

                    // 通知記録に追加
                    notifiedGames.set(retry.name, {
                        userId: member.id,
                        timestamp: Date.now()
                    });

                    const channel = newState.guild.channels.cache.get(TEXT_CHANNEL_ID);
                    if (channel?.type === ChannelType.GuildText) {
                        channel.send(
                            t('message.gaming', { displayName: member.displayName, gameName: retry.name })
                        ).catch((error) => {
                            console.error(t('error.message_send_failed', { gameName: retry.name }), error);
                        });
                    }
                }, 3000);
                return;
            }

            // 同じゲームが既に通知されているかチェック
            const notified = notifiedGames.get(playing.name);
            if (notified) {
                console.log(t('info.already_notified', { gameName: playing.name, userId: notified.userId }));
                return;
            }

            // 通知記録に追加
            notifiedGames.set(playing.name, {
                userId: member.id,
                timestamp: Date.now()
            });

            const textChannel =
                newState.guild.channels.cache.get(TEXT_CHANNEL_ID);

            if (!textChannel) {
                console.error(t('error.channel_not_found', { channelId: TEXT_CHANNEL_ID }));
                return;
            }

            if (textChannel.type !== ChannelType.GuildText) {
                console.error(t('error.channel_not_text', { channelId: TEXT_CHANNEL_ID, type: textChannel.type }));
                return;
            }

            textChannel.send(
                t('message.gaming', { displayName: member.displayName, gameName: playing.name })
            ).catch((error) => {
                console.error(t('error.message_send_failed', { gameName: playing.name }), error);
            });
        }
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
