import MarketingLayout from '@/Layouts/MarketingLayout';
import { Head, Link } from '@inertiajs/react';
import { Check } from 'lucide-react';

interface Props {
  canLogin: boolean;
  canRegister: boolean;
}

const plans = [
  {
    name: 'Monthly',
    price: 'A$1.99',
    period: 'per month',
    description: 'Everything you need for your family.',
    features: [
      'Up to 12 children',
      'Pocket money tracking',
      'Chore system with approvals',
      'Savings goals',
      'Kid-friendly dashboard',
    ],
    cta: 'Get started',
    href: 'register',
    dark: false,
  },
  {
    name: 'Annual',
    price: 'A$15',
    period: 'per year',
    description: 'Best value — save 37%.',
    features: [
      'Everything in Monthly',
      'Save A$8.88 vs monthly',
      'Priority support',
    ],
    cta: 'Get started',
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
          <h1 className="font-display text-5xl font-bold text-bark-700">Simple pricing</h1>
          <p className="mt-4 text-lg text-bark-500 max-w-md mx-auto">
            One plan, everything included. Pay monthly or save 37% with annual billing.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {plans.map(plan => (
            <div
              key={plan.name}
              className={`rounded-card p-8 flex flex-col ${
                plan.dark
                  ? 'bg-eucalyptus-600 text-white'
                  : 'bg-white border border-bark-200'
              }`}
            >
              <div>
                <p className={`text-sm font-semibold uppercase tracking-wide mb-3 ${plan.dark ? 'text-wattle-300' : 'text-eucalyptus-400'}`}>
                  {plan.name}
                </p>
                <div className="flex items-end gap-1 mb-1">
                  <span className={`font-display text-4xl font-bold ${plan.dark ? 'text-white' : 'text-bark-700'}`}>{plan.price}</span>
                  <span className={`text-sm mb-1 ${plan.dark ? 'text-eucalyptus-200' : 'text-bark-400'}`}>/{plan.period}</span>
                </div>
                <p className={`text-sm mb-6 ${plan.dark ? 'text-eucalyptus-100' : 'text-bark-500'}`}>{plan.description}</p>

                <ul className="space-y-3 mb-8">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-3 text-sm">
                      <Check className={`h-4 w-4 shrink-0 ${plan.dark ? 'text-wattle-300' : 'text-gumleaf-400'}`} />
                      <span className={plan.dark ? 'text-eucalyptus-100' : 'text-bark-600'}>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {canRegister && (
                <div className="mt-auto">
                  <Link
                    href={route(plan.href as any)}
                    className={`block text-center font-semibold px-6 py-3 rounded-pill transition-colors ${
                      plan.dark
                        ? 'bg-wattle-400 text-wattle-900 hover:bg-wattle-300'
                        : 'bg-eucalyptus-400 text-white hover:bg-eucalyptus-500'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-bark-400 mt-10">
          Prices in Australian dollars. One subscription covers your whole family — up to 12 kids.
        </p>
      </section>
    </MarketingLayout>
  );
}
