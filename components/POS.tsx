
import React, { useState, useMemo, useEffect } from 'react';
import { Product, SaleItem, Sale, Receipt, AppSettings, SuspendedOrder, Employee } from '../types';
import { useStore } from '../store';
import DrumVisualizer from './DrumVisualizer';

interface POSProps {
  products: Product[];
  employees: Employee[];
  onCompleteSale: (sale: Sale) => void;
  onUpdateProduct: (product: Product) => void;
  isDayClosed: boolean;
  settings: AppSettings;
  suspendedOrders: SuspendedOrder[];
  onSuspendOrder: (order: SuspendedOrder) => void;
  onRecallOrder: (id: string) => void;
}

const POS: React.FC<POSProps> = ({ products, employees, onCompleteSale, onUpdateProduct, isDayClosed, settings, suspendedOrders, onSuspendOrder, onRecallOrder }) => {
  const store = useStore();
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showRecallModal, setShowRecallModal] = useState(false);
  const [suspendName, setSuspendName] = useState('');
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<Sale['paymentMethod']>('cash');
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [splitCash, setSplitCash] = useState<number>(0);
  const [splitMPesa, setSplitMPesa] = useState<number>(0);
  const [splitCard, setSplitCard] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'bottles' | 'drums'>('bottles');
  const [isProcessing, setIsProcessing] = useState(false);

  const total = useMemo(() => cart.reduce((acc, i) => acc + (i.price * i.quantity), 0), [cart]);

  const changeDue = useMemo(() => {
    if (paymentMethod === 'cash') {
      return Math.max(0, cashReceived - total);
    }
    return 0;
  }, [cashReceived, total, paymentMethod]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesCategory = p.category === (activeTab === 'bottles' ? 'bottle' : 'drum');
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, activeTab, searchTerm]);

  useEffect(() => {
    if (paymentMethod === 'split') {
        setSplitCash(total);
        setSplitMPesa(0);
        setSplitCard(0);
    }
  }, [paymentMethod, total]);

  const handleTabToggle = (tab: 'bottles' | 'drums') => {
    setActiveTab(tab);
    setSearchTerm('');
  };

  const addToCart = (product: Product, volumeLabel: string) => {
    if (isDayClosed) return;

    const volumeML = volumeLabel === '1.0L' ? 1000 : (volumeLabel === '0.5L' ? 500 : 250);
    const isDrum = product.category === 'drum';
    const itemKey = isDrum ? `${product.id}-${volumeLabel}` : product.id;
    const price = isDrum ? (product.drumPrices?.[volumeLabel] || 0) : product.sellPrice;
    const name = isDrum ? `${product.name} (${volumeLabel})` : product.name;

    const existing = cart.find(i => i.id === itemKey);
    const cartQty = existing ? existing.quantity : 0;

    if (isDrum) {
        const totalVolumeRequested = (volumeML * (cartQty + 1));
        if (totalVolumeRequested > (product.currentLevel || 0)) {
            alert(`LIQUID EXHAUSTED: Drum only has ${(product.currentLevel || 0)}ml left.`);
            return;
        }
    } else {
        if (cartQty + 1 > product.stock) {
            alert(`STOCK ERROR: Only ${product.stock} units left.`);
            return;
        }
    }

    setCart(prev => {
      if (existing) {
        return prev.map(i => i === existing ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, {
        id: itemKey,
        name,
        productId: product.id,
        quantity: 1,
        price,
        type: isDrum ? 'drum-pour' : 'bottle',
        volume: volumeML
      }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    if (isDayClosed) return;
    setCart(prev => {
      const item = prev.find(i => i.id === id);
      if (!item) return prev;
      
      if (delta > 0) {
          const product = products.find(p => p.id === item.productId);
          if (product) {
              if (product.category === 'bottle' && item.quantity + 1 > product.stock) return prev;
              if (product.category === 'drum' && (item.volume! * (item.quantity + 1)) > (product.currentLevel || 0)) return prev;
          }
      }

      const newQty = item.quantity + delta;
      if (newQty <= 0) return prev.filter(i => i.id !== id);
      return prev.map(i => i.id === id ? { ...i, quantity: newQty } : i);
    });
  };

  const handleConfirmPayment = async () => {
    if (isProcessing) return;
    if (!selectedStaffId) {
        alert("SECURITY: Please select a Server (Staff) before completing the sale.");
        return;
    }
    setIsProcessing(true);

    const isSplit = paymentMethod === 'split';
    if (isSplit && (Math.abs((splitCash + splitMPesa + splitCard) - total) > 1)) {
        alert(`DISCREPANCY: Split totals must match KSH ${total.toLocaleString()}.`);
        setIsProcessing(false);
        return;
    }

    const vatRate = (settings.vatRate || 16) / 100;
    const saleId = `GXY-${Date.now()}`;
    const newSale: Sale = {
      id: saleId,
      timestamp: Date.now(),
      items: cart,
      total,
      paymentMethod,
      amountReceived: paymentMethod === 'cash' ? cashReceived : (paymentMethod === 'split' ? (splitCash + splitMPesa + splitCard) : total),
      changeGiven: paymentMethod === 'cash' ? changeDue : 0,
      splitBreakdown: isSplit ? { cash: splitCash, mpesa: splitMPesa, card: splitCard } : undefined,
      cashierId: selectedStaffId, 
      vatAmount: total * vatRate
    };

    const receipt: Receipt = {
      id: saleId,
      saleId: saleId,
      timestamp: Date.now(),
      total: total,
      content: JSON.stringify({
        store: settings.storeName,
        items: cart.map(i => ({ name: i.name, qty: i.quantity, price: i.price })),
        total: total,
        method: paymentMethod,
        tendered: newSale.amountReceived,
        change: newSale.changeGiven
      })
    };

    try {
      await store.completeSale(newSale, receipt);
      onCompleteSale(newSale);
      setLastSale(newSale);
      setCart([]);
      setShowPaymentModal(false);
      setShowReceiptModal(true);
    } catch (err) {
      alert(`DB ERROR: ${err}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSuspend = () => {
    if (cart.length === 0) return;
    const order: SuspendedOrder = {
        id: `SUS-${Date.now()}`,
        name: suspendName.trim() || `TABLE ${suspendedOrders.length + 1}`,
        items: cart,
        total: total,
        timestamp: Date.now()
    };
    onSuspendOrder(order);
    setCart([]);
    setSuspendName('');
    setShowSuspendModal(false);
  };

  const handleRecall = (order: SuspendedOrder) => {
    setCart(order.items);
    onRecallOrder(order.id);
    setShowRecallModal(false);
  };

  const activeStaffName = employees.find(e => e.id === selectedStaffId)?.name || 'Select Server';

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] overflow-hidden relative text-black">
      {isDayClosed && (
        <div className="absolute inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 text-center">
          <div className="bg-white p-12 rounded-[3rem] shadow-2xl max-w-md border-4 border-red-500">
            <h2 className="text-3xl font-black text-black uppercase tracking-tighter mb-4">SYSTEM LOCKED</h2>
            <p className="text-black font-bold text-sm uppercase tracking-widest opacity-70">Shift Ended. Audit Required to Unlock.</p>
          </div>
        </div>
      )}

      {suspendedOrders.length > 0 && (
        <button 
          onClick={() => setShowRecallModal(true)}
          className="absolute left-6 bottom-6 z-20 bg-indigo-600 text-white px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl flex items-center space-x-3 active:scale-95 transition-all"
        >
          <div className="w-6 h-6 rounded-full bg-white text-indigo-600 flex items-center justify-center text-xs font-black">{suspendedOrders.length}</div>
          <span>Active Tabs</span>
        </button>
      )}

      <div className="flex-1 overflow-y-auto p-6 bg-slate-50 border-r border-slate-200">
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 mb-6 sticky top-0 bg-slate-50 z-10 pb-4">
          <div className="flex space-x-2">
            <button onClick={() => handleTabToggle('bottles')} className={`px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition shadow-sm ${activeTab === 'bottles' ? 'bg-black text-white' : 'bg-white text-black border border-slate-200'}`}>Bottles</button>
            <button onClick={() => handleTabToggle('drums')} className={`px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition shadow-sm ${activeTab === 'drums' ? 'bg-black text-white' : 'bg-white text-black border border-slate-200'}`}>Drums</button>
          </div>
          
          <div className="flex-1 relative">
            <input 
              type="text" 
              placeholder="Search catalog..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl font-black text-xs uppercase tracking-widest outline-none focus:border-black transition shadow-sm placeholder:opacity-30"
            />
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </div>
        </div>

        {activeTab === 'bottles' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map(product => {
              const isLow = product.stock <= product.minThreshold;
              return (
                <button 
                  key={product.id}
                  onClick={() => addToCart(product, 'unit')}
                  disabled={isDayClosed || product.stock <= 0}
                  className={`bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all text-left group relative ${product.stock <= 0 ? 'opacity-40 grayscale' : ''}`}
                >
                  {isLow && product.stock > 0 && <div className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full animate-pulse border-2 border-white z-10"></div>}
                  <div className="aspect-square w-full rounded-2xl overflow-hidden mb-4 bg-slate-100">
                    <img src={product.image} className="w-full h-full object-cover transition group-hover:scale-110" />
                  </div>
                  <h4 className="font-black text-black text-[10px] mb-1 uppercase tracking-tight truncate">{product.name}</h4>
                  <div className="flex justify-between items-center">
                      <p className="text-indigo-700 font-black text-xs">KSH {product.sellPrice}</p>
                      <p className={`text-[8px] font-black uppercase ${isLow ? 'text-red-700' : 'opacity-40'}`}>S:{product.stock}</p>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredProducts.map(drum => (
              <div key={drum.id} className="grid grid-cols-1 md:grid-cols-5 gap-6 items-center bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <div className="md:col-span-2">
                  <DrumVisualizer currentLevel={drum.currentLevel || 0} capacity={drum.capacity || 50000} name={drum.name} />
                </div>
                <div className="md:col-span-3 grid grid-cols-1 gap-3">
                  {['1.0L', '0.5L', '0.25L'].map((size) => {
                    const price = drum.drumPrices?.[size] || 0;
                    const volumeML = size === '1.0L' ? 1000 : (size === '0.5L' ? 500 : 250);
                    const disabled = isDayClosed || (drum.currentLevel || 0) < volumeML || price === 0;
                    
                    return (
                      <button
                        key={size}
                        disabled={disabled}
                        onClick={() => addToCart(drum, size)}
                        className={`p-6 rounded-2xl border-2 flex justify-between items-center transition-all ${disabled ? 'opacity-20 cursor-not-allowed border-slate-100' : 'bg-slate-50 border-slate-100 hover:border-black active:scale-95'}`}
                      >
                        <div className="text-left">
                          <span className="block font-black text-xl leading-none">{size}</span>
                          <span className="text-[9px] font-black uppercase opacity-40">Standard Pour</span>
                        </div>
                        <div className="text-right">
                          <span className="block font-black text-xl text-indigo-700">KSH {price.toLocaleString()}</span>
                          <span className="text-[8px] font-black uppercase opacity-40">Preset Value</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="w-full lg:w-[400px] bg-white flex flex-col shadow-2xl relative z-10">
        <div className="p-8 border-b border-slate-100">
           <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-black uppercase tracking-tighter">BASKET</h3>
              <button onClick={() => setCart([])} className="text-red-600 text-[9px] font-black uppercase tracking-widest hover:underline">Flush</button>
           </div>
           
           <div className="relative">
              <select 
                value={selectedStaffId} 
                onChange={(e) => setSelectedStaffId(e.target.value)}
                className="w-full px-6 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest appearance-none cursor-pointer border-none shadow-lg"
              >
                <option value="">Choose Serving Staff</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.role})</option>)}
              </select>
              <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m6 9 6 6 6-6"/></svg>
              </div>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {cart.map(item => (
            <div key={item.id} className="flex justify-between items-center bg-slate-50 p-5 rounded-3xl border border-slate-100 group">
              <div className="flex-1 pr-4">
                <h5 className="font-black text-black text-[11px] uppercase tracking-tight truncate">{item.name}</h5>
                <p className="text-[10px] text-indigo-700 font-black">KSH {item.price.toLocaleString()}</p>
              </div>
              <div className="flex items-center space-x-3">
                <button onClick={() => updateQuantity(item.id, -1)} className="w-10 h-10 rounded-xl bg-white border border-slate-200 font-black flex items-center justify-center hover:bg-slate-100 transition shadow-sm">-</button>
                <span className="font-black text-sm w-4 text-center">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.id, 1)} className="w-10 h-10 rounded-xl bg-black text-white font-black flex items-center justify-center hover:bg-slate-800 transition shadow-sm">+</button>
              </div>
            </div>
          ))}
          {cart.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center opacity-10">
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-4"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 2 1.57l1.65-7.43H5.12"/></svg>
              <p className="font-black text-[10px] uppercase tracking-widest">Cart Disengaged</p>
            </div>
          )}
        </div>

        <div className="p-10 bg-white border-t border-slate-100 space-y-8">
          <div className="flex justify-between items-center">
            <span className="text-4xl font-black text-black tracking-tighter uppercase">TOTAL</span>
            <span className="text-4xl font-black text-black tracking-tighter uppercase">KSH {total.toLocaleString()}</span>
          </div>
          
          <div className="space-y-4">
            <button 
              onClick={() => { setShowPaymentModal(true); setCashReceived(0); }}
              disabled={cart.length === 0 || isDayClosed || isProcessing || !selectedStaffId}
              className="w-full bg-black text-white py-6 rounded-full font-black text-lg uppercase tracking-widest shadow-2xl hover:bg-slate-800 disabled:opacity-30 transition-all active:scale-95"
            >
              {isProcessing ? 'COMMITTING...' : 'PROCESS PAYMENT'}
            </button>
            
            <button 
              onClick={() => setShowSuspendModal(true)}
              disabled={cart.length === 0 || isDayClosed}
              className="w-full bg-slate-100 text-black py-5 rounded-full font-black text-xs uppercase tracking-[0.2em] shadow-sm hover:bg-slate-200 disabled:opacity-30 transition-all active:scale-95"
            >
              SUSPEND ORDER (TAB)
            </button>
          </div>
        </div>
      </div>

      {showSuspendModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-sm p-10 shadow-2xl">
            <h3 className="text-xl font-black text-center uppercase tracking-tighter mb-8">TAB DISPOSITION</h3>
            <input 
              type="text" value={suspendName} onChange={(e) => setSuspendName(e.target.value)} 
              className="w-full px-6 py-5 bg-slate-50 rounded-2xl font-black text-center uppercase text-sm outline-none focus:ring-2 focus:ring-black mb-6"
              placeholder="TABLE NO / CLIENT NAME"
              autoFocus
            />
            <div className="flex space-x-3">
              <button onClick={() => setShowSuspendModal(false)} className="flex-1 py-5 bg-slate-100 rounded-2xl font-black uppercase text-[10px]">Back</button>
              <button onClick={handleSuspend} className="flex-[2] py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] shadow-lg">Save Tab</button>
            </div>
          </div>
        </div>
      )}

      {showRecallModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 text-black">
          <div className="bg-white rounded-[3rem] w-full max-w-lg p-10 shadow-2xl max-h-[80vh] flex flex-col">
            <h3 className="text-2xl font-black text-center uppercase tracking-tighter mb-8 shrink-0">ACTIVE BAR TABS</h3>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
              {suspendedOrders.map(order => (
                <div key={order.id} className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex justify-between items-center group hover:bg-white hover:shadow-lg transition-all">
                  <div>
                    <h4 className="font-black text-black uppercase text-sm">{order.name}</h4>
                    <p className="text-[10px] font-black uppercase opacity-40">{order.items.length} Items • KSH {order.total.toLocaleString()}</p>
                    <p className="text-[8px] font-black opacity-20">{new Date(order.timestamp).toLocaleTimeString()}</p>
                  </div>
                  <button onClick={() => handleRecall(order)} className="bg-black text-white px-6 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest active:scale-95 transition">Restore</button>
                </div>
              ))}
            </div>
            <button onClick={() => setShowRecallModal(false)} className="w-full mt-6 py-5 bg-slate-100 rounded-2xl font-black uppercase text-[10px] shrink-0">Close Overlay</button>
          </div>
        </div>
      )}

      {showPaymentModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 text-black">
          <div className="bg-white rounded-[3rem] w-full max-w-lg p-10 shadow-2xl">
            <h3 className="text-2xl font-black text-center uppercase tracking-tighter mb-8">SETTLEMENT VERIFICATION</h3>
            <div className="space-y-6">
              <div className="p-8 bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] text-center">
                <p className="text-[10px] font-black opacity-30 uppercase tracking-[0.4em] mb-2">Checkout Total</p>
                <p className="text-5xl font-black text-black">KSH {total.toLocaleString()}</p>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {(['cash', 'm-pesa', 'card', 'split'] as const).map(method => (
                  <button key={method} onClick={() => setPaymentMethod(method)} className={`py-4 rounded-2xl font-black text-[9px] uppercase border-2 transition-all ${paymentMethod === method ? 'bg-black text-white border-black' : 'bg-white text-black border-slate-100'}`}>{method}</button>
                ))}
              </div>
              {paymentMethod === 'split' ? (
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[8px] font-black uppercase opacity-40 ml-1">Cash</label>
                    <input type="number" value={splitCash || ''} onChange={(e) => setSplitCash(Number(e.target.value))} className="w-full px-3 py-3 bg-slate-50 rounded-xl font-black text-sm outline-none border border-slate-100" placeholder="0" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black uppercase opacity-40 ml-1">M-Pesa</label>
                    <input type="number" value={splitMPesa || ''} onChange={(e) => setSplitMPesa(Number(e.target.value))} className="w-full px-3 py-3 bg-slate-50 rounded-xl font-black text-sm text-emerald-700 outline-none border border-slate-100" placeholder="0" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black uppercase opacity-40 ml-1">Card</label>
                    <input type="number" value={splitCard || ''} onChange={(e) => setSplitCard(Number(e.target.value))} className="w-full px-3 py-3 bg-slate-50 rounded-xl font-black text-sm text-indigo-700 outline-none border border-slate-100" placeholder="0" />
                  </div>
                </div>
              ) : (
                <input 
                  type="number" value={cashReceived || ''} onChange={(e) => setCashReceived(Number(e.target.value))} 
                  className="w-full px-6 py-5 bg-slate-50 rounded-[1.5rem] font-black text-4xl text-center outline-none focus:ring-2 focus:ring-black"
                  placeholder="KES TENDERED"
                  autoFocus
                />
              )}
              {paymentMethod === 'cash' && cashReceived >= total && (
                <div className="p-4 bg-slate-900 rounded-2xl text-center animate-in slide-in-from-bottom-2">
                   <p className="text-[8px] font-black text-indigo-300 uppercase tracking-widest">Change Due</p>
                   <p className="text-3xl font-black text-white">KSH {(cashReceived - total).toLocaleString()}</p>
                </div>
              )}
              <div className="flex space-x-3 pt-4">
                <button onClick={() => setShowPaymentModal(false)} className="flex-1 py-5 bg-slate-100 rounded-2xl font-black uppercase text-[10px]">Back</button>
                <button 
                  disabled={isProcessing || (paymentMethod === 'cash' && cashReceived < total)} 
                  onClick={handleConfirmPayment} 
                  className="flex-[2] py-5 bg-emerald-700 text-white rounded-2xl font-black uppercase text-[10px] shadow-lg hover:bg-emerald-800 disabled:opacity-20 transition-all"
                >
                   Finalize Checkout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showReceiptModal && lastSale && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl">
            <div id="printable-customer-receipt" className="border-4 border-dashed border-black p-8 rounded-[2rem] bg-white font-mono leading-tight text-black text-[11px]">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-black uppercase tracking-tighter">{settings.storeName}</h2>
                <div className="border-t border-black border-dashed my-3"></div>
                <p className="font-black uppercase bg-black text-white px-2 py-1 inline-block">Order Complete</p>
              </div>
              <div className="space-y-1 mb-4 font-bold">
                <p>TRANS: {lastSale.id}</p>
                <p>DATE: {new Date(lastSale.timestamp).toLocaleDateString()}</p>
                <p>SERVER: {employees.find(e => e.id === lastSale.cashierId)?.name}</p>
              </div>
              <div className="space-y-2 mb-4 border-y border-black border-dashed py-3">
                {lastSale.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start">
                    <span className="flex-1 uppercase font-bold pr-2">{item.name} x{item.quantity}</span>
                    <span className="font-black">{(item.quantity * item.price).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between font-black text-2xl pt-2"><span>TOTAL:</span><span>KSH {lastSale.total.toLocaleString()}</span></div>
              <div className="text-[8px] mt-1 font-bold opacity-40 italic">VAT Included: {settings.vatRate}%</div>
              <div className="text-center mt-8 pt-4 border-t border-black border-dashed font-black uppercase tracking-widest opacity-40">Records Verified</div>
            </div>
            <div className="flex space-x-3 mt-8 print:hidden">
              <button onClick={() => {setShowReceiptModal(false); setLastSale(null);}} className="flex-1 py-5 bg-slate-100 rounded-2xl font-black uppercase text-[10px]">Dismiss</button>
              <button onClick={() => window.print()} className="flex-[2] py-5 bg-black text-white rounded-2xl font-black uppercase text-[10px] shadow-lg">Print Receipt</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POS;
