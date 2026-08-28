import React, { useState } from 'react';
import { ShoppingBag, X, Plus, Minus, Trash2, Send, ChefHat, MessageSquareQuote } from 'lucide-react';
import { CartItem } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  tableNumber: string;
  onUpdateQuantity: (menuItemId: number, delta: number) => void;
  onRemoveItem: (menuItemId: number) => void;
  onUpdateNotes: (menuItemId: number, notes: string) => void;
  onOrderSuccess: (order: any) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  tableNumber,
  onUpdateQuantity,
  onRemoveItem,
  onUpdateNotes,
  onOrderSuccess,
}) => {
  const [specialNotes, setSpecialNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const subtotal = items.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);
  const tax = Math.round(subtotal * 0.1 * 100) / 100;
  const total = Math.round((subtotal + tax) * 100) / 100;

  const handlePlaceOrder = async () => {
    if (items.length === 0) return;
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const payload = {
        tableNumber,
        specialNotes: specialNotes.trim() || undefined,
        items: items.map((i) => ({
          menuItemId: i.menuItem.id,
          quantity: i.quantity,
          notes: i.notes || undefined,
        })),
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to submit order');
      }

      const createdOrder = await res.json();
      setSpecialNotes('');
      onOrderSuccess(createdOrder);
      onClose();
    } catch (err: any) {
      console.error('Order error:', err);
      setErrorMsg(err.message || 'Something went wrong while placing order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-lg bg-orange-600/20 text-orange-400 border border-orange-500/30">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold font-['Outfit']">Your Order Cart</h2>
                <p className="text-xs text-orange-400 font-mono font-medium">Table #{tableNumber}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Error notification */}
          {errorMsg && (
            <div className="bg-rose-50 border-l-4 border-rose-500 p-3 text-rose-700 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-3 text-slate-300">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <p className="font-bold text-slate-700 text-sm mb-1">Your cart is empty</p>
                <p className="text-xs text-slate-500 max-w-xs">
                  Explore our chef’s creations and tap "+ Add" on any item to begin your order.
                </p>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.menuItem.id}
                  className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 shadow-sm hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-900 text-sm leading-snug">
                        {item.menuItem.name}
                      </h4>
                      <p className="text-xs font-semibold text-orange-600 mt-0.5 font-mono">
                        ${(item.menuItem.price * item.quantity).toFixed(2)}{' '}
                        <span className="text-[11px] text-slate-400 font-normal">
                          (${item.menuItem.price.toFixed(2)} ea)
                        </span>
                      </p>
                    </div>

                    <button
                      onClick={() => onRemoveItem(item.menuItem.id)}
                      className="text-slate-400 hover:text-rose-500 p-1 transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Quantity and Notes */}
                  <div className="mt-3 flex items-center justify-between gap-3 pt-2 border-t border-slate-200/60">
                    <div className="flex items-center space-x-2 bg-white rounded-lg p-1 border border-slate-200 shadow-xs">
                      <button
                        onClick={() => onUpdateQuantity(item.menuItem.id, -1)}
                        className="w-6 h-6 rounded flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-bold font-mono px-1.5 text-slate-800">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(item.menuItem.id, 1)}
                        className="w-6 h-6 rounded flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <input
                      type="text"
                      placeholder="Special note (e.g. No ice)..."
                      value={item.notes || ''}
                      onChange={(e) => onUpdateNotes(item.menuItem.id, e.target.value)}
                      className="flex-1 text-[11px] bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Summary & Place Order */}
          {items.length > 0 && (
            <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
              {/* Special instructions for table */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1 mb-1">
                  <MessageSquareQuote className="w-3.5 h-3.5 text-orange-500" />
                  Order Instructions / Dietary Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Serve appetizers together, allergy info..."
                  value={specialNotes}
                  onChange={(e) => setSpecialNotes(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-orange-500 shadow-xs"
                />
              </div>

              {/* Price Breakdown */}
              <div className="space-y-1.5 pt-2 border-t border-slate-200/80 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-mono font-medium">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Estimated Tax (10%)</span>
                  <span className="font-mono font-medium">${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-900 pt-1 border-t border-slate-200">
                  <span>Round Total</span>
                  <span className="font-mono text-orange-600">${total.toFixed(2)}</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={handlePlaceOrder}
                disabled={isSubmitting || items.length === 0}
                className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-lg shadow-orange-600/30 hover:from-orange-500 hover:to-amber-500 active:scale-[0.99] transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Sending to Kitchen...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Order to Kitchen (${total.toFixed(2)})</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
