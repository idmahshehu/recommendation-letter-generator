import React, { useState, useEffect } from "react";

interface ReasonModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  confirmColor?: 'red' | 'blue' | 'green';
  onClose: () => void;
  onConfirm: (reason: string) => void;
}


const ReasonModal: React.FC<ReasonModalProps> = ({
  isOpen,
  title,
  description,
  confirmLabel = "Confirm",
  confirmColor = "red",
  onClose,
  onConfirm
}) => {
  const [reason, setReason] = useState("");

  // Clear reason when modal closes
  useEffect(() => {
    if (!isOpen) setReason("");
  }, [isOpen]);

  if (!isOpen) return null;

  // Tailwind color classes dynamically
  const colorClasses = {
    red: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
    yellow: "bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500",
    blue: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500",
    green: 'bg-green-600 hover:bg-green-700 focus:ring-green-500' 
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {description && <p className="text-sm text-gray-600">{description}</p>}
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your reason (optional)"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-2 p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm(reason);
              onClose();
            }}
            className={`px-4 py-2 text-sm text-white rounded ${colorClasses[confirmColor]}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReasonModal;
