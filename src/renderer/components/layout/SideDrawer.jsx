import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import Button from '../partials/Button';

const SideDrawer = ({ children, isOpen, onClose }) => {
  const [open, setOpen] = useState(isOpen);

  useEffect(() => {
    setOpen(isOpen);
  }, [isOpen]);

  return (
    <div
      data-component="SideDrawer"
      className={`fixed inset-0 z-50 bg-black bg-opacity-50 ${open ? 'block' : 'hidden'}`}
      onClick={onClose}
    >
      <div
        className={`fixed inset-y-0 right-0 w-full max-w-3xl bg-white shadow-lg`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">DevXP Info</h2>
          <Button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
};

export default SideDrawer;