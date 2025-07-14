import React, { useState, useEffect } from 'react';

interface NameInputProps {
  onSubmit: (name: string) => void;
  isLoading: boolean;
}

const NameInput: React.FC<NameInputProps> = ({ onSubmit, isLoading }) => {
  const [name, setName] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Typing animation
  useEffect(() => {
    if (name.length > 0) {
      setIsTyping(true);
      const timer = setTimeout(() => setIsTyping(false), 300);
      return () => clearTimeout(timer);
    } else {
      setIsTyping(false);
    }
  }, [name]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
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
            onKeyPress={handleKeyPress}
            placeholder="Enter your name..."
            className={`w-full px-4 pr-12 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ease-out ${
              isTyping ? 'scale-105 shadow-lg' : ''
            }`}
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
      
      {/* Character count with animation */}
      {name.length > 0 && (
        <div className="mt-2 text-center">
          <span className={`text-xs text-slate-500 transition-all duration-300 ${
            isTyping ? 'scale-110 text-emerald-500' : ''
          }`}>
            {name.length} character{name.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  );
};

export default NameInput; 