import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { SavingsGoal, Spender, Family, Account } from '@/types/models';
import { formatAmount, spenderCurrencySymbol } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { CheckCircle2, Pencil, CalendarDays, TrendingUp } from 'lucide-react';

interface Props {
    goal: SavingsGoal & {
        spender: Spender & { family: Family };
        account: Account | null;
        image_url: string | null;
    };
}

export default function GoalShow({ goal }: Props) {
    const symbol = spenderCurrencySymbol(goal.spender);
    const current = parseFloat(goal.allocated_amount);
    const target  = parseFloat(goal.target_amount);
    const pct     = target > 0 ? Math.min(100, (current / target) * 100) : 0;
    const remaining = target - current;
    const isCompleted = goal.is_completed || current >= target;

    const daysLeft = goal.target_date
        ? Math.ceil((new Date(goal.target_date).getTime() - Date.now()) / 86_400_000)
        : null;

    return (
        <AuthenticatedLayout header={
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold text-bark-700">{goal.name}</h1>
                <Button variant="outline" size="sm" asChild>
                    <Link href={route('goals.edit', goal.id)}>
                        <Pencil className="h-3.5 w-3.5 mr-1.5" />
                        Edit
                    </Link>
                </Button>
            </div>
        }>
            <Head title={goal.name} />
            <div className="max-w-lg space-y-4">

                {/* Back */}
                <Link href={route('goals.index')} className="text-sm text-bark-500 hover:text-bark-700">
                    ← All goals
                </Link>

                {/* Cover image */}
                {goal.image_url && (
                    <div className="rounded-card overflow-hidden h-48">
                        <img src={goal.image_url} alt={goal.name} className="w-full h-full object-cover" />
                    </div>
                )}

                {/* Progress card */}
                <Card className="border-bark-200">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base flex items-center gap-2">
                                <span
                                    className="h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                                    style={{ backgroundColor: goal.spender.color ?? '#4A7C59' }}
                                >
                                    {goal.spender.name[0].toUpperCase()}
                                </span>
                                {goal.spender.name}'s goal
                            </CardTitle>
                            {isCompleted && (
                                <Badge className="bg-gumleaf-50 text-gumleaf-600 border-gumleaf-200 gap-1">
                                    <CheckCircle2 className="h-3 w-3" /> Complete
                                </Badge>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Amounts */}
                        <div className="flex items-end justify-between">
                            <div>
                                <p className="font-display text-3xl text-bark-700">{formatAmount(current, symbol)}</p>
                                <p className="text-sm text-bark-500">saved so far</p>
                            </div>
                            <div className="text-right">
                                <p className="font-display text-lg text-bark-400">{formatAmount(target, symbol)}</p>
                                <p className="text-sm text-bark-500">target</p>
                            </div>
                        </div>

                        {/* Progress bar */}
                        <div className="space-y-1.5">
                            <div className="w-full h-4 bg-bark-200 rounded-full overflow-hidden">
                                <div
                                    className={`h-4 rounded-full transition-all duration-500 ${isCompleted ? 'bg-gumleaf-400' : 'bg-wattle-400'}`}
                                    style={{ width: `${pct}%` }}
                                />
                            </div>
                            <p className="text-xs text-wattle-600 text-right font-medium">{pct.toFixed(0)}%</p>
                        </div>

                        {/* Stats row */}
                        <div className="grid grid-cols-2 gap-3 pt-1">
                            <div className="flex items-center gap-2 text-sm">
                                <TrendingUp className="h-4 w-4 text-bark-400 shrink-0" />
                                <span>
                                    <span className="font-medium text-bark-700">{formatAmount(remaining > 0 ? remaining : 0, symbol)}</span>
                                    <span className="text-bark-500"> to go</span>
                                </span>
                            </div>
                            {daysLeft !== null && (
                                <div className="flex items-center gap-2 text-sm">
                                    <CalendarDays className="h-4 w-4 text-bark-400 shrink-0" />
                                    <span>
                                        {daysLeft > 0
                                            ? <><span className="font-medium text-bark-700">{daysLeft}</span><span className="text-bark-500"> days left</span></>
                                            : <span className="text-redearth-400 font-medium">Past target date</span>
                                        }
                                    </span>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Linked account */}
                {goal.account && (
                    <Card className="border-bark-200">
                        <CardContent className="py-4">
                            <p className="text-sm font-medium text-bark-700">Linked to: {goal.account.name}</p>
                            <p className="text-xs text-bark-500 mt-0.5">
                                Progress updates automatically as the account balance changes.
                            </p>
                        </CardContent>
                    </Card>
                )}

                {/* Completion message */}
                {isCompleted && (
                    <Card className="border-gumleaf-200 bg-gumleaf-50">
                        <CardContent className="py-4 flex items-center gap-3">
                            <CheckCircle2 className="h-6 w-6 text-gumleaf-400 shrink-0" />
                            <div>
                                <p className="font-semibold text-gumleaf-600">Goal reached!</p>
                                <p className="text-sm text-gumleaf-600">{goal.spender.name} saved {formatAmount(target, symbol)} 🎉</p>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
