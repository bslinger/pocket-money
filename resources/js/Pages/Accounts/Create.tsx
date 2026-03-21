import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { Spender, Family } from '@/types/models';
import { cn, guessNameFromEmoji } from '@/lib/utils';
import EmojiPickerField from '@/Components/EmojiPickerField';
import { Label } from '@/Components/ui/label';
import { Input } from '@/Components/ui/input';
import { useState } from 'react';

interface Props {
  spenders: Spender[];
  preselectedSpenderId?: string;
  family?: Family | null;
}

export default function AccountCreate({ spenders, preselectedSpenderId, family }: Props) {
  const [overrideCurrency, setOverrideCurrency] = useState(false);

  const { data, setData, post, processing, errors } = useForm({
    spender_id:            preselectedSpenderId ?? spenders[0]?.id ?? '',
    name:                  '',
    currency_name:         '',
    currency_name_plural:  '',
    currency_symbol:       '',
    use_integer_amounts:   false,
  });

  function toggleOverride(checked: boolean) {
    setOverrideCurrency(checked);
    if (!checked) {
      setData(d => ({ ...d, currency_name: '', currency_name_plural: '', currency_symbol: '', use_integer_amounts: false }));
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    post(route('accounts.store'));
  }

  const familySymbol = family?.currency_symbol ?? '$';
  const familyName = family?.currency_name ?? 'Dollar';

  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Add Account</h2>}>
      <Head title="Add Account" />
      <div className="py-8 max-w-lg mx-auto px-4">
        <form onSubmit={submit} className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 space-y-4">
          {spenders.length > 1 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Spender</label>
              <select
                value={data.spender_id}
                onChange={e => setData('spender_id', e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
              >
                {spenders.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account Name</label>
            <input
              id="name"
              type="text"
              value={data.name}
              onChange={e => setData('name', e.target.value)}
              placeholder="e.g. Spending Money"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
              autoFocus
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          {/* Optional currency override */}
          <div className="space-y-3">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={overrideCurrency}
                onChange={e => toggleOverride(e.target.checked)}
                className="rounded accent-primary"
              />
              <div>
                <p className="text-sm font-medium">Custom currency for this account</p>
                <p className="text-xs text-gray-500 dark:text-muted-foreground">
                  Overrides the family default ({familySymbol} {familyName})
                </p>
              </div>
            </label>

            {overrideCurrency && (
              <div className="pl-6 space-y-3 border-l-2 border-gray-200 dark:border-border">
                <div className="flex items-center gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Emoji symbol</Label>
                    <EmojiPickerField
                      value={data.currency_symbol}
                      defaultEmoji="💰"
                      onChange={e => setData(d => ({ ...d, currency_symbol: e }))}
                      onPickerChange={d => setData(prev => ({ ...prev, currency_symbol: d.emoji, currency_name: guessNameFromEmoji(d.names) }))}
                      pickerAlign="left"
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <Label htmlFor="currency_name" className="text-xs">Singular name</Label>
                    <Input
                      id="currency_name"
                      value={data.currency_name}
                      onChange={e => setData('currency_name', e.target.value)}
                      placeholder="e.g. Star, Gem"
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <Label htmlFor="currency_name_plural" className="text-xs">Plural (optional)</Label>
                    <Input
                      id="currency_name_plural"
                      value={data.currency_name_plural}
                      onChange={e => setData('currency_name_plural', e.target.value)}
                      placeholder={data.currency_name ? data.currency_name + 's' : 'Stars'}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="use_integer_amounts"
                    checked={data.use_integer_amounts}
                    onChange={e => setData('use_integer_amounts', e.target.checked)}
                    className="rounded accent-primary"
                  />
                  <Label htmlFor="use_integer_amounts" className="text-xs cursor-pointer">Whole numbers only (e.g. 5 Stars, not 5.50)</Label>
                </div>
                {data.currency_symbol && (
                  <p className="text-xs text-gray-500">
                    Preview: {data.currency_symbol}1 {data.currency_name || 'unit'} · {data.currency_symbol}25 {data.currency_name_plural || (data.currency_name ? data.currency_name + 's' : 'units')}
                  </p>
                )}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={processing}
            className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            Add Account
          </button>
        </form>
      </div>
    </AuthenticatedLayout>
  );
}
