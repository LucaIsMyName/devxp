
import React from 'react';
import { X } from 'lucide-react';
import Button from './Button';

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children,
  size = 'lg', // sm, md, lg, xl
  position = 'center' // topLeft, topRight, topCenter, bottomLeft, bottomRight, bottomCenter, center
}) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  }[size];

  const positionClasses = {
    topLeft: 'top-4 left-4',
    topRight: 'top-4 right-4',
    topCenter: 'top-4 left-1/2 transform -translate-x-1/2',
    bottomLeft: 'bottom-4 left-4',
    bottomRight: 'bottom-4 right-4',
    bottomCenter: 'bottom-4 left-1/2 transform -translate-x-1/2',
    center: 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2',
  }[size];

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className={`absolute bg-white dark:bg-gray-900 shadow-lg border-2 dark:border-gray-800 rounded-lg shadow-xl w-full ${sizeClasses} ${positionClasses}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b-2 dark:border-gray-800">
          <h2 className="text-lg font-medium">{title}</h2>
          <Button
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
