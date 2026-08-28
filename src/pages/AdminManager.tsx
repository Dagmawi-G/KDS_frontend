import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings,
  TrendingUp,
  Utensils,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  QrCode,
  Flame,
  DollarSign,
  ShoppingBag,
  Clock,
  Printer,
  ChevronRight,
  Users,
  UserPlus,
  Shield,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  ChefHat,
  BellRing,
  CreditCard,
  UserCheck,
} from 'lucide-react';
import { Category, MenuItem, DashboardReport, Table, StaffUser } from '../types';

export const AdminManager: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'ANALYTICS' | 'MENU' | 'TABLES' | 'STAFF'>('ANALYTICS');
  const [report, setReport] = useState<DashboardReport | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPins, setShowPins] = useState<{ [id: number]: boolean }>({});

  // New / Edit Item Modal State
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    imageUrl: '',
    categoryId: '',
    prepTimeMinutes: '12',
    isSpecial: false,
    isAvailable: true,
  });

  // Staff Modal State
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffUser | null>(null);
  const [staffFormData, setStaffFormData] = useState<{
    name: string;
    email: string;
    role: any;
    pinCode: string;
    status: any;
  }>({
    name: '',
    email: '',
    role: 'WAITER',
    pinCode: '1234',
    status: 'ACTIVE',
  });


  // New Table State
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState('');
  const [newTableCapacity, setNewTableCapacity] = useState('4');


  const fetchAdminData = async () => {
    try {
      setIsLoading(true);
      // 1. Fetch Analytics Report
      const reportRes = await fetch('/api/reports/dashboard');
      if (reportRes.ok) setReport(await reportRes.json());

      // 2. Fetch Menu & Categories
      const menuRes = await fetch('/api/menu');
      if (menuRes.ok) setCategories(await menuRes.json());

      const itemsRes = await fetch('/api/menu/items');
      if (itemsRes.ok) setMenuItems(await itemsRes.json());

      // 3. Fetch Tables
      const tablesRes = await fetch('/api/tables');
      if (tablesRes.ok) setTables(await tablesRes.json());

      // 4. Fetch Staff Members
      const staffRes = await fetch('/api/auth/staff');
      if (staffRes.ok) setStaffList(await staffRes.json());
    } catch (e) {
      console.error('Error fetching admin data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  // Staff Handlers
  const openCreateStaffModal = () => {
    setEditingStaff(null);
    setStaffFormData({
      name: '',
      email: '',
      role: 'WAITER',
      pinCode: '1234',
      status: 'ACTIVE',
    });
    setIsStaffModalOpen(true);
  };

  const openEditStaffModal = (staff: StaffUser) => {
    setEditingStaff(staff);
    setStaffFormData({
      name: staff.name,
      email: staff.email,
      role: staff.role as any,
      pinCode: staff.pinCode || '1234',
      status: staff.status,
    });
    setIsStaffModalOpen(true);
  };

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingStaff) {
        // Update Staff
        const res = await fetch(`/api/auth/staff/${editingStaff.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(staffFormData),
        });
        if (res.ok) {
          const updated = await res.json();
          setStaffList((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
          setIsStaffModalOpen(false);
        } else {
          const err = await res.json();
          alert(err.error || 'Failed to update staff member');
        }
      } else {
        // Register Staff
        const res = await fetch('/api/auth/staff', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(staffFormData),
        });
        if (res.ok) {
          const created = await res.json();
          setStaffList((prev) => [...prev, created]);
          setIsStaffModalOpen(false);
        } else {
          const err = await res.json();
          alert(err.error || 'Failed to register staff member');
        }
      }
    } catch (err) {
      console.error('Error saving staff:', err);
    }
  };

  const handleToggleStaffStatus = async (staff: StaffUser) => {
    const newStatus = staff.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await fetch(`/api/auth/staff/${staff.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setStaffList((prev) =>
          prev.map((s) => (s.id === staff.id ? { ...s, status: newStatus } : s))
        );
      }
    } catch (e) {
      console.error('Failed to toggle staff status:', e);
    }
  };

  const handleDeleteStaff = async (id: number) => {
    if (!window.confirm('Are you sure you want to remove this staff profile?')) return;
    try {
      const res = await fetch(`/api/auth/staff/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setStaffList((prev) => prev.filter((s) => s.id !== id));
      }
    } catch (e) {
      console.error('Failed to delete staff:', e);
    }
  };


  // Toggle item availability
  const handleToggleAvailability = async (item: MenuItem) => {
    try {
      const newStatus = !item.isAvailable;
      const res = await fetch(`/api/menu/items/${item.id}/availability`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: newStatus }),
      });
      if (res.ok) {
        setMenuItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, isAvailable: newStatus } : i))
        );
      }
    } catch (e) {
      console.error('Failed to toggle availability:', e);
    }
  };

  // Open item form
  const openCreateItemModal = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      imageUrl: '',
      categoryId: categories[0]?.id?.toString() || '',
      prepTimeMinutes: '12',
      isSpecial: false,
      isAvailable: true,
    });
    setIsItemModalOpen(true);
  };

  const openEditItemModal = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price.toString(),
      imageUrl: item.imageUrl || '',
      categoryId: item.categoryId.toString(),
      prepTimeMinutes: item.prepTimeMinutes.toString(),
      isSpecial: item.isSpecial,
      isAvailable: item.isAvailable,
    });
    setIsItemModalOpen(true);
  };

  // Save Item (Create or Edit)
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        const res = await fetch(`/api/menu/items/${editingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          const updated = await res.json();
          setMenuItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
          setIsItemModalOpen(false);
        }
      } else {
        const res = await fetch('/api/menu/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          const created = await res.json();
          setMenuItems((prev) => [...prev, created]);
          setIsItemModalOpen(false);
        }
      }
    } catch (err) {
      console.error('Error saving item:', err);
    }
  };

  // Delete Item
  const handleDeleteItem = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this menu item?')) return;
    try {
      const res = await fetch(`/api/menu/items/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMenuItems((prev) => prev.filter((i) => i.id !== id));
      }
    } catch (e) {
      console.error('Failed to delete item:', e);
    }
  };

  // Create Table
  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableNumber) return;
    try {
      const res = await fetch('/api/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableNumber: newTableNumber.padStart(2, '0'),
          capacity: parseInt(newTableCapacity),
        }),
      });
      if (res.ok) {
        const created = await res.json();
        setTables((prev) => [...prev, created]);
        setIsTableModalOpen(false);
        setNewTableNumber('');
      }
    } catch (e) {
      console.error('Error creating table:', e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-6 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Header */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-800 flex items-center justify-center shadow-lg shadow-slate-900/20 text-white">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-mono">
              Management & Operations
            </span>
            <h1 className="text-2xl font-black font-['Outfit'] text-slate-900 mt-0.5">
              Admin & Analytics Control
            </h1>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center space-x-2 bg-white p-1 rounded-2xl border border-slate-200 shadow-xs flex-wrap">
          {[
            { id: 'ANALYTICS', label: 'Analytics & Sales', icon: TrendingUp },
            { id: 'MENU', label: 'Menu Catalog', icon: Utensils },
            { id: 'TABLES', label: 'Tables & QR', icon: QrCode },
            { id: 'STAFF', label: 'Staff & Waiters', icon: Users },
          ].map((tab) => {

            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  active
                    ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab 1: Analytics & Reports */}
      {activeTab === 'ANALYTICS' && report && (
        <div className="max-w-7xl mx-auto space-y-6 mt-6">
          {/* Key KPI Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Revenue Today
                </span>
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
              <p className="text-3xl font-black font-['Outfit'] text-slate-900 mt-2">
                ${report.totalRevenueToday.toFixed(2)}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Total Orders
                </span>
                <ShoppingBag className="w-5 h-5 text-orange-600" />
              </div>
              <p className="text-3xl font-black font-['Outfit'] text-slate-900 mt-2">
                {report.totalOrders}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Avg Ticket Size
                </span>
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-3xl font-black font-['Outfit'] text-slate-900 mt-2">
                ${report.avgTicketSize.toFixed(2)}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Avg Prep Turnaround
                </span>
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-3xl font-black font-['Outfit'] text-slate-900 mt-2">
                {report.avgPrepTimeMinutes} mins
              </p>
            </div>
          </div>

          {/* Top Selling Items & Recent Bills */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bestsellers */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
              <h3 className="text-base font-extrabold text-slate-900 font-['Outfit'] mb-4">
                Top 5 Best-Selling Dishes
              </h3>
              <div className="space-y-3">
                {report.topSellingItems.map((item, idx) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="w-7 h-7 rounded-xl bg-orange-100 text-orange-700 font-black text-xs flex items-center justify-center font-mono">
                        #{idx + 1}
                      </span>
                      <span className="text-xs font-bold text-slate-800">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-slate-900 block">
                        {item.count} sold
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        ${item.revenue.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Settled Sessions */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
              <h3 className="text-base font-extrabold text-slate-900 font-['Outfit'] mb-4">
                Recent Closed Sessions
              </h3>
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {report.recentBills.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">
                    No closed sessions recorded yet.
                  </p>
                ) : (
                  report.recentBills.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs"
                    >
                      <div>
                        <span className="font-extrabold text-slate-900 font-['Outfit']">
                          Table #{s.table?.tableNumber || '??'}
                        </span>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {s.paymentMethod || 'CARD'} ·{' '}
                          {s.closedAt
                            ? new Date(s.closedAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : ''}
                        </p>
                      </div>
                      <span className="text-sm font-black font-mono text-emerald-600">
                        ${s.totalAmount.toFixed(2)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Menu Catalog Manager */}
      {activeTab === 'MENU' && (
        <div className="max-w-7xl mx-auto space-y-4 mt-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 font-['Outfit']">
              Restaurant Menu Items ({menuItems.length})
            </h3>
            <button
              onClick={openCreateItemModal}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-600/30 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Dish</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {menuItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex gap-3">
                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-16 h-16 rounded-xl object-cover shrink-0"
                      />
                    )}
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-extrabold text-slate-900 text-xs">{item.name}</h4>
                        {item.isSpecial && (
                          <span className="p-0.5 rounded bg-orange-100 text-orange-600">
                            <Flame className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                        {item.description}
                      </p>
                      <span className="text-xs font-mono font-black text-orange-600 mt-1 block">
                        ${item.price.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => handleToggleAvailability(item)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase transition-colors ${
                      item.isAvailable
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {item.isAvailable ? 'In Stock' : 'Out of Stock'}
                  </button>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => openEditItemModal(item)}
                      className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100"
                      title="Edit dish"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                      title="Delete dish"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Tables & QR Stands Manager */}
      {activeTab === 'TABLES' && (
        <div className="max-w-7xl mx-auto space-y-6 mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 font-['Outfit']">
                Restaurant Tables & QR Stand Placards
              </h3>
              <p className="text-xs text-slate-500">
                Manage seating capacities and generate printable QR code placards for table stands.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigate('/qr-print')}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>Print All QR Placards</span>
              </button>

              <button
                onClick={() => setIsTableModalOpen(true)}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-600/30 flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Table</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {tables.map((t) => (
              <div
                key={t.id}
                className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xl font-black font-['Outfit'] text-slate-900">
                      Table #{t.tableNumber}
                    </span>
                    <span className="text-xs font-bold text-slate-500 font-mono">
                      {t.capacity} Seats
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                    {t.status}
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => navigate(`/table/${t.tableNumber}`)}
                    className="text-xs font-bold text-orange-600 hover:text-orange-700"
                  >
                    Open Menu ➔
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Staff & Waiters Management */}
      {activeTab === 'STAFF' && (
        <div className="max-w-7xl mx-auto space-y-6 mt-6">
          {/* Header Action Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <h2 className="text-xl font-bold font-['Outfit'] text-slate-900">
                Staff & Waiter Directory
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage restaurant staff, assign roles, and configure fast 4-digit PIN authentication
              </p>
            </div>
            <button
              onClick={openCreateStaffModal}
              className="px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-orange-600/30 transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Register New Staff</span>
            </button>
          </div>

          {/* Staff Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Total Staff
              </span>
              <p className="text-2xl font-black font-['Outfit'] text-slate-900 mt-1">
                {staffList.length}
              </p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600">
                Floor Waiters
              </span>
              <p className="text-2xl font-black font-['Outfit'] text-purple-600 mt-1">
                {staffList.filter((s) => s.role === 'WAITER').length}
              </p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                Cashiers & POS
              </span>
              <p className="text-2xl font-black font-['Outfit'] text-emerald-600 mt-1">
                {staffList.filter((s) => s.role === 'CASHIER').length}
              </p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600">
                Kitchen Chefs
              </span>
              <p className="text-2xl font-black font-['Outfit'] text-rose-600 mt-1">
                {staffList.filter((s) => s.role === 'KITCHEN').length}
              </p>
            </div>
          </div>

          {/* Role Permissions Callout */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-xs">
            <div className="flex items-center space-x-2 mb-2">
              <Shield className="w-5 h-5 text-orange-400" />
              <h4 className="text-sm font-bold font-['Outfit'] text-white">
                Role-Based Floor Access Permissions:
              </h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs text-slate-300">
              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60">
                <span className="font-bold text-orange-400 block mb-0.5">👑 ADMIN / MANAGER</span>
                Financial KPIs, menu catalog & pricing, staff registration, table configuration.
              </div>
              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60">
                <span className="font-bold text-purple-400 block mb-0.5">📟 WAITER / SERVER</span>
                Live ready-food dispatch alerts, guest assistance feed (water/napkins), table delivery.
              </div>
              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60">
                <span className="font-bold text-emerald-400 block mb-0.5">💻 CASHIER</span>
                Live color-coded floor matrix, multi-round bill aggregator, payment settlement.
              </div>
              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60">
                <span className="font-bold text-rose-400 block mb-0.5">🍳 KITCHEN / CHEF</span>
                Touchscreen KDS Kanban board, cooking timers, allergy highlights, mark plates ready.
              </div>
            </div>
          </div>

          {/* Staff Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {staffList.map((staff) => {
              const isPinVisible = Boolean(showPins[staff.id]);
              return (
                <div
                  key={staff.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Top Row: Avatar & Status */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center font-black font-['Outfit'] text-slate-700 text-lg border border-slate-200">
                          {staff.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-sm text-slate-900 font-['Outfit']">
                            {staff.name}
                          </h4>
                          <span className="text-[11px] text-slate-500 font-mono block">
                            {staff.email}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleToggleStaffStatus(staff)}
                        title={`Click to ${staff.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}`}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase cursor-pointer transition-colors ${
                          staff.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-200'
                            : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {staff.status}
                      </button>
                    </div>

                    {/* Role Badge */}
                    <div className="mb-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${
                          staff.role === 'ADMIN' || staff.role === 'MANAGER'
                            ? 'bg-orange-100 text-orange-800 border border-orange-200'
                            : staff.role === 'WAITER'
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : staff.role === 'CASHIER'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-100 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {staff.role === 'ADMIN' || staff.role === 'MANAGER' ? (
                          <Shield className="w-3.5 h-3.5" />
                        ) : staff.role === 'WAITER' ? (
                          <BellRing className="w-3.5 h-3.5" />
                        ) : staff.role === 'CASHIER' ? (
                          <CreditCard className="w-3.5 h-3.5" />
                        ) : (
                          <ChefHat className="w-3.5 h-3.5" />
                        )}
                        <span>{staff.role}</span>
                      </span>
                    </div>

                    {/* Fast 4-Digit PIN Display */}
                    <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200 flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center space-x-2 text-slate-600">
                        <KeyRound className="w-4 h-4 text-slate-400" />
                        <span className="text-[11px] font-bold font-sans text-slate-500">
                          Terminal PIN:
                        </span>
                        <span className="font-black text-slate-800 font-mono tracking-widest">
                          {isPinVisible ? staff.pinCode || '1234' : '••••'}
                        </span>
                      </div>
                      <button
                        onClick={() =>
                          setShowPins((prev) => ({ ...prev, [staff.id]: !prev[staff.id] }))
                        }
                        className="text-slate-400 hover:text-slate-600 p-1"
                        title={isPinVisible ? 'Hide PIN' : 'Reveal PIN'}
                      >
                        {isPinVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      onClick={() => openEditStaffModal(staff)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center gap-1"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    {staff.role !== 'ADMIN' && (
                      <button
                        onClick={() => handleDeleteStaff(staff.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}


      {/* Add / Edit Dish Modal */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setIsItemModalOpen(false)}
          />
          <div className="relative bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl z-10 border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 font-['Outfit'] mb-4">
              {editingItem ? 'Edit Dish Details' : 'Create New Menu Dish'}
            </h3>

            <form onSubmit={handleSaveItem} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Dish Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Lobster Thermidor"
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Category</label>
                <select
                  required
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Price ($ USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="24.50"
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Prep Time (Minutes)
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.prepTimeMinutes}
                    onChange={(e) =>
                      setFormData({ ...formData, prepTimeMinutes: e.target.value })
                    }
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Image URL</label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Appetizing description of ingredients, culinary method..."
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isSpecial}
                    onChange={(e) =>
                      setFormData({ ...formData, isSpecial: e.target.checked })
                    }
                    className="rounded text-orange-600 focus:ring-orange-500 w-4 h-4"
                  />
                  <span className="font-bold text-slate-700">Chef Special Badge</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isAvailable}
                    onChange={(e) =>
                      setFormData({ ...formData, isAvailable: e.target.checked })
                    }
                    className="rounded text-orange-600 focus:ring-orange-500 w-4 h-4"
                  />
                  <span className="font-bold text-slate-700">In Stock</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsItemModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold shadow-md shadow-orange-600/30"
                >
                  Save Dish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Table Modal */}
      {isTableModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setIsTableModalOpen(false)}
          />
          <div className="relative bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl z-10 border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 font-['Outfit'] mb-4">
              Add New Floor Table
            </h3>

            <form onSubmit={handleCreateTable} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Table Number</label>
                <input
                  type="text"
                  required
                  value={newTableNumber}
                  onChange={(e) => setNewTableNumber(e.target.value)}
                  placeholder="e.g. 11"
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Seating Capacity</label>
                <input
                  type="number"
                  required
                  value={newTableCapacity}
                  onChange={(e) => setNewTableCapacity(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTableModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold shadow-md shadow-orange-600/30"
                >
                  Create Table
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isStaffModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setIsStaffModalOpen(false)}
          />
          <div className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl z-10 border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 font-['Outfit'] mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-orange-600" />
              <span>{editingStaff ? 'Edit Staff Profile' : 'Register New Staff Member'}</span>
            </h3>

            <form onSubmit={handleSaveStaff} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={staffFormData.name}
                  onChange={(e) =>
                    setStaffFormData({ ...staffFormData, name: e.target.value })
                  }
                  placeholder="e.g. David Miller"
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-sans"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Email Address</label>
                <input
                  type="email"
                  value={staffFormData.email}
                  onChange={(e) =>
                    setStaffFormData({ ...staffFormData, email: e.target.value })
                  }
                  placeholder="e.g. david.miller@gourmetos.com"
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Staff Role</label>
                  <select
                    value={staffFormData.role}
                    onChange={(e) =>
                      setStaffFormData({ ...staffFormData, role: e.target.value as any })
                    }
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold"
                  >
                    <option value="WAITER">📟 Waiter / Server</option>
                    <option value="CASHIER">💻 Cashier & POS</option>
                    <option value="KITCHEN">🍳 Kitchen Chef</option>
                    <option value="MANAGER">📊 Floor Manager</option>
                    <option value="ADMIN">👑 Master Admin</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    4-Digit Terminal PIN
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    pattern="[0-9]{4}"
                    required
                    value={staffFormData.pinCode}
                    onChange={(e) =>
                      setStaffFormData({
                        ...staffFormData,
                        pinCode: e.target.value.replace(/\D/g, ''),
                      })
                    }
                    placeholder="1234"
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono font-bold tracking-widest text-center"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Account Status</label>
                <select
                  value={staffFormData.status}
                  onChange={(e) =>
                    setStaffFormData({ ...staffFormData, status: e.target.value as any })
                  }
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold"
                >
                  <option value="ACTIVE">🟢 Active (Allowed to Login)</option>
                  <option value="INACTIVE">⚪ Inactive (Suspended)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsStaffModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold shadow-md shadow-orange-600/30"
                >
                  {editingStaff ? 'Update Staff Profile' : 'Register Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

