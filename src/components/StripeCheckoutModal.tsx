import React, { useState } from 'react';
import { X, Lock, CreditCard, ShieldCheck, CheckCircle2, ArrowRight, Loader2, Calendar, MapPin, Tag } from 'lucide-react';
import { SubscriptionTier, RetreatEvent, Booking, InvoiceReceipt } from '../types';

export type CheckoutMode = 
  | { type: 'subscription'; plan: SubscriptionTier; billingCycle: 'monthly' | 'annual' }
  | { type: 'retreat'; event: RetreatEvent; ticketType: 'Virtual Pass' | 'In-Person Ticket'; seats: number; attendeeName: string; attendeeEmail: string };

interface StripeCheckoutModalProps {
  isOpen: boolean;
  checkoutData: CheckoutMode | null;
  onClose: () => void;
  onSuccessSubscription: (plan: SubscriptionTier, billingCycle: 'monthly' | 'annual', receipt: InvoiceReceipt) => void;
  onSuccessBooking: (booking: Booking, receipt: InvoiceReceipt) => void;
}

export const StripeCheckoutModal: React.FC<StripeCheckoutModalProps> = ({
  isOpen,
  checkoutData,
  onClose,
  onSuccessSubscription,
  onSuccessBooking,
}) => {
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [cardExp, setCardExp] = useState('11/28');
  const [cardCvc, setCardCvc] = useState('882');
  const [cardName, setCardName] = useState('Tsoaelat S.');
  const [country, setCountry] = useState('United States');
  const [postalCode, setPostalCode] = useState('94103');
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState('');
  
  const [status, setStatus] = useState<'idle' | 'processing' | 'success'>('idle');
  const [confirmedId, setConfirmedId] = useState<string>('');

  if (!isOpen || !checkoutData) return null;

  // Calculate pricing
  let itemTitle = '';
  let itemSubtitle = '';
  let basePrice = 0;
  let intervalLabel = '';
  let discountAmount = 0;

  if (checkoutData.type === 'subscription') {
    if (checkoutData.plan === 'educare_pro') {
      itemTitle = 'Educare Pro Membership';
      itemSubtitle = '100% Free · Sponsored Institutional Grant · No Subscription Fees';
      basePrice = 0;
      intervalLabel = ' ($0.00/mo free)';
    } else if (checkoutData.plan === 'research_pass') {
      itemTitle = 'Research Pass Membership';
      itemSubtitle = '100% Free · Institutional Research Bureau Grant · No Subscription Fees';
      basePrice = 0;
      intervalLabel = ' ($0.00/mo free)';
    } else {
      itemTitle = 'TTG All-Access Fellowship';
      itemSubtitle = '100% Free · Full Institutional Grant · No Subscription Fees';
      basePrice = 0;
      intervalLabel = ' ($0.00/mo free)';
    }
  } else {
    const isVirtual = checkoutData.ticketType === 'Virtual Pass';
    itemTitle = `${checkoutData.event.title}`;
    itemSubtitle = `${checkoutData.ticketType} (${checkoutData.seats} seat${checkoutData.seats > 1 ? 's' : ''}) · ${checkoutData.event.location}`;
    const singlePrice = isVirtual ? checkoutData.event.virtual_price : checkoutData.event.in_person_price;
    basePrice = singlePrice * checkoutData.seats;
    intervalLabel = ' (one-time)';
  }

  if (promoApplied && checkoutData.type === 'retreat') {
    discountAmount = Math.round(basePrice * 0.15 * 100) / 100;
  }

  const taxAmount = checkoutData.type === 'subscription' ? 0 : Math.round((basePrice - discountAmount) * 0.0825 * 100) / 100;
  const totalAmount = checkoutData.type === 'subscription' ? 0 : Math.round((basePrice - discountAmount + taxAmount) * 100) / 100;

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError('');
    if (promoCode.trim().toUpperCase() === 'TTG2026' || promoCode.trim().toUpperCase() === 'FOUNDER' || promoCode.trim().toUpperCase() === 'VIP') {
      setPromoApplied(true);
    } else {
      setPromoError('Invalid promotion code. Try "TTG2026" or "FOUNDER"');
    }
  };

  const handleProcessPayment = () => {
    setStatus('processing');

    setTimeout(() => {
      const paymentIntentId = checkoutData.type === 'subscription' 
        ? `pi_grant_free_${Math.random().toString(36).substring(2, 8)}`
        : `pi_3P${Math.random().toString(36).substring(2, 9)}TtG`;
      const invoiceNumber = `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const currentDate = new Date().toISOString().split('T')[0];

      if (checkoutData.type === 'subscription') {
        const newInvoice: InvoiceReceipt = {
          id: `inv_${Date.now()}`,
          invoice_number: invoiceNumber,
          date: currentDate,
          description: `${itemTitle} ($0.00 · Free Grant)`,
          amount: 0.00,
          currency: 'USD',
          status: 'Paid',
          category: 'Subscription',
          payment_method: 'Complimentary Grant ($0.00)',
          payment_intent_id: paymentIntentId,
          items: [
            {
              description: `${itemTitle} · $0.00 Sponsored Institutional Access`,
              quantity: 1,
              unit_price: 0.00,
            },
          ],
        };

        setConfirmedId(invoiceNumber);
        setStatus('success');
        setTimeout(() => {
          onSuccessSubscription(checkoutData.plan, checkoutData.billingCycle, newInvoice);
          onClose();
          setStatus('idle');
        }, 1600);

      } else {
        const bookingId = `bk_ttg_${Math.floor(10000 + Math.random() * 90000)}`;
        const newBooking: Booking = {
          id: bookingId,
          event_id: checkoutData.event.id,
          event_title: checkoutData.event.title,
          location: `${checkoutData.event.location}, ${checkoutData.event.country}`,
          dates: checkoutData.event.dates,
          ticket_type: checkoutData.ticketType,
          attendee_name: checkoutData.attendeeName || cardName || 'Tsoaelat S.',
          attendee_email: checkoutData.attendeeEmail || 'Tsoaelat.s@gmail.com',
          seats: checkoutData.seats,
          total_amount: totalAmount,
          currency: 'USD',
          payment_status: 'Paid',
          booking_date: currentDate,
          payment_intent: paymentIntentId,
          qr_code_ref: `TTG-RET-${bookingId.slice(-5)}-VERIFIED`,
        };

        const newInvoice: InvoiceReceipt = {
          id: `inv_${Date.now()}`,
          invoice_number: invoiceNumber,
          date: currentDate,
          description: `Retreat Booking: ${checkoutData.event.title} (${checkoutData.ticketType})`,
          amount: totalAmount,
          currency: 'USD',
          status: 'Paid',
          category: 'Retreat Booking',
          payment_method: `Visa •••• ${cardNumber.slice(-4) || '4242'}`,
          payment_intent_id: paymentIntentId,
          items: [
            {
              description: `${checkoutData.event.title} - ${checkoutData.ticketType}`,
              quantity: checkoutData.seats,
              unit_price: checkoutData.ticketType === 'Virtual Pass' ? checkoutData.event.virtual_price : checkoutData.event.in_person_price,
            },
          ],
        };

        setConfirmedId(bookingId);
        setStatus('success');
        setTimeout(() => {
          onSuccessBooking(newBooking, newInvoice);
          onClose();
          setStatus('idle');
        }, 1600);
      }
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Dark backdrop */}
      <div 
        className="fixed inset-0 bg-stone-950/80 backdrop-blur-md transition-opacity"
        onClick={() => status !== 'processing' && onClose()}
      />

      {/* Stripe Checkout Window */}
      <div className="relative w-full max-w-4xl bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden z-10 my-6 grid grid-cols-1 md:grid-cols-12 min-h-[560px]">
        
        {/* Close Button */}
        {status !== 'processing' && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            aria-label="Close Stripe Checkout"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Left Column: Order Summary (Stripe style) */}
        <div className="md:col-span-5 bg-stone-900 dark:bg-stone-950 text-stone-100 p-6 sm:p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-stone-800 dark:border-stone-850">
          <div>
            {/* Header Brand */}
            <div className="flex items-center gap-2 mb-6">
              <span className="font-bold tracking-tight text-white text-lg">TTG</span>
              <span className="text-stone-500 font-mono text-xs">/</span>
              <span className="text-stone-400 text-xs">Secure Checkout</span>
            </div>

            <div className="text-xs uppercase tracking-wider text-amber-400/90 font-medium mb-1">
              {checkoutData.type === 'subscription' ? 'Subscription Order' : 'Retreat Booking Order'}
            </div>

            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              {itemTitle}
            </h3>
            <p className="text-xs text-stone-400 mt-1">
              {itemSubtitle}
            </p>

            {/* If retreat, show dates and location */}
            {checkoutData.type === 'retreat' && (
              <div className="mt-4 pt-4 border-t border-stone-800 space-y-1.5 text-xs text-stone-300">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                  <span>{checkoutData.event.location}, {checkoutData.event.country}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                  <span>{checkoutData.event.dates}</span>
                </div>
              </div>
            )}

            {/* Price Breakdown */}
            <div className="mt-6 pt-6 border-t border-stone-800 space-y-2.5 text-xs text-stone-300">
              <div className="flex justify-between items-center">
                <span>Subtotal</span>
                <span className="font-mono tabular-nums">${basePrice.toFixed(2)}</span>
              </div>
              
              {promoApplied && (
                <div className="flex justify-between items-center text-emerald-400">
                  <span>Promotion (15% discount)</span>
                  <span className="font-mono tabular-nums">-${discountAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between items-center text-stone-400">
                <span>Estimated Tax (8.25%)</span>
                <span className="font-mono tabular-nums">${taxAmount.toFixed(2)}</span>
              </div>

              <div className="pt-3 border-t border-stone-800 flex justify-between items-baseline">
                <span className="text-sm font-semibold text-white">Total due now</span>
                <div className="text-right">
                  <div className="text-2xl font-bold font-mono tabular-nums text-white">
                    ${totalAmount.toFixed(2)}
                  </div>
                  <span className="text-[11px] text-stone-500">{intervalLabel}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stripe Security Footer */}
          <div className="mt-8 pt-4 border-t border-stone-800/80 flex items-center justify-between text-[11px] text-stone-400">
            <div className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>256-bit SSL encrypted</span>
            </div>
            <div className="font-semibold tracking-wider uppercase text-stone-300">
              Powered by <span className="font-bold text-white">stripe</span>
            </div>
          </div>
        </div>

        {/* Right Column: Stripe Payment Form */}
        <div className="md:col-span-7 p-6 sm:p-8 bg-white dark:bg-stone-900 flex flex-col justify-between">
          {status === 'success' ? (
            <div className="flex flex-col items-center justify-center py-12 text-center h-full">
              <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-4 animate-bounce">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-bold text-stone-900 dark:text-stone-100">Payment Processed Successfully</h4>
              <p className="text-xs text-stone-600 dark:text-stone-400 mt-2 max-w-sm">
                Reference ID: <span className="font-mono font-medium text-stone-900 dark:text-stone-100">{confirmedId}</span>
              </p>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                Receipt and booking confirmation have been issued to Tsoaelat.s@gmail.com
              </p>
              <div className="mt-6 flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <ShieldCheck className="w-4 h-4" />
                <span>Status: payment_status set to &apos;Paid&apos;</span>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Express Checkout Badge */}
              <div className="space-y-2">
                <div className="text-[11px] uppercase tracking-wider text-stone-500 dark:text-stone-400 font-semibold">
                  Express Checkout
                </div>
                <button
                  type="button"
                  onClick={handleProcessPayment}
                  disabled={status === 'processing'}
                  className="w-full py-2.5 px-4 bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-stone-200 text-white dark:text-stone-900 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-xs disabled:opacity-50"
                >
                  <span>Pay with</span>
                  <span className="font-bold tracking-tight text-amber-300 dark:text-amber-600">Link</span>
                  <span className="text-[11px] opacity-75">· 1-click test checkout</span>
                </button>
              </div>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-stone-200 dark:border-stone-800"></div>
                <span className="flex-shrink mx-3 text-[11px] text-stone-400 dark:text-stone-500 font-medium">Or pay with card</span>
                <div className="flex-grow border-t border-stone-200 dark:border-stone-800"></div>
              </div>

              {/* Card Form */}
              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                    Cardholder Name
                  </label>
                  <input
                    type="text"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-stone-300 dark:border-stone-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900 dark:focus:ring-stone-400 bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                    placeholder="Jane Doe"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-stone-700 dark:text-stone-300">
                      Card Details
                    </label>
                    <span className="text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800 font-mono">
                      Test Mode (4242)
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs font-mono border border-stone-300 dark:border-stone-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900 dark:focus:ring-stone-400 bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                      placeholder="1234 5678 9012 3456"
                    />
                    <CreditCard className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                      Expiration
                    </label>
                    <input
                      type="text"
                      value={cardExp}
                      onChange={(e) => setCardExp(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono border border-stone-300 dark:border-stone-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900 dark:focus:ring-stone-400 bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                      placeholder="MM/YY"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                      CVC / CVV
                    </label>
                    <input
                      type="text"
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono border border-stone-300 dark:border-stone-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900 dark:focus:ring-stone-400 bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                      placeholder="CVC"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                      Country
                    </label>
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-stone-300 dark:border-stone-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900 dark:focus:ring-stone-400 bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                    >
                      <option>United States</option>
                      <option>United Kingdom</option>
                      <option>Switzerland</option>
                      <option>Japan</option>
                      <option>Singapore</option>
                      <option>Germany</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                      Postal Code / ZIP
                    </label>
                    <input
                      type="text"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono border border-stone-300 dark:border-stone-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900 dark:focus:ring-stone-400 bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                      placeholder="94103"
                    />
                  </div>
                </div>

                {/* Promo Code section */}
                {!promoApplied ? (
                  <form onSubmit={handleApplyPromo} className="pt-1">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value)}
                          placeholder="Promo code (e.g. TTG2026)"
                          className="w-full pl-8 pr-3 py-1.5 text-xs font-mono uppercase border border-stone-200 dark:border-stone-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900 dark:focus:ring-stone-400 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                        />
                        <Tag className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2" />
                      </div>
                      <button
                        type="submit"
                        className="px-3 py-1.5 text-xs font-medium text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-lg transition-colors"
                      >
                        Apply
                      </button>
                    </div>
                    {promoError && (
                      <p className="text-[11px] text-red-600 dark:text-red-400 mt-1">{promoError}</p>
                    )}
                  </form>
                ) : (
                  <div className="flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    <span>15% Founder Discount applied</span>
                    <button
                      type="button"
                      onClick={() => setPromoApplied(false)}
                      className="text-[11px] underline text-emerald-800 dark:text-emerald-200"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-3">
                <button
                  type="button"
                  onClick={handleProcessPayment}
                  disabled={status === 'processing'}
                  className="w-full py-3 px-4 bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-stone-200 active:scale-[0.99] text-white dark:text-stone-900 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-all disabled:opacity-50"
                >
                  {status === 'processing' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Authorizing with Stripe...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>
                        {checkoutData.type === 'subscription' 
                          ? `Subscribe · $${totalAmount.toFixed(2)}${intervalLabel}` 
                          : `Pay $${totalAmount.toFixed(2)} & Book Seat`}
                      </span>
                    </>
                  )}
                </button>
                <p className="text-[11px] text-center text-stone-500 dark:text-stone-400 mt-2">
                  By clicking confirm, you authorize TTG via Stripe to process your payment.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
