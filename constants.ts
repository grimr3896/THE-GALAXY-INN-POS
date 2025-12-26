
import { Product, Employee, AppSettings } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Guinness 500ml',
    category: 'bottle',
    image: 'https://picsum.photos/seed/guinness/200',
    buyPrice: 180,
    sellPrice: 250,
    stock: 45,
    minThreshold: 10
  },
  {
    id: '2',
    name: 'Tusker Lager',
    category: 'bottle',
    image: 'https://picsum.photos/seed/tusker/200',
    buyPrice: 150,
    sellPrice: 220,
    stock: 120,
    minThreshold: 20
  },
  {
    id: 'drum-1',
    name: 'Premium Whiskey Drum',
    category: 'drum',
    image: 'https://picsum.photos/seed/whiskey/200',
    buyPrice: 15000,
    sellPrice: 0,
    drumPrices: {
      '50ml': 150,
      '250ml': 600,
      '500ml': 1100,
      '1000ml': 2000
    },
    stock: 1,
    capacity: 50000,
    currentLevel: 35000,
    minThreshold: 5000
  }
];

export const INITIAL_EMPLOYEES: Employee[] = [
  { id: 'e1', companyId: 'GXY-001', name: 'John Admin', role: 'admin', pin: '1234' },
  { id: 'e2', companyId: 'GXY-002', name: 'Alice Cashier', role: 'cashier', pin: '0000' }
];

export const INITIAL_SETTINGS: AppSettings = {
  storeName: 'Galaxy Inn',
  storePhone: '+254 700 000000',
  storeAddress: 'Outer Ring Road, Nairobi',
  adminPin: '1234',
  lockedTabs: [],
  webhookUrl: '',
  bossEmail: 'boss@galaxyinn.com',
  currency: 'KSH',
  vatRate: 16,
  sessionTimeout: 0
};
