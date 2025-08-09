import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', hover = false }) => {
  return (
    <div className={`bg-white rounded-xl p-6 shadow-sm border border-gray-100 ${
      hover ? 'card-hover' : ''
    } ${className}`}>
      {children}
    </div>
  );
};