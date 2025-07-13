import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="text-center py-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-2">
        Periodic Names
      </h1>
      <p className="text-lg text-gray-600">
        Find your name in the Periodic Table of Elements
      </p>
    </header>
  );
};

export default Header; 