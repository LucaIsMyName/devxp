import React from 'react';

const Main = ({ children, className }) => {
  return (
    <div 
      data-component="Main" 
      className={`
        ${className}
        ml-[64px] lg:ml-0
      `}
    >
      <main className=" mx-auto">
        {children}
      </main>
    </div>
  );
}

export default Main;