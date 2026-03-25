import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { Spender, Family, PocketMoneySchedule, PocketMoneyScheduleSplit, Account } from '@/types/models';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import ImageUpload from '@/Components/ImageUpload';
import ColorPicker, { COLOURS } from '@/Components/ColorPicker';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface Props {
    spender: Spender & { accounts?: Account[] };
    family: Family;
    pocketMoneySchedule: PocketMoneySchedule | null;
}

export default function SpenderEdit({ spender, family, pocketMoneySchedule }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        family_id: spender.family_id,
        name:      spender.name,
        avatar_key: '',
        color:     spender.color ?? COLOURS[0],
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        put(route('spenders.update', spender.id));
    }

    const accounts = spender.accounts ?? [];

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
                                aspect={1}
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
                            <ColorPicker value={data.color} onChange={c => setData('color', c)} />
                        </div>
                    </CardContent>
                </Card>

                <div className="flex gap-3">
                    <Button type="submit" disabled={processing}>Save Changes</Button>
                    <Button variant="outline" type="button" onClick={() => window.history.back()}>Cancel</Button>
                </div>
            </form>

            <PocketMoneyScheduleCard spender={spender} schedule={pocketMoneySchedule} accounts={accounts} />
        </AuthenticatedLayout>
    );
}

// ── Pocket Money Schedule ──────────────────────────────────────────────────────

type SplitRow = { account_id: string; percentage: string };

function initSplits(schedule: PocketMoneySchedule | null, accounts: Account[]): SplitRow[] {
    if (schedule?.splits && schedule.splits.length >= 2) {
        return schedule.splits.map((s: PocketMoneyScheduleSplit) => ({
            account_id: s.account_id,
            percentage: parseFloat(s.percentage).toFixed(2),
        }));
    }
    // Default: equal distribution across all accounts
    const equal = (100 / accounts.length).toFixed(2);
    return accounts.map((a, i) => ({
        account_id: a.id,
        // Last account gets the remainder to ensure exactly 100
        percentage: i === accounts.length - 1
            ? (100 - parseFloat(equal) * (accounts.length - 1)).toFixed(2)
            : equal,
    }));
}

function computeSplitUpdate(prev: SplitRow[], index: number, newPct: number): SplitRow[] {
    const next = prev.map(s => ({ ...s }));
    next[index].percentage = newPct.toFixed(2);
    const remaining = Math.max(100 - newPct, 0);
    const others = next.filter((_, i) => i !== index);
    const othersTotal = others.reduce((sum, s) => sum + (parseFloat(s.percentage) || 0), 0);
    next.forEach((row, i) => {
        if (i === index) { return; }
        row.percentage = othersTotal > 0
            ? ((parseFloat(row.percentage) || 0) / othersTotal * remaining).toFixed(2)
            : (remaining / others.length).toFixed(2);
    });
    return next;
}

