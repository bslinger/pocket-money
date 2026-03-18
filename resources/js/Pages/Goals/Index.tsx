import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { Spender, SavingsGoal } from '@/types/models';

interface SpenderWithGoals extends Spender {
  savings_goals: SavingsGoal[];
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
                <div className="space-y-3">
                  {spender.savings_goals.map(goal => {
                    const current = parseFloat(goal.current_amount);
                    const target = parseFloat(goal.target_amount);
                    const pct = Math.min(100, target > 0 ? (current / target) * 100 : 0);
                    return (
                      <div key={goal.id} className="bg-white dark:bg-gray-800 rounded-xl shadow p-5">
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
                              ${current.toFixed(2)}
                              <span className="text-gray-400 font-normal"> / ${target.toFixed(2)}</span>
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
