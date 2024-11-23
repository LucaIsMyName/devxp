import React from 'react';

const Main = ({ children, className }) => {
  return (
    <div 
      data-component="Main" 
      className={`
        ${className}
        ml-[64px] lg:ml-0 // Always leave space for the collapsed sidebar on desktop
      `}
    >
      <div className="container mx-auto px-4 py-4">
        {children}
      </div>
    </div>
  );
}

export default Main;