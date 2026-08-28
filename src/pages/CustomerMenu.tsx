import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Minus,
  ShoppingBag,
  Clock,
  Flame,
  UtensilsCrossed,
  BellRing,
  Check,
  Receipt,
  Sparkles,
} from 'lucide-react';
import { Category, MenuItem, CartItem, TableSession, Order } from '../types';
import { useSocket } from '../context/SocketContext';
import { CartDrawer } from '../components/CartDrawer';
import { CallWaiterModal } from '../components/CallWaiterModal';

export const CustomerMenu: React.FC = () => {
  const { tableNumber = '01' } = useParams<{ tableNumber: string }>();
  const navigate = useNavigate();
  const { socket, joinRoom } = useSocket();

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCallWaiterOpen, setIsCallWaiterOpen] = useState(false);
  const [activeSession, setActiveSession] = useState<TableSession | null>(null);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [selectedItemForModal, setSelectedItemForModal] = useState<MenuItem | null>(null);
  const [modalItemNote, setModalItemNote] = useState('');
  const [modalItemQty, setModalItemQty] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch Menu and Table Session
  useEffect(() => {
    const fetchMenuAndSession = async () => {
      try {
        setIsLoading(true);
        // 1. Fetch menu
        const menuRes = await fetch('/api/menu');
        if (menuRes.ok) {
          const menuData = await menuRes.json();
          setCategories(menuData);
        }

        // 2. Fetch or initialize active session for table
        const sessionRes = await fetch(`/api/tables/${tableNumber}/session`, {
          method: 'POST',
        });
        if (sessionRes.ok) {
          const sessionData = await sessionRes.json();
          setActiveSession(sessionData);
          setActiveOrders(sessionData.orders || []);
        }
      } catch (err) {
        console.error('Failed to load menu/session:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMenuAndSession();
    joinRoom(`table_${tableNumber}`);
  }, [tableNumber]);

  // Listen for real-time WebSocket events for this table
  useEffect(() => {
    if (!socket) return;

    const handleOrderCreated = ({ order, tableNumber: orderTable }: any) => {
      if (orderTable === tableNumber) {
        setActiveOrders((prev) => [...prev, order]);
      }
    };

    const handleOrderStatusUpdated = ({ order, tableNumber: orderTable }: any) => {
      if (orderTable === tableNumber) {
        setActiveOrders((prev) =>
          prev.map((o) => (o.id === order.id ? order : o))
        );
      }
    };

    const handleBillSettled = ({ tableNumber: settledTable }: any) => {
      if (settledTable === tableNumber) {
        setActiveOrders([]);
        setActiveSession(null);
        setCart([]);
      }
    };

    socket.on('order:created', handleOrderCreated);
    socket.on('order:status_updated', handleOrderStatusUpdated);
    socket.on('bill:settled', handleBillSettled);

    return () => {
      socket.off('order:created', handleOrderCreated);
      socket.off('order:status_updated', handleOrderStatusUpdated);
      socket.off('bill:settled', handleBillSettled);
    };
  }, [socket, tableNumber]);

  // Cart operations
  const handleAddToCart = (item: MenuItem, quantity: number = 1, notes: string = '') => {
    setCart((prev) => {
      const existing = prev.find((i) => i.menuItem.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.menuItem.id === item.id
            ? { ...i, quantity: i.quantity + quantity, notes: notes || i.notes }
            : i
        );
      }
      return [...prev, { menuItem: item, quantity, notes }];
    });
  };

  const handleUpdateQuantity = (menuItemId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.menuItem.id === menuItemId) {
            const newQty = i.quantity + delta;
            return newQty > 0 ? { ...i, quantity: newQty } : null;
          }
          return i;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveItem = (menuItemId: number) => {
    setCart((prev) => prev.filter((i) => i.menuItem.id !== menuItemId));
  };

  const handleUpdateNotes = (menuItemId: number, notes: string) => {
    setCart((prev) =>
      prev.map((i) => (i.menuItem.id === menuItemId ? { ...i, notes } : i))
    );
  };

  const handleOrderSuccess = (order: Order) => {
    setCart([]);
    setActiveOrders((prev) => [...prev, order]);
    navigate(`/table/${tableNumber}/orders`);
  };

  // Open item modal for customization
  const openItemModal = (item: MenuItem) => {
    setSelectedItemForModal(item);
    setModalItemQty(1);
    setModalItemNote('');
  };

  // Calculate cart badge counts
  const totalCartCount = cart.reduce((sum, i) => sum + i.quantity, 0);
  const totalCartPrice = cart.reduce((sum, i) => sum + i.menuItem.price * i.quantity, 0);

  // Filtered Menu Items
  const allItems: MenuItem[] = categories.flatMap((c) =>
    (c.items || []).map((item) => ({ ...item, category: c }))
  );

  const filteredItems = allItems.filter((item) => {
    const matchesCategory =
      selectedCategory === 'ALL' || item.categoryId === selectedCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const pendingCookingCount = activeOrders.filter(
    (o) => o.status === 'PENDING' || o.status === 'PREPARING' || o.status === 'READY'
  ).length;

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-orange-950 text-white pt-6 pb-8 px-4 sm:px-6 shadow-xl border-b border-orange-900/30">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/30 border border-orange-400/30">
                <UtensilsCrossed className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-orange-500/20 text-orange-400 border border-orange-500/30 font-mono">
                    Table #{tableNumber}
                  </span>
                  <span className="inline-flex items-center text-[10px] text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1 animate-pulse" />
                    Session Active
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black font-['Outfit'] mt-1 bg-gradient-to-r from-white via-orange-100 to-amber-200 bg-clip-text text-transparent">
                  Gourmet Dining Experience
                </h1>
              </div>
            </div>

            {/* Top Quick Actions */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsCallWaiterOpen(true)}
                className="px-3 py-2 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <BellRing className="w-4 h-4 text-orange-400" />
                <span className="hidden sm:inline">Call Server</span>
              </button>

              {activeOrders.length > 0 && (
                <button
                  onClick={() => navigate(`/table/${tableNumber}/orders`)}
                  className="px-3 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-orange-600/30 flex items-center gap-1.5"
                >
                  <Receipt className="w-4 h-4" />
                  <span>Orders ({activeOrders.length})</span>
                </button>
              )}
            </div>
          </div>

          {/* Search Bar */}
          <div className="mt-5 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search chef specials, pastas, drinks, desserts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700/80 text-white placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all shadow-inner"
            />
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-5">
        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              selectedCategory === 'ALL'
                ? 'bg-slate-900 text-white shadow-md shadow-slate-900/20'
                : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-orange-500" />
            <span>Full Menu</span>
          </button>
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                    : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-100'
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>

        {/* Active Order Alert Banner (if in kitchen) */}
        {pendingCookingCount > 0 && (
          <div
            onClick={() => navigate(`/table/${tableNumber}/orders`)}
            className="mt-3 mb-2 p-3 bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/10 border border-orange-500/30 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-orange-500/15 transition-all shadow-xs"
          >
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-orange-600 text-white flex items-center justify-center">
                <Clock className="w-4 h-4 animate-spin" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-slate-900">
                  {pendingCookingCount} {pendingCookingCount === 1 ? 'Order' : 'Orders'} in Preparation
                </p>
                <p className="text-[11px] text-slate-500">
                  Tap to track live chef progress & kitchen timeline
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-orange-600 flex items-center gap-1">
              Track ➔
            </span>
          </div>
        )}

        {/* Menu Items Grid */}
        {isLoading ? (
          <div className="py-20 text-center">
            <div className="w-10 h-10 border-3 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-bold text-slate-500">Loading culinary selections...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 mt-4">
            <p className="text-slate-400 text-sm font-semibold">No menu items match your search.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
              }}
              className="mt-3 px-4 py-2 bg-orange-600 text-white text-xs font-bold rounded-xl"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
            {filteredItems.map((item) => {
              const cartItem = cart.find((i) => i.menuItem.id === item.id);
              const inCartQty = cartItem ? cartItem.quantity : 0;

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-orange-200 transition-all flex flex-col justify-between group"
                >
                  <div className="flex gap-3">
                    {/* Item Image */}
                    {item.imageUrl && (
                      <div
                        className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden shrink-0 bg-slate-100 cursor-pointer"
                        onClick={() => openItemModal(item)}
                      >
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        {item.isSpecial && (
                          <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-orange-600 text-white text-[9px] font-black uppercase tracking-wider flex items-center gap-0.5 shadow-sm">
                            <Flame className="w-2.5 h-2.5" />
                            Special
                          </div>
                        )}
                      </div>
                    )}

                    {/* Item Info */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-1">
                          <h3
                            onClick={() => openItemModal(item)}
                            className="font-extrabold text-slate-900 text-sm leading-snug cursor-pointer hover:text-orange-600 transition-colors"
                          >
                            {item.name}
                          </h3>
                        </div>

                        <p className="text-slate-500 text-[11px] line-clamp-2 mt-1 leading-relaxed">
                          {item.description}
                        </p>
                      </div>

                      <div className="mt-2 flex items-center justify-between pt-1">
                        <div>
                          <span className="text-base font-extrabold text-slate-900 font-['Outfit']">
                            ${item.price.toFixed(2)}
                          </span>
                          <span className="ml-2 text-[10px] text-slate-400 font-medium">
                            ~{item.prepTimeMinutes}m prep
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => openItemModal(item)}
                      className="text-[11px] font-bold text-slate-500 hover:text-slate-800 transition-colors"
                    >
                      Customise & Details ➔
                    </button>

                    {!item.isAvailable ? (
                      <span className="px-3 py-1 text-[11px] font-bold text-slate-400 bg-slate-100 rounded-lg">
                        Sold Out
                      </span>
                    ) : inCartQty > 0 ? (
                      <div className="flex items-center space-x-2 bg-orange-50 border border-orange-200 rounded-xl p-1">
                        <button
                          onClick={() => handleUpdateQuantity(item.id, -1)}
                          className="w-6 h-6 rounded-lg bg-white text-orange-700 flex items-center justify-center shadow-xs hover:bg-orange-100"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-black text-orange-900 px-1 font-mono">
                          {inCartQty}
                        </span>
                        <button
                          onClick={() => handleUpdateQuantity(item.id, 1)}
                          className="w-6 h-6 rounded-lg bg-orange-600 text-white flex items-center justify-center shadow-xs hover:bg-orange-500"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleAddToCart(item, 1)}
                        className="px-3.5 py-1.5 bg-slate-900 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1 active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Bottom Cart Bar */}
      {totalCartCount > 0 && (
        <div className="fixed bottom-3 inset-x-0 px-4 max-w-lg mx-auto z-40 animate-in slide-in-from-bottom duration-300">
          <div
            onClick={() => setIsCartOpen(true)}
            className="bg-gradient-to-r from-slate-900 via-orange-950 to-slate-900 text-white p-3.5 rounded-2xl shadow-2xl border border-orange-500/30 flex items-center justify-between cursor-pointer hover:scale-[1.01] transition-transform"
          >
            <div className="flex items-center space-x-3">
              <div className="relative p-2.5 rounded-xl bg-orange-600 text-white shadow-md shadow-orange-600/30">
                <ShoppingBag className="w-5 h-5" />
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white text-orange-700 font-extrabold text-[11px] flex items-center justify-center shadow-md font-mono">
                  {totalCartCount}
                </span>
              </div>
              <div>
                <p className="text-xs font-bold text-orange-200">
                  {totalCartCount} {totalCartCount === 1 ? 'item' : 'items'} in order
                </p>
                <p className="text-base font-extrabold font-['Outfit'] text-white">
                  ${totalCartPrice.toFixed(2)}
                </p>
              </div>
            </div>

            <button className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-extrabold shadow-md shadow-orange-600/30 transition-all flex items-center gap-1.5">
              <span>View Cart</span>
              <span>➔</span>
            </button>
          </div>
        </div>
      )}

      {/* Item Customization Modal */}
      {selectedItemForModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setSelectedItemForModal(null)}
          />
          <div className="relative bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl z-10 border border-slate-100 animate-in fade-in zoom-in-95">
            {selectedItemForModal.imageUrl && (
              <div className="relative h-48 w-full bg-slate-100">
                <img
                  src={selectedItemForModal.imageUrl}
                  alt={selectedItemForModal.name}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => setSelectedItemForModal(null)}
                  className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-900/60 text-white hover:bg-slate-900"
                >
                  ✕
                </button>
              </div>
            )}

            <div className="p-5">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 font-['Outfit']">
                    {selectedItemForModal.name}
                  </h3>
                  <p className="text-base font-extrabold text-orange-600 font-['Outfit'] mt-0.5">
                    ${selectedItemForModal.price.toFixed(2)}
                  </p>
                </div>
                <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  ~{selectedItemForModal.prepTimeMinutes} mins
                </span>
              </div>

              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                {selectedItemForModal.description}
              </p>

              <div className="mt-4">
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Special Notes for Chef
                </label>
                <input
                  type="text"
                  placeholder="e.g. Medium Rare, Dressing on side, No onions..."
                  value={modalItemNote}
                  onChange={(e) => setModalItemNote(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Quantity and Add */}
              <div className="mt-5 flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <div className="flex items-center space-x-2 bg-slate-100 rounded-xl p-1">
                  <button
                    onClick={() => setModalItemQty((q) => Math.max(1, q - 1))}
                    className="w-8 h-8 rounded-lg bg-white text-slate-700 flex items-center justify-center font-bold shadow-xs hover:bg-slate-200"
                  >
                    -
                  </button>
                  <span className="text-sm font-extrabold font-mono px-2">
                    {modalItemQty}
                  </span>
                  <button
                    onClick={() => setModalItemQty((q) => q + 1)}
                    className="w-8 h-8 rounded-lg bg-white text-slate-700 flex items-center justify-center font-bold shadow-xs hover:bg-slate-200"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={() => {
                    handleAddToCart(selectedItemForModal, modalItemQty, modalItemNote);
                    setSelectedItemForModal(null);
                  }}
                  className="flex-1 py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-600/30 flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>
                    Add to Cart · ${(selectedItemForModal.price * modalItemQty).toFixed(2)}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        tableNumber={tableNumber}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onUpdateNotes={handleUpdateNotes}
        onOrderSuccess={handleOrderSuccess}
      />

      {/* Call Waiter Modal */}
      <CallWaiterModal
        isOpen={isCallWaiterOpen}
        onClose={() => setIsCallWaiterOpen(false)}
        tableNumber={tableNumber}
      />
    </div>
  );
};
