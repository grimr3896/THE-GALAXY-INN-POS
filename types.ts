
export type Tab = 'dashboard' | 'pos' | 'inventory' | 'history' | 'expenses' | 'cashup' | 'reports' | 'employees' | 'settings';

export interface Product {
  id: string;
  name: string;
  category: 'bottle' | 'drum';
  image: string;
  buyPrice: number;
  sellPrice: number; // For bottles
  drumPrices?: { [key: string]: number }; // e.g., { '50ml': 5, '500ml': 40, '1000ml': 75 }
  stock: number; // For bottles
  capacity?: number; // For drums in ml (e.g. 50000)
  currentLevel?: number; // For drums in ml
  minThreshold: number;
}

export interface SaleItem {
  id: string;
  name: string;
  productId: string;
  quantity: number;
  price: number;
  type: 'bottle' | 'drum-pour';
  volume?: number; // in ml
}

export interface Sale {
  id: string;
  timestamp: number;
  items: SaleItem[];
  total: number;
  paymentMethod: 'cash' | 'card' | 'm-pesa' | 'split';
  splitBreakdown?: {
    cash: number;
    mpesa: number;
    card: number;
  };
  cashierId: string;
  vatAmount?: number;
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

export interface AppSettings {
  storeName: string;
  adminPin: string;
  lockedTabs: Tab[];
  webhookUrl: string;
  bossEmail: string;
  currency: string;
  vatRate: number;
  sessionTimeout: number;
}
