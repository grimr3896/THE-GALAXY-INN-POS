
import { Product, Sale, Employee, AppSettings, Expense, CashUp, DayShift, AuditLog } from './types';
import { INITIAL_PRODUCTS, INITIAL_EMPLOYEES, INITIAL_SETTINGS } from './constants';

const DB_NAME = 'GalaxyInnDB';
const DB_VERSION = 4; 
const STORES = {
  PRODUCTS: 'products',
  SALES: 'sales',
  EXPENSES: 'expenses',
  CASHUPS: 'cashups',
  EMPLOYEES: 'employees',
  SETTINGS: 'settings',
  SHIFTS: 'shifts',
  AUDIT: 'audit_logs'
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

  async getAll<T>(storeName: string, limit?: number): Promise<T[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject('DB not initialized');
      const transaction = this.db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll(null, limit);
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

  async getById<T>(storeName: string, id: string): Promise<T | undefined> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject('DB not initialized');
      const transaction = this.db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
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
    // Fix: Added missing persistence methods and fixed plural versions for bulk saves
    saveProduct: (p: Product) => db.put(STORES.PRODUCTS, p),
    saveProducts: (ps: Product[]) => db.putBatch(STORES.PRODUCTS, ps),
    saveSale: (s: Sale) => db.put(STORES.SALES, s),
    saveSales: (ss: Sale[]) => db.putBatch(STORES.SALES, ss),
    saveAudit: (log: AuditLog) => db.put(STORES.AUDIT, log),
    saveExpense: (e: Expense) => db.put(STORES.EXPENSES, e),
    saveExpenses: (es: Expense[]) => db.putBatch(STORES.EXPENSES, es),
    saveShift: (shift: DayShift) => db.put(STORES.SHIFTS, shift),
    saveCashUp: (c: CashUp) => db.put(STORES.CASHUPS, c),
    saveCashUps: (cs: CashUp[]) => db.putBatch(STORES.CASHUPS, cs),
    saveEmployees: (es: Employee[]) => db.putBatch(STORES.EMPLOYEES, es),
    saveSettings: (s: AppSettings) => db.put(STORES.SETTINGS, { ...s, id: 'settings' }),
    deleteExpense: (id: string) => db.delete(STORES.EXPENSES, id),
    getShift: (dateId: string) => db.getById<DayShift>(STORES.SHIFTS, dateId),
    clearAll: () => db.clearAllStores(),
    
    loadAll: async () => {
      await db.init();
      const products = await db.getAll<Product>(STORES.PRODUCTS);
      const sales = await db.getAll<Sale>(STORES.SALES);
      const expenses = await db.getAll<Expense>(STORES.EXPENSES);
      const cashups = await db.getAll<CashUp>(STORES.CASHUPS);
      const employees = await db.getAll<Employee>(STORES.EMPLOYEES);
      const audits = await db.getAll<AuditLog>(STORES.AUDIT, 100); 
      const settingsList = await db.getAll<AppSettings>(STORES.SETTINGS);
      const todayId = new Date().toISOString().split('T')[0];
      const currentShift = await db.getById<DayShift>(STORES.SHIFTS, todayId);
      
      return {
        products: products.length ? products : INITIAL_PRODUCTS,
        sales: sales.sort((a,b) => b.timestamp - a.timestamp),
        expenses,
        cashups,
        employees: employees.length ? employees : INITIAL_EMPLOYEES,
        audits: audits.sort((a,b) => b.timestamp - a.timestamp),
        settings: settingsList[0] || INITIAL_SETTINGS,
        currentShift: currentShift || { id: todayId, isClosed: false }
      };
    }
  };
};
