import React, { useState, useEffect } from 'react';

interface NameInputProps {
  onSubmit: (name: string) => void;
  isLoading: boolean;
}

const NameInput: React.FC<NameInputProps> = ({ onSubmit, isLoading }) => {
  const [name, setName] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showCursor, setShowCursor] = useState(true);

  // Cursor blink animation
  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);
    return () => clearInterval(interval);
  }, []);

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
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex-1 relative">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter your name..."
            className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ease-out ${
              isTyping ? 'scale-105 shadow-lg' : ''
            }`}
            disabled={isLoading}
          />
          {/* Animated cursor for empty state */}
          {name.length === 0 && !isLoading && (
            <div className={`absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 transition-opacity duration-200 ${
              showCursor ? 'opacity-100' : 'opacity-0'
            }`}>
              |
            </div>
          )}
        </div>
        
        <button
          type="submit"
          disabled={isLoading || !name.trim()}
          className={`px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-all duration-300 ease-out hover-lift ${
            name.trim() ? 'shadow-lg' : 'shadow-sm'
          }`}
        >
          {isLoading ? (
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            </div>
          ) : (
            <span className={`transition-transform duration-200 ${name.trim() ? 'group-hover:translate-x-1' : ''}`}>
              →
            </span>
          )}
        </button>
      </form>
      
      {/* Character count with animation */}
      {name.length > 0 && (
        <div className="mt-2 text-center">
          <span className={`text-xs text-gray-500 transition-all duration-300 ${
            isTyping ? 'scale-110 text-blue-500' : ''
          }`}>
            {name.length} character{name.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  );
};

export default NameInput; 