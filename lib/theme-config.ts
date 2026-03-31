// テーマ設定ファイル
// SEO-Auto-Writer-Pro のテーマを HR-system 向けに移植

export interface ThemeDefinition {
  id: string
  label: string
  icon: string
  description: string
  fonts: string[]       // Google Fonts URLs
  className: string     // <html> に適用するクラス名
}

export const THEMES: ThemeDefinition[] = [
  {
    id: 'default',
    label: 'デフォルト',
    icon: '🔵',
    description: 'シンプル・業務ツール風',
    fonts: [],
    className: '',
  },
  {
    id: 'wamon',
    label: '和モダン',
    icon: '🎋',
    description: '日本の伝統色・和紙テクスチャ',
    fonts: ['https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;700&family=Zen+Kaku+Gothic+New:wght@400;500;700&display=swap'],
    className: 'theme-wamon',
  },
  {
    id: 'glass',
    label: 'グラスモーフィズム',
    icon: '🔮',
    description: '半透明・ぼかし・グラデーション',
    fonts: ['https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'],
    className: 'theme-glass',
  },
  {
    id: 'stripe',
    label: 'Stripe風',
    icon: '💳',
    description: 'FinTech・ダークネイビー',
    fonts: ['https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'],
    className: 'theme-stripe',
  },
  {
    id: 'darkneon',
    label: 'ダークネオン',
    icon: '⚡',
    description: 'ダークモード・ネオン発光',
    fonts: ['https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'],
    className: 'theme-darkneon',
  },
  {
    id: 'nordic',
    label: '北欧ナチュラル',
    icon: '🌿',
    description: '自然素材・リネン・テラコッタ',
    fonts: ['https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap'],
    className: 'theme-nordic',
  },
  {
    id: 'pop',
    label: 'ポップ',
    icon: '🎨',
    description: 'ポルカドット・ビビッドカラー',
    fonts: ['https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@400;500;700;800&display=swap'],
    className: 'theme-pop',
  },
  {
    id: 'showa',
    label: '昭和レトロ',
    icon: '📺',
    description: 'ブラウン・クリーム・二重線ボーダー',
    fonts: ['https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@400;500;700&display=swap'],
    className: 'theme-showa',
  },
  {
    id: 'comic',
    label: 'アメコミ',
    icon: '💥',
    description: '黄×赤×黒・角ばり・ハーフトーン',
    fonts: ['https://fonts.googleapis.com/css2?family=Dela+Gothic+One&display=swap'],
    className: 'theme-comic',
  },
]

export const THEME_STORAGE_KEY = 'hr-system-theme'
export const DEFAULT_THEME_ID = 'default'

export function getThemeById(id: string): ThemeDefinition {
  return THEMES.find(t => t.id === id) ?? THEMES[0]
}
