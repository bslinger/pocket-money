import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { Family, Spender, ChoreCompletion, Transaction, Chore, SavingsGoal } from '@/types/models';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/Components/ui/avatar';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { PlusCircle, Check, X, LogOut, TrendingUp, Plus, Minus } from 'lucide-react';
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
  const isActualParent: boolean = auth.isParent ?? false;

  return (
    <>
      <Head title="Dashboard" />
      {isParent ? (
        <AuthenticatedLayout>
          <ParentDashboard
            families={families}
            pendingCompletions={pendingCompletions}
            recentActivity={recentActivity}
            totalBalance={totalBalance}
            paidThisMonth={paidThisMonth}
          />
        </AuthenticatedLayout>
      ) : isActualParent ? (
        // Parent previewing child view — full screen, no nav
        <ChildDashboard spenders={spenders} isParentPreview />
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
  const [quickTxModal, setQuickTxModal] = useState<{ spender: Spender; accountId: string; type: 'credit' | 'debit' } | null>(null);
  const familyCurrencySymbol = families[0]?.currency_symbol ?? '$';

  if (families.length === 0) {
    return <CreateFamilyWizard />;
  }

  if (families.length > 0 && (families[0].spenders?.length ?? 0) === 0) {
    return (
      <Card className="max-w-md mx-auto mt-16 text-center">
        <CardContent className="pt-10 pb-10 flex flex-col items-center gap-4">
          <div className="rounded-full bg-muted p-4">
            <PlusCircle className="h-8 w-8 text-muted-foreground" />
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

  const allSpenders = families.flatMap(f => (f.spenders ?? []).map(s => ({ spender: s, family: f })));

  function openQuickTx(spender: Spender, type: 'credit' | 'debit') {
    const mainAccount = spender.accounts?.find(a => !a.is_savings_pot);
    if (!mainAccount) return;
    setQuickTxModal({ spender, accountId: mainAccount.id, type });
  }

  return (
    <div className="space-y-6">
      {/* Kids carousel — top */}
      <div>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Kids</h2>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {allSpenders.map(({ spender, family }) => (
            <KidCard
              key={spender.id}
              spender={spender}
              currencySymbol={spender.currency_symbol ?? family.currency_symbol}
              onAdd={() => openQuickTx(spender, 'credit')}
              onSubtract={() => openQuickTx(spender, 'debit')}
            />
          ))}
          <Link
            href={route('spenders.create')}
            className="shrink-0 flex flex-col items-center justify-center w-36 rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-colors text-muted-foreground text-sm gap-2 min-h-[140px]"
          >
            <PlusCircle className="h-5 w-5" />
            Add kid
          </Link>
        </div>
      </div>

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

      {/* Quick transaction modal */}
      {quickTxModal && (
        <QuickTransactionModal
          spender={quickTxModal.spender}
          accountId={quickTxModal.accountId}
          initialType={quickTxModal.type}
          onClose={() => setQuickTxModal(null)}
        />
      )}
    </div>
  );
}

// ── Kid Card ──────────────────────────────────────────────────────────────────

function KidCard({
  spender,
  currencySymbol = '$',
  onAdd,
  onSubtract,
}: {
  spender: Spender;
  currencySymbol?: string;
  onAdd: () => void;
  onSubtract: () => void;
}) {
  const mainBalance = spender.accounts
    ?.filter(a => !a.is_savings_pot)
    .reduce((sum, a) => sum + parseFloat(String(a.balance)), 0) ?? 0;

  // Pick the goal closest to completion (highest progress %)
  const goal = spender.savings_goals
    ?.filter(g => !g.is_completed)
    .sort((a, b) => {
      const pctA = a.account ? parseFloat(String(a.account.balance)) / Math.max(parseFloat(String(a.target_amount)), 0.01) : 0;
      const pctB = b.account ? parseFloat(String(b.account.balance)) / Math.max(parseFloat(String(b.target_amount)), 0.01) : 0;
      return pctB - pctA;
    })[0] ?? null;
  const goalCurrent = goal
    ? (goal.account ? parseFloat(String(goal.account.balance)) : 0)
    : 0;
  const goalProgress = goal
    ? Math.min(100, (goalCurrent / parseFloat(String(goal.target_amount))) * 100)
    : null;

  return (
    <div className="shrink-0 w-40 rounded-xl border bg-card hover:border-primary/40 transition-colors flex flex-col">
      {/* Clickable top area */}
      <Link href={route('spenders.show', spender.id)} className="flex flex-col gap-3 p-3 flex-1">
        {/* Avatar + name row */}
        <div className="flex items-center gap-2.5">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage src={spender.avatar_url ?? undefined} />
            <AvatarFallback style={{ backgroundColor: spender.color ?? '#6366f1' }} className="text-white font-semibold text-sm">
              {spender.name[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <p className="text-sm font-semibold truncate leading-tight">{spender.name}</p>
        </div>

        {/* Balance */}
        <p className="text-2xl font-bold tabular-nums">{formatAmount(mainBalance, currencySymbol)}</p>

        {/* Goal progress */}
        {goalProgress !== null && (
          <div className="w-full bg-muted rounded-full h-1.5">
            <div className="bg-amber-400 h-1.5 rounded-full transition-all" style={{ width: `${goalProgress}%` }} />
          </div>
        )}
      </Link>

      {/* Quick +/- buttons */}
      <div className="flex border-t">
        <button
          onClick={onSubtract}
          className="flex-1 flex items-center justify-center gap-1 py-2 text-red-500 hover:bg-red-50 transition-colors rounded-bl-xl"
          aria-label={`Subtract from ${spender.name}`}
        >
          <Minus className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">Take</span>
        </button>
        <div className="w-px bg-border" />
        <button
          onClick={onAdd}
          className="flex-1 flex items-center justify-center gap-1 py-2 text-green-600 hover:bg-green-50 transition-colors rounded-br-xl"
          aria-label={`Add to ${spender.name}`}
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">Add</span>
        </button>
      </div>
    </div>
  );
}

// ── Quick Transaction Modal ───────────────────────────────────────────────────

function QuickTransactionModal({
  spender,
  accountId,
  initialType,
  onClose,
}: {
  spender: Spender;
  accountId: string;
  initialType: 'credit' | 'debit';
  onClose: () => void;
}) {
  const currencySymbol = spenderCurrencySymbol(spender);
  const [type, setType] = useState<'credit' | 'debit'>(initialType);
  const { data, setData, post, processing, errors, reset } = useForm({
    type,
    amount: '',
    description: '',
    occurred_at: new Date().toISOString(),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    post(route('accounts.transactions.store', accountId), {
      onSuccess: () => {
        reset();
        onClose();
        router.reload({ only: ['families', 'totalBalance', 'paidThisMonth', 'recentActivity'] });
      },
    });
  }

  function switchType(newType: 'credit' | 'debit') {
    setType(newType);
    setData('type', newType);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Panel */}
      <div
        className="relative w-full max-w-sm bg-card rounded-2xl shadow-xl p-5 flex flex-col gap-4"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Avatar className="h-8 w-8">
              <AvatarImage src={spender.avatar_url ?? undefined} />
              <AvatarFallback style={{ backgroundColor: spender.color ?? '#6366f1' }} className="text-white text-xs font-semibold">
                {spender.name[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="font-semibold text-sm">{spender.name}</span>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Credit / Debit toggle — subtract left, add right */}
        <div className="flex rounded-lg border overflow-hidden">
          <button
            type="button"
            onClick={() => switchType('debit')}
            className={`flex-1 py-2 text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
              type === 'debit' ? 'bg-red-500 text-white' : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            <Minus className="h-3.5 w-3.5" />
            Take away
          </button>
          <div className="w-px bg-border" />
          <button
            type="button"
            onClick={() => switchType('credit')}
            className={`flex-1 py-2 text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
              type === 'credit' ? 'bg-green-600 text-white' : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            <Plus className="h-3.5 w-3.5" />
            Add money
          </button>
        </div>

        {/* Form */}
        <form onSubmit={submit} className="flex flex-col gap-3">
          {/* Amount */}
          <div className="space-y-1">
            <Label htmlFor="quick-amount">Amount ({currencySymbol})</Label>
            <Input
              id="quick-amount"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              value={data.amount}
              onChange={e => setData('amount', e.target.value)}
              autoFocus
            />
            {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
          </div>

          {/* Description */}
          <div className="space-y-1">
            <Label htmlFor="quick-desc">Note <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input
              id="quick-desc"
              placeholder="e.g. Pocket money"
              value={data.description}
              onChange={e => setData('description', e.target.value)}
            />
          </div>

          <Button
            type="submit"
            disabled={processing || !data.amount}
            className={type === 'credit' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-500 hover:bg-red-600'}
          >
            {type === 'credit' ? 'Add' : 'Deduct'} {data.amount ? `${currencySymbol}${data.amount}` : ''}
          </Button>
        </form>
      </div>
    </div>
  );
}

// ── Pending Approvals ─────────────────────────────────────────────────────────

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

// ── Create Family Wizard ──────────────────────────────────────────────────────

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
          <PlusCircle className="h-8 w-8 text-muted-foreground" />
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

function ChildDashboard({ spenders, isParentPreview = false }: { spenders: Spender[]; isParentPreview?: boolean }) {
  const kidName = spenders[0]?.name;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="flex items-center justify-between px-6 py-4">
        {isParentPreview && kidName ? (
          <span className="font-semibold text-white">{kidName}&apos;s view</span>
        ) : (
          <span className="font-serif text-xl font-bold tracking-tight text-white">Quiddo</span>
        )}
        {isParentPreview ? (
          <Link
            href={route('dashboard.exit-view-as')}
            method="delete"
            as="button"
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Back to parent view
          </Link>
        ) : (
          <Link
            href={route('logout')}
            method="post"
            as="button"
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </Link>
        )}
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
  const current = goal.account ? parseFloat(String(goal.account.balance)) : 0;
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

  return (
    <div className="space-y-6">
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

      {goals.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">My Goals</h3>
          {goals.map(goal => (
            <GoalProgressCard key={goal.id} goal={goal} currencySymbol={currencySymbol} />
          ))}
        </div>
      )}

      {(spender.chores?.length ?? 0) > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">My Chores</h3>
          {spender.chores?.map(chore => (
            <ChoreItem key={chore.id} chore={chore} spenderId={spender.id} weekCompletions={spender.chore_completions ?? []} currencySymbol={currencySymbol} />
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
