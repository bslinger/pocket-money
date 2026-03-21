import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Spender, SavingsGoal } from '@/types/models';
import { formatAmount, spenderCurrencySymbol } from '@/lib/utils';
import { Trash2, ArrowLeft } from 'lucide-react';
import { Button } from '@/Components/ui/button';

interface SpenderWithGoals extends Spender {
  savings_goals: SavingsGoal[];
}

export default function AbandonedGoals({ spenders }: { spenders: SpenderWithGoals[] }) {
  function destroy(goal: SavingsGoal) {
    if (confirm(`Permanently delete "${goal.name}"? This cannot be undone.`)) {
      router.delete(route('goals.destroy-abandoned', goal.id));
    }
  }

  return (
    <AuthenticatedLayout header={
      <div className="flex items-center gap-3">
        <Link href={route('goals.index')} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h2 className="text-xl font-semibold text-bark-700">Abandoned Goals</h2>
      </div>
    }>
      <Head title="Abandoned Goals" />
      <div className="py-8 max-w-4xl mx-auto px-4">
        <div className="space-y-8">
          {spenders.map(spender => {
            const sym = spenderCurrencySymbol(spender);
            return (
              <div key={spender.id}>
                <div className="flex items-center gap-2 mb-3">
                  {spender.avatar_url ? (
                    <img src={spender.avatar_url} alt={spender.name} className="w-7 h-7 rounded-full object-cover" />
                  ) : (
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: spender.color ?? '#4A7C59' }}
                    >
                      {spender.name[0].toUpperCase()}
                    </div>
                  )}
                  <h4 className="font-semibold text-bark-700">{spender.name}</h4>
                </div>

                <div className="space-y-3">
                  {spender.savings_goals.map(goal => {
                    const allocatedAtAbandonment = goal.abandoned_allocated_amount
                      ? parseFloat(goal.abandoned_allocated_amount)
                      : 0;
                    const target = parseFloat(goal.target_amount);
                    const pct = target > 0 ? Math.min(100, Math.round((allocatedAtAbandonment / target) * 100)) : 0;

                    return (
                      <div
                        key={goal.id}
                        className="bg-white border border-bark-200 rounded-card p-5"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-bark-700">{goal.name}</p>
                            <div className="mt-1 space-y-0.5 text-xs text-bark-400">
                              <p>Created: {new Date(goal.created_at).toLocaleDateString()}</p>
                              <p>Abandoned: {goal.abandoned_at ? new Date(goal.abandoned_at).toLocaleDateString() : '—'}</p>
                              <p>
                                Amount at abandonment:{' '}
                                {formatAmount(allocatedAtAbandonment, sym)} of {formatAmount(target, sym)} ({pct}%)
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                            onClick={() => destroy(goal)}
                            aria-label={`Delete ${goal.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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
