import React, { useState, useRef, useEffect } from 'react';
import Tooltip from './Tooltip';
import Button from './Button';

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
    <div data-component="SelectMenu" className={`relative w-auto`} ref={dropdownRef}>
      <Tooltip content={tooltip} placement="bottom" theme="light">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className={` px-3 font-mono py-2 border-2 rounded-lg shadow-sm bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center gap-2 min-w-[120px] w-full justify-between ${className}`}
        >
          <span className=" truncate ">{selectedOption?.label}</span>
          <svg
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </Button>
      </Tooltip>

      {isOpen && (
        <div className="absolute z-10 bg-white rounded-lg border-2 overflow-hidden mt-1 w-full ">
          {options.map((option) => (
            <Button
              key={option.value}
              className={`w-full border-0 border-transparent border-b-2 rounded-none truncate ${option.value === value ? 'bg-gray-100/80 font-semibold' : 'text-gray-700'
                }`}
              onClick={() => {
                onChange(option);
                setIsOpen(false);
              }}
            >
              {option.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SelectMenu;