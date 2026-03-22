import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { AlertTriangle, ArrowRightLeft, Check, CreditCard, Crown, Shield, X } from 'lucide-react';
import { useState } from 'react';

interface FamilySubscription {
  status: string;
  plan_name: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
}

interface FamilyMember {
  id: string;
  name: string;
  email: string;
}

interface PendingTransfer {
  id: string;
  to_email: string;
  expires_at: string;
}

interface FamilyBilling {
  id: string;
  name: string;
  on_trial: boolean;
  trial_ends_at: string | null;
  frozen: boolean;
  members: FamilyMember[];
  pending_transfer: PendingTransfer | null;
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

      {/* Billing transfer section */}
      {family.members.length > 0 && (
        <BillingTransferSection family={family} />
      )}
    </div>
  );
}

function BillingTransferSection({ family }: { family: FamilyBilling }) {
  const [showForm, setShowForm] = useState(false);
  const { data, setData, post, processing, errors, reset } = useForm({ email: '' });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    post(route('billing.transfer', family.id), {
      onSuccess: () => { reset(); setShowForm(false); },
    });
  }

  function cancelTransfer(transferId: string) {
    router.delete(route('billing.transfer.cancel', transferId));
  }

  return (
    <div className="border-t border-bark-200 px-6 py-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-bark-500 uppercase tracking-wide">Billing Owner</span>
      </div>

      {family.pending_transfer && (
        <div className="bg-wattle-50 border border-wattle-200 rounded-lg p-3 mb-3 flex items-center justify-between">
          <div>
            <p className="text-sm text-wattle-700 font-medium">Transfer pending</p>
            <p className="text-xs text-wattle-600">
              Waiting for {family.pending_transfer.to_email} to accept
              (expires {new Date(family.pending_transfer.expires_at).toLocaleDateString()})
            </p>
          </div>
          <button
            onClick={() => cancelTransfer(family.pending_transfer!.id)}
            className="text-wattle-600 hover:text-wattle-800 p-1"
            title="Cancel transfer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {!family.pending_transfer && !showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="text-sm text-bark-500 hover:text-bark-700 flex items-center gap-1.5 transition-colors"
        >
          <ArrowRightLeft className="h-3.5 w-3.5" />
          Transfer billing to another carer
        </button>
      )}

      {!family.pending_transfer && showForm && (
        <form onSubmit={submit} className="space-y-2">
          <p className="text-xs text-bark-500">
            Choose a family member to transfer billing to. They&apos;ll receive an email to accept.
          </p>
          <select
            value={data.email}
            onChange={e => setData('email', e.target.value)}
            className="w-full text-sm border border-bark-200 rounded-lg px-3 py-2 bg-white"
          >
            <option value="">Select a member...</option>
            {family.members.map(m => (
              <option key={m.id} value={m.email}>{m.name} ({m.email})</option>
            ))}
          </select>
          {errors.email && <p className="text-xs text-redearth-500">{errors.email}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={processing || !data.email}
              className="text-sm bg-eucalyptus-400 text-white px-4 py-1.5 rounded-lg hover:bg-eucalyptus-500 disabled:opacity-50 font-medium transition-colors"
            >
              Send Transfer Invite
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); reset(); }}
              className="text-sm text-bark-500 px-4 py-1.5 hover:text-bark-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
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
