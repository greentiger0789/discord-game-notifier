export async function handleVoiceStateUpdate(oldState, newState, options = {}) {
    const {
        notifiedGames,
        t,
        TEXT_CHANNEL_ID,
        ActivityType = { Playing: 'PLAYING' },
        ChannelType = { GuildText: 'GUILD_TEXT' },
        setTimeoutFn = (fn, ms) => setTimeout(fn, ms)
    } = options;

    // 退出: 旧チャネルがあり新チャネルがない場合
    if (oldState?.channelId && !newState?.channelId) {
        const member = oldState.member;
        if (!member) return;

        // そのユーザーが通知済みゲームを記録していれば削除
        if (notifiedGames.has(member.id)) {
            const userGames = notifiedGames.get(member.id);
            notifiedGames.delete(member.id);
            console.log(t('info.notification_cleared', { gameName: Array.from(userGames).join(', '), displayName: member.displayName }));
        }
        return;
    }

    // 入室またはチャンネル移動で新しいチャネルに入った場合
    if (newState?.channelId && oldState?.channelId !== newState?.channelId) {
        const member = newState.member;
        if (!member) return;

        const sendNotification = (gameName, channelName) => {
            // ユーザーIDをキーに、通知済みゲーム名のSetを保持する構造に変更
            const userNotifications = notifiedGames.get(member.id);

            if (userNotifications && userNotifications.has(gameName)) {
                console.log(t('info.already_notified', { gameName, userId: member.id }));
                return;
            }

            // このユーザーのゲーム通知記録を初期化または更新
            if (!userNotifications) {
                notifiedGames.set(member.id, new Set([gameName]));
            } else {
                userNotifications.add(gameName);
            }

            const textChannel = newState.guild.channels.cache.get(TEXT_CHANNEL_ID);
            if (!textChannel) {
                console.error(t('error.channel_not_found', { channelId: TEXT_CHANNEL_ID }));
                return;
            }

            if (textChannel.type !== ChannelType.GuildText) {
                console.error(t('error.channel_not_text', { channelId: TEXT_CHANNEL_ID, type: textChannel.type }));
                return;
            }

            const base = t('message.gaming', { displayName: member.displayName, gameName });
            const channelSuffix = channelName ? ` (${channelName})` : '';
            textChannel.send(base + channelSuffix).catch((error) => {
                console.error(t('error.message_send_failed', { gameName }), error);
            });
        };

        // Presenceがまだ来ていない可能性があるため、まず即時確認
        const playing = member.presence?.activities.find(a => a.type === ActivityType.Playing);
        const channelName = newState.channel?.name || newState.guild.channels.cache.get(newState.channelId)?.name || '';

        if (playing) {
            sendNotification(playing.name, channelName);
            return;
        }

        // 再確認（Presence遅延対策）
        setTimeoutFn(() => {
            const retryPlaying = member.presence?.activities.find(a => a.type === ActivityType.Playing);
            if (!retryPlaying) return;
            sendNotification(retryPlaying.name, channelName);
        }, 3000);
    }
}

export default handleVoiceStateUpdate;
