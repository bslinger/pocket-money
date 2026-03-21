import { Link } from '@inertiajs/react';
import { PropsWithChildren } from 'react';

interface Props {
  canLogin: boolean;
  canRegister: boolean;
}

export default function MarketingLayout({ canLogin, canRegister, children }: PropsWithChildren<Props>) {
  return (
    <div className="min-h-screen flex flex-col bg-bark-50 text-bark-700">
      {/* Nav */}
      <header className="bg-white border-b border-bark-200">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
          <Link href={route('home')} className="font-display text-2xl font-bold text-eucalyptus-400 tracking-tight">
            Quiddo
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-bark-600">
            <Link href={route('marketing.how')} className="hover:text-bark-700 transition-colors">How It Works</Link>
            <Link href={route('marketing.pricing')} className="hover:text-bark-700 transition-colors">Pricing</Link>
          </nav>
          <div className="flex items-center gap-3">
            {canLogin && (
              <Link href={route('login')} className="text-sm font-medium text-bark-600 hover:text-bark-700 transition-colors">
                Log in
              </Link>
            )}
            {canRegister && (
              <Link
                href={route('register')}
                className="bg-eucalyptus-400 text-white text-sm font-semibold px-4 py-2 rounded-pill hover:bg-eucalyptus-500 transition-colors"
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
      <footer className="bg-eucalyptus-600 py-8">
        <div className="mx-auto max-w-6xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          <p className="font-display text-xl font-semibold text-wattle-300">Quiddo</p>
          <p className="text-eucalyptus-100">© {new Date().getFullYear()} Quiddo. All rights reserved.</p>
          <div className="flex gap-6 text-eucalyptus-100">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
