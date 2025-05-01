import React from "react";

interface SimpleAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  confirmButtonClassName?: string;
  children?: React.ReactNode;
}

export function SimpleAlertDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  confirmButtonClassName = "bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded",
  children
}: SimpleAlertDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-indigo-800 text-white rounded-lg shadow-lg p-6 max-w-md w-full">
        <div className="mb-4">
          <h2 className="text-xl font-bold">{title}</h2>
          {description && <p className="text-indigo-300 mt-2">{description}</p>}
        </div>
        
        {children && <div className="mb-4">{children}</div>}
        
        <div className="flex justify-end space-x-4 mt-6">
          <button
            onClick={() => onOpenChange(false)}
            className="bg-indigo-900 text-indigo-200 hover:bg-indigo-800 hover:text-white border-none py-2 px-4 rounded"
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
            className={confirmButtonClassName}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
