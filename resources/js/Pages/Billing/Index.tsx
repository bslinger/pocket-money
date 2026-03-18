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
    active: 'text-green-600 bg-green-50 dark:bg-green-900/20',
    trialing: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
    past_due: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20',
    canceled: 'text-red-600 bg-red-50 dark:bg-red-900/20',
    none: 'text-gray-600 bg-gray-50 dark:bg-gray-700',
  };

  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Billing</h2>}>
      <Head title="Billing" />
      <div className="py-8 max-w-2xl mx-auto px-4 space-y-6">
        {/* Current plan card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Current Plan</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {subscription.plan_name ?? 'Free'}
              </p>
              {on_trial && trial_ends_at && (
                <p className="text-sm text-blue-600 mt-0.5">
                  Trial ends {new Date(trial_ends_at).toLocaleDateString()}
                </p>
              )}
              {isActive && subscription.current_period_end && (
                <p className="text-sm text-gray-500 mt-0.5">
                  {subscription.cancel_at_period_end ? 'Cancels' : 'Renews'} {new Date(subscription.current_period_end).toLocaleDateString()}
                </p>
              )}
            </div>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColor[subscription.status]}`}>
              {statusLabel[subscription.status]}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 space-y-3">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Actions</h3>

          {isActive ? (
            <form onSubmit={goToPortal}>
              <button
                type="submit"
                disabled={portalProcessing}
                className="w-full py-2.5 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium"
              >
                Manage Subscription
              </button>
              <p className="text-xs text-gray-400 mt-2 text-center">
                Update payment method, download invoices, or cancel your plan.
              </p>
            </form>
          ) : (
            <form onSubmit={goToCheckout}>
              <button
                type="submit"
                disabled={checkoutProcessing}
                className="w-full py-2.5 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium"
              >
                Upgrade to Pro
              </button>
              <p className="text-xs text-gray-400 mt-2 text-center">
                Unlock unlimited spenders, accounts, and recurring transactions.
              </p>
            </form>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
