import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Family, Chore, Spender, ChoreCompletion } from '@/types/models';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/Components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/Components/ui/tooltip';
import { PlusCircle, Pencil, Trash2, ArrowUpDown, ArrowUp, ArrowDown, History, Calendar, List, CheckCircle2, Clock, XCircle, Check, CheckCheck } from 'lucide-react';
import { formatAmount } from '@/lib/utils';
import { CHORE_TYPE_INFO } from '@/lib/choreTypes';
import { useState } from 'react';
import { format, addDays, isToday, isTomorrow, formatDistanceToNow } from 'date-fns';

interface WeekCompletion {
  id: string;
  chore_id: string;
  spender_id: string;
  status: 'pending' | 'approved' | 'declined';
  completed_at: string;
}

interface Props {
  families: (Family & {
    chores: (Chore & { spenders: Spender[] })[];
    spenders: Spender[];
  })[];
  weekCompletions: WeekCompletion[];
  pendingCompletions: (ChoreCompletion & { chore: Chore; spender: Spender })[];
}

type SortField = 'name' | 'created_at';
type SortDir = 'asc' | 'desc';
type Tab = 'approval' | 'schedule' | 'manage';

// Maps Mon=0…Sun=6 (ChoreForm convention) from a JS Date
function jsDateToChoreDayIndex(date: Date): number {
  const d = date.getDay(); // 0=Sun…6=Sat
  return d === 0 ? 6 : d - 1;
}

function isChoreScheduledOnDate(chore: Chore, date: Date): boolean {
  if (!chore.is_active) return false;
  const dayIdx = jsDateToChoreDayIndex(date);

  switch (chore.frequency) {
    case 'daily':
      return !chore.days_of_week || chore.days_of_week.length === 0
        ? true
        : chore.days_of_week.includes(dayIdx);
    case 'weekly':
      return !chore.days_of_week || chore.days_of_week.length === 0
        ? true
        : chore.days_of_week.includes(dayIdx);
    case 'monthly':
      return date.getDate() === new Date(chore.created_at).getDate();
    case 'one_off':
      return false;
    default:
      return false;
  }
}

function dayLabel(date: Date): string {
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  return format(date, 'EEE d MMM');
}

function RewardBadge({ type }: { type: Chore['reward_type'] }) {
  const info = CHORE_TYPE_INFO[type];
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge className={`${info.badgeClasses} cursor-default select-none`}>
          {info.label}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>{info.description}</TooltipContent>
    </Tooltip>
  );
}

const frequencyLabel = (f: Chore['frequency']) => {
  const map = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', one_off: 'One-off' };
  return map[f];
};

