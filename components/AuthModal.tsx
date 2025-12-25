
import React, { useState } from 'react';

interface AuthModalProps {
  correctPin: string;
  onSuccess: () => void;
  onCancel: () => void;
  title?: string;
  subtitle?: string;
}

const AuthModal: React.FC<AuthModalProps> = ({ 
  correctPin, 
  onSuccess, 
  onCancel, 
  title = "Admin Authorization",
  subtitle = "Enter Master PIN to continue"
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleKeyClick = (val: string) => {
    setError(false);
    if (pin.length < 4) {
      const newPin = pin + val;
      setPin(newPin);
      if (newPin.length === 4) {
        if (newPin === correctPin) {
          onSuccess();
        } else {
          setError(true);
          setTimeout(() => setPin(''), 500);
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-[3rem] w-full max-w-xs p-10 shadow-2xl animate-in zoom-in-95 text-black">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-black">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <h3 className="text-xl font-black uppercase tracking-tighter">{title}</h3>
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mt-1">{subtitle}</p>
        </div>

        <div className="flex justify-center space-x-3 mb-10">
          {[0, 1, 2, 3].map(i => (
            <div 
              key={i} 
              className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${error ? 'bg-red-500 border-red-500 animate-bounce' : pin.length > i ? 'bg-black border-black' : 'border-slate-200'}`}
            />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-3">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'X'].map((key, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                if (key === 'X') setPin(pin.slice(0, -1));
                else if (key !== '') handleKeyClick(key);
              }}
              className={`h-16 rounded-2xl font-black text-xl flex items-center justify-center transition active:scale-90 ${key === '' ? 'pointer-events-none' : 'bg-slate-50 border border-slate-100 hover:bg-slate-100'}`}
            >
              {key}
            </button>
          ))}
        </div>

        <button 
          type="button"
          onClick={onCancel} 
          className="w-full mt-8 py-4 text-black font-black uppercase text-[10px] tracking-widest hover:underline"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default AuthModal;
