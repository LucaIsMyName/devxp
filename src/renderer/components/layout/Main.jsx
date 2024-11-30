import React from 'react';
import ErrorBoundary from '../partials/ErrorBoundary';

const Main = ({ children, className }) => {
  return (
    <div
      data-component="Main"
      className={`
        ml-[64px] lg:ml-0
        h-screen 
        overflow-hidden
        ${className}
      `}
    >
      <main className="h-full overflow-hidden">
        <ErrorBoundary>
          <div className="h-full overflow-auto">
            {children}
          </div>
        </ErrorBoundary>
      </main>
    </div>
  );
}

export default Main;