# Discord Game Notifier

[📖 日本語版を見る](README.ja.md)

A Discord Bot that automatically notifies users when someone joins any voice channel and is playing a game.

## Features

- 📢 Monitor user entries to any voice channel
- 🎮 Retrieve game information of users who are playing
- 💬 Post game information to a designated text channel
- 🔄 Duplicate notification prevention
- 🧹 Clear notification records when users leave the voice channel

## Requirements

- Node.js 20 or higher
- Docker & Docker Compose (optional)
- Discord Account and Bot

## Discord Bot Configuration (Important)

To make this Bot work properly, you need to enable the following settings in the Discord Developer Portal.

### Required Gateway Intents
- ✅ Presence Intent
- ✅ Server Members Intent

Without these enabled, the Bot will not be able to retrieve user game information (Presence).

## Setup

### 1. Configure Environment Variables

Create a `.env` file in the project root and set the following environment variables:

```env
DISCORD_TOKEN=your_bot_token_here
TEXT_CHANNEL_ID=text_channel_id_for_notifications
LANGUAGE=en
```

**Required Environment Variables:**
- `DISCORD_TOKEN`: Discord Bot Token
- `TEXT_CHANNEL_ID`: Text channel ID for notifications

**Optional Environment Variables:**
- `LANGUAGE`: Language setting (`en` = English, `ja` = Japanese, default: `en`)

### 2. Install Dependencies

```bash
npm install
```

## Running

### Local Execution

```bash
npm start
```

or

```bash
node index.js
```

### Docker/Docker Compose Execution

```bash
docker-compose up -d
```

## Technologies Used

- **discord.js** v14.14.1 - Discord API Client
- **dotenv** v16.4.1 - Environment Variable Management
- **i18next** v23.7.6 - Internationalization (i18n) Library
- **Node.js** 20 (Docker)

## How It Works

1. The Bot monitors voice channel state change events
2. When a user joins the target voice channel, it:
   - Retrieves activity information from the user's Presence
   - Posts the game information to the text channel if they're playing a game
   - Skips if the same game has already been notified
3. When a user leaves the voice channel:
   - Clears the notification record if they're not playing a game
   - Keeps the record if they're still playing a game

## Notes

- A few-second delay is implemented when joining to handle Presence delays
- Frequent voice channel entries and exits may result in duplicate notifications
- The Bot requires proper Discord Developer Portal configuration to read Presence

## License

MIT License - See the [LICENSE](LICENSE) file for details
