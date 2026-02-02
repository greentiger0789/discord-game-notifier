import assert from 'assert';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const en = JSON.parse(readFileSync(join(__dirname, '..', 'locales', 'en.json'), 'utf8'));
const ja = JSON.parse(readFileSync(join(__dirname, '..', 'locales', 'ja.json'), 'utf8'));

// Basic smoke tests to ensure locale keys used by the app exist
assert.ok(en.error && en.error.discord_token_missing, ('en missing error.discord_token_missing'));
assert.ok(ja.error && ja.error.discord_token_missing, ('ja missing error.discord_token_missing'));

console.log('Locale files loaded and contain required keys.');
