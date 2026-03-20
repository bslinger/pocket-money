import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { Spender } from '@/types/models';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/Components/ui/avatar';
import { Badge } from '@/Components/ui/badge';
import { Eye, PlusCircle, Link2, Unlink, User } from 'lucide-react';
import { formatAmount, spenderCurrencySymbol } from '@/lib/utils';

function ChildLoginCard({ spender }: { spender: Spender }) {
    const { auth } = usePage().props as any;
    const isParent: boolean = auth.isParent ?? false;
    const { data, setData, post, processing, errors, reset } = useForm({ email: '' });

    if (!isParent) return null;

    const linkedUsers = spender.users ?? [];

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Child Login Accounts
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {linkedUsers.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No login account linked yet.</p>
                ) : (
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

                <form
                    onSubmit={e => {
                        e.preventDefault();
                        post(route('spenders.link-child', spender.id), { onSuccess: () => reset() });
                    }}
                    className="flex gap-2 pt-1"
                >
                    <Input
                        type="email"
                        placeholder="Child's email address"
                        value={data.email}
                        onChange={e => setData('email', e.target.value)}
                        className="h-8 text-sm"
                    />
                    <Button type="submit" size="sm" disabled={processing} className="shrink-0">
                        <PlusCircle className="h-3.5 w-3.5 mr-1" />
                        Link
                    </Button>
                </form>
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </CardContent>
        </Card>
    );
}

export default function SpenderShow({ spender }: { spender: Spender }) {
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
                        <AvatarFallback style={{ backgroundColor: spender.color ?? '#6366f1' }} className="text-white font-semibold">
                            {spender.name[0].toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <h1 className="text-xl font-semibold leading-tight">{spender.name}</h1>
                        <p className="text-sm text-muted-foreground">Total: {formatAmount(totalBalance, currencySymbol)}</p>
                    </div>
                </div>
                {isParent && (
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => router.post(route('dashboard.view-as', spender.id))}
                    >
                        <Eye className="h-3.5 w-3.5" />
                        View as {spender.name}
                    </Button>
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
                                <Link key={account.id} href={route('accounts.show', account.id)}>
                                    <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                                        <CardContent className="pt-4">
                                            <div className="flex items-center justify-between mb-1">
                                                <p className="text-sm font-medium">{account.name}</p>
                                                {account.is_savings_pot && (
                                                    <Badge variant="secondary" className="text-xs">Savings</Badge>
                                                )}
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
                                    const current = goal.account ? parseFloat(goal.account.balance) : 0;
                                    const pct = Math.min(100, (current / parseFloat(goal.target_amount)) * 100);
                                    return (
                                        <div key={goal.id}>
                                            <div className="flex justify-between text-sm mb-1.5">
                                                <span className="font-medium">{goal.name}</span>
                                                <span className="text-muted-foreground tabular-nums">
                                                    {formatAmount(current, currencySymbol)} / {formatAmount(goal.target_amount, currencySymbol)}
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
                                        </div>
                                    );
                                })}
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Child login card — parents only */}
                <ChildLoginCard spender={spender} />
            </div>
        </AuthenticatedLayout>
    );
}
