import React from 'react'

const Placeholder = ({ width }) => {
  return (
    <div data-component="Placeholder" className={` bg-gray-100 rounded ${width === 'lg' ? 'max-w-lg' : width === 'md' ? 'max-w-md' : width === 'sm' ? 'max-w-sm' : 'w-full'} h-[1em]`}>
    </div>
  );
}

export default Placeholder;