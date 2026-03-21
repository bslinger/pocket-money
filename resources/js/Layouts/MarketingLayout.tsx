import { Link } from '@inertiajs/react';
import { PropsWithChildren } from 'react';

interface Props {
  canLogin: boolean;
  canRegister: boolean;
}

export default function MarketingLayout({ canLogin, canRegister, children }: PropsWithChildren<Props>) {
  return (
    <div className="min-h-screen flex flex-col bg-surface text-heading">
      {/* Nav */}
      <header className="border-b border-stone-200">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
          <Link href={route('home')} className="font-serif text-2xl font-bold text-heading tracking-tight">
            Quiddo
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-stone-600">
            <Link href={route('marketing.how')} className="hover:text-heading transition-colors">How It Works</Link>
            <Link href={route('marketing.pricing')} className="hover:text-heading transition-colors">Pricing</Link>
          </nav>
          <div className="flex items-center gap-3">
            {canLogin && (
              <Link href={route('login')} className="text-sm font-medium text-stone-600 hover:text-heading transition-colors">
                Log in
              </Link>
            )}
            {canRegister && (
              <Link
                href={route('register')}
                className="bg-brand text-white text-sm font-semibold px-4 py-2 rounded-full hover:bg-brand-emphasis transition-colors"
              >
                Start Free
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 py-8">
        <div className="mx-auto max-w-6xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-stone-500">
          <p>© {new Date().getFullYear()} Quiddo. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-stone-700 transition-colors">Privacy</a>
            <a href="#" className="hover:text-stone-700 transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
