import { Link } from '@inertiajs/react';
import { PropsWithChildren } from 'react';

interface Props {
  canLogin: boolean;
  canRegister: boolean;
}

export default function MarketingLayout({ canLogin, canRegister, children }: PropsWithChildren<Props>) {
  return (
    <div className="min-h-screen flex flex-col bg-bark-50 text-bark-700">
      {/* Sticky Nav */}
      <header className="bg-white border-b border-bark-200 sticky top-0 z-50 shadow-sm">
        <div className="mx-auto max-w-6xl px-6 h-[60px] flex items-center justify-between">
          <Link href={route('home')} className="font-display text-[22px] font-bold text-eucalyptus-400 tracking-tight">
            Quiddo
          </Link>
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-bark-600">
            <a href="#how" className="hover:text-eucalyptus-400 transition-colors">How it works</a>
            <a href="#pricing" className="hover:text-eucalyptus-400 transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-eucalyptus-400 transition-colors">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            {canLogin && (
              <Link
                href={route('login')}
                className="text-sm font-semibold text-bark-700 border border-bark-300 px-5 py-2 rounded-full hover:border-eucalyptus-400 hover:text-eucalyptus-400 transition-colors"
              >
                Log in
              </Link>
            )}
            {canRegister && (
              <Link
                href={route('register')}
                className="bg-eucalyptus-400 text-white text-sm font-semibold px-5 py-2 rounded-full hover:bg-eucalyptus-500 transition-colors"
              >
                Start free trial
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
      <footer className="bg-eucalyptus-600 text-white/55 pt-14 pb-8">
        <div className="mx-auto max-w-6xl px-6">
          {/* 4-col top */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            {/* Col 1 — brand */}
            <div>
              <p className="font-display text-2xl font-bold text-wattle-300 mb-3">Quiddo</p>
              <p className="text-sm leading-relaxed mb-5">
                Pocket money, sorted. The app for Aussie families who want their kids to earn, save, and learn — without the spreadsheets.
              </p>
              <div className="flex gap-2.5">
                <button className="bg-white/10 border border-white/20 rounded-lg px-3.5 py-2 text-xs font-semibold text-white/80 flex items-center gap-1.5 hover:bg-white/20 transition-colors">
                  🍎 App Store
                </button>
                <button className="bg-white/10 border border-white/20 rounded-lg px-3.5 py-2 text-xs font-semibold text-white/80 flex items-center gap-1.5 hover:bg-white/20 transition-colors">
                  ▶ Google Play
                </button>
              </div>
            </div>

            {/* Col 2 */}
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-[0.6px] text-white/40 mb-4">Get to know us</h4>
              <ul className="flex flex-col gap-2.5">
                {['About', 'Blog', 'Careers', 'Contact'].map(label => (
                  <li key={label}>
                    <a href="#" className="text-sm text-white/55 hover:text-wattle-300 transition-colors">{label}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 3 */}
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-[0.6px] text-white/40 mb-4">Let us help you</h4>
              <ul className="flex flex-col gap-2.5">
                {['Help centre', 'Getting started', 'FAQ', 'Contact support'].map(label => (
                  <li key={label}>
                    <a href="#" className="text-sm text-white/55 hover:text-wattle-300 transition-colors">{label}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 4 */}
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-[0.6px] text-white/40 mb-4">The app</h4>
              <ul className="flex flex-col gap-2.5">
                {['How it works', 'Pricing', 'iOS App', 'Android App'].map(label => (
                  <li key={label}>
                    <a href="#" className="text-sm text-white/55 hover:text-wattle-300 transition-colors">{label}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-white/40">
            <span>© 2026 Quiddo Pty Ltd · quiddo.com.au</span>
            <div className="flex gap-5">
              <a href="#" className="hover:text-white/70 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white/70 transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white/70 transition-colors">Accessibility</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
