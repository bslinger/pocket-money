import MarketingLayout from '@/Layouts/MarketingLayout';
import { Head, Link } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import { useState, FormEvent } from 'react';

interface Props {
  canLogin: boolean;
  canRegister: boolean;
}

// ── Phone mockup ──────────────────────────────────────────────────────────────

// Tiny inline SVG icons matching the Lucide icons used in the real app nav
function IconGrid() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[13px] h-[13px]">
      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}
function IconUsers() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[13px] h-[13px]">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
function IconCheckSquare() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[13px] h-[13px]">
      <polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  );
}
function IconTarget() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[13px] h-[13px]">
      <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
    </svg>
  );
}
function IconCoins() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[13px] h-[13px]">
      <circle cx="8" cy="8" r="6" /><path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
      <path d="M7 6h1v4" /><path d="m16.71 13.88.7.71-2.82 2.82" />
    </svg>
  );
}

function PhoneMockup() {
  const kids = [
    { initial: 'E', name: 'Emma',    bal: '$58.50', goal: 'Roller skates', goalAmt: '$12.50', goalTotal: '$45', bar: 28, color: '#8b5cf6' },
    { initial: 'J', name: 'Jack',    bal: '$43.00', goal: 'LEGO set',      goalAmt: '$5.00',  goalTotal: '$30', bar: 17, color: '#0ea5e9' },
    { initial: 'T', name: 'Theodore',bal: '$27.80', goal: 'Nintendo game', goalAmt: '$27.80', goalTotal: '$60', bar: 46, color: '#10b981' },
  ];

  return (
    <div className="relative flex justify-center">
      {/* Floating badge top-left */}
      <div className="absolute top-[60px] left-[-20px] bg-white rounded-[12px] px-3.5 py-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.12)] border border-bark-200 whitespace-nowrap z-10">
        <div className="text-[10px] text-bark-500 mb-0.5">Paid this month</div>
        <div className="font-display text-lg font-bold text-wattle-400">$86.00</div>
      </div>

      {/* Phone frame */}
      <div className="w-[260px] bg-[#1C1A18] rounded-[44px] p-2.5 shadow-[0_32px_80px_rgba(0,0,0,0.25)]">
        <div className="bg-bark-100 rounded-[36px] overflow-hidden h-[500px] flex flex-col">
          {/* Notch */}
          <div className="bg-[#1C1A18] h-[26px] flex items-center justify-center flex-shrink-0 rounded-t-[36px]">
            <div className="bg-[#333] w-[80px] h-[14px] rounded-full" />
          </div>

          {/* App nav bar — matches AuthenticatedLayout */}
          <div className="bg-white border-b border-bark-200 px-3 flex items-center justify-between h-[36px] flex-shrink-0">
            {/* Left: wallet icon + Quiddo */}
            <div className="flex items-center gap-1.5">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[13px] h-[13px] text-eucalyptus-400">
                <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" /><path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
              </svg>
              <span className="font-display text-[13px] font-semibold text-eucalyptus-400">Quiddo</span>
            </div>
            {/* Right: family avatar + name + chevron (FamilyAccountMenu) */}
            <div className="flex items-center gap-1">
              <div className="w-[18px] h-[18px] rounded-[4px] bg-eucalyptus-400 flex items-center justify-center text-[8px] font-bold text-white">B</div>
              <span className="text-[9px] font-medium text-bark-600">Ben's Family</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-[9px] h-[9px] text-bark-500">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>

          {/* Screen content — bg-bark-100 */}
          <div className="flex-1 overflow-hidden px-2.5 py-2 flex flex-col gap-2">

            {/* Kids section — comes first in the real app */}
            <div className="text-[8px] font-semibold text-bark-500 uppercase tracking-wide">Kids</div>
            <div className="flex gap-1.5 overflow-hidden">
              {kids.map(kid => (
                <div key={kid.name} className="bg-white rounded-[10px] border border-bark-200 flex flex-col overflow-hidden flex-1 min-w-0">
                  {/* Avatar + name */}
                  <div className="p-1.5 flex items-center gap-1">
                    <div
                      className="w-[20px] h-[20px] rounded-full flex items-center justify-center text-[8px] font-bold text-white flex-shrink-0"
                      style={{ backgroundColor: kid.color }}
                    >
                      {kid.initial}
                    </div>
                    <span className="text-[9px] font-semibold text-bark-700 truncate">{kid.name}</span>
                  </div>
                  {/* Balance */}
                  <div className="px-1.5 font-bold text-[13px] text-bark-700 tabular-nums">{kid.bal}</div>
                  {/* Goal */}
                  <div className="px-1.5 pt-1 pb-1.5 flex-1">
                    <div className="text-[7px] text-bark-500 truncate">{kid.goal}</div>
                    <div className="flex justify-between text-[7px] mt-0.5">
                      <span className="text-wattle-600 font-medium">{kid.goalAmt}</span>
                      <span className="text-bark-400">{kid.goalTotal}</span>
                    </div>
                    <div className="w-full bg-bark-200 rounded-full h-[3px] mt-0.5 overflow-hidden">
                      <div className="bg-wattle-400 h-full rounded-full" style={{ width: `${kid.bar}%` }} />
                    </div>
                  </div>
                  {/* Spend / Add buttons */}
                  <div className="flex border-t border-bark-200">
                    <div className="flex-1 flex items-center justify-center gap-0.5 py-1 text-redearth-400">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-[8px] h-[8px]"><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      <span className="text-[7px] font-medium">Spend</span>
                    </div>
                    <div className="w-px bg-bark-200" />
                    <div className="flex-1 flex items-center justify-center gap-0.5 py-1 text-gumleaf-400">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-[8px] h-[8px]"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      <span className="text-[7px] font-medium">Add</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Stat cards — below kids, matching real app order */}
            <div className="grid grid-cols-2 gap-1.5">
              <div className="bg-white rounded-lg px-2 py-1.5 border border-bark-200">
                <div className="text-[7px] text-bark-500 uppercase tracking-[0.4px]">Family Balance</div>
                <div className="font-bold text-[14px] text-bark-700 tabular-nums mt-0.5">$129.30</div>
              </div>
              <div className="bg-white rounded-lg px-2 py-1.5 border border-bark-200">
                <div className="text-[7px] text-bark-500 uppercase tracking-[0.4px]">Paid This Month</div>
                <div className="font-bold text-[14px] text-bark-700 tabular-nums mt-0.5">$86.00</div>
              </div>
            </div>

            {/* Pending approvals card — border-wattle-200, matching real app */}
            <div className="bg-white rounded-[10px] border border-wattle-200 overflow-hidden">
              <div className="px-2.5 py-1.5 flex items-center justify-between border-b border-bark-200">
                <div className="flex items-center gap-1">
                  <span className="text-[9px] font-semibold text-bark-700">Needs your approval</span>
                  <span className="text-[8px] font-bold px-1 py-px rounded bg-wattle-50 text-wattle-600 border border-wattle-200">2</span>
                </div>
                <span className="text-[8px] font-semibold border border-gumleaf-200 text-gumleaf-600 rounded px-1.5 py-0.5">Approve all</span>
              </div>
              {[
                { initial: 'T', name: 'Theodore', chore: '🍽️ Wash the dishes', color: '#10b981' },
                { initial: 'E', name: 'Emma',     chore: '🧹 Vacuum lounge',    color: '#8b5cf6' },
              ].map((row, i) => (
                <div key={row.name} className={`flex items-center gap-1.5 px-2.5 py-1.5 ${i === 0 ? 'border-b border-bark-200' : ''}`}>
                  <div
                    className="w-[18px] h-[18px] rounded-full flex items-center justify-center text-[7px] font-bold text-white flex-shrink-0"
                    style={{ backgroundColor: row.color }}
                  >
                    {row.initial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[8px] font-medium text-bark-700 truncate">{row.chore}</div>
                    <div className="text-[7px] text-bark-500">{row.name}</div>
                  </div>
                  {/* Outlined check/X buttons matching real app */}
                  <div className="w-[18px] h-[18px] rounded border border-gumleaf-200 flex items-center justify-center text-[9px] text-gumleaf-600 flex-shrink-0">✓</div>
                  <div className="w-[18px] h-[18px] rounded border border-redearth-200 flex items-center justify-center text-[9px] text-redearth-600 flex-shrink-0">✕</div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom nav — Dashboard | Kids | Chores | Goals | Pocket Money */}
          <div className="bg-white border-t border-bark-200 flex flex-shrink-0 py-1.5">
            {[
              { Icon: IconGrid,        label: 'Dashboard',    active: true  },
              { Icon: IconUsers,       label: 'Kids',         active: false },
              { Icon: IconCheckSquare, label: 'Chores',       active: false },
              { Icon: IconTarget,      label: 'Goals',        active: false },
              { Icon: IconCoins,       label: 'Pocket Money', active: false },
            ].map(tab => (
              <div
                key={tab.label}
                className={`flex-1 flex flex-col items-center gap-0.5 text-[6px] font-medium ${tab.active ? 'text-eucalyptus-500' : 'text-bark-400'}`}
              >
                <tab.Icon />
                <span className="leading-tight text-center">{tab.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating badge bottom-right */}
      <div className="absolute bottom-[80px] right-[-20px] bg-white rounded-[12px] px-3.5 py-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.12)] border border-bark-200 whitespace-nowrap z-10">
        <div className="text-[10px] text-bark-500 mb-0.5">Emma just earned</div>
        <div className="font-display text-lg font-bold text-gumleaf-400">+$1.50 ✓</div>
      </div>
    </div>
  );
}

// ── Why features data ─────────────────────────────────────────────────────────

const WHY_FEATURES = [
  { emoji: '💰', title: 'Track any currency', desc: 'Real dollars, stars, coins, or your own family currency. Works for every age and stage.' },
  { emoji: '🧹', title: 'Chore approval loop', desc: 'Kids claim chores, you approve with one tap. Balance updates instantly — no cash needed.' },
  { emoji: '🎯', title: 'Savings goals', desc: 'Kids set goals and watch progress bars fill up. More motivating than any piggy bank.' },
  { emoji: '📋', title: 'Responsibilities vs chores', desc: 'Separate "must do" responsibilities from paid chores. Pocket money only releases when responsibilities are done.' },
  { emoji: '👨‍👩‍👧‍👦', title: 'Up to 12 kids', desc: 'One family plan covers everyone — no per-child fees. Big families finally get a fair deal.' },
  { emoji: '⚡', title: 'Auto pocket money', desc: 'Set it once. Quiddo adds pocket money every Sunday automatically. Never forget again.' },
];

// ── How steps data ────────────────────────────────────────────────────────────

const HOW_STEPS = [
  { num: 1, title: 'Create your family', desc: 'Sign up, name your family, choose your currency. Add up to 12 kids with avatars and ages.' },
  { num: 2, title: 'Set up pocket money', desc: 'Choose an amount and a day. Quiddo credits each child\'s balance automatically every week.' },
  { num: 3, title: 'Add chores', desc: 'Create recurring chores with values. Kids claim them in their view, you approve with one tap.' },
  { num: 4, title: 'Watch them save', desc: 'Kids set goals and track progress. When they want to spend, you log it and the balance updates.' },
];

// ── FAQ data ──────────────────────────────────────────────────────────────────

const FAQ_ITEMS = [
  {
    q: 'How does Quiddo work?',
    a: "Quiddo is a virtual ledger — it tracks what your kids have earned and spent without holding any real money. You pay pocket money and chore rewards in cash as you normally would, and Quiddo records the balance. Think of it as a digital version of the running tally you used to keep in your head.",
  },
  {
    q: 'Do my kids need their own device?',
    a: "Not necessarily. Parents manage everything from the parent view on their own device. Kids can have their own login to see their balance, goals, and chores — but it's optional, especially for younger children. The parent view works perfectly well without kids having their own device.",
  },
  {
    q: 'Can both parents use Quiddo?',
    a: "Yes — you can invite your partner, co-parent, or another carer to your family. All adults see the same balances and can approve chores from their own devices. This works well for separated families too, where both households want to stay in sync.",
  },
  {
    q: "What's the difference between chores and responsibilities?",
    a: "Chores earn money or points directly — the balance goes up when the chore is approved. Responsibilities are things that must be done before that week's pocket money is released (making the bed, packing the school bag). They don't earn directly — they're the price of admission. You set what percentage needs to be completed before the weekly allowance unlocks.",
  },
  {
    q: 'Does Quiddo work with real dollars and points?',
    a: "Both. You can track in Australian dollars, or create your own family currency — coins, stars, \"Smith Bucks\", whatever works for your family. Younger kids often respond better to points than money concepts. You can even set different currencies for different children if needed.",
  },
  {
    q: 'Is there a limit to how many children I can add?',
    a: "The free plan supports 1 child. Paid plans (monthly and annual) support up to 12 children on a single family subscription. No per-child fees — ever.",
  },
  {
    q: 'What happens after my 30-day trial?',
    a: "At the end of your trial you'll be asked to choose a plan. If you don't subscribe, your account moves to the free tier (1 child, core features). Your data is never deleted. No credit card is required to start the trial.",
  },
  {
    q: 'Is Quiddo available in Australia?',
    a: "Quiddo is built specifically for Australian families. It supports Australian dollars natively, and is designed around how Aussie families actually handle pocket money — with cash, without debit cards, and with a healthy dose of \"you've got to earn it first\".",
  },
];

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Home({ canLogin, canRegister }: Props) {
  const [email, setEmail] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  function handleEmailSubmit(e: FormEvent) {
    e.preventDefault();
    const dest = email ? `/register?email=${encodeURIComponent(email)}` : route('register');
    router.visit(dest);
  }

  return (
    <MarketingLayout canLogin={canLogin} canRegister={canRegister}>
      <Head title="Quiddo — Pocket money, sorted." />

      {/* ── HERO ── */}
      <section className="bg-bark-50 px-[5%]">
        <div className="mx-auto max-w-6xl grid grid-cols-1 md:grid-cols-2 min-h-[calc(100vh-60px)] items-center gap-[60px] py-[60px]">
          {/* Phone mockup — hidden on mobile */}
          <div className="hidden md:flex order-first md:order-none">
            <PhoneMockup />
          </div>

          {/* Hero text */}
          <div>
            <div className="inline-flex items-center gap-1.5 bg-eucalyptus-50 text-eucalyptus-600 text-xs font-semibold px-3.5 py-1.5 rounded-full mb-5 border border-eucalyptus-100">
              🇦🇺 Made for Aussie families
            </div>
            <h1 className="font-display text-[52px] font-bold leading-[1.1] tracking-tight text-bark-700 mb-[18px]">
              Your kids.<br />Their money.<br /><em className="text-eucalyptus-400 not-italic">All sorted.</em>
            </h1>
            <p className="text-[17px] text-bark-500 leading-relaxed mb-8 max-w-[420px]">
              Track what your kids earn, spend, and save — without the forgotten IOUs, the Sunday cash scramble, or the spreadsheet you abandoned after a week.
            </p>

            <form className="flex flex-col gap-3 max-w-[400px]" onSubmit={handleEmailSubmit}>
              <input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="px-4 py-3.5 border-[1.5px] border-bark-200 rounded-[10px] text-[15px] text-bark-700 bg-white placeholder-bark-400 focus:outline-none focus:border-eucalyptus-400 transition-colors font-body"
              />
              <button
                type="submit"
                className="bg-eucalyptus-400 text-white py-4 rounded-[10px] text-[15px] font-semibold hover:bg-eucalyptus-500 transition-colors text-center"
              >
                Start free — 30 days, no card needed
              </button>
              <p className="text-xs text-bark-400 text-center">
                By signing up you agree to our{' '}
                <a href="#" className="text-eucalyptus-400 hover:underline">Terms</a>
                {' '}and{' '}
                <a href="#" className="text-eucalyptus-400 hover:underline">Privacy Policy</a>
              </p>
            </form>

            {canLogin && (
              <p className="text-sm text-bark-500 mt-2 text-center max-w-[400px]">
                Already have an account?{' '}
                <Link href={route('login')} className="text-eucalyptus-400 font-semibold hover:underline">Log in</Link>
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ── WHAT IS QUIDDO ── */}
      <section className="bg-white border-t border-bark-200 py-[72px] px-[5%] text-center">
        <div className="max-w-[680px] mx-auto">
          <h2 className="font-display text-[34px] font-semibold text-bark-700 mb-5">What is Quiddo?</h2>
          <p className="text-base text-bark-500 leading-[1.8] mb-4">
            Quiddo is a pocket money app built for Australian families who pay their kids in cash. It's not a bank, not a debit card, not a fintech product. It's a simple ledger that tracks what each child has earned, spent, and saved — so you're always in sync and nobody's arguing about how much is owed.
          </p>
          <p className="text-base text-bark-500 leading-[1.8] mb-4">
            As a parent, <strong className="text-bark-600">you stay in control</strong> — you own the money, you approve the chores, you release the pocket money. Your kids get a view of their own balance and goals that makes saving feel real. No bank account required. No monthly fees per child. No surprises.
          </p>
          <p className="text-base text-bark-500 leading-[1.8]">
            Works for real dollars, points, stars, or whatever currency your family uses. Up to <strong className="text-bark-600">12 kids on one family plan.</strong>
          </p>
        </div>
      </section>

      {/* ── WHY USE QUIDDO ── */}
      <section className="bg-bark-50 py-[72px] px-[5%] text-center">
        <div className="max-w-[560px] mx-auto mb-14">
          <h2 className="font-display text-[34px] font-semibold text-bark-700 mb-4">Why use Quiddo?</h2>
          <p className="text-base text-bark-500">Everything a modern Australian family needs. Nothing you don't.</p>
        </div>
        <div
          className="max-w-[660px] mx-auto bg-white rounded-[14px] overflow-hidden"
          style={{ border: '1px solid #EBE4D6' }}
        >
          <div className="grid grid-cols-2">
            {WHY_FEATURES.map((feat, i) => {
              const isRightCol = i % 2 === 1;
              const isLastRow = i >= WHY_FEATURES.length - 2;
              return (
                <div
                  key={feat.title}
                  className="px-7 py-8 text-center"
                  style={{
                    borderBottom: isLastRow ? 'none' : '1px solid #EBE4D6',
                    borderRight: isRightCol ? 'none' : '1px solid #EBE4D6',
                  }}
                >
                  <div className="w-[52px] h-[52px] rounded-[14px] bg-eucalyptus-50 flex items-center justify-center text-2xl mx-auto mb-3.5">
                    {feat.emoji}
                  </div>
                  <h3 className="font-display text-[17px] font-semibold text-bark-700 mb-2">{feat.title}</h3>
                  <p className="text-sm text-bark-500 leading-relaxed">{feat.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" className="bg-white border-t border-bark-200 py-[72px] px-[5%] text-center">
        <div className="max-w-[900px] mx-auto">
          <h2 className="font-display text-[34px] font-semibold text-bark-700 mb-2">How to get started</h2>
          <p className="text-base text-bark-500 mb-12">Up and running in under 5 minutes.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {HOW_STEPS.map(step => (
              <div key={step.num} className="text-center">
                <div className="w-11 h-11 rounded-full bg-eucalyptus-400 text-white font-display text-lg font-bold flex items-center justify-center mx-auto mb-3.5">
                  {step.num}
                </div>
                <h3 className="font-display text-base font-semibold text-bark-700 mb-2">{step.title}</h3>
                <p className="text-[13px] text-bark-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>

          {canRegister && (
            <Link
              href={route('register')}
              className="inline-flex items-center gap-2 bg-eucalyptus-400 text-white px-10 py-[18px] rounded-full text-base font-semibold hover:bg-eucalyptus-500 transition-colors"
            >
              Start your free 30-day trial →
            </Link>
          )}
        </div>
      </section>

      {/* ── WHAT YOU GET ── */}
      <section className="bg-eucalyptus-50 border-t border-eucalyptus-100 border-b border-b-eucalyptus-100 py-[72px] px-[5%]">
        <div className="max-w-[900px] mx-auto">
          <h2 className="font-display text-[34px] font-semibold text-bark-700 text-center mb-10">What you get</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-sm font-bold text-eucalyptus-600 uppercase tracking-[0.6px] mb-4">Included in every plan</h3>
              <ul className="flex flex-col gap-2.5">
                {[
                  'Up to 12 child profiles per family',
                  'Balance tracking for each child',
                  'Recurring and one-off chores',
                  'Chore approval workflow',
                  'Savings goals with progress tracking',
                  'Responsibilities vs paid chores split',
                  'Custom family currency name',
                  'Works on iOS and Android',
                ].map(item => (
                  <li key={item} className="flex gap-2.5 text-sm text-bark-600 items-start">
                    <span className="w-1.5 h-1.5 rounded-full bg-eucalyptus-400 flex-shrink-0 mt-[7px]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-bold text-eucalyptus-600 uppercase tracking-[0.6px] mb-4">How to get started</h3>
              <ul className="flex flex-col gap-2.5">
                {[
                  'Sign up with your email — no credit card needed for trial',
                  'Set up your family name and currency type',
                  'Add your children and their pocket money amounts',
                  'Create your first chore and watch it go',
                  'Download the app for iOS or Android',
                  'Invite your partner or co-parent to join',
                ].map(item => (
                  <li key={item} className="flex gap-2.5 text-sm text-bark-600 items-start">
                    <span className="w-1.5 h-1.5 rounded-full bg-eucalyptus-400 flex-shrink-0 mt-[7px]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="bg-bark-50 border-t border-bark-200 py-[72px] px-[5%] text-center">
        <div className="max-w-[900px] mx-auto">
          <h2 className="font-display text-[34px] font-semibold text-bark-700 mb-2">Simple pricing</h2>
          <p className="text-[15px] text-bark-500 mb-10">Per family. Not per child. Up to 12 kids on every paid plan.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-left">
            {/* Free */}
            <div className="bg-white rounded-[14px] p-7 border-[1.5px] border-bark-200">
              <div className="text-[11px] font-bold uppercase tracking-[0.6px] text-bark-400 mb-2">Free</div>
              <div className="font-display text-[38px] font-bold text-bark-700 leading-none">
                $0<span className="text-[13px] font-normal text-bark-400">/month</span>
              </div>
              <p className="text-[13px] text-bark-500 mt-2.5 mb-5 leading-snug">Get started with 1 child and the core features.</p>
              <div className="flex flex-col gap-2 mb-6">
                {['1 child profile', 'Balance tracking', 'Earn & spend log', 'Parent dashboard'].map(f => (
                  <div key={f} className="text-[13px] text-bark-600 flex gap-2 items-start">
                    <span className="text-gumleaf-400 font-bold flex-shrink-0 mt-px">✓</span>{f}
                  </div>
                ))}
              </div>
              {canRegister && (
                <Link
                  href={route('register')}
                  className="block w-full py-2.5 rounded-full text-sm font-semibold text-center border-[1.5px] border-bark-200 text-bark-700 hover:border-bark-300 transition-colors"
                >
                  Get started free
                </Link>
              )}
            </div>

            {/* Annual — featured */}
            <div className="bg-eucalyptus-600 rounded-[14px] p-7 border-[1.5px] border-eucalyptus-600 text-white">
              <div className="inline-block bg-wattle-400 text-bark-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full mb-3">Most popular</div>
              <div className="text-[11px] font-bold uppercase tracking-[0.6px] text-white/50 mb-2">Annual</div>
              <div className="font-display text-[38px] font-bold text-wattle-300 leading-none">
                $15<span className="text-[13px] font-normal text-white/40">/year</span>
              </div>
              <p className="text-[13px] text-white/55 mt-2.5 mb-5 leading-snug">Best value — save 37% vs monthly. The full Quiddo for the whole family.</p>
              <div className="flex flex-col gap-2 mb-6">
                {['Up to 12 children', 'Recurring chores + approval', 'Savings goals', 'Auto pocket money', 'Kid-facing view', 'Multi-parent access', 'Responsibilities mode'].map(f => (
                  <div key={f} className="text-[13px] text-white/75 flex gap-2 items-start">
                    <span className="text-wattle-300 font-bold flex-shrink-0 mt-px">✓</span>{f}
                  </div>
                ))}
              </div>
              {canRegister && (
                <Link
                  href={route('register')}
                  className="block w-full py-2.5 rounded-full text-sm font-semibold text-center bg-wattle-400 text-bark-700 hover:bg-wattle-300 transition-colors"
                >
                  Start 14-day free trial
                </Link>
              )}
            </div>

            {/* Monthly */}
            <div className="bg-white rounded-[14px] p-7 border-[1.5px] border-bark-200">
              <div className="text-[11px] font-bold uppercase tracking-[0.6px] text-bark-400 mb-2">Monthly</div>
              <div className="font-display text-[38px] font-bold text-bark-700 leading-none">
                $1.99<span className="text-[13px] font-normal text-bark-400">/month</span>
              </div>
              <p className="text-[13px] text-bark-500 mt-2.5 mb-5 leading-snug">All features, month to month. Cancel any time.</p>
              <div className="flex flex-col gap-2 mb-6">
                {['Up to 12 children', 'Recurring chores + approval', 'Savings goals', 'Auto pocket money', 'Kid-facing view', 'Multi-parent access'].map(f => (
                  <div key={f} className="text-[13px] text-bark-600 flex gap-2 items-start">
                    <span className="text-gumleaf-400 font-bold flex-shrink-0 mt-px">✓</span>{f}
                  </div>
                ))}
              </div>
              {canRegister && (
                <Link
                  href={route('register')}
                  className="block w-full py-2.5 rounded-full text-sm font-semibold text-center border-[1.5px] border-bark-200 text-bark-700 hover:border-bark-300 transition-colors"
                >
                  Start 14-day free trial
                </Link>
              )}
            </div>
          </div>

          <p className="text-[13px] text-bark-400 mt-5">
            All paid plans include a 30-day free trial · No credit card required · Cancel any time
          </p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="bg-white border-t border-bark-200 py-[72px] px-[5%]">
        <div className="max-w-[720px] mx-auto">
          <h2 className="font-display text-[34px] font-semibold text-bark-700 text-center mb-10">Frequently asked questions</h2>

          <div>
            {FAQ_ITEMS.map((item, i) => (
              <div key={i} className="border-b border-bark-200">
                <button
                  type="button"
                  className="w-full bg-transparent py-[18px] flex justify-between items-center text-left text-[15px] font-medium text-bark-700 hover:text-eucalyptus-400 transition-colors gap-3"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span>{item.q}</span>
                  <span
                    className="text-lg text-bark-400 flex-shrink-0 transition-transform duration-200"
                    style={{ transform: openFaq === i ? 'rotate(180deg)' : 'none' }}
                  >
                    ⌄
                  </span>
                </button>
                {openFaq === i && (
                  <div className="pb-[18px] text-sm text-bark-500 leading-[1.7]">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
