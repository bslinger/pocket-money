// =============================================================================
// @quiddo/shared — Zod schemas mirroring Laravel FormRequest validation rules
// Every schema matches the exact rules from app/Http/Requests/*.php
// =============================================================================

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

/** Mirrors LoginRequest */
export const loginSchema = z.object({
  email: z.string().min(1).email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof loginSchema>;

/** Mirrors RegisteredUserController@store inline validation */
export const registerSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().min(1).email().max(255),
  password: z.string().min(8),
  password_confirmation: z.string().min(8),
}).refine((data) => data.password === data.password_confirmation, {
  message: 'Passwords must match',
  path: ['password_confirmation'],
});
export type RegisterInput = z.infer<typeof registerSchema>;

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

/** Mirrors ProfileUpdateRequest */
export const profileUpdateSchema = z.object({
  name: z.string().min(1).max(255),
  parent_title: z.string().max(100).nullable().optional(),
  email: z.string().min(1).email().max(255),
});
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

/** Mirrors SettingsController@updateProfile inline validation */
export const settingsProfileSchema = z.object({
  display_name: z.string().max(255).nullable().optional(),
  parent_title: z.string().max(100).nullable().optional(),
  email: z.string().min(1).email().max(255),
  avatar_url: z.string().url().nullable().optional(),
});
export type SettingsProfileInput = z.infer<typeof settingsProfileSchema>;

// ---------------------------------------------------------------------------
// Family
// ---------------------------------------------------------------------------

/** Mirrors StoreFamilyRequest */
export const storeFamilySchema = z.object({
  name: z.string().min(1).max(255),
  avatar_url: z.string().url().max(255).nullable().optional(),
  currency_name: z.string().max(50).nullable().optional(),
  currency_name_plural: z.string().max(50).nullable().optional(),
  currency_symbol: z.string().max(10).nullable().optional(),
  use_integer_amounts: z.boolean().nullable().optional(),
  spenders: z.array(z.object({
    name: z.string().min(1).max(255),
    color: z.string().regex(hexColorRegex).nullable().optional(),
    balance: z.number().min(0).nullable().optional(),
  })).max(20).nullable().optional(),
});
export type StoreFamilyInput = z.infer<typeof storeFamilySchema>;

/** Mirrors FamilyController@invite inline validation */
export const inviteFamilyMemberSchema = z.object({
  email: z.string().min(1).email(),
});
export type InviteFamilyMemberInput = z.infer<typeof inviteFamilyMemberSchema>;

/** Mirrors FamilyController@updateMemberRole inline validation */
export const updateMemberRoleSchema = z.object({
  role: z.enum(['admin', 'member']),
});
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;

// ---------------------------------------------------------------------------
// Spender
// ---------------------------------------------------------------------------

/** Mirrors StoreSpenderRequest */
export const storeSpenderSchema = z.object({
  family_id: z.string().uuid(),
  name: z.string().min(1).max(255),
  avatar_key: z.string().max(500).nullable().optional(),
  color: z.string().regex(hexColorRegex).nullable().optional(),
  currency_name: z.string().max(50).nullable().optional(),
  currency_name_plural: z.string().max(50).nullable().optional(),
  currency_symbol: z.string().max(10).nullable().optional(),
  use_integer_amounts: z.boolean().nullable().optional(),
});
export type StoreSpenderInput = z.infer<typeof storeSpenderSchema>;

/** Mirrors SpenderController@linkChild inline validation */
export const linkChildSchema = z.object({
  email: z.string().min(1).email(),
});
export type LinkChildInput = z.infer<typeof linkChildSchema>;

// ---------------------------------------------------------------------------
// Account
// ---------------------------------------------------------------------------

/** Mirrors StoreAccountRequest */
export const storeAccountSchema = z.object({
  name: z.string().min(1).max(255),
  currency_name: z.string().max(50).nullable().optional(),
  currency_name_plural: z.string().max(50).nullable().optional(),
  currency_symbol: z.string().max(10).nullable().optional(),
  use_integer_amounts: z.boolean().nullable().optional(),
});
export type StoreAccountInput = z.infer<typeof storeAccountSchema>;

