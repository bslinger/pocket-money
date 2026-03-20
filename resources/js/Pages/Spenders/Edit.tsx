import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { Spender, Family, PocketMoneySchedule } from '@/types/models';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { cn, guessNameFromEmoji } from '@/lib/utils';
import EmojiPickerField from '@/Components/EmojiPickerField';
import ImageUpload from '@/Components/ImageUpload';
import { useState } from 'react';

const COLOURS = [
    '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316',
    '#eab308', '#22c55e', '#14b8a6', '#0ea5e9', '#64748b',
];

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface Props {
    spender: Spender;
    family: Family;
    pocketMoneySchedule: PocketMoneySchedule | null;
}

export default function SpenderEdit({ spender, family, pocketMoneySchedule }: Props) {
    const hasOverride = !!(spender.currency_symbol || spender.currency_name);
    const [overrideCurrency, setOverrideCurrency] = useState(hasOverride);

    const { data, setData, put, processing, errors } = useForm({
        family_id:        spender.family_id,
        name:             spender.name,
        avatar_key:       '',
        color:            spender.color ?? COLOURS[0],
        currency_name:         spender.currency_name ?? '',
        currency_name_plural:  spender.currency_name_plural ?? '',
        currency_symbol:       spender.currency_symbol ?? '',
    });

    function toggleOverride(checked: boolean) {
        setOverrideCurrency(checked);
        if (!checked) {
            setData(d => ({ ...d, currency_name: '', currency_name_plural: '', currency_symbol: '' }));
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
                            <Label>Photo <span className="text-muted-foreground text-xs">(optional)</span></Label>
                            <ImageUpload
                                currentUrl={spender.avatar_url}
                                onUpload={key => setData('avatar_key', key)}
                                onClear={() => setData('avatar_key', '')}
                                label="Upload a photo"
                            />
                        </div>

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
                                            <EmojiPickerField
                                                value={data.currency_symbol}
                                                defaultEmoji="💰"
                                                onChange={e => setData(d => ({ ...d, currency_symbol: e }))}
                                                onPickerChange={d => setData(prev => ({ ...prev, currency_symbol: d.emoji, currency_name: guessNameFromEmoji(d.names) }))}
                                                pickerAlign="left"
                                            />
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <Label htmlFor="currency_name" className="text-xs">Singular name</Label>
                                            <Input
                                                id="currency_name"
                                                value={data.currency_name}
                                                onChange={e => setData('currency_name', e.target.value)}
                                                placeholder="e.g. Star, Gem"
                                            />
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <Label htmlFor="currency_name_plural" className="text-xs">Plural (optional)</Label>
                                            <Input
                                                id="currency_name_plural"
                                                value={data.currency_name_plural}
                                                onChange={e => setData('currency_name_plural', e.target.value)}
                                                placeholder={data.currency_name ? data.currency_name + 's' : 'Stars'}
                                            />
                                        </div>
                                    </div>
                                    {data.currency_symbol && (
                                        <p className="text-xs text-muted-foreground">
                                            Preview: {data.currency_symbol}1 {data.currency_name || 'unit'} · {data.currency_symbol}25 {data.currency_name_plural || (data.currency_name ? data.currency_name + 's' : 'units')}
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

            <PocketMoneyScheduleCard spender={spender} schedule={pocketMoneySchedule} />
        </AuthenticatedLayout>
    );
}

// ── Pocket Money Schedule ──────────────────────────────────────────────────────

function PocketMoneyScheduleCard({ spender, schedule }: { spender: Spender; schedule: PocketMoneySchedule | null }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        amount:       schedule?.amount ?? '',
        frequency:    (schedule?.frequency ?? 'weekly') as 'weekly' | 'monthly',
        day_of_week:  schedule?.day_of_week ?? 0,
        day_of_month: schedule?.day_of_month ?? 1,
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(route('pocket-money-schedule.store', spender.id), { preserveScroll: true });
    }

    function cancel() {
        if (!schedule) return;
        router.delete(route('pocket-money-schedule.destroy', schedule.id), { preserveScroll: true });
    }

    return (
        <Card className="max-w-lg mt-6">
            <CardHeader>
                <CardTitle className="text-base">Pocket money schedule</CardTitle>
            </CardHeader>
            <CardContent>
                {schedule && (
                    <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-sm">
                        <p className="font-medium text-green-800 dark:text-green-300">
                            Active: {schedule.frequency === 'weekly'
                                ? `${schedule.amount} every ${DAY_LABELS[schedule.day_of_week ?? 0]}`
                                : `${schedule.amount} on day ${schedule.day_of_month ?? 1} of each month`}
                        </p>
                        {schedule.next_run_at && (
                            <p className="text-green-700 dark:text-green-400 text-xs mt-0.5">
                                Next payment: {new Date(schedule.next_run_at).toLocaleDateString()}
                            </p>
                        )}
                    </div>
                )}

                <form onSubmit={submit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="pm-amount">Amount</Label>
                            <Input
                                id="pm-amount"
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={data.amount}
                                onChange={e => setData('amount', e.target.value)}
                                placeholder="5.00"
                            />
                            {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label>Frequency</Label>
                            <select
                                value={data.frequency}
                                onChange={e => setData('frequency', e.target.value as 'weekly' | 'monthly')}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                            </select>
                        </div>
                    </div>

                    {data.frequency === 'weekly' && (
                        <div className="space-y-1.5">
                            <Label>Pay day</Label>
                            <div className="flex gap-2 flex-wrap">
                                {DAY_LABELS.map((label, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => setData('day_of_week', i)}
                                        className={`w-10 h-10 rounded-full text-sm font-medium border transition-colors ${
                                            data.day_of_week === i
                                                ? 'bg-primary text-primary-foreground border-primary'
                                                : 'bg-background border-border text-muted-foreground hover:border-primary/50'
                                        }`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {data.frequency === 'monthly' && (
                        <div className="space-y-1.5">
                            <Label htmlFor="pm-day">Day of month (1–28)</Label>
                            <Input
                                id="pm-day"
                                type="number"
                                min="1"
                                max="28"
                                value={data.day_of_month}
                                onChange={e => setData('day_of_month', parseInt(e.target.value) || 1)}
                                className="max-w-[100px]"
                            />
                            {errors.day_of_month && <p className="text-xs text-destructive">{errors.day_of_month}</p>}
                        </div>
                    )}

                    <div className="flex gap-2">
                        <Button type="submit" size="sm" disabled={processing}>
                            {schedule ? 'Update schedule' : 'Set schedule'}
                        </Button>
                        {schedule && (
                            <Button type="button" variant="outline" size="sm" onClick={cancel}>
                                Cancel schedule
                            </Button>
                        )}
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
