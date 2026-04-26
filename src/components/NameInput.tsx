import React, { useState } from 'react';

interface NameInputProps {
  onSubmit: (name: string) => void;
  isLoading: boolean;
}

const NameInput: React.FC<NameInputProps> = ({ onSubmit, isLoading }) => {
  const [name, setName] = useState('');

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
    <div className="max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter your name..."
            className="w-full px-4 pr-12 py-2 text-center border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ease-out"
            disabled={isLoading}
          />
          
          {/* Submit button inside input */}
          <button
            type="submit"
            disabled={isLoading || !name.trim()}
            className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded-md transition-all duration-300 ease-out ${
              name.trim() && !isLoading 
                ? 'text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50' 
                : 'text-slate-400 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center space-x-1">
                <div className="w-1.5 h-1.5 bg-current rounded-full animate-pulse"></div>
                <div className="w-1.5 h-1.5 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-1.5 h-1.5 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              </div>
            ) : (
              <svg 
                className={`w-4 h-4 transition-transform duration-200 ${name.trim() ? 'hover:translate-x-0.5' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            )}
          </button>
        </div>
      </form>
      
    </div>
  );
};

export default NameInput; 