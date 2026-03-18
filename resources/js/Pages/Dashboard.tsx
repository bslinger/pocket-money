import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { Family, Spender } from '@/types/models';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/Components/ui/avatar';
import { PlusCircle, ArrowRight, Users } from 'lucide-react';

interface Props {
  isParent: boolean;
  families: Family[];
  spenders: Spender[];
}

export default function Dashboard({ isParent, families, spenders }: Props) {
  return (
    <AuthenticatedLayout header={<h1 className="text-xl font-semibold">Dashboard</h1>}>
      <Head title="Dashboard" />
      {isParent ? (
        <ParentDashboard families={families} />
      ) : (
        <ChildDashboard spenders={spenders} />
      )}
    </AuthenticatedLayout>
  );
}

function ParentDashboard({ families }: { families: Family[] }) {
  if (families.length === 0) {
    return (
      <Card className="max-w-md mx-auto mt-16 text-center">
        <CardContent className="pt-10 pb-10 flex flex-col items-center gap-4">
          <div className="rounded-full bg-muted p-4">
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">No family yet</h2>
            <p className="text-muted-foreground text-sm mt-1">Create a family to start tracking pocket money.</p>
          </div>
          <Button asChild>
            <Link href={route('families.create')}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Create a Family
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {families.map(family => (
        <Card key={family.id}>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">{family.name}</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href={route('families.show', family.id)}>
                Manage <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {(family.spenders?.length ?? 0) === 0 ? (
              <div className="flex items-center justify-between py-2 text-sm text-muted-foreground">
                <span>No spenders yet.</span>
                <Button variant="outline" size="sm" asChild>
                  <Link href={route('spenders.create')}>
                    <PlusCircle className="h-4 w-4 mr-1.5" />
                    Add spender
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {family.spenders?.map(spender => (
                  <SpenderCard key={spender.id} spender={spender} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ChildDashboard({ spenders }: { spenders: Spender[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {spenders.map(spender => (
        <SpenderCard key={spender.id} spender={spender} />
      ))}
    </div>
  );
}

function SpenderCard({ spender }: { spender: Spender }) {
  const total = spender.accounts?.reduce((sum, a) => sum + parseFloat(String(a.balance)), 0) ?? 0;
  const accountCount = spender.accounts?.length ?? 0;

  return (
    <Link href={route('spenders.show', spender.id)}>
      <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
        <CardContent className="pt-4">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={spender.avatar_url ?? undefined} alt={spender.name} />
              <AvatarFallback style={{ backgroundColor: spender.color ?? '#6366f1' }} className="text-white font-semibold text-sm">
                {spender.name[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-medium truncate">{spender.name}</p>
              <Badge variant="secondary" className="text-xs font-normal">
                {accountCount} account{accountCount !== 1 ? 's' : ''}
              </Badge>
            </div>
          </div>
          <p className="text-2xl font-bold tabular-nums">${total.toFixed(2)}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
