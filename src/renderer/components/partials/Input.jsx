import React from 'react';

const Input = ({
  value,
  onChange,
  className = '',
  type = 'text',
  placeholder = 'Enter a domain name...',
  onFocus = () => {},
  onBlur = () => {},
  disabled = false,
  ...props // Allow passing through any additional HTML input props
}) => {
  return (
    <input
      data-component="Input"
      type={type}
      value={value}
      onChange={onChange}
      onFocus={onFocus}
      onBlur={onBlur}
      placeholder={placeholder}
      disabled={disabled}
      className={`text-left font-mono bg-white focus:outline-none focus:ring-2 focus:ring-blue-500  text-black hover:bg-gray-50 p-2 border-2 rounded-lg shadow-sm bg-white hover:bg-gray-50 rounded-lg border-black/10 border-2 ${className}`}
      {...props}
    />
  );
};

export default Input;