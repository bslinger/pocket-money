import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { Spender } from '@/types/models';

export default function SpenderShow({ spender }: { spender: Spender }) {
  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">{spender.name}</h2>}>
      <Head title={spender.name} />
      <div className="py-8 max-w-4xl mx-auto px-4 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {spender.accounts?.map(account => (
            <Link key={account.id} href={route('accounts.show', account.id)} className="block bg-white dark:bg-gray-800 rounded-xl shadow p-5 hover:shadow-md transition">
              <p className="text-sm text-gray-500 mb-1">{account.name}</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">${parseFloat(account.balance).toFixed(2)}</p>
            </Link>
          ))}
        </div>
        {(spender.savings_goals?.length ?? 0) > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5">
            <h3 className="font-semibold mb-3">Savings Goals</h3>
            <div className="space-y-3">
              {spender.savings_goals?.map(goal => {
                const pct = Math.min(100, (parseFloat(goal.current_amount) / parseFloat(goal.target_amount)) * 100);
                return (
                  <div key={goal.id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{goal.name}</span>
                      <span>${parseFloat(goal.current_amount).toFixed(2)} / ${parseFloat(goal.target_amount).toFixed(2)}</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                      <div className="h-2 bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
