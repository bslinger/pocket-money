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
    <Badge className="bg-gumleaf-50 text-gumleaf-600 border-gumleaf-200 gap-1">
      <CheckCircle2 className="h-3 w-3" /> Approved
    </Badge>
  );
  if (status === 'declined') return (
    <Badge className="bg-redearth-50 text-redearth-600 border-redearth-200 gap-1">
      <XCircle className="h-3 w-3" /> Declined
    </Badge>
  );
  return (
    <Badge className="bg-wattle-50 text-wattle-600 border-wattle-200 gap-1">
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
        <h1 className="text-xl font-semibold text-bark-700">
          {chore.emoji ? `${chore.emoji} ` : ''}{chore.name} — History
        </h1>
      </div>
    }>
      <Head title={`${chore.name} History`} />

      <div className="space-y-4 max-w-2xl">
        <Link href={route('chores.index')} className="text-sm text-bark-500 hover:text-bark-700">
          ← All chores
        </Link>

        <Card className="border-bark-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-bark-700">Completion history</CardTitle>
          </CardHeader>
          <CardContent>
            {completions.data.length === 0 ? (
              <p className="text-sm text-bark-500 py-2">No completions yet.</p>
            ) : (
              <div className="divide-y divide-bark-200">
                {completions.data.map(c => (
                  <div key={c.id} className="flex items-center gap-3 py-3">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={c.spender.avatar_url ?? undefined} />
                      <AvatarFallback
                        style={{ backgroundColor: c.spender.color ?? '#4A7C59' }}
                        className="text-white text-sm font-semibold"
                      >
                        {c.spender.name[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-bark-700">{c.spender.name}</p>
                      <p className="text-xs text-bark-500">
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
                          className="h-7 w-7 text-bark-400 hover:text-wattle-600"
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
              <Link href={completions.prev_page_url} className="text-sm text-bark-500 hover:text-bark-700">
                ← Previous
              </Link>
            )}
            <span className="text-sm text-bark-500">
              Page {completions.current_page} of {completions.last_page}
            </span>
            {completions.next_page_url && (
              <Link href={completions.next_page_url} className="text-sm text-bark-500 hover:text-bark-700">
                Next →
              </Link>
            )}
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
