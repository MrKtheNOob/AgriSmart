import React from 'react';

const Navbar = () => {
  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <svg
              className="h-8 w-8 text-green-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2h10a2 2 0 002-2v-1a2 2 0 012-2h1.945M7.758 16.586l1.293-1.293a1 1 0 011.414 0l1.293 1.293m-4.242 0H12m0 0h.01M12 12h.01M12 9h.01M12 6h.01M12 3h.01"
              />
            </svg>
            <span className="ml-2 text-xl font-bold text-gray-800">AgriSmart</span>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
