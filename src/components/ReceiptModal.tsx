import React, { useState } from 'react';
import {
  X,
  Printer,
  CheckCircle,
  CreditCard,
  Banknote,
  QrCode,
  ArrowRightLeft,
  Receipt as ReceiptIcon,
} from 'lucide-react';
import { TableSession } from '../types';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: TableSession | null;
  tableNumber: string;
  onSettlePayment?: (sessionId: string, method: string) => Promise<void>;
  isCashierView?: boolean;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  session,
  tableNumber,
  onSettlePayment,
  isCashierView = false,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'CASH' | 'QR_PAY' | 'TRANSFER'>('CARD');
  const [isSettling, setIsSettling] = useState(false);

  if (!isOpen || !session) return null;

  const validOrders = (session.orders || []).filter((o) => o.status !== 'CANCELLED');
  const subtotal = validOrders.reduce((sum, o) => sum + o.subtotal, 0);
  const tax = validOrders.reduce((sum, o) => sum + o.tax, 0);
  const total = validOrders.reduce((sum, o) => sum + o.total, 0);

  const handleSettle = async () => {
    if (!onSettlePayment) return;
    setIsSettling(true);
    try {
      await onSettlePayment(session.id, paymentMethod);
      onClose();
    } catch (e) {
      console.error('Settle payment error:', e);
    } finally {
      setIsSettling(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity no-print"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl z-10 border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="no-print absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Printable Receipt Card */}
        <div className="text-center pb-4 border-b border-dashed border-slate-300">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-orange-100 text-orange-600 mb-2">
            <ReceiptIcon className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 font-['Outfit']">
            Gourmet<span className="text-orange-600">OS</span> Bistro
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">100 Culinary Avenue, Suite 400</p>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200 font-mono">
            <div>
              <span className="text-slate-400 block text-[10px]">TABLE</span>
              <span className="font-bold text-slate-900 text-sm">#{tableNumber}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">SESSION</span>
              <span className="font-bold text-slate-800">{session.id.slice(0, 8)}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">DATE</span>
              <span className="font-bold text-slate-800">
                {new Date(session.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        </div>

        {/* Itemized Order Breakdown */}
        <div className="py-4 space-y-4 max-h-72 overflow-y-auto pr-1">
          {validOrders.length === 0 ? (
            <p className="text-center text-xs text-slate-400 py-4">No active orders placed yet.</p>
          ) : (
            validOrders.map((order, oIdx) => (
              <div key={order.id} className="text-xs">
                <div className="flex items-center justify-between font-bold text-slate-700 mb-1.5 pb-1 border-b border-slate-100">
                  <span className="text-orange-600 font-mono">
                    Round #{oIdx + 1} ({order.orderNumber})
                  </span>
                  <span className="text-slate-400 font-normal">
                    {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="space-y-1 pl-1">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-slate-800">
                      <div className="flex-1">
                        <span>{item.quantity}x {item.menuItem?.name || 'Item'}</span>
                        {item.notes && (
                          <span className="text-[10px] text-slate-400 block italic pl-3">
                            "{item.notes}"
                          </span>
                        )}
                      </div>
                      <span className="font-mono font-medium">
                        ${(item.unitPrice * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Totals */}
        <div className="pt-3 border-t border-dashed border-slate-300 space-y-1.5 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal</span>
            <span className="font-mono font-medium">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Sales Tax (10%)</span>
            <span className="font-mono font-medium">${tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-200">
            <span>Grand Total</span>
            <span className="font-mono text-orange-600">${total.toFixed(2)}</span>
          </div>
        </div>

        {/* Settlement Payment Section (For Cashier) */}
        {isCashierView && session.status === 'ACTIVE' && (
          <div className="no-print mt-5 pt-4 border-t border-slate-200">
            <label className="text-xs font-bold text-slate-700 block mb-2">
              Select Settlement Method:
            </label>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[
                { id: 'CARD', label: 'Credit Card', icon: CreditCard },
                { id: 'CASH', label: 'Cash', icon: Banknote },
                { id: 'QR_PAY', label: 'QR Pay', icon: QrCode },
                { id: 'TRANSFER', label: 'Transfer', icon: ArrowRightLeft },
              ].map((m) => {
                const Icon = m.icon;
                const active = paymentMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id as any)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border text-[11px] font-bold transition-all ${
                      active
                        ? 'border-orange-500 bg-orange-50 text-orange-700 ring-2 ring-orange-500/20'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-4 h-4 mb-1" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="px-3 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-1.5 text-xs font-bold"
              >
                <Printer className="w-4 h-4" />
                <span>Print</span>
              </button>

              <button
                type="button"
                onClick={handleSettle}
                disabled={isSettling}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isSettling ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Confirm Settlement & Reset Table</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Customer View Print / Done Button */}
        {!isCashierView && (
          <div className="no-print mt-5 pt-3 border-t border-slate-200 flex gap-2">
            <button
              onClick={handlePrint}
              className="flex-1 py-2.5 border border-slate-300 hover:bg-slate-50 rounded-xl text-slate-700 text-xs font-bold flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Print Receipt</span>
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
