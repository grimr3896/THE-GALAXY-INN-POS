
import { Product, Sale, Employee, AppSettings, Expense, CashUp, DayShift, AuditLog, Receipt, DaySnapshot, SuspendedOrder } from './types';
import { INITIAL_PRODUCTS, INITIAL_EMPLOYEES, INITIAL_SETTINGS } from './constants';

const DB_NAME = 'GalaxyInnDB';
const DB_VERSION = 6; 
const STORES = {
  PRODUCTS: 'products',
  SALES: 'sales',
  EXPENSES: 'expenses',
  CASHUPS: 'cashups',
  EMPLOYEES: 'employees',
  SETTINGS: 'settings',
  SHIFTS: 'shifts',
  AUDIT: 'audit_logs',
  RECEIPTS: 'receipts',
  SNAPSHOTS: 'day_snapshots',
  SUSPENDED: 'suspended_orders'
};

class GalaxyDB {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    if (this.db) return;
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

  async performSaleTransaction(sale: Sale, receipt: Receipt): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        [STORES.SALES, STORES.PRODUCTS, STORES.RECEIPTS, STORES.AUDIT], 
        'readwrite'
      );
      
      const salesStore = transaction.objectStore(STORES.SALES);
      const productStore = transaction.objectStore(STORES.PRODUCTS);
      const receiptStore = transaction.objectStore(STORES.RECEIPTS);
      const auditStore = transaction.objectStore(STORES.AUDIT);

      const itemPromises = sale.items.map(item => {
        return new Promise<void>((res, rej) => {
          const getReq = productStore.get(item.productId);
          getReq.onsuccess = () => {
            const product: Product = getReq.result;
            if (!product) return rej(`Product ${item.productId} not found`);

            if (product.category === 'bottle') {
              if (product.stock < item.quantity) return rej(`Insufficient stock for ${product.name}`);
              product.stock -= item.quantity;
            } else {
              const volNeeded = (item.volume || 0) * item.quantity;
              if ((product.currentLevel || 0) < volNeeded) return rej(`Insufficient volume for ${product.name}`);
              product.currentLevel = (product.currentLevel || 0) - volNeeded;
            }
            
            const putReq = productStore.put(product);
            putReq.onsuccess = () => res();
            putReq.onerror = () => rej(`Failed to update product ${product.name}`);
          };
        });
      });

      Promise.all(itemPromises)
        .then(() => {
          salesStore.put(sale);
          receiptStore.put(receipt);
          auditStore.put({
            id: `AUD-${Date.now()}`,
            timestamp: Date.now(),
            action: 'SALE_COMPLETE',
            details: `Sale ${sale.id} for KSH ${sale.total}`,
            userId: sale.cashierId,
            severity: 'info'
          });
        })
        .catch(err => {
          transaction.abort();
          reject(err);
        });

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject('Transaction aborted due to stock error');
    });
  }

  async getAll<T>(storeName: string, limit?: number): Promise<T[]> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll(null, limit);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async put<T>(storeName: string, data: T): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async putBatch<T>(storeName: string, items: T[]): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      items.forEach(item => store.put(item));
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async delete(storeName: string, id: string): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getById<T>(storeName: string, id: string): Promise<T | undefined> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async clearAllStores(): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(Object.values(STORES), 'readwrite');
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
    completeSale: (sale: Sale, receipt: Receipt) => db.performSaleTransaction(sale, receipt),
    saveSale: (s: Sale) => db.put(STORES.SALES, s),
    saveSales: (ss: Sale[]) => db.putBatch(STORES.SALES, ss),
    saveProduct: (p: Product) => db.put(STORES.PRODUCTS, p),
    saveProducts: (ps: Product[]) => db.putBatch(STORES.PRODUCTS, ps),
    saveAudit: (log: AuditLog) => db.put(STORES.AUDIT, log),
    saveExpense: (e: Expense) => db.put(STORES.EXPENSES, e),
    saveExpenses: (es: Expense[]) => db.putBatch(STORES.EXPENSES, es),
    saveShift: (shift: DayShift) => db.put(STORES.SHIFTS, shift),
    saveCashUp: (c: CashUp) => db.put(STORES.CASHUPS, c),
    saveCashUps: (cs: CashUp[]) => db.putBatch(STORES.CASHUPS, cs),
    saveSnapshot: (s: DaySnapshot) => db.put(STORES.SNAPSHOTS, s),
    saveEmployees: (es: Employee[]) => db.putBatch(STORES.EMPLOYEES, es),
    saveSettings: (s: AppSettings) => db.put(STORES.SETTINGS, { ...s, id: 'settings' }),
    saveSuspendedOrder: (order: SuspendedOrder) => db.put(STORES.SUSPENDED, order),
    deleteSuspendedOrder: (id: string) => db.delete(STORES.SUSPENDED, id),
    deleteExpense: (id: string) => db.delete(STORES.EXPENSES, id),
    getReceipt: (saleId: string) => db.getById<Receipt>(STORES.RECEIPTS, saleId),
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
      const snapshots = await db.getAll<DaySnapshot>(STORES.SNAPSHOTS);
      const suspended = await db.getAll<SuspendedOrder>(STORES.SUSPENDED);
      
      const todayId = new Date().toISOString().split('T')[0];
      const currentShift = await db.getById<DayShift>(STORES.SHIFTS, todayId);
      
      return {
        products: products.length ? products : INITIAL_PRODUCTS,
        sales: sales.sort((a,b) => b.timestamp - a.timestamp),
        expenses,
        cashups,
        snapshots,
        suspended,
        employees: employees.length ? employees : INITIAL_EMPLOYEES,
        audits: audits.sort((a,b) => b.timestamp - a.timestamp),
        settings: settingsList[0] || INITIAL_SETTINGS,
        currentShift: currentShift || { id: todayId, isClosed: false }
      };
    }
  };
};
