import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';
import { Family } from '@/types/models';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { guessNameFromEmoji } from '@/lib/utils';
import { useState, useRef, useEffect } from 'react';

const CURRENCY_PRESETS = [
    { label: 'Dollars',  symbol: '$',  name: 'Dollar' },
    { label: 'Stars',    symbol: '⭐', name: 'Star' },
    { label: 'Coins',    symbol: '🪙', name: 'Coin' },
    { label: 'Points',   symbol: '🏆', name: 'Point' },
];

export default function FamilyEdit({ family }: { family: Family }) {
    const { data, setData, put, processing, errors } = useForm({
        name:            family.name,
        currency_name:   family.currency_name ?? 'Dollar',
        currency_symbol: family.currency_symbol ?? '$',
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

    function applyPreset(preset: typeof CURRENCY_PRESETS[number]) {
        setData(d => ({ ...d, currency_symbol: preset.symbol, currency_name: preset.name }));
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        put(route('families.update', family.id));
    }

    const isCustomPreset = !CURRENCY_PRESETS.some(p => p.symbol === data.currency_symbol);

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold">Edit Family</h2>}>
            <Head title="Edit Family" />
            <form onSubmit={submit} className="max-w-lg space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Family details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <div className="space-y-1.5">
                            <Label htmlFor="name">Family name</Label>
                            <Input
                                id="name"
                                value={data.name}
                                onChange={e => setData('name', e.target.value)}
                                autoFocus
                            />
                            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                        </div>

                        {/* Currency */}
                        <div className="space-y-2">
                            <Label>Currency</Label>
                            <p className="text-xs text-muted-foreground">
                                Choose how amounts are shown throughout the app. Pick a preset or select any emoji.
                            </p>

                            {/* Preset options */}
                            <div className="grid grid-cols-2 gap-2">
                                {CURRENCY_PRESETS.map(preset => {
                                    const selected = data.currency_symbol === preset.symbol;
                                    return (
                                        <button
                                            key={preset.symbol}
                                            type="button"
                                            onClick={() => applyPreset(preset)}
                                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-colors ${
                                                selected
                                                    ? 'border-primary bg-primary/5'
                                                    : 'border-border hover:border-primary/40'
                                            }`}
                                        >
                                            <span className="text-xl">{preset.symbol}</span>
                                            <div>
                                                <p className={`text-sm font-medium ${selected ? 'text-primary' : 'text-foreground'}`}>
                                                    {preset.label}
                                                </p>
                                                <p className="text-xs text-muted-foreground">{preset.symbol}10</p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Custom emoji picker */}
                            <div className="flex items-center gap-3 pt-1">
                                <div className="relative" ref={pickerRef}>
                                    <button
                                        type="button"
                                        onClick={() => setShowPicker(v => !v)}
                                        className={`w-12 h-10 rounded-lg border text-xl flex items-center justify-center transition-colors ${
                                            isCustomPreset
                                                ? 'border-primary bg-primary/5'
                                                : 'border-border hover:border-primary/40 bg-background'
                                        }`}
                                        aria-label="Custom emoji currency"
                                    >
                                        {isCustomPreset ? data.currency_symbol : '✏️'}
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
                                <div className="flex-1">
                                    <p className="text-sm font-medium">Custom emoji</p>
                                    <p className="text-xs text-muted-foreground">Pick any emoji to represent your currency</p>
                                </div>
                            </div>

                            {/* Currency name */}
                            <div className="space-y-1.5 pt-1">
                                <Label htmlFor="currency_name">Currency name (singular)</Label>
                                <Input
                                    id="currency_name"
                                    value={data.currency_name}
                                    onChange={e => setData('currency_name', e.target.value)}
                                    placeholder="e.g. Star, Coin, Smithy Buck"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Preview: {data.currency_symbol}25 {data.currency_name}s
                                </p>
                                {errors.currency_name && <p className="text-xs text-destructive">{errors.currency_name}</p>}
                            </div>
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
