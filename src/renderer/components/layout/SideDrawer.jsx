import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import Button from '../partials/Button';

const SideDrawer = ({ title = "Drawer Title", children, isOpen, onClose }) => {
  const [open, setOpen] = useState(isOpen);

  useEffect(() => {
    setOpen(isOpen);
  }, [isOpen]);

  return (
    <div
      data-component="SideDrawer"
      className={`fixed inset-0 backdrop-blur-sm z-50 bg-black bg-opacity-50  ${open ? 'block' : 'hidden'}`}
      onClick={onClose}
    >
      <div
        className={`fixed border-l-2 dark:border-gray-800 inset-y-0 right-0 w-full max-w-3xl bg-white dark:bg-gray-900 shadow-lg`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b-2 dark:border-gray-800 flex justify-between items-center">
          <h2 className="text-2xl font-semibold">{title}</h2>
          <Button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="p-4 user-select">
          {children}
        </div>
      </div>
    </div>
  );
};

export default SideDrawer;