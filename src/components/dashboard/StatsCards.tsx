import React from 'react';
import { Mail, Clock, Edit3, CheckCircle } from 'lucide-react';
import { Card } from '../ui/Card';

interface StatsCardsProps {
  stats: {
    total: number;
    pending: number;
    inReview: number;
    completed: number;
  };
}

export const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <Card hover>
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Mail className="w-8 h-8 text-blue-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Total Requests</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
          </div>
        </div>
      </Card>
      
      <Card hover>
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Pending</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.pending}</p>
          </div>
        </div>
      </Card>
      
      <Card hover>
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Edit3 className="w-8 h-8 text-orange-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">In Review</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.inReview}</p>
          </div>
        </div>
      </Card>
      
      <Card hover>
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Completed</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.completed}</p>
          </div>
        </div>
      </Card>
    </div>
  );
};