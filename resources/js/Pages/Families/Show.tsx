import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { Family, FamilyUser, User } from '@/types/models';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { guessNameFromEmoji } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/Components/ui/avatar';
import { Badge } from '@/Components/ui/badge';
import { Clock, UserPlus, Trash2, ShieldCheck, User as UserIcon, X, Monitor, Copy, Check } from 'lucide-react';
import EmojiPickerField from '@/Components/EmojiPickerField';
import Modal from '@/Components/Modal';
import { QRCodeSVG } from 'qrcode.react';
import { useState, useEffect } from 'react';
import { useFamilyChannel } from '@/hooks/useBroadcast';

interface PendingInvitation {
    id: string;
    email: string;
    role: string;
    expires_at: string;
}

interface FamilyScreenDeviceItem {
    id: string;
    device_name: string;
    last_active_at: string | null;
    created_at: string;
}

interface Props {
    family: Family & {
        family_users: (FamilyUser & { user: User })[];
    };
    authUserId: string;
    pendingInvitations: PendingInvitation[];
    isAdmin: boolean;
    familyScreenDevices: FamilyScreenDeviceItem[];
    flash?: { familyScreenLinkCode?: { code: string; expires_at: string } | null };
}

const CURRENCY_PRESETS = [
    { label: 'Dollars',  symbol: '$',  name: 'Dollar' },
    { label: 'Stars',    symbol: '⭐', name: 'Star' },
    { label: 'Coins',    symbol: '🪙', name: 'Coin' },
    { label: 'Points',   symbol: '🏆', name: 'Point' },
];

export default function FamilyShow({ family, authUserId, pendingInvitations, isAdmin, familyScreenDevices, flash }: Props) {
    useFamilyChannel(family.id);
    return (
        <AuthenticatedLayout header={<h1 className="text-xl font-semibold">{family.name}</h1>}>
            <Head title={`${family.name} — Settings`} />
            <div className="space-y-6">
                <FamilyDetailsSection family={family} />
                <ParentsSection family={family} authUserId={authUserId} pendingInvitations={pendingInvitations} isAdmin={isAdmin} />
                <FamilyScreenSection family={family} devices={familyScreenDevices} flashLinkCode={flash?.familyScreenLinkCode} />
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

// ── useCountdown ────────────────────────────────────────────────────────────

function useCountdown(expiresAt: string | null) {
    const [secondsLeft, setSecondsLeft] = useState(() =>
        expiresAt ? Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)) : 0
    );

    useEffect(() => {
        if (!expiresAt) return;
        const tick = () => setSecondsLeft(Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)));
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [expiresAt]);

    const m = Math.floor(secondsLeft / 60);
    const s = secondsLeft % 60;
    const display = `${m}:${String(s).padStart(2, '0')}`;
    return { secondsLeft, display };
}

// ── Family screen ────────────────────────────────────────────────────────────

