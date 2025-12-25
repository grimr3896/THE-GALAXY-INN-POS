
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
    if (!name.trim() || !companyId.trim() || !pin.trim()) {
      alert("Please fill in all fields.");
      return;
    }
    const newEmp: Employee = {
      id: `EMP-${Date.now()}`,
      name: name.trim(),
      role,
      companyId: companyId.trim(),
      pin: pin.trim()
    };
    onUpdateEmployees([...employees, newEmp]);
    setShowModal(false);
    setName('');
    setCompanyId('');
    setPin('');
  };

  const handleDeactivate = (id: string) => {
    if (confirm("Deactivate this employee? They will no longer be able to log in.")) {
      onUpdateEmployees(employees.filter(e => e.id !== id));
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Staff Management</h2>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Control access and session accountability</p>
        </div>
        <button 
          type="button"
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition shadow-xl shadow-indigo-100"
        >
          Register New Staff
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {employees.map(emp => (
          <div key={emp.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-200 relative overflow-hidden group hover:shadow-xl transition-all">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition">
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-4 text-slate-400 font-black uppercase">
              {emp.name.charAt(0)}
            </div>
            <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight">{emp.name}</h4>
            <p className={`font-black text-[10px] mb-4 uppercase tracking-[0.2em] ${emp.role === 'admin' ? 'text-indigo-600' : 'text-slate-400'}`}>
              {emp.role}
            </p>
            <div className="space-y-2 border-t border-slate-50 pt-5">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                <span className="text-slate-300">Company ID</span>
                <span className="text-slate-600 font-mono">{emp.companyId}</span>
              </div>
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                <span className="text-slate-300">Access PIN</span>
                <span className="text-slate-600 font-mono">****</span>
              </div>
            </div>
            <div className="mt-8 flex space-x-3 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
              <button type="button" className="flex-1 py-3 bg-slate-50 rounded-xl text-slate-500 font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition">History</button>
              <button 
                type="button"
                onClick={() => handleDeactivate(emp.id)}
                className="flex-1 py-3 bg-red-50 rounded-xl text-red-500 font-black text-[10px] uppercase tracking-widest hover:bg-red-100 transition"
              >
                Disable
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl animate-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-8">Register Staff</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Full Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-black uppercase"
                  placeholder="e.g. Kelvin Omondi"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Company ID</label>
                  <input 
                    type="text" 
                    value={companyId} 
                    onChange={(e) => setCompanyId(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold font-mono text-black uppercase"
                    placeholder="GXY-000"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Login PIN</label>
                  <input 
                    type="password" 
                    maxLength={4}
                    value={pin} 
                    onChange={(e) => setPin(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-center text-xl tracking-widest text-black"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">System Role</label>
                <select 
                  value={role} 
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-black uppercase text-xs appearance-none cursor-pointer"
                >
                  <option value="cashier">Cashier</option>
                  <option value="waiter">Waiter</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              <div className="flex space-x-3 pt-6">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-slate-200 transition">Cancel</button>
                <button type="button" onClick={handleAdd} className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-100 transition hover:bg-indigo-700">Create Account</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
