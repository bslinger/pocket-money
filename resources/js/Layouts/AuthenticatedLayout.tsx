import { Link, router, usePage } from '@inertiajs/react';
import { PropsWithChildren, ReactNode, useState } from 'react';
import { Button } from '@/Components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import { Separator } from '@/Components/ui/separator';
import { Check, ChevronDown, CheckSquare, Eye, LayoutDashboard, LogOut, Menu, PlusCircle, Settings2, Target, User, Wallet, Coins, Users, X } from 'lucide-react';

// ── Helpers ──────────────────────────────────────────────────────────────────

function familyInitial(name: string) {
    return name.trim()[0]?.toUpperCase() ?? '?';
}

// Deterministic accent colour from family name for the letter avatar
const AVATAR_COLOURS = [
    'bg-violet-600', 'bg-blue-600', 'bg-emerald-600',
    'bg-rose-600',   'bg-amber-600', 'bg-cyan-600',
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
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-72 p-0" sideOffset={8}>

                {/* ── Family card ── */}
                <div className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                        <FamilyAvatar name={activeFamily.name} size="lg" />
                        <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">{activeFamily.name}</p>
                            <p className="text-xs text-muted-foreground">{memberSummary}</p>
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
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
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
                            {f.id === activeFamily.id && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                        </DropdownMenuItem>
                    ))}

                    <DropdownMenuItem asChild className="mx-1 rounded-md gap-2.5 text-primary hover:text-primary cursor-pointer">
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
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [drawerVisible, setDrawerVisible] = useState(false);

    function openMenu() {
        setMobileMenuOpen(true);
        // Two rAFs: first ensures the element is mounted, second ensures it's been painted
        requestAnimationFrame(() => requestAnimationFrame(() => setDrawerVisible(true)));
    }

    function closeMenu() {
        setDrawerVisible(false);
    }

    function handleDrawerTransitionEnd() {
        if (!drawerVisible) setMobileMenuOpen(false);
    }

    return (
        <div className="min-h-screen bg-background">
            {viewingAsSpender && (
                <div className="bg-amber-500 text-amber-950 px-4 py-2 flex items-center justify-between gap-3 text-sm font-medium">
                    <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 shrink-0" />
                        <span><strong>{viewingAsSpender.name}&apos;s view</strong></span>
                    </div>
                    <Link
                        href={route('dashboard.exit-view-as')}
                        method="delete"
                        as="button"
                        className="flex items-center gap-1.5 rounded px-2 py-0.5 hover:bg-amber-600/30 transition-colors"
                    >
                        <X className="h-3.5 w-3.5" />
                        Exit
                    </Link>
                </div>
            )}
            <nav className="border-b bg-card">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-14 items-center justify-between">

                        {/* Left: hamburger (mobile) + logo + nav links (desktop) */}
                        <div className="flex items-center gap-2">
                            {/* Hamburger — mobile only */}
                            <Button
                                variant="ghost"
                                size="sm"
                                className="sm:hidden -ml-1"
                                onClick={openMenu}
                                aria-label="Toggle menu"
                            >
                                <Menu className="h-5 w-5" />
                            </Button>

                            <Link href={route('dashboard')} prefetch className="flex items-center gap-2 font-semibold text-foreground">
                                <Wallet className="h-5 w-5 text-primary" />
                                <span className="hidden sm:inline">Pocket Money</span>
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

                        {/* Right: family/account menu */}
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
                                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuItem asChild>
                                        <Link href={route('profile.edit')} prefetch className="flex items-center gap-2">
                                            <User className="h-4 w-4" />
                                            Profile
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
            </nav>

            {/* Mobile drawer overlay */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 z-40 sm:hidden"
                    onClick={closeMenu}
                >
                    {/* Backdrop */}
                    <div className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${drawerVisible ? 'opacity-100' : 'opacity-0'}`} />

                    {/* Drawer panel */}
                    <div
                        className={`absolute top-0 left-0 h-full w-72 bg-card shadow-xl flex flex-col transition-transform duration-300 ease-in-out ${drawerVisible ? 'translate-x-0' : '-translate-x-full'}`}
                        onClick={e => e.stopPropagation()}
                        onTransitionEnd={handleDrawerTransitionEnd}
                    >
                        {/* Drawer header */}
                        <div className="flex items-center justify-between px-4 h-14 border-b shrink-0">
                            <Link
                                href={route('dashboard')}
                                prefetch
                                className="flex items-center gap-2 font-semibold text-foreground"
                                onClick={closeMenu}
                            >
                                <Wallet className="h-5 w-5 text-primary" />
                                Pocket Money
                            </Link>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={closeMenu}
                                aria-label="Close menu"
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

                        {/* Nav links */}
                        <nav className="flex flex-col gap-1 p-3">
                            <Button variant="ghost" size="sm" className="justify-start" asChild onClick={closeMenu}>
                                <Link href={route('dashboard')} prefetch>
                                    <LayoutDashboard className="h-4 w-4 mr-2" />
                                    Dashboard
                                </Link>
                            </Button>
                            {isParent && (
                                <>
                                    <Button variant="ghost" size="sm" className="justify-start" asChild onClick={closeMenu}>
                                        <Link href={route('spenders.index')} prefetch>
                                            <Users className="h-4 w-4 mr-2" />
                                            Kids
                                        </Link>
                                    </Button>
                                    <Button variant="ghost" size="sm" className="justify-start" asChild onClick={closeMenu}>
                                        <Link href={route('chores.index')} prefetch>
                                            <CheckSquare className="h-4 w-4 mr-2" />
                                            Chores
                                        </Link>
                                    </Button>
                                    <Button variant="ghost" size="sm" className="justify-start" asChild onClick={closeMenu}>
                                        <Link href={route('pocket-money.release')} prefetch>
                                            <Coins className="h-4 w-4 mr-2" />
                                            Pocket Money
                                        </Link>
                                    </Button>
                                    <Button variant="ghost" size="sm" className="justify-start" asChild onClick={closeMenu}>
                                        <Link href={route('goals.index')} prefetch>
                                            <Target className="h-4 w-4 mr-2" />
                                            Goals
                                        </Link>
                                    </Button>
                                </>
                            )}
                        </nav>
                    </div>
                </div>
            )}

            {header && (
                <div className="border-b bg-card">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
                        {header}
                    </div>
                </div>
            )}

            <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>
        </div>
    );
}
