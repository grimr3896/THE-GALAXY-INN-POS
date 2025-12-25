
import { Product, Sale, Employee, AppSettings, Expense, CashUp } from './types';
import { INITIAL_PRODUCTS, INITIAL_EMPLOYEES, INITIAL_SETTINGS } from './constants';

const DB_NAME = 'GalaxyInnDB';
const DB_VERSION = 2;
const STORES = {
  PRODUCTS: 'products',
  SALES: 'sales',
  EXPENSES: 'expenses',
  CASHUPS: 'cashups',
  EMPLOYEES: 'employees',
  SETTINGS: 'settings'
};

class GalaxyDB {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = request.result;
        Object.values(STORES).forEach(storeName => {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, { keyPath: 'id' });
          }
        });
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject('DB not initialized');
      const transaction = this.db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async put<T>(storeName: string, data: T): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject('DB not initialized');
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async putBatch<T>(storeName: string, items: T[]): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject('DB not initialized');
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      items.forEach(item => store.put(item));
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async delete(storeName: string, id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject('DB not initialized');
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearAllStores(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject('DB not initialized');
      const transaction = this.db.transaction(Object.values(STORES), 'readwrite');
      Object.values(STORES).forEach(storeName => {
        transaction.objectStore(storeName).clear();
      });
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }
}

export const db = new GalaxyDB();

export const useStore = () => {
  return {
    STORES,
    saveProduct: (p: Product) => db.put(STORES.PRODUCTS, p),
    saveProducts: (ps: Product[]) => db.putBatch(STORES.PRODUCTS, ps),
    saveSale: (s: Sale) => db.put(STORES.SALES, s),
    saveSales: (ss: Sale[]) => db.putBatch(STORES.SALES, ss),
    saveExpense: (e: Expense) => db.put(STORES.EXPENSES, e),
    saveExpenses: (es: Expense[]) => db.putBatch(STORES.EXPENSES, es),
    deleteExpense: (id: string) => db.delete(STORES.EXPENSES, id),
    saveCashUp: (c: CashUp) => db.put(STORES.CASHUPS, c),
    saveCashUps: (cs: CashUp[]) => db.putBatch(STORES.CASHUPS, cs),
    saveEmployee: (e: Employee) => db.put(STORES.EMPLOYEES, e),
    saveEmployees: (es: Employee[]) => db.putBatch(STORES.EMPLOYEES, es),
    deleteEmployee: (id: string) => db.delete(STORES.EMPLOYEES, id),
    saveSettings: (s: AppSettings) => db.put(STORES.SETTINGS, { ...s, id: 'global' }),
    clearAll: () => db.clearAllStores(),
    
    loadAll: async () => {
      await db.init();
      const products = await db.getAll<Product>(STORES.PRODUCTS);
      const sales = await db.getAll<Sale>(STORES.SALES);
      const expenses = await db.getAll<Expense>(STORES.EXPENSES);
      const cashups = await db.getAll<CashUp>(STORES.CASHUPS);
      const employees = await db.getAll<Employee>(STORES.EMPLOYEES);
      const settingsList = await db.getAll<AppSettings>(STORES.SETTINGS);
      
      return {
        products: products.length ? products : INITIAL_PRODUCTS,
        sales: sales.sort((a,b) => b.timestamp - a.timestamp),
        expenses,
        cashups,
        employees: employees.length ? employees : INITIAL_EMPLOYEES,
        settings: settingsList[0] || INITIAL_SETTINGS
      };
    }
  };
};
