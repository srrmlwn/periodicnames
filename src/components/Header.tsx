import React from 'react';

const COLORS = ['#e03030', '#f97316', '#2563eb', '#059669', '#7c3aed', '#0284c7', '#db2777'];

const Header: React.FC = () => {
  let colorIndex = 0;

  const coloredChars = 'Periodic Names'.split('').map((char, i) => {
    if (char === ' ') return <span key={i}>&nbsp;</span>;
    const color = COLORS[colorIndex % COLORS.length];
    colorIndex++;
    return (
      <span
        key={i}
        style={{
          color,
          WebkitTextStroke: '2px #111111',
          paintOrder: 'stroke fill',
        }}
      >
        {char}
      </span>
    );
  });

  return (
    <header className="text-center py-4">
      <h1 className="text-4xl font-black tracking-tight mb-1">
        {coloredChars}
      </h1>
      <p className="text-sm font-semibold text-gray-500">
        Find your name in the Periodic Table of Elements
      </p>
    </header>
  );
};

export default Header;