// ---------------------------------------------------------------------------
// Transaction
// ---------------------------------------------------------------------------

/** Mirrors StoreTransactionRequest */
export const storeTransactionSchema = z.object({
  type: z.enum(['credit', 'debit']),
  amount: z.number().min(0.01),
  description: z.string().max(255).nullable().optional(),
  image_key: z.string().max(500).nullable().optional(),
  occurred_at: z.string().min(1), // ISO date string
});
export type StoreTransactionInput = z.infer<typeof storeTransactionSchema>;

/** Mirrors StoreSplitTransactionRequest */
export const storeSplitTransactionSchema = z.object({
  description: z.string().max(255).nullable().optional(),
  occurred_at: z.string().min(1),
  splits: z.array(z.object({
    account_id: z.string().uuid(),
    amount: z.number().min(0.01),
  })).min(2),
});
export type StoreSplitTransactionInput = z.infer<typeof storeSplitTransactionSchema>;

// ---------------------------------------------------------------------------
// Transfer
// ---------------------------------------------------------------------------

/** Mirrors StoreTransferRequest */
export const storeTransferSchema = z.object({
  to_account_id: z.string().uuid(),
  amount: z.number().min(0.01),
  description: z.string().max(255).nullable().optional(),
});
export type StoreTransferInput = z.infer<typeof storeTransferSchema>;

// ---------------------------------------------------------------------------
// Recurring Transaction
// ---------------------------------------------------------------------------

/** Mirrors StoreRecurringTransactionRequest */
export const storeRecurringTransactionSchema = z.object({
  type: z.enum(['credit', 'debit']),
  amount: z.number().min(0.01),
  description: z.string().max(255).nullable().optional(),
  frequency: z.enum(['daily', 'weekly', 'fortnightly', 'monthly', 'yearly']),
  frequency_config: z.record(z.unknown()).nullable().optional(),
  next_run_at: z.string().min(1),
});
export type StoreRecurringTransactionInput = z.infer<typeof storeRecurringTransactionSchema>;

// ---------------------------------------------------------------------------
// Savings Goal
// ---------------------------------------------------------------------------

/** Mirrors StoreSavingsGoalRequest */
export const storeSavingsGoalSchema = z.object({
  name: z.string().min(1).max(255),
  target_amount: z.number().min(0.01),
  account_id: z.string().uuid(),
  image_key: z.string().max(500).nullable().optional(),
  target_date: z.string().nullable().optional(), // ISO date string
});
export type StoreSavingsGoalInput = z.infer<typeof storeSavingsGoalSchema>;

/** Mirrors SavingsGoalController@reorder inline validation */
export const reorderGoalsSchema = z.object({
  goal_ids: z.array(z.string().uuid()),
});
export type ReorderGoalsInput = z.infer<typeof reorderGoalsSchema>;

// ---------------------------------------------------------------------------
// Chore
// ---------------------------------------------------------------------------

/** Mirrors StoreChoreRequest */
export const storeChoreSchema = z.object({
  family_id: z.string().uuid(),
  name: z.string().min(1).max(255),
  emoji: z.string().max(10).nullable().optional(),
  reward_type: z.enum(['earns', 'responsibility', 'no_reward']),
  amount: z.number().min(0.01).nullable().optional(), // required when reward_type is 'earns'
  frequency: z.enum(['daily', 'weekly', 'monthly', 'one_off']),
  days_of_week: z.array(z.number().int().min(0).max(6)).nullable().optional(),
  requires_approval: z.boolean().optional(),
  up_for_grabs: z.boolean().optional(),
  is_active: z.boolean().optional(),
  spender_ids: z.array(z.string().uuid()).min(1),
}).refine(
  (data) => data.reward_type !== 'earns' || (data.amount != null && data.amount > 0),
  { message: 'Amount is required when reward type is earns', path: ['amount'] },
);
export type StoreChoreInput = z.infer<typeof storeChoreSchema>;

/** Mirrors ChoreCompletionController@store inline validation */
export const completeChoreSchema = z.object({
  spender_id: z.string().uuid(),
});
export type CompleteChoreInput = z.infer<typeof completeChoreSchema>;

