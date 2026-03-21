import { useRef, useState, useEffect } from 'react';

export const COLOURS = [
    '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316',
    '#eab308', '#22c55e', '#14b8a6', '#0ea5e9', '#64748b',
];

export default function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        function handler(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

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
                <div className="absolute left-0 top-9 z-50 bg-card border rounded-lg shadow-lg p-2 flex flex-wrap gap-1.5 w-36">
                    {COLOURS.map(c => (
                        <button
                            key={c}
                            type="button"
                            onClick={() => { onChange(c); setOpen(false); }}
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
            )}
        </div>
    );
}
