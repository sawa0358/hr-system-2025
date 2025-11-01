// 有給管理設定（AppConfig）の型定義とユーティリティ関数
// 設計メモ準拠

export type EmploymentType = 'FULL_TIME' | 'PART_TIME';

export type BaselineRule =
  | { kind: 'ANNIVERSARY'; offsetMonths: number } // 入社日の毎年 + offset
  | { kind: 'FIXED_MONTH_DAY'; month: number; day: number } // 毎年X月Y日
  | { kind: 'RELATIVE_FROM_JOIN'; initialGrantAfterMonths: number; cycleMonths: number }; 
  // 例: 初回6ヶ月, 以降12ヶ月など

export type GrantTableRowFT = { years: number; days: number }; // 正社員: 勤続年数→付与日数
export type WeeklyPatternPT = 1 | 2 | 3 | 4; // 週の所定勤務日数
export type GrantTablePT = {
  weeklyPattern: WeeklyPatternPT;
  // 勤続年数ごとの付与日数（0.5, 1.5, ...など UIで可変）
  grants: Array<{ years: number; days: number }>;
  // 最小/最大年間労働日数等は情報として保持（計算には使わない or バリデーションで使用）
  minAnnualWorkdays?: number;
  maxAnnualWorkdays?: number;
};

export type ExpiryRule =
  | { kind: 'YEARS'; years: number } // 付与からn年後の前日まで有効
  | { kind: 'MONTHS'; months: number } // 例: 24ヶ月
  | { kind: 'END_OF_FY'; monthsValid: number }; // 会社FY末まで等、必要なら拡張

export type RoundingRule = 
  | { unit: 'DAY'; mode: 'FLOOR' | 'ROUND' | 'CEIL' }
  | { unit: 'HOUR'; mode: 'FLOOR' | 'ROUND' | 'CEIL'; minutesStep: 30 };

export type AlertRule = {
  // 「次の付与基準日までにXヶ月前時点でY日消費していない」条件を複数持てる
  checkpoints: Array<{ monthsBefore: number; minConsumedDays: number }>;
  // 判定対象期間: 「現在の付与期間」内の消費合計で評価（詳細は後述）
  // 5日消化義務アラート表示対象: 1回の付与がこの日数以上の社員が対象（法改正対応のため設定可能）
  minGrantDaysForAlert: number; // デフォルト: 10日
};

export type AppConfig = {
  version: string;
  baselineRule: BaselineRule;
  grantCycleMonths: number; // 例: 12
  expiry: ExpiryRule;       // 例: 2年
  rounding: RoundingRule;   // 半休/時間休を使うならHOUR設定
  minLegalUseDaysPerYear: number; // 法定5日等の参考値
  fullTime: {
    label: string; // 正社員A
    table: GrantTableRowFT[]; // 勤続年数→付与日数
  };
  partTime: {
    labels: Record<WeeklyPatternPT, string>; // 表示用 B-1..B-4
    tables: GrantTablePT[]; // 週1..4のパターン
  };
  alert: AlertRule;
};

// デフォルト設定例
export const DEFAULT_APP_CONFIG: AppConfig = {
  version: '1.0.0',
  baselineRule: {
    kind: 'RELATIVE_FROM_JOIN',
    initialGrantAfterMonths: 6,
    cycleMonths: 12,
  },
  grantCycleMonths: 12,
  expiry: { kind: 'YEARS', years: 2 },
  rounding: { unit: 'DAY', mode: 'ROUND' },
  minLegalUseDaysPerYear: 5,
  fullTime: {
    label: 'A',
    table: [
      { years: 0.5, days: 10 },
      { years: 1.5, days: 11 },
      { years: 2.5, days: 12 },
      { years: 3.5, days: 14 },
      { years: 4.5, days: 16 },
      { years: 5.5, days: 18 },
      { years: 6.5, days: 20 },
    ],
  },
  partTime: {
    labels: {
      1: 'B-1',
      2: 'B-2',
      3: 'B-3',
      4: 'B-4',
    },
    tables: [
      {
        weeklyPattern: 1,
        grants: [
          { years: 0.5, days: 7 },
          { years: 1.5, days: 8 },
          { years: 2.5, days: 9 },
        ],
      },
      {
        weeklyPattern: 2,
        grants: [
          { years: 0.5, days: 7 },
          { years: 1.5, days: 8 },
          { years: 2.5, days: 9 },
        ],
      },
      {
        weeklyPattern: 3,
        grants: [
          { years: 0.5, days: 7 },
          { years: 1.5, days: 8 },
          { years: 2.5, days: 9 },
        ],
      },
      {
        weeklyPattern: 4,
        grants: [
          { years: 0.5, days: 7 },
          { years: 1.5, days: 8 },
          { years: 2.5, days: 9 },
        ],
      },
    ],
  },
  alert: {
    checkpoints: [
      { monthsBefore: 3, minConsumedDays: 5 },
      { monthsBefore: 2, minConsumedDays: 3 },
      { monthsBefore: 1, minConsumedDays: 5 },
    ],
    minGrantDaysForAlert: 10, // 1回の付与が10日以上の社員がアラート対象
  },
};

// AppConfigの保存と読み込み
export async function saveAppConfig(config: AppConfig): Promise<void> {
  const { prisma } = await import('@/lib/prisma');
  
  try {
    // JSONシリアライズ
    const configJson = JSON.stringify(config);
    
    // バリデーション: versionが空でないことを確認
    if (!config.version || config.version.trim() === '') {
      throw new Error('設定バージョンが指定されていません');
    }

    // バリデーション: configJsonが空でないことを確認
    if (!configJson || configJson === '{}') {
      throw new Error('設定データが空です');
    }

    await prisma.vacationAppConfig.upsert({
      where: { version: config.version },
      create: {
        version: config.version,
        configJson: configJson,
        isActive: false, // 手動で有効化
      },
      update: {
        configJson: configJson,
      },
    });
  } catch (error: any) {
    // Prismaエラーを再スロー（詳細情報を含める）
    if (error?.code) {
      error.prismaCode = error.code;
    }
    throw error;
  }
}

export async function loadAppConfig(version?: string): Promise<AppConfig> {
  const { prisma } = await import('@/lib/prisma');
  
  try {
    if (version) {
      const config = await prisma.vacationAppConfig.findUnique({
        where: { version },
      });
      if (config) {
        return JSON.parse(config.configJson) as AppConfig;
      }
    }
    
    // アクティブな設定を探す
    const activeConfig = await prisma.vacationAppConfig.findFirst({
      where: { isActive: true },
    });
    if (activeConfig) {
      return JSON.parse(activeConfig.configJson) as AppConfig;
    }
  } catch (error: any) {
    // テーブルが存在しない場合やその他のエラーは無視してデフォルト設定を返す
    console.warn('loadAppConfig error (fallback to default):', error?.message || error);
  }
  
  // デフォルト設定を返す
  return DEFAULT_APP_CONFIG;
}

export async function getActiveConfigVersion(): Promise<string | null> {
  const { prisma } = await import('@/lib/prisma');
  const active = await prisma.vacationAppConfig.findFirst({
    where: { isActive: true },
  });
  return active?.version ?? null;
}

