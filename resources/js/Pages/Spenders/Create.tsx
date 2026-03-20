import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { Family } from '@/types/models';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { cn, guessNameFromEmoji } from '@/lib/utils';
import ImageUpload from '@/Components/ImageUpload';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { useState, useRef, useEffect } from 'react';

const COLOURS = [
    '#6366f1', // indigo
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#f43f5e', // rose
    '#f97316', // orange
    '#eab308', // yellow
    '#22c55e', // green
    '#14b8a6', // teal
    '#0ea5e9', // sky
    '#64748b', // slate
];

export default function SpenderCreate({ families }: { families: Family[] }) {
    const activeFamily = families[0];
    const [overrideCurrency, setOverrideCurrency] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        family_id:       activeFamily?.id ?? '',
        name:            '',
        avatar_key:      '',
        color:           COLOURS[0],
        currency_name:   '',
        currency_symbol: '',
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
        if (!checked) setData(d => ({ ...d, currency_name: '', currency_symbol: '' }));
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(route('spenders.store'));
    }

    const selectedFamily = families.find(f => f.id === data.family_id) ?? activeFamily;

    return (
        <AuthenticatedLayout header={<h1 className="text-xl font-semibold">Add Spender</h1>}>
            <Head title="Add Spender" />
            <Card className="max-w-lg">
                <CardHeader>
                    <CardTitle className="text-base">Spender details</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={submit} className="space-y-5">
                        {/* Family — only show if parent has multiple families */}
                        {families.length > 1 && (
                            <div className="space-y-1.5">
                                <Label htmlFor="family_id">Family</Label>
                                <select
                                    id="family_id"
                                    value={data.family_id}
                                    onChange={e => setData('family_id', e.target.value)}
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                                >
                                    {families.map(f => (
                                        <option key={f.id} value={f.id}>{f.name}</option>
                                    ))}
                                </select>
                                {errors.family_id && <p className="text-xs text-destructive">{errors.family_id}</p>}
                            </div>
                        )}

                        {/* Photo */}
                        <div className="space-y-1.5">
                            <Label>Photo <span className="text-muted-foreground text-xs">(optional)</span></Label>
                            <ImageUpload
                                onUpload={key => setData('avatar_key', key)}
                                onClear={() => setData('avatar_key', '')}
                                label="Upload a photo"
                            />
                        </div>

                        {/* Name */}
                        <div className="space-y-1.5">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                placeholder="e.g. Emma"
                                value={data.name}
                                onChange={e => setData('name', e.target.value)}
                                autoFocus
                            />
                            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                        </div>

                        {/* Colour */}
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
                                    {selectedFamily && (
                                        <p className="text-xs text-muted-foreground">
                                            Overrides the family default ({selectedFamily.currency_symbol} {selectedFamily.currency_name})
                                        </p>
                                    )}
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

                        {/* Preview */}
                        <div className="flex items-center gap-3 py-2">
                            <div
                                className="h-12 w-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                                style={{ backgroundColor: data.color }}
                            >
                                {data.name ? data.name[0].toUpperCase() : '?'}
                            </div>
                            <span className="text-sm text-muted-foreground">
                                {data.name || 'Spender name'}
                            </span>
                        </div>

                        <Button type="submit" disabled={processing}>Add Spender</Button>
                    </form>
                </CardContent>
            </Card>
        </AuthenticatedLayout>
    );
}
