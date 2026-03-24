import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { Account, Transaction } from '@/types/models';
import { Avatar, AvatarFallback, AvatarImage } from '@/Components/ui/avatar';
import { formatAmount, accountCurrencySymbol } from '@/lib/utils';
import { ChevronLeft } from 'lucide-react';

interface Props {
  account: Account & { transactions: Transaction[] };
}

export default function AccountShow({ account }: Props) {
  const symbol = accountCurrencySymbol(account, account.spender?.family);
  const spender = account.spender;

  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-bark-700">{account.name}</h2>}>
      <Head title={account.name} />
      <div className="py-8 max-w-3xl mx-auto px-4">
        {spender && (
          <Link
            href={route('spenders.show', spender.id)}
            className="flex items-center gap-3 mb-4 px-1 text-sm text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <Avatar className="h-6 w-6">
              <AvatarImage src={spender.avatar_url ?? undefined} />
              <AvatarFallback style={{ backgroundColor: spender.color ?? '#4A7C59' }} className="text-white text-xs">
                {spender.name[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="group-hover:underline">{spender.name}</span>
          </Link>
        )}
        <div className="bg-white border border-bark-200 rounded-card p-6 mb-6">
          <p className="text-xs font-body font-semibold text-bark-400 uppercase tracking-widest">Balance</p>
          <p className="text-4xl font-semibold text-bark-700 mt-1">{formatAmount(account.balance, symbol)}</p>
          <div className="mt-4 flex gap-3">
            <Link href={route('accounts.transactions.create', account.id)} className="px-4 py-2 bg-gumleaf-400 text-white rounded-input text-sm hover:bg-gumleaf-500 transition-colors">+ Transaction</Link>
            <Link href={route('accounts.transfer.create', account.id)} className="px-4 py-2 bg-eucalyptus-400 text-white rounded-input text-sm hover:bg-eucalyptus-500 transition-colors">Transfer</Link>
          </div>
        </div>
        <div className="space-y-2">
          {account.transactions.map(tx => (
            <div
              key={tx.id}
              className={`flex items-center justify-between rounded-card px-4 py-3 ${
                tx.type === 'credit' ? 'bg-gumleaf-50' : 'bg-redearth-50'
              }`}
            >
              <div>
                <p className="text-sm font-medium text-bark-700">{tx.description ?? (tx.transfer_group_id ? 'Transfer' : 'Transaction')}</p>
                <p className="text-xs text-bark-400">{new Date(tx.occurred_at).toLocaleDateString()}</p>
              </div>
              <p className={`font-semibold tabular-nums ${tx.type === 'credit' ? 'text-gumleaf-400' : 'text-redearth-400'}`}>
                {tx.type === 'credit' ? '+' : '-'}{formatAmount(tx.amount, symbol)}
              </p>
            </div>
          ))}
          {account.transactions.length === 0 && <p className="text-bark-400 text-sm text-center py-8">No transactions yet.</p>}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
