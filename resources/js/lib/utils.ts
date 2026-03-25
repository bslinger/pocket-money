import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import pluralize from 'pluralize';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Format a numeric amount with a currency symbol.
 * Dollar amounts always show 2 decimal places; others show 0 if the value is
 * a whole number, 2 decimal places otherwise.
 */
export function formatAmount(amount: number | string, symbol = '$'): string {
    const num = parseFloat(String(amount));
    const decimals = symbol === '$' || !Number.isInteger(num) ? 2 : 0;
    return `${symbol}${num.toFixed(decimals)}`;
}

/**
 * Suggest a currency name from the names array provided by emoji-picker-react's EmojiClickData.
 * Uses the last name which is typically the most specific,
 * e.g. ["food & drink", "olive"] → "Olive", not "Food & Drink".
 */
export function guessNameFromEmoji(names: string[]): string {
    const raw = names[names.length - 1] ?? names[0] ?? '';
    return raw.replace(/\b\w/g, c => c.toUpperCase());
}

/** Resolve the effective currency symbol for a spender, falling back to their family's setting. */
export function spenderCurrencySymbol(
    spender: { currency_symbol?: string | null; family?: { currency_symbol?: string } | null },
): string {
    return spender.currency_symbol ?? spender.family?.currency_symbol ?? '$';
}

export function spenderCurrencyNamePlural(
    spender: { currency_name?: string | null; currency_name_plural?: string | null; family?: { currency_name?: string; currency_name_plural?: string | null } | null },
): string {
    const plural = spender.currency_name_plural ?? spender.family?.currency_name_plural ?? null;
    if (plural) return plural;
    const singular = spender.currency_name ?? spender.family?.currency_name ?? 'Dollar';
    return pluralize(singular);
}

export function spenderUsesIntegers(
    spender: { use_integer_amounts?: boolean | null; family?: { use_integer_amounts?: boolean } | null },
): boolean {
    return spender.use_integer_amounts ?? spender.family?.use_integer_amounts ?? false;
}

type FamilyCurrencyFallback = { currency_symbol?: string | null; currency_name?: string | null; currency_name_plural?: string | null; use_integer_amounts?: boolean | null } | null | undefined;

/** Resolve the effective currency symbol for an account, falling back to the family setting. */
export function accountCurrencySymbol(
    account: { currency_symbol?: string | null },
    family?: FamilyCurrencyFallback,
): string {
    return account.currency_symbol ?? family?.currency_symbol ?? '$';
}

export function accountCurrencyNamePlural(
    account: { currency_name?: string | null; currency_name_plural?: string | null },
    family?: FamilyCurrencyFallback,
): string {
    const plural = account.currency_name_plural ?? family?.currency_name_plural ?? null;
    if (plural) return plural;
    const singular = account.currency_name ?? family?.currency_name ?? 'Dollar';
    return pluralize(singular);
}

export function accountUsesIntegers(
    account: { use_integer_amounts?: boolean | null },
    family?: FamilyCurrencyFallback,
): boolean {
    return account.use_integer_amounts ?? family?.use_integer_amounts ?? false;
}
