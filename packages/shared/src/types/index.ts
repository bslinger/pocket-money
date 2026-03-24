// =============================================================================
// @quiddo/shared — TypeScript interfaces for all API response shapes
// Derived from Laravel migrations, models, and existing Inertia prop types.
// Every field name matches exactly what Laravel returns.
// =============================================================================

// ---------------------------------------------------------------------------
// Enums (match Laravel app/Enums/)
// ---------------------------------------------------------------------------

export type TxType = 'credit' | 'debit';

export type Frequency = 'daily' | 'weekly' | 'fortnightly' | 'monthly' | 'yearly';

export type ChoreFrequency = 'daily' | 'weekly' | 'monthly' | 'one_off';

export type ChoreRewardType = 'earns' | 'responsibility' | 'no_reward';

export type CompletionStatus = 'pending' | 'approved' | 'declined';

export type FamilyRole = 'admin' | 'member';

export type PocketMoneyFrequency = 'weekly' | 'monthly';

// ---------------------------------------------------------------------------
// Core models
// ---------------------------------------------------------------------------

export interface User {
  id: string;
  name: string;
  display_name: string | null;
  parent_title: string | null;
  email: string;
  avatar_url: string | null;
  stripe_customer_id: string | null;
  email_verified_at: string | null;
}

export interface Family {
  id: string;
  name: string;
  avatar_url: string | null;
  currency_name: string;
  currency_name_plural: string | null;
  currency_symbol: string;
  use_integer_amounts: boolean;
  billing_user_id: string | null;
  users?: User[];
  family_users?: FamilyUserWithUser[];
  spenders?: Spender[];
  created_at: string;
  updated_at: string;
}

export interface FamilyUser {
  id: string;
  family_id: string;
  user_id: string;
  role: FamilyRole;
  user?: User;
  family?: Family;
}

/** FamilyUser with the user relation always loaded */
export type FamilyUserWithUser = FamilyUser & { user: User };

export interface Spender {
  id: string;
  family_id: string;
  name: string;
  avatar_url: string | null;
  color: string | null;
  currency_name: string | null;
  currency_name_plural: string | null;
  currency_symbol: string | null;
  use_integer_amounts: boolean | null;
  deleted_at: string | null;
  family?: Family;
  accounts?: Account[];
  savings_goals?: SavingsGoal[];
  chores?: Chore[];
  chore_completions?: ChoreCompletion[];
  users?: User[];
  created_at: string;
  updated_at: string;
}

export interface Account {
  id: string;
  spender_id: string;
  name: string;
  balance: string; // decimal:2 returned as string
  currency_name: string | null;
  currency_name_plural: string | null;
  currency_symbol: string | null;
  use_integer_amounts: boolean | null;
  spender?: Spender;
  transactions?: Transaction[];
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  account_id: string;
  type: TxType;
  amount: string; // decimal:2
  description: string | null;
  image_key: string | null;
  image_url: string | null; // computed from image_key
  transfer_group_id: string | null;
  occurred_at: string;
  created_by: string | null;
  account?: Account;
  created_at: string;
  updated_at: string;
}

export interface RecurringTransaction {
  id: string;
  account_id: string;
  type: TxType;
  amount: string; // decimal:2
  description: string | null;
  frequency: Frequency;
  frequency_config: Record<string, unknown> | null;
  next_run_at: string;
  is_active: boolean;
  created_by: string | null;
  account?: Account;
  created_at: string;
  updated_at: string;
}

