import { useForm } from '@inertiajs/react';
import { spenderUsesIntegers } from '@/lib/utils';
import { CHORE_TYPE_INFO } from '@/lib/choreTypes';
import { Chore, Family, Spender } from '@/types/models';
import { Card, CardContent } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/Components/ui/avatar';
import { Label } from '@/Components/ui/label';
import { Input } from '@/Components/ui/input';
import EmojiPickerField from '@/Components/EmojiPickerField';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const REWARD_TYPES = [
  { value: 'earns' as const,          ...CHORE_TYPE_INFO.earns },
  { value: 'responsibility' as const, ...CHORE_TYPE_INFO.responsibility },
  { value: 'no_reward' as const,      ...CHORE_TYPE_INFO.no_reward },
];

interface Props {
  families: Family[];
  spenders: Spender[];
  mode: 'create' | 'edit';
  chore?: Chore & { spenders: Spender[] };
  defaultSpenderIds?: string[];
}

export default function ChoreForm({ families, spenders, mode, chore, defaultSpenderIds }: Props) {
  const { data, setData, post, put, processing, errors } = useForm({
    family_id:         chore?.family_id ?? (families[0]?.id ?? ''),
    name:              chore?.name ?? '',
    emoji:             chore?.emoji ?? '🧹',
    reward_type:       (chore?.reward_type ?? 'earns') as 'earns' | 'responsibility' | 'no_reward',
    amount:            chore?.amount ?? '',
    frequency:         (chore?.frequency ?? 'weekly') as 'daily' | 'weekly' | 'monthly' | 'one_off',
    days_of_week:      chore?.days_of_week ?? [] as number[],
    requires_approval: chore?.requires_approval ?? true,
    up_for_grabs:      chore?.up_for_grabs ?? false,
    is_active:         chore?.is_active ?? true,
    spender_ids:       chore?.spenders?.map(s => s.id) ?? defaultSpenderIds ?? [] as string[],
  });

  function toggleDay(dayIndex: number) {
    const current = data.days_of_week as number[];
    setData('days_of_week', current.includes(dayIndex)
      ? current.filter(d => d !== dayIndex)
      : [...current, dayIndex]);
  }

  function toggleSpender(id: string) {
    const current = data.spender_ids as string[];
    setData('spender_ids', current.includes(id)
      ? current.filter(s => s !== id)
      : [...current, id]);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!data.up_for_grabs && (data.spender_ids as string[]).length === 0) {
      alert('Please assign this chore to at least one kid, or mark it as Up For Grabs.');
      return;
    }
    if (mode === 'create') {
      post(route('chores.store'));
    } else {
      put(route('chores.update', chore!.id));
    }
  }

  const showDays = data.frequency === 'daily' || data.frequency === 'weekly';
  const selectedFamily = families.find(f => f.id === data.family_id);
  const useIntegers = spenderUsesIntegers({ use_integer_amounts: selectedFamily?.use_integer_amounts ?? false });

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-6">
      <Card>
        <CardContent className="pt-6 space-y-5">
          {/* Family */}
          {families.length > 1 && (
            <div className="space-y-1.5">
              <Label>Family</Label>
              <select
                value={data.family_id}
                onChange={e => setData('family_id', e.target.value)}
                className="w-full rounded-md border border-bark-200 bg-bark-50 px-3 py-2 text-sm"
              >
                {families.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
              {errors.family_id && <p className="text-xs text-redearth-400">{errors.family_id}</p>}
            </div>
          )}

          {/* Name + Emoji */}
          <div className="grid grid-cols-[1fr_auto] gap-3 items-start">
            <div className="space-y-1.5">
              <Label htmlFor="name">Chore name</Label>
              <Input id="name" value={data.name} onChange={e => setData('name', e.target.value)} placeholder="Tidy bedroom" />
              {errors.name && <p className="text-xs text-redearth-400">{errors.name}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Emoji</Label>
              <EmojiPickerField
                value={data.emoji}
                defaultEmoji="📋"
                onChange={e => setData('emoji', e)}
              />
            </div>
          </div>

          {/* Reward type */}
          <div className="space-y-1.5">
            <Label>Reward type</Label>
            <div className="flex flex-col gap-2">
              {REWARD_TYPES.map(({ value, label, description }) => {
                const selected = data.reward_type === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setData('reward_type', value)}
                    className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                      selected
                        ? 'border-eucalyptus-400 bg-eucalyptus-50'
                        : 'border-bark-200 hover:border-eucalyptus-300 bg-bark-50'
                    }`}
                  >
                    <p className={`text-sm font-medium ${selected ? 'text-eucalyptus-400' : 'text-bark-700'}`}>
                      {label}
                    </p>
                    <p className="text-xs text-bark-500 mt-0.5">{description}</p>
                  </button>
                );
              })}
            </div>
            {errors.reward_type && <p className="text-xs text-redearth-400">{errors.reward_type}</p>}
          </div>

          {/* Amount (earns only) */}
          {data.reward_type === 'earns' && (
            <div className="space-y-1.5">
              <Label htmlFor="amount">Reward amount ({families[0]?.currency_symbol ?? '$'})</Label>
              <Input
                id="amount"
                type="number"
                min={useIntegers ? '1' : '0.01'}
                step={useIntegers ? '1' : '0.01'}
                value={data.amount}
                onChange={e => setData('amount', e.target.value)}
                placeholder={useIntegers ? '1' : '0.50'}
                className="max-w-xs"
              />
              {errors.amount && <p className="text-xs text-redearth-400">{errors.amount}</p>}
            </div>
          )}

          {/* Frequency */}
          <div className="space-y-2">
            <Label>Frequency</Label>
            <select
              value={data.frequency}
              onChange={e => setData('frequency', e.target.value as typeof data.frequency)}
              className="w-full max-w-xs rounded-md border border-bark-200 bg-bark-50 px-3 py-2 text-sm"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="one_off">One-off</option>
            </select>
          </div>

          {/* Days of week */}
          {showDays && (
            <div className="space-y-1.5">
              <Label>Days</Label>
              <div className="flex gap-2 flex-wrap">
                {DAY_LABELS.map((label, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleDay(i)}
                    className={`w-10 h-10 rounded-full text-sm font-medium border transition-colors ${
                      (data.days_of_week as number[]).includes(i)
                        ? 'bg-eucalyptus-400 text-white border-eucalyptus-400'
                        : 'bg-bark-50 border-bark-200 text-bark-500 hover:border-eucalyptus-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Toggles */}
          <div className="flex gap-6 flex-wrap">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={data.requires_approval}
                onChange={e => setData('requires_approval', e.target.checked)}
                className="rounded accent-eucalyptus-400"
              />
              <span className="text-sm">Requires approval</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={data.up_for_grabs}
                onChange={e => setData('up_for_grabs', e.target.checked)}
                className="rounded accent-eucalyptus-400"
              />
              <span className="text-sm">Up for grabs</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={data.is_active}
                onChange={e => setData('is_active', e.target.checked)}
                className="rounded accent-eucalyptus-400"
              />
              <span className="text-sm">Active</span>
            </label>
          </div>

          {/* Assign spenders */}
          <div className="space-y-2">
            <Label>Assign to</Label>
            {errors.spender_ids && <p className="text-xs text-redearth-400">{errors.spender_ids}</p>}
            <div className="flex gap-3 flex-wrap">
              {spenders.map(s => {
                const selected = (data.spender_ids as string[]).includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleSpender(s.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm transition-colors ${
                      selected
                        ? 'border-eucalyptus-400 bg-eucalyptus-50 text-eucalyptus-400 font-medium'
                        : 'border-bark-200 hover:border-eucalyptus-300'
                    }`}
                  >
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={s.avatar_url ?? undefined} />
                      <AvatarFallback style={{ backgroundColor: s.color ?? '#6366f1' }} className="text-white text-[10px]">
                        {s.name[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {s.name}
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={processing}>
          {mode === 'create' ? 'Create Chore' : 'Save Changes'}
        </Button>
        <Button variant="outline" type="button" onClick={() => window.history.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
