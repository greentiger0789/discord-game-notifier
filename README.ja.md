# Discord Game Notifier

[📖 English Version](README.md)

Discordの任意のボイスチャンネルに参加したユーザーがプレイしているゲームを、テキストチャンネルに自動で通知するBot

## 機能

- 📢 任意のボイスチャンネルへのユーザー入場を監視
- 🎮 入場したユーザーがプレイ中のゲーム情報を取得
- 💬 ゲーム情報を指定したテキストチャンネルに投稿
- 🔄 重複通知の排除機能
- 🧹 ボイスチャンネル退出時に通知記録をクリア

## 必要な環境

- Node.js 20以上
- Docker & Docker Compose（オプション）
- Discordアカウント及びBot

## Discord Bot 設定（重要）

本Botを正常に動作させるため、Discord Developer Portal で以下の設定が必要です。

### 必須 Gateway Intents
- ✅ Presence Intent
- ✅ Server Members Intent

これらを有効にしないと、ユーザーのゲーム情報（Presence）を取得できません。

## セットアップ

### 1. 環境変数の設定

`.env`ファイルをプロジェクトルートに作成し、以下の環境変数を設定してください：

```env
DISCORD_TOKEN=your_bot_token_here
TEXT_CHANNEL_ID=text_channel_id_for_notifications
LANGUAGE=ja
```

**必須環境変数：**
- `DISCORD_TOKEN`: Discord Bot Token
- `TEXT_CHANNEL_ID`: 通知先のテキストチャンネルID

**オプション環境変数：**
- `LANGUAGE`: 言語設定 (`ja` = 日本語, `en` = 英語, デフォルト: `ja`)

### 2. 依存関係のインストール

```bash
npm install
```

## 実行

### ローカル実行

```bash
npm start
```

または

```bash
node index.js
```

### Docker/Docker Composeでの実行

```bash
docker-compose up -d
```

### ローカルでコンテナ内テストを実行する

コンテナ内でテストを実行するには、プロジェクトルートでイメージをビルドして `npm test` を実行します。

```bash
docker build -t discord-game-notifier:test .
docker run --rm discord-game-notifier:test npm test
```

テストは `test/` ディレクトリの簡易スモークテストを実行します（ロケールファイルの検証やハンドラのユニットテスト）。

## 使用技術

- **discord.js** v14.14.1 - Discord API クライアント
- **dotenv** v16.4.1 - 環境変数管理
- **i18next** v23.7.6 - 国際化（i18n）ライブラリ
- **Node.js** 20 (Docker)

## 動作原理

1. Botがボイスチャンネルの状態変更イベントを監視
2. ユーザーが監視対象のボイスチャンネルに入場した時点で以下を実行：
   - ユーザーのPresenceからアクティビティ情報を取得
   - プレイ中のゲーム情報がある場合、テキストチャンネルに投稿
   - 同じゲームが既に通知されている場合はスキップ
3. ユーザーがボイスチャンネルから退出した際：
   - ゲームをプレイしていない場合は通知記録をクリア
   - ゲームをプレイしている場合は記録を保持

## 注意事項

- Presence遅延対策として、入場時に数秒の遅延を設けています
- ボイスチャンネルの出入りを頻繁に繰り返すと、重複通知の可能性があります
- BotがPresenceを読み取るには適切なDiscord Developer Portal設定が必要です

## ライセンス

MIT License - 詳細は[LICENSE](LICENSE)ファイルを参照してください
