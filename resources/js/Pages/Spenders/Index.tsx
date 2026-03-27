import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Family, SavingsGoal, Account } from '@/types/models';
import { Avatar, AvatarFallback, AvatarImage } from '@/Components/ui/avatar';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { PlusCircle, Pencil, Target, CheckSquare, Eye } from 'lucide-react';
import { formatAmount, spenderCurrencySymbol } from '@/lib/utils';

interface SpenderRow {
    id: string;
    name: string;
    avatar_url: string | null;
    color: string | null;
    currency_symbol: string | null;
    currency_name: string | null;
    use_integer_amounts: boolean | null;
    deleted_at: string | null;
    total_balance: number;
    today_completions_count: number;
    accounts: Account[];
    savings_goals: (SavingsGoal & { account: Account | null })[];
    closest_goal: (SavingsGoal & { account: Account | null }) | null;
    family?: Family;
}

interface Props {
    family: Family;
    spenders: SpenderRow[];
}

function goalAmountLabel(current: number, target: number, sym: string): string {
    const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
    return `${formatAmount(current, sym)} of ${formatAmount(target, sym)} (${pct}%)`;
}

export default function SpendersIndex({ family, spenders }: Props) {
    const currencySymbol = family.currency_symbol;

    return (
        <AuthenticatedLayout header={
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold">Kids</h1>
                <Button asChild size="sm">
                    <Link href={route('spenders.create')}>
                        <PlusCircle className="h-4 w-4 mr-1.5" />
                        Add Kid
                    </Link>
                </Button>
            </div>
        }>
            <Head title="Kids" />

            {spenders.length === 0 ? (
                <Card className="max-w-md mx-auto mt-16 text-center">
                    <CardContent className="pt-10 pb-10 flex flex-col items-center gap-4">
                        <div className="rounded-full bg-muted p-4">
                            <PlusCircle className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-lg">No kids yet</h2>
                            <p className="text-muted-foreground text-sm mt-1">Add a profile for each child in your family.</p>
                        </div>
                        <Button asChild>
                            <Link href={route('spenders.create')}>
                                <PlusCircle className="h-4 w-4 mr-2" />
                                Add a Kid
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">{family.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y">
                            {spenders.map(spender => {
                                const sym = spender.currency_symbol ?? currencySymbol;
                                const balance = spender.total_balance ?? 0;
                                const activeGoals = (spender.savings_goals ?? [])
                                    .filter(g => !g.is_completed)
                                    .sort((a, b) => a.sort_order - b.sort_order);
                                const hasMultipleAccounts = (spender.accounts?.length ?? 0) > 1;

                                return (
                                    <div key={spender.id} className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            {/* Avatar */}
                                            <Link href={route('spenders.show', spender.id)} prefetch>
                                                <Avatar className="h-10 w-10 shrink-0">
                                                    <AvatarImage src={spender.avatar_url ?? undefined} />
                                                    <AvatarFallback
                                                        style={{ backgroundColor: spender.color ?? '#6366f1' }}
                                                        className="text-white font-semibold"
                                                    >
                                                        {spender.name[0].toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                            </Link>

                                            {/* Name + balance */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <Link
                                                        href={route('spenders.show', spender.id)}
                                                        className="font-medium hover:underline truncate"
                                                    >
                                                        {spender.name}
                                                    </Link>
                                                    {spender.deleted_at && (
                                                        <Badge variant="secondary" className="text-xs">Archived</Badge>
                                                    )}
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    {formatAmount(balance, sym)}
                                                </p>
                                            </div>

                                            {/* Top priority goal (single account only) */}
                                            {!hasMultipleAccounts && (
                                                <div className="hidden sm:flex flex-col items-end gap-1 w-52 shrink-0">
                                                    {activeGoals.length > 0 ? (() => {
                                                        const goal = activeGoals[0];
                                                        const goalCurrent = goal.account?.balance ? parseFloat(goal.account.balance) : 0;
                                                        const goalTarget = parseFloat(goal.target_amount);
                                                        const goalPct = goalTarget > 0 ? Math.min(100, Math.round((goalCurrent / goalTarget) * 100)) : 0;
                                                        return (
                                                            <Link href={route('goals.show', goal.id)} className="w-full group">
                                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground w-full justify-end">
                                                                    <Target className="h-3 w-3 shrink-0" />
                                                                    <span className="truncate max-w-[100px] group-hover:underline">{goal.name}</span>
                                                                    <span className="font-medium text-foreground shrink-0">{goalPct}%</span>
                                                                </div>
                                                                <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                                                                    <div
                                                                        className="bg-primary h-1.5 rounded-full transition-all"
                                                                        style={{ width: `${goalPct}%` }}
                                                                    />
                                                                </div>
                                                                <p className="text-xs text-muted-foreground mt-0.5 text-right">
                                                                    {goalAmountLabel(goalCurrent, goalTarget, sym)}
                                                                </p>
                                                            </Link>
                                                        );
                                                    })() : (
                                                        <span className="text-xs text-muted-foreground">No active goal</span>
                                                    )}
                                                </div>
                                            )}

                                            {/* Today's chores */}
                                            <div className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground w-24 justify-end shrink-0">
                                                <CheckSquare className="h-3.5 w-3.5 shrink-0" />
                                                <span>
                                                    {spender.today_completions_count === 0
                                                        ? 'No chores'
                                                        : `${spender.today_completions_count} today`}
                                                </span>
                                            </div>

                                            {/* View as + Edit */}
                                            <div className="flex items-center gap-1 shrink-0">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    title={`View as ${spender.name}`}
                                                    onClick={() => router.post(route('dashboard.view-as', spender.id), { return_url: window.location.pathname })}
                                                >
                                                    <Eye className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                                                    <Link href={route('spenders.show', spender.id) + '?tab=manage'}>
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </Link>
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Per-account goal cards for multi-account kids */}
                                        {hasMultipleAccounts && (
                                            <div className="mt-3 ml-14 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {[...spender.accounts].sort((a, b) => parseFloat(b.balance) - parseFloat(a.balance)).map(account => {
                                                    const accountSym = account.currency_symbol ?? sym;
                                                    const accountBalance = parseFloat(account.balance);
                                                    const topGoal = activeGoals.find(g => g.account_id === account.id) ?? null;
                                                    const goalCurrent = topGoal?.account?.balance ? parseFloat(topGoal.account.balance) : 0;
                                                    const goalTarget = topGoal ? parseFloat(topGoal.target_amount) : 0;
                                                    const goalPct = topGoal && goalTarget > 0 ? Math.min(100, Math.round((goalCurrent / goalTarget) * 100)) : 0;

                                                    return (
                                                        <div key={account.id} className="rounded-lg border bg-muted/30 p-3 space-y-2">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-xs font-medium text-muted-foreground">{account.name}</span>
                                                                <span className="text-sm font-semibold tabular-nums">{formatAmount(accountBalance, accountSym)}</span>
                                                            </div>
                                                            {topGoal ? (
                                                                <Link href={route('goals.show', topGoal.id)} className="block group">
                                                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                                                                        <Target className="h-3 w-3 shrink-0" />
                                                                        <span className="truncate group-hover:underline">{topGoal.name}</span>
                                                                        <span className="ml-auto font-medium text-foreground shrink-0">{goalPct}%</span>
                                                                    </div>
                                                                    <div className="w-full bg-muted rounded-full h-1.5">
                                                                        <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${goalPct}%` }} />
                                                                    </div>
                                                                    <p className="text-xs text-muted-foreground mt-0.5">
                                                                        {goalAmountLabel(goalCurrent, goalTarget, accountSym)}
                                                                    </p>
                                                                </Link>
                                                            ) : (
                                                                <p className="text-xs text-muted-foreground">No active goal</p>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}
        </AuthenticatedLayout>
    );
}
