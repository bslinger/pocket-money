import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { Spender } from '@/types/models';
import { spenderCurrencySymbol, spenderUsesIntegers } from '@/lib/utils';
import { Card, CardContent } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/Components/ui/avatar';
import { useForm } from '@inertiajs/react';

interface SpenderRelease {
  spender: Spender;
  weekly_amount: string;
  responsibility_chores_total: number;
  responsibility_chores_done: number;
}

interface Props {
  spenders: SpenderRelease[];
}

export default function Release({ spenders }: Props) {
  return (
    <AuthenticatedLayout header={<h1 className="text-xl font-semibold text-bark-700">Release Pocket Money</h1>}>
      <Head title="Pocket Money Release" />
      <div className="max-w-2xl space-y-4">
        {spenders.length === 0 && (
          <p className="text-bark-500 text-sm">No spenders found.</p>
        )}
        {spenders.map(item => (
          <SpenderReleaseCard key={item.spender.id} item={item} />
        ))}
      </div>
    </AuthenticatedLayout>
  );
}

function SpenderReleaseCard({ item }: { item: SpenderRelease }) {
  const { spender, weekly_amount, responsibility_chores_total, responsibility_chores_done } = item;
  const currencySymbol = spenderCurrencySymbol(spender);
  const useIntegers = spenderUsesIntegers(spender);
  const { data, setData, post, processing, recentlySuccessful } = useForm({
    spender_id: spender.id,
    amount: weekly_amount,
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    post(route('pocket-money.pay'));
  }

  const allDone = responsibility_chores_total === 0 || responsibility_chores_done >= responsibility_chores_total;
  const progressPct = responsibility_chores_total > 0
    ? Math.round((responsibility_chores_done / responsibility_chores_total) * 100)
    : 100;

  return (
    <Card className="border-bark-200">
      <CardContent className="pt-5 pb-5">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12 shrink-0">
            <AvatarImage src={spender.avatar_url ?? undefined} />
            <AvatarFallback style={{ backgroundColor: spender.color ?? '#4A7C59' }} className="text-white font-semibold">
              {spender.name[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-base text-bark-700">{spender.name}</p>

            {/* Responsibility chores progress */}
            {responsibility_chores_total > 0 && (
              <div className="mt-2">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-bark-500">Responsibilities</span>
                  <span className={allDone ? 'text-gumleaf-600 font-medium' : 'text-redearth-400 font-medium'}>
                    {responsibility_chores_done}/{responsibility_chores_total} done
                  </span>
                </div>
                <div className="bg-bark-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${allDone ? 'bg-gumleaf-400' : 'bg-redearth-300'}`}
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            )}

            {/* Amount input + pay button */}
            <form onSubmit={submit} className="mt-3 flex items-center gap-3">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-bark-400 text-sm">{currencySymbol}</span>
                <Input
                  type="number"
                  min={useIntegers ? '1' : '0.01'}
                  step={useIntegers ? '1' : '0.01'}
                  value={data.amount}
                  onChange={e => setData('amount', e.target.value)}
                  className="pl-6 w-28 tabular-nums"
                />
              </div>
              <Button type="submit" disabled={processing} size="sm">
                Pay Now
              </Button>
              {recentlySuccessful && (
                <span className="text-sm text-gumleaf-600 font-medium">Paid! ✓</span>
              )}
            </form>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
