#!/usr/bin/env node
/**
 * HR-System DB バックアップ → Google Drive アップロード
 *
 * 前提:
 *   - Heroku pg:backups で最新バックアップが存在すること
 *   - 環境変数:
 *       GDRIVE_CLIENT_ID       … Google OAuth2 クライアント ID
 *       GDRIVE_CLIENT_SECRET   … Google OAuth2 クライアントシークレット
 *       GDRIVE_REFRESH_TOKEN   … Google OAuth2 リフレッシュトークン
 *       GDRIVE_FOLDER_ID       … Google Drive 保存先フォルダ ID
 *       BACKUP_HEROKU_TOKEN    … Heroku API トークン
 *       BACKUP_APP_NAME        … Heroku アプリ名 (hr-system-2025)
 *
 * 実行:
 *   node scripts/backup-to-gdrive.js
 */

const { google } = require('googleapis');
const https = require('https');
const http = require('http');
const { Readable } = require('stream');

// ─── Config ───────────────────────────────────────────────────
const HEROKU_API_KEY = process.env.BACKUP_HEROKU_TOKEN;
const HEROKU_APP_NAME = process.env.BACKUP_APP_NAME || 'hr-system-2025';
const GDRIVE_FOLDER_ID = process.env.GDRIVE_FOLDER_ID || '1GfaWtU6MPFsQGQk-jT9JBGWtUjOgO1Xo';
const GDRIVE_CLIENT_ID = process.env.GDRIVE_CLIENT_ID;
const GDRIVE_CLIENT_SECRET = process.env.GDRIVE_CLIENT_SECRET;
const GDRIVE_REFRESH_TOKEN = process.env.GDRIVE_REFRESH_TOKEN;

// ─── Helpers ──────────────────────────────────────────────────
function log(msg) {
  console.log(`[backup-to-gdrive] ${new Date().toISOString()} ${msg}`);
}

/**
 * OAuth2 クライアントを生成（リフレッシュトークン方式）
 */
function createOAuth2Client() {
  const oauth2Client = new google.auth.OAuth2(
    GDRIVE_CLIENT_ID,
    GDRIVE_CLIENT_SECRET
  );
  oauth2Client.setCredentials({
    refresh_token: GDRIVE_REFRESH_TOKEN,
  });
  return oauth2Client;
}

/**
 * Heroku API: 最新バックアップの署名付きダウンロード URL を取得
 */
async function getLatestBackupUrl() {
  // Step 1: transfers 一覧を取得 (postgres-api.heroku.com)
  const transfers = await httpRequest({
    hostname: 'postgres-api.heroku.com',
    path: `/client/v11/apps/${HEROKU_APP_NAME}/transfers`,
    method: 'GET',
    headers: {
      Authorization: `Bearer ${HEROKU_API_KEY}`,
      Accept: 'application/vnd.heroku+json; version=3',
    },
  });

  const list = JSON.parse(transfers);
  const completed = list
    .filter((t) => t.succeeded && t.num)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  if (completed.length === 0) {
    throw new Error('No completed backups found');
  }
  const latest = completed[0];
  log(`Latest backup: #${latest.num} (${latest.source_bytes} bytes, ${latest.created_at})`);

  // Step 2: 署名付きダウンロード URL を取得
  const urlData = await httpRequest({
    hostname: 'postgres-api.heroku.com',
    path: `/client/v11/apps/${HEROKU_APP_NAME}/transfers/${latest.num}/actions/public-url`,
    method: 'POST',
    headers: {
      Authorization: `Bearer ${HEROKU_API_KEY}`,
      Accept: 'application/vnd.heroku+json; version=3',
    },
  });

  const { url } = JSON.parse(urlData);
  return { url, num: latest.num, createdAt: latest.created_at, bytes: latest.source_bytes };
}

/**
 * 汎用 HTTPS リクエスト
 */
