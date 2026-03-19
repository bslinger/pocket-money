import MarketingLayout from '@/Layouts/MarketingLayout';
import { Head, Link } from '@inertiajs/react';
import { Check } from 'lucide-react';

interface Props {
  canLogin: boolean;
  canRegister: boolean;
}

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for getting started.',
    features: [
      'Up to 2 children',
      'Pocket money tracking',
      'Basic chores',
      'Savings goals',
    ],
    cta: 'Get started',
    href: 'register',
    dark: false,
  },
  {
    name: 'Monthly',
    price: '$4.99',
    period: 'per month',
    description: 'For families who want more.',
    features: [
      'Unlimited children',
      'All Free features',
      'Chore approval workflow',
      'Responsibility tracking',
      'Pocket money release page',
      'Priority support',
    ],
    cta: 'Start free trial',
    href: 'register',
    dark: false,
  },
  {
    name: 'Annual',
    price: '$39.99',
    period: 'per year',
    description: 'Best value — save 33%.',
    features: [
      'Everything in Monthly',
      'Save $19.89 vs monthly',
      'Early access to new features',
      'Priority support',
    ],
    cta: 'Start free trial',
    href: 'register',
    dark: true,
  },
];

export default function Pricing({ canLogin, canRegister }: Props) {
  return (
    <MarketingLayout canLogin={canLogin} canRegister={canRegister}>
      <Head title="Pricing — Quiddo" />

      <section className="mx-auto max-w-6xl px-6 pt-20 pb-24">
        <div className="text-center mb-14">
          <h1 className="font-serif text-5xl font-bold text-[#1C1A18]">Simple pricing</h1>
          <p className="mt-4 text-lg text-stone-500 max-w-md mx-auto">
            Start free, upgrade when you need more. No hidden fees.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map(plan => (
            <div
              key={plan.name}
              className={`rounded-2xl p-8 flex flex-col ${
                plan.dark
                  ? 'bg-[#1C1A18] text-white'
                  : 'bg-white border border-stone-200'
              }`}
            >
              <div>
                <p className={`text-sm font-semibold uppercase tracking-wide mb-3 ${plan.dark ? 'text-[#FAC775]' : 'text-[#0F6E56]'}`}>
                  {plan.name}
                </p>
                <div className="flex items-end gap-1 mb-1">
                  <span className={`text-4xl font-bold ${plan.dark ? 'text-white' : 'text-[#1C1A18]'}`}>{plan.price}</span>
                  <span className={`text-sm mb-1 ${plan.dark ? 'text-stone-400' : 'text-stone-400'}`}>/{plan.period}</span>
                </div>
                <p className={`text-sm mb-6 ${plan.dark ? 'text-stone-400' : 'text-stone-500'}`}>{plan.description}</p>

                <ul className="space-y-3 mb-8">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-3 text-sm">
                      <Check className={`h-4 w-4 shrink-0 ${plan.dark ? 'text-[#FAC775]' : 'text-[#0F6E56]'}`} />
                      <span className={plan.dark ? 'text-stone-300' : 'text-stone-600'}>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {canRegister && (
                <div className="mt-auto">
                  <Link
                    href={route(plan.href as any)}
                    className={`block text-center font-semibold px-6 py-3 rounded-full transition-colors ${
                      plan.dark
                        ? 'bg-[#FAC775] text-[#1C1A18] hover:bg-[#FAEEDA]'
                        : 'bg-[#0F6E56] text-white hover:bg-[#1D9E75]'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-stone-400 mt-10">
          All paid plans include a 14-day free trial. No credit card required.
        </p>
      </section>
    </MarketingLayout>
  );
}
