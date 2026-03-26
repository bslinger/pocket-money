import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { Family, FamilyUser, User, Spender } from '@/types/models';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { guessNameFromEmoji } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/Components/ui/avatar';
import { Badge } from '@/Components/ui/badge';
import { Clock, PlusCircle, UserPlus, Pencil, Trash2, ShieldCheck, User as UserIcon, ArchiveRestore, X } from 'lucide-react';
import EmojiPickerField from '@/Components/EmojiPickerField';

interface PendingInvitation {
    id: string;
    email: string;
    role: string;
    expires_at: string;
}

interface Props {
    family: Family & {
        family_users: (FamilyUser & { user: User })[];
        spenders: (Spender & { accounts: { id: string }[] })[];
    };
    authUserId: string;
    pendingInvitations: PendingInvitation[];
    isAdmin: boolean;
}

const CURRENCY_PRESETS = [
    { label: 'Dollars',  symbol: '$',  name: 'Dollar' },
    { label: 'Stars',    symbol: '⭐', name: 'Star' },
    { label: 'Coins',    symbol: '🪙', name: 'Coin' },
    { label: 'Points',   symbol: '🏆', name: 'Point' },
];

export default function FamilyShow({ family, authUserId, pendingInvitations, isAdmin }: Props) {
    return (
        <AuthenticatedLayout header={<h1 className="text-xl font-semibold">{family.name}</h1>}>
            <Head title={`${family.name} — Settings`} />
            <div className="space-y-6">
                <FamilyDetailsSection family={family} />
                <ParentsSection family={family} authUserId={authUserId} pendingInvitations={pendingInvitations} isAdmin={isAdmin} />
                <SpendersSection family={family} />
            </div>
        </AuthenticatedLayout>
    );
}

// ── Family name + currency ──────────────────────────────────────────────────

