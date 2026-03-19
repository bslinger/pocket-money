import MarketingLayout from '@/Layouts/MarketingLayout';
import { Head, Link } from '@inertiajs/react';

interface Props {
  canLogin: boolean;
  canRegister: boolean;
}

const features = [
  { emoji: '💰', title: 'Pocket money tracking', desc: 'Automate weekly pocket money so you never miss a payment.' },
  { emoji: '✅', title: 'Chore system', desc: 'Assign chores with rewards and let kids claim them when done.' },
  { emoji: '🎯', title: 'Savings goals', desc: 'Kids set goals and watch their progress in real time.' },
  { emoji: '👀', title: 'Parental approval', desc: 'Review completed chores before paying out rewards.' },
  { emoji: '📊', title: 'Family dashboard', desc: "See every kid's balance and recent activity at a glance." },
  { emoji: '📱', title: 'Kid-friendly view', desc: 'A simple, colourful screen designed just for children.' },
];

export default function Home({ canLogin, canRegister }: Props) {
  return (
    <MarketingLayout canLogin={canLogin} canRegister={canRegister}>
      <Head title="Quiddo — Teach kids the value of money" />

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-20 pb-24 text-center">
        <p className="inline-block bg-[#E1F5EE] text-[#0F6E56] text-xs font-semibold px-3 py-1 rounded-full mb-6 tracking-wide uppercase">
          Smart pocket money for families
        </p>
        <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight text-[#1C1A18] max-w-3xl mx-auto">
          Raise money-smart kids.
        </h1>
        <p className="mt-6 text-lg text-stone-500 max-w-xl mx-auto leading-relaxed">
          Quiddo makes it easy to manage pocket money, assign chores, and help your kids build healthy saving habits.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          {canRegister && (
            <Link
              href={route('register')}
              className="bg-[#0F6E56] text-white font-semibold px-8 py-3.5 rounded-full text-base hover:bg-[#1D9E75] transition-colors"
            >
              Start for free
            </Link>
          )}
          <Link
            href={route('marketing.how')}
            className="border border-stone-300 text-[#1C1A18] font-semibold px-8 py-3.5 rounded-full text-base hover:border-stone-400 transition-colors"
          >
            How it works
          </Link>
        </div>

        {/* Stat preview widget */}
        <div className="mt-16 inline-grid grid-cols-3 gap-px bg-stone-200 rounded-2xl overflow-hidden shadow-lg text-left">
          {[
            { label: 'Family Balance', value: '$48.50' },
            { label: 'Paid This Month', value: '$12.00' },
            { label: 'Chores Done', value: '7 / 8' },
          ].map(stat => (
            <div key={stat.label} className="bg-white px-6 py-5">
              <p className="text-xs text-stone-400 uppercase tracking-wide">{stat.label}</p>
              <p className="text-2xl font-bold text-[#1C1A18] mt-1">{stat.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features grid */}
      <section className="bg-[#FAEEDA] py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-serif text-4xl font-bold text-center text-[#1C1A18] mb-12">
            Why families love Quiddo
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(f => (
              <div key={f.title} className="bg-white rounded-2xl p-6">
                <span className="text-3xl">{f.emoji}</span>
                <h3 className="font-semibold text-[#1C1A18] mt-3 mb-1">{f.title}</h3>
                <p className="text-sm text-stone-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof stats */}
      <section className="py-20 mx-auto max-w-6xl px-6 text-center">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
          {[
            { number: '2,000+', label: 'families using Quiddo' },
            { number: '$180k+', label: 'pocket money tracked' },
            { number: '95%', label: 'parent satisfaction' },
          ].map(s => (
            <div key={s.label}>
              <p className="font-serif text-5xl font-bold text-[#0F6E56]">{s.number}</p>
              <p className="text-stone-500 mt-2">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA banner */}
      <section className="bg-[#1C1A18] py-20 text-center px-6">
        <h2 className="font-serif text-4xl font-bold text-white mb-4">Ready to get started?</h2>
        <p className="text-stone-400 mb-8 text-lg">Set up in under 5 minutes. Free plan available.</p>
        {canRegister && (
          <Link
            href={route('register')}
            className="bg-[#FAC775] text-[#1C1A18] font-bold px-8 py-3.5 rounded-full text-base hover:bg-[#FAEEDA] transition-colors"
          >
            Create your family account
          </Link>
        )}
      </section>
    </MarketingLayout>
  );
}
