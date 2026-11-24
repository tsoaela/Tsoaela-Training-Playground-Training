import React, { useState } from 'react';
import { RetreatEvent, Booking, UserProfile } from '../types';
import { Calendar, MapPin, Check, ArrowRight, ShieldCheck, QrCode, Ticket, X } from 'lucide-react';
import { CheckoutMode } from './StripeCheckoutModal';

interface RetreatsTabProps {
  events: RetreatEvent[];
  bookings: Booking[];
  user: UserProfile;
  onInitiateBookingCheckout: (mode: CheckoutMode) => void;
  onViewReceipt: (invoiceId: string) => void;
  targetEventId?: string;
  onClearTargetEvent?: () => void;
}

export const RetreatsTab: React.FC<RetreatsTabProps> = ({
  events,
  bookings,
  user,
  onInitiateBookingCheckout,
  targetEventId,
  onClearTargetEvent,
}) => {
  const [selectedEventId, setSelectedEventId] = useState<string>(targetEventId || events[0]?.id || '');

  React.useEffect(() => {
    if (targetEventId) {
      const found = events.find(e => e.id === targetEventId);
      if (found) {
        setSelectedEventId(found.id);
        onClearTargetEvent?.();
      }
    }
  }, [targetEventId, events, onClearTargetEvent]);
  const [selectedTicketType, setSelectedTicketType] = useState<'Virtual Pass' | 'In-Person Ticket'>('In-Person Ticket');
  const [seatCount, setSeatCount] = useState<number>(1);
  const [attendeeName, setAttendeeName] = useState<string>(user.name || 'Tsoaelat S.');
  const [attendeeEmail, setAttendeeEmail] = useState<string>(user.email || 'Tsoaelat.s@gmail.com');
  const [specialNotes, setSpecialNotes] = useState<string>('');

  const [activeTicketBooking, setActiveTicketBooking] = useState<Booking | null>(null);

  const currentEvent = events.find(e => e.id === selectedEventId) || events[0];

  const currentPrice = selectedTicketType === 'Virtual Pass'
    ? currentEvent.virtual_price
    : currentEvent.in_person_price;

  const totalPrice = currentPrice * seatCount;

  const handleBookSeatClick = (e: React.FormEvent) => {
    e.preventDefault();
    onInitiateBookingCheckout({
      type: 'retreat',
      event: currentEvent,
      ticketType: selectedTicketType,
      seats: seatCount,
      attendeeName: attendeeName.trim() || user.name,
      attendeeEmail: attendeeEmail.trim() || user.email,
    });
  };

  return (
    <div className="space-y-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Editorial Header */}
      <div className="border-b border-stone-200 dark:border-stone-800 pb-8">
        <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 mb-2">
          <span>TTG Immersions</span>
          <span aria-hidden="true">·</span>
          <span>Executive Retreats & Masterclasses</span>
          <span aria-hidden="true">·</span>
          <span>Global Destinations 2026</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-stone-900 dark:text-stone-100 text-balance">
              TTG Retreats & Strategic Sanctuaries
            </h1>
            <p className="mt-2 text-stone-600 dark:text-stone-400 max-w-2xl text-sm sm:text-base">
              Distraction-free physical environments designed for profound focus, executive renewal, and high-stakes decision synthesis.
            </p>
          </div>

          <div className="text-xs text-stone-500 dark:text-stone-400 font-mono flex items-center gap-1.5 bg-stone-100 dark:bg-stone-800 px-3 py-1.5 rounded-lg shrink-0">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Stripe Verified Checkout Flow</span>
          </div>
        </div>
      </div>

      {/* Main Retreat Experience Showcase & Booking Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left 7 Columns: Event Details & Visuals */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Event Selector Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {events.map((event) => (
              <button
                key={event.id}
                type="button"
                onClick={() => setSelectedEventId(event.id)}
                className={`px-4 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
                  selectedEventId === event.id
                    ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-xs'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
                }`}
              >
                {event.location.split(' ')[0]} · {event.country}
              </button>
            ))}
          </div>

          {/* Selected Event Card with Photography */}
          <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden shadow-xs">
            <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-stone-900">
              <img
                src={currentEvent.image_url}
                alt={currentEvent.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
              
              <div className="absolute bottom-6 left-6 right-6 text-white space-y-1.5">
                <div className="flex items-center gap-3 text-xs text-stone-300 font-mono">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                    {currentEvent.location}, {currentEvent.country}
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    {currentEvent.dates}
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  {currentEvent.title}
                </h2>
                <p className="text-xs sm:text-sm text-stone-200 line-clamp-2">
                  {currentEvent.tagline}
                </p>
              </div>

              {/* Remaining Seats Tag */}
              <div className="absolute top-4 right-4 bg-stone-900/80 backdrop-blur-md border border-white/20 text-white text-[11px] font-mono px-2.5 py-1 rounded-md">
                {currentEvent.available_seats} of {currentEvent.total_seats} seats remaining
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              <div>
                <h4 className="text-xs uppercase tracking-wider text-stone-500 dark:text-stone-400 font-semibold mb-2">
                  Curriculum & Atmosphere
                </h4>
                <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
                  {currentEvent.description}
                </p>
              </div>

              {/* Key Modules */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs uppercase tracking-wider text-stone-500 dark:text-stone-400 font-semibold">
                  Executive Intensive Modules
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-stone-700 dark:text-stone-300">
                  {currentEvent.key_modules.map((mod, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-stone-50 dark:bg-stone-800/60 border border-stone-200/60 dark:border-stone-700">
                      <Check className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                      <span>{mod}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Faculty */}
              <div className="pt-2 text-xs text-stone-600 dark:text-stone-400">
                <span className="font-semibold text-stone-900 dark:text-stone-100 block mb-1">Presiding Faculty:</span>
                <p>{currentEvent.faculty.join(' · ')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right 5 Columns: Booking & Stripe Checkout Flow */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 sm:p-7 shadow-xs sticky top-24">
            
            <div className="border-b border-stone-200 dark:border-stone-800 pb-4 mb-5">
              <span className="text-[11px] uppercase tracking-wider text-amber-800 dark:text-amber-400 font-bold block mb-1">
                Direct Reservation
              </span>
              <h3 className="text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
                Book Your Seat
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Select pass type and complete your one-time Stripe checkout.
              </p>
            </div>

            <form onSubmit={handleBookSeatClick} className="space-y-5">
              
              {/* Ticket Option Selector */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-2">
                  Select Ticket Option
                </label>
                <div className="grid grid-cols-2 gap-3">
                  
                  {/* Virtual Pass */}
                  <div
                    onClick={() => setSelectedTicketType('Virtual Pass')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      selectedTicketType === 'Virtual Pass'
                        ? 'border-stone-900 dark:border-stone-100 bg-stone-50 dark:bg-stone-800/80 ring-1 ring-stone-900 dark:ring-stone-100'
                        : 'border-stone-200 dark:border-stone-750 hover:border-stone-300 dark:hover:border-stone-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-900 dark:text-stone-100">Virtual Pass</span>
                      <span className="font-mono text-xs font-semibold text-stone-900 dark:text-stone-100 tabular-nums">
                        ${currentEvent.virtual_price}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 line-clamp-2">
                      Live stream, session recordings, interactive chat breakout
                    </p>
                  </div>

                  {/* In-Person Ticket */}
                  <div
                    onClick={() => setSelectedTicketType('In-Person Ticket')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      selectedTicketType === 'In-Person Ticket'
                        ? 'border-stone-900 dark:border-stone-100 bg-stone-50 dark:bg-stone-800/80 ring-1 ring-stone-900 dark:ring-stone-100'
                        : 'border-stone-200 dark:border-stone-750 hover:border-stone-300 dark:hover:border-stone-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-900 dark:text-stone-100">In-Person</span>
                      <span className="font-mono text-xs font-semibold text-stone-900 dark:text-stone-100 tabular-nums">
                        ${currentEvent.in_person_price}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 line-clamp-2">
                      7-day luxury villa suite, dining, 1-on-1 advisory & workshops
                    </p>
                  </div>

                </div>
              </div>

              {/* Attendee Details Form */}
              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                    Primary Attendee Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={attendeeName}
                    onChange={(e) => setAttendeeName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-stone-300 dark:border-stone-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900 dark:focus:ring-stone-400 bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                    placeholder="e.g. Tsoaelat S."
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                    Confirmation & Ticket Email
                  </label>
                  <input
                    type="email"
                    required
                    value={attendeeEmail}
                    onChange={(e) => setAttendeeEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-stone-300 dark:border-stone-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900 dark:focus:ring-stone-400 bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                    placeholder="Tsoaelat.s@gmail.com"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                      Seats Required
                    </label>
                    <select
                      value={seatCount}
                      onChange={(e) => setSeatCount(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs border border-stone-300 dark:border-stone-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900 dark:focus:ring-stone-400 bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-mono"
                    >
                      <option value={1}>1 Seat</option>
                      <option value={2}>2 Seats</option>
                      <option value={3}>3 Seats (Corporate)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                      Dietary / Room Notes
                    </label>
                    <input
                      type="text"
                      value={specialNotes}
                      onChange={(e) => setSpecialNotes(e.target.value)}
                      placeholder="Optional notes"
                      className="w-full px-3 py-2 text-xs border border-stone-300 dark:border-stone-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900 dark:focus:ring-stone-400 bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                    />
                  </div>
                </div>
              </div>

              {/* Order Total Line */}
              <div className="pt-3 border-t border-stone-200 dark:border-stone-800 space-y-1.5 text-xs text-stone-600 dark:text-stone-400">
                <div className="flex justify-between">
                  <span>Price per seat ({selectedTicketType})</span>
                  <span className="font-mono tabular-nums">${currentPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Seats</span>
                  <span className="font-mono tabular-nums">× {seatCount}</span>
                </div>
                <div className="flex justify-between text-stone-900 dark:text-stone-100 font-bold text-sm pt-2 border-t border-stone-100 dark:border-stone-800">
                  <span>Total Amount</span>
                  <span className="font-mono tabular-nums text-lg">${totalPrice.toFixed(2)} USD</span>
                </div>
              </div>

              {/* Book Seat Button */}
              <button
                type="submit"
                className="w-full py-3.5 px-4 bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-stone-200 active:scale-[0.99] text-white dark:text-stone-900 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-all"
              >
                <span>Book Seat · Process Stripe Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-stone-400 dark:text-stone-500">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>One-time Stripe Checkout session · Immediate confirmation</span>
              </div>
            </form>
          </div>
        </div>

      </div>

      {/* Confirmed Bookings Table (Prompt 2 Requirement) */}
      <div className="border border-stone-200 dark:border-stone-800 rounded-2xl bg-white dark:bg-stone-900 p-6 sm:p-8 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 dark:border-stone-800 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              <Ticket className="w-3.5 h-3.5 text-stone-700 dark:text-stone-300" />
              <span>Registered Reservations</span>
            </div>
            <h3 className="text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100 mt-0.5">
              Confirmed Retreat Bookings Table
            </h3>
          </div>

          <div className="text-xs text-stone-500 dark:text-stone-400 font-mono">
            {bookings.length} Registered Booking{bookings.length !== 1 ? 's' : ''}
          </div>
        </div>

        {bookings.length === 0 ? (
          <div className="py-8 text-center text-xs text-stone-500 dark:text-stone-400">
            No retreat bookings recorded yet. Select an upcoming retreat above and click &apos;Book Seat&apos;.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 dark:bg-stone-800/60 border-b border-stone-200 dark:border-stone-750 text-stone-500 dark:text-stone-400 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Booking Ref</th>
                  <th className="py-3 px-4">Event & Location</th>
                  <th className="py-3 px-4">Dates</th>
                  <th className="py-3 px-4">Ticket Type</th>
                  <th className="py-3 px-4 text-center">Seats</th>
                  <th className="py-3 px-4 text-right">Amount Paid</th>
                  <th className="py-3 px-4 text-center">Payment Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800 text-stone-700 dark:text-stone-300">
                {bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-stone-50/70 dark:hover:bg-stone-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-stone-900 dark:text-stone-100">
                      {booking.id}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-stone-900 dark:text-stone-100">{booking.event_title}</div>
                      <div className="text-[11px] text-stone-500 dark:text-stone-400">{booking.location}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-stone-600 dark:text-stone-400">
                      {booking.dates}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-stone-800 dark:text-stone-200 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded text-[11px]">
                        {booking.ticket_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono">
                      {booking.seats}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-stone-900 dark:text-stone-100">
                      ${booking.total_amount.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 font-semibold text-[11px] text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <span>{booking.payment_status}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setActiveTicketBooking(booking)}
                        className="px-2.5 py-1 text-xs font-medium text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 rounded transition-colors inline-flex items-center gap-1"
                      >
                        <QrCode className="w-3 h-3" />
                        <span>Pass</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Ticket Pass Modal */}
      {activeTicketBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div 
            className="fixed inset-0 bg-stone-950/70 backdrop-blur-sm"
            onClick={() => setActiveTicketBooking(null)}
          />

          <div className="relative w-full max-w-md bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden z-10 my-6">
            <div className="bg-stone-900 text-white p-6 space-y-2 relative">
              <button
                onClick={() => setActiveTicketBooking(null)}
                className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
              <span className="text-[11px] font-mono uppercase tracking-widest text-amber-400">
                Official Admission Pass
              </span>
              <h3 className="text-xl font-bold">{activeTicketBooking.event_title}</h3>
              <p className="text-xs text-stone-300">{activeTicketBooking.location} · {activeTicketBooking.dates}</p>
            </div>

            <div className="p-6 space-y-4 text-xs text-stone-700 dark:text-stone-300">
              <div className="flex items-center justify-center py-4 bg-stone-50 dark:bg-stone-800 rounded-xl border border-dashed border-stone-300 dark:border-stone-700">
                <div className="text-center space-y-2">
                  <div className="w-32 h-32 mx-auto bg-white p-2 border border-stone-300 rounded-lg flex items-center justify-center">
                    <QrCode className="w-24 h-24 text-stone-900" />
                  </div>
                  <span className="font-mono text-[11px] text-stone-500 dark:text-stone-400 block">
                    {activeTicketBooking.qr_code_ref}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 text-stone-600 dark:text-stone-400">
                <div>
                  <span className="text-[11px] text-stone-400 dark:text-stone-500 uppercase block">Attendee</span>
                  <span className="font-medium text-stone-900 dark:text-stone-100">{activeTicketBooking.attendee_name}</span>
                </div>
                <div>
                  <span className="text-[11px] text-stone-400 dark:text-stone-500 uppercase block">Pass Type</span>
                  <span className="font-medium text-stone-900 dark:text-stone-100">{activeTicketBooking.ticket_type}</span>
                </div>
                <div>
                  <span className="text-[11px] text-stone-400 dark:text-stone-500 uppercase block">Payment Status</span>
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400">Paid · Verified</span>
                </div>
                <div>
                  <span className="text-[11px] text-stone-400 dark:text-stone-500 uppercase block">Seats</span>
                  <span className="font-mono font-medium text-stone-900 dark:text-stone-100">{activeTicketBooking.seats}</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-stone-50 dark:bg-stone-950 border-t border-stone-200 dark:border-stone-800 flex justify-end">
              <button
                onClick={() => setActiveTicketBooking(null)}
                className="px-4 py-2 text-xs font-semibold text-stone-800 dark:text-stone-200 bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 rounded-lg"
              >
                Close Pass
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
