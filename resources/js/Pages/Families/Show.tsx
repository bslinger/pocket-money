import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { Family, FamilyUser, User, Spender } from '@/types/models';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/Components/ui/avatar';
import { Badge } from '@/Components/ui/badge';
import { PlusCircle, UserPlus, Pencil, Trash2, ShieldCheck, User as UserIcon } from 'lucide-react';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { useState, useRef, useEffect } from 'react';

interface Props {
    family: Family & {
        family_users: (FamilyUser & { user: User })[];
        spenders: (Spender & { accounts: { id: string }[] })[];
    };
    authUserId: string;
}

const CURRENCY_PRESETS = [
    { label: 'Dollars',  symbol: '$',  name: 'Dollar' },
    { label: 'Stars',    symbol: '⭐', name: 'Star' },
    { label: 'Coins',    symbol: '🪙', name: 'Coin' },
    { label: 'Points',   symbol: '🏆', name: 'Point' },
];

export default function FamilyShow({ family, authUserId }: Props) {
    return (
        <AuthenticatedLayout header={<h1 className="text-xl font-semibold">{family.name}</h1>}>
            <Head title={`${family.name} — Settings`} />
            <div className="space-y-6">
                <FamilyDetailsSection family={family} />
                <ParentsSection family={family} authUserId={authUserId} />
                <SpendersSection family={family} />
            </div>
        </AuthenticatedLayout>
    );
}

// ── Family name + currency ──────────────────────────────────────────────────

function FamilyDetailsSection({ family }: { family: Family }) {
    const { data, setData, put, processing, errors, recentlySuccessful } = useForm({
        name:            family.name,
        currency_name:   family.currency_name,
        currency_symbol: family.currency_symbol,
    });

    const [showPicker, setShowPicker] = useState(false);
    const pickerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
                setShowPicker(false);
            }
        }
        if (showPicker) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showPicker]);

    function onEmojiClick(emojiData: EmojiClickData) {
        setData('currency_symbol', emojiData.emoji);
        setShowPicker(false);
    }

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
                            <div className="relative" ref={pickerRef}>
                                <button
                                    type="button"
                                    onClick={() => setShowPicker(v => !v)}
                                    className={`w-12 h-10 rounded-lg border text-xl flex items-center justify-center transition-colors ${
                                        isCustomPreset
                                            ? 'border-primary bg-primary/5'
                                            : 'border-border hover:border-primary/40 bg-background'
                                    }`}
                                    aria-label="Custom emoji currency"
                                >
                                    {isCustomPreset ? data.currency_symbol : '✏️'}
                                </button>
                                {showPicker && (
                                    <div className="absolute left-0 top-12 z-50">
                                        <EmojiPicker
                                            onEmojiClick={onEmojiClick}
                                            theme={Theme.AUTO}
                                            lazyLoadEmojis
                                            searchPlaceholder="Search emoji…"
                                        />
                                    </div>
                                )}
                            </div>
                            <div>
                                <p className="text-sm font-medium">Custom emoji</p>
                                <p className="text-xs text-muted-foreground">Pick any emoji for your currency</p>
                            </div>
                        </div>

                        {/* Currency name */}
                        <div className="space-y-1.5">
                            <Label htmlFor="currency-name">Currency name (singular)</Label>
                            <Input
                                id="currency-name"
                                value={data.currency_name}
                                onChange={e => setData('currency_name', e.target.value)}
                                placeholder="e.g. Star, Coin, Smithy Buck"
                            />
                            <p className="text-xs text-muted-foreground">
                                Preview: {data.currency_symbol}25 {data.currency_name}s
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button type="submit" disabled={processing}>Save</Button>
                        {recentlySuccessful && <p className="text-sm text-green-600">Saved.</p>}
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}

// ── Parents / carers ────────────────────────────────────────────────────────

function ParentsSection({ family, authUserId }: {
    family: Props['family'];
    authUserId: string;
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

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-base">Parents & carers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <ul className="divide-y">
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
                                <button
                                    type="button"
                                    onClick={() => toggleRole(fu)}
                                    title={fu.role === 'admin' ? 'Admin — click to make Member' : 'Member — click to make Admin'}
                                    className="flex items-center gap-1 text-xs px-2 py-1 rounded-md border transition-colors hover:bg-muted"
                                >
                                    {fu.role === 'admin'
                                        ? <><ShieldCheck className="h-3.5 w-3.5 text-primary" /> Admin</>
                                        : <><UserIcon className="h-3.5 w-3.5 text-muted-foreground" /> Member</>
                                    }
                                </button>
                                {fu.user.id !== authUserId && (
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
                </ul>

                {/* Invite form */}
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
            </CardContent>
        </Card>
    );
}

// ── Spenders ────────────────────────────────────────────────────────────────

function SpendersSection({ family }: { family: Props['family'] }) {
    function deleteSpender(spender: Spender) {
        if (!confirm(`Remove ${spender.name}? This will delete all their accounts and transaction history.`)) return;
        router.delete(route('spenders.destroy', spender.id));
    }

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
                        {family.spenders.map(s => (
                            <li key={s.id} className="flex items-center gap-3 py-3">
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
                                        {(s.accounts?.length ?? 0)} account{(s.accounts?.length ?? 0) !== 1 ? 's' : ''}
                                        {s.currency_symbol && (
                                            <span className="ml-2 text-xs">{s.currency_symbol} custom currency</span>
                                        )}
                                    </p>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                    <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                                        <Link href={route('spenders.edit', s.id)}>
                                            <Pencil className="h-3.5 w-3.5" />
                                        </Link>
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-destructive hover:text-destructive"
                                        onClick={() => deleteSpender(s)}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </CardContent>
        </Card>
    );
}
