import { Save, FileWarning, X } from 'lucide-react';
import { useEffect } from 'react';
// Custom Alert Component
const Alert = ({ title, message, variant = 'info', onDismiss, className }) => {
  const bgColor = {
    info: 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200',
    error: 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200',
    success: 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200',
  }[variant];

  return (
    <div data-component="Alert" className={`p-4 rounded-lg border ${bgColor} relative select-text ${className}`}>
      <div className="flex gap-2 items-start">
        <FileWarning className="h-5 w-5 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          {title && <h3 className="font-semibold mb-1">{title}</h3>}
          {message &&<p className="text-sm">{message}</p>}
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="p-1 hover:bg-black/5 rounded"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Alert;