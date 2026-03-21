import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';

interface Subscription {
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'none';
  plan_name: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
}

interface Props {
  subscription: Subscription;
  on_trial: boolean;
  trial_ends_at: string | null;
}

export default function BillingIndex({ subscription, on_trial, trial_ends_at }: Props) {
  const { post: postPortal, processing: portalProcessing } = useForm({});
  const { post: postCheckout, processing: checkoutProcessing } = useForm({});

  function goToPortal(e: React.FormEvent) {
    e.preventDefault();
    postPortal(route('billing.portal'));
  }

  function goToCheckout(e: React.FormEvent) {
    e.preventDefault();
    postCheckout(route('billing.checkout'));
  }

  const isActive = subscription.status === 'active' || subscription.status === 'trialing';

  const statusLabel: Record<Subscription['status'], string> = {
    active: 'Active',
    trialing: 'Trial',
    past_due: 'Past Due',
    canceled: 'Canceled',
    none: 'No Subscription',
  };

  const statusColor: Record<Subscription['status'], string> = {
    active:   'text-gumleaf-600 bg-gumleaf-50 border border-gumleaf-200',
    trialing: 'text-eucalyptus-600 bg-eucalyptus-50 border border-eucalyptus-200',
    past_due: 'text-wattle-600 bg-wattle-50 border border-wattle-200',
    canceled: 'text-redearth-600 bg-redearth-50 border border-redearth-200',
    none:     'text-bark-600 bg-bark-50 border border-bark-200',
  };

  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-bark-700">Billing</h2>}>
      <Head title="Billing" />
      <div className="py-8 max-w-2xl mx-auto px-4 space-y-6">
        {/* Current plan card */}
        <div className="bg-white border border-bark-200 rounded-card p-6">
          <h3 className="font-semibold text-bark-700 mb-4">Current Plan</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-medium text-bark-700">
                {subscription.plan_name ?? 'Free'}
              </p>
              {on_trial && trial_ends_at && (
                <p className="text-sm text-eucalyptus-600 mt-0.5">
                  Trial ends {new Date(trial_ends_at).toLocaleDateString()}
                </p>
              )}
              {isActive && subscription.current_period_end && (
                <p className="text-sm text-bark-500 mt-0.5">
                  {subscription.cancel_at_period_end ? 'Cancels' : 'Renews'} {new Date(subscription.current_period_end).toLocaleDateString()}
                </p>
              )}
            </div>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-pill ${statusColor[subscription.status]}`}>
              {statusLabel[subscription.status]}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white border border-bark-200 rounded-card p-6 space-y-3">
          <h3 className="font-semibold text-bark-700 mb-4">Actions</h3>

          {isActive ? (
            <form onSubmit={goToPortal}>
              <button
                type="submit"
                disabled={portalProcessing}
                className="w-full py-2.5 px-4 bg-eucalyptus-400 text-white rounded-input hover:bg-eucalyptus-500 disabled:opacity-50 font-medium transition-colors"
              >
                Manage Subscription
              </button>
              <p className="text-xs text-bark-400 mt-2 text-center">
                Update payment method, download invoices, or cancel your plan.
              </p>
            </form>
          ) : (
            <form onSubmit={goToCheckout}>
              <button
                type="submit"
                disabled={checkoutProcessing}
                className="w-full py-2.5 px-4 bg-eucalyptus-400 text-white rounded-input hover:bg-eucalyptus-500 disabled:opacity-50 font-medium transition-colors"
              >
                Upgrade to Pro
              </button>
              <p className="text-xs text-bark-400 mt-2 text-center">
                Unlock unlimited spenders, accounts, and recurring transactions.
              </p>
            </form>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