export default function ChoresIndex({ families, weekCompletions, pendingCompletions: initialPending }: Props) {
  const [tab, setTab] = useState<Tab>('approval');
  const [pending, setPending] = useState(initialPending);
  const [filterSpenderId, setFilterSpenderId] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  function approve(completion: ChoreCompletion) {
    router.patch(route('chore-completions.approve', completion.id), {}, {
      preserveScroll: true,
      onSuccess: () => setPending(p => p.filter(c => c.id !== completion.id)),
    });
  }

  function approveAll() {
    router.post(route('chore-completions.bulk-approve'), { ids: pending.map(c => c.id) }, {
      preserveScroll: true,
      onSuccess: () => setPending([]),
    });
  }

  function decline(completion: ChoreCompletion) {
    router.patch(route('chore-completions.decline', completion.id), {}, {
      preserveScroll: true,
      onSuccess: () => setPending(p => p.filter(c => c.id !== completion.id)),
    });
  }

  function deleteChore(chore: Chore) {
    if (!confirm(`Delete "${chore.name}"?`)) return;
    router.delete(route('chores.destroy', chore.id));
  }

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 opacity-40" />;
    return sortDir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
  }

  const allSpenders = families.flatMap(f => f.spenders ?? []);

  function filterAndSort(chores: (Chore & { spenders: Spender[] })[]) {
    let result = chores;

    if (filterSpenderId === '__unassigned__') {
      result = result.filter(c => !c.up_for_grabs && (c.spenders?.length ?? 0) === 0);
    } else if (filterSpenderId === '__up_for_grabs__') {
      result = result.filter(c => c.up_for_grabs);
    } else if (filterSpenderId) {
      result = result.filter(c =>
        c.up_for_grabs || c.spenders?.some(s => s.id === filterSpenderId)
      );
    }

    result = [...result].sort((a, b) => {
      const valA = sortField === 'name' ? a.name : a.created_at;
      const valB = sortField === 'name' ? b.name : b.created_at;
      const cmp = valA < valB ? -1 : valA > valB ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }

  // Build 7-day schedule: array of { date, spenderRows: { spender, chores }[] }
  const scheduleWeek = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i));
  const allChores = families.flatMap(f => f.chores);

  // Lookup: "choreId-spenderId-yyyy-MM-dd" → completion status
  const completionMap = new Map<string, 'pending' | 'approved' | 'declined'>();
  for (const c of weekCompletions) {
    const dateKey = format(new Date(c.completed_at), 'yyyy-MM-dd');
    completionMap.set(`${c.chore_id}-${c.spender_id}-${dateKey}`, c.status);
  }

  function getCompletionStatus(choreId: string, spenderId: string, date: Date) {
    return completionMap.get(`${choreId}-${spenderId}-${format(date, 'yyyy-MM-dd')}`);
  }

  return (
    <TooltipProvider>
    <AuthenticatedLayout header={
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Chores</h1>
        <Button asChild size="sm">
          <Link href={route('chores.create')}>
            <PlusCircle className="h-4 w-4 mr-1.5" />
            New Chore
          </Link>
        </Button>
      </div>
    }>
      <Head title="Chores" />

      {/* Tab bar */}
      <div className="flex gap-1 mb-5 border-b">
        <button
          onClick={() => setTab('approval')}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'approval'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <CheckCircle2 className="h-4 w-4" />
          Needs Approval
          {pending.length > 0 && (
            <Badge className="bg-amber-100 text-amber-800 border-amber-200 ml-0.5">{pending.length}</Badge>
          )}
        </button>
        <button
          onClick={() => setTab('schedule')}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'schedule'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Calendar className="h-4 w-4" />
          Schedule
        </button>
        <button
          onClick={() => setTab('manage')}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'manage'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <List className="h-4 w-4" />
          Manage
        </button>
      </div>

      {/* ── Needs Approval tab ────────────────────────────────────────── */}
      {tab === 'approval' && (
        <div>
          {pending.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <CheckCircle2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">All caught up — no chores waiting for approval.</p>
            </div>
          ) : (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    Waiting for approval
                    <Badge className="bg-amber-100 text-amber-800 border-amber-200">{pending.length}</Badge>
                  </CardTitle>
                  {pending.length > 1 && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-green-300 text-green-700 hover:bg-green-50 gap-1.5 h-7 text-xs"
                      onClick={approveAll}
                    >
                      <CheckCheck className="h-3.5 w-3.5" />
                      Approve all
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="divide-y p-0">
                {pending.map(c => (
                  <div key={c.id} className="flex items-center justify-between px-6 py-3 gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage src={c.spender.avatar_url ?? undefined} />
                        <AvatarFallback
                          style={{ backgroundColor: c.spender.color ?? '#6366f1' }}
                          className="text-white text-sm font-semibold"
                        >
                          {c.spender.name[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {c.chore.emoji ? `${c.chore.emoji} ` : ''}{c.chore.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {c.spender.name} · {formatDistanceToNow(new Date(c.completed_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8 border-green-300 text-green-700 hover:bg-green-50"
                        onClick={() => approve(c)}
                        title="Approve"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8 border-red-300 text-red-600 hover:bg-red-50"
                        onClick={() => decline(c)}
                        title="Decline"
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ── Manage tab ────────────────────────────────────────────── */}
      {tab === 'manage' && (
        <>
          {/* Filter + sort bar */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            {allSpenders.length > 0 && (
              <select
                value={filterSpenderId}
                onChange={e => setFilterSpenderId(e.target.value)}
                className="rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                aria-label="Filter by kid"
              >
                <option value="">All kids</option>
                {allSpenders.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
                <option value="__up_for_grabs__">Up for grabs</option>
                <option value="__unassigned__">Unassigned</option>
              </select>
            )}

            <div className="flex items-center gap-1">
              <Button
                variant={sortField === 'name' ? 'secondary' : 'ghost'}
                size="sm"
                className="gap-1.5 h-8 text-xs"
                onClick={() => toggleSort('name')}
              >
                <SortIcon field="name" />
                Name
              </Button>
              <Button
                variant={sortField === 'created_at' ? 'secondary' : 'ghost'}
                size="sm"
                className="gap-1.5 h-8 text-xs"
                onClick={() => toggleSort('created_at')}
              >
                <SortIcon field="created_at" />
                Date added
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            {families.map(family => {
              const chores = filterAndSort(family.chores);
              return (
                <Card key={family.id}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{family.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {chores.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-2">
                        {family.chores.length === 0 ? 'No chores yet.' : 'No chores match the current filter.'}
                      </p>
                    ) : (
                      <div className="divide-y">
                        {chores.map(chore => (
                          <div key={chore.id} className="flex items-center justify-between py-3 gap-4">
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="text-2xl w-8 text-center">{chore.emoji ?? '📋'}</span>
                              <div className="min-w-0">
                                <p className="font-medium truncate">{chore.name}</p>
                                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                  <RewardBadge type={chore.reward_type} />
                                  {chore.reward_type === 'earns' && chore.amount && (
                                    <span className="text-xs text-muted-foreground">{formatAmount(chore.amount, family.currency_symbol)}</span>
                                  )}
                                  <Badge variant="outline" className="text-xs font-normal">
                                    {frequencyLabel(chore.frequency)}
                                  </Badge>
                                  {chore.up_for_grabs && (
                                    <Badge variant="outline" className="text-xs font-normal text-blue-600 border-blue-200">Up for grabs</Badge>
                                  )}
                                  {!chore.is_active && (
                                    <Badge variant="secondary" className="text-xs">Paused</Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <div className="flex -space-x-2">
                                {chore.spenders?.slice(0, 4).map(s => (
                                  <Avatar key={s.id} className="h-6 w-6 border-2 border-background">
                                    <AvatarImage src={s.avatar_url ?? undefined} />
                                    <AvatarFallback
                                      style={{ backgroundColor: s.color ?? '#6366f1' }}
                                      className="text-white text-[10px] font-semibold"
                                    >
                                      {s.name[0].toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                ))}
                              </div>
                              <Button variant="ghost" size="icon" asChild className="h-7 w-7" title="History">
                                <Link href={route('chores.history', chore.id)} prefetch>
                                  <History className="h-3.5 w-3.5" />
                                </Link>
                              </Button>
                              <Button variant="ghost" size="icon" asChild className="h-7 w-7">
                                <Link href={route('chores.edit', chore.id)} prefetch>
                                  <Pencil className="h-3.5 w-3.5" />
                                </Link>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                onClick={() => deleteChore(chore)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
            {families.length === 0 && (
              <p className="text-center text-muted-foreground py-16">No families found.</p>
            )}
          </div>
        </>
      )}

      {/* ── Schedule tab ──────────────────────────────────────────── */}
      {tab === 'schedule' && (
        <div className="space-y-4">
          {scheduleWeek.map(date => {
            // For each spender, find which chores are due today
            const spenderRows = allSpenders
              .map(spender => {
                const spenderChores = allChores.filter(chore =>
                  (chore.up_for_grabs || chore.spenders?.some(s => s.id === spender.id)) &&
                  isChoreScheduledOnDate(chore, date)
                );
                return { spender, chores: spenderChores };
              })
              .filter(row => row.chores.length > 0);

            if (spenderRows.length === 0) return null;

            return (
              <Card key={date.toISOString()} className={isToday(date) ? 'border-primary/50' : ''}>
                <CardHeader className="pb-2">
                  <CardTitle className={`text-sm font-semibold ${isToday(date) ? 'text-primary' : 'text-muted-foreground'}`}>
                    {dayLabel(date)}
                    <span className="ml-2 font-normal text-xs text-muted-foreground">
                      {format(date, 'EEEE d MMMM')}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  {spenderRows.map(({ spender, chores }) => (
                    <div key={spender.id}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={spender.avatar_url ?? undefined} />
                          <AvatarFallback
                            style={{ backgroundColor: spender.color ?? '#6366f1' }}
                            className="text-white text-[9px] font-bold"
                          >
                            {spender.name[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-medium text-muted-foreground">{spender.name}</span>
                      </div>
                      <div className="flex flex-wrap gap-2 pl-7">
                        {chores.map(chore => {
                          const status = getCompletionStatus(chore.id, spender.id, date);
                          return (
                          <div
                            key={chore.id}
                            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs ${
                              status === 'approved' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                              status === 'pending'  ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' :
                              status === 'declined' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' :
                              'bg-muted'
                            }`}
                          >
                            <span>{chore.emoji ?? '📋'}</span>
                            <span className="font-medium">{chore.name}</span>
                            {status === 'approved' && <CheckCircle2 className="h-3 w-3 shrink-0" />}
                            {status === 'pending'  && <Clock className="h-3 w-3 shrink-0" />}
                            {status === 'declined' && <XCircle className="h-3 w-3 shrink-0" />}
                          </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
          {allSpenders.length === 0 && (
            <p className="text-center text-muted-foreground py-16">No kids or chores found.</p>
          )}
        </div>
      )}
    </AuthenticatedLayout>
    </TooltipProvider>
  );
}
