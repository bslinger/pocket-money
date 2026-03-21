import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { Family, SavingsGoal, Account } from '@/types/models';
import { Avatar, AvatarFallback, AvatarImage } from '@/Components/ui/avatar';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { PlusCircle, Pencil, Target, CheckSquare } from 'lucide-react';
import { formatAmount, spenderCurrencySymbol } from '@/lib/utils';

interface SpenderRow {
    id: string;
    name: string;
    avatar_url: string | null;
    color: string | null;
    currency_symbol: string | null;
    currency_name: string | null;
    deleted_at: string | null;
    total_balance: number;
    today_completions_count: number;
    accounts: Account[];
    closest_goal: (SavingsGoal & { account: Account | null }) | null;
    family?: Family;
}

interface Props {
    family: Family;
    spenders: SpenderRow[];
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
                                const goal = spender.closest_goal;
                                const goalCurrent = goal?.account?.balance ? parseFloat(goal.account.balance) : 0;
                                const goalTarget = goal ? parseFloat(goal.target_amount) : 0;
                                const goalPct = goal && goalTarget > 0 ? Math.min(100, Math.round((goalCurrent / goalTarget) * 100)) : 0;

                                return (
                                    <div key={spender.id} className="flex items-center gap-4 px-6 py-4">
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

                                        {/* Name + badges */}
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

                                        {/* Closest goal */}
                                        <div className="hidden sm:flex flex-col items-end gap-1 w-40 shrink-0">
                                            {goal ? (
                                                <>
                                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground w-full justify-end">
                                                        <Target className="h-3 w-3 shrink-0" />
                                                        <span className="truncate max-w-[100px]">{goal.name}</span>
                                                        <span className="font-medium text-foreground shrink-0">{goalPct}%</span>
                                                    </div>
                                                    <div className="w-full bg-muted rounded-full h-1.5">
                                                        <div
                                                            className="bg-primary h-1.5 rounded-full transition-all"
                                                            style={{ width: `${goalPct}%` }}
                                                        />
                                                    </div>
                                                </>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">No active goal</span>
                                            )}
                                        </div>

                                        {/* Today's chores */}
                                        <div className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground w-24 justify-end shrink-0">
                                            <CheckSquare className="h-3.5 w-3.5 shrink-0" />
                                            <span>
                                                {spender.today_completions_count === 0
                                                    ? 'No chores'
                                                    : `${spender.today_completions_count} today`}
                                            </span>
                                        </div>

                                        {/* Edit */}
                                        <Button variant="ghost" size="icon" asChild className="h-8 w-8 shrink-0">
                                            <Link href={route('spenders.edit', spender.id)}>
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Link>
                                        </Button>
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
