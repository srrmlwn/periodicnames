import React, { useState } from 'react';

interface NameInputProps {
  onSubmit: (name: string) => void;
  hasResult?: boolean;
  onRefresh?: () => void;
  initialValue?: string;
}

const MAX_CHARS = 30;

const NameInput: React.FC<NameInputProps> = ({ onSubmit, hasResult = false, onRefresh, initialValue = '' }) => {
  const [name, setName] = useState(initialValue);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, MAX_CHARS))}
            onKeyDown={handleKeyDown}
            placeholder="Enter your name..."
            className="w-full px-4 pr-12 py-2.5 text-center bg-white border-2 border-slate-300 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ease-out placeholder:text-slate-400"
          />
          {name.length >= MAX_CHARS - 6 && !hasResult && (
            <span className={`absolute left-3 -bottom-5 text-xs ${name.length >= MAX_CHARS ? 'text-red-500' : 'text-slate-400'}`}>
              {name.length}/{MAX_CHARS}
            </span>
          )}
          
          {hasResult ? (
            <button
              type="button"
              onClick={onRefresh}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-all duration-300 ease-out"
              title="Try a new name"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          ) : (
            <button
              type="submit"
              disabled={!name.trim()}
              className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded-md transition-all duration-300 ease-out ${
                name.trim()
                  ? 'text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50'
                  : 'text-slate-400 cursor-not-allowed'
              }`}
            >
              <svg
                className={`w-4 h-4 transition-transform duration-200 ${name.trim() ? 'hover:translate-x-0.5' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          )}
        </div>
      </form>
      
    </div>
  );
};

export default NameInput; 