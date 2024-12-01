import React from 'react';

const Toggle = React.forwardRef(({
  label,
  checked = false,
  onChange,
  className = '',
  disabled = false,
  alignLabel = 'left',
  ...props
}, ref) => {
  return (
    <label className={`inline-flex items-center gap-2 cursor-pointer ${disabled ? 'cursor-not-allowed opacity-50' : ''} ${className}`}>
      {/* Hidden checkbox for form compatibility */}
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        ref={ref}
        {...props}
      />

      {/* Custom toggle styling */}
      <div className={`
        relative h-7 w-12 rounded-full transition-colors duration-200 ease-in-out border-2 dark:border-gray-800
        ${checked ? 'bg-blue-700' : 'bg-gray-200 dark:bg-gray-700'}
        ${!disabled && 'hover:bg-opacity-90'}
      `}>
        <div className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white dark:bg-black shadow-md transition-transform duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`}>
          {/* Optional loading or disabled state indicators could go here */}
        </div>
      </div>

      {/* Label text if provided */}
      {label && <span className="select-none text-sm">{label}</span>}
    </label>
  );
});

Toggle.displayName = 'Toggle';

export default Toggle;