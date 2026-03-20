import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { SavingsGoal, Spender, Family, Account } from '@/types/models';
import { formatAmount, spenderCurrencySymbol } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Badge } from '@/Components/ui/badge';
import { CheckCircle2, Pencil, Target, CalendarDays, TrendingUp } from 'lucide-react';

interface Props {
    goal: SavingsGoal & {
        spender: Spender & { family: Family };
        account: Account | null;
        image_url: string | null;
    };
}

export default function GoalShow({ goal }: Props) {
    const symbol = spenderCurrencySymbol(goal.spender);
    const current = parseFloat(goal.current_amount);
    const target  = parseFloat(goal.target_amount);
    const pct     = target > 0 ? Math.min(100, (current / target) * 100) : 0;
    const remaining = target - current;

    const daysLeft = goal.target_date
        ? Math.ceil((new Date(goal.target_date).getTime() - Date.now()) / 86_400_000)
        : null;

    const { data, setData, post, processing, errors, reset } = useForm({ amount: '' });

    function contribute(e: React.FormEvent) {
        e.preventDefault();
        post(route('goals.contribute', goal.id), { onSuccess: () => reset() });
    }

    return (
        <AuthenticatedLayout header={
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold">{goal.name}</h1>
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
                <Link href={route('goals.index')} className="text-sm text-muted-foreground hover:text-foreground">
                    ← All goals
                </Link>

                {/* Cover image */}
                {goal.image_url && (
                    <div className="rounded-xl overflow-hidden h-48">
                        <img src={goal.image_url} alt={goal.name} className="w-full h-full object-cover" />
                    </div>
                )}

                {/* Progress card */}
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base flex items-center gap-2">
                                <span
                                    className="h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                                    style={{ backgroundColor: goal.spender.color ?? '#6366f1' }}
                                >
                                    {goal.spender.name[0].toUpperCase()}
                                </span>
                                {goal.spender.name}'s goal
                            </CardTitle>
                            {goal.is_completed && (
                                <Badge className="bg-green-500 hover:bg-green-500 gap-1">
                                    <CheckCircle2 className="h-3 w-3" /> Complete
                                </Badge>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Amounts */}
                        <div className="flex items-end justify-between">
                            <div>
                                <p className="text-3xl font-bold">{formatAmount(current, symbol)}</p>
                                <p className="text-sm text-muted-foreground">saved so far</p>
                            </div>
                            <div className="text-right">
                                <p className="text-lg font-semibold text-muted-foreground">{formatAmount(target, symbol)}</p>
                                <p className="text-sm text-muted-foreground">target</p>
                            </div>
                        </div>

                        {/* Progress bar */}
                        <div className="space-y-1.5">
                            <div className="w-full h-4 bg-muted rounded-full overflow-hidden">
                                <div
                                    className={`h-4 rounded-full transition-all duration-500 ${goal.is_completed ? 'bg-green-500' : 'bg-primary'}`}
                                    style={{ width: `${pct}%` }}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground text-right">{pct.toFixed(0)}%</p>
                        </div>

                        {/* Stats row */}
                        <div className="grid grid-cols-2 gap-3 pt-1">
                            <div className="flex items-center gap-2 text-sm">
                                <TrendingUp className="h-4 w-4 text-muted-foreground shrink-0" />
                                <span>
                                    <span className="font-medium">{formatAmount(remaining > 0 ? remaining : 0, symbol)}</span>
                                    <span className="text-muted-foreground"> to go</span>
                                </span>
                            </div>
                            {daysLeft !== null && (
                                <div className="flex items-center gap-2 text-sm">
                                    <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
                                    <span>
                                        {daysLeft > 0
                                            ? <><span className="font-medium">{daysLeft}</span><span className="text-muted-foreground"> days left</span></>
                                            : <span className="text-destructive font-medium">Past target date</span>
                                        }
                                    </span>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Contribute */}
                {!goal.is_completed && (
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Target className="h-4 w-4" />
                                Add a contribution
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={contribute} className="flex gap-2 items-end">
                                <div className="flex-1 space-y-1.5">
                                    <Label htmlFor="amount">Amount ({symbol})</Label>
                                    <Input
                                        id="amount"
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        value={data.amount}
                                        onChange={e => setData('amount', e.target.value)}
                                        placeholder="0.00"
                                    />
                                    {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
                                </div>
                                <Button type="submit" disabled={processing}>Add</Button>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {/* Completion message */}
                {goal.is_completed && (
                    <Card className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900">
                        <CardContent className="py-4 flex items-center gap-3">
                            <CheckCircle2 className="h-6 w-6 text-green-600 shrink-0" />
                            <div>
                                <p className="font-semibold text-green-700 dark:text-green-400">Goal reached!</p>
                                <p className="text-sm text-green-600 dark:text-green-500">{goal.spender.name} saved {formatAmount(target, symbol)} 🎉</p>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
