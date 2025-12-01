'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface AutoBackupContextType {
  lastBackupTime: Date | null;
  backupInProgress: boolean;
  triggerBackup: (reason: string) => Promise<void>;
  backupStatus: {
    enabled: boolean;
    backupDir: string;
  };
}

const AutoBackupContext = createContext<AutoBackupContextType | null>(null);

export function useAutoBackup() {
  const context = useContext(AutoBackupContext);
  if (!context) {
    throw new Error('useAutoBackup must be used within an AutoBackupProvider');
  }
  return context;
}

interface AutoBackupProviderProps {
  children: React.ReactNode;
}

export function AutoBackupProvider({ children }: AutoBackupProviderProps) {
  const [lastBackupTime, setLastBackupTime] = useState<Date | null>(null);
  const [backupInProgress, setBackupInProgress] = useState(false);
  const [backupStatus, setBackupStatus] = useState({
    enabled: false,
    backupDir: 'backups'
  });

  // バックアップを実行
  const triggerBackup = async (reason: string) => {
    if (backupInProgress) {
      console.log('⏭️  バックアップが既に実行中です');
      return;
    }

    setBackupInProgress(true);
    
    try {
      console.log(`🔄 クライアント側からバックアップを実行 (理由: ${reason})`);
      
      // サーバーサイドのバックアップAPIを呼び出し
      const response = await fetch('/api/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason })
      });

      if (response.ok) {
        const result = await response.json();
        setLastBackupTime(new Date());
        console.log('✅ バックアップが完了しました');
      } else {
        console.error('❌ バックアップに失敗しました');
      }
    } catch (error) {
      console.error('❌ バックアップエラー:', error);
    } finally {
      setBackupInProgress(false);
    }
  };

  // アプリケーション起動時の自動バックアップ
  useEffect(() => {
    const runStartupBackup = async () => {
      // 最後のバックアップから1時間以内の場合はスキップ
      if (lastBackupTime && 
          Date.now() - lastBackupTime.getTime() < 60 * 60 * 1000) {
        console.log('⏭️  起動時バックアップをスキップ（1時間以内に実行済み）');
        return;
      }

      // 環境変数で自動バックアップが有効な場合のみ実行
      if (process.env.NEXT_PUBLIC_AUTO_BACKUP === 'true') {
        await triggerBackup('startup');
      }
    };

    // 少し遅延してから実行（アプリケーションの初期化を待つ）
    const timer = setTimeout(runStartupBackup, 5000);
    
    return () => clearTimeout(timer);
  }, []);

  // バックアップ状態を取得
  useEffect(() => {
    const fetchBackupStatus = async () => {
      try {
        const response = await fetch('/api/backup/status');
        if (response.ok) {
          const status = await response.json();
          setBackupStatus(status);
        }
      } catch (error) {
        console.error('❌ バックアップ状態の取得エラー:', error);
      }
    };

    fetchBackupStatus();
  }, []);

  const contextValue: AutoBackupContextType = {
    lastBackupTime,
    backupInProgress,
    triggerBackup,
    backupStatus
  };

  return (
    <AutoBackupContext.Provider value={contextValue}>
      {children}
    </AutoBackupContext.Provider>
  );
}





