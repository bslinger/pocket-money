import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Spender, ChildInvitation } from '@/types/models';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/Components/ui/avatar';
import { Badge } from '@/Components/ui/badge';
import { Eye, Pencil, PlusCircle, Link2, Unlink, User, Mail, X, CheckCircle2, Smartphone } from 'lucide-react';
import { formatAmount, spenderCurrencySymbol } from '@/lib/utils';

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
                        They'll receive an email with a link. They'll need to create a Quiddo account (or log in) using this email address to accept the invitation.
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

export default function SpenderShow({ spender, pendingInvitations }: { spender: Spender; pendingInvitations: ChildInvitation[] }) {
    const { auth } = usePage().props as any;
    const isParent: boolean = auth.isParent ?? false;
    const currencySymbol = spenderCurrencySymbol(spender);
    const totalBalance = spender.accounts?.reduce((sum, a) => sum + parseFloat(a.balance), 0) ?? 0;

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
                            onClick={() => router.post(route('dashboard.view-as', spender.id))}
                        >
                            <Eye className="h-3.5 w-3.5" />
                            View as {spender.name}
                        </Button>
                    </div>
                )}
            </div>
        }>
            <Head title={spender.name} />
            <div className="space-y-6">
                {/* Accounts */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Accounts</h2>
                        <Button variant="outline" size="sm" asChild>
                            <Link href={route('accounts.create', { spender_id: spender.id })}>
                                <PlusCircle className="h-4 w-4 mr-1.5" />
                                Add account
                            </Link>
                        </Button>
                    </div>

                    {(spender.accounts?.length ?? 0) === 0 ? (
                        <Card>
                            <CardContent className="py-10 text-center text-muted-foreground text-sm">
                                No accounts yet. Add one to start tracking money.
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {spender.accounts?.map(account => (
                                <Link key={account.id} href={route('accounts.show', account.id)} prefetch>
                                    <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                                        <CardContent className="pt-4">
                                            <div className="flex items-center justify-between mb-1">
                                                <p className="text-sm font-medium">{account.name}</p>

                                            </div>
                                            <p className="text-2xl font-bold tabular-nums">
                                                {formatAmount(account.balance, currencySymbol)}
                                            </p>
                                            {(account.transactions?.length ?? 0) > 0 && (
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {account.transactions!.length} recent transaction{account.transactions!.length !== 1 ? 's' : ''}
                                                </p>
                                            )}
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* Savings Goals */}
                {(spender.savings_goals?.length ?? 0) > 0 && (
                    <div>
                        <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-3">Savings Goals</h2>
                        <Card>
                            <CardContent className="pt-4 space-y-4">
                                {spender.savings_goals?.map(goal => {
                                    const current = parseFloat(goal.allocated_amount);
                                    const target = parseFloat(goal.target_amount);
                                    const pct = Math.min(100, target > 0 ? (current / target) * 100 : 0);
                                    const pctRounded = Math.round(pct);
                                    return (
                                        <Link key={goal.id} href={route('goals.show', goal.id)} className="block group">
                                            <div className="flex justify-between text-sm mb-1.5">
                                                <span className="font-medium group-hover:underline">{goal.name}</span>
                                                <span className="text-muted-foreground tabular-nums">
                                                    {formatAmount(current, currencySymbol)} of {formatAmount(target, currencySymbol)} ({pctRounded}%)
                                                </span>
                                            </div>
                                            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className="h-2 bg-primary rounded-full transition-all"
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                            {goal.target_date && (
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Target: {new Date(goal.target_date).toLocaleDateString()}
                                                </p>
                                            )}
                                        </Link>
                                    );
                                })}
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Child login card — parents only */}
                <ChildLoginCard spender={spender} pendingInvitations={pendingInvitations} />
            </div>
        </AuthenticatedLayout>
    );
}
