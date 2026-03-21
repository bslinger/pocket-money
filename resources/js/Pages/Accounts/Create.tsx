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

const CURRENCY_SYMBOLS = [
    { symbol: '$',  name: 'Dollar',  plural: 'Dollars'  },
    { symbol: '£',  name: 'Pound',   plural: 'Pounds'   },
    { symbol: '€',  name: 'Euro',    plural: 'Euros'    },
    { symbol: '¥',  name: 'Yen',     plural: 'Yen'      },
    { symbol: '₹',  name: 'Rupee',   plural: 'Rupees'   },
    { symbol: 'kr', name: 'Krone',   plural: 'Kroner'   },
    { symbol: 'Fr', name: 'Franc',   plural: 'Francs'   },
    { symbol: 'R',  name: 'Rand',    plural: 'Rand'     },
    { symbol: '₩',  name: 'Won',     plural: 'Won'      },
    { symbol: '₪',  name: 'Shekel',  plural: 'Shekels'  },
    { symbol: '₺',  name: 'Lira',    plural: 'Lira'     },
    { symbol: '₿',  name: 'Bitcoin', plural: 'Bitcoin'  },
] as const;

export default function AccountCreate({ spenders, preselectedSpenderId, family }: Props) {
  const [overrideCurrency, setOverrideCurrency] = useState(false);
  const [overrideType, setOverrideType] = useState<'real' | 'custom'>('real');
  const [selectedSymbolIdx, setSelectedSymbolIdx] = useState(0);

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
    } else {
      // Default to first real symbol
      const p = CURRENCY_SYMBOLS[0];
      setData(d => ({ ...d, currency_symbol: p.symbol, currency_name: p.name, currency_name_plural: p.plural }));
    }
  }

  function switchOverrideType(type: 'real' | 'custom') {
    setOverrideType(type);
    if (type === 'real') {
      const p = CURRENCY_SYMBOLS[selectedSymbolIdx];
      setData(d => ({ ...d, currency_symbol: p.symbol, currency_name: p.name, currency_name_plural: p.plural, use_integer_amounts: false }));
    } else {
      setData(d => ({ ...d, currency_symbol: '', currency_name: '', currency_name_plural: '', use_integer_amounts: false }));
    }
  }

  function selectSymbol(idx: number) {
    setSelectedSymbolIdx(idx);
    const p = CURRENCY_SYMBOLS[idx];
    setData(d => ({ ...d, currency_symbol: p.symbol, currency_name: p.name, currency_name_plural: p.plural }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    post(route('accounts.store'));
  }

  const familySymbol = family?.currency_symbol ?? '$';
  const familyName = family?.currency_name ?? 'Dollar';
  const currencyNameSingular = data.currency_name || 'unit';
  const currencyNamePlural   = data.currency_name_plural || (currencyNameSingular + 's');

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
                {/* Real / Custom toggle */}
                <div className="grid grid-cols-2 gap-2">
                  {(['real', 'custom'] as const).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => switchOverrideType(type)}
                      className={cn(
                        'px-3 py-2 rounded-lg border text-left transition-colors text-sm',
                        overrideType === type
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/40'
                      )}
                    >
                      <span className={cn('font-medium', overrideType === type ? 'text-primary' : '')}>
                        {type === 'real' ? '💵 Real money' : '⭐ Custom'}
                      </span>
                    </button>
                  ))}
                </div>

                {overrideType === 'real' && (
                  <div className="grid grid-cols-4 gap-2">
                    {CURRENCY_SYMBOLS.map((p, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => selectSymbol(i)}
                        className={cn(
                          'flex items-center justify-center px-3 py-2 rounded-md border text-sm font-mono transition-colors',
                          selectedSymbolIdx === i
                            ? 'border-primary bg-primary/5 text-primary font-bold'
                            : 'border-border hover:border-primary/40'
                        )}
                      >
                        {p.symbol}
                      </button>
                    ))}
                  </div>
                )}

                {overrideType === 'custom' && (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Emoji symbol</Label>
                        <EmojiPickerField
                          value={data.currency_symbol}
                          defaultEmoji="💰"
                          onChange={e => setData(d => ({ ...d, currency_symbol: e }))}
                          onPickerChange={d => setData(prev => ({
                            ...prev,
                            currency_symbol: d.emoji,
                            currency_name: guessNameFromEmoji(d.names),
                            currency_name_plural: guessNameFromEmoji(d.names) + 's',
                          }))}
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
                      <Label htmlFor="use_integer_amounts" className="text-xs cursor-pointer">
                        Whole numbers only (e.g. 1 {currencyNameSingular}, not 0.50 {currencyNamePlural})
                      </Label>
                    </div>
                  </>
                )}

                {data.currency_symbol && data.currency_name && (
                  <p className="text-xs text-gray-500">
                    Preview: {data.currency_symbol}1 {currencyNameSingular} · {data.currency_symbol}25 {currencyNamePlural}
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
