import React, { useState, useEffect } from 'react';
import {
  BellRing,
  CheckCircle2,
  Clock,
  Sparkles,
  Droplets,
  Scroll,
  Utensils,
  UserCheck,
  Receipt,
  HelpCircle,
  Check,
  RotateCcw,
  Volume2,
} from 'lucide-react';
import { Order, AssistanceRequest, Table } from '../types';
import { useSocket } from '../context/SocketContext';
import { sounds } from '../utils/audio';

export const WaiterPaging: React.FC = () => {
  const { socket, joinRoom } = useSocket();
  const [readyOrders, setReadyOrders] = useState<Order[]>([]);
  const [assistanceRequests, setAssistanceRequests] = useState<AssistanceRequest[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial data
  const fetchData = async () => {
    try {
      setIsLoading(true);
      // 1. Fetch ready orders
      const ordersRes = await fetch('/api/orders?status=READY');
      if (ordersRes.ok) {
        setReadyOrders(await ordersRes.json());
      }

      // 2. Fetch open assistance requests
      const assistRes = await fetch('/api/assistance?status=OPEN');
      if (assistRes.ok) {
        setAssistanceRequests(await assistRes.json());
      }

      // 3. Fetch tables
      const tablesRes = await fetch('/api/tables');
      if (tablesRes.ok) {
        setTables(await tablesRes.json());
      }
    } catch (e) {
      console.error('Error fetching waiter dashboard data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    joinRoom('waiter');
  }, []);

  // WebSocket listeners
  useEffect(() => {
    if (!socket) return;

    const handleOrderStatusUpdated = ({ order }: any) => {
      if (order.status === 'READY') {
        setReadyOrders((prev) => {
          if (prev.some((o) => o.id === order.id)) return prev;
          return [order, ...prev];
        });
        sounds.playReadyBell();
      } else {
        setReadyOrders((prev) => prev.filter((o) => o.id !== order.id));
      }
    };

    const handleAssistanceRequested = ({ request }: any) => {
      setAssistanceRequests((prev) => {
        if (prev.some((r) => r.id === request.id)) return prev;
        return [request, ...prev];
      });
      sounds.playAssistancePing();
    };

    const handleAssistanceUpdated = ({ request }: any) => {
      if (request.status === 'RESOLVED') {
        setAssistanceRequests((prev) => prev.filter((r) => r.id !== request.id));
      } else {
        setAssistanceRequests((prev) =>
          prev.map((r) => (r.id === request.id ? request : r))
        );
      }
    };

    const handleTableStatusChanged = (table: Table) => {
      setTables((prev) => prev.map((t) => (t.id === table.id ? { ...t, ...table } : t)));
    };

    socket.on('order:status_updated', handleOrderStatusUpdated);
    socket.on('assistance:requested', handleAssistanceRequested);
    socket.on('assistance:updated', handleAssistanceUpdated);
    socket.on('table:status_changed', handleTableStatusChanged);

    return () => {
      socket.off('order:status_updated', handleOrderStatusUpdated);
      socket.off('assistance:requested', handleAssistanceRequested);
      socket.off('assistance:updated', handleAssistanceUpdated);
      socket.off('table:status_changed', handleTableStatusChanged);
    };
  }, [socket]);

  // Mark Order Delivered / Served
  const handleMarkServed = async (orderId: number) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'SERVED' }),
      });
      if (res.ok) {
        setReadyOrders((prev) => prev.filter((o) => o.id !== orderId));
      }
    } catch (e) {
      console.error('Error marking order served:', e);
    }
  };

  // Resolve Assistance Request
  const handleResolveAssistance = async (id: number) => {
    try {
      const res = await fetch(`/api/assistance/${id}/resolve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'RESOLVED' }),
      });
      if (res.ok) {
        setAssistanceRequests((prev) => prev.filter((r) => r.id !== id));
      }
    } catch (e) {
      console.error('Error resolving assistance:', e);
    }
  };

  const getAssistanceIcon = (type: string) => {
    switch (type) {
      case 'WATER':
        return <Droplets className="w-5 h-5 text-blue-500" />;
      case 'NAPKINS':
        return <Scroll className="w-5 h-5 text-amber-500" />;
      case 'CUTLERY':
        return <Utensils className="w-5 h-5 text-emerald-500" />;
      case 'WAITER':
        return <UserCheck className="w-5 h-5 text-purple-500" />;
      case 'BILL':
        return <Receipt className="w-5 h-5 text-rose-500" />;
      default:
        return <HelpCircle className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-6 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Header */}
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-600/20 text-white">
            <BellRing className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-purple-100 text-purple-700 font-mono">
                Floor Service & Dispatch
              </span>
              <span className="text-xs text-slate-500 font-bold">
                {readyOrders.length} Ready Pickups · {assistanceRequests.length} Help Calls
              </span>
            </div>
            <h1 className="text-2xl font-black font-['Outfit'] text-slate-900 mt-0.5">
              Waiter Dispatch Hub
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => sounds.playReadyBell()}
            className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>Test Bell</span>
          </button>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Refresh Feed</span>
          </button>
        </div>
      </div>

      {/* Main Dual Grid */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Left: READY TO DELIVER DISPATCH QUEUE */}
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
              <h2 className="text-base font-extrabold text-slate-900 font-['Outfit']">
                Ready for Table Delivery
              </h2>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 font-mono">
              {readyOrders.length} Orders
            </span>
          </div>

          {isLoading ? (
            <div className="py-16 text-center text-slate-400 text-xs font-semibold">
              Loading pickups...
            </div>
          ) : readyOrders.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-slate-200 text-slate-400 text-xs font-medium">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-50" />
              All prepared food has been delivered to tables!
            </div>
          ) : (
            readyOrders.map((order) => {
              const tableNumber = order.session?.table?.tableNumber || '??';

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl p-5 border-2 border-emerald-500 shadow-md shadow-emerald-500/10 animate-in fade-in"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl font-black font-['Outfit'] text-emerald-600">
                        Table #{tableNumber}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-400">
                        {order.orderNumber}
                      </span>
                    </div>

                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-extrabold rounded-lg font-mono flex items-center gap-1 border border-emerald-200">
                      <Sparkles className="w-3.5 h-3.5" />
                      Ready to Serve
                    </span>
                  </div>

                  {/* Items List */}
                  <div className="space-y-1.5 mb-4">
                    {order.items.map((item) => (
                      <div key={item.id} className="text-xs text-slate-800 font-medium">
                        <span className="font-mono font-black text-emerald-600 mr-2">
                          {item.quantity}x
                        </span>
                        <span>{item.menuItem?.name}</span>
                        {item.notes && (
                          <span className="block text-[10px] text-slate-400 italic pl-6">
                            "{item.notes}"
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Mark Delivered Button */}
                  <button
                    onClick={() => handleMarkServed(order.id)}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Delivered to Table #{tableNumber}</span>
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Right: ASSISTANCE REQUESTS FEED */}
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
              <h2 className="text-base font-extrabold text-slate-900 font-['Outfit']">
                Customer Calls & Assistance
              </h2>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800 font-mono">
              {assistanceRequests.length} Pending
            </span>
          </div>

          {isLoading ? (
            <div className="py-16 text-center text-slate-400 text-xs font-semibold">
              Loading requests...
            </div>
          ) : assistanceRequests.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-slate-200 text-slate-400 text-xs font-medium">
              <BellRing className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              No pending customer calls. Floor is serene.
            </div>
          ) : (
            assistanceRequests.map((req) => (
              <div
                key={req.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      {getAssistanceIcon(req.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-extrabold font-['Outfit'] text-slate-900">
                          Table #{req.tableNumber}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-orange-100 text-orange-700">
                          {req.type}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono">
                        Paging at{' '}
                        {new Date(req.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                {req.message && (
                  <div className="mb-4 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium">
                    "{req.message}"
                  </div>
                )}

                <button
                  onClick={() => handleResolveAssistance(req.id)}
                  className="w-full py-2.5 bg-slate-900 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Acknowledge & Mark Resolved</span>
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