/** Mirrors ChoreCompletionController@decline inline validation */
export const declineCompletionSchema = z.object({
  note: z.string().max(255).nullable().optional(),
});
export type DeclineCompletionInput = z.infer<typeof declineCompletionSchema>;

/** Mirrors ChoreCompletionController@bulkApprove inline validation */
export const bulkApproveSchema = z.object({
  ids: z.array(z.string().uuid()),
});
export type BulkApproveInput = z.infer<typeof bulkApproveSchema>;

// ---------------------------------------------------------------------------
// Pocket Money
// ---------------------------------------------------------------------------

/** Mirrors PocketMoneyScheduleController@store inline validation */
export const storePocketMoneyScheduleSchema = z.object({
  amount: z.number().min(0.01),
  frequency: z.enum(['weekly', 'monthly']),
  day_of_week: z.number().int().min(0).max(6).nullable().optional(),
  day_of_month: z.number().int().min(1).max(31).nullable().optional(),
  account_id: z.string().uuid().nullable().optional(),
});
export type StorePocketMoneyScheduleInput = z.infer<typeof storePocketMoneyScheduleSchema>;

/** Mirrors PocketMoneyReleaseController@pay inline validation */
export const payPocketMoneySchema = z.object({
  spender_id: z.string().uuid(),
  amount: z.number().min(0.01),
});
export type PayPocketMoneyInput = z.infer<typeof payPocketMoneySchema>;

// ---------------------------------------------------------------------------
// Billing
// ---------------------------------------------------------------------------

/** Mirrors BillingController@checkout inline validation */
export const checkoutSchema = z.object({
  plan: z.enum(['monthly', 'yearly']),
  family_id: z.string().uuid(),
});
export type CheckoutInput = z.infer<typeof checkoutSchema>;

/** Mirrors BillingTransferController@initiate inline validation */
export const billingTransferSchema = z.object({
  email: z.string().min(1).email(),
});
export type BillingTransferInput = z.infer<typeof billingTransferSchema>;

// ---------------------------------------------------------------------------
// Onboarding
// ---------------------------------------------------------------------------

/** Mirrors OnboardingController@storePocketMoney inline validation */
export const onboardingPocketMoneySchema = z.object({
  schedules: z.array(z.object({
    spender_id: z.string().uuid(),
    amount: z.number().min(0.01),
    frequency: z.enum(['weekly', 'monthly']),
    day_of_week: z.number().int().min(0).max(6).nullable().optional(),
    day_of_month: z.number().int().min(1).max(31).nullable().optional(),
  })),
});
export type OnboardingPocketMoneyInput = z.infer<typeof onboardingPocketMoneySchema>;

/** Mirrors OnboardingController@storeChores inline validation */
export const onboardingChoresSchema = z.object({
  chores: z.array(z.object({
    name: z.string().min(1).max(255),
    emoji: z.string().max(10).nullable().optional(),
    reward_type: z.enum(['earns', 'responsibility', 'no_reward']),
    amount: z.number().min(0.01).nullable().optional(),
    frequency: z.enum(['daily', 'weekly', 'monthly', 'one_off']),
    spender_ids: z.array(z.string().uuid()).min(1),
  })),
});
export type OnboardingChoresInput = z.infer<typeof onboardingChoresSchema>;

// ---------------------------------------------------------------------------
// Device token (new for mobile push notifications)
// ---------------------------------------------------------------------------

export const registerDeviceTokenSchema = z.object({
  token: z.string().min(1),
  platform: z.enum(['ios', 'android']),
});
export type RegisterDeviceTokenInput = z.infer<typeof registerDeviceTokenSchema>;

// ---------------------------------------------------------------------------
// Password
// ---------------------------------------------------------------------------

export const updatePasswordSchema = z.object({
  current_password: z.string().min(1),
  password: z.string().min(8),
  password_confirmation: z.string().min(8),
}).refine((data) => data.password === data.password_confirmation, {
  message: 'Passwords must match',
  path: ['password_confirmation'],
});
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
