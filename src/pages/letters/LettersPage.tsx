import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import { Navigation } from "../../components/layout/Navigation";

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
    tone?: string;
    length?: string;
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

export const LettersPage: React.FC = () => {
  const [allLetters, setAllLetters] = useState<Letter[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [filteredLetters, setFilteredLetters] = useState<Letter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;

      try {
        setLoading(true);
        setError('');

        // Get all letters
        const lettersResponse = await api.get('/letters', {
          params: { page, limit }
        });
        const letters = lettersResponse.data.letters || [];
        setAllLetters(letters);
        setFilteredLetters(letters);

        if (lettersResponse.data.pagination) {
          setTotalPages(lettersResponse.data.pagination.totalPages || 1);
          setTotalCount(lettersResponse.data.pagination.total || 0);  
        }

        // Get pending requests
        try {
          const pendingResponse = await api.get('/letters/pending');
          setPendingRequests(pendingResponse.data.pending_requests || []);
          console.log('Pending requests data:', pendingRequests);
          console.log('Pending requests data:', pendingResponse.data.pending_requests);
        } catch (pendingError) {
          setPendingRequests([]);
        }

      } catch (err: any) {
        console.error('Error fetching letters:', err);
        setError(err.response?.data?.error || 'Failed to fetch letters');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, page]);

  // Filter letters based on status and search term
  useEffect(() => {
    let filtered = allLetters;

    if (selectedStatus !== 'all') {
      if (selectedStatus === 'pending') {
        filtered = filtered.filter(letter =>
          letter.status === 'requested' || letter.status === 'in_progress'
        );
      } else {
        filtered = filtered.filter(letter => letter.status === selectedStatus);
      }
    }

    if (searchTerm) {
      filtered = filtered.filter(letter =>
        letter.applicant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        letter.applicant.program.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredLetters(filtered);
  }, [allLetters, selectedStatus, searchTerm]);

  // Handle accept/reject actions
  const handleLetterAction = async (letterId: string, action: 'accept' | 'reject', reason?: string) => {
    try {
      setActionLoading(`${action}-${letterId}`);

      const endpoint = action === 'accept' ? `/letters/${letterId}/accept` : `/letters/${letterId}/reject`;
      const payload = action === 'reject' && reason ? { reason } : {};

      await api.post(endpoint, payload);

      // Remove from pending requests
      setPendingRequests(prev => prev.filter(req => req.id !== letterId));

      // Refresh all letters
      const lettersResponse = await api.get('/letters', { params: { page, limit } });
      const letters = lettersResponse.data.letters || [];
      setAllLetters(letters);

    } catch (err: any) {
      console.error(`Error ${action}ing letter:`, err);
      setError(err.response?.data?.error || `Failed to ${action} letter`);
    } finally {
      setActionLoading('');
    }
  };

  const showRejectModal = (letterId: string, applicantName: string) => {
    const reason = window.prompt(
      `Why are you rejecting ${applicantName}'s request?\n\nThis message will be sent to the applicant (optional):`
    );

    if (reason === null) return;
    handleLetterAction(letterId, 'reject', reason);
  };

  const getActionButton = (letter: Letter) => {
    if (letter.status === 'requested') {
      return (
        <div className="flex space-x-2">
          <button
            onClick={() => handleLetterAction(letter.id, 'accept')}
            disabled={actionLoading === `accept-${letter.id}`}
            className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50"
          >
            {actionLoading === `accept-${letter.id}` ? '...' : 'Accept'}
          </button>
          <button
            onClick={() => showRejectModal(letter.id, letter.applicant.name)}
            disabled={actionLoading === `reject-${letter.id}`}
            className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 disabled:opacity-50"
          >
            {actionLoading === `reject-${letter.id}` ? '...' : 'Reject'}
          </button>
        </div>
      );
    } else if (letter.status === 'in_progress') {
      return (
        <button
          onClick={() => navigate(`/letters/${letter.id}/generate`)}
          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
        >
          Start Writing
        </button>
      );
    } else if (letter.status === 'draft' || letter.status === 'in_review') {
      return (
        <button
          onClick={() => navigate(`/letters/${letter.id}/edit`)}
          className="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700"
        >
          Continue Editing
        </button>
      );
    } else if (letter.status === 'completed') {
      return (
        <button
          onClick={() => navigate(`/letters/${letter.id}`)}
          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
        >
          View Letter
        </button>
      );
    } else if (letter.status === 'rejected') {
      return (
        <span className="text-red-600 text-sm font-medium">Declined</span>
      );
    }
    return null;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_review': return 'bg-yellow-100 text-yellow-800';
      case 'draft': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-blue-50 text-blue-700';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'requested': return 'Pending Response';
      case 'in_progress': return 'Accepted';
      case 'draft': return 'Draft Ready';
      case 'in_review': return 'Under Review';
      case 'completed': return 'Completed';
      case 'rejected': return 'Declined';
      default: return status;
    }
  };

  // Replace your current parseDate function with this one:
  const parseDate = (dateString: string | null | undefined): string => {
    if (!dateString || dateString === null || dateString === undefined || dateString === '') {
      return 'No date available';
    }

    try {
      // Convert to string in case it's not already
      const dateStr = String(dateString).trim();

      // Handle simple date format (YYYY-MM-DD)
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        const date = new Date(dateStr + 'T00:00:00.000Z');
        return isNaN(date.getTime()) ? 'Invalid date' : date.toLocaleDateString();
      }

      // Handle full timestamp format: "2025-07-30 22:32:06.701+02"
      if (dateStr.includes(' ')) {
        let isoString = dateStr.replace(' ', 'T');

        // Fix incomplete timezone format (+02 -> +02:00)
        if (/[+-]\d{2}$/.test(isoString)) {
          isoString += ':00';
        }

        const date = new Date(isoString);
        return isNaN(date.getTime()) ? 'Invalid date' : date.toLocaleDateString();
      }

      // Try parsing as-is for other formats
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? 'Invalid date' : date.toLocaleDateString();

    } catch (error) {
      console.warn('Date parsing error:', error);
      return 'Invalid date';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading letters...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <h3 className="text-sm font-medium text-red-800">Error loading letters</h3>
        <p className="mt-2 text-sm text-red-700">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <Navigation user={user} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Recommendation Letters</h1>
          <p className="text-gray-600 mt-2">
            Manage your letter requests and track progress
          </p>
        </div>

        {/* Pending Requests Section */}
        {pendingRequests.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-yellow-800 mb-4">
              Pending Requests ({pendingRequests.length})
            </h2>
            <div className="grid gap-4">
              {pendingRequests.map((request) => (
                <div key={request.id} className="bg-white rounded-lg p-4 border border-yellow-300">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">{request.applicant.name}</h3>
                          <p className="text-sm text-gray-600">{request.applicant.email}</p>
                          <p className="text-sm text-gray-700 mt-1">Program: {request.applicant.program}</p>
                          <p className="text-sm text-gray-700 mt-1">Goal: {request.applicant.goal}</p>
                        </div>
                        <div className="text-right text-xs text-gray-500">
                          Requested: {parseDate(request.created_at)}
                          {request.preferences.deadline && (
                            <div className="text-red-600 font-medium">
                              Due: {new Date(request.preferences.deadline).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>

                      {request.applicant.achievements && request.applicant.achievements.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs text-gray-500 mb-1">Key achievements:</p>
                          <ul className="text-sm text-gray-700 space-y-1">
                            {request.applicant.achievements.slice(0, 3).map((achievement, idx) => (
                              <li key={idx} className="flex items-start">
                                <span className="text-gray-400 mr-2">•</span>
                                {achievement}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* <div className="mt-3 flex space-x-4 text-xs text-gray-600">
                        <span>Tone: {request.preferences.tone || 'Not specified'}</span>
                        <span>Length: {request.preferences.length || 'Not specified'}</span>
                      </div> */}
                    </div>

                    <div className="ml-4 flex flex-col space-y-2">
                      <button
                        onClick={() => handleLetterAction(request.id, 'accept')}
                        disabled={actionLoading === `accept-${request.id}`}
                        className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 disabled:opacity-50 min-w-20"
                      >
                        {actionLoading === `accept-${request.id}` ? '...' : 'Accept'}
                      </button>
                      <button
                        onClick={() => showRejectModal(request.id, request.applicant.name)}
                        disabled={actionLoading === `reject-${request.id}`}
                        className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700 disabled:opacity-50 min-w-20"
                      >
                        {actionLoading === `reject-${request.id}` ? '...' : 'Decline'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {['all', 'pending', 'in_progress', 'draft', 'in_review', 'completed', 'rejected'].map((status) => (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${selectedStatus === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  {status === 'all' ? 'All' : getStatusLabel(status)}
                  {status === 'all' && ` (${totalCount})`}
                  {status !== 'all' && status === 'pending' && ` (${allLetters.filter(l => l.status === 'requested' || l.status === 'in_progress').length})`}
                  {status !== 'all' && status !== 'pending' && ` (${allLetters.filter(l => l.status === status).length})`}
                </button>
              ))}
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Search by applicant name or program..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Letters List */}
        <div className="bg-white rounded-lg shadow">
          {filteredLetters.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-4xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No letters found</h3>
              <p className="text-gray-500">
                {selectedStatus === 'all'
                  ? "You haven't received any letter requests yet."
                  : `No letters with status: ${getStatusLabel(selectedStatus)}`
                }
              </p>
            </div>
          ) : (
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Applicant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Program
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Deadline
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Requested
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLetters.map((letter) => (
                    <tr key={letter.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {letter.applicant.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {letter.applicant.program}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(letter.status)}`}>
                          {getStatusLabel(letter.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {letter.generation_parameters?.deadline
                          ? new Date(letter.generation_parameters.deadline).toLocaleDateString()
                          : 'No deadline'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {parseDate(letter.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {getActionButton(letter)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="flex justify-between items-center mt-4">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="px-3 py-1 rounded bg-gray-200 text-sm disabled:opacity-50"
            >
              Previous
            </button>

            <span className="text-sm text-gray-700">
              Page {page} of {totalPages}
            </span>

            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className="px-3 py-1 rounded bg-gray-200 text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LettersPage;