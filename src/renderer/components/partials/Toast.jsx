import React, { useEffect } from 'react';

const Toast = ({ children, positionX, positionY, className, duration }) => {
  const setPositionY = () => {
    switch (positionY) {
      case 'top':
        return 'top-4';
      case 'bottom':
        return 'bottom-4';
      default:
        return 'bottom-4';
    }
  };

  const setPositionX = () => {
    switch (positionX) {
      case 'left':
        return 'left-4';
      case 'right':
        return 'right-4';
      default:
        return 'right-4';
    }
  };

  /**
   * Un-Display the toast after n secnds
   */

  useEffect(() => {
    const timer = setTimeout(() => {
      document.querySelector('[data-component="Toast"]').classList.add('hidden');
    }, duration || 5000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <section data-component="Toast" className={`fixed ${setPositionY()} ${setPositionX()} ${className}`}>
      {children}
    </section>
  );
}

export default Toast;