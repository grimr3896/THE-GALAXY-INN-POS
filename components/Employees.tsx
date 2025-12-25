
import React, { useState } from 'react';
import { Employee } from '../types';

interface EmployeesProps {
  employees: Employee[];
  onUpdateEmployees: (emps: Employee[]) => void;
}

const Employees: React.FC<EmployeesProps> = ({ employees, onUpdateEmployees }) => {
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState<'cashier' | 'waiter' | 'admin'>('cashier');
  const [companyId, setCompanyId] = useState('');
  const [pin, setPin] = useState('');

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!name.trim() || !companyId.trim() || !pin.trim()) { alert("Fill all fields."); return; }
    onUpdateEmployees([...employees, { id: `EMP-${Date.now()}`, name: name.trim(), role, companyId: companyId.trim(), pin: pin.trim() }]);
    setShowModal(false); setName(''); setCompanyId(''); setPin('');
  };

  return (
    <div className="p-8 text-black">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-2xl font-black text-black uppercase tracking-tight">Staff Management</h2>
          <p className="text-black font-bold text-xs uppercase tracking-widest mt-1 opacity-60">Control access and accountability</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-black text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">Register New Staff</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {employees.map(emp => (
          <div key={emp.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-4 text-black font-black uppercase">{emp.name.charAt(0)}</div>
            <h4 className="text-xl font-black text-black uppercase tracking-tight">{emp.name}</h4>
            <p className="font-black text-[10px] mb-6 uppercase tracking-widest text-indigo-800">{emp.role}</p>
            <div className="space-y-3 pt-5 border-t border-slate-100 font-black">
              <div className="flex justify-between text-[10px] uppercase tracking-widest">
                <span className="opacity-30">Company ID</span>
                <span className="opacity-100">{emp.companyId}</span>
              </div>
              <div className="flex justify-between text-[10px] uppercase tracking-widest">
                <span className="opacity-30">Status</span>
                <span className="text-emerald-700">Active</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl text-black">
            <h3 className="text-2xl font-black text-black uppercase tracking-tight mb-8">Register Staff</h3>
            <div className="space-y-6 font-black">
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-black uppercase" placeholder="Full Name" />
              <input type="text" value={companyId} onChange={(e) => setCompanyId(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-black uppercase" placeholder="Staff ID" />
              <input type="password" value={pin} onChange={(e) => setPin(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-center text-xl tracking-[0.5em] text-black" placeholder="PIN" />
              <select value={role} onChange={(e) => setRole(e.target.value as any)} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-black uppercase text-xs appearance-none">
                <option value="cashier">Cashier</option>
                <option value="waiter">Waiter</option>
                <option value="admin">Administrator</option>
              </select>
              <div className="flex space-x-3 pt-6">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 bg-slate-100 text-black rounded-2xl text-[10px] font-black uppercase">Cancel</button>
                <button type="button" onClick={handleAdd} className="flex-1 py-4 bg-black text-white rounded-2xl text-[10px] font-black uppercase shadow-xl">Create Account</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;