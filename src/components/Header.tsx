import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="text-center py-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-1">
        Periodic Names
      </h1>
      <p className="text-sm text-gray-600">
        Find your name in the Periodic Table of Elements
      </p>
    </header>
  );
};

export default Header; 