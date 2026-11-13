import React, { useState } from 'react';
import { ExternalLink, CreditCard, ArrowLeft } from 'lucide-react';
import { UserProfile, SubscriptionTier, InvoiceReceipt } from '../types';

interface StripeCustomerPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  invoices: InvoiceReceipt[];
  onUpdateSubscription: (newTier: SubscriptionTier, status: 'Active' | 'Canceled') => void;
  onUpdatePaymentMethod: (last4: string, brand: string) => void;
}

export const StripeCustomerPortalModal: React.FC<StripeCustomerPortalModalProps> = ({
  isOpen,
  onClose,
  user,
  invoices,
  onUpdateSubscription,
  onUpdatePaymentMethod,
}) => {
  const [activeView, setActiveView] = useState<'main' | 'change_plan' | 'edit_card'>('main');
  const [selectedNewPlan, setSelectedNewPlan] = useState<SubscriptionTier>(user.subscription_tier);
  const [newCardLast4, setNewCardLast4] = useState('8891');
  const [notification, setNotification] = useState<string | null>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleApplyPlanChange = () => {
    onUpdateSubscription(selectedNewPlan, 'Active');
    showToast(`Subscription switched to ${selectedNewPlan.replace('_', ' ').toUpperCase()}`);
    setActiveView('main');
  };

  const handleCancelSubscription = () => {
    if (window.confirm('Are you sure you want to cancel your TTG subscription? You will retain access until the end of your billing cycle.')) {
      onUpdateSubscription('free', 'Canceled');
      showToast('Subscription set to cancel at end of billing cycle.');
    }
  };

  const handleSaveCard = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdatePaymentMethod(newCardLast4, 'Mastercard');
    showToast('Payment method updated successfully on Stripe');
    setActiveView('main');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-stone-950/75 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Stripe Portal Window */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden z-10 my-6">
        
        {/* Stripe Portal Header */}
        <div className="bg-stone-900 dark:bg-stone-950 text-stone-100 px-6 py-4 flex items-center justify-between border-b border-stone-800 dark:border-stone-850">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (activeView !== 'main') setActiveView('main');
                else onClose();
              }}
              className="p-1 rounded text-stone-400 hover:text-white transition-colors"
              aria-label="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-tight text-white">TTG</span>
                <span className="text-[11px] px-1.5 py-0.5 rounded bg-stone-800 text-stone-300 font-mono">
                  billing.stripe.com
                </span>
              </div>
              <p className="text-[11px] text-stone-400">Customer Portal · {user.email}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 transition-colors"
          >
            <span>Return to TTG</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        {notification && (
          <div className="bg-emerald-600 text-white px-6 py-2.5 text-xs font-medium flex items-center justify-between animate-fadeIn">
            <span>{notification}</span>
            <button onClick={() => setNotification(null)} className="text-white/80 hover:text-white">✕</button>
          </div>
        )}

        <div className="p-6 sm:p-8 space-y-6 max-h-[80vh] overflow-y-auto">

          {activeView === 'main' && (
            <>
              {/* Current Plan Section */}
              <div className="border border-stone-200 dark:border-stone-800 rounded-xl p-5 bg-stone-50/50 dark:bg-stone-850/60">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-stone-500 dark:text-stone-400 font-semibold">
                      Current Subscription
                    </span>
                    <h4 className="text-lg font-bold text-stone-900 dark:text-stone-100 mt-0.5">
                      {user.subscription_tier === 'educare_pro' && 'Educare Pro'}
                      {user.subscription_tier === 'research_pass' && 'Research Pass'}
                      {user.subscription_tier === 'all_access' && 'TTG All-Access Fellow'}
                      {user.subscription_tier === 'free' && 'Free Tier Member'}
                    </h4>
                    <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
                      {user.subscription_tier === 'free' 
                        ? 'No active recurring membership. Upgrade anytime to unlock study guides and research.' 
                        : `Billed monthly at $${user.subscription_tier === 'educare_pro' ? '29.00' : user.subscription_tier === 'research_pass' ? '49.00' : '69.00'}/month`}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-md ${
                      user.plan_status === 'Active' 
                        ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
                        : user.plan_status === 'Canceled'
                        ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                        : 'bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                    }`}>
                      {user.plan_status}
                    </span>
                    {user.subscription_tier !== 'free' && (
                      <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 font-mono">
                        Renews {user.renewal_date}
                      </p>
                    )}
                  </div>
                </div>

                {/* Subscription Actions */}
                <div className="mt-5 pt-4 border-t border-stone-200/80 dark:border-stone-800 flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    onClick={() => setActiveView('change_plan')}
                    className="px-3.5 py-1.5 text-xs font-medium rounded-lg bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-stone-200 text-white dark:text-stone-900 transition-colors"
                  >
                    Change Plan
                  </button>
                  
                  {user.subscription_tier !== 'free' && (
                    <button
                      type="button"
                      onClick={handleCancelSubscription}
                      className="px-3.5 py-1.5 text-xs font-medium rounded-lg border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    >
                      Cancel Subscription
                    </button>
                  )}
                </div>
              </div>

              {/* Payment Methods Section */}
              <div className="border border-stone-200 dark:border-stone-800 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] uppercase tracking-wider text-stone-500 dark:text-stone-400 font-semibold">
                    Payment Method on File
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveView('edit_card')}
                    className="text-xs text-stone-900 dark:text-stone-100 hover:underline font-medium"
                  >
                    Edit or Replace
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 bg-stone-50 dark:bg-stone-850 rounded-lg border border-stone-200/80 dark:border-stone-800">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                      <CreditCard className="w-4 h-4 text-stone-700 dark:text-stone-300" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-stone-900 dark:text-stone-100">
                        {user.payment_method.brand} ending in {user.payment_method.last4}
                      </div>
                      <div className="text-[11px] text-stone-500 dark:text-stone-400 font-mono">
                        Expires {user.payment_method.exp_month}/{user.payment_method.exp_year}
                      </div>
                    </div>
                  </div>

                  <span className="text-[11px] font-medium text-stone-600 dark:text-stone-300 bg-white dark:bg-stone-800 px-2 py-0.5 rounded border border-stone-200 dark:border-stone-700">
                    Default
                  </span>
                </div>
              </div>

              {/* Billing Information */}
              <div className="border border-stone-200 dark:border-stone-800 rounded-xl p-5">
                <span className="text-[11px] uppercase tracking-wider text-stone-500 dark:text-stone-400 font-semibold block mb-3">
                  Billing Address & Tax ID
                </span>
                <div className="text-xs text-stone-700 dark:text-stone-300 space-y-1">
                  <p className="font-medium text-stone-900 dark:text-stone-100">{user.name}</p>
                  <p>{user.email}</p>
                  <p>548 Market St, Suite 1092</p>
                  <p>San Francisco, CA 94104, US</p>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 pt-1 font-mono">Tax ID: US-EIN-94819024</p>
                </div>
              </div>

              {/* Stripe Invoices */}
              <div className="border border-stone-200 dark:border-stone-800 rounded-xl p-5">
                <span className="text-[11px] uppercase tracking-wider text-stone-500 dark:text-stone-400 font-semibold block mb-3">
                  Stripe Invoices History
                </span>
                <div className="space-y-2">
                  {invoices.map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between p-2.5 text-xs border-b border-stone-100 dark:border-stone-800 last:border-b-0 hover:bg-stone-50 dark:hover:bg-stone-800/60 rounded">
                      <div>
                        <span className="font-mono text-stone-900 dark:text-stone-100 font-medium">{inv.invoice_number}</span>
                        <span className="text-stone-400 mx-1.5">·</span>
                        <span className="text-stone-600 dark:text-stone-400">{inv.description}</span>
                        <span className="text-stone-400 mx-1.5">·</span>
                        <span className="text-stone-500 dark:text-stone-400 font-mono">{inv.date}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono tabular-nums font-semibold text-stone-900 dark:text-stone-100">
                          ${inv.amount.toFixed(2)}
                        </span>
                        <span className="text-[11px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                          Paid
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Change Plan View */}
          {activeView === 'change_plan' && (
            <div className="space-y-4">
              <h4 className="text-base font-bold text-stone-900 dark:text-stone-100">Select New Subscription Plan</h4>
              <p className="text-xs text-stone-600 dark:text-stone-400">
                Plan changes are prorated automatically by Stripe. Your new features will unlock instantly.
              </p>

              <div className="space-y-3 pt-2">
                {[
                  {
                    tier: 'educare_pro' as SubscriptionTier,
                    title: 'Educare Pro',
                    price: '$29.00 / month',
                    desc: 'Full access to executive study guides & Educare AI Study Assistant',
                  },
                  {
                    tier: 'research_pass' as SubscriptionTier,
                    title: 'Research Pass',
                    price: '$49.00 / month',
                    desc: 'Full access to institutional quantitative research & Research AI Superagent',
                  },
                  {
                    tier: 'all_access' as SubscriptionTier,
                    title: 'TTG All-Access Fellow',
                    price: '$69.00 / month',
                    desc: 'Complete bundle with Educare Pro, Research Pass, and priority retreat seats',
                  },
                  {
                    tier: 'free' as SubscriptionTier,
                    title: 'Free Tier',
                    price: '$0.00',
                    desc: 'Standard public briefing access only',
                  },
                ].map((item) => (
                  <div
                    key={item.tier}
                    onClick={() => setSelectedNewPlan(item.tier)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      selectedNewPlan === item.tier
                        ? 'border-stone-900 dark:border-stone-100 bg-stone-50 dark:bg-stone-800 ring-1 ring-stone-900 dark:ring-stone-100'
                        : 'border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-stone-900 dark:text-stone-100">{item.title}</span>
                      <span className="font-mono text-xs font-bold text-stone-900 dark:text-stone-100">{item.price}</span>
                    </div>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">{item.desc}</p>
                  </div>
                ))}
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setActiveView('main')}
                  className="px-4 py-2 text-xs text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApplyPlanChange}
                  className="px-4 py-2 text-xs font-medium text-white dark:text-stone-900 bg-stone-900 dark:bg-stone-100 rounded-lg hover:bg-stone-800 dark:hover:bg-stone-200"
                >
                  Confirm Change on Stripe
                </button>
              </div>
            </div>
          )}

          {/* Edit Card View */}
          {activeView === 'edit_card' && (
            <form onSubmit={handleSaveCard} className="space-y-4">
              <h4 className="text-base font-bold text-stone-900 dark:text-stone-100">Update Payment Method</h4>
              <p className="text-xs text-stone-600 dark:text-stone-400">
                Enter your replacement credit card for upcoming renewals.
              </p>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                    Card Number (Last 4 digits test)
                  </label>
                  <input
                    type="text"
                    value={newCardLast4}
                    onChange={(e) => setNewCardLast4(e.target.value.slice(0, 4))}
                    className="w-full px-3 py-2 text-xs font-mono border border-stone-300 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                    placeholder="8891"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setActiveView('main')}
                  className="px-4 py-2 text-xs text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium text-white dark:text-stone-900 bg-stone-900 dark:bg-stone-100 rounded-lg hover:bg-stone-800 dark:hover:bg-stone-200"
                >
                  Save New Card
                </button>
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};
