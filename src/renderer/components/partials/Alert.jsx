import { Save, FileWarning, X } from 'lucide-react';
// Custom Alert Component
const Alert = ({ title, message, variant = 'info', onDismiss }) => {
  const bgColor = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    success: 'bg-green-50 border-green-200 text-green-800',
  }[variant];

  return (
    <div className={`p-4 rounded-lg border ${bgColor} relative select-text`}>
      <div className="flex gap-2 items-start">
        <FileWarning className="h-5 w-5 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          {title && <h3 className="font-semibold mb-1">{title}</h3>}
          <p className="text-sm">{message}</p>
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