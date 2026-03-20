import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { Family, Spender, ChoreCompletion, Transaction, Chore, SavingsGoal } from '@/types/models';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/Components/ui/avatar';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { PlusCircle, ArrowRight, Users, Check, X, LogOut, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { formatAmount, spenderCurrencySymbol } from '@/lib/utils';

interface Props {
  isParent: boolean;
  families: Family[];
  spenders: Spender[];
  pendingCompletions: (ChoreCompletion & { chore: Chore; spender: Spender })[];
  recentActivity: (Transaction & { account: { spender: Spender } })[];
  totalBalance: string;
  paidThisMonth: string;
}

export default function Dashboard({ isParent, families, spenders, pendingCompletions, recentActivity, totalBalance, paidThisMonth }: Props) {
  const { auth } = usePage().props as any;
  // A parent user may be previewing the child view — still wrap in layout so the exit banner shows
  const isActualParent: boolean = auth.isParent ?? false;

  return (
    <>
      <Head title="Dashboard" />
      {isParent ? (
        <AuthenticatedLayout header={<h1 className="text-xl font-semibold">Dashboard</h1>}>
          <ParentDashboard
            families={families}
            pendingCompletions={pendingCompletions}
            recentActivity={recentActivity}
            totalBalance={totalBalance}
            paidThisMonth={paidThisMonth}
          />
        </AuthenticatedLayout>
      ) : isActualParent ? (
        // Parent previewing child view — keep layout for the "exit view" banner
        <AuthenticatedLayout>
          <ChildDashboard spenders={spenders} />
        </AuthenticatedLayout>
      ) : (
        <ChildDashboard spenders={spenders} />
      )}
    </>
  );
}

// ── Parent ────────────────────────────────────────────────────────────────────

