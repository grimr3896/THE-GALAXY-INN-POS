
import React, { useRef } from 'react';
import { AppSettings, Sale, Product, Expense, CashUp, Employee, Tab } from '../types';
import { useStore } from '../store';

interface SettingsProps {
  settings: AppSettings;
  onUpdateSettings: (s: AppSettings) => void;
  sales: Sale[];
  products: Product[];
  expenses: Expense[];
  cashups: CashUp[];
  employees: Employee[];
  onReloadData: () => Promise<void>;
}

const Settings: React.FC<SettingsProps> = ({ settings, onUpdateSettings, sales, products, expenses, cashups, employees, onReloadData }) => {
  const tabs: Tab[] = ['dashboard', 'pos', 'inventory', 'history', 'expenses', 'cashup', 'reports', 'employees', 'settings'];
  const store = useStore();
  const csvInputRef = useRef<HTMLInputElement>(null);
  const restoreInputRef = useRef<HTMLInputElement>(null);

  const toggleTabLock = (tab: Tab) => {
    const isLocked = settings.lockedTabs.includes(tab);
    const newLocks = isLocked 
      ? settings.lockedTabs.filter(t => t !== tab) 
      : [...settings.lockedTabs, tab];
    onUpdateSettings({ ...settings, lockedTabs: newLocks });
  };

  const handleBackup = () => {
    const data = {
      backupDate: new Date().toISOString(),
      settings,
      sales,
      products,
      expenses,
      cashups,
      employees
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `galaxy_inn_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm("RESTORE DATA: This will DELETE all current data and replace it with the backup. Are you absolutely sure?")) {
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (!data.products || !data.sales) throw new Error("Invalid backup format");

        await store.clearAll();
        if (data.settings) await store.saveSettings(data.settings);
        if (data.products) await store.saveProducts(data.products);
        if (data.sales) await store.saveSales(data.sales);
        if (data.expenses) await store.saveExpenses(data.expenses);
        if (data.cashups) await store.saveCashUps(data.cashups);
        if (data.employees) await store.saveEmployees(data.employees);

        await onReloadData();
        alert("System restored successfully!");
      } catch (err) {
        console.error(err);
        alert("Failed to restore: Invalid file format.");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const rows = text.split('\n').filter(r => r.trim() !== '');
      const headers = rows[0].split(',').map(h => h.trim().toLowerCase());
      
      const newProducts: Product[] = rows.slice(1).map(row => {
        const values = row.split(',').map(v => v.trim());
        const obj: any = {};
        headers.forEach((header, idx) => {
          obj[header] = values[idx];
        });

        return {
          id: obj.id || `CSV-${Math.random().toString(36).substr(2, 5)}`,
          name: obj.name || 'Unknown Item',
          category: (obj.category === 'drum' ? 'drum' : 'bottle') as 'drum' | 'bottle',
          image: obj.image || 'https://picsum.photos/seed/placeholder/200',
          buyPrice: Number(obj.buyprice) || 0,
          sellPrice: Number(obj.sellprice) || 0,
          stock: Number(obj.stock) || 0,
          capacity: Number(obj.capacity) || 50000,
          currentLevel: Number(obj.currentlevel) || Number(obj.capacity) || 50000,
          minThreshold: Number(obj.minthreshold) || 10
        } as Product;
      });

      if (confirm(`Found ${newProducts.length} products. Import them?`)) {
        await store.saveProducts(newProducts);
        await onReloadData();
        alert("Products imported successfully!");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-12 pb-20 bg-slate-50 min-h-full">
      <div className="flex justify-between items-center border-b border-slate-200 pb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Settings</h2>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Admin Control Center</p>
        </div>
        <button 
          onClick={() => onUpdateSettings(settings)}
          className="bg-indigo-600 text-white px-10 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition"
        >
          Save All Settings
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* General Settings */}
        <section className="space-y-6">
          <div className="flex items-center space-x-3 text-slate-800 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/></svg>
            <h3 className="text-xl font-black uppercase tracking-tight">General Settings</h3>
          </div>
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 space-y-6">
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Manage general application settings.</p>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Application Name</label>
              <input 
                type="text" 
                value={settings.storeName} 
                onChange={(e) => onUpdateSettings({...settings, storeName: e.target.value})}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Currency</label>
                <input 
                  type="text" 
                  value={settings.currency} 
                  onChange={(e) => onUpdateSettings({...settings, currency: e.target.value})}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">VAT Rate (%)</label>
                <input 
                  type="number" 
                  value={settings.vatRate} 
                  onChange={(e) => onUpdateSettings({...settings, vatRate: Number(e.target.value)})}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Security Settings */}
        <section className="space-y-6">
          <div className="flex items-center space-x-3 text-slate-800 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            <h3 className="text-xl font-black uppercase tracking-tight">Security Settings</h3>
          </div>
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 space-y-6">
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Configure authentication and session management.</p>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Master Password</label>
              <input 
                type="password" 
                value={settings.adminPin} 
                onChange={(e) => onUpdateSettings({...settings, adminPin: e.target.value})}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-xl tracking-[0.3em]"
              />
              <p className="mt-2 text-[8px] text-slate-400 font-bold uppercase leading-relaxed">The master password is used for critical actions. It is stored securely and can be changed here.</p>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Session Timeout (seconds)</label>
              <input 
                type="number" 
                value={settings.sessionTimeout} 
                onChange={(e) => onUpdateSettings({...settings, sessionTimeout: Number(e.target.value)})}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold"
              />
              <p className="mt-2 text-[8px] text-slate-400 font-bold uppercase leading-relaxed">Automatically log out after inactivity. Set to 0 to disable. Recommended: 300-600 seconds.</p>
            </div>
          </div>
        </section>

        {/* Tab Access Control */}
        <section className="space-y-6 lg:col-span-2">
          <div className="flex items-center space-x-3 text-slate-800 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            <h3 className="text-xl font-black uppercase tracking-tight">Tab Access Control</h3>
          </div>
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-6">Toggle to lock or unlock specific tabs. Unlocking requires the master password.</p>
            <div className="overflow-hidden rounded-2xl border border-slate-100">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <tr>
                    <th className="px-8 py-4">Tab</th>
                    <th className="px-8 py-4 text-right">Lock Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {tabs.map(tab => (
                    <tr key={tab} className="hover:bg-slate-50 transition">
                      <td className="px-8 py-4 text-xs font-black uppercase text-slate-600 tracking-tight">{tab.replace('-', ' ')}</td>
                      <td className="px-8 py-4 text-right">
                        <button 
                          onClick={() => toggleTabLock(tab)}
                          className={`w-12 h-6 rounded-full transition-all relative ${settings.lockedTabs.includes(tab) ? 'bg-red-500' : 'bg-slate-200'}`}
                        >
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.lockedTabs.includes(tab) ? 'right-1' : 'left-1'}`}></div>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Data Import */}
        <section className="space-y-6">
          <div className="flex items-center space-x-3 text-slate-800 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            <h3 className="text-xl font-black uppercase tracking-tight">Product CSV Import</h3>
          </div>
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 space-y-6 text-center">
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest leading-relaxed">Load product data from an external CSV file. This will update or add items.</p>
            <input type="file" ref={csvInputRef} onChange={handleCSVImport} accept=".csv" className="hidden" />
            <div 
              onClick={() => csvInputRef.current?.click()}
              className="p-10 border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center cursor-pointer hover:border-indigo-300 transition space-y-4"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
              <span className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition">Choose CSV File</span>
            </div>
            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Required headers: id, name, category, buyPrice, sellPrice, stock, minThreshold</p>
          </div>
        </section>

        {/* Data Management */}
        <section className="space-y-6">
          <div className="flex items-center space-x-3 text-slate-800 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            <h3 className="text-xl font-black uppercase tracking-tight">System Backup</h3>
          </div>
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 space-y-6">
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Backup all application data or restore it from a file.</p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={handleBackup}
                className="w-full py-4 bg-indigo-50 text-indigo-600 font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-indigo-100 transition"
              >
                Download Full JSON Backup
              </button>
              <input type="file" ref={restoreInputRef} onChange={handleRestore} accept=".json" className="hidden" />
              <button 
                onClick={() => restoreInputRef.current?.click()}
                className="w-full py-4 bg-slate-100 text-slate-600 font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-slate-200 transition"
              >
                Restore from Local File
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Settings;
