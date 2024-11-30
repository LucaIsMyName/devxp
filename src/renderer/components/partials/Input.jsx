import React from 'react';

const Input = ({
  value,
  onChange,
  className = '',
  type = 'text',
  placeholder = 'Enter a domain name...',
  onFocus = () => {},
  onBlur = () => {},
  onEnter = () => {},
  disabled = false,
  ...props // Allow passing through any additional HTML input props
}) => {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onEnter(e);
    }
  };
  return (
    <input
      data-component="Input"
      type={type}
      value={value}
      onChange={onChange}
      onFocus={onFocus}
      onBlur={onBlur}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      disabled={disabled}
      className={`text-left hover:cursor-pointer focus:cursor-auto font-mono bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500  text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 dark:bg-black p-2 border-2 dark:border-gray-800 rounded-lg shadow-sm bg-white dark:bg-gray-900 hover:bg-gray-50 dark:bg-gray-black rounded-lg border-black/10 border-2 dark:border-gray-800 ${className}`}
      {...props}
    />
  );
};

export default Input;