import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Chore, ChoreCompletion, Spender } from '@/types/models';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/Components/ui/avatar';
import { CheckCircle2, XCircle, Clock, Undo2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';

interface Paginated<T> {
  data: T[];
  current_page: number;
  last_page: number;
  next_page_url: string | null;
  prev_page_url: string | null;
}

interface Props {
  chore: Chore & { spenders: Spender[] };
  completions: Paginated<ChoreCompletion & { spender: Spender }>;
}

function statusBadge(status: ChoreCompletion['status']) {
  if (status === 'approved') return (
    <Badge className="bg-green-100 text-green-800 border-green-200 gap-1">
      <CheckCircle2 className="h-3 w-3" /> Approved
    </Badge>
  );
  if (status === 'declined') return (
    <Badge className="bg-red-100 text-red-800 border-red-200 gap-1">
      <XCircle className="h-3 w-3" /> Declined
    </Badge>
  );
  return (
    <Badge className="bg-amber-100 text-amber-800 border-amber-200 gap-1">
      <Clock className="h-3 w-3" /> Pending
    </Badge>
  );
}

export default function ChoreHistory({ chore, completions }: Props) {
  const [unapproving, setUnapproving] = useState<string | null>(null);

  function unapprove(completionId: string) {
    setUnapproving(completionId);
    router.patch(route('chore-completions.unapprove', completionId), {}, {
      onFinish: () => setUnapproving(null),
    });
  }

  return (
    <AuthenticatedLayout header={
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          {chore.emoji ? `${chore.emoji} ` : ''}{chore.name} — History
        </h1>
      </div>
    }>
      <Head title={`${chore.name} History`} />

      <div className="space-y-4 max-w-2xl">
        <Link href={route('chores.index')} className="text-sm text-muted-foreground hover:text-foreground">
          ← All chores
        </Link>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Completion history</CardTitle>
          </CardHeader>
          <CardContent>
            {completions.data.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">No completions yet.</p>
            ) : (
              <div className="divide-y">
                {completions.data.map(c => (
                  <div key={c.id} className="flex items-center gap-3 py-3">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={c.spender.avatar_url ?? undefined} />
                      <AvatarFallback
                        style={{ backgroundColor: c.spender.color ?? '#6366f1' }}
                        className="text-white text-sm font-semibold"
                      >
                        {c.spender.name[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{c.spender.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(c.completed_at), { addSuffix: true })}
                        {c.note && <span className="ml-2 italic">"{c.note}"</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {statusBadge(c.status)}
                      {c.status === 'approved' && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-muted-foreground hover:text-amber-600"
                          title="Undo approval"
                          disabled={unapproving === c.id}
                          onClick={() => unapprove(c.id)}
                        >
                          <Undo2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {completions.last_page > 1 && (
          <div className="flex justify-center gap-2">
            {completions.prev_page_url && (
              <Link href={completions.prev_page_url} className="text-sm text-muted-foreground hover:text-foreground">
                ← Previous
              </Link>
            )}
            <span className="text-sm text-muted-foreground">
              Page {completions.current_page} of {completions.last_page}
            </span>
            {completions.next_page_url && (
              <Link href={completions.next_page_url} className="text-sm text-muted-foreground hover:text-foreground">
                Next →
              </Link>
            )}
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
