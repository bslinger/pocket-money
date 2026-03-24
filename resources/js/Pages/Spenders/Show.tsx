import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { Spender, ChildInvitation, Account, Transaction, Family, Chore, ChoreCompletion } from '@/types/models';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/Components/ui/avatar';
import { Badge } from '@/Components/ui/badge';
import {
    Eye, Pencil, PlusCircle, Link2, Unlink, User, Mail, X, CheckCircle2,
    Smartphone, Plus, Minus, Check, Clock, ArrowUpRight, ArrowDownLeft,
    QrCode, Trash2, Copy, Wallet, Target, CheckSquare, Receipt, Settings,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { SpenderDevice } from '@quiddo/shared';
import { QRCodeSVG } from 'qrcode.react';
import Modal from '@/Components/Modal';
import { formatAmount, spenderCurrencySymbol, accountCurrencySymbol } from '@/lib/utils';
import { QuickTransactionModal } from '@/Components/QuickTransactionModal';
import { formatDistanceToNow } from 'date-fns';

type Tab = 'accounts' | 'goals' | 'chores' | 'transactions' | 'manage';

function InviteConfirmModal({ email, spenderName, onConfirm, onCancel, processing }: {
    email: string;
    spenderName: string;
    onConfirm: () => void;
    onCancel: () => void;
    processing: boolean;
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
            <div className="relative bg-background rounded-xl shadow-xl max-w-sm w-full p-6 space-y-4">
                <div className="flex items-start justify-between">
                    <h3 className="text-base font-semibold">Invite child account</h3>
                    <button onClick={onCancel} className="text-muted-foreground hover:text-foreground -mt-1">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <p className="text-sm text-muted-foreground">
                    You're about to invite <span className="font-medium text-foreground">{email}</span> to view{' '}
                    <span className="font-medium text-foreground">{spenderName}</span>'s account.
                </p>

                <div className="rounded-lg bg-muted/50 p-4 space-y-3 text-sm">
                    <p className="font-medium text-xs uppercase tracking-wide text-muted-foreground">What they'll get access to</p>
                    <ul className="space-y-2">
                        <li className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-gumleaf-400 shrink-0" />
                            View account balances and transactions
                        </li>
                        <li className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-gumleaf-400 shrink-0" />
                            Track savings goals progress
                        </li>
                        <li className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-gumleaf-400 shrink-0" />
                            Mark chores as complete
                        </li>
                    </ul>
                </div>

                <div className="rounded-lg border border-wattle-200 bg-wattle-50 p-3 space-y-1 text-sm">
                    <p className="font-medium flex items-center gap-1.5 text-wattle-600">
                        <Smartphone className="h-3.5 w-3.5" />
                        What the child needs to do
                    </p>
                    <p className="text-wattle-600/80 text-xs">
                        They'll receive an email with a link. They'll need to create a Quiddo account (or log in) using
                        this email address to accept the invitation.
                    </p>
                </div>

                <div className="flex gap-2 pt-1">
                    <Button onClick={onConfirm} disabled={processing} className="flex-1">
                        Send invitation
                    </Button>
                    <Button variant="outline" onClick={onCancel} disabled={processing}>
                        Cancel
                    </Button>
                </div>
            </div>
        </div>
    );
}

function ChildLoginCard({ spender, pendingInvitations }: { spender: Spender; pendingInvitations: ChildInvitation[] }) {
    const { auth } = usePage().props as any;
    const isParent: boolean = auth.isParent ?? false;
    const { data, setData, post, processing, errors, reset } = useForm({ email: '' });
    const [showModal, setShowModal] = useState(false);

    if (!isParent) return null;

    const linkedUsers = spender.users ?? [];
    const hasAny = linkedUsers.length > 0 || pendingInvitations.length > 0;

    function handleInviteClick(e: React.FormEvent) {
        e.preventDefault();
        if (!data.email) return;
        setShowModal(true);
    }

    function handleConfirm() {
        post(route('spenders.link-child', spender.id), {
            onSuccess: () => { reset(); setShowModal(false); },
            onError: () => setShowModal(false),
        });
    }

    return (
        <>
            {showModal && (
                <InviteConfirmModal
                    email={data.email}
                    spenderName={spender.name}
                    onConfirm={handleConfirm}
                    onCancel={() => setShowModal(false)}
                    processing={processing}
                />
            )}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Child Login Accounts
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {!hasAny && (
                        <p className="text-sm text-muted-foreground">No login account linked yet.</p>
                    )}

                    {linkedUsers.length > 0 && (
                        <div className="space-y-2">
                            {linkedUsers.map(user => (
                                <div key={user.id} className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <Link2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                        <span className="text-sm truncate">{user.email}</span>
                                    </div>
                                    <Link
                                        href={route('spenders.unlink-child', { spender: spender.id, user: user.id })}
                                        method="delete"
                                        as="button"
                                        className="text-destructive hover:text-destructive/80 shrink-0"
                                    >
                                        <Unlink className="h-3.5 w-3.5" />
                                    </Link>
                                </div>
                            ))}
                        </div>
                    )}

                    {pendingInvitations.length > 0 && (
                        <div className="space-y-2">
                            {pendingInvitations.map(inv => (
                                <div key={inv.id} className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <Mail className="h-3.5 w-3.5 text-wattle-400 shrink-0" />
                                        <span className="text-sm truncate text-muted-foreground">{inv.email}</span>
                                        <Badge variant="outline" className="text-xs shrink-0">Pending</Badge>
                                    </div>
                                    <Link
                                        href={route('child-invitations.cancel', inv.id)}
                                        method="delete"
                                        as="button"
                                        className="text-muted-foreground hover:text-destructive shrink-0"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </Link>
                                </div>
                            ))}
                        </div>
                    )}

                    <form onSubmit={handleInviteClick} className="flex gap-2 pt-1">
                        <Input
                            type="email"
                            placeholder="Child's email address"
                            value={data.email}
                            onChange={e => setData('email', e.target.value)}
                            className="h-8 text-sm"
                        />
                        <Button type="submit" size="sm" disabled={processing} className="shrink-0">
                            <PlusCircle className="h-3.5 w-3.5 mr-1" />
                            Invite
                        </Button>
                    </form>
                    {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                </CardContent>
            </Card>
        </>
    );
}

function calcSecondsLeft(expiresAt: string | null) {
    if (!expiresAt) return 0;
    return Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
}

function useCountdown(expiresAt: string | null) {
    const [secondsLeft, setSecondsLeft] = useState(() => calcSecondsLeft(expiresAt));

    // Reset immediately when expiresAt changes (not deferred to useEffect)
    const [prevExpiresAt, setPrevExpiresAt] = useState(expiresAt);
    if (expiresAt !== prevExpiresAt) {
        setPrevExpiresAt(expiresAt);
        setSecondsLeft(calcSecondsLeft(expiresAt));
    }

    useEffect(() => {
        if (!expiresAt) return;
        const id = setInterval(() => setSecondsLeft(calcSecondsLeft(expiresAt)), 1000);
        return () => clearInterval(id);
    }, [expiresAt]);

    const minutes = Math.floor(secondsLeft / 60);
    const seconds = secondsLeft % 60;
    return { secondsLeft, display: `${minutes}:${seconds.toString().padStart(2, '0')}` };
}

function LinkedDevicesCard({ spender, devices, flashLinkCode }: { spender: Spender; devices: SpenderDevice[]; flashLinkCode?: { code: string; expires_at: string } | null }) {
    const { auth } = usePage().props as any;
    const isParent: boolean = auth.isParent ?? false;
    const [generating, setGenerating] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [copied, setCopied] = useState(false);

    // Track code in local state so we can clear it on expiry
    const [activeCode, setActiveCode] = useState<{ code: string; expires_at: string } | null>(flashLinkCode ?? null);

    // Pick up new flash codes
    const flashCodeValue = flashLinkCode?.code ?? null;
    useEffect(() => {
        if (flashLinkCode && flashCodeValue) {
            setActiveCode(flashLinkCode);
            setShowModal(true);
        }
    }, [flashCodeValue]);

    const { secondsLeft, display: countdown } = useCountdown(activeCode?.expires_at ?? null);
    const isExpired = activeCode !== null && secondsLeft <= 0;

    // Clear expired code
    useEffect(() => {
        if (isExpired) setActiveCode(null);
    }, [isExpired]);

    if (!isParent) return null;

    function handleGenerate() {
        setGenerating(true);
        router.post(route('spenders.generate-link-code', spender.id), {}, {
            preserveScroll: true,
            onSuccess: (page: any) => {
                const code = page.props?.flash?.linkCode;
                if (code) {
                    setActiveCode(code);
                    setShowModal(true);
                }
            },
            onFinish: () => setGenerating(false),
        });
    }

    function handleButtonClick() {
        if (activeCode && !isExpired) {
            setShowModal(true);
        } else {
            handleGenerate();
        }
    }

    function handleCopy(code: string) {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    const qrValue = activeCode ? `quiddo://link?code=${activeCode.code}` : '';

    return (
        <>
            <Modal show={showModal && !!activeCode && !isExpired} maxWidth="sm" onClose={() => setShowModal(false)}>
                {activeCode && (
                    <div className="p-6 text-center space-y-5">
                        <div>
                            <h3 className="text-lg font-semibold text-bark-700">Link {spender.name}'s device</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                Scan this QR code or enter the code below on the child's device
                            </p>
                        </div>

                        <div className="flex justify-center">
                            <div className="bg-white p-4 rounded-xl border border-bark-200 inline-block">
                                <QRCodeSVG
                                    value={qrValue}
                                    size={200}
                                    fgColor="#3A3028"
                                    bgColor="#FFFFFF"
                                    level="M"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">Or enter this code manually</p>
                            <div className="flex items-center justify-center gap-2">
                                <span className="text-3xl font-mono font-bold tracking-[0.3em] text-eucalyptus-400">
                                    {activeCode.code}
                                </span>
                                <button
                                    onClick={() => handleCopy(activeCode.code)}
                                    className="text-muted-foreground hover:text-foreground p-1"
                                >
                                    {copied ? <Check className="h-4 w-4 text-gumleaf-400" /> : <Copy className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <p className={`text-xs ${secondsLeft < 60 ? 'text-redearth-400' : 'text-muted-foreground'}`}>
                            Expires in {countdown}
                        </p>

                        <Button variant="outline" size="sm" onClick={() => setShowModal(false)} className="w-full">
                            Done
                        </Button>
                    </div>
                )}
            </Modal>

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Smartphone className="h-4 w-4" />
                        Linked Devices
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <p className="text-xs text-muted-foreground">
                        Link a child's device so they can view their accounts and mark chores complete — no email needed.
                    </p>

                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full gap-1.5"
                        onClick={handleButtonClick}
                        disabled={generating}
                    >
                        <QrCode className="h-3.5 w-3.5" />
                        {generating ? 'Generating...' : activeCode && !isExpired ? 'Show Link Code' : 'Generate Link Code'}
                    </Button>

                    {devices.length > 0 && (
                        <div className="space-y-2 pt-1">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Active devices</p>
                            {devices.map(device => (
                                <div key={device.id} className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <Smartphone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                        <span className="text-sm truncate">{device.device_name || 'Unnamed device'}</span>
                                        {device.last_active_at && (
                                            <span className="text-xs text-muted-foreground shrink-0">
                                                {formatDistanceToNow(new Date(device.last_active_at), { addSuffix: true })}
                                            </span>
                                        )}
                                    </div>
                                    <Link
                                        href={route('spender-devices.revoke', device.id)}
                                        method="delete"
                                        as="button"
                                        preserveScroll
                                        className="text-destructive hover:text-destructive/80 shrink-0"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Link>
                                </div>
                            ))}
                        </div>
                    )}

                    {devices.length === 0 && !activeCode && (
                        <p className="text-sm text-muted-foreground">No devices linked yet.</p>
                    )}
                </CardContent>
            </Card>
        </>
    );
}

export default function SpenderShow({
    spender,
    pendingInvitations,
    transactions,
    spenderDevices,
    flash,
}: {
    spender: Spender;
    pendingInvitations: ChildInvitation[];
    transactions: (Transaction & { account: Account })[];
    spenderDevices: SpenderDevice[];
    flash?: { linkCode?: { code: string; expires_at: string } | null };
}) {
    const { auth } = usePage().props as any;
    const isParent: boolean = auth.isParent ?? false;
    const currencySymbol = spenderCurrencySymbol(spender);
    const totalBalance = spender.accounts?.reduce((sum, a) => sum + parseFloat(a.balance), 0) ?? 0;
    const family = spender.family ?? null;
    const [quickTxModal, setQuickTxModal] = useState<{ account: Account; type: 'credit' | 'debit' } | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>('accounts');

    const tabs: { id: Tab; label: string; icon: LucideIcon; count?: number }[] = [
        { id: 'accounts', label: 'Accounts', icon: Wallet, count: spender.accounts?.length },
        { id: 'goals', label: 'Goals', icon: Target, count: spender.savings_goals?.filter(g => !g.is_completed).length },
        { id: 'chores', label: 'Chores', icon: CheckSquare, count: spender.chores?.length },
        { id: 'transactions', label: 'Transactions', icon: Receipt, count: transactions.length },
        ...(isParent ? [{ id: 'manage' as Tab, label: 'Manage', icon: Settings }] : []),
    ];

    return (
        <AuthenticatedLayout header={
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                        <AvatarImage src={spender.avatar_url ?? undefined} />
                        <AvatarFallback style={{ backgroundColor: spender.color ?? '#4A7C59' }} className="text-white font-semibold">
                            {spender.name[0].toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <h1 className="text-xl font-semibold leading-tight">{spender.name}</h1>
                        <p className="text-sm text-muted-foreground">Total: {formatAmount(totalBalance, currencySymbol)}</p>
                    </div>
                </div>
                {isParent && (
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="gap-1.5" asChild>
                            <Link href={route('spenders.edit', spender.id)}>
                                <Pencil className="h-3.5 w-3.5" />
                                Edit
                            </Link>
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5"
                            onClick={() => router.post(route('dashboard.view-as', spender.id), { return_url: window.location.pathname })}
                        >
                            <Eye className="h-3.5 w-3.5" />
                            View as {spender.name}
                        </Button>
                    </div>
                )}
            </div>
        }>
            <Head title={spender.name} />

            {/* Tab navigation */}
            <div className="flex border-b mb-6 -mt-2 overflow-x-auto">
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    return (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-3 sm:px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors flex items-center gap-1.5 ${
                            activeTab === tab.id
                                ? 'border-eucalyptus-500 text-eucalyptus-600'
                                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                        }`}
                        title={tab.label}
                    >
                        <Icon className="h-4 w-4 sm:hidden" />
                        <span className="hidden sm:inline">{tab.label}</span>
                        {tab.count !== undefined && tab.count > 0 && (
                            <span className={`text-xs rounded-full px-1.5 py-0.5 font-normal ${
                                activeTab === tab.id ? 'bg-eucalyptus-100 text-eucalyptus-600' : 'bg-muted text-muted-foreground'
                            }`}>
                                {tab.count}
                            </span>
                        )}
                    </button>
                    );
                })}
            </div>

            {/* Accounts tab */}
            {activeTab === 'accounts' && (
                <div className="space-y-6">
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Accounts</h2>
                            {isParent && (
                                <Button size="sm" asChild>
                                    <Link href={route('accounts.create', { spender_id: spender.id })}>
                                        <PlusCircle className="h-4 w-4 mr-1.5" />
                                        Add account
                                    </Link>
                                </Button>
                            )}
                        </div>

                        {(spender.accounts?.length ?? 0) === 0 ? (
                            <Card>
                                <CardContent className="py-10 text-center text-muted-foreground text-sm">
                                    No accounts yet. Add one to start tracking money.
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {spender.accounts?.map(account => {
                                    const acctSymbol = accountCurrencySymbol(account, family);
                                    const accountGoals = (spender.savings_goals ?? []).filter(
                                        g => g.account_id === account.id && !g.is_completed
                                    );
                                    return (
                                        <Card key={account.id} className="overflow-hidden">
                                            <div className="flex">
                                                {/* Main content — links to account detail */}
                                                <Link href={route('accounts.show', account.id)} prefetch className="flex-1 hover:bg-muted/30 transition-colors min-w-0">
                                                    <CardContent className="pt-4 pb-3 pr-3">
                                                        <p className="text-sm font-medium mb-1">{account.name}</p>
                                                        <p className="text-2xl font-bold tabular-nums">
                                                            {formatAmount(account.balance, acctSymbol)}
                                                        </p>
                                                        {accountGoals.length > 0 && (
                                                            <div className="mt-2 space-y-1.5">
                                                                {accountGoals.map(goal => {
                                                                    const current = parseFloat(goal.allocated_amount ?? '0');
                                                                    const target = parseFloat(goal.target_amount);
                                                                    const pct = Math.min(100, target > 0 ? (current / target) * 100 : 0);
                                                                    return (
                                                                        <div key={goal.id}>
                                                                            <div className="flex justify-between text-xs text-muted-foreground mb-0.5">
                                                                                <span className="truncate mr-2">{goal.name}</span>
                                                                                <span className="shrink-0 tabular-nums">{Math.round(pct)}%</span>
                                                                            </div>
                                                                            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                                                                                <div className="h-1.5 bg-primary rounded-full" style={{ width: `${pct}%` }} />
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </CardContent>
                                                </Link>
                                                {/* Vertically stacked Spend / Add buttons */}
                                                {isParent && (
                                                    <div className="flex flex-col border-l shrink-0">
                                                        <button
                                                            onClick={() => setQuickTxModal({ account, type: 'debit' })}
                                                            className="flex-1 flex flex-col items-center justify-center gap-0.5 px-3 text-redearth-400 hover:bg-redearth-50 transition-colors"
                                                            aria-label={`Spend from ${account.name}`}
                                                        >
                                                            <Minus className="h-3.5 w-3.5" />
                                                            <span className="text-xs font-medium">Spend</span>
                                                        </button>
                                                        <div className="h-px bg-border" />
                                                        <button
                                                            onClick={() => setQuickTxModal({ account, type: 'credit' })}
                                                            className="flex-1 flex flex-col items-center justify-center gap-0.5 px-3 text-gumleaf-400 hover:bg-gumleaf-50 transition-colors"
                                                            aria-label={`Add to ${account.name}`}
                                                        >
                                                            <Plus className="h-3.5 w-3.5" />
                                                            <span className="text-xs font-medium">Add</span>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                </div>
            )}

            {/* Goals tab */}
            {activeTab === 'goals' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Goals</h2>
                        {isParent && (
                            <Button size="sm" className="gap-1.5" asChild>
                                <Link href={route('goals.create') + `?spender=${spender.id}`}>
                                    <PlusCircle className="h-3.5 w-3.5" />
                                    Add Goal
                                </Link>
                            </Button>
                        )}
                    </div>
                    <GoalsTab spender={spender} currencySymbol={currencySymbol} isParent={isParent} />
                </div>
            )}

            {/* Chores tab */}
            {activeTab === 'chores' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Chores</h2>
                        {isParent && (
                            <Button size="sm" className="gap-1.5" asChild>
                                <Link href={route('chores.create') + `?spender=${spender.id}`}>
                                    <PlusCircle className="h-3.5 w-3.5" />
                                    Add Chore
                                </Link>
                            </Button>
                        )}
                    </div>
                    <ChoresTab spender={spender} isParent={isParent} />
                </div>
            )}

            {/* Transactions tab */}
            {activeTab === 'transactions' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Transactions</h2>
                        {isParent && spender.accounts?.[0] && (
                            <Button size="sm" className="gap-1.5" onClick={() => setQuickTxModal({ account: spender.accounts![0], type: 'credit' })}>
                                <PlusCircle className="h-3.5 w-3.5" />
                                New Transaction
                            </Button>
                        )}
                    </div>
                    <TransactionsTab
                        transactions={transactions}
                        family={family}
                        spender={spender}
                        isParent={isParent}
                        onNewTransaction={(account, type) => setQuickTxModal({ account, type })}
                    />
                </div>
            )}

            {/* Manage tab — parent only */}
            {activeTab === 'manage' && isParent && (
                <div className="space-y-4">
                    <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Manage</h2>
                    <ChildLoginCard spender={spender} pendingInvitations={pendingInvitations} />
                    <LinkedDevicesCard spender={spender} devices={spenderDevices} flashLinkCode={flash?.linkCode} />
                </div>
            )}

            {/* Quick transaction modal for account buttons */}
            {quickTxModal && family && (
                <QuickTransactionModal
                    spender={spender}
                    family={family}
                    initialType={quickTxModal.type}
                    initialAccountId={quickTxModal.account.id}
                    onClose={() => setQuickTxModal(null)}
                />
            )}
        </AuthenticatedLayout>
    );
}

function GoalsTab({ spender, currencySymbol, isParent }: { spender: Spender; currencySymbol: string; isParent: boolean }) {
    const allGoals = spender.savings_goals ?? [];

    if (allGoals.length === 0) {
        return (
            <Card>
                <CardContent className="py-10 text-center text-muted-foreground text-sm">
                    No savings goals yet.
                </CardContent>
            </Card>
        );
    }

    // Group goals by account
    const accountMap = new Map<string | null, { name: string; goals: typeof allGoals }>();
    for (const goal of allGoals) {
        const key = goal.account_id ?? null;
        if (!accountMap.has(key)) {
            accountMap.set(key, { name: goal.account?.name ?? 'Unlinked', goals: [] });
        }
        accountMap.get(key)!.goals.push(goal);
    }

    return (
        <div className="space-y-6">
            {[...accountMap.entries()].map(([accountId, { name, goals }]) => {
                const active = goals.filter(g => !g.is_completed);
                const completed = goals.filter(g => g.is_completed);
                return (
                    <div key={accountId ?? 'unlinked'}>
                        <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-3">{name}</h2>
                        <Card>
                            <CardContent className="pt-4 space-y-4">
                                {active.map(goal => {
                                    const current = parseFloat(goal.allocated_amount ?? '0');
                                    const target = parseFloat(goal.target_amount);
                                    const pct = Math.min(100, target > 0 ? (current / target) * 100 : 0);
                                    return (
                                        <Link key={goal.id} href={route('goals.show', goal.id)} className="block group">
                                            <div className="flex justify-between text-sm mb-1.5">
                                                <span className="font-medium group-hover:underline">{goal.name}</span>
                                                <span className="text-muted-foreground tabular-nums">
                                                    {formatAmount(current, currencySymbol)} of {formatAmount(target, currencySymbol)} ({Math.round(pct)}%)
                                                </span>
                                            </div>
                                            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                                <div className="h-2 bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                                            </div>
                                            {goal.target_date && (
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Target: {new Date(goal.target_date).toLocaleDateString()}
                                                </p>
                                            )}
                                        </Link>
                                    );
                                })}
                                {completed.map(goal => (
                                    <Link key={goal.id} href={route('goals.show', goal.id)} className="flex items-center justify-between gap-2 group">
                                        <span className="text-sm font-medium group-hover:underline text-muted-foreground">{goal.name}</span>
                                        <Badge variant="outline" className="text-gumleaf-600 border-gumleaf-200 shrink-0">
                                            <Check className="h-3 w-3 mr-1" /> Reached
                                        </Badge>
                                    </Link>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                );
            })}
        </div>
    );
}

/** Returns true if the completion date falls within the chore's current period. */
function isInCurrentPeriod(completedAt: string, frequency: string): boolean {
    const date = new Date(completedAt);
    const now = new Date();
    if (frequency === 'daily') {
        return date.toDateString() === now.toDateString();
    }
    if (frequency === 'weekly') {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7)); // Monday
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7);
        return date >= startOfWeek && date < endOfWeek;
    }
    if (frequency === 'monthly') {
        return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
    }
    // For other frequencies fall back to checking the completion exists at all
    return true;
}

function ChoresTab({ spender, isParent }: { spender: Spender; isParent: boolean }) {
    const chores: Chore[] = spender.chores ?? [];
    const completions: (ChoreCompletion & { chore?: Chore })[] = spender.chore_completions ?? [];

    if (chores.length === 0) {
        return (
            <Card>
                <CardContent className="py-10 text-center text-muted-foreground text-sm">
                    No chores assigned to {spender.name}.
                </CardContent>
            </Card>
        );
    }

    // Find the most recent completion within the current period per chore
    const currentPeriodCompletion = new Map<string, ChoreCompletion>();
    for (const c of completions) {
        if (isInCurrentPeriod(c.completed_at, chores.find(ch => ch.id === c.chore_id)?.frequency ?? 'daily')) {
            if (!currentPeriodCompletion.has(c.chore_id)) {
                currentPeriodCompletion.set(c.chore_id, c);
            }
        }
    }

    return (
        <Card>
            <CardContent className="pt-4 divide-y">
                {chores.map(chore => {
                    const current = currentPeriodCompletion.get(chore.id);
                    return (
                        <div key={chore.id} className="py-3 flex items-center justify-between gap-3">
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium">
                                    {chore.emoji ? `${chore.emoji} ` : ''}{chore.name}
                                </p>
                                <p className="text-xs text-muted-foreground capitalize">{chore.frequency}</p>
                            </div>
                            <div className="shrink-0 flex items-center gap-2">
                                <div className="text-right">
                                    {current ? (
                                        <>
                                            {current.status === 'approved' && (
                                                <Badge className="bg-gumleaf-50 text-gumleaf-700 border-gumleaf-200">
                                                    <Check className="h-3 w-3 mr-1" /> Approved
                                                </Badge>
                                            )}
                                            {current.status === 'pending' && (
                                                <Badge variant="outline" className="text-wattle-600 border-wattle-200">
                                                    <Clock className="h-3 w-3 mr-1" /> Pending
                                                </Badge>
                                            )}
                                            {current.status === 'declined' && (
                                                <Badge variant="outline" className="text-redearth-500 border-redearth-200">
                                                    Declined
                                                </Badge>
                                            )}
                                            <p className="text-xs text-muted-foreground mt-0.5" suppressHydrationWarning>
                                                {formatDistanceToNow(new Date(current.completed_at), { addSuffix: true })}
                                            </p>
                                        </>
                                    ) : (
                                        <span className="text-xs text-muted-foreground">Not done yet</span>
                                    )}
                                </div>
                                {isParent && (
                                    <Link
                                        href={route('chores.edit', chore.id)}
                                        className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
                                        aria-label={`Edit ${chore.name}`}
                                    >
                                        <Pencil className="h-3.5 w-3.5" />
                                    </Link>
                                )}
                            </div>
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}

function TransactionsTab({
    transactions,
    family,
    spender,
    isParent,
    onNewTransaction,
}: {
    transactions: (Transaction & { account: Account })[];
    family: Family | null;
    spender: Spender;
    isParent: boolean;
    onNewTransaction: (account: Account, type: 'credit' | 'debit') => void;
}) {
    const firstAccount = spender.accounts?.[0];

    if (transactions.length === 0) {
        return (
            <Card>
                <CardContent className="py-10 text-center text-muted-foreground text-sm">
                    No transactions yet.
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardContent className="pt-4 divide-y">
                {transactions.map(tx => {
                    const acctSymbol = accountCurrencySymbol(tx.account, family);
                    return (
                        <div key={tx.id} className="py-3 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className={`rounded-full p-1.5 shrink-0 ${
                                    tx.type === 'credit' ? 'bg-gumleaf-50 text-gumleaf-500' : 'bg-redearth-50 text-redearth-500'
                                }`}>
                                    {tx.type === 'credit'
                                        ? <ArrowUpRight className="h-3.5 w-3.5" />
                                        : <ArrowDownLeft className="h-3.5 w-3.5" />
                                    }
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm truncate">{tx.description ?? 'Transaction'}</p>
                                    <p className="text-xs text-muted-foreground">{tx.account?.name}</p>
                                </div>
                            </div>
                            <div className="text-right shrink-0">
                                <p className={`text-sm font-medium tabular-nums ${
                                    tx.type === 'credit' ? 'text-gumleaf-500' : 'text-redearth-500'
                                }`}>
                                    {tx.type === 'credit' ? '+' : '-'}{formatAmount(tx.amount, acctSymbol)}
                                </p>
                                <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                                    {formatDistanceToNow(new Date(tx.occurred_at), { addSuffix: true })}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}
