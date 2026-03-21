import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Spender, SavingsGoal } from '@/types/models';
import { formatAmount, spenderCurrencySymbol } from '@/lib/utils';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface SpenderWithGoals extends Spender {
  savings_goals: SavingsGoal[];
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

export default function GoalsIndex({ spenders }: { spenders: SpenderWithGoals[] }) {
  const hasAnyGoals = spenders.some(s => s.savings_goals.length > 0);

  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Savings Goals</h2>}>
      <Head title="Savings Goals" />
      <div className="py-8 max-w-4xl mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium">All Goals</h3>
          <Link href={route('goals.create')} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm">
            + New Goal
          </Link>
        </div>

        {!hasAnyGoals && (
          <p className="text-gray-500 text-sm text-center py-12">No savings goals yet. Create one to get started.</p>
        )}

        <div className="space-y-8">
          {spenders.map(spender => {
            if (spender.savings_goals.length === 0) return null;

            // Group goals by account_id
            const byAccount = spender.savings_goals.reduce<Record<string, SavingsGoal[]>>((acc, goal) => {
              const key = goal.account_id ?? '__none__';
              if (!acc[key]) acc[key] = [];
              acc[key].push(goal);
              return acc;
            }, {});

            return (
              <div key={spender.id}>
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
                          {accountGoals.map((goal, idx) => {
                            const allocated = parseFloat(goal.allocated_amount);
                            const target = parseFloat(goal.target_amount);
                            const pct = Math.min(100, target > 0 ? (allocated / target) * 100 : 0);
                            return (
                              <div key={goal.id} className="flex items-center gap-2">
                                {/* Reorder buttons */}
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
                                    <div className="text-right">
                                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                        {formatAmount(allocated, spenderCurrencySymbol(spender))}
                                        <span className="text-gray-400 font-normal"> / {formatAmount(target, spenderCurrencySymbol(spender))}</span>
                                      </p>
                                      <p className="text-xs text-gray-400">{pct.toFixed(0)}%</p>
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
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
