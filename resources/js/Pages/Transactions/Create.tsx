import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Account } from '@/types/models';
import { spenderCurrencySymbol, spenderUsesIntegers } from '@/lib/utils';

const DOLLAR_SYMBOL = '$';

function TxTypeButton({
    isCredit,
    selected,
    symbol,
    currencyName,
    onClick,
}: {
    isCredit: boolean;
    selected: boolean;
    symbol: string;
    currencyName: string;
    onClick: () => void;
}) {
    const activeClass = isCredit
        ? 'bg-gumleaf-400 text-white shadow-sm'
        : 'bg-redearth-400 text-white shadow-sm';
    const inactiveClass =
        'bg-bark-100 text-bark-600 hover:bg-bark-200';

    const isDollar = symbol === DOLLAR_SYMBOL;

    return (
        <button
            type="button"
            onClick={onClick}
            className={`py-4 rounded-xl text-base font-semibold transition-colors ${selected ? activeClass : inactiveClass}`}
        >
            {isDollar ? (
                isCredit ? '💰 Money In' : '💸 Money Out'
            ) : (
                <span className="flex flex-col items-center gap-1.5">
                    {/* Emoji with +/− badge */}
                    <span className="relative inline-flex items-center justify-center">
                        <span className="text-3xl leading-none">{symbol}</span>
                        <span
                            className={`absolute -bottom-1 -right-2 text-[11px] font-black leading-none rounded-full w-4 h-4 flex items-center justify-center
                                ${selected
                                    ? 'bg-white ' + (isCredit ? 'text-gumleaf-600' : 'text-redearth-600')
                                    : isCredit ? 'bg-gumleaf-400 text-white' : 'bg-redearth-400 text-white'
                                }`}
                        >
                            {isCredit ? '+' : '−'}
                        </span>
                    </span>
                    {/* Label */}
                    <span>{currencyName}s {isCredit ? 'In' : 'Out'}</span>
                </span>
            )}
        </button>
    );
}

export default function TransactionCreate({ account }: { account: Account }) {
    const { data, setData, post, processing, errors } = useForm({
        type: 'credit' as 'credit' | 'debit',
        amount: '',
        description: '',
        occurred_at: new Date().toISOString().split('T')[0],
    });

    const symbol = spenderCurrencySymbol(account.spender ?? { currency_symbol: null });
    const useIntegers = spenderUsesIntegers(account.spender ?? { use_integer_amounts: null });
    const currencyName = account.spender?.currency_name
        ?? account.spender?.family?.currency_name
        ?? 'Dollar';

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(route('accounts.transactions.store', account.id));
    }

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-bark-700">Add Transaction</h2>}>
            <Head title="Add Transaction" />
            <div className="py-8 max-w-lg mx-auto px-4">
                <Link
                    href={route('accounts.show', account.id)}
                    className="inline-flex items-center gap-1 text-sm text-bark-500 hover:text-bark-700 mb-4"
                >
                    ← Back
                </Link>
                <form onSubmit={submit} className="bg-white border border-bark-200 rounded-card p-6 space-y-4">
                    <div>
                        <div className="grid grid-cols-2 gap-3">
                            <TxTypeButton
                                isCredit={true}
                                selected={data.type === 'credit'}
                                symbol={symbol}
                                currencyName={currencyName}
                                onClick={() => setData('type', 'credit')}
                            />
                            <TxTypeButton
                                isCredit={false}
                                selected={data.type === 'debit'}
                                symbol={symbol}
                                currencyName={currencyName}
                                onClick={() => setData('type', 'debit')}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-bark-700 mb-1">Amount</label>
                        <input
                            type="number"
                            step={useIntegers ? '1' : '0.01'}
                            min={useIntegers ? '1' : '0.01'}
                            value={data.amount}
                            onChange={e => setData('amount', e.target.value)}
                            className="w-full border border-bark-200 rounded-input px-3 py-2"
                        />
                        {errors.amount && <p className="text-redearth-400 text-xs mt-1">{errors.amount}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-bark-700 mb-1">Description</label>
                        <input
                            type="text"
                            value={data.description}
                            onChange={e => setData('description', e.target.value)}
                            className="w-full border border-bark-200 rounded-input px-3 py-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-bark-700 mb-1">Date</label>
                        <input
                            type="date"
                            value={data.occurred_at}
                            onChange={e => setData('occurred_at', e.target.value)}
                            className="w-full border border-bark-200 rounded-input px-3 py-2"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full py-2 bg-eucalyptus-400 text-white rounded-card hover:bg-eucalyptus-500 disabled:opacity-50"
                    >
                        Save Transaction
                    </button>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
