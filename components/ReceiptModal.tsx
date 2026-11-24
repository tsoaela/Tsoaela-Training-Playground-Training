import React from 'react';
import { X, Printer, CheckCircle2, Shield } from 'lucide-react';
import { InvoiceReceipt } from '../types';
import { TTG_LOGO_URL } from '../utils/pdfBranding';

interface ReceiptModalProps {
  receipt: InvoiceReceipt | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ receipt, onClose }) => {
  if (!receipt) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div 
        className="fixed inset-0 bg-stone-950/75 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden z-10 my-6">
        {/* Receipt Controls */}
        <div className="bg-stone-100 dark:bg-stone-950 px-6 py-3 flex items-center justify-between border-b border-stone-200 dark:border-stone-800">
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-400">
            Receipt & Invoice
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="p-1.5 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white rounded hover:bg-stone-200 dark:hover:bg-stone-800 text-xs flex items-center gap-1"
              title="Print Receipt"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded hover:bg-stone-200 dark:hover:bg-stone-800"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Body */}
        <div className="p-8 space-y-6">
          <div className="flex items-start justify-between border-b border-stone-200 dark:border-stone-800 pb-5">
            <div className="flex items-center gap-3">
              <img
                src={TTG_LOGO_URL}
                alt="Tsoaela Training Ground Platform Logo"
                referrerPolicy="no-referrer"
                className="h-12 w-auto rounded-xl object-contain bg-white p-1 ring-1 ring-stone-200 dark:ring-stone-700 shrink-0"
              />
              <div>
                <h3 className="text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100">TTG Institutional</h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">TTG - Tsoaela Training Ground Platform</p>
                <p className="text-[11px] text-stone-400 dark:text-stone-500">Tax ID: US-EIN-94819024</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono font-semibold text-stone-900 dark:text-stone-100">{receipt.invoice_number}</span>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-mono mt-0.5">{receipt.date}</p>
              <div className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-3 h-3" />
                <span>PAID</span>
              </div>
            </div>
          </div>

          {/* Customer / Payment details */}
          <div className="grid grid-cols-2 gap-4 text-xs text-stone-600 dark:text-stone-400">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 block mb-1">
                Billed To
              </span>
              <p className="font-medium text-stone-900 dark:text-stone-100">Tsoaelat S.</p>
              <p>Tsoaelat.s@gmail.com</p>
              <p>San Francisco, CA</p>
            </div>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 block mb-1">
                Payment Info
              </span>
              <p className="font-medium text-stone-900 dark:text-stone-100">{receipt.payment_method}</p>
              <p className="font-mono text-[11px] text-stone-500 dark:text-stone-400 break-all">{receipt.payment_intent_id}</p>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">Processed by Stripe</p>
            </div>
          </div>

          {/* Line items */}
          <div className="border border-stone-200 dark:border-stone-800 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 dark:bg-stone-850 border-b border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 font-medium">
                <tr>
                  <th className="py-2.5 px-3">Item Description</th>
                  <th className="py-2.5 px-3 text-center">Qty</th>
                  <th className="py-2.5 px-3 text-right">Price</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800 text-stone-700 dark:text-stone-300">
                {receipt.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-2.5 px-3 font-medium text-stone-900 dark:text-stone-100">{item.description}</td>
                    <td className="py-2.5 px-3 text-center font-mono">{item.quantity}</td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">${item.unit_price.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-stone-900 dark:text-stone-100">${(item.quantity * item.unit_price).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="border-t border-stone-200 dark:border-stone-800 pt-4 space-y-1.5 text-xs text-stone-600 dark:text-stone-400">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-mono tabular-nums">${receipt.amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-stone-500 dark:text-stone-400">
              <span>Taxes included</span>
              <span className="font-mono tabular-nums">$0.00</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-stone-900 dark:text-stone-100 pt-2 border-t border-stone-200 dark:border-stone-800">
              <span>Amount Paid</span>
              <span className="font-mono tabular-nums">${receipt.amount.toFixed(2)} USD</span>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-center gap-1 text-[11px] text-stone-400 dark:text-stone-500">
            <Shield className="w-3.5 h-3.5" />
            <span>Official Stripe Receipt · Guaranteed by TTG Platform</span>
          </div>
        </div>
      </div>
    </div>
  );
};
