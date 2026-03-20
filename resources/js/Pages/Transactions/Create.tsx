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
        ? 'bg-green-500 text-white shadow-sm'
        : 'bg-red-500 text-white shadow-sm';
    const inactiveClass =
        'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600';

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
                                    ? 'bg-white ' + (isCredit ? 'text-green-600' : 'text-red-600')
                                    : isCredit ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
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
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Add Transaction</h2>}>
            <Head title="Add Transaction" />
            <div className="py-8 max-w-lg mx-auto px-4">
                <Link
                    href={route('accounts.show', account.id)}
                    className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-4"
                >
                    ← Back
                </Link>
                <form onSubmit={submit} className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 space-y-4">
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
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount</label>
                        <input
                            type="number"
                            step={useIntegers ? '1' : '0.01'}
                            min={useIntegers ? '1' : '0.01'}
                            value={data.amount}
                            onChange={e => setData('amount', e.target.value)}
                            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
                        />
                        {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                        <input
                            type="text"
                            value={data.description}
                            onChange={e => setData('description', e.target.value)}
                            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                        <input
                            type="date"
                            value={data.occurred_at}
                            onChange={e => setData('occurred_at', e.target.value)}
                            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                    >
                        Save Transaction
                    </button>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
