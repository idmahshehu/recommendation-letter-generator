import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { StatsCards } from "../../components/dashboard/StatsCards";
import { api } from "../../services/api";
import { Navigation } from "../../components/layout/Navigation";
import ReasonModal from "../ReasonModal";

interface Letter {
  id: string;
  status: 'requested' | 'in_progress' | 'draft' | 'in_review' | 'completed' | 'rejected';
  applicant: {
    name: string;
    program: string;
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
}

interface PendingRequest {
  id: string;
  applicant: {
    name: string;
    email: string;
    program: string;
    goal: string;
    achievements: string[];
  };
  preferences: {
    tone?: string;
    length?: string;
    deadline?: string;
  };
  created_at: string;
}

interface DashboardPageProps {
  onNavigate?: (view: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const [allLetters, setAllLetters] = useState<Letter[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<string>('');
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectLetterId, setRejectLetterId] = useState<string | null>(null);
  const [rejectApplicantName, setRejectApplicantName] = useState<string>('');

  const { token, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!token) return;

      try {
        setLoading(true);
        setError('');

        // 1. Get all letters
        const lettersResponse = await api.get('/letters');

        const letters = lettersResponse.data.letters || [];
        setAllLetters(letters);

        // 2. Get pending requests (referees only)
        try {
          const pendingResponse = await api.get('/letters/pending');
          setPendingRequests(pendingResponse.data.pending_requests || []);
        } catch (pendingError: any) {
          setPendingRequests([]);
        }

      } catch (err: any) {
        console.error('Error fetching dashboard data:', err);
        setError(err.response?.data?.error || 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [token]);

  // Handle accept/reject actions
  const handleLetterAction = async (letterId: string, action: 'accept' | 'reject', reason?: string) => {
    try {
      setActionLoading(`${action}-${letterId}`);

      const endpoint = action === 'accept' ? `/letters/${letterId}/accept` : `/letters/${letterId}/reject`;
      const payload = action === 'reject' && reason ? { reason } : {};

      await api.post(endpoint, payload);

      // Remove from pending requests
      setPendingRequests(prev => prev.filter(req => req.id !== letterId));

      // Refresh all letters to show updated status
      const lettersResponse = await api.get('/letters');
      setAllLetters(lettersResponse.data.letters || []);

      console.log(action === 'accept' ? 'Letter accepted' : 'Letter rejected');
    } catch (err: any) {
      console.error(`Error ${action}ing letter:`, err);
      setError(err.response?.data?.error || `Failed to ${action} letter`);
    } finally {
      setActionLoading('');
    }
  };

  const showRejectModal = (letterId: string, applicantName: string) => {
    setRejectLetterId(letterId);
    setRejectApplicantName(applicantName);
    setRejectModalOpen(true);
  };

  const handleRejectConfirm = (reason: string) => {
    if (!rejectLetterId) return;
    handleLetterAction(rejectLetterId, 'reject', reason);
    setRejectModalOpen(false);
    setRejectLetterId(null);
    setRejectApplicantName('');
  };

  // Calculate stats from allLetters
  const getStats = () => {
    return {
      total: allLetters.length,
      pending: allLetters.filter(letter => letter.status === 'requested').length,
      inReview: allLetters.filter(letter =>
        letter.status === 'draft' || letter.status === 'in_review'
      ).length,
      completed: allLetters.filter(letter => letter.status === 'completed').length,
    };
  };

  const handleQuickAction = (action: string, letterId?: string) => {
    switch (action) {
      case 'view_all_letters':
        onNavigate?.('letters');
        break;
      case 'new_letter':
        if (letterId) {
          navigate(`/letters/${letterId}/generate`);
        } else {
          navigate('/letters/new');
        }
        break;
      case 'view_letter':
        if (letterId) navigate(`/letters/${letterId}`);
        break;
      case 'edit_letter':
        if (letterId) navigate(`/letters/${letterId}/edit`);
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

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="space-y-8">
        <Navigation user={user} />
        {/* Welcome Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <p className="text-gray-600 mt-2">
              Overview of your recommendation letters
            </p>
          </div>

          <StatsCards stats={stats} />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">

              {/* Pending Requests */}
              {pendingRequests.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-yellow-800">
                      Pending Requests ({pendingRequests.length})
                    </h2>
                  </div>
                  <div className="space-y-3">
                    {pendingRequests.slice(0, 3).map((request) => (
                      <div key={request.id} className="bg-white rounded-lg p-4 border border-yellow-300">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 mr-4">
                            <p className="font-medium text-gray-900">{request.applicant.name}</p>
                            <p className="text-sm text-gray-600">{request.applicant.program}</p>
                            <p className="text-sm text-gray-700 mt-1">{request.applicant.goal}</p>
                            {request.preferences.deadline && (
                              <p className="text-xs text-red-600 mt-1">
                                Due: {new Date(request.preferences.deadline).toLocaleDateString()}
                              </p>
                            )}
                            {request.applicant.achievements && request.applicant.achievements.length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs text-gray-500">Key achievements:</p>
                                <ul className="text-xs text-gray-600 ml-2">
                                  {request.applicant.achievements.slice(0, 2).map((achievement, idx) => (
                                    <li key={idx}>• {achievement}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex flex-col space-y-2">
                            <button
                              onClick={() => handleLetterAction(request.id, 'accept')}
                              disabled={actionLoading === `accept-${request.id}`}
                              className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                            >
                              {actionLoading === `accept-${request.id}` ? '...' : 'Accept'}
                            </button>
                            <button
                              onClick={() => showRejectModal(request.id, request.applicant.name)}
                              disabled={actionLoading === `reject-${request.id}`}
                              className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                            >
                              {actionLoading === `reject-${request.id}` ? '...' : 'Reject'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Letters */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Recent Letters</h2>
                  <button
                    onClick={() => handleQuickAction('view_all_letters')}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View all →
                  </button>
                </div>

                {recentLetters.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-400 text-4xl mb-2">📭</div>
                    <p className="text-gray-500">No letters yet</p>
                    <button
                      onClick={() => handleQuickAction('new_letter')}
                      className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Request your first letter
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentLetters.map((letter) => (
                      <div key={letter.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${letter.status === 'completed' ? 'bg-green-500' :
                            letter.status === 'in_review' ? 'bg-yellow-500' :
                            letter.status === 'draft' ? 'bg-blue-500' :
                            letter.status === 'in_progress' ? 'bg-blue-400' :
                            letter.status === 'rejected' ? 'bg-red-500' : 'bg-gray-500'
                            }`}></div>
                          <div>
                            <p className="font-medium text-gray-900">{letter.applicant.name}</p>
                            <p className="text-sm text-gray-500">{letter.applicant.program}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${letter.status === 'completed' ? 'bg-green-100 text-green-800' :
                            letter.status === 'in_review' ? 'bg-yellow-100 text-yellow-800' :
                            letter.status === 'draft' ? 'bg-blue-100 text-blue-800' :
                            letter.status === 'in_progress' ? 'bg-blue-50 text-blue-700' :
                            letter.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                            }`}>
                            {letter.status.replace('_', ' ')}
                          </span>
                          <button
                            onClick={() => {
                              if (letter.status === 'draft' || letter.status === 'in_review') {
                                handleQuickAction('edit_letter', letter.id);
                              } else if (letter.status === 'in_progress') {
                                handleQuickAction('new_letter', letter.id);
                              } else {
                                handleQuickAction('view_letter', letter.id);
                              }
                            }}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ Reject Modal */}
      <ReasonModal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title={`Reject ${rejectApplicantName}'s Request`}
        description="Optionally provide a reason. This will be shared with the applicant."
        confirmLabel="Reject Request"
        confirmColor="red"
        onConfirm={handleRejectConfirm}
      />
    </div>
  );
};

export default DashboardPage;