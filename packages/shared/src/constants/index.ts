// =============================================================================
// @quiddo/shared — Constants and enums derived from the existing codebase
// =============================================================================

// ---------------------------------------------------------------------------
// Enum values (match Laravel app/Enums/)
// ---------------------------------------------------------------------------

export const TX_TYPES = ['credit', 'debit'] as const;

export const FREQUENCIES = ['daily', 'weekly', 'fortnightly', 'monthly', 'yearly'] as const;

export const CHORE_FREQUENCIES = ['daily', 'weekly', 'monthly', 'one_off'] as const;

export const CHORE_REWARD_TYPES = ['earns', 'responsibility', 'no_reward'] as const;

export const COMPLETION_STATUSES = ['pending', 'approved', 'declined'] as const;

export const FAMILY_ROLES = ['admin', 'member'] as const;

export const POCKET_MONEY_FREQUENCIES = ['weekly', 'monthly'] as const;

// ---------------------------------------------------------------------------
// Days of week (used by chores and pocket money schedules)
// 0=Monday…6=Sunday — matches Laravel's Carbon::dayOfWeekIso - 1 convention
// ---------------------------------------------------------------------------

export const DAYS_OF_WEEK = [
  { value: 0, label: 'Mon', full: 'Monday' },
  { value: 1, label: 'Tue', full: 'Tuesday' },
  { value: 2, label: 'Wed', full: 'Wednesday' },
  { value: 3, label: 'Thu', full: 'Thursday' },
  { value: 4, label: 'Fri', full: 'Friday' },
  { value: 5, label: 'Sat', full: 'Saturday' },
  { value: 6, label: 'Sun', full: 'Sunday' },
] as const;

// ---------------------------------------------------------------------------
// Currency presets (from Accounts/Create and Families/Show UI)
// ---------------------------------------------------------------------------

export const REAL_CURRENCY_PRESETS = [
  { symbol: '$', name: 'Dollar', namePlural: 'Dollars' },
  { symbol: '£', name: 'Pound', namePlural: 'Pounds' },
  { symbol: '€', name: 'Euro', namePlural: 'Euros' },
  { symbol: '¥', name: 'Yen', namePlural: 'Yen' },
  { symbol: '₹', name: 'Rupee', namePlural: 'Rupees' },
  { symbol: 'kr', name: 'Krona', namePlural: 'Kronor' },
  { symbol: 'Fr', name: 'Franc', namePlural: 'Francs' },
  { symbol: 'R', name: 'Rand', namePlural: 'Rand' },
  { symbol: '₩', name: 'Won', namePlural: 'Won' },
  { symbol: '₪', name: 'Shekel', namePlural: 'Shekels' },
  { symbol: '₺', name: 'Lira', namePlural: 'Liras' },
  { symbol: '₿', name: 'Bitcoin', namePlural: 'Bitcoins' },
] as const;

/** Quick presets shown in the family settings UI (symbol + emoji) */
export const FAMILY_CURRENCY_PRESETS = ['$', '⭐', '🪙', '🏆'] as const;

// ---------------------------------------------------------------------------
// Spender colours (from the ColorPicker component)
// ---------------------------------------------------------------------------

export const SPENDER_COLORS = [
  '#EF4444', // red
  '#F97316', // orange
  '#EAB308', // yellow
  '#22C55E', // green
  '#14B8A6', // teal
  '#3B82F6', // blue
  '#6366F1', // indigo
  '#A855F7', // purple
  '#EC4899', // pink
  '#78716C', // stone
] as const;

// ---------------------------------------------------------------------------
// Design system — Eucalyptus palette
// ---------------------------------------------------------------------------

export const COLORS = {
  eucalyptus: {
    400: '#4A7C59',
    500: '#3D6B4C',
    600: '#2D5A3A',
  },
  bark: {
    100: '#F5F0E8',
    200: '#E8DFD2',
    600: '#8C7A60',
    700: '#3A3028',
  },
  gumleaf: {
    400: '#2A9E5C', // earn / approve — NEVER use for anything else
  },
  redearth: {
    400: '#C8483C', // spend / decline — NEVER use for anything else
  },
  wattle: {
    400: '#E8A030', // goals / balances / badges
  },
  nightsky: {
    900: '#081828', // kid view dark background
  },
} as const;

// ---------------------------------------------------------------------------
// Image upload constraints (from ImageUploadController)
// ---------------------------------------------------------------------------

export const IMAGE_MAX_SIZE_MB = 5;
export const IMAGE_MAX_SIZE_BYTES = IMAGE_MAX_SIZE_MB * 1024 * 1024;

// ---------------------------------------------------------------------------
// Billing
// ---------------------------------------------------------------------------

export const BILLING_PLANS = ['monthly', 'yearly'] as const;
export const TRIAL_DAYS = 14;

// ---------------------------------------------------------------------------
// Pagination defaults (from controllers)
// ---------------------------------------------------------------------------

export const TRANSACTIONS_PER_PAGE = 50;
export const COMPLETIONS_PER_PAGE = 30;
export const MAX_RECENT_ACTIVITY = 15;
export const MAX_SPENDERS_PER_FAMILY = 20;
