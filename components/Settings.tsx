
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
  const restoreInputRef = useRef<HTMLInputElement>(null);

  const toggleTabLock = (tab: Tab) => {
    const isLocked = settings.lockedTabs.includes(tab);
    const newLocks = isLocked ? settings.lockedTabs.filter(t => t !== tab) : [...settings.lockedTabs, tab];
    onUpdateSettings({ ...settings, lockedTabs: newLocks });
  };

  const handleBackup = () => {
    const data = { backupDate: new Date().toISOString(), settings, sales, products, expenses, cashups, employees };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = `backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click(); URL.revokeObjectURL(url);
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !confirm("RESTORE WARNING: This will overwrite your local database with the backup file data. This cannot be undone. Proceed?")) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        await store.clearAll();
        if (data.settings) await store.saveSettings(data.settings);
        if (data.products) await store.saveProducts(data.products);
        if (data.sales) await store.saveSales(data.sales);
        if (data.expenses) await store.saveExpenses(data.expenses);
        if (data.cashups) await store.saveCashUps(data.cashups);
        if (data.employees) await store.saveEmployees(data.employees);
        await onReloadData();
        alert("RESTORE SUCCESSFUL: System state refreshed.");
      } catch (err) { alert("RESTORE FAILED: The backup file is corrupted or incompatible."); }
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-12 pb-20 bg-slate-50 min-h-full text-black font-black">
      <div className="flex justify-between items-center border-b border-slate-200 pb-8">
        <div>
          <h2 className="text-3xl font-black text-black uppercase tracking-tighter">System Configuration</h2>
          <p className="text-black font-bold text-xs uppercase tracking-widest mt-1 opacity-60">Admin Access Only</p>
        </div>
        <button onClick={() => onUpdateSettings(settings)} className="bg-black text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-slate-800 transition">Apply Changes</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <section className="space-y-6">
          <div className="flex items-center space-x-3 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/></svg>
            <h3 className="text-xl uppercase tracking-tight">App Identity</h3>
          </div>
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 space-y-8">
            <div>
              <label className="block text-[10px] uppercase tracking-widest mb-3 opacity-40">Store/Bar Name</label>
              <input 
                type="text" value={settings.storeName} 
                onChange={(e) => onUpdateSettings({...settings, storeName: e.target.value})} 
                className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-black focus:border-black transition uppercase" 
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest mb-3 opacity-40">Administrator PIN (4 Digits)</label>
              <input 
                type="password" value={settings.adminPin} 
                onChange={(e) => onUpdateSettings({...settings, adminPin: e.target.value.slice(0, 4)})} 
                maxLength={4}
                className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black tracking-[1em] text-center text-2xl text-black focus:border-black transition" 
              />
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center space-x-3 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            <h3 className="text-xl uppercase tracking-tight">Security Access Locks</h3>
          </div>
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 space-y-6">
            <p className="text-[10px] uppercase tracking-widest opacity-40 mb-2">Toggle locks to require PIN for specific modules.</p>
            <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
              {tabs.map(tab => (
                <div key={tab} className="flex justify-between items-center px-6 py-4 bg-white hover:bg-slate-50 transition">
                  <div className="flex flex-col">
                    <span className="text-xs uppercase tracking-tight font-black">{tab === 'pos' ? 'Point of Sale' : tab}</span>
                    <span className="text-[8px] opacity-40 uppercase tracking-widest">{settings.lockedTabs.includes(tab) ? 'Currently Locked' : 'Public Access'}</span>
                  </div>
                  <button 
                    onClick={() => toggleTabLock(tab)} 
                    className={`w-12 h-6 rounded-full relative transition-all duration-300 shadow-inner ${settings.lockedTabs.includes(tab) ? 'bg-black' : 'bg-slate-200'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-sm ${settings.lockedTabs.includes(tab) ? 'right-1' : 'left-1'}`}></div>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-6 lg:col-span-2">
            <div className="flex items-center justify-center space-x-3 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
              <h3 className="text-xl uppercase tracking-tight">Database Recovery & Backups</h3>
            </div>
            <div className="flex flex-col sm:flex-row gap-6">
                <button onClick={handleBackup} className="flex-1 py-12 bg-black text-white rounded-[3rem] font-black uppercase text-xs tracking-widest hover:bg-slate-800 transition shadow-xl flex flex-col items-center justify-center space-y-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                  <span>Download Full System Backup</span>
                </button>
                <div 
                  onClick={() => restoreInputRef.current?.click()} 
                  className="flex-1 py-12 bg-white border-4 border-dashed border-slate-200 rounded-[3rem] font-black uppercase text-xs tracking-widest hover:border-black transition text-center cursor-pointer flex flex-col items-center justify-center space-y-3"
                >
                    <input type="file" ref={restoreInputRef} onChange={handleRestore} className="hidden" accept=".json" />
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-20"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                    <span className="opacity-60">Upload & Restore Database</span>
                </div>
            </div>
        </section>
      </div>
    </div>
  );
};

export default Settings;
