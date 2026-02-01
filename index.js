import {
    ActivityType,
    ChannelType,
    Client,
    GatewayIntentBits
} from 'discord.js';
import 'dotenv/config';

const TARGET_VC_ID = process.env.TARGET_VC_ID;
const TEXT_CHANNEL_ID = process.env.TEXT_CHANNEL_ID;

// 環境変数の検証
if (!process.env.DISCORD_TOKEN) {
    console.error('❌ エラー: DISCORD_TOKEN が設定されていません');
    process.exit(1);
}

if (!TARGET_VC_ID) {
    console.error('❌ エラー: TARGET_VC_ID が設定されていません');
    process.exit(1);
}

if (!TEXT_CHANNEL_ID) {
    console.error('❌ エラー: TEXT_CHANNEL_ID が設定されていません');
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
    console.log(`✅ ログイン成功: ${client.user.tag}`);
});

client.on('error', (error) => {
    console.error('❌ クライアントエラー:', error);
});

client.on('warn', (warning) => {
    console.warn('⚠️  警告:', warning);
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
                        console.log(`🧹 ${gameName} の通知記録をクリア (${member.displayName} がゲーム終了)`);
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
                        console.log(`⏭️  ${retry.name} は既に通知済み (${notified.userId})`);
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
                            `🎮 **${member.displayName}** が **${retry.name}** をプレイ中！\n一緒にやらない？`
                        ).catch((error) => {
                            console.error(`❌ メッセージ送信エラー (${retry.name}):`, error);
                        });
                    }
                }, 3000);
                return;
            }

            // 同じゲームが既に通知されているかチェック
            const notified = notifiedGames.get(playing.name);
            if (notified) {
                console.log(`⏭️  ${playing.name} は既に通知済み (${notified.userId})`);
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
                console.error(`❌ エラー: テキストチャンネル (${TEXT_CHANNEL_ID}) が見つかりません`);
                return;
            }

            if (textChannel.type !== ChannelType.GuildText) {
                console.error(`❌ エラー: ${TEXT_CHANNEL_ID} はテキストチャンネルではありません (型: ${textChannel.type})`);
                return;
            }

            textChannel.send(
                `🎮 **${member.displayName}** が **${playing.name}** をプレイ中！\n一緒にやらない？`
            ).catch((error) => {
                console.error(`❌ メッセージ送信エラー (${playing.name}):`, error);
            });
        }
    } catch (error) {
        console.error('❌ voiceStateUpdate イベント内でエラーが発生:', error);
    }
});

// グレースフルシャットダウン
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM受信、シャットダウン中...');
    client.destroy();
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 SIGINT受信、シャットダウン中...');
    client.destroy();
    process.exit(0);
});

// 予期しない例外ハンドリング
process.on('unhandledRejection', (reason) => {
    console.error('❌ ハンドルされない Promise Rejection:', reason);
});

process.on('uncaughtException', (err) => {
    console.error('❌ キャッチされない例外:', err);
});

client.login(process.env.DISCORD_TOKEN).catch((error) => {
    console.error('❌ ログイン失敗:', error);
    process.exit(1);
});
