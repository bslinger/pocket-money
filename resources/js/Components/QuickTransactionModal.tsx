import { router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { Family, Spender } from '@/types/models';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/Components/ui/avatar';
import { X, Minus, Plus, Split, Trash2 } from 'lucide-react';
import { accountCurrencySymbol, accountUsesIntegers } from '@/lib/utils';

export type SplitAllocation = { id: string; accountId: string; percentage: number };

export function SplitAccountSelector({
    accounts,
    allocations,
    totalAmount,
    currencySymbol,
    useIntegers,
    onChange,
}: {
    accounts: NonNullable<Spender['accounts']>;
    allocations: SplitAllocation[];
    totalAmount: number;
    currencySymbol: string;
    useIntegers: boolean;
    onChange: (allocations: SplitAllocation[]) => void;
}) {
    const totalPct = allocations.reduce((s, a) => s + a.percentage, 0);
    const isValid = Math.abs(totalPct - 100) < 0.01;

    function updatePct(id: string, pct: number) {
        onChange(allocations.map(a => (a.id === id ? { ...a, percentage: pct } : a)));
    }

    function updateAccount(id: string, accountId: string) {
        onChange(allocations.map(a => (a.id === id ? { ...a, accountId } : a)));
    }

    function remove(id: string) {
        onChange(allocations.filter(a => a.id !== id));
    }

    function addRow() {
        const remaining = Math.max(0, 100 - totalPct);
        onChange([
            ...allocations,
            {
                id: crypto.randomUUID(),
                accountId: accounts[0]?.id ?? '',
                percentage: remaining,
            },
        ]);
    }

    return (
        <div className="space-y-2">
            {allocations.map((alloc, idx) => {
                const amt =
                    totalAmount > 0
                        ? idx === allocations.length - 1
                            ? totalAmount -
                              allocations
                                  .slice(0, -1)
                                  .reduce(
                                      (s, a) =>
                                          s +
                                          Math.floor((totalAmount * a.percentage) / 100 * 100) / 100,
                                      0,
                                  )
                            : Math.floor((totalAmount * alloc.percentage) / 100 * 100) / 100
                        : 0;
                return (
                    <div key={alloc.id} className="flex items-center gap-2">
                        <select
                            value={alloc.accountId}
                            onChange={e => updateAccount(alloc.id, e.target.value)}
                            className="flex-1 min-w-0 rounded-md border border-bark-200 bg-bark-50 px-2 py-1.5 text-sm"
                        >
                            {accounts.map(a => (
                                <option key={a.id} value={a.id}>
                                    {a.name}
                                </option>
                            ))}
                        </select>
                        <div className="flex items-center gap-1 shrink-0">
                            <input
                                type="number"
                                min={useIntegers ? 1 : 0.1}
                                max={100}
                                step={useIntegers ? 1 : 0.1}
                                value={alloc.percentage}
                                onChange={e =>
                                    updatePct(alloc.id, parseFloat(e.target.value) || 0)
                                }
                                className="w-14 rounded-md border border-bark-200 bg-bark-50 px-2 py-1.5 text-sm text-right"
                            />
                            <span className="text-xs text-bark-500">%</span>
                        </div>
                        {totalAmount > 0 && (
                            <span className="text-xs text-bark-400 w-14 text-right shrink-0">
                                {currencySymbol}
                                {amt.toFixed(useIntegers ? 0 : 2)}
                            </span>
                        )}
                        {allocations.length > 2 && (
                            <button
                                type="button"
                                onClick={() => remove(alloc.id)}
                                className="text-bark-400 hover:text-redearth-400 transition-colors shrink-0"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                );
            })}

            <div className="flex items-center justify-between">
                <button
                    type="button"
                    onClick={addRow}
                    className="text-xs text-eucalyptus-500 hover:text-eucalyptus-600 font-medium"
                >
                    + Add account
                </button>
                <span
                    className={`text-xs font-medium ${isValid ? 'text-gumleaf-500' : 'text-redearth-400'}`}
                >
                    {totalPct.toFixed(1)}% / 100%
                </span>
            </div>
        </div>
    );
}

export function QuickTransactionModal({
    spender,
    family,
    initialType,
    initialAccountId,
    onClose,
}: {
    spender: Spender;
    family: Family;
    initialType: 'credit' | 'debit';
    initialAccountId?: string;
    onClose: () => void;
}) {
    const accounts = spender.accounts ?? [];
    const defaultAccountId = initialAccountId ?? accounts[0]?.id ?? '';
    const [selectedAccountId, setSelectedAccountId] = useState(defaultAccountId);
    const [isSplit, setIsSplit] = useState(false);
    const [splitAllocations, setSplitAllocations] = useState<SplitAllocation[]>(() => [
        { id: crypto.randomUUID(), accountId: accounts[0]?.id ?? '', percentage: 50 },
        {
            id: crypto.randomUUID(),
            accountId: accounts[1]?.id ?? accounts[0]?.id ?? '',
            percentage: 50,
        },
    ]);

    const selectedAccount = accounts.find(a => a.id === selectedAccountId) ?? accounts[0];
    const currencySymbol = selectedAccount
        ? accountCurrencySymbol(selectedAccount, family)
        : (family.currency_symbol ?? '$');
    const useIntegers = selectedAccount ? accountUsesIntegers(selectedAccount, family) : false;
    const [type, setType] = useState<'credit' | 'debit'>(initialType);
    const { data, setData, post, processing, errors, reset } = useForm({
        type,
        amount: '',
        description: '',
        occurred_at: new Date().toISOString(),
    });

    const totalAmount = parseFloat(data.amount) || 0;
    const splitTotalPct = splitAllocations.reduce((s, a) => s + a.percentage, 0);
    const splitValid = Math.abs(splitTotalPct - 100) < 0.01;

    function submit(e: React.FormEvent) {
        e.preventDefault();

        if (type === 'credit' && isSplit) {
            const splits = splitAllocations.map((alloc, idx) => {
                const amt =
                    idx === splitAllocations.length - 1
                        ? totalAmount -
                          splitAllocations
                              .slice(0, -1)
                              .reduce(
                                  (s, a) =>
                                      s + Math.floor((totalAmount * a.percentage) / 100 * 100) / 100,
                                  0,
                              )
                        : Math.floor((totalAmount * alloc.percentage) / 100 * 100) / 100;
                return { account_id: alloc.accountId, amount: amt };
            });

            router.post(
                route('transactions.split'),
                {
                    description: data.description,
                    occurred_at: data.occurred_at,
                    splits,
                },
                {
                    onSuccess: () => {
                        reset();
                        onClose();
                    },
                },
            );
            return;
        }

        post(route('accounts.transactions.store', selectedAccountId), {
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    }

    function switchType(newType: 'credit' | 'debit') {
        setType(newType);
        setData('type', newType);
        if (newType === 'debit') {
            setIsSplit(false);
        }
    }

    function enableSplit() {
        setIsSplit(true);
        setSplitAllocations([
            { id: crypto.randomUUID(), accountId: accounts[0]?.id ?? '', percentage: 50 },
            {
                id: crypto.randomUUID(),
                accountId: accounts[1]?.id ?? accounts[0]?.id ?? '',
                percentage: 50,
            },
        ]);
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50" />

            {/* Panel */}
            <div
                className="relative w-full max-w-sm bg-white border border-bark-200 rounded-2xl shadow-xl p-5 flex flex-col gap-4"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={spender.avatar_url ?? undefined} />
                            <AvatarFallback
                                style={{ backgroundColor: spender.color ?? '#6366f1' }}
                                className="text-white text-xs font-semibold"
                            >
                                {spender.name[0].toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <span className="font-semibold text-sm">{spender.name}</span>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="Close"
                        className="text-bark-500 hover:text-bark-700 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Credit / Debit toggle */}
                <div className="flex rounded-lg border overflow-hidden">
                    <button
                        type="button"
                        onClick={() => switchType('debit')}
                        className={`flex-1 py-2 text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
                            type === 'debit'
                                ? 'bg-redearth-400 text-white'
                                : 'text-bark-500 hover:bg-bark-50'
                        }`}
                    >
                        <Minus className="h-3.5 w-3.5" />
                        Spend
                    </button>
                    <div className="w-px bg-bark-200" />
                    <button
                        type="button"
                        onClick={() => switchType('credit')}
                        className={`flex-1 py-2 text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
                            type === 'credit'
                                ? 'bg-gumleaf-400 text-white'
                                : 'text-bark-500 hover:bg-bark-50'
                        }`}
                    >
                        <Plus className="h-3.5 w-3.5" />
                        Add money
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={submit} className="flex flex-col gap-3">
                    {/* Amount */}
                    <div className="space-y-1">
                        <Label htmlFor="quick-amount">Amount ({currencySymbol})</Label>
                        <Input
                            id="quick-amount"
                            type="number"
                            min={useIntegers ? '1' : '0.01'}
                            step={useIntegers ? '1' : '0.01'}
                            placeholder={useIntegers ? '0' : '0.00'}
                            value={data.amount}
                            onChange={e => setData('amount', e.target.value)}
                            autoFocus
                        />
                        {errors.amount && (
                            <p className="text-xs text-destructive">{errors.amount}</p>
                        )}
                    </div>

                    {/* Description */}
                    <div className="space-y-1">
                        <Label htmlFor="quick-desc">
                            Note{' '}
                            <span className="text-bark-500 font-normal">(optional)</span>
                        </Label>
                        <Input
                            id="quick-desc"
                            placeholder="e.g. Christmas money"
                            value={data.description}
                            onChange={e => setData('description', e.target.value)}
                        />
                    </div>

                    {/* Account selector — credit with multiple accounts */}
                    {accounts.length > 1 && type === 'credit' && (
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs text-bark-500">Account</Label>
                                {!isSplit ? (
                                    <button
                                        type="button"
                                        onClick={enableSplit}
                                        className="flex items-center gap-1 text-xs text-eucalyptus-500 hover:text-eucalyptus-600 font-medium transition-colors"
                                    >
                                        <Split className="h-3 w-3" />
                                        Split
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => setIsSplit(false)}
                                        className="text-xs text-bark-400 hover:text-bark-600 transition-colors"
                                    >
                                        Single account
                                    </button>
                                )}
                            </div>

                            {!isSplit ? (
                                <select
                                    value={selectedAccountId}
                                    onChange={e => setSelectedAccountId(e.target.value)}
                                    className="w-full rounded-md border border-bark-200 bg-bark-50 px-3 py-2 text-sm"
                                >
                                    {accounts.map(a => (
                                        <option key={a.id} value={a.id}>
                                            {a.name}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <SplitAccountSelector
                                    accounts={accounts}
                                    allocations={splitAllocations}
                                    totalAmount={totalAmount}
                                    currencySymbol={currencySymbol}
                                    useIntegers={useIntegers}
                                    onChange={setSplitAllocations}
                                />
                            )}
                        </div>
                    )}

                    {/* Account selector for debit (single, no split) */}
                    {accounts.length > 1 && type === 'debit' && (
                        <div className="space-y-1">
                            <Label className="text-xs text-bark-500">Account</Label>
                            <select
                                value={selectedAccountId}
                                onChange={e => setSelectedAccountId(e.target.value)}
                                className="w-full rounded-md border border-bark-200 bg-bark-50 px-3 py-2 text-sm"
                            >
                                {accounts.map(a => (
                                    <option key={a.id} value={a.id}>
                                        {a.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <Button
                        type="submit"
                        disabled={
                            processing ||
                            !data.amount ||
                            (type === 'credit' && isSplit && !splitValid)
                        }
                        className={
                            type === 'credit'
                                ? 'bg-gumleaf-400 hover:bg-gumleaf-500'
                                : 'bg-redearth-400 hover:bg-redearth-500'
                        }
                    >
                        {type === 'credit' ? 'Add' : 'Deduct'}{' '}
                        {data.amount ? `${currencySymbol}${data.amount}` : ''}
                    </Button>
                </form>
            </div>
        </div>
    );
}
