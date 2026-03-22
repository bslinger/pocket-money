import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { AlertTriangle, Check, CreditCard, Crown, Shield } from 'lucide-react';

interface FamilySubscription {
  status: string;
  plan_name: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
}

interface FamilyBilling {
  id: string;
  name: string;
  on_trial: boolean;
  trial_ends_at: string | null;
  frozen: boolean;
  subscription: FamilySubscription | null;
}

interface Price {
  amount: string;
  interval: string;
  savings?: string;
  configured: boolean;
}

interface Props {
  families: FamilyBilling[];
  prices: {
    monthly: Price;
    yearly: Price;
  };
}

function daysLeft(dateStr: string): number {
  return Math.max(0, Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000));
}

function FamilyCard({ family, prices }: { family: FamilyBilling; prices: Props['prices'] }) {
  function checkout(plan: 'monthly' | 'yearly') {
    router.post(route('billing.checkout'), { plan, family_id: family.id });
  }

  function openPortal() {
    router.post(route('billing.portal'), { family_id: family.id });
  }

  const hasSubscription = family.subscription !== null;
  const isActive = hasSubscription && family.subscription!.status === 'active';

  return (
    <div className="bg-white border border-bark-200 rounded-card overflow-hidden">
      {/* Header */}
      <div className={`px-6 py-4 flex items-center justify-between ${
        family.frozen ? 'bg-redearth-50 border-b border-redearth-200' :
        family.on_trial ? 'bg-eucalyptus-50 border-b border-eucalyptus-200' :
        isActive ? 'bg-gumleaf-50 border-b border-gumleaf-200' :
        'border-b border-bark-200'
      }`}>
        <h3 className="font-semibold text-bark-700 text-lg">{family.name}</h3>
        {family.frozen && (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-redearth-100 text-redearth-600 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" /> Expired
          </span>
        )}
        {family.on_trial && !family.frozen && (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-eucalyptus-100 text-eucalyptus-600 flex items-center gap-1">
            <Crown className="h-3 w-3" /> Trial — {daysLeft(family.trial_ends_at!)}d left
          </span>
        )}
        {isActive && (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gumleaf-100 text-gumleaf-600 flex items-center gap-1">
            <Shield className="h-3 w-3" /> {family.subscription!.plan_name}
          </span>
        )}
        {hasSubscription && !isActive && (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-wattle-100 text-wattle-600">
            {family.subscription!.status === 'past_due' ? 'Payment failed' : family.subscription!.status}
          </span>
        )}
      </div>

      <div className="p-6">
        {/* Active subscription — show manage button */}
        {isActive && (
          <div>
            <p className="text-sm text-bark-500 mb-3">
              {family.subscription!.cancel_at_period_end ? 'Cancels' : 'Renews'}{' '}
              {family.subscription!.current_period_end
                ? new Date(family.subscription!.current_period_end).toLocaleDateString()
                : ''}
            </p>
            <button
              onClick={openPortal}
              className="w-full py-2.5 px-4 bg-bark-100 text-bark-700 rounded-lg hover:bg-bark-200 font-medium transition-colors flex items-center justify-center gap-2"
            >
              <CreditCard className="h-4 w-4" />
              Manage Subscription
            </button>
          </div>
        )}

        {/* Trial active — show subscribe prompt */}
        {family.on_trial && !family.frozen && !hasSubscription && (
          <div>
            <p className="text-sm text-bark-500 mb-4">
              Your free trial ends {new Date(family.trial_ends_at!).toLocaleDateString()}.
              Subscribe to keep full access.
            </p>
            <PricingButtons prices={prices} onCheckout={checkout} />
          </div>
        )}

        {/* Frozen — no trial, no subscription */}
        {family.frozen && !hasSubscription && (
          <div>
            <p className="text-sm text-redearth-600 mb-4">
              Subscribe to restore access. Your data is safe.
            </p>
            <PricingButtons prices={prices} onCheckout={checkout} />
          </div>
        )}

        {/* Past due subscription */}
        {hasSubscription && !isActive && (
          <div>
            <p className="text-sm text-wattle-600 mb-3">
              We couldn&apos;t process your payment. Update your payment method to restore access.
            </p>
            <button
              onClick={openPortal}
              className="w-full py-2.5 px-4 bg-wattle-400 text-wattle-900 rounded-lg hover:bg-wattle-500 font-medium transition-colors flex items-center justify-center gap-2"
            >
              <CreditCard className="h-4 w-4" />
              Update Payment Method
            </button>
          </div>
        )}

        {/* No trial, no subscription, not frozen (shouldn't happen but handle it) */}
        {!family.on_trial && !family.frozen && !hasSubscription && (
          <PricingButtons prices={prices} onCheckout={checkout} />
        )}
      </div>
    </div>
  );
}

function PricingButtons({ prices, onCheckout }: { prices: Props['prices']; onCheckout: (plan: 'monthly' | 'yearly') => void }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        onClick={() => onCheckout('monthly')}
        disabled={!prices.monthly.configured}
        className="py-2.5 px-4 bg-bark-700 text-white rounded-lg hover:bg-bark-800 disabled:opacity-50 font-medium transition-colors text-sm"
      >
        {prices.monthly.amount}/mo
      </button>
      <button
        onClick={() => onCheckout('yearly')}
        disabled={!prices.yearly.configured}
        className="py-2.5 px-4 bg-eucalyptus-400 text-white rounded-lg hover:bg-eucalyptus-500 disabled:opacity-50 font-medium transition-colors text-sm"
      >
        {prices.yearly.amount}/yr <span className="text-eucalyptus-200 text-xs">save {prices.yearly.savings}</span>
      </button>
    </div>
  );
}

export default function BillingIndex({ families, prices }: Props) {
  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-bark-700">Billing</h2>}>
      <Head title="Billing" />
      <div className="py-8 max-w-3xl mx-auto px-4 space-y-6">
        {families.length === 0 && (
          <div className="bg-white border border-bark-200 rounded-card p-6 text-center text-bark-500">
            <p>You don&apos;t manage billing for any families.</p>
          </div>
        )}

        {families.map(family => (
          <FamilyCard key={family.id} family={family} prices={prices} />
        ))}

        <p className="text-center text-xs text-bark-400">
          Prices in Australian dollars. Each family subscription is billed separately.
        </p>
      </div>
    </AuthenticatedLayout>
  );
}
