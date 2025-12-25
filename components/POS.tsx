
import React, { useState, useMemo, useEffect } from 'react';
import { Product, SaleItem, Sale } from '../types';
import DrumVisualizer from './DrumVisualizer';

interface POSProps {
  products: Product[];
  onCompleteSale: (sale: Sale) => void;
  onUpdateProduct: (product: Product) => void;
}

const POS: React.FC<POSProps> = ({ products, onCompleteSale, onUpdateProduct }) => {
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<Sale['paymentMethod']>('cash');
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [splitCash, setSplitCash] = useState<number>(0);
  const [splitMPesa, setSplitMPesa] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'bottles' | 'drums'>('bottles');
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    const todayKey = new Date().toISOString().split('T')[0];
    const dayClosed = localStorage.getItem(`dayClosed_${todayKey}`) === 'true';
    setIsLocked(dayClosed);
  }, []);

  const total = useMemo(() => cart.reduce((acc, i) => acc + (i.price * i.quantity), 0), [cart]);
  const changeDue = Math.max(0, cashReceived - total);

  // Auto-fill split portions when total changes or method switches
  useEffect(() => {
    if (paymentMethod === 'split') {
        setSplitCash(total);
        setSplitMPesa(0);
    }
  }, [paymentMethod, total]);

  const addToCart = (product: Product, volume?: number, volumeLabel?: string) => {
    if (isLocked) return;
    const isDrum = product.category === 'drum';
    const itemKey = isDrum ? `${product.id}-${volumeLabel}` : product.id;
    const price = isDrum ? (product.drumPrices?.[volumeLabel!] || 0) : product.sellPrice;
    const name = isDrum ? `${product.name} (${volumeLabel})` : product.name;

    setCart(prev => {
      const existing = prev.find(i => i.id === itemKey);
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
        volume: volume
      }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    if (isLocked) return;
    setCart(prev => {
      const item = prev.find(i => i.id === id);
      if (!item) return prev;
      const newQty = item.quantity + delta;
      if (newQty <= 0) return prev.filter(i => i.id !== id);
      return prev.map(i => i.id === id ? { ...i, quantity: newQty } : i);
    });
  };

  const handleConfirmPayment = () => {
    const isSplit = paymentMethod === 'split';
    
    if (isSplit && (splitCash + splitMPesa !== total)) {
        alert(`Split total (${splitCash + splitMPesa}) must equal order total (${total})`);
        return;
    }

    const newSale: Sale = {
      id: `GXY-${Date.now()}`,
      timestamp: Date.now(),
      items: cart,
      total,
      paymentMethod,
      splitBreakdown: isSplit ? {
        cash: splitCash,
        mpesa: splitMPesa,
        card: 0
      } : undefined,
      cashierId: 'e2', // Assuming current cashier
      vatAmount: total * 0.16 // Example VAT calculation
    };

    cart.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        if (product.category === 'bottle') {
          onUpdateProduct({ ...product, stock: product.stock - item.quantity });
        } else {
          onUpdateProduct({ ...product, currentLevel: (product.currentLevel || 0) - (item.volume! * item.quantity) });
        }
      }
    });

    onCompleteSale(newSale);
    setLastSale(newSale);
    setCart([]);
    setShowPaymentModal(false);
    setShowReceiptModal(true);
    setCashReceived(0);
    setSplitCash(0);
    setSplitMPesa(0);
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const closeReceiptModal = () => {
    setShowReceiptModal(false);
    setLastSale(null);
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] overflow-hidden relative">
      {/* Lock Overlay */}
      {isLocked && (
        <div className="absolute inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-6 text-center">
          <div className="bg-white p-12 rounded-[3rem] shadow-2xl max-w-md border-4 border-red-500 animate-in zoom-in-95">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center text-red-600 mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-4">Day Closed</h2>
            <p className="text-slate-500 font-bold text-sm uppercase tracking-widest leading-relaxed mb-8">
              The POS system has been locked for today. To reopen, an Administrator must reset the daily closure status in settings.
            </p>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-6 bg-slate-50 border-r border-slate-200">
        <div className="flex space-x-2 mb-6 sticky top-0 bg-slate-50 z-10 pb-4">
          <button 
            onClick={() => setActiveTab('bottles')}
            className={`px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition ${activeTab === 'bottles' ? 'bg-slate-900 text-white shadow-xl' : 'bg-white text-slate-500 border border-slate-200'}`}
          >
            Bottles
          </button>
          <button 
            onClick={() => setActiveTab('drums')}
            className={`px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition ${activeTab === 'drums' ? 'bg-slate-900 text-white shadow-xl' : 'bg-white text-slate-500 border border-slate-200'}`}
          >
            Drums
          </button>
        </div>

        {activeTab === 'bottles' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.filter(p => p.category === 'bottle').map(product => (
              <button 
                key={product.id}
                onClick={() => addToCart(product)}
                disabled={isLocked}
                className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all text-left group disabled:grayscale"
              >
                <div className="aspect-square w-full rounded-2xl overflow-hidden mb-4 bg-slate-50">
                  <img src={product.image} className="w-full h-full object-cover" />
                </div>
                <h4 className="font-black text-slate-800 text-xs mb-1 uppercase tracking-wider">{product.name}</h4>
                <p className="text-indigo-600 font-black">KSH {product.sellPrice}</p>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            {products.filter(p => p.category === 'drum').map(drum => (
              <div key={drum.id} className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                <DrumVisualizer currentLevel={drum.currentLevel || 0} capacity={drum.capacity || 50000} name={drum.name} />
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(drum.drumPrices || {}).map(([label, price]) => (
                    <button
                      key={label}
                      disabled={isLocked}
                      onClick={() => addToCart(drum, parseInt(label), label)}
                      className="p-5 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-900 font-black hover:bg-white hover:border-indigo-600 transition disabled:grayscale"
                    >
                      {label}<br/><span className="text-[10px] text-indigo-400">KSH {price}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="w-full lg:w-[400px] bg-white flex flex-col shadow-2xl">
        <div className="p-8 border-b border-slate-100">
          <h3 className="text-xl font-black text-black uppercase tracking-tight">CART</h3>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {cart.map(item => (
            <div key={item.id} className="flex justify-between items-center bg-slate-50/80 p-5 rounded-3xl border border-slate-100">
              <div className="flex-1">
                <h5 className="font-black text-black text-[11px] uppercase tracking-wide">{item.name}</h5>
                <p className="text-[11px] text-black/60 font-bold mt-0.5">KSH {item.price}</p>
              </div>
              <div className="flex items-center space-x-3 ml-4">
                <button 
                  disabled={isLocked} 
                  onClick={() => updateQuantity(item.id, -1)} 
                  className="w-10 h-10 rounded-xl bg-white border border-slate-200 font-black text-black flex items-center justify-center hover:bg-slate-50 transition active:scale-95 disabled:opacity-50"
                >
                  -
                </button>
                <span className="font-black text-xs text-black w-4 text-center">{item.quantity}</span>
                <button 
                  disabled={isLocked} 
                  onClick={() => updateQuantity(item.id, 1)} 
                  className="w-10 h-10 rounded-xl bg-slate-900 text-white font-black flex items-center justify-center hover:bg-black transition active:scale-95 disabled:opacity-50"
                >
                  +
                </button>
              </div>
            </div>
          ))}
          {cart.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-4 py-20">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
              <p className="font-black text-[10px] uppercase tracking-widest text-slate-300">Cart is empty</p>
            </div>
          )}
        </div>

        <div className="p-8 bg-slate-50 border-t border-slate-200">
          <div className="flex justify-between items-center text-2xl font-black text-black mb-6 uppercase tracking-tighter">
            <span>Total</span>
            <span>KSH {total.toLocaleString()}</span>
          </div>
          <button 
            onClick={() => setShowPaymentModal(true)}
            disabled={cart.length === 0 || isLocked}
            className="w-full bg-emerald-600 text-white py-5 rounded-[2rem] font-black text-lg shadow-xl shadow-emerald-100 transition hover:bg-emerald-700 disabled:opacity-50 active:scale-[0.98]"
          >
            Complete Payment
          </button>
        </div>
      </div>

      {showPaymentModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-10 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-2">Complete Payment</h3>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-8">Total Amount Due: <span className="text-slate-900">Ksh {total}</span></p>
            
            <div className="space-y-8">
              <div className="grid grid-cols-3 gap-3">
                {(['cash', 'm-pesa', 'split'] as const).map(method => (
                  <button
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    className={`py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest border-2 transition ${paymentMethod === method ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'}`}
                  >
                    {method}
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                {paymentMethod === 'split' ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Cash Amount</label>
                        <input 
                            type="number" 
                            value={splitCash || ''}
                            onChange={(e) => {
                                const val = Number(e.target.value);
                                setSplitCash(val);
                                setSplitMPesa(Math.max(0, total - val));
                            }}
                            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-xl text-slate-800"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">M-Pesa Amount</label>
                        <input 
                            type="number" 
                            value={splitMPesa || ''}
                            onChange={(e) => {
                                const val = Number(e.target.value);
                                setSplitMPesa(val);
                                setSplitCash(Math.max(0, total - val));
                            }}
                            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-xl text-emerald-600"
                        />
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{paymentMethod === 'cash' ? 'Cash Received' : 'Confirmed Amount'}</label>
                        <input 
                            type="number" 
                            value={cashReceived || ''}
                            onChange={(e) => setCashReceived(Number(e.target.value))}
                            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-2xl text-slate-800"
                            placeholder="0"
                        />
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                        {[total, 1000, 2000, 5000].map(val => (
                            <button 
                                key={val}
                                onClick={() => setCashReceived(val)}
                                className="py-3 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase hover:bg-slate-200 transition"
                            >
                                {val === total ? 'Exact' : val.toLocaleString()}
                            </button>
                        ))}
                    </div>
                  </>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-8">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Paid:</p>
                  <p className="text-xl font-black text-slate-900">Ksh {(paymentMethod === 'split' ? (splitCash + splitMPesa) : cashReceived).toLocaleString()}.00</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Change Due:</p>
                  <p className="text-xl font-black text-red-600">Ksh {paymentMethod === 'split' ? 0 : changeDue.toLocaleString()}.00</p>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button onClick={() => setShowPaymentModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-slate-200 transition">Cancel</button>
                <button 
                  onClick={handleConfirmPayment} 
                  disabled={(paymentMethod === 'cash' && cashReceived < total) || (paymentMethod === 'split' && (splitCash + splitMPesa !== total))}
                  className="flex-[2] py-4 bg-emerald-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition disabled:opacity-50"
                >
                  Confirm Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceiptModal && lastSale && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl animate-in zoom-in-95 print:shadow-none print:p-0 print:m-0 print:w-full">
            <div className="flex justify-between items-center mb-6 print:hidden">
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Transaction Complete</h3>
              <button onClick={closeReceiptModal} className="text-slate-400 hover:text-slate-600 transition">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>

            <div id="printable-customer-receipt" className="border-2 border-dashed border-black p-6 rounded-3xl bg-white font-mono text-[10px] leading-tight text-black print:border-none print:p-4">
              <div className="text-center mb-4">
                <h2 className="text-xl font-black uppercase tracking-tighter">GALAXY INN</h2>
                <p className="font-bold text-[8px] uppercase">Nairobi, Kenya</p>
                <p className="font-bold text-[8px] uppercase">Tel: +254 7XX XXX XXX</p>
                <div className="border-t border-black border-dashed my-2"></div>
                <p className="font-bold uppercase tracking-widest">Customer Receipt</p>
              </div>

              <div className="space-y-1 mb-4">
                <p>DATE: {new Date(lastSale.timestamp).toLocaleDateString('en-GB')}</p>
                <p>TIME: {new Date(lastSale.timestamp).toLocaleTimeString()}</p>
                <p>TRANS ID: {lastSale.id}</p>
                <p>CASHIER: {lastSale.cashierId}</p>
              </div>

              <div className="border-t border-black border-dashed my-2"></div>

              <div className="space-y-2 mb-4">
                {lastSale.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start">
                    <div className="flex-1 pr-2">
                      <p className="uppercase font-bold">{item.name}</p>
                      <p className="text-[8px]">{item.quantity} x {item.price.toLocaleString()}</p>
                    </div>
                    <p className="font-black">{(item.quantity * item.price).toLocaleString()}</p>
                  </div>
                ))}
              </div>

              <div className="border-t border-black border-dashed my-2"></div>

              <div className="space-y-1 mb-4">
                <div className="flex justify-between font-bold">
                  <span>SUBTOTAL:</span>
                  <span>KES {(lastSale.total - (lastSale.vatAmount || 0)).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>VAT (16%):</span>
                  <span>KES {(lastSale.vatAmount || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-black text-lg border-t border-black pt-1">
                  <span>TOTAL:</span>
                  <span>KES {lastSale.total.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-1 mb-4">
                <div className="flex justify-between uppercase">
                  <span>Payment:</span>
                  <span className="font-bold">{lastSale.paymentMethod}</span>
                </div>
                {lastSale.paymentMethod === 'split' && lastSale.splitBreakdown && (
                  <div className="pl-4 space-y-0.5 mt-1 border-l border-black">
                    <div className="flex justify-between text-[8px]">
                        <span>CASH Portion:</span>
                        <span>KES {lastSale.splitBreakdown.cash.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-[8px]">
                        <span>M-PESA Portion:</span>
                        <span>KES {lastSale.splitBreakdown.mpesa.toLocaleString()}</span>
                    </div>
                  </div>
                )}
                {lastSale.paymentMethod === 'cash' && (
                  <>
                    <div className="flex justify-between">
                      <span>Received:</span>
                      <span>KES {cashReceived.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Change:</span>
                      <span>KES {changeDue.toLocaleString()}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="text-center mt-6 pt-4 border-t border-black border-dashed space-y-1">
                <p className="font-bold uppercase tracking-widest">Thank you!</p>
                <p className="text-[8px] font-bold uppercase">Please visit again</p>
                <p className="text-[7px] mt-2">GALAXY INN POS v1.0 • OFFLINE SECURE</p>
              </div>
            </div>

            <div className="flex space-x-3 mt-8 print:hidden">
              <button onClick={closeReceiptModal} className="flex-1 py-4 bg-slate-100 text-slate-600 font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-slate-200 transition">Next Sale</button>
              <button onClick={handlePrintReceipt} className="flex-2 py-4 bg-slate-900 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-xl hover:bg-black transition flex items-center justify-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>
                <span>Print Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printing Styles for Customer Receipt */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-customer-receipt, #printable-customer-receipt * {
            visibility: visible;
          }
          #printable-customer-receipt {
            position: fixed;
            left: 0;
            top: 0;
            width: 58mm; /* Thermal paper standard */
            padding: 0;
            margin: 0;
            border: none;
            box-shadow: none;
            color: black !important;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default POS;
