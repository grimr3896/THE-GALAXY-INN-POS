
import React, { useState, useMemo, useEffect } from 'react';
import { Product, SaleItem, Sale, Receipt, AppSettings, Employee, DrumPourOption } from '../types';
import { useStore } from '../store';
import DrumVisualizer from './DrumVisualizer';

interface POSProps {
  products: Product[];
  employees: Employee[];
  sales: Sale[];
  onCompleteSale: (sale: Sale) => void;
  onUpdateProduct: (product: Product) => void;
  isDayClosed: boolean;
  settings: AppSettings;
}

const POS: React.FC<POSProps> = ({ products, employees, sales, onCompleteSale, onUpdateProduct, isDayClosed, settings }) => {
  const store = useStore();
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [tableNumber, setTableNumber] = useState<string>('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [settlingSale, setSettlingSale] = useState<Sale | null>(null);
  const [isDirectPay, setIsDirectPay] = useState(false);
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<Sale['paymentMethod']>('cash');
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [splitCash, setSplitCash] = useState<number>(0);
  const [splitMPesa, setSplitMPesa] = useState<number>(0);
  const [splitCard, setSplitCard] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'bottles' | 'drums' | 'tabs'>('bottles');
  const [isProcessing, setIsProcessing] = useState(false);

  const total = useMemo(() => cart.reduce((acc, i) => acc + (i.price * i.quantity), 0), [cart]);

  const openSales = useMemo(() => sales.filter(s => s.status === 'issued'), [sales]);

  const changeDue = useMemo(() => {
    const settleTotal = settlingSale ? settlingSale.total : (isDirectPay ? total : 0);
    if (paymentMethod === 'cash') {
      return Math.max(0, cashReceived - settleTotal);
    }
    return 0;
  }, [cashReceived, settlingSale, total, isDirectPay, paymentMethod]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesCategory = p.category === (activeTab === 'bottles' ? 'bottle' : 'drum');
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, activeTab, searchTerm]);

  useEffect(() => {
    if (paymentMethod === 'split') {
        const settleTotal = settlingSale ? settlingSale.total : total;
        setSplitCash(settleTotal);
        setSplitMPesa(0);
        setSplitCard(0);
    }
  }, [paymentMethod, settlingSale, total]);

  const handleTabToggle = (tab: 'bottles' | 'drums' | 'tabs') => {
    setActiveTab(tab);
    setSearchTerm('');
  };

  const addToCart = (product: Product, pourOption?: DrumPourOption) => {
    if (isDayClosed) return;

    const isDrum = product.category === 'drum';
    const volumeML = isDrum && pourOption ? pourOption.volume : 0;
    const itemKey = isDrum && pourOption ? `${product.id}-${pourOption.label}` : product.id;
    const price = isDrum && pourOption ? pourOption.price : product.sellPrice;
    const name = isDrum && pourOption ? `${product.name} (${pourOption.label})` : product.name;

    const existing = cart.find(i => i.id === itemKey);
    const cartQty = existing ? existing.quantity : 0;

    if (isDrum) {
        if (!pourOption) return;
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

  const handleIssueItems = async () => {
    if (isProcessing) return;
    if (!selectedStaffId) {
        alert("ACTION REQUIRED: Select a Waiter to suspend this order to.");
        return;
    }
    if (cart.length === 0) return;

    setIsProcessing(true);
    const vatRate = (settings.vatRate || 16) / 100;
    const timestamp = Date.now();
    const orderNo = timestamp.toString().slice(-4);
    const saleId = `ISS-${orderNo}`;
    
    const issuedSale: Sale = {
      id: saleId,
      timestamp,
      items: cart,
      total,
      paymentMethod: 'cash',
      status: 'issued',
      cashierId: selectedStaffId, 
      tableNumber: tableNumber.trim() || undefined,
      vatAmount: total * vatRate
    };

    try {
      await store.completeSale(issuedSale, { id: saleId, saleId, timestamp, total, content: 'ISSUED' });
      onCompleteSale(issuedSale);
      setCart([]);
      setTableNumber('');
      setSelectedStaffId('');
      alert(`ORDER SUSPENDED: Items assigned to ${employees.find(e => e.id === selectedStaffId)?.name} as #${orderNo}`);
    } catch (err) {
      alert(`SYSTEM ERROR: ${err}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDirectPay = () => {
    if (!selectedStaffId) {
      alert("WAIT: Please select the staff member taking this payment.");
      return;
    }
    setIsDirectPay(true);
    setSettlingSale(null);
    setPaymentMethod('cash');
    setCashReceived(0);
    setShowPaymentModal(true);
  };

  const handleOpenSettlement = (sale: Sale) => {
    setIsDirectPay(false);
    setSettlingSale(sale);
    setPaymentMethod('cash');
    setCashReceived(0);
    setShowPaymentModal(true);
  };

  const handleConfirmSettlement = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    const isSplit = paymentMethod === 'split';
    const currentTotal = settlingSale ? settlingSale.total : total;

    if (isSplit && (Math.abs((splitCash + splitMPesa + splitCard) - currentTotal) > 1)) {
        alert(`SPLIT MISMATCH: Total must equal KSH ${currentTotal.toLocaleString()}.`);
        setIsProcessing(false);
        return;
    }

    if (isDirectPay) {
      const vatRate = (settings.vatRate || 16) / 100;
      const orderNo = Date.now().toString().slice(-4);
      const saleId = `DIR-${orderNo}`;
      const newSale: Sale = {
        id: saleId,
        timestamp: Date.now(),
        settledAt: Date.now(),
        items: cart,
        total,
        paymentMethod,
        status: 'settled',
        amountReceived: paymentMethod === 'cash' ? cashReceived : (paymentMethod === 'split' ? (splitCash + splitMPesa + splitCard) : total),
        changeGiven: paymentMethod === 'cash' ? changeDue : 0,
        splitBreakdown: isSplit ? { cash: splitCash, mpesa: splitMPesa, card: splitCard } : undefined,
        cashierId: selectedStaffId,
        tableNumber: tableNumber.trim() || undefined,
        vatAmount: total * vatRate
      };

      try {
        await store.completeSale(newSale, { id: saleId, saleId, timestamp: Date.now(), total, content: 'DIRECT' });
        onCompleteSale(newSale);
        setLastSale(newSale);
        setShowPaymentModal(false);
        setShowReceiptModal(true);
      } catch (err) {
        alert(`DIRECT PAY ERROR: ${err}`);
      } finally {
        setIsProcessing(false);
      }
    } else if (settlingSale) {
      const updatedSale: Sale = {
        ...settlingSale,
        status: 'settled',
        settledAt: Date.now(),
        paymentMethod,
        amountReceived: paymentMethod === 'cash' ? cashReceived : (paymentMethod === 'split' ? (splitCash + splitMPesa + splitCard) : settlingSale.total),
        changeGiven: paymentMethod === 'cash' ? changeDue : 0,
        splitBreakdown: isSplit ? { cash: splitCash, mpesa: splitMPesa, card: splitCard } : undefined,
      };

      try {
        await store.saveSale(updatedSale);
        onCompleteSale(updatedSale);
        setLastSale(updatedSale);
        setShowPaymentModal(false);
        setSettlingSale(null);
        setShowReceiptModal(true);
      } catch (err) {
        alert(`SETTLE ERROR: ${err}`);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleNextSale = () => {
    setCart([]);
    setTableNumber('');
    setSelectedStaffId('');
    setShowReceiptModal(false);
    setLastSale(null);
    setIsDirectPay(false);
    setSettlingSale(null);
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] overflow-hidden relative text-black">
      {isDayClosed && (
        <div className="absolute inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 text-center">
          <div className="bg-white p-12 rounded-[3rem] shadow-2xl max-w-md border-4 border-red-500">
            <h2 className="text-3xl font-black text-black uppercase tracking-tighter mb-4">SYSTEM LOCKED</h2>
            <p className="text-black font-bold text-sm uppercase tracking-widest opacity-70">Day Closed. Manager Re-Auth Needed.</p>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-6 bg-slate-50 border-r border-slate-200">
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 mb-6 sticky top-0 bg-slate-50 z-10 pb-4">
          <div className="flex space-x-2">
            <button onClick={() => handleTabToggle('bottles')} className={`px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition shadow-sm ${activeTab === 'bottles' ? 'bg-black text-white' : 'bg-white text-black border border-slate-200'}`}>Bottles</button>
            <button onClick={() => handleTabToggle('drums')} className={`px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition shadow-sm ${activeTab === 'drums' ? 'bg-black text-white' : 'bg-white text-black border border-slate-200'}`}>Drums</button>
            <button onClick={() => handleTabToggle('tabs')} className={`px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition shadow-sm relative ${activeTab === 'tabs' ? 'bg-indigo-600 text-white' : 'bg-white text-black border border-slate-200'}`}>
                SUSPENDED TABS
                {openSales.length > 0 && <span className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black">{openSales.length}</span>}
            </button>
          </div>
          
          <div className="flex-1 relative">
            <input 
              type="text" 
              placeholder="Search products..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-6 py-4 bg-white border-2 border-slate-200 rounded-2xl font-black text-xs uppercase tracking-widest outline-none focus:border-black transition shadow-sm placeholder:text-slate-400"
            />
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </div>
        </div>

        {activeTab === 'tabs' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {openSales.map(sale => {
                const waiter = employees.find(e => e.id === sale.cashierId);
                const orderNumber = sale.id.split('-').pop();
                return (
                    <div key={sale.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-lg hover:border-indigo-600 transition-all flex flex-col justify-between group">
                        <div>
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h4 className="font-black text-black text-lg uppercase tracking-tight flex items-center">
                                      {waiter?.name || 'Unknown Staff'} 
                                      <span className="ml-2 bg-black text-white px-2 py-0.5 rounded text-[10px] font-black">#{orderNumber}</span>
                                    </h4>
                                    <p className="text-[10px] font-black opacity-30 uppercase tracking-widest mt-1">Pending Settlement</p>
                                </div>
                                {sale.tableNumber && <span className="bg-slate-100 text-black px-3 py-1 rounded-lg text-[9px] font-black uppercase border border-slate-200">TBL: {sale.tableNumber}</span>}
                            </div>
                            <div className="space-y-2 mb-6 max-h-40 overflow-y-auto pr-2 scrollbar-hide">
                                {sale.items.map((it, idx) => (
                                    <div key={idx} className="flex justify-between text-[11px] font-black uppercase">
                                        <span className="opacity-40">{it.quantity}x {it.name}</span>
                                        <span>{(it.price * it.quantity).toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="pt-6 border-t border-slate-100 flex justify-between items-end">
                            <div>
                                <p className="text-[9px] font-black uppercase opacity-40">Tab Value</p>
                                <p className="text-2xl font-black">KSH {sale.total.toLocaleString()}</p>
                            </div>
                            <button 
                                onClick={() => handleOpenSettlement(sale)}
                                className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-black text-[9px] uppercase tracking-[0.2em] shadow-lg hover:bg-emerald-700 transition active:scale-95"
                            >
                                Settle Now
                            </button>
                        </div>
                    </div>
                );
            })}
            {openSales.length === 0 && (
                <div className="col-span-full py-32 text-center opacity-20">
                    <p className="font-black text-3xl uppercase tracking-tighter">No Suspended Tabs</p>
                    <p className="text-sm font-black uppercase tracking-widest mt-2">All issued inventory is cleared.</p>
                </div>
            )}
          </div>
        ) : activeTab === 'bottles' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map(product => (
              <button 
                key={product.id}
                onClick={() => addToCart(product)}
                disabled={isDayClosed || product.stock <= 0}
                className={`bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all text-left group ${product.stock <= 0 ? 'opacity-40 grayscale' : ''}`}
              >
                <div className="aspect-square w-full rounded-2xl overflow-hidden mb-4 bg-slate-100">
                  <img src={product.image} className="w-full h-full object-cover transition group-hover:scale-110" />
                </div>
                <h4 className="font-black text-black text-[10px] mb-1 uppercase tracking-tight truncate">{product.name}</h4>
                <div className="flex justify-between items-center">
                    <p className="text-indigo-700 font-black text-xs">KSH {product.sellPrice}</p>
                    <p className={`text-[8px] font-black uppercase ${product.stock < product.minThreshold ? 'text-red-700' : 'opacity-40'}`}>S:{product.stock}</p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredProducts.map(drum => (
              <div key={drum.id} className="grid grid-cols-1 md:grid-cols-5 gap-6 items-center bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <div className="md:col-span-2">
                  <DrumVisualizer currentLevel={drum.currentLevel || 0} capacity={drum.capacity || 50000} name={drum.name} />
                </div>
                <div className="md:col-span-3 grid grid-cols-1 gap-3">
                  {(drum.drumPours || []).map((pour, idx) => {
                    const disabled = isDayClosed || (drum.currentLevel || 0) < pour.volume || pour.price === 0;
                    return (
                      <button
                        key={idx}
                        disabled={disabled}
                        onClick={() => addToCart(drum, pour)}
                        className={`p-6 rounded-2xl border-2 border-slate-100 flex justify-between items-center transition-all ${disabled ? 'opacity-20 cursor-not-allowed' : 'bg-slate-50 hover:border-black active:scale-95'}`}
                      >
                        <div className="text-left">
                          <span className="block font-black text-xl leading-none">{pour.label}</span>
                          <span className="text-[9px] font-black uppercase opacity-40">{pour.volume} ML POUR</span>
                        </div>
                        <div className="text-right">
                          <span className="block font-black text-xl text-indigo-700">KSH {pour.price.toLocaleString()}</span>
                        </div>
                      </button>
                    );
                  })}
                  {(drum.drumPours || []).length === 0 && (
                      <div className="p-10 text-center opacity-20 border-2 border-dashed border-slate-200 rounded-3xl">
                          <p className="text-[10px] font-black uppercase tracking-widest">No pour options configured in inventory.</p>
                      </div>
                  )}
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
           
           <div className="space-y-4">
              <div className="relative">
                <select 
                  value={selectedStaffId} 
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  className="w-full px-6 py-5 bg-white text-black border-4 border-black rounded-3xl font-black text-[13px] uppercase tracking-widest appearance-none cursor-pointer shadow-xl hover:bg-slate-50 focus:ring-4 focus:ring-black outline-none transition-all"
                >
                  <option value="" className="text-black">CHOOSE WAITER / STAFF</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id} className="text-black">{e.name} ({e.role.toUpperCase()})</option>
                  ))}
                </select>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-black">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="m6 9 6 6 6-6"/></svg>
                </div>
              </div>
              
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="TABLE NUMBER (OPTIONAL)" 
                  value={tableNumber} 
                  onChange={(e) => setTableNumber(e.target.value)} 
                  className="w-full px-6 py-5 bg-white border-2 border-slate-300 rounded-3xl font-black text-[13px] uppercase tracking-widest outline-none focus:border-black placeholder:text-slate-500 text-black shadow-inner"
                />
              </div>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {cart.map(item => (
            <div key={item.id} className="flex justify-between items-center bg-slate-50 p-5 rounded-3xl border border-slate-100">
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
              <p className="font-black text-[10px] uppercase tracking-widest">Select Items</p>
            </div>
          )}
        </div>

        <div className="p-10 bg-white border-t border-slate-100 space-y-4">
          <div className="flex justify-between items-center mb-4">
            <span className="text-3xl font-black text-black tracking-tighter uppercase">KSH {total.toLocaleString()}</span>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            <button 
                onClick={handleIssueItems}
                disabled={cart.length === 0 || isDayClosed || isProcessing || !selectedStaffId}
                className="w-full bg-slate-100 text-black py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-sm hover:bg-slate-200 disabled:opacity-30 transition-all active:scale-95 border-2 border-slate-200"
            >
                {isProcessing ? 'PROCESSING...' : 'ISSUE TO WAITER (SUSPEND)'}
            </button>
            <button 
                onClick={handleDirectPay}
                disabled={cart.length === 0 || isDayClosed || isProcessing || !selectedStaffId}
                className="w-full bg-black text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-slate-800 disabled:opacity-30 transition-all active:scale-95"
            >
                {isProcessing ? 'WAITING...' : 'DIRECT PAY (SETTLE NOW)'}
            </button>
          </div>
        </div>
      </div>

      {showPaymentModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 text-black">
          <div className="bg-white rounded-[3rem] w-full max-w-lg p-10 shadow-2xl">
            <h3 className="text-2xl font-black text-center uppercase tracking-tighter mb-8">
              {isDirectPay ? 'DIRECT CHECKOUT' : 'TAB SETTLEMENT'}
            </h3>
            <div className="space-y-6">
              <div className="p-8 bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] text-center">
                <p className="text-[10px] font-black opacity-30 uppercase tracking-[0.4em] mb-2">Total Due</p>
                <p className="text-5xl font-black text-black">KSH {(settlingSale ? settlingSale.total : total).toLocaleString()}</p>
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
                  placeholder="AMOUNT RECEIVED"
                  autoFocus
                />
              )}
              {paymentMethod === 'cash' && cashReceived >= (settlingSale ? settlingSale.total : total) && (
                <div className="p-4 bg-slate-900 rounded-2xl text-center animate-in slide-in-from-bottom-2">
                   <p className="text-[8px] font-black text-indigo-300 uppercase tracking-widest">Change Due</p>
                   <p className="text-3xl font-black text-white">KSH {changeDue.toLocaleString()}</p>
                </div>
              )}
              <div className="flex space-x-3 pt-4">
                <button onClick={() => setShowPaymentModal(false)} className="flex-1 py-5 bg-slate-100 rounded-2xl font-black uppercase text-[10px]">Back</button>
                <button 
                  disabled={isProcessing || (paymentMethod === 'cash' && cashReceived < (settlingSale ? settlingSale.total : total))} 
                  onClick={handleConfirmSettlement} 
                  className="flex-[2] py-5 bg-emerald-700 text-white rounded-2xl font-black uppercase text-[10px] shadow-lg hover:bg-emerald-800 disabled:opacity-20 transition-all"
                >
                   Finalize Transaction
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showReceiptModal && lastSale && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[120] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-10 text-center">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600 animate-bounce">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <h2 className="text-3xl font-black text-black uppercase tracking-tighter">TRANSACTION SUCCESS</h2>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-2">Sale Recorded and Ledger Updated</p>
              
              {lastSale.paymentMethod === 'cash' && (lastSale.changeGiven || 0) > 0 && (
                <div className="mt-8 p-6 bg-slate-900 rounded-3xl">
                  <p className="text-[9px] font-black text-indigo-300 uppercase tracking-widest mb-1">Return to Customer</p>
                  <p className="text-4xl font-black text-white">KSH {lastSale.changeGiven?.toLocaleString()}</p>
                </div>
              )}

              <div className="mt-8 border-4 border-dashed border-slate-100 p-8 rounded-[2rem] bg-slate-50/50 max-h-60 overflow-y-auto scrollbar-hide print:max-h-none print:bg-white print:border-black print:p-0">
                <div id="printable-customer-receipt" className="text-left font-mono leading-tight text-black text-[11px]">
                  <div className="text-center mb-6">
                    <h2 className="text-xl font-black uppercase tracking-tighter">{settings.storeName}</h2>
                    <div className="border-t border-black border-dashed my-3"></div>
                    <p className="font-black uppercase">Official Receipt</p>
                  </div>
                  <div className="space-y-1 mb-4 font-bold">
                    <p>TRANS: {lastSale.id}</p>
                    <p>DATE: {new Date(lastSale.timestamp).toLocaleDateString()}</p>
                    <p>STAFF: {employees.find(e => e.id === lastSale.cashierId)?.name}</p>
                    {lastSale.tableNumber && <p>TABLE: {lastSale.tableNumber}</p>}
                  </div>
                  <div className="space-y-2 mb-4 border-y border-black border-dashed py-3">
                    {lastSale.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-start">
                        <span className="flex-1 uppercase font-bold pr-2">{item.name} x{item.quantity}</span>
                        <span className="font-black">{(item.quantity * item.price).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between font-black text-xl pt-2"><span>TOTAL:</span><span>KSH {lastSale.total.toLocaleString()}</span></div>
                  <div className="text-[8px] mt-1 font-bold opacity-40 italic">VAT Included: {settings.vatRate}%</div>
                  <div className="text-center mt-6 pt-4 border-t border-black border-dashed font-black uppercase tracking-widest opacity-20 text-[8px]">Thank you for visiting {settings.storeName}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 mt-10 print:hidden">
                <button 
                  onClick={() => window.print()} 
                  className="w-full py-6 bg-black text-white rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl flex items-center justify-center space-x-3 hover:bg-slate-800 transition-all active:scale-95"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>
                  <span>PRINT RECEIPT</span>
                </button>
                <button 
                  onClick={handleNextSale} 
                  className="w-full py-6 bg-emerald-600 text-white rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-emerald-700 transition-all active:scale-95"
                >
                  NEXT SALE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POS;
