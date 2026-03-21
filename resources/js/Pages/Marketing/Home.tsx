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

const comparisons = [
  {
    them: 'Kids need their own debit card',
    us: 'No cards, no bank accounts needed',
  },
  {
    them: 'Parents manage separate banking apps',
    us: 'Everything in one place for your whole family',
  },
  {
    them: 'Complicated setup with identity checks',
    us: 'Up and running in under 5 minutes',
  },
  {
    them: 'Monthly fees per child',
    us: 'One flat price for the whole family',
  },
];

export default function Home({ canLogin, canRegister }: Props) {
  return (
    <MarketingLayout canLogin={canLogin} canRegister={canRegister}>
      <Head title="Quiddo — Teach kids the value of money" />

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-20 pb-24 text-center">
        <p className="inline-block bg-dark-amaranth-50 text-dark-amaranth-500 text-xs font-semibold px-3 py-1 rounded-full mb-6 tracking-wide uppercase">
          Smart pocket money for families
        </p>
        <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight text-charcoal-blue-900 max-w-3xl mx-auto">
          Raise money-smart kids.
        </h1>
        <p className="mt-6 text-lg text-stone-500 max-w-xl mx-auto leading-relaxed">
          Quiddo makes it easy to manage pocket money, assign chores, and help your kids build healthy saving habits — no debit cards or separate bank accounts required.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          {canRegister && (
            <Link
              href={route('register')}
              className="bg-dark-amaranth-500 text-white font-semibold px-8 py-3.5 rounded-full text-base hover:bg-dark-amaranth-600 transition-colors"
            >
              Get started
            </Link>
          )}
          <Link
            href={route('marketing.how')}
            className="border border-stone-300 text-charcoal-blue-900 font-semibold px-8 py-3.5 rounded-full text-base hover:border-stone-400 transition-colors"
          >
            How it works
          </Link>
        </div>

        {/* App preview widget */}
        <div className="mt-16 inline-grid grid-cols-3 gap-px bg-stone-200 rounded-2xl overflow-hidden shadow-lg text-left">
          {[
            { label: 'Family Balance', value: '$48.50' },
            { label: 'Paid This Month', value: '$12.00' },
            { label: 'Chores Done', value: '7 / 8' },
          ].map(stat => (
            <div key={stat.label} className="bg-white px-6 py-5">
              <p className="text-xs text-stone-400 uppercase tracking-wide">{stat.label}</p>
              <p className="text-2xl font-bold text-charcoal-blue-900 mt-1">{stat.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features grid */}
      <section className="bg-soft-linen-50 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-serif text-4xl font-bold text-center text-charcoal-blue-900 mb-12">
            Why families love Quiddo
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(f => (
              <div key={f.title} className="bg-white rounded-2xl p-6">
                <span className="text-3xl">{f.emoji}</span>
                <h3 className="font-semibold text-charcoal-blue-900 mt-3 mb-1">{f.title}</h3>
                <p className="text-sm text-stone-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison section */}
      <section className="py-20 mx-auto max-w-6xl px-6">
        <div className="text-center mb-12">
          <h2 className="font-serif text-4xl font-bold text-charcoal-blue-900">A simpler approach</h2>
          <p className="mt-4 text-stone-500 max-w-md mx-auto">
            Other apps give kids their own debit cards and accounts. Quiddo keeps it simple — parents stay in control, kids learn the value of money.
          </p>
        </div>
        <div className="max-w-2xl mx-auto space-y-4">
          {comparisons.map((c, i) => (
            <div key={i} className="grid grid-cols-2 gap-4">
              <div className="bg-soft-linen-100 rounded-xl p-4 text-sm text-soft-linen-700 flex items-start gap-3">
                <span className="text-blazing-flame-400 mt-0.5">✗</span>
                {c.them}
              </div>
              <div className="bg-dark-amaranth-50 rounded-xl p-4 text-sm text-dark-amaranth-500 font-medium flex items-start gap-3">
                <span className="mt-0.5">✓</span>
                {c.us}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA banner */}
      <section className="bg-charcoal-blue-900 py-20 text-center px-6">
        <h2 className="font-serif text-4xl font-bold text-white mb-4">Ready to get started?</h2>
        <p className="text-stone-400 mb-8 text-lg">Set up in under 5 minutes. From A$1.99/month for your whole family.</p>
        {canRegister && (
          <Link
            href={route('register')}
            className="bg-dark-amaranth-300 text-charcoal-blue-900 font-bold px-8 py-3.5 rounded-full text-base hover:bg-dark-amaranth-50 transition-colors"
          >
            Create your family account
          </Link>
        )}
      </section>
    </MarketingLayout>
  );
}
