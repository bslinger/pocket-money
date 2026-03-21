import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Spender, SavingsGoal } from '@/types/models';
import { formatAmount, spenderCurrencySymbol } from '@/lib/utils';
import { ChevronUp, ChevronDown, Info, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/Components/ui/button';

interface SpenderWithGoals extends Spender {
  savings_goals: SavingsGoal[];
}

interface Props {
  spenders: SpenderWithGoals[];
  recentCompletedCutoff: string;
}

function reorder(accountGoals: SavingsGoal[], movedId: string, direction: 'up' | 'down') {
  const ids = accountGoals.map(g => g.id);
  const idx = ids.indexOf(movedId);
  if (direction === 'up' && idx === 0) return;
  if (direction === 'down' && idx === ids.length - 1) return;

  const swapWith = direction === 'up' ? idx - 1 : idx + 1;
  [ids[idx], ids[swapWith]] = [ids[swapWith], ids[idx]];

  router.post(route('goals.reorder'), { goal_ids: ids }, { preserveScroll: true });
}

function GoalCard({
  goal,
  sym,
  idx,
  accountGoals,
  isActive,
}: {
  goal: SavingsGoal;
  sym: string;
  idx: number;
  accountGoals: SavingsGoal[];
  isActive: boolean;
}) {
  const allocated = parseFloat(goal.allocated_amount);
  const target = parseFloat(goal.target_amount);
  const pct = Math.min(100, target > 0 ? (allocated / target) * 100 : 0);
  const pctRounded = Math.round(pct);

  return (
    <div className="flex items-center gap-2">
      {/* Reorder buttons (active goals only) */}
      {isActive && (
        <div className="flex flex-col gap-0.5 shrink-0">
          <button
            onClick={() => reorder(accountGoals, goal.id, 'up')}
            disabled={idx === 0}
            className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-20 disabled:cursor-not-allowed"
            aria-label="Move up"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          <button
            onClick={() => reorder(accountGoals, goal.id, 'down')}
            disabled={idx === accountGoals.length - 1}
            className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-20 disabled:cursor-not-allowed"
            aria-label="Move down"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      )}
      {!isActive && <div className="w-6 shrink-0" />}

      <div
        className="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow p-5 cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => router.visit(route('goals.show', goal.id))}
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">{goal.name}</p>
            {goal.target_date && (
              <p className="text-xs text-gray-400 mt-0.5">
                Target: {new Date(goal.target_date).toLocaleDateString()}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {formatAmount(allocated, sym)}
                <span className="text-gray-400 font-normal"> of {formatAmount(target, sym)}</span>
              </p>
              <p className="text-xs text-gray-400">{pctRounded}%</p>
            </div>
            {/* Abandon button — only active goals */}
            {isActive && (
              <button
                onClick={e => {
                  e.stopPropagation();
                  if (confirm(`Abandon "${goal.name}"? This cannot be undone.`)) {
                    router.patch(route('goals.abandon', goal.id), {}, { preserveScroll: false });
                  }
                }}
                className="ml-2 p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded"
                aria-label={`Abandon ${goal.name}`}
                title="Abandon goal"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        <div className="w-full h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-2.5 rounded-full ${goal.is_completed ? 'bg-green-500' : 'bg-indigo-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        {goal.is_completed && (
          <p className="text-xs text-green-600 font-medium mt-2">Goal reached!</p>
        )}
      </div>
    </div>
  );
}

function SpenderGoals({
  spender,
  goals,
  isActive,
}: {
  spender: SpenderWithGoals;
  goals: SavingsGoal[];
  isActive: boolean;
}) {
  if (goals.length === 0) return null;

  const sym = spenderCurrencySymbol(spender);

  // Group by account_id
  const byAccount = goals.reduce<Record<string, SavingsGoal[]>>((acc, goal) => {
    const key = goal.account_id ?? '__none__';
    if (!acc[key]) acc[key] = [];
    acc[key].push(goal);
    return acc;
  }, {});

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        {spender.avatar_url ? (
          <img src={spender.avatar_url} alt={spender.name} className="w-7 h-7 rounded-full object-cover" />
        ) : (
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
            style={{ backgroundColor: spender.color ?? '#6366f1' }}
          >
            {spender.name[0].toUpperCase()}
          </div>
        )}
        <h4 className="font-semibold text-gray-900 dark:text-gray-100">{spender.name}</h4>
      </div>

      <div className="space-y-6">
        {Object.entries(byAccount).map(([accountKey, accountGoals]) => {
          const accountName = accountGoals[0]?.account?.name;
          return (
            <div key={accountKey}>
              {accountName && (
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 ml-1">
                  {accountName}
                </p>
              )}
              <div className="space-y-3">
                {accountGoals.map((goal, idx) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    sym={sym}
                    idx={idx}
                    accountGoals={accountGoals}
                    isActive={isActive}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function GoalsIndex({ spenders, recentCompletedCutoff }: Props) {
  const [tab, setTab] = useState<'active' | 'completed'>('active');
  const cutoff = new Date(recentCompletedCutoff);

  // Split goals: active = incomplete OR completed within the last week
  const spendersWithActive = spenders.map(s => ({
    ...s,
    savings_goals: s.savings_goals.filter(g =>
      !g.is_completed || (g.completed_at && new Date(g.completed_at) >= cutoff)
    ),
  }));

  const spendersWithCompleted = spenders.map(s => ({
    ...s,
    savings_goals: s.savings_goals.filter(g =>
      g.is_completed && (!g.completed_at || new Date(g.completed_at) < cutoff)
    ),
  }));

  const hasActive = spendersWithActive.some(s => s.savings_goals.length > 0);
  const hasCompleted = spendersWithCompleted.some(s => s.savings_goals.length > 0);

  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Savings Goals</h2>}>
      <Head title="Savings Goals" />
      <div className="py-8 max-w-4xl mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-1 rounded-lg border bg-muted p-1">
            <button
              onClick={() => setTab('active')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                tab === 'active'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setTab('completed')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                tab === 'completed'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Completed
            </button>
          </div>
          <div className="flex items-center gap-2">
            {hasCompleted && tab === 'active' && (
              <Button variant="ghost" size="sm" asChild>
                <Link href={route('goals.abandoned')} className="text-muted-foreground text-xs">
                  Abandoned goals
                </Link>
              </Button>
            )}
            <Link href={route('goals.create')} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm">
              + New Goal
            </Link>
          </div>
        </div>

        {tab === 'active' && (
          <>
            {hasActive && (
              <div className="flex gap-2.5 rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800 p-3 mb-6 text-sm text-blue-800 dark:text-blue-300">
                <Info className="h-4 w-4 shrink-0 mt-0.5 text-blue-500" />
                <div className="space-y-1">
                  <p className="font-medium">Goals fill in priority order</p>
                  <p className="text-blue-700/80 dark:text-blue-400 text-xs">
                    An account's balance is allocated to goals from top to bottom — the first goal fills completely before any remainder spills to the next.
                    Use the arrows to change the order within each account.
                  </p>
                </div>
              </div>
            )}

            {!hasActive && (
              <p className="text-gray-500 text-sm text-center py-12">No active goals. Create one to get started.</p>
            )}

            <div className="space-y-8">
              {spendersWithActive.map(spender => (
                <SpenderGoals key={spender.id} spender={spender} goals={spender.savings_goals} isActive={true} />
              ))}
            </div>
          </>
        )}

        {tab === 'completed' && (
          <>
            {!hasCompleted && (
              <p className="text-gray-500 text-sm text-center py-12">No completed goals yet.</p>
            )}

            <div className="space-y-8">
              {spendersWithCompleted.map(spender => (
                <SpenderGoals key={spender.id} spender={spender} goals={spender.savings_goals} isActive={false} />
              ))}
            </div>
          </>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
