import { Head, Link, router } from '@inertiajs/react';
import ApplicationLogo from '@/Components/ApplicationLogo';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Card, CardContent } from '@/Components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/Components/ui/avatar';
import EmojiPickerField from '@/Components/EmojiPickerField';
import { cn } from '@/lib/utils';
import { Family, Spender, Account } from '@/types/models';
import { ChevronRight, ChevronLeft, PlusCircle, X, Check } from 'lucide-react';
import { useState } from 'react';

type SpenderWithAccounts = Spender & { accounts: Account[] };
type FamilyWithSpenders = Family & { spenders: SpenderWithAccounts[] };

interface Props { family: FamilyWithSpenders; }

const STEP_LABELS = ['Pocket money', 'Chores', 'Invite'];
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface PocketMoneyRow {
    enabled: boolean;
    amount: string;
    frequency: 'weekly' | 'monthly';
    day_of_week: number;
    day_of_month: number;
}

interface ChoreRow {
    name: string;
    emoji: string;
    reward_type: 'earns' | 'responsibility' | 'no_reward';
    amount: string;
    frequency: 'daily' | 'weekly' | 'monthly' | 'one_off';
    spender_ids: string[];
}

export default function OnboardingContinue({ family }: Props) {
    const [step, setStep] = useState(0); // 0=pocket money, 1=chores, 2=invite
    const [processing, setProcessing] = useState(false);
    const [invitesSent, setInvitesSent] = useState<string[]>([]);

    // Pocket money state — one row per spender
    const [pocketMoney, setPocketMoney] = useState<Record<string, PocketMoneyRow>>(() =>
        Object.fromEntries(family.spenders.map(s => [s.id, {
            enabled: false, amount: '', frequency: 'weekly', day_of_week: 0, day_of_month: 1,
        }]))
    );

    // Chores state
    const [chores, setChores] = useState<ChoreRow[]>([]);

    // Invite state
    const [parentEmail, setParentEmail] = useState('');
    const [childInvites, setChildInvites] = useState<Record<string, string>>({});

    function updatePm(spenderId: string, updates: Partial<PocketMoneyRow>) {
        setPocketMoney(prev => ({ ...prev, [spenderId]: { ...prev[spenderId], ...updates } }));
    }

    function addChore() {
        setChores(prev => [...prev, {
            name: '', emoji: '', reward_type: 'earns', amount: '',
            frequency: 'weekly', spender_ids: family.spenders.map(s => s.id),
        }]);
    }

    function updateChore(idx: number, updates: Partial<ChoreRow>) {
        setChores(prev => prev.map((c, i) => i === idx ? { ...c, ...updates } : c));
    }

    function removeChore(idx: number) {
        setChores(prev => prev.filter((_, i) => i !== idx));
    }

    function toggleChoreSpender(choreIdx: number, spenderId: string) {
        const current = chores[choreIdx].spender_ids;
        updateChore(choreIdx, {
            spender_ids: current.includes(spenderId)
                ? current.filter(id => id !== spenderId)
                : [...current, spenderId],
        });
    }

    // Submit pocket money and advance
    function submitPocketMoney() {
        const schedules = family.spenders
            .filter(s => pocketMoney[s.id]?.enabled && pocketMoney[s.id]?.amount)
            .map(s => {
                const pm = pocketMoney[s.id];
                return {
                    spender_id:   s.id,
                    amount:       pm.amount,
                    frequency:    pm.frequency,
                    day_of_week:  pm.frequency === 'weekly' ? pm.day_of_week : null,
                    day_of_month: pm.frequency === 'monthly' ? pm.day_of_month : null,
                };
            });

        if (schedules.length === 0) { setStep(1); return; }

        setProcessing(true);
        router.post(route('onboarding.pocket-money', family.id), { schedules }, {
            preserveState: true,
            onSuccess: () => { setStep(1); setProcessing(false); },
            onError: () => setProcessing(false),
        });
    }

    // Submit chores and advance
    function submitChores() {
        const validChores = chores.filter(c => c.name.trim() && c.spender_ids.length > 0);

        if (validChores.length === 0) { setStep(2); return; }

        setProcessing(true);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        router.post(route('onboarding.chores', family.id), { chores: validChores as any }, {
            preserveState: true,
            onSuccess: () => { setStep(2); setProcessing(false); },
            onError: () => setProcessing(false),
        });
    }

    // Send a parent invite
    function sendParentInvite() {
        if (!parentEmail.trim()) return;
        const email = parentEmail.trim();
        setProcessing(true);
        router.post(route('families.invite', family.id), { email }, {
            preserveState: true,
            onSuccess: () => {
                setInvitesSent(prev => [...prev, email]);
                setParentEmail('');
                setProcessing(false);
            },
            onError: () => setProcessing(false),
        });
    }

    // Send a child invite
    function sendChildInvite(spenderId: string) {
        const email = childInvites[spenderId]?.trim();
        if (!email) return;
        setProcessing(true);
        router.post(route('spenders.link-child', spenderId), { email }, {
            preserveState: true,
            onSuccess: () => {
                setInvitesSent(prev => [...prev, email]);
                setChildInvites(prev => ({ ...prev, [spenderId]: '' }));
                setProcessing(false);
            },
            onError: () => setProcessing(false),
        });
    }

    const hasKids = family.spenders.length > 0;

    return (
        <>
            <Head title="Set up your family" />
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-2xl">
                    {/* Logo */}
                    <div className="text-center mb-8">
                        <ApplicationLogo className="h-10 w-auto mx-auto" />
                        <h1 className="text-2xl font-bold mt-3">{family.name} is ready!</h1>
                        <p className="text-muted-foreground text-sm mt-1">A few optional steps to get the most out of Quiddo.</p>
                    </div>

                    {/* Step indicator */}
                    <div className="flex items-center justify-center mb-8 gap-1">
                        {STEP_LABELS.map((label, i) => (
                            <div key={i} className="flex items-center gap-1">
                                <div className={cn(
                                    'flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold border-2 transition-colors',
                                    i < step  ? 'bg-primary border-primary text-primary-foreground' :
                                    i === step ? 'border-primary text-primary bg-background' :
                                    'border-border text-muted-foreground bg-background'
                                )}>
                                    {i < step ? <Check className="h-3 w-3" /> : i + 1}
                                </div>
                                <span className={cn(
                                    'text-xs hidden sm:inline',
                                    i === step ? 'text-primary font-medium' : 'text-muted-foreground'
                                )}>{label}</span>
                                {i < STEP_LABELS.length - 1 && (
                                    <ChevronRight className="h-3 w-3 text-muted-foreground mx-0.5" />
                                )}
                            </div>
                        ))}
                    </div>

                    <Card>
                        <CardContent className="pt-6">
                            {/* Step 0: Pocket Money */}
                            {step === 0 && (
                                <div className="space-y-5">
                                    <div>
                                        <h2 className="text-lg font-semibold">Set up pocket money</h2>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Choose how much each kid earns and when. You can skip any kid or come back to this later.
                                        </p>
                                    </div>

                                    {!hasKids && (
                                        <div className="py-6 text-center text-muted-foreground text-sm">
                                            No kids added yet — add kids first from the dashboard.
                                        </div>
                                    )}

                                    {family.spenders.map(spender => {
                                        const pm = pocketMoney[spender.id];
                                        return (
                                            <div key={spender.id} className="border rounded-lg p-4 space-y-3">
                                                {/* Kid header + toggle */}
                                                <label className="flex items-center gap-3 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={pm.enabled}
                                                        onChange={e => updatePm(spender.id, { enabled: e.target.checked })}
                                                        className="rounded accent-primary"
                                                    />
                                                    <Avatar className="h-8 w-8 shrink-0">
                                                        <AvatarImage src={spender.avatar_url ?? undefined} />
                                                        <AvatarFallback style={{ backgroundColor: spender.color ?? '#6366f1' }} className="text-white text-xs font-bold">
                                                            {spender.name[0].toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="font-medium text-sm">{spender.name}</span>
                                                </label>

                                                {pm.enabled && (
                                                    <div className="pl-6 space-y-3">
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div className="space-y-1">
                                                                <Label className="text-xs">Amount ({family.currency_symbol || '$'})</Label>
                                                                <Input
                                                                    type="number" min="0.01" step="0.01"
                                                                    value={pm.amount}
                                                                    onChange={e => updatePm(spender.id, { amount: e.target.value })}
                                                                    placeholder="5.00"
                                                                />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <Label className="text-xs">Frequency</Label>
                                                                <select
                                                                    value={pm.frequency}
                                                                    onChange={e => updatePm(spender.id, { frequency: e.target.value as 'weekly' | 'monthly' })}
                                                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                                >
                                                                    <option value="weekly">Weekly</option>
                                                                    <option value="monthly">Monthly</option>
                                                                </select>
                                                            </div>
                                                        </div>
                                                        {pm.frequency === 'weekly' && (
                                                            <div className="space-y-1">
                                                                <Label className="text-xs">Pay day</Label>
                                                                <div className="flex gap-1 flex-wrap">
                                                                    {DAY_LABELS.map((label, i) => (
                                                                        <button
                                                                            key={i} type="button"
                                                                            onClick={() => updatePm(spender.id, { day_of_week: i })}
                                                                            className={cn(
                                                                                'w-9 h-9 rounded-full text-xs font-medium border transition-colors',
                                                                                pm.day_of_week === i
                                                                                    ? 'bg-primary text-primary-foreground border-primary'
                                                                                    : 'bg-background border-border text-muted-foreground hover:border-primary/50'
                                                                            )}
                                                                        >{label}</button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                        {pm.frequency === 'monthly' && (
                                                            <div className="space-y-1">
                                                                <Label className="text-xs">Day of month</Label>
                                                                <Input
                                                                    type="number" min="1" max="28"
                                                                    value={pm.day_of_month}
                                                                    onChange={e => updatePm(spender.id, { day_of_month: parseInt(e.target.value) || 1 })}
                                                                    className="max-w-[100px]"
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Step 1: Chores */}
                            {step === 1 && (
                                <div className="space-y-5">
                                    <div>
                                        <h2 className="text-lg font-semibold">Add some chores</h2>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Chores let kids earn money by completing tasks. Add as many as you like — you can always add more later.
                                        </p>
                                    </div>

                                    <div className="space-y-4">
                                        {chores.map((chore, idx) => (
                                            <div key={idx} className="border rounded-lg p-4 space-y-3">
                                                <div className="flex items-start gap-2">
                                                    <div className="flex-1 grid grid-cols-[1fr_auto] gap-2 items-start">
                                                        <div className="space-y-1">
                                                            <Label className="text-xs">Chore name</Label>
                                                            <Input
                                                                value={chore.name}
                                                                onChange={e => updateChore(idx, { name: e.target.value })}
                                                                placeholder="Tidy bedroom"
                                                                autoFocus={idx === chores.length - 1}
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <Label className="text-xs">Emoji</Label>
                                                            <EmojiPickerField
                                                                value={chore.emoji}
                                                                defaultEmoji="📋"
                                                                onChange={e => updateChore(idx, { emoji: e })}
                                                            />
                                                        </div>
                                                    </div>
                                                    <Button
                                                        type="button" variant="ghost" size="icon"
                                                        className="h-8 w-8 text-muted-foreground hover:text-destructive mt-5"
                                                        onClick={() => removeChore(idx)}
                                                    >
                                                        <X className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>

                                                {/* Reward type */}
                                                <div className="grid grid-cols-3 gap-1">
                                                    {([
                                                        { value: 'earns', label: 'Earns money' },
                                                        { value: 'responsibility', label: 'Responsibility' },
                                                        { value: 'no_reward', label: 'No reward' },
                                                    ] as const).map(({ value, label }) => (
                                                        <button
                                                            key={value} type="button"
                                                            onClick={() => updateChore(idx, { reward_type: value })}
                                                            className={cn(
                                                                'px-2 py-1.5 rounded text-xs border transition-colors',
                                                                chore.reward_type === value
                                                                    ? 'border-primary bg-primary/5 text-primary font-medium'
                                                                    : 'border-border hover:border-primary/40'
                                                            )}
                                                        >{label}</button>
                                                    ))}
                                                </div>

                                                {/* Amount (earns only) */}
                                                {chore.reward_type === 'earns' && (
                                                    <div className="space-y-1">
                                                        <Label className="text-xs">Amount ({family.currency_symbol || '$'})</Label>
                                                        <Input
                                                            type="number" min="0.01" step="0.01"
                                                            value={chore.amount}
                                                            onChange={e => updateChore(idx, { amount: e.target.value })}
                                                            placeholder="2.00"
                                                            className="max-w-[120px]"
                                                        />
                                                    </div>
                                                )}

                                                {/* Frequency */}
                                                <div className="flex items-center gap-3">
                                                    <Label className="text-xs shrink-0">Frequency</Label>
                                                    <select
                                                        value={chore.frequency}
                                                        onChange={e => updateChore(idx, { frequency: e.target.value as ChoreRow['frequency'] })}
                                                        className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                                                    >
                                                        <option value="daily">Daily</option>
                                                        <option value="weekly">Weekly</option>
                                                        <option value="monthly">Monthly</option>
                                                        <option value="one_off">One-off</option>
                                                    </select>
                                                </div>

                                                {/* Assign to */}
                                                {family.spenders.length > 0 && (
                                                    <div className="space-y-1">
                                                        <Label className="text-xs">Assigned to</Label>
                                                        <div className="flex gap-2 flex-wrap">
                                                            {family.spenders.map(s => {
                                                                const sel = chore.spender_ids.includes(s.id);
                                                                return (
                                                                    <button
                                                                        key={s.id} type="button"
                                                                        onClick={() => toggleChoreSpender(idx, s.id)}
                                                                        className={cn(
                                                                            'flex items-center gap-1.5 px-2 py-1 rounded-full border text-xs transition-colors',
                                                                            sel ? 'border-primary bg-primary/10 text-primary font-medium' : 'border-border hover:border-primary/50'
                                                                        )}
                                                                    >
                                                                        <Avatar className="h-4 w-4">
                                                                            <AvatarFallback style={{ backgroundColor: s.color ?? '#6366f1' }} className="text-white text-[8px]">
                                                                                {s.name[0]}
                                                                            </AvatarFallback>
                                                                        </Avatar>
                                                                        {s.name}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    <Button type="button" variant="outline" size="sm" onClick={addChore} className="gap-1.5">
                                        <PlusCircle className="h-3.5 w-3.5" /> Add a chore
                                    </Button>
                                </div>
                            )}

                            {/* Step 2: Invite */}
                            {step === 2 && (
                                <div className="space-y-6">
                                    <div>
                                        <h2 className="text-lg font-semibold">Invite others</h2>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Add a co-parent or link your kids' own accounts so they can log in and see their balance.
                                        </p>
                                    </div>

                                    {invitesSent.length > 0 && (
                                        <div className="space-y-1.5">
                                            {invitesSent.map(email => (
                                                <div key={email} className="flex items-center gap-2 text-sm text-gumleaf-600">
                                                    <Check className="h-3.5 w-3.5 shrink-0" />
                                                    Invite sent to {email}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Parent invite */}
                                    <div className="space-y-2">
                                        <Label className="font-medium">Invite a co-parent</Label>
                                        <p className="text-xs text-muted-foreground">They'll receive an email invitation to join {family.name}.</p>
                                        <div className="flex gap-2">
                                            <Input
                                                type="email"
                                                placeholder="parent@example.com"
                                                value={parentEmail}
                                                onChange={e => setParentEmail(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && sendParentInvite()}
                                                className="flex-1"
                                            />
                                            <Button
                                                type="button" variant="outline" size="sm"
                                                disabled={!parentEmail.trim() || processing}
                                                onClick={sendParentInvite}
                                            >
                                                Send invite
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Child account links */}
                                    {family.spenders.length > 0 && (
                                        <div className="space-y-3">
                                            <div>
                                                <Label className="font-medium">Link child accounts</Label>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    Your kids can log in with their own account to see their balance and mark chores as done.
                                                </p>
                                            </div>
                                            {family.spenders.map(spender => (
                                                <div key={spender.id} className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8 shrink-0">
                                                        <AvatarFallback style={{ backgroundColor: spender.color ?? '#6366f1' }} className="text-white text-xs font-bold">
                                                            {spender.name[0].toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-sm font-medium w-20 shrink-0">{spender.name}</span>
                                                    <Input
                                                        type="email"
                                                        placeholder="kid@example.com"
                                                        value={childInvites[spender.id] ?? ''}
                                                        onChange={e => setChildInvites(prev => ({ ...prev, [spender.id]: e.target.value }))}
                                                        onKeyDown={e => e.key === 'Enter' && sendChildInvite(spender.id)}
                                                        className="flex-1"
                                                    />
                                                    <Button
                                                        type="button" variant="outline" size="sm"
                                                        disabled={!(childInvites[spender.id]?.trim()) || processing}
                                                        onClick={() => sendChildInvite(spender.id)}
                                                    >
                                                        Send
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Navigation */}
                            <div className="flex items-center justify-between mt-8 pt-5 border-t">
                                <div>
                                    {step > 0 && (
                                        <Button type="button" variant="ghost" size="sm" onClick={() => setStep(s => s - 1)} className="gap-1">
                                            <ChevronLeft className="h-3.5 w-3.5" /> Back
                                        </Button>
                                    )}
                                </div>
                                <div className="flex items-center gap-3">
                                    {step < 2 && (
                                        <Button
                                            type="button" variant="link" size="sm"
                                            className="text-muted-foreground"
                                            onClick={() => setStep(s => s + 1)}
                                            disabled={processing}
                                        >
                                            Do this later
                                        </Button>
                                    )}
                                    {step === 0 && (
                                        <Button type="button" onClick={submitPocketMoney} disabled={processing} className="gap-1.5">
                                            Continue <ChevronRight className="h-3.5 w-3.5" />
                                        </Button>
                                    )}
                                    {step === 1 && (
                                        <Button type="button" onClick={submitChores} disabled={processing} className="gap-1.5">
                                            Continue <ChevronRight className="h-3.5 w-3.5" />
                                        </Button>
                                    )}
                                    {step === 2 && (
                                        <Link href={route('dashboard')}>
                                            <Button type="button" className="gap-1.5">
                                                Go to dashboard <ChevronRight className="h-3.5 w-3.5" />
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Skip all remaining */}
                    {step < 2 && (
                        <div className="text-center mt-4">
                            <Link href={route('dashboard')} className="text-xs text-muted-foreground hover:text-foreground underline-offset-4 hover:underline">
                                Skip setup and go to dashboard
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
