import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { useState, useRef, useEffect } from 'react';

// ── Helpers ───────────────────────────────────────────────────────────────────

function useIsMobile(): boolean {
    const [mobile, setMobile] = useState(
        () => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches,
    );
    useEffect(() => {
        const mq = window.matchMedia('(pointer: coarse)');
        const handler = (e: MediaQueryListEvent) => setMobile(e.matches);
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);
    return mobile;
}

/**
 * Extract the first emoji grapheme cluster from arbitrary text.
 * Uses Intl.Segmenter so ZWJ sequences, skin-tone modifiers, and flags are
 * treated as a single unit.
 */
function extractFirstEmoji(text: string): string {
    const segmenter = new Intl.Segmenter();
    for (const { segment } of segmenter.segment(text)) {
        if (/\p{Extended_Pictographic}/u.test(segment)) {
            return segment;
        }
    }
    return '';
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
    /** Current emoji value (may be empty string on first render). */
    value: string;
    /** Fallback shown when value is empty; also the value reverted to if input is cleared. */
    defaultEmoji: string;
    /** Called with the new emoji string whenever the value changes. */
    onChange: (emoji: string) => void;
    /**
     * Desktop-only: called with the full EmojiClickData from the JS picker.
     * Useful for side-effects like auto-guessing a currency name.
     */
    onPickerChange?: (data: EmojiClickData) => void;
    /** Extra classes applied to the trigger button / input wrapper. */
    className?: string;
    /** Where the desktop picker dropdown opens relative to the trigger. */
    pickerAlign?: 'left' | 'right';
}

export default function EmojiPickerField({
    value,
    defaultEmoji,
    onChange,
    onPickerChange,
    className = '',
    pickerAlign = 'right',
}: Props) {
    const isMobile = useIsMobile();
    const [showPicker, setShowPicker] = useState(false);
    const pickerRef = useRef<HTMLDivElement>(null);

    // Close picker on outside click (desktop only)
    useEffect(() => {
        if (!showPicker) return;
        function handler(e: MouseEvent) {
            if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
                setShowPicker(false);
            }
        }
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [showPicker]);

    const display = value || defaultEmoji;

    // ── Mobile: plain text input (native emoji keyboard) ─────────────────────
    if (isMobile) {
        return (
            <input
                type="text"
                value={display}
                inputMode="text"
                aria-label="Pick emoji"
                className={`w-14 h-10 rounded-md border border-input bg-background text-xl text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${className}`}
                onChange={e => {
                    const emoji = extractFirstEmoji(e.target.value);
                    onChange(emoji || defaultEmoji);
                }}
                onBlur={e => {
                    // Revert to default if somehow left empty
                    if (!extractFirstEmoji(e.target.value)) {
                        onChange(defaultEmoji);
                    }
                }}
            />
        );
    }

    // ── Desktop: button + JS picker ───────────────────────────────────────────
    return (
        <div className={`relative ${className}`} ref={pickerRef}>
            <button
                type="button"
                onClick={() => setShowPicker(v => !v)}
                className="w-14 h-10 rounded-md border border-input bg-background text-xl flex items-center justify-center hover:bg-accent transition-colors"
                aria-label="Pick emoji"
            >
                {display}
            </button>
            {showPicker && (
                <div className={`absolute top-11 z-50 ${pickerAlign === 'left' ? 'left-0' : 'right-0'}`}>
                    <EmojiPicker
                        onEmojiClick={data => {
                            onChange(data.emoji);
                            onPickerChange?.(data);
                            setShowPicker(false);
                        }}
                        theme={Theme.AUTO}
                        lazyLoadEmojis
                        searchPlaceholder="Search emoji…"
                    />
                </div>
            )}
        </div>
    );
}
