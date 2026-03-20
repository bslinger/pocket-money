import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { Spender, Family } from '@/types/models';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { cn, guessNameFromEmoji } from '@/lib/utils';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { useState, useRef, useEffect } from 'react';

const COLOURS = [
    '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316',
    '#eab308', '#22c55e', '#14b8a6', '#0ea5e9', '#64748b',
];

export default function SpenderEdit({ spender, family }: { spender: Spender; family: Family }) {
    const hasOverride = !!(spender.currency_symbol || spender.currency_name);
    const [overrideCurrency, setOverrideCurrency] = useState(hasOverride);

    const { data, setData, put, processing, errors } = useForm({
        family_id:        spender.family_id,
        name:             spender.name,
        color:            spender.color ?? COLOURS[0],
        currency_name:    spender.currency_name ?? '',
        currency_symbol:  spender.currency_symbol ?? '',
    });

    const [showPicker, setShowPicker] = useState(false);
    const pickerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
                setShowPicker(false);
            }
        }
        if (showPicker) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showPicker]);

    function onEmojiClick(emojiData: EmojiClickData) {
        setData(d => ({ ...d, currency_symbol: emojiData.emoji, currency_name: guessNameFromEmoji(emojiData.names) }));
        setShowPicker(false);
    }

    function toggleOverride(checked: boolean) {
        setOverrideCurrency(checked);
        if (!checked) {
            setData(d => ({ ...d, currency_name: '', currency_symbol: '' }));
        }
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        put(route('spenders.update', spender.id));
    }

    return (
        <AuthenticatedLayout header={<h1 className="text-xl font-semibold">Edit Spender</h1>}>
            <Head title="Edit Spender" />
            <form onSubmit={submit} className="max-w-lg space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Spender details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <div className="space-y-1.5">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                value={data.name}
                                onChange={e => setData('name', e.target.value)}
                                autoFocus
                            />
                            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label>Colour</Label>
                            <div className="flex flex-wrap gap-2">
                                {COLOURS.map(c => (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => setData('color', c)}
                                        className={cn(
                                            'h-8 w-8 rounded-full transition-transform',
                                            data.color === c ? 'ring-2 ring-offset-2 ring-ring scale-110' : 'hover:scale-105'
                                        )}
                                        style={{ backgroundColor: c }}
                                        aria-label={c}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Currency override */}
                        <div className="space-y-3">
                            <label className="flex items-center gap-2.5 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={overrideCurrency}
                                    onChange={e => toggleOverride(e.target.checked)}
                                    className="rounded accent-primary"
                                />
                                <div>
                                    <p className="text-sm font-medium">Custom currency for this kid</p>
                                    <p className="text-xs text-muted-foreground">
                                        Overrides the family default ({family.currency_symbol} {family.currency_name})
                                    </p>
                                </div>
                            </label>

                            {overrideCurrency && (
                                <div className="pl-6 space-y-3 border-l-2 border-border">
                                    <div className="flex items-center gap-3">
                                        <div className="space-y-1">
                                            <Label className="text-xs">Emoji symbol</Label>
                                            <div className="relative" ref={pickerRef}>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPicker(v => !v)}
                                                    className="w-12 h-10 rounded-lg border border-input bg-background text-xl flex items-center justify-center hover:bg-accent transition-colors"
                                                    aria-label="Pick emoji"
                                                >
                                                    {data.currency_symbol || <span className="text-muted-foreground text-sm">😀</span>}
                                                </button>
                                                {showPicker && (
                                                    <div className="absolute left-0 top-12 z-50">
                                                        <EmojiPicker
                                                            onEmojiClick={onEmojiClick}
                                                            theme={Theme.AUTO}
                                                            lazyLoadEmojis
                                                            searchPlaceholder="Search emoji…"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <Label htmlFor="currency_name" className="text-xs">Currency name</Label>
                                            <Input
                                                id="currency_name"
                                                value={data.currency_name}
                                                onChange={e => setData('currency_name', e.target.value)}
                                                placeholder="e.g. Star, Gem"
                                            />
                                        </div>
                                    </div>
                                    {data.currency_symbol && (
                                        <p className="text-xs text-muted-foreground">
                                            Preview: {data.currency_symbol}25 {data.currency_name || 'unit'}s
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <div className="flex gap-3">
                    <Button type="submit" disabled={processing}>Save Changes</Button>
                    <Button variant="outline" type="button" onClick={() => window.history.back()}>Cancel</Button>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}