function FamilyDetailsSection({ family }: { family: Family }) {
    const { data, setData, put, processing, errors, recentlySuccessful } = useForm({
        name:                  family.name,
        currency_name:         family.currency_name,
        currency_name_plural:  family.currency_name_plural ?? '',
        currency_symbol:       family.currency_symbol,
        use_integer_amounts:   family.use_integer_amounts,
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        put(route('families.update', family.id));
    }

    const isCustomPreset = !CURRENCY_PRESETS.some(p => p.symbol === data.currency_symbol);

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-base">Family details</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={submit} className="space-y-5">
                    {/* Name */}
                    <div className="space-y-1.5">
                        <Label htmlFor="family-name">Family name</Label>
                        <Input
                            id="family-name"
                            value={data.name}
                            onChange={e => setData('name', e.target.value)}
                        />
                        {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                    </div>

                    {/* Currency */}
                    <div className="space-y-2">
                        <Label>Currency</Label>
                        <p className="text-xs text-muted-foreground">
                            How amounts appear throughout the app. Pick a preset or choose any emoji.
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            {CURRENCY_PRESETS.map(preset => {
                                const selected = data.currency_symbol === preset.symbol;
                                return (
                                    <button
                                        key={preset.symbol}
                                        type="button"
                                        onClick={() => setData({ ...data, currency_symbol: preset.symbol, currency_name: preset.name })}
                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-colors ${
                                            selected
                                                ? 'border-primary bg-primary/5'
                                                : 'border-border hover:border-primary/40'
                                        }`}
                                    >
                                        <span className="text-xl">{preset.symbol}</span>
                                        <div>
                                            <p className={`text-sm font-medium ${selected ? 'text-primary' : 'text-foreground'}`}>
                                                {preset.label}
                                            </p>
                                            <p className="text-xs text-muted-foreground">{preset.symbol}10</p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Custom emoji */}
                        <div className="flex items-center gap-3 pt-1">
                            <EmojiPickerField
                                value={isCustomPreset ? data.currency_symbol : ''}
                                defaultEmoji="✏️"
                                onChange={e => setData({ ...data, currency_symbol: e })}
                                onPickerChange={d => setData({ ...data, currency_symbol: d.emoji, currency_name: guessNameFromEmoji(d.names) })}
                                pickerAlign="left"
                            />
                            <div>
                                <p className="text-sm font-medium">Custom emoji</p>
                                <p className="text-xs text-muted-foreground">Pick any emoji for your currency</p>
                            </div>
                        </div>

                        {/* Currency name */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="currency-name">Currency name (singular)</Label>
                                <Input
                                    id="currency-name"
                                    value={data.currency_name}
                                    onChange={e => setData('currency_name', e.target.value)}
                                    placeholder="e.g. Star, Coin"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="currency-name-plural">Plural (optional)</Label>
                                <Input
                                    id="currency-name-plural"
                                    value={data.currency_name_plural}
                                    onChange={e => setData('currency_name_plural', e.target.value)}
                                    placeholder={data.currency_name ? data.currency_name + 's' : 'Stars'}
                                />
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Preview: {data.currency_symbol}1 {data.currency_name} · {data.currency_symbol}25 {data.currency_name_plural || (data.currency_name + 's')}
                        </p>

                        {/* Integer amounts */}
                        <label className="flex items-center gap-2.5 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={data.use_integer_amounts}
                                onChange={e => setData('use_integer_amounts', e.target.checked)}
                                className="h-4 w-4 rounded border-input accent-primary"
                            />
                            <span className="text-sm">Whole numbers only (e.g. 5 Stars, not 5.50)</span>
                        </label>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button type="submit" disabled={processing}>Save</Button>
                        {recentlySuccessful && <p className="text-sm text-gumleaf-400">Saved.</p>}
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}

// ── Parents / carers ────────────────────────────────────────────────────────

function ParentsSection({ family, authUserId, pendingInvitations, isAdmin }: {
    family: Props['family'];
    authUserId: string;
    pendingInvitations: PendingInvitation[];
    isAdmin: boolean;
}) {
    const inviteForm = useForm({ email: '' });

    function submitInvite(e: React.FormEvent) {
        e.preventDefault();
        inviteForm.post(route('families.invite', family.id), { onSuccess: () => inviteForm.reset() });
    }

    function removeMember(user: User) {
        if (!confirm(`Remove ${user.display_name ?? user.name} from this family?`)) return;
        router.delete(route('families.members.destroy', { family: family.id, user: user.id }));
    }

    function toggleRole(familyUser: FamilyUser & { user: User }) {
        const newRole = familyUser.role === 'admin' ? 'member' : 'admin';
        router.patch(route('families.members.role', { family: family.id, user: familyUser.user_id }), { role: newRole });
    }

    function revokeInvitation(invitation: PendingInvitation) {
        if (!confirm(`Revoke invitation for ${invitation.email}?`)) return;
        router.delete(route('families.invitations.destroy', { family: family.id, invitation: invitation.id }));
    }

    return (
        <Card id="parents">
            <CardHeader className="pb-3">
                <CardTitle className="text-base">Parents & carers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <ul className="divide-y">
                    {/* Active members */}
                    {family.family_users.map(fu => (
                        <li key={fu.id} className="flex items-center gap-3 py-3">
                            <Avatar className="h-9 w-9 shrink-0">
                                <AvatarImage src={fu.user.avatar_url ?? undefined} />
                                <AvatarFallback className="text-sm font-medium">
                                    {(fu.user.display_name ?? fu.user.name)[0].toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                    {fu.user.display_name ?? fu.user.name}
                                    {fu.user.id === authUserId && (
                                        <span className="text-muted-foreground font-normal"> (you)</span>
                                    )}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">{fu.user.email}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                {isAdmin && (
                                    <button
                                        type="button"
                                        onClick={() => toggleRole(fu)}
                                        title={fu.role === 'admin' ? 'Admin - click to make Member' : 'Member - click to make Admin'}
                                        className="flex items-center gap-1 text-xs px-2 py-1 rounded-md border transition-colors hover:bg-muted"
                                    >
                                        {fu.role === 'admin'
                                            ? <><ShieldCheck className="h-3.5 w-3.5 text-primary" /> Admin</>
                                            : <><UserIcon className="h-3.5 w-3.5 text-muted-foreground" /> Member</>
                                        }
                                    </button>
                                )}
                                {!isAdmin && (
                                    <Badge variant="outline" className="text-xs gap-1">
                                        {fu.role === 'admin'
                                            ? <><ShieldCheck className="h-3 w-3" /> Admin</>
                                            : <><UserIcon className="h-3 w-3" /> Member</>
                                        }
                                    </Badge>
                                )}
                                {isAdmin && fu.user.id !== authUserId && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-destructive hover:text-destructive"
                                        onClick={() => removeMember(fu.user)}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                )}
                            </div>
                        </li>
                    ))}

                    {/* Pending invitations */}
                    {pendingInvitations.map(inv => (
                        <li key={inv.id} className="flex items-center gap-3 py-3 opacity-60">
                            <Avatar className="h-9 w-9 shrink-0">
                                <AvatarFallback className="text-sm font-medium bg-bark-100 text-bark-400">
                                    <Clock className="h-4 w-4" />
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{inv.email}</p>
                                <p className="text-xs text-muted-foreground">
                                    Invited, expires {new Date(inv.expires_at).toLocaleDateString()}
                                </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <Badge variant="outline" className="text-xs gap-1 text-wattle-600 border-wattle-300">
                                    <Clock className="h-3 w-3" /> Pending
                                </Badge>
                                {isAdmin && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-destructive hover:text-destructive"
                                        onClick={() => revokeInvitation(inv)}
                                        title="Revoke invitation"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </Button>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>

                {/* Invite form — admin only */}
                {isAdmin && (
                    <>
                        <form onSubmit={submitInvite} className="flex gap-2 pt-2 border-t">
                            <Input
                                type="email"
                                value={inviteForm.data.email}
                                onChange={e => inviteForm.setData('email', e.target.value)}
                                placeholder="Invite a parent by email…"
                                className="flex-1"
                            />
                            <Button type="submit" size="sm" disabled={inviteForm.processing}>
                                <UserPlus className="h-4 w-4 mr-1.5" />
                                Invite
                            </Button>
                        </form>
                        {inviteForm.errors.email && <p className="text-xs text-destructive">{inviteForm.errors.email}</p>}
                    </>
                )}
            </CardContent>
        </Card>
    );
}

// ── Spenders ────────────────────────────────────────────────────────────────

function SpendersSection({ family }: { family: Props['family'] }) {
    const active   = family.spenders.filter(s => !s.deleted_at);
    const archived = family.spenders.filter(s => !!s.deleted_at);

    function archiveSpender(spender: Spender) {
        if (!confirm(`Archive ${spender.name}? Their history is preserved and they can be restored later.`)) return;
        router.delete(route('spenders.destroy', spender.id));
    }

    function restoreSpender(spender: Spender) {
        router.post(route('spenders.restore', spender.id));
    }

    const SpenderRow = ({ s, isArchived }: { s: Spender; isArchived: boolean }) => (
        <li key={s.id} className={`flex items-center gap-3 py-3 ${isArchived ? 'opacity-60' : ''}`}>
            <Avatar className="h-9 w-9 shrink-0">
                <AvatarImage src={s.avatar_url ?? undefined} />
                <AvatarFallback
                    style={{ backgroundColor: s.color ?? '#6366f1' }}
                    className="text-white font-semibold text-sm"
                >
                    {s.name[0].toUpperCase()}
                </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{s.name}</p>
                <p className="text-xs text-muted-foreground">
                    {isArchived ? (
                        <span className="italic">Archived</span>
                    ) : (
                        <>
                            {(s.accounts?.length ?? 0)} account{(s.accounts?.length ?? 0) !== 1 ? 's' : ''}
                            {s.currency_symbol && (
                                <span className="ml-2">{s.currency_symbol} custom currency</span>
                            )}
                        </>
                    )}
                </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
                {isArchived ? (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        title="Restore"
                        onClick={() => restoreSpender(s)}
                    >
                        <ArchiveRestore className="h-3.5 w-3.5" />
                    </Button>
                ) : (
                    <>
                        <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                            <Link href={route('spenders.edit', s.id)}>
                                <Pencil className="h-3.5 w-3.5" />
                            </Link>
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            title="Archive"
                            onClick={() => archiveSpender(s)}
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                    </>
                )}
            </div>
        </li>
    );

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base">Spenders</CardTitle>
                <Button variant="outline" size="sm" asChild>
                    <Link href={route('spenders.create')}>
                        <PlusCircle className="h-4 w-4 mr-1.5" />
                        Add spender
                    </Link>
                </Button>
            </CardHeader>
            <CardContent>
                {family.spenders.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2">No spenders yet.</p>
                ) : (
                    <ul className="divide-y">
                        {active.map(s => <SpenderRow key={s.id} s={s} isArchived={false} />)}
                        {archived.map(s => <SpenderRow key={s.id} s={s} isArchived={true} />)}
                    </ul>
                )}
            </CardContent>
        </Card>
    );
}
