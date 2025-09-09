import React from "react";

interface StatusBadgeProps {
  status: 'requested' | 'draft' | 'in_review' | 'completed';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStatusClasses = (status: string) => {
    switch (status) {
      case 'requested':
        return 'status-requested';
      case 'draft':
        return 'status-draft';
      case 'in_review':
        return 'status-in_review';
      case 'completed':
        return 'status-completed';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusClasses(status)}`}>
      {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
    </span>
  );
};