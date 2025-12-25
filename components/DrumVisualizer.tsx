
import React from 'react';

interface DrumVisualizerProps {
  currentLevel: number;
  capacity: number;
  name: string;
}

const DrumVisualizer: React.FC<DrumVisualizerProps> = ({ currentLevel, capacity, name }) => {
  const percentage = (currentLevel / capacity) * 100;
  const isEmpty = currentLevel <= 0;

  return (
    <div className="relative w-full h-64 bg-slate-200 rounded-xl overflow-hidden border-4 border-slate-700 shadow-inner flex flex-col justify-end">
      {/* Liquid */}
      <div 
        className={`w-full transition-all duration-500 ease-in-out ${percentage < 20 ? 'bg-red-500' : 'bg-amber-600'}`}
        style={{ height: `${percentage}%` }}
      >
        <div className="w-full h-2 bg-white/20 animate-pulse"></div>
      </div>

      {/* Glass Reflections */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-2 top-0 bottom-0 w-4 bg-white/10"></div>
        <div className="absolute right-4 top-0 bottom-0 w-1 bg-white/5"></div>
      </div>

      {/* Label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-slate-800 font-bold bg-white/80 px-2 py-1 rounded text-xs mb-1 uppercase tracking-wider">
          {name}
        </span>
        <span className="text-slate-900 font-black text-lg bg-white/60 px-2 rounded backdrop-blur-sm">
          {Math.round(currentLevel / 1000)}L / {capacity / 1000}L
        </span>
      </div>

      {/* Empty Banner */}
      {isEmpty && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-red-600 text-white font-black text-3xl py-4 w-[150%] text-center drum-empty-banner shadow-2xl uppercase border-y-4 border-yellow-400">
            Empty - Refill Required
          </div>
        </div>
      )}
    </div>
  );
};

export default DrumVisualizer;
