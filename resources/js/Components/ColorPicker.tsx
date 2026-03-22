import { useRef, useState, useEffect } from 'react';

export const COLOURS = [
    // Default visible (10)
    '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316',
    '#eab308', '#22c55e', '#14b8a6', '#0ea5e9', '#64748b',
    // Extended palette (20 more)
    '#ef4444', '#fb923c', '#fbbf24', '#84cc16', '#10b981',
    '#06b6d4', '#3b82f6', '#a855f7', '#f472b6', '#fb7185',
    '#7f1d1d', '#78350f', '#14532d', '#0c4a6e', '#1e1b4b',
    '#581c87', '#831843', '#0f172a', '#78716c', '#a16207',
];

const VISIBLE_COUNT = 10;

export default function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
    const [open, setOpen] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        function handler(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
                setExpanded(false);
            }
        }
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const visibleColours = COLOURS.slice(0, VISIBLE_COUNT);
    const extraColours = COLOURS.slice(VISIBLE_COUNT);
    // If current value is in extended palette, auto-expand so it's visible
    const valueIsExtra = extraColours.includes(value);

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                onClick={() => setOpen(v => !v)}
                className="h-8 w-8 rounded-full border-2 border-white ring-2 ring-border shrink-0 transition-transform hover:scale-110"
                style={{ backgroundColor: value }}
                aria-label="Pick colour"
            />
            {open && (
                <div className="absolute left-0 top-9 z-50 bg-card border rounded-lg shadow-lg p-2 w-44">
                    <div className="flex flex-wrap gap-1.5">
                        {visibleColours.map(c => (
                            <button
                                key={c}
                                type="button"
                                onClick={() => { onChange(c); setOpen(false); setExpanded(false); }}
                                className="h-7 w-7 rounded-full border-2 transition-transform hover:scale-110"
                                style={{
                                    backgroundColor: c,
                                    borderColor: c === value ? 'white' : 'transparent',
                                    outline: c === value ? `2px solid ${c}` : 'none',
                                    outlineOffset: '1px',
                                }}
                                aria-label={c}
                            />
                        ))}
                    </div>

                    {(expanded || valueIsExtra) ? (
                        <>
                            <div className="border-t my-2" />
                            <div className="flex flex-wrap gap-1.5">
                                {extraColours.map(c => (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => { onChange(c); setOpen(false); setExpanded(false); }}
                                        className="h-7 w-7 rounded-full border-2 transition-transform hover:scale-110"
                                        style={{
                                            backgroundColor: c,
                                            borderColor: c === value ? 'white' : 'transparent',
                                            outline: c === value ? `2px solid ${c}` : 'none',
                                            outlineOffset: '1px',
                                        }}
                                        aria-label={c}
                                    />
                                ))}
                            </div>
                        </>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setExpanded(true)}
                            className="mt-2 w-full text-xs text-muted-foreground hover:text-foreground text-center py-0.5 hover:bg-muted rounded transition-colors"
                        >
                            More colours…
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
