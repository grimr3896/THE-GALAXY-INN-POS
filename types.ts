
export type Tab = 'dashboard' | 'pos' | 'inventory' | 'history' | 'expenses' | 'cashup' | 'reports' | 'employees' | 'settings';

export interface DrumPourOption {
  label: string;
  volume: number; // in ml
  price: number;
}

export interface Product {
  id: string;
  name: string;
  category: 'bottle' | 'drum';
  image: string;
  buyPrice: number;
  sellPrice: number;
  drumPours?: DrumPourOption[];
  stock: number;
  capacity?: number;
  currentLevel?: number;
  minThreshold: number;
}

export interface SaleItem {
  id: string;
  name: string;
  productId: string;
  quantity: number;
  price: number;
  type: 'bottle' | 'drum-pour';
  volume?: number;
}

export interface Sale {
  id: string;
  timestamp: number;
  items: SaleItem[];
  total: number;
  paymentMethod: 'cash' | 'card' | 'm-pesa' | 'split';
  status: 'issued' | 'settled'; 
  settledAt?: number;
  tableNumber?: string;
  amountReceived?: number;
  changeGiven?: number;
  splitBreakdown?: {
    cash: number;
    mpesa: number;
    card: number;
  };
  cashierId: string; 
  vatAmount?: number;
}

export interface SuspendedOrder {
  id: string;
  name: string;
  items: SaleItem[];
  total: number;
  timestamp: number;
}

export interface Receipt {
  id: string;
  saleId: string;
  timestamp: number;
  content: string; 
  total: number;
}

export interface DaySnapshot {
  id: string; 
  timestamp: number;
  totalSales: number;
  paymentBreakdown: {
    cash: number;
    mpesa: number;
    card: number;
  };
  totalExpenses: number;
  variance: number;
  isLocked: boolean;
}

export interface AuditLog {
  id: string;
  timestamp: number;
  action: string;
  details: string;
  userId: string;
  severity: 'info' | 'warning' | 'critical';
}

export interface Expense {
  id: string;
  date: number;
  description: string;
  category: string;
  amount: number;
}

export interface CashUp {
  id: string;
  timestamp: number;
  expectedCash: number;
  actualCash: number;
  expectedMPesa: number;
  actualMPesa: number;
  expectedCard: number;
  actualCard: number;
  variance: number;
  notes: string;
}

export interface Employee {
  id: string;
  companyId: string;
  name: string;
  role: 'admin' | 'cashier' | 'waiter';
  pin: string;
}

export interface DayShift {
  id: string;
  isClosed: boolean;
  closedAt?: number;
}

export interface AppSettings {
  id?: string;
  storeName: string;
  storePhone?: string;
  storeAddress?: string;
  adminPin: string;
  lockedTabs: Tab[];
  webhookUrl: string;
  bossEmail: string;
  currency: string;
  vatRate: number;
  sessionTimeout: number;
}
