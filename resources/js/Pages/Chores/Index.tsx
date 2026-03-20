import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Family, Chore, Spender } from '@/types/models';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/Components/ui/avatar';
import { PlusCircle, Pencil, Trash2, ArrowUpDown, ArrowUp, ArrowDown, History } from 'lucide-react';
import { formatAmount } from '@/lib/utils';
import { useState } from 'react';

interface Props {
  families: (Family & {
    chores: (Chore & { spenders: Spender[] })[];
    spenders: Spender[];
  })[];
}

type SortField = 'name' | 'created_at';
type SortDir = 'asc' | 'desc';

const rewardBadge = (type: Chore['reward_type']) => {
  if (type === 'earns') return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Earns</Badge>;
  if (type === 'responsibility') return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Responsibility</Badge>;
  return <Badge variant="secondary">No reward</Badge>;
};

const frequencyLabel = (f: Chore['frequency']) => {
  const map = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', one_off: 'One-off' };
  return map[f];
};

export default function ChoresIndex({ families }: Props) {
  const [filterSpenderId, setFilterSpenderId] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

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

  // Collect all spenders across families for the filter dropdown
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
      let valA = sortField === 'name' ? a.name : a.created_at;
      let valB = sortField === 'name' ? b.name : b.created_at;
      const cmp = valA < valB ? -1 : valA > valB ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }

  return (
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

      {/* Filter + sort bar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {/* Spender filter */}
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

        {/* Sort controls */}
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
                              {rewardBadge(chore.reward_type)}
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
                          {/* Assigned spender avatars */}
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
                            <Link href={route('chores.history', chore.id)}>
                              <History className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="icon" asChild className="h-7 w-7">
                            <Link href={route('chores.edit', chore.id)}>
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
    </AuthenticatedLayout>
  );
}