function PocketMoneyScheduleCard({ spender, schedule, accounts }: { spender: Spender; schedule: PocketMoneySchedule | null; accounts: Account[] }) {
    const hasExistingSplits = (schedule?.splits?.length ?? 0) >= 2;
    const [distributeOpen, setDistributeOpen] = useState(hasExistingSplits);
    const [splits, setSplits] = useState<SplitRow[]>(() => initSplits(schedule, accounts));

    const { data, setData, post, processing, errors } = useForm({
        amount:       schedule?.amount ?? '',
        frequency:    (schedule?.frequency ?? 'weekly') as 'weekly' | 'monthly',
        day_of_week:  schedule?.day_of_week ?? 0,
        day_of_month: schedule?.day_of_month ?? 1,
        account_id:   schedule?.account_id ?? (accounts[0]?.id ?? ''),
    });

    const totalAmount = parseFloat(data.amount) || 0;

    function updateSplit(index: number, field: 'percentage' | 'dollar', rawValue: string) {
        setSplits(prev => {
            let newPct: number;
            if (field === 'dollar') {
                const dollars = parseFloat(rawValue);
                newPct = totalAmount > 0 ? Math.min((dollars / totalAmount) * 100, 100) : 0;
                if (isNaN(newPct)) { newPct = 0; }
            } else {
                newPct = parseFloat(rawValue) || 0;
            }
            return computeSplitUpdate(prev, index, newPct);
        });
    }

    function handlePercentageBlur(index: number) {
        setSplits(prev => {
            const pct = Math.min(Math.max(parseFloat(prev[index].percentage) || 0, 0), 100);
            return computeSplitUpdate(prev, index, pct);
        });
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        const useSplits = distributeOpen && accounts.length > 1;
        router.post(
            route('pocket-money-schedule.store', spender.id),
            {
                ...data,
                splits: useSplits ? splits : [],
                account_id: useSplits ? '' : data.account_id,
            },
            { preserveScroll: true },
        );
    }

    function cancel() {
        if (!schedule) { return; }
        router.delete(route('pocket-money-schedule.destroy', schedule.id), { preserveScroll: true });
    }

    const splitTotal = splits.reduce((sum, s) => sum + (parseFloat(s.percentage) || 0), 0);
    const splitValid = Math.abs(splitTotal - 100) < 0.5;

    return (
        <Card className="max-w-lg mt-6">
            <CardHeader>
                <CardTitle className="text-base">Pocket money schedule</CardTitle>
            </CardHeader>
            <CardContent>
                {schedule && (
                    <div className="mb-4 p-3 bg-gumleaf-50 rounded-card text-sm">
                        <p className="font-medium text-gumleaf-600">
                            Active: {schedule.frequency === 'weekly'
                                ? `${schedule.amount} every ${DAY_LABELS[schedule.day_of_week ?? 0]}`
                                : `${schedule.amount} on day ${schedule.day_of_month ?? 1} of each month`}
                            {schedule.account && !hasExistingSplits && (
                                <span className="text-gumleaf-600/70"> → {schedule.account.name}</span>
                            )}
                            {hasExistingSplits && (
                                <span className="text-gumleaf-600/70"> → split between {schedule.splits!.length} accounts</span>
                            )}
                        </p>
                        {schedule.next_run_at && (
                            <p className="text-gumleaf-600 text-xs mt-0.5">
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

                    {/* Single-account selector (only when not distributing) */}
                    {accounts.length > 1 && !distributeOpen && (
                        <div className="space-y-1.5">
                            <Label>Deposit into account</Label>
                            <select
                                value={data.account_id}
                                onChange={e => setData('account_id', e.target.value)}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                                {accounts.map(a => (
                                    <option key={a.id} value={a.id}>{a.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Distribution collapsible (only when >1 account) */}
                    {accounts.length > 1 && (
                        <div className="border rounded-input overflow-hidden">
                            <button
                                type="button"
                                onClick={() => setDistributeOpen(o => !o)}
                                className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium text-left hover:bg-muted/50 transition-colors"
                            >
                                <span>Distribute between accounts</span>
                                {distributeOpen
                                    ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                    : <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                }
                            </button>

                            {distributeOpen && (
                                <div className="px-3 pb-3 pt-1 border-t space-y-4">
                                    {splits.map((split, i) => {
                                        const account = accounts.find(a => a.id === split.account_id);
                                        const pct = parseFloat(split.percentage) || 0;
                                        const dollars = totalAmount > 0
                                            ? (totalAmount * pct / 100).toFixed(2)
                                            : '0.00';

                                        return (
                                            <div key={split.account_id} className="space-y-2">
                                                <p className="text-xs font-medium text-foreground">{account?.name ?? 'Account'}</p>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="100"
                                                    step="0.01"
                                                    value={pct}
                                                    onChange={e => updateSplit(i, 'percentage', e.target.value)}
                                                    onMouseUp={() => handlePercentageBlur(i)}
                                                    onTouchEnd={() => handlePercentageBlur(i)}
                                                    className="w-full accent-primary"
                                                />
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="relative">
                                                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">$</span>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            value={dollars}
                                                            onChange={e => updateSplit(i, 'dollar', e.target.value)}
                                                            className="pl-5 text-sm"
                                                        />
                                                    </div>
                                                    <div className="relative">
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            step="0.01"
                                                            value={split.percentage}
                                                            onChange={e => updateSplit(i, 'percentage', e.target.value)}
                                                            onBlur={() => handlePercentageBlur(i)}
                                                            className="pr-6 text-sm"
                                                        />
                                                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">%</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {!splitValid && (
                                        <p className="text-xs text-destructive">
                                            Total is {splitTotal.toFixed(1)}% — must equal 100%
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex gap-2">
                        <Button
                            type="submit"
                            size="sm"
                            disabled={processing || (distributeOpen && accounts.length > 1 && !splitValid)}
                        >
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
