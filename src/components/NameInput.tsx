import React, { useState, useEffect } from 'react';

interface NameInputProps {
  onSubmit: (name: string) => void;
  hasResult?: boolean;
  onRefresh?: () => void;
  initialValue?: string;
}

const MAX_CHARS = 30;

const PLACEHOLDER_CTAS = [
  "what are you made of?",
  "you might be gold",
  "are you a noble gas?",
  "discover your elements",
  "see your chemistry",
  "could you be plutonium?",
  "what's your chemistry?",
];

const NARROW_QUERY = '(max-width: 639px)';

function nameSizeClass(length: number): string {
  if (length > 22) return 'text-lg max-sm:text-sm';
  if (length > 16) return 'text-lg max-sm:text-base';
  return 'text-lg';
}

const NameInput: React.FC<NameInputProps> = ({ onSubmit, hasResult = false, onRefresh, initialValue = '' }) => {
  const [name, setName] = useState(initialValue);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [narrow, setNarrow] = useState(() => window.matchMedia(NARROW_QUERY).matches);

  useEffect(() => {
    const mq = window.matchMedia(NARROW_QUERY);
    const onChange = () => setNarrow(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (name) return;
    const id = setInterval(() => {
      setPlaceholderIdx(i => (i + 1) % PLACEHOLDER_CTAS.length);
    }, 2500);
    return () => clearInterval(id);
  }, [name]);

  const cta = PLACEHOLDER_CTAS[placeholderIdx];
  const placeholder = name ? '' : narrow ? cta.charAt(0).toUpperCase() + cta.slice(1) : `Your name — ${cta}`;

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
        <div className="flex items-stretch bg-white border-[3px] border-ink rounded-xl shadow-brutal-lg overflow-hidden focus-within:-translate-x-0.5 focus-within:-translate-y-0.5 focus-within:shadow-brutal-xl transition-all duration-150">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, MAX_CHARS))}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            aria-label="Your name"
            className={`flex-1 min-w-0 px-4 py-3 ${nameSizeClass(name.length)} font-bold text-ink bg-transparent focus:outline-none placeholder:font-medium placeholder:text-muted/60 placeholder:text-base`}
          />
          {hasResult ? (
            <button
              type="button"
              onClick={onRefresh}
              className="nb-focus shrink-0 flex items-center gap-1.5 px-4 bg-pop-pink border-l-[3px] border-ink font-bold text-ink hover:brightness-105 active:brightness-95"
              title="Try a new name"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="hidden sm:inline">New</span>
            </button>
          ) : (
            <button
              type="submit"
              disabled={!name.trim()}
              className="nb-focus shrink-0 flex items-center gap-1.5 px-5 bg-pop-yellow border-l-[3px] border-ink font-bold text-ink hover:brightness-105 active:brightness-95 disabled:bg-mist disabled:text-muted/60 disabled:cursor-not-allowed"
            >
              Go
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          )}
        </div>
        {name.length >= MAX_CHARS - 6 && !hasResult && (
          <span className={`absolute left-1 -bottom-6 text-xs font-bold ${name.length >= MAX_CHARS ? 'text-pop-coral' : 'text-muted'}`}>
            {name.length}/{MAX_CHARS}
          </span>
        )}
      </form>
    </div>
  );
};

export default NameInput;
