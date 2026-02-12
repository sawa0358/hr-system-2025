# 本番DB復元（v3.7.0 デプロイ前バックアップ）

デプロイ前のフルバックアップからロールバックする際のコマンドです。

## バックアップ情報

- **日時:** 2026-02-12 14:09（デプロイ直前に取得）
- **HerokuバックアップID:** b035
- **ローカルダンプ:** `production_data_backup/production-heroku-backup-20260212_140920.dump`

## 復元コマンド

### 方法1: Heroku上のバックアップ b035 から復元（最も簡単）

```bash
heroku pg:backups:restore b035 DATABASE_URL --app hr-system-2025 --confirm hr-system-2025
```

### 方法2: ローカルダンプから復元（ダンプファイルをHerokuに送る）

```bash
heroku pg:backups:restore 'https://（ダンプを置いたURL）' DATABASE_URL --app hr-system-2025
```

※ ローカルファイルを直接指定する場合は、先にダンプをS3などにアップロードしてURLを取得する必要があります。

### 方法3: 復元スクリプトを使う（ローカルにダンプがある場合）

```bash
./scripts/restore-production-from-heroku-backup.sh production_data_backup/production-heroku-backup-20260212_140920.dump
```

※ 実行時に `yes` → `YES` の二重確認が出ます。本番DBが上書きされます。

---

復元後は必要に応じてアプリをロールバック（`git revert` や以前のコミットへデプロイ）してください。
