import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { Spender, Family, PocketMoneySchedule, Chore, ChoreReward, Account } from '@/types/models';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { cn } from '@/lib/utils';
import ImageUpload from '@/Components/ImageUpload';
import { Trash2 } from 'lucide-react';

const COLOURS = [
    '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316',
    '#eab308', '#22c55e', '#14b8a6', '#0ea5e9', '#64748b',
];

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface Props {
    spender: Spender & { accounts?: Account[] };
    family: Family;
    pocketMoneySchedule: PocketMoneySchedule | null;
    choreRewards: ChoreReward[];
    availableChores: Chore[];
}

export default function SpenderEdit({ spender, family, pocketMoneySchedule, choreRewards, availableChores }: Props) {
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
                    </CardContent>
                </Card>

                <div className="flex gap-3">
                    <Button type="submit" disabled={processing}>Save Changes</Button>
                    <Button variant="outline" type="button" onClick={() => window.history.back()}>Cancel</Button>
                </div>
            </form>

            <PocketMoneyScheduleCard spender={spender} schedule={pocketMoneySchedule} accounts={accounts} />
            <ChoreRewardsCard spender={spender} rewards={choreRewards} availableChores={availableChores} accounts={accounts} />
        </AuthenticatedLayout>
    );
}

// ── Pocket Money Schedule ──────────────────────────────────────────────────────

function PocketMoneyScheduleCard({ spender, schedule, accounts }: { spender: Spender; schedule: PocketMoneySchedule | null; accounts: Account[] }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        amount:       schedule?.amount ?? '',
        frequency:    (schedule?.frequency ?? 'weekly') as 'weekly' | 'monthly',
        day_of_week:  schedule?.day_of_week ?? 0,
        day_of_month: schedule?.day_of_month ?? 1,
        account_id:   schedule?.account_id ?? (accounts[0]?.id ?? ''),
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
                            {schedule.account && <span className="text-green-700/70 dark:text-green-400"> → {schedule.account.name}</span>}
                        </p>
                        {schedule.next_run_at && (
                            <p className="text-green-700 dark:text-green-400 text-xs mt-0.5">
                                Next payment: {new Date(schedule.next_run_at).toLocaleDateString()}
                            </p>
                        )}
                    </div>
                )}

                <form onSubmit={submit} className="space-y-4">
                    {accounts.length > 1 && (
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

// ── Chore Rewards ──────────────────────────────────────────────────────────────

function ChoreRewardsCard({
    spender,
    rewards,
    availableChores,
    accounts,
}: {
    spender: Spender;
    rewards: ChoreReward[];
    availableChores: Chore[];
    accounts: Account[];
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        amount:      '',
        description: '',
        payout_date: '',
        account_id:  accounts[0]?.id ?? '',
        chore_ids:   [] as string[],
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(route('chore-rewards.store', spender.id), {
            preserveScroll: true,
            onSuccess: () => reset(),
        });
    }

    function toggleChore(id: string) {
        setData('chore_ids', data.chore_ids.includes(id)
            ? data.chore_ids.filter(c => c !== id)
            : [...data.chore_ids, id]);
    }

    return (
        <Card className="max-w-lg mt-6">
            <CardHeader>
                <CardTitle className="text-base">Chore rewards</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {rewards.length > 0 && (
                    <div className="space-y-2">
                        {rewards.map(reward => (
                            <div key={reward.id} className="flex items-start justify-between gap-3 p-3 rounded-lg bg-muted/50 text-sm">
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium">
                                        {reward.description || 'Reward'} — {reward.amount}
                                        {reward.account && <span className="text-muted-foreground font-normal"> → {reward.account.name}</span>}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {reward.chores?.map(c => c.name).join(', ')}
                                        {reward.payout_date && ` · Pay on ${reward.payout_date}`}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => router.delete(route('chore-rewards.destroy', reward.id), { preserveScroll: true })}
                                    className="text-muted-foreground hover:text-destructive shrink-0"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <form onSubmit={submit} className="space-y-3 border-t pt-4">
                    <p className="text-sm font-medium">Add a reward</p>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label htmlFor="cr-amount" className="text-xs">Amount</Label>
                            <Input
                                id="cr-amount"
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={data.amount}
                                onChange={e => setData('amount', e.target.value)}
                                placeholder="5.00"
                            />
                            {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="cr-payout-date" className="text-xs">Pay on date <span className="text-muted-foreground">(optional)</span></Label>
                            <Input
                                id="cr-payout-date"
                                type="date"
                                value={data.payout_date}
                                onChange={e => setData('payout_date', e.target.value)}
                            />
                        </div>
                    </div>

                    {accounts.length > 1 && (
                        <div className="space-y-1">
                            <Label className="text-xs">Deposit into account</Label>
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

                    <div className="space-y-1">
                        <Label htmlFor="cr-description" className="text-xs">Description <span className="text-muted-foreground">(optional)</span></Label>
                        <Input
                            id="cr-description"
                            value={data.description}
                            onChange={e => setData('description', e.target.value)}
                            placeholder="e.g. Weekend chores bonus"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs">Required chores</Label>
                        {availableChores.length === 0 ? (
                            <p className="text-xs text-muted-foreground">No active chores assigned to this child.</p>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {availableChores.map(chore => (
                                    <button
                                        key={chore.id}
                                        type="button"
                                        onClick={() => toggleChore(chore.id)}
                                        className={cn(
                                            'px-2.5 py-1 rounded-full text-xs border transition-colors',
                                            data.chore_ids.includes(chore.id)
                                                ? 'bg-primary text-primary-foreground border-primary'
                                                : 'bg-background border-border text-muted-foreground hover:border-primary/50'
                                        )}
                                    >
                                        {chore.emoji && <span className="mr-1">{chore.emoji}</span>}
                                        {chore.name}
                                    </button>
                                ))}
                            </div>
                        )}
                        {errors.chore_ids && <p className="text-xs text-destructive">{errors.chore_ids}</p>}
                    </div>

                    <Button type="submit" size="sm" disabled={processing || availableChores.length === 0}>
                        Add reward
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
