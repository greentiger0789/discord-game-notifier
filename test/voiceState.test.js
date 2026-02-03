import assert from 'assert';
import { describe, it } from 'node:test';
import handleVoiceStateUpdate from '../src/voiceHandler.js';

function makeMember(id, displayName, activities = []) {
    return {
        id,
        displayName,
        presence: { activities }
    };
}

function makeGuild(textChannel) {
    return {
        channels: { cache: new Map([['text', textChannel]]) }
    };
}

describe('voiceStateUpdate handler', () => {
    it('sends notification and records game when user joins and is playing', () => {
        const notifiedGames = new Map();
        const sent = [];
        const textChannel = { type: 'GUILD_TEXT', send: (msg) => { sent.push(msg); return Promise.resolve(); } };

        const oldState = { channelId: null };
        const newState = {
            channelId: 'vc1',
            member: makeMember('u1', 'Alice', [{ type: 'PLAYING', name: 'VALORANT' }]),
            guild: makeGuild(textChannel),
            channel: { name: 'General' }
        };

        const t = (k, v) => `${v.displayName} is playing ${v.gameName}`;

        handleVoiceStateUpdate(oldState, newState, {
            notifiedGames,
            t,
            TEXT_CHANNEL_ID: 'text',
            ActivityType: { Playing: 'PLAYING' },
            ChannelType: { GuildText: 'GUILD_TEXT' },
            setTimeoutFn: (fn) => fn()
        });

        assert.strictEqual(sent.length, 1);
        assert.ok(sent[0].includes('Alice is playing VALORANT'));
        assert.strictEqual(notifiedGames.has('u1'), true);
        assert.ok(notifiedGames.get('u1').has('VALORANT'));
    });

    it('does not resend if game already notified', () => {
        const notifiedGames = new Map();
        notifiedGames.set('u1', new Set(['VALORANT']));
        const sent = [];
        const textChannel = { type: 'GUILD_TEXT', send: (msg) => { sent.push(msg); return Promise.resolve(); } };

        const oldState = { channelId: null };
        const newState = {
            channelId: 'vc1',
            member: makeMember('u1', 'Alice', [{ type: 'PLAYING', name: 'VALORANT' }]),
            guild: makeGuild(textChannel),
            channel: { name: 'General' }
        };

        const t = (k, v) => `${v.displayName} is playing ${v.gameName}`;

        handleVoiceStateUpdate(oldState, newState, {
            notifiedGames,
            t,
            TEXT_CHANNEL_ID: 'text',
            ActivityType: { Playing: 'PLAYING' },
            ChannelType: { GuildText: 'GUILD_TEXT' },
            setTimeoutFn: (fn) => fn()
        });

        assert.strictEqual(sent.length, 0);
    });

    it('clears notifications for user on leave', () => {
        const notifiedGames = new Map();
        notifiedGames.set('u1', new Set(['VALORANT']));
        notifiedGames.set('u2', new Set(['OTHER']));

        const oldState = {
            channelId: 'vc1',
            member: makeMember('u1', 'Alice', [])
        };
        const newState = { channelId: null };

        const t = (k, v) => '';

        handleVoiceStateUpdate(oldState, newState, {
            notifiedGames,
            t,
            TEXT_CHANNEL_ID: 'text',
            ActivityType: { Playing: 'PLAYING' },
            ChannelType: { GuildText: 'GUILD_TEXT' }
        });

        assert.strictEqual(notifiedGames.has('u1'), false);
        assert.strictEqual(notifiedGames.has('u2'), true);
    });
});