function ParentDashboard({
  families,
  pendingCompletions: initialPending,
  recentActivity,
  totalBalance,
  paidThisMonth,
}: {
  families: Family[];
  pendingCompletions: (ChoreCompletion & { chore: Chore; spender: Spender })[];
  recentActivity: (Transaction & { account: { spender: Spender } })[];
  totalBalance: string;
  paidThisMonth: string;
}) {
  const familyCurrencySymbol = families[0]?.currency_symbol ?? '$';
  // Onboarding: no family yet
  if (families.length === 0) {
    return <CreateFamilyWizard />;
  }

  // Onboarding: family exists but no spenders
  if (families.length > 0 && (families[0].spenders?.length ?? 0) === 0) {
    return (
      <Card className="max-w-md mx-auto mt-16 text-center">
        <CardContent className="pt-10 pb-10 flex flex-col items-center gap-4">
          <div className="rounded-full bg-muted p-4">
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">Add your first kid</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Family "{families[0].name}" is ready — now add a spender profile for each child.
            </p>
          </div>
          <Button asChild>
            <Link href={route('spenders.create')}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add a Kid
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-5 pb-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Family Balance</p>
            <p className="text-3xl font-bold tabular-nums mt-1">{formatAmount(totalBalance, familyCurrencySymbol)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Paid This Month</p>
            <p className="text-3xl font-bold tabular-nums mt-1">{formatAmount(paidThisMonth, familyCurrencySymbol)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Kids section */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Kids</h2>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {families.flatMap(f => (f.spenders ?? []).map(s => ({ spender: s, family: f }))).map(({ spender, family }) => (
            <KidCard key={spender.id} spender={spender} currencySymbol={spender.currency_symbol ?? family.currency_symbol} />
          ))}
          <Link
            href={route('spenders.create')}
            className="shrink-0 flex flex-col items-center justify-center w-32 h-36 rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-colors text-muted-foreground text-sm gap-2"
          >
            <PlusCircle className="h-5 w-5" />
            Add kid
          </Link>
        </div>
      </div>

      {/* Pending approvals */}
      <PendingApprovals initialPending={initialPending} />

      {/* Recent activity */}
      {recentActivity.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            {recentActivity.map(tx => {
              const spender = tx.account?.spender;
              return (
                <div key={tx.id} className="flex items-center justify-between py-2.5 gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {spender && (
                      <Avatar className="h-7 w-7 shrink-0">
                        <AvatarImage src={spender.avatar_url ?? undefined} />
                        <AvatarFallback style={{ backgroundColor: spender.color ?? '#6366f1' }} className="text-white text-xs font-semibold">
                          {spender.name[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm truncate">{tx.description ?? 'Transaction'}</p>
                      <p className="text-xs text-muted-foreground">{spender?.name}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-medium tabular-nums ${tx.type === 'credit' ? 'text-green-600' : 'text-red-500'}`}>
                      {tx.type === 'credit' ? '+' : '-'}{formatAmount(tx.amount, spenderCurrencySymbol(tx.account?.spender ?? { currency_symbol: null }))}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(tx.occurred_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function KidCard({ spender, currencySymbol = '$' }: { spender: Spender; currencySymbol?: string }) {
  const mainBalance = spender.accounts
    ?.filter(a => !a.is_savings_pot)
    .reduce((sum, a) => sum + parseFloat(String(a.balance)), 0) ?? 0;

  const goal = spender.savings_goals?.[0];
  const goalCurrent = goal
    ? (goal.account ? parseFloat(String(goal.account.balance)) : parseFloat(String(goal.current_amount)))
    : 0;
  const goalProgress = goal
    ? Math.min(100, (goalCurrent / parseFloat(String(goal.target_amount))) * 100)
    : null;

  return (
    <Link href={route('spenders.show', spender.id)} className="shrink-0">
      <div className="w-32 h-36 rounded-xl border bg-card p-3 flex flex-col items-center gap-2 hover:border-primary/50 transition-colors">
        <Avatar className="h-12 w-12">
          <AvatarImage src={spender.avatar_url ?? undefined} />
          <AvatarFallback style={{ backgroundColor: spender.color ?? '#6366f1' }} className="text-white font-semibold">
            {spender.name[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <p className="text-sm font-medium truncate w-full text-center">{spender.name}</p>
        <p className="text-base font-bold tabular-nums">{formatAmount(mainBalance, currencySymbol)}</p>
        {goalProgress !== null && (
          <div className="w-full bg-muted rounded-full h-1.5">
            <div className="bg-amber-400 h-1.5 rounded-full transition-all" style={{ width: `${goalProgress}%` }} />
          </div>
        )}
      </div>
    </Link>
  );
}

function PendingApprovals({ initialPending }: {
  initialPending: (ChoreCompletion & { chore: Chore; spender: Spender })[];
}) {
  const [pending, setPending] = useState(initialPending);

  if (pending.length === 0) return null;

  function approve(completion: ChoreCompletion) {
    router.patch(route('chore-completions.approve', completion.id), {}, {
      onSuccess: () => setPending(p => p.filter(c => c.id !== completion.id)),
    });
  }

  function decline(completion: ChoreCompletion) {
    router.patch(route('chore-completions.decline', completion.id), {}, {
      onSuccess: () => setPending(p => p.filter(c => c.id !== completion.id)),
    });
  }

  return (
    <Card className="border-amber-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          Needs your approval
          <Badge className="bg-amber-100 text-amber-800 border-amber-200">{pending.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="divide-y">
        {pending.map(c => (
          <div key={c.id} className="flex items-center justify-between py-3 gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={c.spender.avatar_url ?? undefined} />
                <AvatarFallback style={{ backgroundColor: c.spender.color ?? '#6366f1' }} className="text-white text-sm font-semibold">
                  {c.spender.name[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {c.chore.emoji ? `${c.chore.emoji} ` : ''}{c.chore.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {c.spender.name} · {formatDistanceToNow(new Date(c.completed_at), { addSuffix: true })}
                </p>
              </div>
            </div>
            <div className="flex gap-1.5 shrink-0">
              <Button size="icon" variant="outline" className="h-8 w-8 border-green-300 text-green-700 hover:bg-green-50" onClick={() => approve(c)}>
                <Check className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="outline" className="h-8 w-8 border-red-300 text-red-600 hover:bg-red-50" onClick={() => decline(c)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function CreateFamilyWizard() {
  const { data, setData, post, processing, errors } = useForm({ name: '' });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    post(route('families.store'));
  }

  return (
    <Card className="max-w-md mx-auto mt-16">
      <CardContent className="pt-10 pb-10 flex flex-col items-center gap-6">
        <div className="rounded-full bg-muted p-4">
          <Users className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="text-center">
          <h2 className="font-semibold text-lg">Create your family</h2>
          <p className="text-muted-foreground text-sm mt-1">Give your family a name to get started.</p>
        </div>
        <form onSubmit={submit} className="w-full space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="family-name">Family name</Label>
            <Input
              id="family-name"
              value={data.name}
              onChange={e => setData('name', e.target.value)}
              placeholder="The Smiths"
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>
          <Button type="submit" disabled={processing} className="w-full">
            Create Family
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ── Child ─────────────────────────────────────────────────────────────────────

function ChildDashboard({ spenders }: { spenders: Spender[] }) {
  const { auth } = usePage().props as any;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Minimal header */}
      <header className="flex items-center justify-between px-6 py-4">
        <span className="font-serif text-xl font-bold tracking-tight text-white">Quiddo</span>
        <Link
          href={route('logout')}
          method="post"
          as="button"
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </Link>
      </header>

      <main className="px-6 pb-12 max-w-lg mx-auto space-y-8">
        {spenders.map(spender => (
          <ChildSpenderView key={spender.id} spender={spender} />
        ))}
        {spenders.length === 0 && (
          <p className="text-center text-gray-500 pt-16">No profile linked yet. Ask a parent to set you up!</p>
        )}
      </main>
    </div>
  );
}

function GoalProgressCard({ goal, currencySymbol }: { goal: SavingsGoal; currencySymbol: string }) {
  const current = goal.account ? parseFloat(String(goal.account.balance)) : parseFloat(String(goal.current_amount));
  const target  = parseFloat(String(goal.target_amount));
  const pct     = Math.min(100, target > 0 ? (current / target) * 100 : 0);

  return (
    <div className="bg-gray-900 rounded-2xl overflow-hidden">
      {goal.image_url && (
        <img src={goal.image_url} alt={goal.name} className="w-full h-28 object-cover" />
      )}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-amber-400" />
            <span className="text-sm font-medium">{goal.name}</span>
          </div>
          <span className="text-sm text-gray-400">
            {goal.is_completed ? '🎉 Done!' : `${pct.toFixed(0)}%`}
          </span>
        </div>
        <div className="bg-gray-800 rounded-full h-2.5">
          <div
            className={`h-2.5 rounded-full transition-all ${goal.is_completed ? 'bg-green-400' : 'bg-amber-400'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between mt-1.5 text-xs text-gray-500">
          <span>{formatAmount(current, currencySymbol)}</span>
          <span>{formatAmount(target, currencySymbol)}</span>
        </div>
      </div>
    </div>
  );
}

function ChildSpenderView({ spender }: { spender: Spender }) {
  const currencySymbol = spenderCurrencySymbol(spender);
  const mainBalance = spender.accounts
    ?.filter(a => !a.is_savings_pot)
    .reduce((sum, a) => sum + parseFloat(String(a.balance)), 0) ?? 0;

  const goals = spender.savings_goals ?? [];
  const weekCompletions = spender.chore_completions ?? [];

  return (
    <div className="space-y-6">
      {/* Balance hero */}
      <div className="text-center pt-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
          style={{ backgroundColor: spender.color ?? '#6366f1' }}>
          <span className="text-2xl font-bold text-white">{spender.name[0].toUpperCase()}</span>
        </div>
        <p className="text-gray-400 text-sm">{spender.name}</p>
        <p className="text-5xl font-bold tabular-nums mt-2" style={{ color: spender.color ?? '#6366f1' }}>
          {formatAmount(mainBalance, currencySymbol)}
        </p>
      </div>

      {/* Savings goals */}
      {goals.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">My Goals</h3>
          {goals.map(goal => (
            <GoalProgressCard key={goal.id} goal={goal} currencySymbol={currencySymbol} />
          ))}
        </div>
      )}

      {/* Chores */}
      {(spender.chores?.length ?? 0) > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">My Chores</h3>
          {spender.chores?.map(chore => (
            <ChoreItem key={chore.id} chore={chore} spenderId={spender.id} weekCompletions={weekCompletions} currencySymbol={currencySymbol} />
          ))}
        </div>
      )}
    </div>
  );
}

function ChoreItem({ chore, spenderId, weekCompletions, currencySymbol = '$' }: {
  chore: Chore;
  spenderId: string;
  weekCompletions: { chore_id: string; status: string }[];
  currencySymbol?: string;
}) {
  const thisCompletion = weekCompletions.find(c => c.chore_id === chore.id);
  const [localStatus, setLocalStatus] = useState<string | null>(thisCompletion?.status ?? null);
  const { post, processing } = useForm({ spender_id: spenderId });

  function markDone() {
    post(route('chores.complete', chore.id), {
      onSuccess: () => setLocalStatus('pending'),
    });
  }

  const status = localStatus ?? thisCompletion?.status ?? null;
  const isDeclined = status === 'declined';

  return (
    <div className="bg-gray-900 rounded-2xl p-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{chore.emoji ?? '📋'}</span>
        <div>
          <p className="font-medium text-sm">{chore.name}</p>
          {chore.reward_type === 'earns' && chore.amount && (
            <p className="text-xs text-amber-400">{formatAmount(chore.amount, currencySymbol)}</p>
          )}
        </div>
      </div>
      <div>
        {(status === null || isDeclined) && (
          <button
            onClick={markDone}
            disabled={processing}
            className="flex items-center gap-1.5 bg-white text-gray-900 text-sm font-semibold px-3 py-1.5 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-60"
          >
            <Check className="h-3.5 w-3.5" />
            Done!
          </button>
        )}
        {status === 'pending' && (
          <span className="flex items-center gap-1.5 bg-amber-500/20 text-amber-400 text-sm font-medium px-3 py-1.5 rounded-full">
            ⏳ Waiting
          </span>
        )}
        {status === 'approved' && (
          <span className="flex items-center gap-1.5 bg-green-500/20 text-green-400 text-sm font-medium px-3 py-1.5 rounded-full">
            <Check className="h-3.5 w-3.5" /> Done
          </span>
        )}
      </div>
    </div>
  );
}
