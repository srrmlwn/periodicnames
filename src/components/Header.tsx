import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="text-center py-4">
      <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-1">
        Periodic Names
      </h1>
      <p className="text-sm font-semibold text-gray-500">
        Find your name in the Periodic Table of Elements
      </p>
    </header>
  );
};

export default Header;
