import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

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
 * Takes the first name and title-cases it, e.g. ["star", "glowing star"] → "Star".
 */
export function guessNameFromEmoji(names: string[]): string {
    const raw = names[0] ?? '';
    return raw.replace(/\b\w/g, c => c.toUpperCase());
}

/** Resolve the effective currency symbol for a spender, falling back to their family's setting. */
export function spenderCurrencySymbol(
    spender: { currency_symbol?: string | null; family?: { currency_symbol?: string } | null },
): string {
    return spender.currency_symbol ?? spender.family?.currency_symbol ?? '$';
}
