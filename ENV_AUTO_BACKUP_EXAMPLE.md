# 自動バックアップ環境変数設定例

## .env ファイルに追加する設定

```bash
# 自動バックアップ設定
AUTO_BACKUP=true
AUTO_BACKUP_CONFIG='{"enabled":true,"backupDir":"backups","retentionDays":30,"maxBackups":50,"compress":true,"triggers":{"onStartup":true,"onEmployeeUpdate":false,"onFileUpload":false,"onDaily":true}}'

# クライアント側自動バックアップ（開発時は無効化推奨）
NEXT_PUBLIC_AUTO_BACKUP=false
```

## 設定項目の説明

### AUTO_BACKUP
- **true**: 自動バックアップを有効化
- **false**: 自動バックアップを無効化
- **デフォルト**: 本番環境では有効、開発環境では無効

### AUTO_BACKUP_CONFIG
JSON形式でバックアップの詳細設定を指定

```json
{
  "enabled": true,                    // 自動バックアップの有効/無効
  "backupDir": "backups",             // バックアップ保存ディレクトリ
  "retentionDays": 30,                // バックアップ保持期間（日数）
  "maxBackups": 50,                   // 最大バックアップ数
  "compress": true,                   // 圧縮するかどうか
  "triggers": {
    "onStartup": true,                // アプリ起動時のバックアップ
    "onEmployeeUpdate": false,        // 社員データ更新時のバックアップ
    "onFileUpload": false,            // ファイルアップロード時のバックアップ
    "onDaily": true                   // 日次バックアップ
  }
}
```

### NEXT_PUBLIC_AUTO_BACKUP
- **true**: クライアント側から自動バックアップを実行
- **false**: クライアント側の自動バックアップを無効化
- **推奨**: 開発時はfalse、本番環境ではtrue

## 環境別推奨設定

### 開発環境
```bash
AUTO_BACKUP=false
NEXT_PUBLIC_AUTO_BACKUP=false
```

### 本番環境
```bash
AUTO_BACKUP=true
NEXT_PUBLIC_AUTO_BACKUP=true
AUTO_BACKUP_CONFIG='{"enabled":true,"backupDir":"backups","retentionDays":30,"maxBackups":50,"compress":true,"triggers":{"onStartup":true,"onEmployeeUpdate":false,"onFileUpload":false,"onDaily":true}}'
```











