import MarketingLayout from '@/Layouts/MarketingLayout';
import { Head, Link } from '@inertiajs/react';

interface Props {
  canLogin: boolean;
  canRegister: boolean;
}

const steps = [
  {
    number: '01',
    title: 'Create your family',
    desc: 'Sign up and create a family profile. Invite your partner or co-parent — everyone stays in sync.',
    emoji: '👨‍👩‍👧‍👦',
  },
  {
    number: '02',
    title: 'Set pocket money',
    desc: 'Choose a weekly amount for each child. Quiddo credits it automatically — no more forgetting.',
    emoji: '💸',
  },
  {
    number: '03',
    title: 'Create chores',
    desc: 'Add chores with optional cash rewards or mark them as responsibilities. Assign them to one or more kids.',
    emoji: '📋',
  },
  {
    number: '04',
    title: 'Watch goals grow',
    desc: 'Kids see their balance grow in real time and track progress toward their savings goals.',
    emoji: '🚀',
  },
];

export default function HowItWorks({ canLogin, canRegister }: Props) {
  return (
    <MarketingLayout canLogin={canLogin} canRegister={canRegister}>
      <Head title="How It Works — Quiddo" />

      <section className="mx-auto max-w-6xl px-6 pt-20 pb-8 text-center">
        <h1 className="font-serif text-5xl font-bold text-heading">How It Works</h1>
        <p className="mt-4 text-lg text-stone-500 max-w-xl mx-auto">
          Getting started takes less than 5 minutes. Here's how Quiddo works.
        </p>
      </section>

      <section className="mx-auto max-w-4xl px-6 pb-24">
        <div className="space-y-6 mt-12">
          {steps.map((step, i) => (
            <div key={step.number} className={`flex gap-6 items-start ${i % 2 === 1 ? 'flex-row-reverse' : ''}`}>
              <div className="shrink-0 w-20 h-20 rounded-2xl flex items-center justify-center text-4xl bg-highlight-subtle">
                {step.emoji}
              </div>
              <div className="flex-1 py-2">
                <span className="text-xs font-bold text-highlight tracking-widest uppercase">{step.number}</span>
                <h3 className="font-serif text-2xl font-bold text-heading mt-1 mb-2">{step.title}</h3>
                <p className="text-stone-500 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-surface-muted py-16 text-center px-6">
        <h2 className="font-serif text-3xl font-bold text-heading mb-4">Ready to give it a try?</h2>
        {canRegister && (
          <Link
            href={route('register')}
            className="inline-block bg-brand text-white font-semibold px-8 py-3.5 rounded-full hover:bg-brand-emphasis transition-colors"
          >
            Start for free
          </Link>
        )}
      </section>
    </MarketingLayout>
  );
}
