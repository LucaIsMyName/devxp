import React, { useState, useRef, useEffect } from 'react';
import Tooltip from './Tooltip';

const SelectMenu = ({ options, value, onChange, tooltip, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(opt => opt.value === value);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div data-component="SelectMenu" className={`relative ${className}`} ref={dropdownRef}>
      <Tooltip content={tooltip} placement="bottom" theme="light">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="px-3 py-2 border-2 w-full rounded-md shadow-sm bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center gap-2 min-w-[120px] justify-between"
        >
          <span className="text-sm">{selectedOption?.label}</span>
          <svg
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </Tooltip>
      
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg border">
          {options.map((option) => (
            <button
              key={option.value}
              className={`w-full px-4 py-2 text-sm text-left hover:bg-gray-100 ${
                option.value === value ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
              }`}
              onClick={() => {
                onChange(option);
                setIsOpen(false);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SelectMenu;