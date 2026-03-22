import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Family, Chore, Spender, ChoreCompletion } from '@/types/models';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/Components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/Components/ui/tooltip';
import { PlusCircle, Pencil, Trash2, ArrowUpDown, ArrowUp, ArrowDown, History, Calendar, List, CheckCircle2, Clock, XCircle, Check, CheckCheck, Undo2 } from 'lucide-react';
import { formatAmount } from '@/lib/utils';
import { CHORE_TYPE_INFO } from '@/lib/choreTypes';
import { useState } from 'react';
import { format, addDays, subDays, isToday, isTomorrow, formatDistanceToNow, isYesterday } from 'date-fns';

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

  // Don't show chores on days before they were created
  const createdDate = new Date(chore.created_at);
  if (date < new Date(createdDate.getFullYear(), createdDate.getMonth(), createdDate.getDate())) return false;

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
  // IDs of completions approved this session (shown with Unapprove button until page reload)
  const [localApproved, setLocalApproved] = useState<Set<string>>(new Set());
  const [filterSpenderId, setFilterSpenderId] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  // Past days: tracks how many past days are expanded as full cards (1 = yesterday shown as card)
  const [pastDaysShown, setPastDaysShown] = useState(0);
  const [pastCompletions, setPastCompletions] = useState<Map<string, WeekCompletion[]>>(new Map());
  const [loadingPastDay, setLoadingPastDay] = useState(false);

  async function fetchCompletionsForDate(dateKey: string): Promise<WeekCompletion[]> {
    const res = await fetch(route('chores.completions-for-date') + `?date=${dateKey}`, {
      headers: { 'Accept': 'application/json' },
    });
    return res.ok ? await res.json() : [];
  }

  async function expandPastDay() {
    const nextDaysBack = pastDaysShown + 1;
    const expandDate = subDays(new Date(), nextDaysBack);
    const expandKey = format(expandDate, 'yyyy-MM-dd');

    // Also pre-fetch the day after that (the next summary)
    const previewDate = subDays(new Date(), nextDaysBack + 1);
    const previewKey = format(previewDate, 'yyyy-MM-dd');

    setLoadingPastDay(true);
    try {
      const fetches: Promise<[string, WeekCompletion[]]>[] = [];
      if (!pastCompletions.has(expandKey)) {
        fetches.push(fetchCompletionsForDate(expandKey).then(d => [expandKey, d]));
      }
      if (!pastCompletions.has(previewKey)) {
        fetches.push(fetchCompletionsForDate(previewKey).then(d => [previewKey, d]));
      }
      if (fetches.length > 0) {
        const results = await Promise.all(fetches);
        setPastCompletions(prev => {
          const next = new Map(prev);
          for (const [key, data] of results) next.set(key, data);
          return next;
        });
      }
    } finally {
      setLoadingPastDay(false);
    }

    setPastDaysShown(nextDaysBack);
  }

  function approve(completion: ChoreCompletion) {
    router.patch(route('chore-completions.approve', completion.id), {}, {
      preserveScroll: true,
      onSuccess: () => setLocalApproved(s => new Set([...s, completion.id])),
    });
  }

  function unapprove(completion: ChoreCompletion) {
    router.patch(route('chore-completions.unapprove', completion.id), {}, {
      preserveScroll: true,
      onSuccess: () => {
        setLocalApproved(s => { const n = new Set(s); n.delete(completion.id); return n; });
        setPending(p => p.filter(c => c.id !== completion.id));
      },
    });
  }

  function approveAll() {
    const pendingOnly = pending.filter(c => !localApproved.has(c.id));
    router.post(route('chore-completions.bulk-approve'), { ids: pendingOnly.map(c => c.id) }, {
      preserveScroll: true,
      onSuccess: () => setLocalApproved(s => new Set([...s, ...pendingOnly.map(c => c.id)])),
    });
  }

  function decline(completion: ChoreCompletion) {
    router.patch(route('chore-completions.decline', completion.id), {}, {
      preserveScroll: true,
      onSuccess: () => {
        setPending(p => p.filter(c => c.id !== completion.id));
        setLocalApproved(s => { const n = new Set(s); n.delete(completion.id); return n; });
      },
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
  // Also index lazy-loaded past completions
  for (const [, dayCompletions] of pastCompletions) {
    for (const c of dayCompletions) {
      const dateKey = format(new Date(c.completed_at), 'yyyy-MM-dd');
      completionMap.set(`${c.chore_id}-${c.spender_id}-${dateKey}`, c.status);
    }
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
          {pending.filter(c => !localApproved.has(c.id)).length > 0 && (
            <Badge className="bg-wattle-50 text-wattle-600 border-wattle-200 ml-0.5">{pending.filter(c => !localApproved.has(c.id)).length}</Badge>
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
      {tab === 'approval' && (() => {
        const trulyPending = pending.filter(c => !localApproved.has(c.id));
        return (
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
                      Chore completions
                      {trulyPending.length > 0 && (
                        <Badge className="bg-wattle-50 text-wattle-600 border-wattle-200">{trulyPending.length} pending</Badge>
                      )}
                    </CardTitle>
                    {trulyPending.length > 1 && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-gumleaf-200 text-gumleaf-600 hover:bg-gumleaf-50 gap-1.5 h-7 text-xs"
                        onClick={approveAll}
                      >
                        <CheckCheck className="h-3.5 w-3.5" />
                        Approve all
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="divide-y p-0">
                  {pending.map(c => {
                    const isApproved = localApproved.has(c.id);
                    return (
                      <div
                        key={c.id}
                        className={`flex items-center justify-between px-6 py-3 gap-3 ${isApproved ? 'opacity-60' : ''}`}
                      >
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
                            <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                              {c.spender.name} · {formatDistanceToNow(new Date(c.completed_at), { addSuffix: true })}
                              {isApproved && <span className="ml-1.5 text-gumleaf-400 font-medium">· approved</span>}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          {isApproved ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 gap-1.5 text-xs text-muted-foreground"
                              onClick={() => unapprove(c)}
                              title="Unapprove"
                            >
                              <Undo2 className="h-3.5 w-3.5" />
                              Unapprove
                            </Button>
                          ) : (
                            <>
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-8 w-8 border-gumleaf-200 text-gumleaf-600 hover:bg-gumleaf-50"
                                onClick={() => approve(c)}
                                title="Approve"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-8 w-8 border-redearth-200 text-redearth-600 hover:bg-redearth-50"
                                onClick={() => decline(c)}
                                title="Decline"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}
          </div>
        );
      })()}

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
                                    <Badge variant="outline" className="text-xs font-normal text-eucalyptus-600 border-eucalyptus-200">Up for grabs</Badge>
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
      {tab === 'schedule' && allChores.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-10 w-10 mx-auto text-bark-300 mb-3" />
            <p className="text-bark-600 font-medium mb-1">No chores yet</p>
            <p className="text-sm text-bark-400 mb-4">Create your first chore to start building a schedule.</p>
            <Button asChild>
              <Link href={route('chores.create')}>
                <PlusCircle className="h-4 w-4 mr-1.5" />
                Add a chore
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {tab === 'schedule' && allChores.length > 0 && (
        <div className="space-y-4">
          {/* Summary bar for the next past day — always at the top */}
          {(() => {
            const nextDaysBack = pastDaysShown + 1;
            const summaryDate = subDays(new Date(), nextDaysBack);
            const summaryLabel = isYesterday(summaryDate) ? 'Yesterday' : format(summaryDate, 'EEE d MMM');
            const summaryRows = allSpenders
              .map(spender => {
                const chores = allChores.filter(chore =>
                  (chore.up_for_grabs || chore.spenders?.some(s => s.id === spender.id)) &&
                  isChoreScheduledOnDate(chore, summaryDate)
                );
                const total = chores.length;
                const completed = chores.filter(c => {
                  const s = getCompletionStatus(c.id, spender.id, summaryDate);
                  return s === 'approved' || s === 'pending';
                }).length;
                return { spender, total, completed };
              })
              .filter(r => r.total > 0);

            if (summaryRows.length === 0 && pastDaysShown === 0) return null;

            return (
              <button type="button" onClick={expandPastDay} disabled={loadingPastDay} className="w-full text-left">
                <div className="flex items-center justify-between px-4 py-2.5 rounded-lg border border-dashed border-bark-200 bg-bark-50 hover:bg-bark-100 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-bark-500 uppercase tracking-wide">{summaryLabel}</span>
                    <span className="text-xs text-bark-400">{format(summaryDate, 'EEEE d MMMM')}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {summaryRows.map(({ spender, completed, total }) => (
                      <div key={spender.id} className="flex items-center gap-1.5 text-xs text-bark-500">
                        <Avatar className="h-4 w-4">
                          <AvatarImage src={spender.avatar_url ?? undefined} />
                          <AvatarFallback
                            style={{ backgroundColor: spender.color ?? '#6366f1' }}
                            className="text-white text-[8px] font-bold"
                          >
                            {spender.name[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className={completed === total ? 'text-gumleaf-600 font-medium' : ''}>
                          {completed}/{total}
                        </span>
                      </div>
                    ))}
                    {loadingPastDay
                      ? <span className="text-bark-400 text-xs">…</span>
                      : <span className="text-bark-400 text-xs">▼</span>
                    }
                  </div>
                </div>
              </button>
            );
          })()}

          {/* Expanded past day cards — most recent first */}
          {Array.from({ length: pastDaysShown }, (_, i) => {
            const daysBack = pastDaysShown - i;
            const date = subDays(new Date(), daysBack);
            const label = isYesterday(date) ? 'Yesterday' : format(date, 'EEE d MMM');
            const spenderRows = allSpenders
              .map(spender => {
                const chores = allChores.filter(chore =>
                  (chore.up_for_grabs || chore.spenders?.some(s => s.id === spender.id)) &&
                  isChoreScheduledOnDate(chore, date)
                );
                return { spender, chores };
              })
              .filter(r => r.chores.length > 0);

            return (
              <Card key={date.toISOString()} className="border-bark-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-muted-foreground">
                    {label}
                    <span className="ml-2 font-normal text-xs text-muted-foreground">
                      {format(date, 'EEEE d MMMM')}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  {spenderRows.length === 0 && (
                    <p className="text-xs text-bark-400">No chores scheduled for this day.</p>
                  )}
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
                          const missed = !status;
                          return (
                            <div
                              key={chore.id}
                              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs ${
                                status === 'approved' ? 'bg-gumleaf-50 text-gumleaf-600' :
                                status === 'pending'  ? 'bg-wattle-50 text-wattle-600' :
                                status === 'declined' ? 'bg-redearth-50 text-redearth-600' :
                                missed ? 'bg-redearth-100 text-redearth-500' :
                                'bg-muted text-muted-foreground'
                              }`}
                            >
                              <span>{chore.emoji ?? '📋'}</span>
                              <span className="font-medium">{chore.name}</span>
                              {status === 'approved' && <CheckCircle2 className="h-3 w-3 shrink-0" />}
                              {status === 'pending'  && <Clock className="h-3 w-3 shrink-0" />}
                              {status === 'declined' && <XCircle className="h-3 w-3 shrink-0" />}
                              {missed && <XCircle className="h-3 w-3 shrink-0" />}
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
                              status === 'approved' ? 'bg-gumleaf-50 text-gumleaf-600' :
                              status === 'pending'  ? 'bg-wattle-50 text-wattle-600' :
                              status === 'declined' ? 'bg-redearth-50 text-redearth-600' :
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