export interface SavingsGoal {
  id: string;
  spender_id: string;
  account_id: string | null;
  name: string;
  target_amount: string; // decimal:2
  allocated_amount: string; // computed via cascade allocation
  sort_order: number;
  image_key: string | null;
  image_url: string | null; // computed from image_key
  target_date: string | null;
  is_completed: boolean;
  completed_at: string | null;
  abandoned_at: string | null;
  abandoned_allocated_amount: string | null; // snapshot at time of abandonment
  match_percentage: number | null; // 0-100, future parent-matching feature
  spender?: Spender;
  account?: Account | null;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Chores
// ---------------------------------------------------------------------------

export interface Chore {
  id: string;
  family_id: string;
  name: string;
  emoji: string | null;
  reward_type: ChoreRewardType;
  amount: string | null; // decimal:2, only set when reward_type is 'earns'
  frequency: ChoreFrequency;
  days_of_week: number[] | null; // 0=Mon…6=Sun
  requires_approval: boolean;
  up_for_grabs: boolean;
  is_active: boolean;
  created_by: string | null;
  spenders?: Spender[];
  completions?: ChoreCompletion[];
  created_at: string;
  updated_at: string;
}

export interface ChoreCompletion {
  id: string;
  chore_id: string;
  spender_id: string;
  status: CompletionStatus;
  completed_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  note: string | null;
  transaction_id: string | null;
  chore?: Chore;
  spender?: Spender;
  transaction?: Transaction;
  created_at: string;
  updated_at: string;
}

export interface ChoreReward {
  id: string;
  spender_id: string;
  account_id: string | null;
  amount: string; // decimal:2
  description: string | null;
  payout_date: string | null;
  is_paid: boolean;
  paid_at: string | null;
  transaction_id: string | null;
  account?: Account | null;
  chores?: Chore[];
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Pocket Money
// ---------------------------------------------------------------------------

export interface PocketMoneySchedule {
  id: string;
  spender_id: string;
  account_id: string | null;
  amount: string; // decimal:2
  frequency: PocketMoneyFrequency;
  day_of_week: number | null; // 0=Mon…6=Sun
  day_of_month: number | null; // 1-31
  is_active: boolean;
  next_run_at: string | null;
  account?: Account | null;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Invitations
// ---------------------------------------------------------------------------

export interface Invitation {
  id: string;
  family_id: string;
  email: string;
  token: string;
  role: string;
  expires_at: string;
  family?: Family;
  created_at: string;
  updated_at: string;
}

export interface ChildInvitation {
  id: string;
  spender_id: string;
  email: string;
  token: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BillingTransferInvitation {
  id: string;
  family_id: string;
  from_user_id: string;
  to_email: string;
  token: string;
  expires_at: string;
  family?: Family;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Auth / shared page props
// ---------------------------------------------------------------------------

export interface ActiveFamily {
  id: string;
  name: string;
  currency_name: string;
  currency_symbol: string;
  parents_count: number;
  kids_count: number;
}

export interface SubscriptionStatus {
  active: boolean;
  on_trial: boolean;
  trial_ends_at: string | null;
  subscribed: boolean;
  frozen: boolean;
}

export interface AuthProps {
  user: User;
  isParent: boolean;
  activeFamily: ActiveFamily | null;
  userFamilies: { id: string; name: string }[];
  viewingAsSpender: { id: string; name: string } | null;
  subscription: SubscriptionStatus | null;
}

// ---------------------------------------------------------------------------
// API response wrappers (for mobile API)
// ---------------------------------------------------------------------------

export interface ApiResponse<T> {
  data: T;
}

export interface ApiListResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface ApiErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
}

// ---------------------------------------------------------------------------
// Stripe / billing types used in frontend
// ---------------------------------------------------------------------------

export interface Price {
  id: string;
  amount: number;
  currency: string;
  interval: 'month' | 'year';
}

// ---------------------------------------------------------------------------
// Child device linking (QR code flow)
// ---------------------------------------------------------------------------

export interface SpenderLinkCode {
  id: string;
  code: string;
  spender_name: string;
  expires_at: string;
}

export interface SpenderDevice {
  id: string;
  device_name: string;
  last_active_at: string | null;
  created_at: string;
}

export interface ClaimDeviceResponse {
  token: string;
  device_id: string;
  spender: {
    id: string;
    name: string;
    color: string | null;
    family_name: string;
  };
}

export interface ChildDashboard {
  spender: {
    id: string;
    name: string;
    color: string | null;
    avatar_url: string | null;
    family_name: string;
  };
  balance: string;
  accounts: {
    id: string;
    name: string;
    balance: string;
  }[];
  goals: {
    id: string;
    name: string;
    target_amount: string;
    allocated_amount: string;
    target_date: string | null;
  }[];
  chores: {
    id: string;
    name: string;
    emoji: string | null;
    frequency: ChoreFrequency;
    amount: string | null;
    reward_type: ChoreRewardType;
  }[];
  completions_this_week: {
    id: string;
    chore_id: string;
    status: CompletionStatus;
    completed_at: string;
  }[];
}

// ---------------------------------------------------------------------------
// Push notifications
// ---------------------------------------------------------------------------

export interface PushToken {
  id: string;
  platform: 'ios' | 'android';
  created_at: string;
}
