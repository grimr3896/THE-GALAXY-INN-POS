
import React, { useState, useRef } from 'react';
import { Product, DrumPourOption } from '../types';
import AuthModal from './AuthModal';

interface InventoryProps {
  products: Product[];
  onAddProduct: (p: Product) => void;
  onUpdateProduct: (p: Product) => void;
  onDeleteProduct: (id: string) => void;
  adminPin: string;
}

const Inventory: React.FC<InventoryProps> = ({ products, onAddProduct, onUpdateProduct, onDeleteProduct, adminPin }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [category, setCategory] = useState<'bottle' | 'drum'>('bottle');
  const [image, setImage] = useState('');
  const [buyPrice, setBuyPrice] = useState(0);
  const [sellPrice, setSellPrice] = useState(0);
  const [stock, setStock] = useState(0);
  const [capacityLiters, setCapacityLiters] = useState(50);
  const [minThreshold, setMinThreshold] = useState(10);
  
  const [drumPours, setDrumPours] = useState<DrumPourOption[]>([]);

  const [showAuth, setShowAuth] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const resetForm = () => {
    setName('');
    setCategory('bottle');
    setImage('');
    setBuyPrice(0);
    setSellPrice(0);
    setStock(0);
    setCapacityLiters(50);
    setMinThreshold(10);
    setDrumPours([]);
    setEditingProduct(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddPour = () => {
    setDrumPours([...drumPours, { label: '', volume: 0, price: 0 }]);
  };

  const updatePour = (index: number, field: keyof DrumPourOption, value: any) => {
    const newPours = [...drumPours];
    newPours[index] = { ...newPours[index], [field]: value };
    setDrumPours(newPours);
  };

  const removePour = (index: number) => {
    setDrumPours(drumPours.filter((_, i) => i !== index));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Validation Error: Product name is required.");
      return;
    }

    const capacityML = category === 'drum' ? capacityLiters * 1000 : undefined;

    const p: Product = {
      id: editingProduct?.id || `PRD-${Date.now()}`,
      name: name.trim().toUpperCase(),
      category,
      image: image || 'https://picsum.photos/seed/placeholder/200',
      buyPrice: Number(buyPrice) || 0,
      sellPrice: category === 'bottle' ? (Number(sellPrice) || 0) : 0,
      stock: category === 'bottle' ? (Number(stock) || 0) : 0,
      capacity: capacityML,
      currentLevel: category === 'drum' ? (editingProduct?.currentLevel ?? capacityML) : undefined,
      minThreshold: Number(minThreshold) || 0,
      drumPours: category === 'drum' ? drumPours.filter(dp => dp.label && dp.price > 0) : undefined
    };

    if (editingProduct) {
      onUpdateProduct(p);
    } else {
      onAddProduct(p);
    }
    
    setShowForm(false);
    resetForm();
  };

  const handleRefillDrum = (p: Product) => {
    if (!confirm(`REFILL CONFIRMATION: Are you sure you want to top up ${p.name} to full capacity (${(p.capacity || 0)/1000}L)?`)) return;
    const updated = { ...p, currentLevel: p.capacity };
    onUpdateProduct(updated);
  };

  const requestAuth = (action: () => void) => {
    setPendingAction(() => action);
    setShowAuth(true);
  };

  const handleEdit = (p: Product) => {
    requestAuth(() => {
      setEditingProduct(p);
      setName(p.name);
      setCategory(p.category);
      setImage(p.image);
      setBuyPrice(p.buyPrice);
      setSellPrice(p.sellPrice);
      setStock(p.stock);
      setCapacityLiters((p.capacity || 50000) / 1000);
      setMinThreshold(p.minThreshold);
      setDrumPours(p.drumPours || []);
      setShowForm(true);
    });
  };

  return (
    <div className="p-8 text-black font-black">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-3xl font-black text-black uppercase tracking-tighter">Inventory Control</h2>
          <p className="text-black font-bold text-xs uppercase tracking-widest mt-1 opacity-60">Asset Ledger & Stock Management</p>
        </div>
        <button 
          onClick={() => requestAuth(() => { resetForm(); setShowForm(true); })}
          className="bg-black text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center space-x-2 active:scale-95 transition"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          <span>Register Item</span>
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-black opacity-30 uppercase tracking-widest">
            <tr>
              <th className="px-8 py-4">Item Identity</th>
              <th className="px-8 py-4">Type</th>
              <th className="px-8 py-4">Financials</th>
              <th className="px-8 py-4">Level</th>
              <th className="px-8 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-black font-bold text-xs">
            {products.map(p => {
              const isLow = p.category === 'bottle' ? p.stock <= p.minThreshold : (p.currentLevel || 0) <= p.minThreshold;
              return (
                <tr key={p.id} className="hover:bg-slate-50 transition group">
                  <td className="px-8 py-5">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 shadow-inner">
                        <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                      </div>
                      <span className="font-black uppercase tracking-tight">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${p.category === 'drum' ? 'bg-amber-100 text-amber-900' : 'bg-indigo-100 text-indigo-900'}`}>
                      {p.category}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="text-[10px] font-black space-y-0.5">
                      <div className="flex space-x-2"><span className="opacity-30 w-8">COST:</span> <span className="text-red-700">KSH {p.buyPrice.toLocaleString()}</span></div>
                      <div className="flex space-x-2"><span className="opacity-30 w-8">SRP:</span> <span className="text-emerald-700">KSH {(p.category === 'bottle' ? p.sellPrice : (p.drumPours?.[0]?.price || 0)).toLocaleString()}</span></div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className={`flex items-center space-x-2 font-black ${isLow ? 'text-red-700' : 'text-emerald-700'}`}>
                      <div className={`w-2 h-2 rounded-full ${isLow ? 'bg-red-700 animate-pulse' : 'bg-emerald-700'}`}></div>
                      <span className="uppercase tracking-tight">
                        {p.category === 'bottle' ? `${p.stock} Units` : `${Math.round((p.currentLevel || 0)/1000)}L Left`}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right space-x-3">
                    {p.category === 'drum' && (
                        <button onClick={() => requestAuth(() => handleRefillDrum(p))} className="p-3 text-amber-600 opacity-30 hover:opacity-100 transition-all hover:bg-amber-50 rounded-xl" title="Quick Refill">
                           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m3 2 7 12V22l4-3v-5l7-12H3Z"/></svg>
                        </button>
                    )}
                    <button onClick={() => handleEdit(p)} className="p-3 text-black opacity-30 hover:opacity-100 transition-all hover:bg-slate-100 rounded-xl">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                    </button>
                    <button onClick={() => requestAuth(() => onDeleteProduct(p.id))} className="p-3 text-black opacity-30 hover:text-red-700 hover:opacity-100 transition-all hover:bg-red-50 rounded-xl">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSave} className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl p-10 animate-in zoom-in-95 duration-200 border border-slate-100 max-h-[90vh] overflow-y-auto scrollbar-hide">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-black uppercase tracking-tighter">
                {editingProduct ? 'Update Asset' : 'Register Asset'}
              </h3>
              <button type="button" onClick={() => setShowForm(false)} className="p-2 text-black opacity-30 hover:opacity-100 transition">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            
            <div className="space-y-6">
              <div 
                className="w-full h-40 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] flex items-center justify-center cursor-pointer overflow-hidden group hover:border-black transition-all relative shadow-inner"
                onClick={() => fileInputRef.current?.click()}
              >
                {image ? (
                  <img src={image} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center opacity-20">
                    <svg className="mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                    <p className="text-[10px] font-black uppercase tracking-widest">Upload Identity</p>
                  </div>
                )}
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
              </div>

              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Asset Nomenclature</label>
                <input 
                  type="text" value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl outline-none font-black text-black uppercase text-xs focus:ring-2 focus:ring-slate-100 transition shadow-inner"
                  placeholder="E.G. JAMESON 750ML"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Classification</label>
                  <select 
                    value={category} onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl outline-none font-black text-black uppercase text-[10px] appearance-none cursor-pointer focus:ring-2 focus:ring-slate-100 shadow-inner"
                  >
                    <option value="bottle">Inventory (Unit)</option>
                    <option value="drum">Bulk (Volume)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Alert Floor</label>
                  <input 
                    type="number" value={minThreshold || ''} onChange={(e) => setMinThreshold(Number(e.target.value))} 
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl outline-none font-black text-black text-xs shadow-inner"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Cost Per Purchase (KSH)</label>
                <input 
                  type="number" value={buyPrice || ''} onChange={(e) => setBuyPrice(Number(e.target.value))} 
                  className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl outline-none font-black text-black text-xs shadow-inner" 
                />
              </div>

              {category === 'bottle' ? (
                <>
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Unit Selling Price</label>
                    <input 
                      type="number" value={sellPrice || ''} onChange={(e) => setSellPrice(Number(e.target.value))} 
                      className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl outline-none font-black text-black text-xs shadow-inner" 
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Physical Stock Count</label>
                    <input 
                      type="number" value={stock || ''} onChange={(e) => setStock(Number(e.target.value))} 
                      className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl outline-none font-black text-black text-xs shadow-inner" 
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Bulk Pour Valuations</p>
                    <button 
                      type="button" 
                      onClick={handleAddPour}
                      className="text-[9px] font-black uppercase tracking-widest text-indigo-600 hover:underline"
                    >
                      + Add Valuation
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {drumPours.map((pour, index) => (
                      <div key={index} className="flex items-center space-x-2 bg-slate-50 p-3 rounded-2xl shadow-inner border border-slate-100 group animate-in slide-in-from-left-2">
                        <input 
                          type="text" placeholder="Label (Shot)" value={pour.label} 
                          onChange={(e) => updatePour(index, 'label', e.target.value)}
                          className="w-24 bg-transparent border-none outline-none font-black text-[10px] uppercase placeholder:opacity-30"
                        />
                        <div className="flex-1 flex items-center space-x-1 border-x border-slate-200 px-2">
                          <input 
                            type="number" placeholder="ML" value={pour.volume || ''} 
                            onChange={(e) => updatePour(index, 'volume', Number(e.target.value))}
                            className="w-full bg-transparent border-none outline-none font-black text-[10px] placeholder:opacity-30"
                          />
                          <span className="text-[8px] opacity-20">ML</span>
                        </div>
                        <div className="flex-1 flex items-center space-x-1 pr-2">
                          <span className="text-[8px] opacity-20">KSH</span>
                          <input 
                            type="number" placeholder="Price" value={pour.price || ''} 
                            onChange={(e) => updatePour(index, 'price', Number(e.target.value))}
                            className="w-full bg-transparent border-none outline-none font-black text-[10px] placeholder:opacity-30"
                          />
                        </div>
                        <button type="button" onClick={() => removePour(index)} className="text-red-400 hover:text-red-700 transition">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                        </button>
                      </div>
                    ))}
                    {drumPours.length === 0 && (
                      <p className="text-[9px] text-center italic opacity-30 py-4 uppercase tracking-widest">No custom pours defined.</p>
                    )}
                  </div>

                  <div className="mt-4">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Vessel Capacity (Litres)</label>
                    <input 
                      type="number" value={capacityLiters || ''} onChange={(e) => setCapacityLiters(Number(e.target.value))} 
                      className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl outline-none font-black text-black text-xs shadow-inner" 
                    />
                  </div>
                </div>
              )}

              <button type="submit" className="w-full py-5 bg-black text-white font-black rounded-[2rem] text-[10px] uppercase tracking-[0.2em] shadow-2xl hover:bg-slate-800 active:scale-95 transition-all mt-4">
                {editingProduct ? 'Commit Changes' : 'Register in Catalog'}
              </button>
            </div>
          </form>
        </div>
      )}

      {showAuth && (
        <AuthModal 
          correctPin={adminPin}
          onSuccess={() => {
            setShowAuth(false);
            if (pendingAction) pendingAction();
            setPendingAction(null);
          }}
          onCancel={() => {
            setShowAuth(false);
            setPendingAction(null);
          }}
        />
      )}
    </div>
  );
};

export default Inventory;
