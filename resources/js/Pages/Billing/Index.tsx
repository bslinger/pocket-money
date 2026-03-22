import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { AlertTriangle, Check, CreditCard, Crown } from 'lucide-react';

interface Subscription {
  status: string;
  plan_name: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  on_grace_period: boolean;
}

interface Price {
  amount: string;
  interval: string;
  savings?: string;
  configured: boolean;
}

interface Props {
  subscription: Subscription | null;
  on_trial: boolean;
  trial_ends_at: string | null;
  frozen: boolean;
  prices: {
    monthly: Price;
    yearly: Price;
  };
}

export default function BillingIndex({ subscription, on_trial, trial_ends_at, frozen, prices }: Props) {
  function checkout(plan: 'monthly' | 'yearly') {
    router.post(route('billing.checkout'), { plan });
  }

  function openPortal() {
    router.post(route('billing.portal'));
  }

  const daysLeft = trial_ends_at
    ? Math.max(0, Math.ceil((new Date(trial_ends_at).getTime() - Date.now()) / 86400000))
    : 0;

  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-bark-700">Billing</h2>}>
      <Head title="Billing" />
      <div className="py-8 max-w-3xl mx-auto px-4 space-y-6">

        {/* Frozen state warning */}
        {frozen && (
          <div className="bg-redearth-50 border border-redearth-200 rounded-card p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-redearth-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-redearth-700">Your subscription has expired</p>
              <p className="text-sm text-redearth-600 mt-1">
                Your data is safe, but you can&apos;t make changes until you subscribe.
                Choose a plan below to get started.
              </p>
            </div>
          </div>
        )}

        {/* Trial banner */}
        {on_trial && !frozen && (
          <div className="bg-eucalyptus-50 border border-eucalyptus-200 rounded-card p-4 flex items-start gap-3">
            <Crown className="h-5 w-5 text-eucalyptus-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-eucalyptus-700">Free trial — {daysLeft} days remaining</p>
              <p className="text-sm text-eucalyptus-600 mt-1">
                You have full access to all features. Subscribe before your trial ends to continue.
              </p>
            </div>
          </div>
        )}

        {/* Active subscription card */}
        {subscription && (
          <div className="bg-white border border-bark-200 rounded-card p-6">
            <h3 className="font-semibold text-bark-700 mb-4">Current Plan</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-medium text-bark-700">{subscription.plan_name} Plan</p>
                {subscription.current_period_end && (
                  <p className="text-sm text-bark-500 mt-0.5">
                    {subscription.cancel_at_period_end ? 'Cancels' : 'Renews'}{' '}
                    {new Date(subscription.current_period_end).toLocaleDateString()}
                  </p>
                )}
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gumleaf-50 text-gumleaf-600 border border-gumleaf-200">
                Active
              </span>
            </div>
            <button
              onClick={openPortal}
              className="mt-4 w-full py-2.5 px-4 bg-bark-100 text-bark-700 rounded-lg hover:bg-bark-200 font-medium transition-colors flex items-center justify-center gap-2"
            >
              <CreditCard className="h-4 w-4" />
              Manage Subscription
            </button>
            <p className="text-xs text-bark-400 mt-2 text-center">
              Update payment method, download invoices, or cancel.
            </p>
          </div>
        )}

        {/* Pricing cards — shown when no active subscription */}
        {!subscription && (
          <div>
            <h3 className="font-semibold text-bark-700 mb-4 text-center text-lg">Choose your plan</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Monthly */}
              <div className="bg-white border border-bark-200 rounded-card p-6 flex flex-col">
                <h4 className="font-semibold text-bark-700">Monthly</h4>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-bark-800">{prices.monthly.amount}</span>
                  <span className="text-bark-500 text-sm"> / month</span>
                </div>
                <ul className="mt-4 space-y-2 text-sm text-bark-600 flex-1">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-eucalyptus-500" /> Unlimited kids</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-eucalyptus-500" /> All features</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-eucalyptus-500" /> Cancel anytime</li>
                </ul>
                <button
                  onClick={() => checkout('monthly')}
                  disabled={!prices.monthly.configured}
                  className="mt-4 w-full py-2.5 px-4 bg-bark-700 text-white rounded-lg hover:bg-bark-800 disabled:opacity-50 font-medium transition-colors"
                >
                  Subscribe Monthly
                </button>
              </div>

              {/* Yearly */}
              <div className="bg-white border-2 border-eucalyptus-400 rounded-card p-6 flex flex-col relative">
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-eucalyptus-400 text-white text-xs font-bold px-3 py-1 rounded-full">
                  Save {prices.yearly.savings}
                </span>
                <h4 className="font-semibold text-bark-700">Annual</h4>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-bark-800">{prices.yearly.amount}</span>
                  <span className="text-bark-500 text-sm"> / year</span>
                </div>
                <ul className="mt-4 space-y-2 text-sm text-bark-600 flex-1">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-eucalyptus-500" /> Unlimited kids</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-eucalyptus-500" /> All features</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-eucalyptus-500" /> 2 months free</li>
                </ul>
                <button
                  onClick={() => checkout('yearly')}
                  disabled={!prices.yearly.configured}
                  className="mt-4 w-full py-2.5 px-4 bg-eucalyptus-400 text-white rounded-lg hover:bg-eucalyptus-500 disabled:opacity-50 font-medium transition-colors"
                >
                  Subscribe Annually
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
