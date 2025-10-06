import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { StatsCards } from "../../components/dashboard/StatsCards";
import { api } from "../../services/api";
import { Navigation } from "../../components/layout/Navigation";

interface Letter {
  id: string;
  status: 'requested' | 'in_progress' | 'draft' | 'in_review' | 'completed' | 'rejected' | 'canceled';
  applicant: {
    name: string;
    program: string;
    goal: string;
  };
  referee?: {
    name: string;
    institution: string;
  };
  template?: {
    id: string;
    name: string;
    description: string;
  };
  generation_parameters?: {
    deadline?: string;
  };
  created_at: string;
  completed_at?: string | null;
  content?: string;
  rejection_reason?: string;
  rejected_at?: string;
}

interface ApplicantDashboardProps {
  onNavigate?: (view: string) => void;
}

export const ApplicantDashboard: React.FC<ApplicantDashboardProps> = ({ onNavigate }) => {
  const [allLetters, setAllLetters] = useState<Letter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const { token, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!token) return;

      try {
        setLoading(true);
        setError('');

        // Get all letters for this applicant
        const lettersResponse = await api.get('/letters');
        const letters = lettersResponse.data.letters || [];
        setAllLetters(letters);

      } catch (err: any) {
        console.error('Error fetching dashboard data:', err);
        setError(err.response?.data?.error || 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [token]);

  // Calculate stats from allLetters
  const getStats = () => {
    return {
      total: allLetters.length,
      pending: allLetters.filter(letter =>
        letter.status === 'requested' || letter.status === 'in_progress'
      ).length,
      inReview: allLetters.filter(letter =>
        letter.status === 'draft' || letter.status === 'in_review'
      ).length,
      completed: allLetters.filter(letter => letter.status === 'completed').length,
    };
  };

  const handleQuickAction = (action: string, letterId?: string) => {
    switch (action) {
      case 'view-letters':
        navigate('/view-letters');
        break;
      case 'new_letter':
        navigate('/letters/new');
        break;
      case 'view_letter':
        if (letterId) navigate(`/letters/${letterId}`);
        break;
      default:
        break;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading dashboard</h3>
            <p className="mt-2 text-sm text-red-700">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const stats = getStats();
  const recentLetters = allLetters.slice(0, 5);

  const rejectedLetters = allLetters.filter(letter => letter.status === 'rejected');
  console.log(rejectedLetters)
  const canceledLetters = allLetters.filter(letter => letter.status === 'canceled');
  console.log(canceledLetters)

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="space-y-8">
        <Navigation user={user} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <p className="text-gray-600 mt-2">
              Track your recommendation letter requests and status
            </p>
          </div>

          {/* Stats Cards */}
          <StatsCards stats={stats} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">

              {/* Rejected Letters Alert */}
              {canceledLetters.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-red-800 mb-4">
                    Letter Requests Canceled ({canceledLetters.length})
                  </h2>
                  <div className="space-y-3">
                    {canceledLetters.map((letter) => (
                      <div key={letter.id} className="bg-white rounded-lg p-4 border border-red-300">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900">
                              {letter.referee?.name || 'Referee'}
                            </p>
                            <p className="text-sm text-gray-600">{letter.applicant.program}</p>
                            {letter.rejection_reason && (
                              <p className="text-sm text-gray-700 mt-2 italic">
                                "{letter.rejection_reason}"
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => handleQuickAction('new_letter')}
                            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                          >
                            Find New Referee
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Rejected Letters Alert */}
              {rejectedLetters.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-red-800 mb-4">
                    Letter Requests Declined ({rejectedLetters.length})
                  </h2>
                  <div className="space-y-3">
                    {rejectedLetters.map((letter) => (
                      <div key={letter.id} className="bg-white rounded-lg p-4 border border-red-300">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900">
                              {letter.referee?.name || 'Referee'}
                            </p>
                            <p className="text-sm text-gray-600">{letter.applicant.program}</p>
                            {letter.rejection_reason && (
                              <p className="text-sm text-gray-700 mt-2 italic">
                                "{letter.rejection_reason}"
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => handleQuickAction('new_letter')}
                            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                          >
                            Find New Referee
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}


              {/* Recent Letters */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Your Letter Requests</h2>
                  <button
                    onClick={() => handleQuickAction('view-letters')}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View all →
                  </button>
                </div>

                {recentLetters.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-400 text-4xl mb-2">📭</div>
                    <p className="text-gray-500">No letters requested yet</p>
                    <p className="text-gray-400 text-sm mt-1">
                      Request your first recommendation letter to get started
                    </p>
                    <button
                      onClick={() => handleQuickAction('new_letter')}
                      className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                      Request Your First Letter
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentLetters.map((letter) => (
                      <div key={letter.id} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg border">
                        <div className="flex items-center space-x-4">
                          <div className={`w-3 h-3 rounded-full ${letter.status === 'completed' ? 'bg-green-500' :
                            letter.status === 'in_review' ? 'bg-yellow-500' :
                              letter.status === 'draft' ? 'bg-blue-500' :
                                letter.status === 'in_progress' ? 'bg-blue-400' :
                                  letter.status === 'rejected' ? 'bg-red-500' :
                                    'bg-gray-500'
                            }`}></div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {letter.referee?.name || 'Pending Referee Response'}
                            </p>
                            <p className="text-sm text-gray-500">
                              {letter.referee?.institution || letter.applicant.program}
                            </p>
                            {letter.generation_parameters?.deadline && (
                              <p className="text-xs text-gray-400">
                                Deadline: {new Date(letter.generation_parameters.deadline).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${letter.status === 'completed' ? 'bg-green-100 text-green-800' :
                            letter.status === 'in_review' ? 'bg-yellow-100 text-yellow-800' :
                              letter.status === 'draft' ? 'bg-blue-100 text-blue-800' :
                                letter.status === 'in_progress' ? 'bg-blue-50 text-blue-700' :
                                  letter.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                    'bg-gray-100 text-gray-800'
                            }`}>
                            {letter.status === 'requested' ? 'Awaiting Response' :
                              letter.status === 'in_progress' ? 'Accepted' :
                                letter.status === 'draft' ? 'In Progress' :
                                  letter.status === 'rejected' ? 'Declined' :
                                    letter.status.replace('_', ' ')
                            }
                          </span>

                          {letter.status === 'completed' && (
                            <button
                              onClick={() => handleQuickAction('view_letter', letter.id)}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              Download
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar - Quick Actions */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="space-y-3">
                  <button
                    onClick={() => handleQuickAction('new_letter')}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-left"
                  >
                    📝 Request New Letter
                  </button>
                  <button
                    onClick={() => handleQuickAction('view-letters')}
                    className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-left"
                  >
                    📋 View All Letters
                  </button>
                </div>
              </div>


              {/* Tips for Applicants */}
              {/* <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="text-sm font-semibold text-blue-900 mb-3">💡 Tips for Success</h3>
                <ul className="text-sm text-blue-800 space-y-2">
                  <li>• Give referees at least 2-3 weeks notice</li>
                  <li>• Provide detailed information about your goals</li>
                  <li>• Follow up politely if needed</li>
                  <li>• Send a thank you note after completion</li>
                </ul>
              </div> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicantDashboard;