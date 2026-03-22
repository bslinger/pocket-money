import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Spender, PocketMoneySchedule, Account } from '@/types/models';
import { spenderCurrencySymbol, spenderUsesIntegers, formatAmount } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/Components/ui/avatar';
import { Badge } from '@/Components/ui/badge';
import { AlertCircle, CalendarDays, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { useState } from 'react';

interface SimpleTransaction {
  id: string;
  account_id: string;
  amount: string;
  occurred_at: string;
}

interface SpenderData {
  spender: Spender;
  schedules: (PocketMoneySchedule & { account?: Account | null })[];
  paid_this_week: boolean;
  this_week_payments: SimpleTransaction[];
  recent_transactions: SimpleTransaction[];
  responsibility_chores_total: number;
  responsibility_chores_done: number;
  unmet_responsibilities: { id: string; name: string }[];
  withheld: boolean;
  withheld_amount: string;
}

interface Props {
  spenders: SpenderData[];
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function scheduleLabel(schedule: PocketMoneySchedule): string {
  if (schedule.frequency === 'weekly') {
    const day = schedule.day_of_week !== null ? DAY_LABELS[schedule.day_of_week] : 'Mon';
    return `Weekly on ${day}`;
  }
  const day = schedule.day_of_month ?? 1;
  const suffix = day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th';
  return `Monthly on the ${day}${suffix}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function ReleaseForm({ spenderId, maxAmount, currencySymbol, useIntegers }: {
  spenderId: string;
  maxAmount: number;
  currencySymbol: string;
  useIntegers: boolean;
}) {
  const [percentage, setPercentage] = useState(100);
  const releaseAmount = useIntegers
    ? Math.round((maxAmount * percentage) / 100)
    : Math.round((maxAmount * percentage) / 100 * 100) / 100;

  const { data, setData, post, processing, recentlySuccessful } = useForm({
    spender_id: spenderId,
    amount: releaseAmount.toFixed(useIntegers ? 0 : 2),
  });

  function handlePercentage(pct: number) {
    setPercentage(pct);
    const amt = useIntegers
      ? Math.round((maxAmount * pct) / 100)
      : Math.round((maxAmount * pct) / 100 * 100) / 100;
    setData('amount', amt.toFixed(useIntegers ? 0 : 2));
  }

  function handleAmountChange(val: string) {
    setData('amount', val);
    const num = parseFloat(val);
    if (!isNaN(num) && maxAmount > 0) {
      setPercentage(Math.round((num / maxAmount) * 100));
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    post(route('pocket-money.pay'));
  }

  if (recentlySuccessful) {
    return <p className="text-sm text-gumleaf-600 font-medium flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> Paid!</p>;
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="flex gap-2">
        {[25, 50, 75, 100].map(pct => (
          <button
            key={pct}
            type="button"
            onClick={() => handlePercentage(pct)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              percentage === pct
                ? 'bg-eucalyptus-400 text-white border-eucalyptus-400'
                : 'border-bark-200 text-bark-500 hover:border-eucalyptus-300 hover:text-eucalyptus-600'
            }`}
          >
            {pct}%
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-bark-400 text-sm">{currencySymbol}</span>
          <Input
            type="number"
            min={useIntegers ? '1' : '0.01'}
            step={useIntegers ? '1' : '0.01'}
            max={maxAmount}
            value={data.amount}
            onChange={e => handleAmountChange(e.target.value)}
            className="pl-6 w-28 tabular-nums"
          />
        </div>
        <Button type="submit" disabled={processing} size="sm">
          Release
        </Button>
      </div>
    </form>
  );
}

function SpenderCard({ item }: { item: SpenderData }) {
  const {
    spender, schedules, paid_this_week, this_week_payments,
    recent_transactions, responsibility_chores_total, responsibility_chores_done,
    unmet_responsibilities, withheld, withheld_amount,
  } = item;

  const currencySymbol = spenderCurrencySymbol(spender);
  const useIntegers = spenderUsesIntegers(spender);
  const progressPct = responsibility_chores_total > 0
    ? Math.round((responsibility_chores_done / responsibility_chores_total) * 100)
    : 100;
  const allDone = responsibility_chores_total === 0 || responsibility_chores_done >= responsibility_chores_total;

  return (
    <Card className="border-bark-200">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage src={spender.avatar_url ?? undefined} />
            <AvatarFallback style={{ backgroundColor: spender.color ?? '#4A7C59' }} className="text-white font-semibold text-sm">
              {spender.name[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <Link href={route('spenders.show', spender.id)} className="font-semibold text-bark-700 hover:text-eucalyptus-600 transition-colors">
              {spender.name}
            </Link>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {schedules.map(s => (
                <Badge key={s.id} variant="outline" className="text-xs border-bark-200 text-bark-500 gap-1">
                  <CalendarDays className="h-3 w-3" />
                  {formatAmount(parseFloat(s.amount), currencySymbol)} {scheduleLabel(s)}
                  {s.next_run_at && (
                    <span className="text-bark-400">· next {formatDate(s.next_run_at)}</span>
                  )}
                </Badge>
              ))}
              {schedules.length === 0 && (
                <span className="text-xs text-bark-400">No active schedule</span>
              )}
            </div>
          </div>
          <div className="shrink-0">
            {paid_this_week ? (
              <Badge className="bg-gumleaf-50 text-gumleaf-600 border border-gumleaf-200 gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Paid this week
              </Badge>
            ) : schedules.length > 0 ? (
              <Badge className="bg-wattle-50 text-wattle-700 border border-wattle-200 gap-1">
                <Clock className="h-3 w-3" />
                Not yet paid
              </Badge>
            ) : null}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        {/* Responsibility progress */}
        {responsibility_chores_total > 0 && (
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-bark-500">Responsibilities this week</span>
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

        {/* Withheld notice */}
        {withheld && (
          <div className="rounded-lg border border-redearth-200 bg-redearth-50 p-3 space-y-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-redearth-400 mt-0.5 shrink-0" />
              <div className="text-sm text-redearth-700">
                <p className="font-medium">Pocket money withheld this week</p>
                <p className="text-xs text-redearth-500 mt-0.5">
                  {unmet_responsibilities.length === 1
                    ? `"${unmet_responsibilities[0].name}" hasn't been completed`
                    : `${unmet_responsibilities.length} responsibilities not completed: ${unmet_responsibilities.map(r => `"${r.name}"`).join(', ')}`
                  }
                </p>
              </div>
            </div>
            <div className="pl-6">
              <Label className="text-xs text-bark-500 mb-2 block">Release manually</Label>
              <ReleaseForm
                spenderId={spender.id}
                maxAmount={parseFloat(withheld_amount)}
                currencySymbol={currencySymbol}
                useIntegers={useIntegers}
              />
            </div>
          </div>
        )}

        {/* This week's payments */}
        {this_week_payments.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-bark-500 uppercase tracking-wide">Paid this week</p>
            {this_week_payments.map(tx => (
              <div key={tx.id} className="flex justify-between text-sm">
                <span className="text-bark-500">{formatDate(tx.occurred_at)}</span>
                <span className="font-medium text-gumleaf-600">+{formatAmount(parseFloat(tx.amount), currencySymbol)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Recent history (outside this week) */}
        {recent_transactions.filter(tx => !this_week_payments.some(p => p.id === tx.id)).length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-bark-500 uppercase tracking-wide">Recent history</p>
            {recent_transactions
              .filter(tx => !this_week_payments.some(p => p.id === tx.id))
              .map(tx => (
                <div key={tx.id} className="flex justify-between text-sm">
                  <span className="text-bark-400">{formatDate(tx.occurred_at)}</span>
                  <span className="text-bark-500">+{formatAmount(parseFloat(tx.amount), currencySymbol)}</span>
                </div>
              ))}
          </div>
        )}

        {/* Manual release (no withheld, not paid yet, has schedule) */}
        {!withheld && !paid_this_week && schedules.length > 0 && (
          <div className="border-t border-bark-100 pt-3">
            <Label className="text-xs text-bark-500 mb-2 block">Release manually</Label>
            <ReleaseForm
              spenderId={spender.id}
              maxAmount={parseFloat(schedules.reduce((sum, s) => sum + parseFloat(s.amount), 0).toFixed(2))}
              currencySymbol={currencySymbol}
              useIntegers={useIntegers}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Release({ spenders }: Props) {
  const withheldCount = spenders.filter(s => s.withheld).length;

  return (
    <AuthenticatedLayout header={<h1 className="text-xl font-semibold text-bark-700">Pocket Money</h1>}>
      <Head title="Pocket Money" />
      <div className="max-w-2xl space-y-4">
        {withheldCount > 0 && (
          <div className="flex items-center gap-2 text-sm text-redearth-600 bg-redearth-50 border border-redearth-200 rounded-lg px-4 py-2.5">
            <XCircle className="h-4 w-4 shrink-0" />
            {withheldCount === 1
              ? '1 child had pocket money withheld this week due to incomplete responsibilities.'
              : `${withheldCount} children had pocket money withheld this week due to incomplete responsibilities.`
            }
          </div>
        )}

        {spenders.length === 0 && (
          <p className="text-bark-500 text-sm">No kids found.</p>
        )}

        {spenders.map(item => (
          <SpenderCard key={item.spender.id} item={item} />
        ))}
      </div>
    </AuthenticatedLayout>
  );
}
