import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Family, Chore, Spender } from '@/types/models';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/Components/ui/avatar';
import { PlusCircle, Pencil, Trash2 } from 'lucide-react';

interface Props {
  families: (Family & { chores: (Chore & { spenders: Spender[] })[] })[];
}

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
  function deleteChore(chore: Chore) {
    if (!confirm(`Delete "${chore.name}"?`)) return;
    router.delete(route('chores.destroy', chore.id));
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
      <div className="space-y-6">
        {families.map(family => (
          <Card key={family.id}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{family.name}</CardTitle>
            </CardHeader>
            <CardContent>
              {family.chores.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">No chores yet.</p>
              ) : (
                <div className="divide-y">
                  {family.chores.map(chore => (
                    <div key={chore.id} className="flex items-center justify-between py-3 gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-2xl w-8 text-center">{chore.emoji ?? '📋'}</span>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{chore.name}</p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            {rewardBadge(chore.reward_type)}
                            {chore.reward_type === 'earns' && chore.amount && (
                              <span className="text-xs text-muted-foreground">${chore.amount}</span>
                            )}
                            <Badge variant="outline" className="text-xs font-normal">
                              {frequencyLabel(chore.frequency)}
                            </Badge>
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
        ))}
        {families.length === 0 && (
          <p className="text-center text-muted-foreground py-16">No families found.</p>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
