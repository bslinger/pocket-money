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
  users?: User[];
  /** Parents/carers linked to this family, with their role on the pivot */
  family_users?: (FamilyUser & { user: User })[];
  spenders?: Spender[];
  created_at: string;
  updated_at: string;
}

export interface FamilyUser {
  id: string;
  family_id: string;
  user_id: string;
  role: 'admin' | 'member';
  user?: User;
  family?: Family;
}

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
  balance: string;
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
  type: 'credit' | 'debit';
  amount: string;
  description: string | null;
  image_key: string | null;
  image_url: string | null;
  transfer_group_id: string | null;
  occurred_at: string;
  created_at: string;
}

export interface RecurringTransaction {
  id: string;
  account_id: string;
  type: 'credit' | 'debit';
  amount: string;
  description: string | null;
  frequency: 'daily' | 'weekly' | 'fortnightly' | 'monthly' | 'yearly';
  frequency_config: Record<string, unknown> | null;
  next_run_at: string;
  is_active: boolean;
}

export interface Chore {
  id: string;
  family_id: string;
  name: string;
  emoji: string | null;
  reward_type: 'earns' | 'responsibility' | 'no_reward';
  amount: string | null;
  frequency: 'daily' | 'weekly' | 'monthly' | 'one_off';
  days_of_week: number[] | null;
  requires_approval: boolean;
  up_for_grabs: boolean;
  is_active: boolean;
  spenders?: Spender[];
  completions?: ChoreCompletion[];
  created_at: string;
  updated_at: string;
}

export interface ChoreCompletion {
  id: string;
  chore_id: string;
  spender_id: string;
  status: 'pending' | 'approved' | 'declined';
  completed_at: string;
  reviewed_at: string | null;
  note: string | null;
  transaction_id: string | null;
  chore?: Chore;
  spender?: Spender;
  created_at: string;
  updated_at: string;
}

export interface PocketMoneyScheduleSplit {
  id: string;
  pocket_money_schedule_id: string;
  account_id: string;
  percentage: string; // decimal:4
  sort_order: number;
  account?: Account;
}

export interface PocketMoneySchedule {
  id: string;
  spender_id: string;
  account_id: string | null;
  amount: string;
  frequency: 'weekly' | 'monthly';
  day_of_week: number | null;
  day_of_month: number | null;
  is_active: boolean;
  next_run_at: string | null;
  account?: Account | null;
  splits?: PocketMoneyScheduleSplit[];
  created_at: string;
  updated_at: string;
}

export interface ChoreReward {
  id: string;
  spender_id: string;
  account_id: string | null;
  amount: string;
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

export interface SavingsGoal {
  id: string;
  spender_id: string;
  account_id: string | null;
  name: string;
  target_amount: string;
  allocated_amount: string;
  sort_order: number;
  image_key: string | null;
  image_url: string | null;
  target_date: string | null;
  is_completed: boolean;
  completed_at: string | null;
  abandoned_at: string | null;
  abandoned_allocated_amount: string | null;
  spender?: Spender;
  account?: Account | null;
  created_at: string;
  updated_at: string;
}
