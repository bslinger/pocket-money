import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { Account, Transaction } from '@/types/models';
import { formatAmount, accountCurrencySymbol } from '@/lib/utils';

interface Props {
  account: Account & { transactions: Transaction[] };
}

export default function AccountShow({ account }: Props) {
  const symbol = accountCurrencySymbol(account, account.spender?.family);
  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">{account.name}</h2>}>
      <Head title={account.name} />
      <div className="py-8 max-w-3xl mx-auto px-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 mb-6">
          <p className="text-sm text-gray-500">Balance</p>
          <p className="text-4xl font-bold text-gray-900 dark:text-gray-100">{formatAmount(account.balance, symbol)}</p>
          <div className="mt-4 flex gap-3">
            <Link href={route('accounts.transactions.create', account.id)} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">+ Transaction</Link>
            <Link href={route('accounts.transfer.create', account.id)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Transfer</Link>
          </div>
        </div>
        <div className="space-y-2">
          {account.transactions.map(tx => (
            <div key={tx.id} className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg shadow px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{tx.description ?? (tx.transfer_group_id ? 'Transfer' : 'Transaction')}</p>
                <p className="text-xs text-gray-400">{new Date(tx.occurred_at).toLocaleDateString()}</p>
              </div>
              <p className={`font-semibold ${tx.type === 'credit' ? 'text-green-600' : 'text-red-500'}`}>
                {tx.type === 'credit' ? '+' : '-'}{formatAmount(tx.amount, symbol)}
              </p>
            </div>
          ))}
          {account.transactions.length === 0 && <p className="text-gray-400 text-sm text-center py-8">No transactions yet.</p>}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
