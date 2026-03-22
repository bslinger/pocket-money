import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { Family, Spender, ChoreCompletion, Transaction, Chore, SavingsGoal } from '@/types/models';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/Components/ui/avatar';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { PlusCircle, Check, CheckCheck, X, LogOut, TrendingUp, Plus, Minus, Undo2 } from 'lucide-react';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { formatAmount, spenderCurrencySymbol } from '@/lib/utils';
import { QuickTransactionModal } from '@/Components/QuickTransactionModal';

interface Props {
  isParent: boolean;
  families: Family[];
  spenders: Spender[];
  pendingCompletions: (ChoreCompletion & { chore: Chore; spender: Spender })[];
  recentActivity: (Transaction & { account: { spender: Spender } })[];
  recentApprovedCompletions: (ChoreCompletion & { chore: Chore; spender: Spender })[];
  totalBalance: string;
  paidThisMonth: string;
}

export default function Dashboard({ isParent, families, spenders, pendingCompletions, recentActivity, recentApprovedCompletions, totalBalance, paidThisMonth }: Props) {
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
            recentApprovedCompletions={recentApprovedCompletions}
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

type ActivityItem =
  | { kind: 'transaction'; data: Transaction & { account: { spender: Spender } }; sortKey: string }
  | { kind: 'completion'; data: ChoreCompletion & { chore: Chore; spender: Spender }; sortKey: string };

function ParentDashboard({
  families,
  pendingCompletions: initialPending,
  recentActivity,
  recentApprovedCompletions,
  totalBalance,
  paidThisMonth,
}: {
  families: Family[];
  pendingCompletions: (ChoreCompletion & { chore: Chore; spender: Spender })[];
  recentActivity: (Transaction & { account: { spender: Spender } })[];
  recentApprovedCompletions: (ChoreCompletion & { chore: Chore; spender: Spender })[];
  totalBalance: string;
  paidThisMonth: string;
}) {
  const [quickTxModal, setQuickTxModal] = useState<{ spender: Spender; family: Family; type: 'credit' | 'debit' } | null>(null);
  const familyCurrencySymbol = families[0]?.currency_symbol ?? '$';

  if (families.length === 0) {
    return <CreateFamilyWizard />;
  }

  if (families.length > 0 && (families[0].spenders?.length ?? 0) === 0) {
    return (
      <Card className="max-w-md mx-auto mt-16 text-center">
        <CardContent className="pt-10 pb-10 flex flex-col items-center gap-4">
          <div className="rounded-full bg-bark-50 p-4">
            <PlusCircle className="h-8 w-8 text-bark-500" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">Add your first kid</h2>
            <p className="text-bark-500 text-sm mt-1">
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

  function openQuickTx(spender: Spender, family: Family, type: 'credit' | 'debit') {
    if (!spender.accounts?.length) return;
    setQuickTxModal({ spender, family, type });
  }

  return (
    <div className="space-y-6">
      {/* Kids carousel — top */}
      <div>
        <h2 className="text-xs font-semibold text-bark-500 uppercase tracking-wide mb-3">Kids</h2>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {allSpenders.map(({ spender, family }) => (
            <KidCard
              key={spender.id}
              spender={spender}
              currencySymbol={family.currency_symbol}
              onAdd={() => openQuickTx(spender, family, 'credit')}
              onSubtract={() => openQuickTx(spender, family, 'debit')}
            />
          ))}
          <Link
            href={route('spenders.create')}
            className="shrink-0 flex flex-col items-center justify-center w-36 rounded-card border-2 border-dashed border-bark-200 hover:border-eucalyptus-300 transition-colors text-bark-400 text-sm gap-2 min-h-[140px]"
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
            <p className="text-xs text-bark-500 uppercase tracking-wide">Family Balance</p>
            <p className="text-3xl font-bold tabular-nums mt-1">{formatAmount(totalBalance, familyCurrencySymbol)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-5">
            <p className="text-xs text-bark-500 uppercase tracking-wide">Paid This Month</p>
            <p className="text-3xl font-bold tabular-nums mt-1">{formatAmount(paidThisMonth, familyCurrencySymbol)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending approvals */}
      <PendingApprovals initialPending={initialPending} />

      {/* Recent activity — transactions + approved chore completions merged */}
      {(recentActivity.length > 0 || recentApprovedCompletions.length > 0) && (() => {
        // Suppress chore-reward transactions — their amount is shown on the completion row
        const choreRewardTxIds = new Set(recentApprovedCompletions.map(c => c.transaction_id).filter(Boolean));
        const feed: ActivityItem[] = [
          ...recentActivity.filter(tx => !choreRewardTxIds.has(tx.id)).map(tx => ({ kind: 'transaction' as const, data: tx, sortKey: tx.occurred_at })),
          ...recentApprovedCompletions.map(c => ({ kind: 'completion' as const, data: c, sortKey: c.reviewed_at ?? c.completed_at })),
        ].sort((a, b) => b.sortKey.localeCompare(a.sortKey)).slice(0, 15);

        return (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="divide-y">
              {feed.map(item => {
                if (item.kind === 'transaction') {
                  const tx = item.data;
                  const spender = tx.account?.spender;
                  return (
                    <div key={`tx-${tx.id}`} className="flex items-center justify-between py-2.5 gap-3">
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
                          <p className="text-xs text-bark-500">{spender?.name}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-sm font-medium tabular-nums ${tx.type === 'credit' ? 'text-gumleaf-400' : 'text-redearth-400'}`}>
                          {tx.type === 'credit' ? '+' : '-'}{formatAmount(tx.amount, spenderCurrencySymbol(tx.account?.spender ?? { currency_symbol: null }))}
                        </p>
                        <p className="text-xs text-bark-500" suppressHydrationWarning>
                          {formatDistanceToNow(new Date(tx.occurred_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  );
                }

                const completion = item.data;
                const hasReward = completion.chore?.reward_type === 'earns' && completion.chore?.amount;
                return (
                  <div key={`cc-${completion.id}`} className="flex items-center justify-between py-2.5 gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-7 w-7 shrink-0">
                        <AvatarImage src={completion.spender?.avatar_url ?? undefined} />
                        <AvatarFallback style={{ backgroundColor: completion.spender?.color ?? '#6366f1' }} className="text-white text-xs font-semibold">
                          {completion.spender?.name[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm truncate">{completion.chore?.name}</p>
                        <p className="text-xs text-bark-500">{completion.spender?.name} · approved</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {hasReward && (
                        <p className="text-sm font-medium tabular-nums text-gumleaf-400">
                          +{formatAmount(completion.chore!.amount!, spenderCurrencySymbol(completion.spender ?? { currency_symbol: null }))}
                        </p>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-bark-500 gap-1.5"
                        onClick={() => router.patch(route('chore-completions.unapprove', completion.id), {}, { preserveScroll: true })}
                      >
                        <Undo2 className="h-3.5 w-3.5" />
                        Unapprove
                      </Button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        );
      })()}

      {/* Quick transaction modal */}
      {quickTxModal && (
        <QuickTransactionModal
          spender={quickTxModal.spender}
          family={quickTxModal.family}
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
    ?.reduce((sum, a) => sum + parseFloat(String(a.balance)), 0) ?? 0;

  // Pick the top-priority goal (lowest sort_order)
  const goal = spender.savings_goals
    ?.filter(g => !g.is_completed)
    .sort((a, b) => a.sort_order - b.sort_order)[0] ?? null;
  const goalCurrent = goal ? parseFloat(String(goal.allocated_amount)) : 0;
  const goalProgress = goal
    ? Math.min(100, (goalCurrent / parseFloat(String(goal.target_amount))) * 100)
    : null;

  return (
    <div className="shrink-0 w-40 rounded-card border border-bark-200 bg-white hover:border-eucalyptus-300 transition-colors flex flex-col">
      {/* Clickable top area */}
      <Link href={route('spenders.show', spender.id)} prefetch className="flex flex-col gap-3 p-3 flex-1">
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
        {goal !== null && goalProgress !== null && (
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-1">
              <p className="text-xs font-medium truncate text-bark-500 leading-tight">{goal.name}</p>
            </div>
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs tabular-nums text-wattle-600 font-medium">{formatAmount(goalCurrent, currencySymbol)}</span>
              <span className="text-xs tabular-nums text-bark-500">{formatAmount(parseFloat(String(goal.target_amount)), currencySymbol)}</span>
            </div>
            <div className="w-full bg-bark-200 rounded-full h-1.5">
              <div className="bg-wattle-400 h-1.5 rounded-full transition-all" style={{ width: `${goalProgress}%` }} />
            </div>
          </div>
        )}
      </Link>

      {/* Quick +/- buttons */}
      <div className="flex border-t">
        <button
          onClick={onSubtract}
          className="flex-1 flex items-center justify-center gap-1 py-2 text-redearth-400 hover:bg-redearth-50 transition-colors rounded-bl-xl"
          aria-label={`Subtract from ${spender.name}`}
        >
          <Minus className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">Spend</span>
        </button>
        <div className="w-px bg-bark-200" />
        <button
          onClick={onAdd}
          className="flex-1 flex items-center justify-center gap-1 py-2 text-gumleaf-400 hover:bg-gumleaf-50 transition-colors rounded-br-xl"
          aria-label={`Add to ${spender.name}`}
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">Add</span>
        </button>
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

  function approveAll() {
    router.post(route('chore-completions.bulk-approve'), { ids: pending.map(c => c.id) }, {
      onSuccess: () => setPending([]),
    });
  }

  function decline(completion: ChoreCompletion) {
    router.patch(route('chore-completions.decline', completion.id), {}, {
      onSuccess: () => setPending(p => p.filter(c => c.id !== completion.id)),
    });
  }

  return (
    <Card className="border-wattle-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            Needs your approval
            <Badge className="bg-wattle-50 text-wattle-600 border-wattle-200">{pending.length}</Badge>
          </CardTitle>
          {pending.length > 1 && (
            <Button size="sm" variant="outline" className="border-gumleaf-200 text-gumleaf-600 hover:bg-gumleaf-50 gap-1.5 h-7 text-xs" onClick={approveAll}>
              <CheckCheck className="h-3.5 w-3.5" />
              Approve all
            </Button>
          )}
        </div>
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
                <p className="text-xs text-bark-500" suppressHydrationWarning>
                  {c.spender.name} · {formatDistanceToNow(new Date(c.completed_at), { addSuffix: true })}
                </p>
              </div>
            </div>
            <div className="flex gap-1.5 shrink-0">
              <Button size="icon" variant="outline" className="h-8 w-8 border-gumleaf-200 text-gumleaf-600 hover:bg-gumleaf-50" onClick={() => approve(c)}>
                <Check className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="outline" className="h-8 w-8 border-redearth-200 text-redearth-600 hover:bg-redearth-50" onClick={() => decline(c)}>
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
        <div className="rounded-full bg-bark-50 p-4">
          <PlusCircle className="h-8 w-8 text-bark-500" />
        </div>
        <div className="text-center">
          <h2 className="font-semibold text-lg">Create your family</h2>
          <p className="text-bark-500 text-sm mt-1">Give your family a name to get started.</p>
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
    <div className="min-h-screen bg-nightsky-700 text-white">
      <header className="flex items-center justify-between px-6 py-4">
        {isParentPreview && kidName ? (
          <span className="font-semibold text-white">{kidName}&apos;s view</span>
        ) : (
          <span className="font-display text-xl font-bold tracking-tight text-white">Quiddo</span>
        )}
        {isParentPreview ? (
          <Link
            href={route('dashboard.exit-view-as')}
            method="delete"
            as="button"
            className="flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Back to parent view
          </Link>
        ) : (
          <Link
            href={route('logout')}
            method="post"
            as="button"
            className="flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition-colors"
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
          <p className="text-center text-white/60 pt-16">No profile linked yet. Ask a parent to set you up!</p>
        )}
      </main>
    </div>
  );
}

function GoalProgressCard({ goal, currencySymbol }: { goal: SavingsGoal; currencySymbol: string }) {
  const current = parseFloat(String(goal.allocated_amount));
  const target  = parseFloat(String(goal.target_amount));
  const pct     = Math.min(100, target > 0 ? (current / target) * 100 : 0);

  return (
    <div className="bg-nightsky-600 rounded-2xl overflow-hidden">
      {goal.image_url && (
        <img src={goal.image_url} alt={goal.name} className="w-full h-28 object-cover" />
      )}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-wattle-300" />
            <span className="text-sm font-medium">{goal.name}</span>
          </div>
          <span className="text-sm text-white/60">
            {goal.is_completed ? '🎉 Done!' : `${pct.toFixed(0)}%`}
          </span>
        </div>
        <div className="bg-white/10 rounded-full h-2.5">
          <div
            className={`h-2.5 rounded-full transition-all ${goal.is_completed ? 'bg-gumleaf-400' : 'bg-wattle-400'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-1.5 text-xs text-white/60 text-center">
          <span>{formatAmount(current, currencySymbol)} of {formatAmount(target, currencySymbol)} ({pct.toFixed(0)}%)</span>
        </div>
      </div>
    </div>
  );
}

function ChildSpenderView({ spender }: { spender: Spender }) {
  const currencySymbol = spenderCurrencySymbol(spender);
  const mainBalance = spender.accounts
    ?.reduce((sum, a) => sum + parseFloat(String(a.balance)), 0) ?? 0;

  const goals = spender.savings_goals ?? [];

  return (
    <div className="space-y-6">
      <div className="text-center pt-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
          style={{ backgroundColor: spender.color ?? '#6366f1' }}>
          <span className="text-2xl font-bold text-white">{spender.name[0].toUpperCase()}</span>
        </div>
        <p className="text-white/60 text-sm">{spender.name}</p>
        <p className="text-5xl font-bold tabular-nums mt-2" style={{ color: spender.color ?? '#6366f1' }}>
          {formatAmount(mainBalance, currencySymbol)}
        </p>
      </div>

      {goals.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wide">My Goals</h3>
          {goals.map(goal => (
            <GoalProgressCard key={goal.id} goal={goal} currencySymbol={currencySymbol} />
          ))}
        </div>
      )}

      {(spender.chores?.length ?? 0) > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wide">My Chores</h3>
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
  weekCompletions: { chore_id: string; status: string; reviewer?: { name: string; parent_title: string | null } | null }[];
  currencySymbol?: string;
}) {
  // weekCompletions is ordered most-recent-first; take the latest for this chore
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

  const reviewer = thisCompletion?.reviewer;
  const reviewerName = reviewer?.parent_title ?? reviewer?.name ?? 'Your parent';

  return (
    <div className="bg-nightsky-600 rounded-2xl p-4 flex flex-col gap-3">
      {isDeclined && (
        <div className="flex items-center justify-center gap-1.5 text-redearth-400 text-xs font-medium">
          <Undo2 className="h-3.5 w-3.5 shrink-0" />
          <span>{reviewerName} sent this back</span>
        </div>
      )}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{chore.emoji ?? '📋'}</span>
          <div>
            <p className="font-medium text-sm">{chore.name}</p>
            {chore.reward_type === 'earns' && chore.amount && (
              <p className="text-xs text-wattle-300">{formatAmount(chore.amount, currencySymbol)}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
        {(status === null || isDeclined) && (
          <button
            onClick={markDone}
            disabled={processing}
            className="flex items-center gap-1.5 bg-wattle-400 text-wattle-900 text-sm font-semibold px-3 py-1.5 rounded-full hover:bg-wattle-300 transition-colors disabled:opacity-60"
          >
            <Check className="h-3.5 w-3.5" />
            {isDeclined ? 'This time I really did it!' : 'I did it!'}
          </button>
        )}
        {status === 'pending' && (
          <span className="flex items-center gap-1.5 text-wattle-300 text-sm font-medium">
            ⏳ Waiting confirmation
          </span>
        )}
        {status === 'approved' && (
          <span className="flex items-center gap-1.5 text-gumleaf-400 text-sm font-medium">
            <Check className="h-3.5 w-3.5" /> Done
          </span>
        )}
        </div>
      </div>
    </div>
  );
}