function formatExactTime(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function FamilyScreenSection({ family, devices, flashLinkCode }: {
    family: Family;
    devices: FamilyScreenDeviceItem[];
    flashLinkCode?: { code: string; expires_at: string } | null;
}) {
    const [generating, setGenerating] = useState(false);
    const [showCodeModal, setShowCodeModal] = useState(false);
    const [copied, setCopied] = useState(false);
    const [activeCode, setActiveCode] = useState<{ code: string; expires_at: string } | null>(flashLinkCode ?? null);
    const [deviceToRemove, setDeviceToRemove] = useState<FamilyScreenDeviceItem | null>(null);
    const [removing, setRemoving] = useState(false);

    const flashCodeValue = flashLinkCode?.code ?? null;
    useEffect(() => {
        if (flashLinkCode && flashCodeValue) {
            setActiveCode(flashLinkCode);
            setShowCodeModal(true);
        }
    }, [flashCodeValue]);

    const { secondsLeft, display: countdown } = useCountdown(activeCode?.expires_at ?? null);
    const isExpired = activeCode !== null && secondsLeft <= 0;

    useEffect(() => {
        if (isExpired) setActiveCode(null);
    }, [isExpired]);

    function handleGenerate() {
        setGenerating(true);
        router.post(route('families.generate-family-screen-code', family.id), {}, {
            preserveScroll: true,
            onSuccess: (page: any) => {
                const code = page.props?.flash?.familyScreenLinkCode;
                if (code) {
                    setActiveCode(code);
                    setShowCodeModal(true);
                }
            },
            onFinish: () => setGenerating(false),
        });
    }

    function handleCopy(code: string) {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    function handleConfirmRemove() {
        if (!deviceToRemove) return;
        setRemoving(true);
        router.delete(route('families.family-screen-devices.revoke', { family: family.id, device: deviceToRemove.id }), {
            preserveScroll: true,
            onFinish: () => {
                setRemoving(false);
                setDeviceToRemove(null);
            },
        });
    }

    const qrValue = activeCode ? `quiddo://link?code=${activeCode.code}` : '';

    return (
        <>
            {/* Link code modal */}
            <Modal show={showCodeModal && !!activeCode && !isExpired} maxWidth="sm" onClose={() => setShowCodeModal(false)}>
                {activeCode && (
                    <div className="p-6 text-center space-y-5">
                        <div>
                            <h3 className="text-lg font-semibold text-bark-700">Link a family screen</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                Scan this QR code or enter the code on the tablet running Quiddo
                            </p>
                        </div>
                        <div className="flex justify-center">
                            <div className="bg-white p-4 rounded-xl border border-bark-200 inline-block">
                                <QRCodeSVG value={qrValue} size={200} fgColor="#3A3028" bgColor="#FFFFFF" level="M" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">Or enter this code manually</p>
                            <div className="flex items-center justify-center gap-2">
                                <span className="text-3xl font-mono font-bold tracking-[0.3em] text-eucalyptus-400">
                                    {activeCode.code}
                                </span>
                                <button onClick={() => handleCopy(activeCode.code)} className="text-muted-foreground hover:text-foreground p-1">
                                    {copied ? <Check className="h-4 w-4 text-gumleaf-400" /> : <Copy className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                        <p className={`text-xs ${secondsLeft < 60 ? 'text-redearth-400' : 'text-muted-foreground'}`}>
                            Expires in {countdown}
                        </p>
                        <Button variant="outline" size="sm" onClick={() => setShowCodeModal(false)} className="w-full">
                            Done
                        </Button>
                    </div>
                )}
            </Modal>

            {/* Remove device confirmation modal */}
            <Modal show={!!deviceToRemove} maxWidth="sm" onClose={() => setDeviceToRemove(null)}>
                {deviceToRemove && (
                    <div className="p-6 space-y-4">
                        <h3 className="text-lg font-semibold text-bark-700">Remove family screen</h3>
                        <p className="text-sm text-muted-foreground">
                            <span className="font-medium text-bark-700">{deviceToRemove.device_name || 'This device'}</span> will be immediately signed out and can no longer access your family's data. You can link it again with a new code.
                        </p>
                        {deviceToRemove.last_active_at && (
                            <p className="text-xs text-muted-foreground">
                                Last active: {formatExactTime(deviceToRemove.last_active_at)}
                            </p>
                        )}
                        <div className="flex gap-3 pt-1">
                            <Button variant="outline" className="flex-1" onClick={() => setDeviceToRemove(null)}>
                                Cancel
                            </Button>
                            <Button variant="destructive" className="flex-1" disabled={removing} onClick={handleConfirmRemove}>
                                {removing ? 'Removing…' : 'Remove'}
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Monitor className="h-4 w-4" />
                        Family screen
                    </CardTitle>
                    <Button variant="outline" size="sm" onClick={() => activeCode && !isExpired ? setShowCodeModal(true) : handleGenerate()} disabled={generating}>
                        {generating ? 'Generating…' : activeCode && !isExpired ? 'Show code' : 'Link a device'}
                    </Button>
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-muted-foreground mb-3">
                        Link a shared tablet or screen to display all kids' chores, goals, and balances.
                    </p>
                    {devices.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-1">No devices linked yet.</p>
                    ) : (
                        <ul className="divide-y">
                            {devices.map(device => (
                                <li key={device.id} className="flex items-center gap-3 py-3">
                                    <Monitor className="h-4 w-4 text-muted-foreground shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium">{device.device_name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {device.last_active_at
                                                ? `Last active ${formatExactTime(device.last_active_at)}`
                                                : `Added ${formatExactTime(device.created_at)}`}
                                        </p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-destructive hover:text-destructive shrink-0"
                                        title="Remove device"
                                        onClick={() => setDeviceToRemove(device)}
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    )}
                </CardContent>
            </Card>
        </>
    );
}

