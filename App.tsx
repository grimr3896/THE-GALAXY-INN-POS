
import React, { useState, useEffect } from 'react';
import { useStore } from './store';
import { Tab, Product, Sale, Employee, AppSettings, Expense, CashUp, DayShift, AuditLog } from './types';
import Dashboard from './components/Dashboard';
import POS from './components/POS';
import Inventory from './components/Inventory';
import Reports from './components/Reports';
import History from './components/History';
import Expenses from './components/Expenses';
import CashUpView from './components/CashUp';
import Employees from './components/Employees';
import Settings from './components/Settings';
import AuthModal from './components/AuthModal';

const TabIcons: Record<Tab, React.ReactNode> = {
  dashboard: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>,
  pos: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>,
  inventory: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>,
  history: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>,
  expenses: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 17.5V6.5"/></svg>,
  cashup: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 15h2a2 2 0 1 0 0-4h-3a2 2 0 1 1 0-4h2"/><path d="M12 17V7"/><circle cx="12" cy="12" r="10"/></svg>,
  reports: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>,
  employees: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  settings: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
};

const App: React.FC = () => {
  const store = useStore();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [loading, setLoading] = useState(true);

  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [cashups, setCashUps] = useState<CashUp[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [audits, setAudits] = useState<AuditLog[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [currentShift, setCurrentShift] = useState<DayShift | null>(null);

  // Auth Gate state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingTab, setPendingTab] = useState<Tab | null>(null);

  const initData = async () => {
    try {
      const data = await store.loadAll();
      setProducts(data.products);
      setSales(data.sales);
      setExpenses(data.expenses);
      setCashUps(data.cashups);
      setEmployees(data.employees);
      setAudits(data.audits);
      setSettings(data.settings);
      setCurrentShift(data.currentShift);
      setLoading(false);
    } catch (err) {
      console.error("Failed to load local DB", err);
    }
  };

  useEffect(() => {
    initData();
  }, []);

  const handleTabClick = (tab: Tab) => {
    if (settings?.lockedTabs.includes(tab)) {
      setPendingTab(tab);
      setShowAuthModal(true);
    } else {
      setActiveTab(tab);
    }
  };

  const handleAuthSuccess = () => {
    if (pendingTab) {
      setActiveTab(pendingTab);
    }
    setShowAuthModal(false);
    setPendingTab(null);
  };

  const logAction = (action: string, details: string, severity: AuditLog['severity'] = 'info') => {
    const log: AuditLog = {
      id: `LOG-${Date.now()}`,
      timestamp: Date.now(),
      action,
      details,
      userId: 'admin',
      severity
    };
    setAudits(prev => [log, ...prev].slice(0, 100));
    store.saveAudit(log);
  };

  const handleUpdateProduct = (p: Product) => {
    const old = products.find(i => i.id === p.id);
    if (old && old.stock !== p.stock) logAction('STOCK_EDIT', `${p.name}: ${old.stock} -> ${p.stock}`, 'warning');
    setProducts(prev => prev.map(item => item.id === p.id ? p : item));
    store.saveProduct(p);
  };

  const handleCompleteSale = (s: Sale) => {
    setSales(prev => [s, ...prev]);
    store.saveSale(s);
  };

  const handleAddExpense = (e: Expense) => {
    logAction('EXPENSE_ADD', `New expense: ${e.description} (KSH ${e.amount})`, 'info');
    setExpenses(prev => [e, ...prev]);
    store.saveExpense(e);
  };

  const handleDeleteExpense = (id: string) => {
    const e = expenses.find(i => i.id === id);
    if (e) logAction('EXPENSE_DELETE', `Deleted: ${e.description}`, 'critical');
    setExpenses(prev => prev.filter(e => e.id !== id));
    store.deleteExpense(id);
  };

  const handleToggleShift = async (isClosed: boolean) => {
    if (currentShift) {
        if (isClosed) {
            logAction('DAY_CLOSE', `Business Day Closed at ${new Date().toLocaleTimeString()}`, 'warning');
            const data = { backupDate: new Date().toISOString(), products, sales, expenses, cashups };
            const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `auto_backup_${new Date().toISOString().split('T')[0]}.json`;
            link.click();
        } else {
            logAction('DAY_REOPEN', `Business Day Reopened manually`, 'critical');
        }
        const updatedShift = { ...currentShift, isClosed, closedAt: isClosed ? Date.now() : undefined };
        setCurrentShift(updatedShift);
        await store.saveShift(updatedShift);
    }
  };

  if (loading || !settings) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-indigo-400 font-black uppercase tracking-widest text-xs">OFFLINE SECURE INIT...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-black">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-white flex flex-col shadow-2xl relative z-30">
        <div className="p-8 text-white">
          <h1 className="text-2xl font-black tracking-tighter text-indigo-400">GALAXY INN</h1>
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-[0.2em] mt-1">Standalone Offline POS</p>
        </div>
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto pb-4">
          {(Object.keys(TabIcons) as Tab[]).map((tab) => {
            const isLocked = settings.lockedTabs.includes(tab);
            return (
              <button 
                key={tab} 
                onClick={() => handleTabClick(tab)} 
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
              >
                <div className="flex items-center space-x-3">
                  {TabIcons[tab]}
                  <span className="capitalize">{tab === 'pos' ? 'Point of Sale' : tab}</span>
                </div>
                {isLocked && (
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="opacity-40"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                )}
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center space-x-3 p-3 bg-slate-800/50 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-xs uppercase shadow-sm">AD</div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-black truncate uppercase tracking-tighter">Administrator</p>
              <div className="flex items-center space-x-1">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Local Integrity OK</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative bg-slate-50">
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-20 backdrop-blur-md">
          <h2 className="text-lg font-black text-black uppercase tracking-tight">{activeTab}</h2>
          <div className="text-black text-[10px] font-black uppercase tracking-[0.2em]">
            {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </header>

        <div className="text-black">
          {activeTab === 'dashboard' && (
            <Dashboard 
              sales={sales} products={products} expenses={expenses} isDayClosed={currentShift?.isClosed || false}
              onToggleShift={handleToggleShift} audits={audits}
            />
          )}
          {activeTab === 'pos' && (
            <POS 
              products={products} onUpdateProduct={handleUpdateProduct}
              onCompleteSale={handleCompleteSale} isDayClosed={currentShift?.isClosed || false}
            />
          )}
          {activeTab === 'inventory' && (
            <Inventory 
              products={products} 
              onAddProduct={(p) => { setProducts(prev => [...prev, p]); store.saveProduct(p); logAction('PROD_ADD', `New: ${p.name}`); }} 
              onUpdateProduct={handleUpdateProduct} 
              onDeleteProduct={(id) => { setProducts(prev => prev.filter(p => p.id !== id)); logAction('PROD_DEL', `ID: ${id}`, 'critical'); }} 
              adminPin={settings.adminPin}
            />
          )}
          {activeTab === 'history' && <History sales={sales.slice(0, 100)} employees={employees} products={products} />}
          {activeTab === 'expenses' && <Expenses expenses={expenses} onAddExpense={handleAddExpense} onDeleteExpense={handleDeleteExpense} />}
          {activeTab === 'cashup' && <CashUpView sales={sales} cashups={cashups} onAddCashUp={(c) => { setCashUps(prev => [c, ...prev]); store.saveCashUp(c); logAction('CASH_UP', `Reconciled with variance ${c.variance}`); }} />}
          {activeTab === 'reports' && <Reports sales={sales} settings={settings} />}
          {activeTab === 'employees' && <Employees employees={employees} onUpdateEmployees={(es) => { setEmployees(es); store.saveEmployees(es); }} />}
          {activeTab === 'settings' && <Settings settings={settings} onUpdateSettings={(s) => { setSettings(s); store.saveSettings(s); logAction('CONFIG_CHANGE', 'Settings updated'); }} sales={sales} products={products} expenses={expenses} cashups={cashups} employees={employees} onReloadData={initData} />}
        </div>
      </main>

      {/* Auth Modal (Gate) */}
      {showAuthModal && (
        <AuthModal 
          correctPin={settings.adminPin} 
          onSuccess={handleAuthSuccess} 
          onCancel={() => setShowAuthModal(false)} 
        />
      )}
    </div>
  );
};

export default App;
