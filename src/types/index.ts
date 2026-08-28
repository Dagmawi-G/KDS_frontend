export type TableStatus = 'AVAILABLE' | 'OCCUPIED' | 'WAITING_FOOD' | 'EATING' | 'BILL_REQUESTED';

export type OrderStatus = 'PENDING' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'SERVED' | 'CANCELLED';

export type AssistanceType = 'WATER' | 'WAITER' | 'NAPKINS' | 'BILL' | 'CUTLERY' | 'OTHER';

export type AssistanceStatus = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';

export type StaffRole = 'ADMIN' | 'WAITER' | 'CASHIER' | 'KITCHEN' | 'MANAGER';

export type StaffStatus = 'ACTIVE' | 'INACTIVE';

export interface StaffUser {
  id: number;
  name: string;
  email: string;
  role: StaffRole;
  pinCode?: string;
  status: StaffStatus;
}


export interface Category {
  id: number;
  name: string;
  icon?: string;
  sortOrder: number;
  items?: MenuItem[];
}

export interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl?: string | null;
  isAvailable: boolean;
  isSpecial: boolean;
  prepTimeMinutes: number;
  categoryId: number;
  category?: Category;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
}

export interface OrderItem {
  id: number;
  orderId: number;
  menuItemId: number;
  menuItem: MenuItem;
  quantity: number;
  unitPrice: number;
  notes?: string | null;
}

export interface Order {
  id: number;
  orderNumber: string;
  sessionId: string;
  status: OrderStatus;
  items: OrderItem[];
  specialNotes?: string | null;
  subtotal: number;
  tax: number;
  total: number;
  createdAt: string;
  updatedAt: string;
  startedPrepAt?: string | null;
  readyAt?: string | null;
  servedAt?: string | null;
  session?: {
    table: Table;
  };
}

export interface AssistanceRequest {
  id: number;
  sessionId: string;
  tableNumber: string;
  type: AssistanceType;
  message?: string | null;
  status: AssistanceStatus;
  createdAt: string;
  resolvedAt?: string | null;
}

export interface TableSession {
  id: string;
  tableId: number;
  status: 'ACTIVE' | 'CLOSED';
  orders: Order[];
  assistance: AssistanceRequest[];
  startedAt: string;
  closedAt?: string | null;
  totalAmount: number;
  paymentMethod?: string | null;
  paidAt?: string | null;
  table?: Table;
}

export interface Table {
  id: number;
  tableNumber: string;
  capacity: number;
  qrCodeUrl?: string | null;
  status: TableStatus;
  sessions?: TableSession[];
  activeSession?: TableSession | null;
  totalAmount?: number;
  openAssistanceCount?: number;
  activeOrdersCount?: number;
}

export interface DashboardReport {
  totalRevenueToday: number;
  totalOrders: number;
  totalTables: number;
  activeTables: number;
  avgPrepTimeMinutes: number;
  avgTicketSize: number;
  topSellingItems: { name: string; count: number; revenue: number }[];
  recentBills: TableSession[];
}