function httpRequest(options) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
        resolve(data);
      });
    });
    req.on('error', reject);
    req.end();
  });
}

/**
 * URL からデータを Buffer としてダウンロード (リダイレクト対応)
 */
function downloadBuffer(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, (res) => {
      // リダイレクト対応
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadBuffer(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Download failed with status ${res.statusCode}`));
      }
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    });
    req.on('error', reject);
  });
}

/**
 * Google Drive に Buffer をアップロード（OAuth2 リフレッシュトークン方式）
 */
async function uploadToGDrive(buffer, fileName) {
  const auth = createOAuth2Client();
  const drive = google.drive({ version: 'v3', auth });

  const fileMetadata = {
    name: fileName,
    parents: [GDRIVE_FOLDER_ID],
  };

  const media = {
    mimeType: 'application/octet-stream',
    body: Readable.from(buffer),
  };

  const response = await drive.files.create({
    requestBody: fileMetadata,
    media,
    fields: 'id, name, size, webViewLink',
  });

  return response.data;
}

// ─── Main ─────────────────────────────────────────────────────
async function main() {
  log('Starting backup → Google Drive upload...');

  // バリデーション
  if (!HEROKU_API_KEY) throw new Error('BACKUP_HEROKU_TOKEN is not set');
  if (!GDRIVE_CLIENT_ID) throw new Error('GDRIVE_CLIENT_ID is not set');
  if (!GDRIVE_CLIENT_SECRET) throw new Error('GDRIVE_CLIENT_SECRET is not set');
  if (!GDRIVE_REFRESH_TOKEN) throw new Error('GDRIVE_REFRESH_TOKEN is not set');
  if (!GDRIVE_FOLDER_ID) throw new Error('GDRIVE_FOLDER_ID is not set');

  // 1. 最新バックアップの URL を取得
  const backup = await getLatestBackupUrl();
  log(`Downloading backup #${backup.num} (created: ${backup.createdAt})...`);

  // 2. ダウンロード
  const buffer = await downloadBuffer(backup.url);
  log(`Downloaded ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);

  // 3. Google Drive にアップロード
  const jstDate = new Date().toLocaleDateString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).replace(/\//g, '-');
  const fileName = `hr-system-backup_${jstDate}.dump`;

  log(`Uploading to Google Drive as "${fileName}"...`);
  const file = await uploadToGDrive(buffer, fileName);
  log(`✅ Uploaded: ${file.name} (${file.size} bytes)`);
  log(`   View: ${file.webViewLink}`);

  // 4. 古いバックアップの自動削除（30日以上前のファイルを削除）
  await cleanupOldBackups();

  log('Done!');
}

/**
 * 30日以上前のバックアップファイルを Google Drive から削除
 */
async function cleanupOldBackups() {
  try {
    const auth = createOAuth2Client();
    const drive = google.drive({ version: 'v3', auth });

    // 30日前の日付
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoff = thirtyDaysAgo.toISOString();

    const res = await drive.files.list({
      q: `'${GDRIVE_FOLDER_ID}' in parents and name contains 'hr-system-backup_' and createdTime < '${cutoff}' and trashed = false`,
      fields: 'files(id, name, createdTime)',
      orderBy: 'createdTime asc',
    });

    const oldFiles = res.data.files || [];
    if (oldFiles.length === 0) {
      log('No old backups to clean up.');
      return;
    }

    for (const file of oldFiles) {
      await drive.files.delete({ fileId: file.id });
      log(`🗑️ Deleted old backup: ${file.name} (${file.createdTime})`);
    }
    log(`Cleaned up ${oldFiles.length} old backup(s).`);
  } catch (err) {
    // クリーンアップ失敗はメインの処理を止めない
    log(`⚠️ Cleanup failed (non-fatal): ${err.message}`);
  }
}

main().catch((err) => {
  console.error(`[backup-to-gdrive] ERROR: ${err.message}`);
  process.exit(1);
});
