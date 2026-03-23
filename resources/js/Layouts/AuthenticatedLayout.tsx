import { Link, router, usePage } from '@inertiajs/react';
import { PropsWithChildren, ReactNode } from 'react';
import { Button } from '@/Components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import { Separator } from '@/Components/ui/separator';
import { AlertTriangle, Check, ChevronDown, CheckSquare, CreditCard, Eye, LayoutDashboard, LogOut, MailWarning, PlusCircle, Settings2, Target, User, Wallet, Coins, Users, X } from 'lucide-react';

// ── Helpers ──────────────────────────────────────────────────────────────────

function familyInitial(name: string) {
    return name.trim()[0]?.toUpperCase() ?? '?';
}

// Deterministic accent colour from family name for the letter avatar
const AVATAR_COLOURS = [
    'bg-eucalyptus-400', 'bg-wattle-400', 'bg-gumleaf-400',
    'bg-redearth-400',   'bg-nightsky-400', 'bg-eucalyptus-600',
];
function avatarColour(name: string) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_COLOURS[Math.abs(hash) % AVATAR_COLOURS.length];
}

function FamilyAvatar({ name, size = 'sm' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
    const sizeClass = size === 'lg' ? 'h-10 w-10 text-base' : size === 'md' ? 'h-8 w-8 text-sm' : 'h-6 w-6 text-xs';
    return (
        <span className={`inline-flex items-center justify-center rounded-md font-bold text-white shrink-0 ${sizeClass} ${avatarColour(name)}`}>
            {familyInitial(name)}
        </span>
    );
}

// ── Combined family + account menu ───────────────────────────────────────────

function FamilyAccountMenu({
    activeFamily,
    userFamilies,
    user,
}: {
    activeFamily: { id: string; name: string; parents_count: number; kids_count: number };
    userFamilies: { id: string; name: string }[];
    user: { name: string; display_name: string | null; email: string };
}) {
    const displayName = user.display_name ?? user.name;

    const memberSummary = [
        activeFamily.parents_count === 1 ? '1 parent' : `${activeFamily.parents_count} parents`,
        activeFamily.kids_count === 1 ? '1 kid' : `${activeFamily.kids_count} kids`,
    ].join(' · ');

    return (
        <DropdownMenu>
            {/* Trigger: letter avatar + family name */}
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 px-2">
                    <FamilyAvatar name={activeFamily.name} size="sm" />
                    <span className="hidden sm:inline text-sm font-medium max-w-[140px] truncate">
                        {activeFamily.name}
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 text-bark-500 shrink-0" />
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-72 p-0" sideOffset={8}>

                {/* ── Family card ── */}
                <div className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                        <FamilyAvatar name={activeFamily.name} size="lg" />
                        <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">{activeFamily.name}</p>
                            <p className="text-xs text-bark-500">{memberSummary}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1 gap-1.5" asChild>
                            <Link href={route('families.show', activeFamily.id)} prefetch>
                                <Settings2 className="h-3.5 w-3.5" />
                                Settings
                            </Link>
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1 gap-1.5" asChild>
                            <Link href={route('families.show', activeFamily.id) + '#parents'} prefetch>
                                <User className="h-3.5 w-3.5" />
                                Invite
                            </Link>
                        </Button>
                    </div>
                </div>

                <DropdownMenuSeparator className="my-0" />

                {/* ── Account + family list ── */}
                <div className="py-2">
                    {/* User row */}
                    <div className="px-3 py-1.5 mb-1">
                        <p className="text-xs text-bark-500 truncate">{user.email}</p>
                    </div>

                    {/* Family list */}
                    {userFamilies.map(f => (
                        <DropdownMenuItem
                            key={f.id}
                            onSelect={() => {
                                if (f.id !== activeFamily.id) {
                                    router.post(route('families.switch', f.id));
                                }
                            }}
                            className="mx-1 rounded-md gap-2.5 cursor-pointer"
                        >
                            <FamilyAvatar name={f.name} size="sm" />
                            <span className="flex-1 truncate text-sm">{f.name}</span>
                            {f.id === activeFamily.id && <Check className="h-3.5 w-3.5 text-eucalyptus-400 shrink-0" />}
                        </DropdownMenuItem>
                    ))}

                    <DropdownMenuItem asChild className="mx-1 rounded-md gap-2.5 text-eucalyptus-400 hover:text-eucalyptus-400 cursor-pointer">
                        <Link href={route('families.create')}>
                            <PlusCircle className="h-3.5 w-3.5 shrink-0" />
                            <span className="text-sm">New family</span>
                        </Link>
                    </DropdownMenuItem>
                </div>

                <DropdownMenuSeparator className="my-0" />

                {/* ── Account actions ── */}
                <div className="py-2">
                    <DropdownMenuItem asChild className="mx-1 rounded-md gap-2.5 cursor-pointer">
                        <Link href={route('profile.edit')} prefetch>
                            <User className="h-3.5 w-3.5 shrink-0" />
                            <span className="text-sm">Profile settings</span>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="mx-1 rounded-md gap-2.5 cursor-pointer">
                        <Link href={route('billing')} prefetch>
                            <CreditCard className="h-3.5 w-3.5 shrink-0" />
                            <span className="text-sm">Billing</span>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="mx-1 rounded-md gap-2.5 cursor-pointer">
                        <Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            className="flex w-full items-center gap-2.5 text-destructive focus:text-destructive"
                        >
                            <LogOut className="h-3.5 w-3.5 shrink-0" />
                            <span className="text-sm">Log out</span>
                        </Link>
                    </DropdownMenuItem>
                </div>

            </DropdownMenuContent>
        </DropdownMenu>
    );
}

// ── Mobile bottom nav ────────────────────────────────────────────────────────

const BOTTOM_NAV_ITEMS = [
    { href: () => route('dashboard'),            icon: LayoutDashboard, label: 'Dashboard',     pattern: 'dashboard' },
    { href: () => route('spenders.index'),        icon: Users,           label: 'Kids',          pattern: 'spenders.*' },
    { href: () => route('chores.index'),          icon: CheckSquare,     label: 'Chores',        pattern: 'chores.*' },
    { href: () => route('goals.index'),           icon: Target,          label: 'Goals',         pattern: 'goals.*' },
    { href: () => route('pocket-money.release'),  icon: Coins,           label: 'Pocket Money',  pattern: 'pocket-money.*' },
];

function MobileBottomNav() {
    return (
        <nav className="fixed bottom-0 left-0 right-0 z-30 sm:hidden bg-white border-t border-bark-200 pb-safe">
            <div className="flex">
                {BOTTOM_NAV_ITEMS.map(item => {
                    const isActive = route().current(item.pattern);
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.label}
                            href={item.href()}
                            prefetch
                            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-colors min-w-0 ${
                                isActive ? 'text-eucalyptus-500' : 'text-bark-400'
                            }`}
                        >
                            <Icon className="h-5 w-5 shrink-0" />
                            <span className="text-[9px] font-medium leading-tight text-center">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}

// ── Layout ───────────────────────────────────────────────────────────────────

export default function AuthenticatedLayout({
    header,
    children,
}: PropsWithChildren<{ header?: ReactNode }>) {
    const { auth } = usePage().props as any;
    const user = auth.user;
    const isParent: boolean = auth.isParent ?? false;
    const activeFamily = auth.activeFamily ?? null;
    const userFamilies: { id: string; name: string }[] = auth.userFamilies ?? [];
    const viewingAsSpender: { id: string; name: string } | null = auth.viewingAsSpender ?? null;
    const subscription = auth.subscription ?? null;
    const isFrozen = subscription?.frozen ?? false;
    return (
        <div className="min-h-screen bg-bark-100">
            {/* Safe-area colour fill — matches topmost bar background */}
            <div className={`pt-safe ${viewingAsSpender ? 'bg-wattle-400' : isFrozen ? 'bg-redearth-500' : 'bg-white'}`} />

            {isFrozen && !viewingAsSpender && (
                <Link href={route('billing')} className="block bg-redearth-500 text-white px-4 py-2 text-sm font-medium text-center hover:bg-redearth-600 transition-colors">
                    <span className="inline-flex items-center gap-2">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Your trial has expired — subscribe to continue making changes
                    </span>
                </Link>
            )}

            {viewingAsSpender && (
                <div className="bg-wattle-400 text-wattle-900 px-4 py-2 flex items-center justify-between gap-3 text-sm font-medium">
                    <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 shrink-0" />
                        <span><strong>{viewingAsSpender.name}&apos;s view</strong></span>
                    </div>
                    <Link
                        href={route('dashboard.exit-view-as')}
                        method="delete"
                        as="button"
                        className="flex items-center gap-1.5 rounded px-2 py-0.5 hover:bg-wattle-500/30 transition-colors"
                    >
                        <X className="h-3.5 w-3.5" />
                        Exit
                    </Link>
                </div>
            )}
            <nav className="border-b border-bark-200 bg-white">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-14 items-center justify-between">

                        {/* Left: logo + nav links (desktop) */}
                        <div className="flex items-center gap-2">
                            <Link href={route('dashboard')} prefetch className="flex items-center gap-2">
                                <Wallet className="h-5 w-5 text-eucalyptus-400" />
                                <span className="hidden sm:inline font-display text-lg font-semibold text-eucalyptus-400">Quiddo</span>
                            </Link>
                            <Separator orientation="vertical" className="h-5 hidden sm:block" />
                            <div className="hidden sm:flex items-center gap-1">
                                <Button variant="ghost" size="sm" asChild>
                                    <Link href={route('dashboard')} prefetch>
                                        <LayoutDashboard className="h-4 w-4 mr-1.5" />
                                        Dashboard
                                    </Link>
                                </Button>
                                {isParent && (
                                    <>
                                        <Button variant="ghost" size="sm" asChild>
                                            <Link href={route('spenders.index')} prefetch>
                                                <Users className="h-4 w-4 mr-1.5" />
                                                Kids
                                            </Link>
                                        </Button>
                                        <Button variant="ghost" size="sm" asChild>
                                            <Link href={route('chores.index')} prefetch>
                                                <CheckSquare className="h-4 w-4 mr-1.5" />
                                                Chores
                                            </Link>
                                        </Button>
                                        <Button variant="ghost" size="sm" asChild>
                                            <Link href={route('pocket-money.release')} prefetch>
                                                <Coins className="h-4 w-4 mr-1.5" />
                                                Pocket Money
                                            </Link>
                                        </Button>
                                        <Button variant="ghost" size="sm" asChild>
                                            <Link href={route('goals.index')} prefetch>
                                                <Target className="h-4 w-4 mr-1.5" />
                                                Goals
                                            </Link>
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Right: unverified badge + family/account menu */}
                        <div className="flex items-center gap-2">
                        {!user.email_verified_at && (
                            <Link
                                href={route('verification.notice')}
                                className="flex items-center gap-1 text-wattle-600 bg-wattle-50 border border-wattle-200 rounded-full px-2.5 py-1 text-xs font-medium hover:bg-wattle-100 transition-colors"
                                title="Verify your email"
                            >
                                <MailWarning className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Unverified</span>
                            </Link>
                        )}
                        {isParent && activeFamily ? (
                            <FamilyAccountMenu
                                activeFamily={activeFamily}
                                userFamilies={userFamilies}
                                user={user}
                            />
                        ) : (
                            // Fallback for child users — simple log out menu
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="gap-2">
                                        <span className="text-sm">{user.display_name ?? user.name}</span>
                                        <ChevronDown className="h-3.5 w-3.5 text-bark-500" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuItem asChild>
                                        <Link href={route('profile.edit')} prefetch className="flex items-center gap-2">
                                            <User className="h-4 w-4" />
                                            Profile
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href={route('billing')} prefetch className="flex items-center gap-2">
                                            <CreditCard className="h-4 w-4" />
                                            Billing
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                        <Link
                                            href={route('logout')}
                                            method="post"
                                            as="button"
                                            className="flex w-full items-center gap-2 text-destructive focus:text-destructive"
                                        >
                                            <LogOut className="h-4 w-4" />
                                            Log out
                                        </Link>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                        </div>

                    </div>
                </div>
            </nav>

            {/* Mobile bottom nav */}
            {isParent && <MobileBottomNav />}

            {header && (
                <div className="border-b border-bark-200 bg-white">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
                        {header}
                    </div>
                </div>
            )}

            <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 pb-24 sm:pb-8">
                {children}
            </main>
        </div>
    );
}
