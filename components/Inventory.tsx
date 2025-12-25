
import React, { useState, useRef } from 'react';
import { Product } from '../types';

interface InventoryProps {
  products: Product[];
  onAddProduct: (p: Product) => void;
  onUpdateProduct: (p: Product) => void;
  onDeleteProduct: (id: string) => void;
}

const Inventory: React.FC<InventoryProps> = ({ products, onAddProduct, onUpdateProduct, onDeleteProduct }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [category, setCategory] = useState<'bottle' | 'drum'>('bottle');
  const [image, setImage] = useState('');
  const [buyPrice, setBuyPrice] = useState(0);
  const [sellPrice, setSellPrice] = useState(0);
  const [stock, setStock] = useState(0);
  const [capacity, setCapacity] = useState(50000);
  const [minThreshold, setMinThreshold] = useState(10);

  const resetForm = () => {
    setName('');
    setCategory('bottle');
    setImage('https://picsum.photos/seed/placeholder/200');
    setBuyPrice(0);
    setSellPrice(0);
    setStock(0);
    setCapacity(50000);
    setMinThreshold(10);
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

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Please enter a product name.");
      return;
    }

    const p: Product = {
      id: editingProduct?.id || Math.random().toString(36).substr(2, 9),
      name: name.trim(),
      category,
      image: image || 'https://picsum.photos/seed/placeholder/200',
      buyPrice: Number(buyPrice) || 0,
      sellPrice: category === 'bottle' ? (Number(sellPrice) || 0) : 0,
      stock: category === 'bottle' ? (Number(stock) || 0) : 0,
      capacity: category === 'drum' ? (Number(capacity) || 50000) : undefined,
      currentLevel: category === 'drum' ? (editingProduct?.currentLevel ?? (Number(capacity) || 50000)) : undefined,
      minThreshold: Number(minThreshold) || 0,
      drumPrices: category === 'drum' ? {
        '50ml': Math.ceil((Number(sellPrice) || 0) * 0.05),
        '250ml': Math.ceil((Number(sellPrice) || 0) * 0.25),
        '500ml': Math.ceil((Number(sellPrice) || 0) * 0.5),
        '1000ml': Number(sellPrice) || 0
      } : undefined
    };

    if (editingProduct) {
      onUpdateProduct(p);
    } else {
      onAddProduct(p);
    }
    
    setShowForm(false);
    resetForm();
  };

  const handleEdit = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setCategory(p.category);
    setImage(p.image);
    setBuyPrice(p.buyPrice);
    setSellPrice(p.category === 'drum' ? (p.drumPrices?.['1000ml'] || 0) : p.sellPrice);
    setStock(p.stock);
    setCapacity(p.capacity || 50000);
    setMinThreshold(p.minThreshold);
    setShowForm(true);
  };

  return (
    <div className="p-6 text-black">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-black text-black uppercase tracking-tight">Inventory Management</h2>
          <p className="text-black font-bold opacity-60">Track and update your Galaxy Inn stock.</p>
        </div>
        <button 
          type="button"
          onClick={() => { resetForm(); setShowForm(true); }}
          className="bg-black text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition shadow-lg flex items-center space-x-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          <span className="uppercase text-xs tracking-widest">Add New Item</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-black font-black text-xs uppercase tracking-widest border-b border-slate-200">
            <tr>
              <th className="px-6 py-4">Product</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4">Cost/Sell Price</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map(p => {
              const isLow = p.category === 'bottle' ? p.stock <= p.minThreshold : (p.currentLevel || 0) <= p.minThreshold;
              return (
                <tr key={p.id} className="hover:bg-slate-50 transition group text-black font-bold text-xs">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-100 bg-slate-50">
                        <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                      </div>
                      <span className="font-black uppercase">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${p.category === 'drum' ? 'bg-amber-100 text-amber-900' : 'bg-blue-100 text-blue-900'}`}>
                      {p.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-[10px] font-black">
                      <span className="opacity-40">IN:</span> <span className="text-red-700">KES {p.buyPrice}</span><br/>
                      <span className="opacity-40">OUT:</span> <span className="text-emerald-700">KES {p.category === 'bottle' ? p.sellPrice : p.drumPrices?.['1000ml']}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`flex items-center space-x-2 font-black ${isLow ? 'text-red-700' : 'text-emerald-700'}`}>
                      <div className={`w-2 h-2 rounded-full ${isLow ? 'bg-red-700 animate-pulse' : 'bg-emerald-700'}`}></div>
                      <span className="uppercase">
                        {p.category === 'bottle' ? `${p.stock} Units` : `${Math.round((p.currentLevel || 0)/1000)}L Left`}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button 
                      type="button"
                      onClick={() => handleEdit(p)} 
                      className="p-2 text-black opacity-40 hover:opacity-100 transition"
                      title="Edit Product"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                    </button>
                    <button 
                      type="button"
                      onClick={() => onDeleteProduct(p.id)} 
                      className="p-2 text-black opacity-40 hover:text-red-700 hover:opacity-100 transition"
                      title="Delete Product"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl p-8 animate-in zoom-in-95 duration-200 text-black">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-black uppercase tracking-tight">{editingProduct ? 'Update Item' : 'New Product'}</h3>
              <button type="button" onClick={() => setShowForm(false)} className="p-2 text-black opacity-40 hover:opacity-100 transition">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            
            <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
              <div 
                className="relative group w-full h-40 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer overflow-hidden transition hover:border-black"
                onClick={() => fileInputRef.current?.click()}
              >
                {image ? (
                  <img src={image} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center">
                    <svg className="mx-auto text-black opacity-20 mb-2" xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                    <p className="text-[10px] font-black text-black uppercase tracking-widest opacity-60">Select Image</p>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition flex items-center justify-center backdrop-blur-[2px]">
                  <span className="bg-white px-5 py-2 rounded-full text-[10px] font-black text-black shadow-xl border border-slate-100">CLICK TO BROWSE</span>
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
              </div>

              <div>
                <label className="block text-[10px] font-black text-black uppercase mb-2 tracking-widest opacity-60">Product Name</label>
                <input 
                  type="text" value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-black uppercase text-sm focus:border-black transition"
                  placeholder="e.g. TUSKER MALT"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-black uppercase mb-2 tracking-widest opacity-60">Category</label>
                  <select 
                    value={category} onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-black uppercase text-xs appearance-none cursor-pointer focus:border-black"
                  >
                    <option value="bottle">Bottle (Single)</option>
                    <option value="drum">Drum (50L Bulk)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-black uppercase mb-2 tracking-widest opacity-60">Min Threshold</label>
                  <input type="number" value={minThreshold === 0 ? '' : minThreshold} onChange={(e) => setMinThreshold(Number(e.target.value))} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-black focus:border-black" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-black uppercase mb-2 tracking-widest opacity-60">Buying Price (Cost)</label>
                  <input type="number" value={buyPrice === 0 ? '' : buyPrice} onChange={(e) => setBuyPrice(Number(e.target.value))} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-red-700 focus:border-black" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-black uppercase mb-2 tracking-widest opacity-60">Selling Price (Unit/1L)</label>
                  <input type="number" value={sellPrice === 0 ? '' : sellPrice} onChange={(e) => setSellPrice(Number(e.target.value))} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-emerald-700 focus:border-black" />
                </div>
              </div>

              {category === 'bottle' ? (
                <div>
                  <label className="block text-[10px] font-black text-black uppercase mb-2 tracking-widest opacity-60">Initial Stock Quantity</label>
                  <input type="number" value={stock === 0 ? '' : stock} onChange={(e) => setStock(Number(e.target.value))} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-black focus:border-black" />
                </div>
              ) : (
                <div>
                  <label className="block text-[10px] font-black text-black uppercase mb-2 tracking-widest opacity-60">Drum Capacity (ml)</label>
                  <input type="number" value={capacity === 0 ? '' : capacity} onChange={(e) => setCapacity(Number(e.target.value))} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-black focus:border-black" placeholder="50000" />
                </div>
              )}
            </div>

            <div className="flex space-x-3 mt-10">
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-4 bg-slate-100 text-black font-black rounded-2xl hover:bg-slate-200 transition uppercase text-[10px] tracking-widest">Discard</button>
              <button type="button" onClick={handleSave} className="flex-1 py-4 bg-black text-white font-black rounded-2xl hover:bg-slate-800 transition uppercase text-[10px] tracking-widest shadow-xl">Save Item</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;