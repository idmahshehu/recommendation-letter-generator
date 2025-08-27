
// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import { useNavigate } from "react-router-dom";
// import { StatsCards } from "../../components/dashboard/StatsCards";

// interface Letter {
//   id: string;
//   status: 'requested' | 'draft' | 'in_review' | 'completed';
//   applicant: {
//     name: string;
//     program: string;
//   };
//   referee?: {
//     name: string;
//     institution: string;
//   };
//   template?: {
//     id: string;
//     name: string;
//     description: string;
//   };
//   generation_parameters?: {
//     deadline?: string;
//   };
//   created_at: string;
//   completed_at?: string | null;
//   content?: string;
// }

// interface PendingRequest {
//   id: string;
//   applicant: {
//     name: string;
//     email: string;
//     program: string;
//     goal: string;
//     achievements: string[];
//   };
//   preferences: {
//     tone?: string;
//     length?: string;
//     deadline?: string;
//   };
//   created_at: string;
// }

// const DashboardPage: React.FC = () => {
//   const [allLetters, setAllLetters] = useState<Letter[]>([]);
//   const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string>('');
//   const navigate = useNavigate();

//   // API Base URL
//   const API_BASE_URL = 'http://localhost:5000/api';

//   // Create axios instance with auth header
//   const createAuthHeaders = () => ({
//     headers: {
//       Authorization: `Bearer ${localStorage.getItem('token')}`,
//     },
//   });

//   useEffect(() => {
//     const fetchAllData = async () => {
//       console.log('🔄 Starting data fetch...');

//       try {
//         setLoading(true);
//         setError('');

//         console.log('📡 API Base URL:', API_BASE_URL);
//         console.log('🔑 Token exists:', !!localStorage.getItem('token'));

//         // 1. Get all letters
//         const lettersResponse = await axios.get(
//           `${API_BASE_URL}/letters`, 
//           createAuthHeaders()
//         );

//         console.log('✅ Letters API response:', lettersResponse.data);
//         const letters = lettersResponse.data.letters || [];
//         setAllLetters(letters);
//         console.log('📊 Set letters count:', letters.length);

//         // 2. Get pending requests (referees only)
//         try {
//           const pendingResponse = await axios.get(
//             `${API_BASE_URL}/letters/pending`, 
//             createAuthHeaders()
//           );
//           console.log('✅ Pending API response:', pendingResponse.data);
//           setPendingRequests(pendingResponse.data.pending_requests || []);
//         } catch (pendingError: any) {
//           console.log('⚠️ Pending requests failed:', pendingError.response?.status);
//           setPendingRequests([]);
//         }

//       } catch (err: any) {
//         console.error('❌ Fetch error:', err.response || err);
//         setError(err.response?.data?.error || 'Failed to fetch data');
//       } finally {
//         setLoading(false);
//         console.log('🏁 Fetch complete');
//       }
//     };

//     if (localStorage.getItem('token')) {
//       fetchAllData();
//     } else {
//       console.log('❌ No token, should redirect');
//     }
//   }, [navigate]);

//   // Calculate stats from allLetters
//   const getStats = () => {
//     const stats = {
//       total: allLetters.length,
//       pending: allLetters.filter(letter => letter.status === 'requested').length,
//       inReview: allLetters.filter(letter => 
//         letter.status === 'draft' || letter.status === 'in_review'
//       ).length,
//       completed: allLetters.filter(letter => letter.status === 'completed').length,
//     };

//     console.log('Calculated stats:', stats);
//     console.log('All letters:', allLetters);

//     return stats;
//   };

//   // Handle approve letter
//   const handleApproveLetter = async (letterId: string) => {
//     try {
//       await axios.post(
//         `${API_BASE_URL}/letters/${letterId}/approve`,
//         {},
//         createAuthHeaders()
//       );

//       // Update local state
//       setAllLetters(prev => 
//         prev.map(letter => 
//           letter.id === letterId 
//             ? { ...letter, status: 'completed' as const, completed_at: new Date().toISOString() }
//             : letter
//         )
//       );
//     } catch (err: any) {
//       console.error('Error approving letter:', err);
//     }
//   };

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center min-h-screen">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
//           <p className="mt-4 text-gray-600">Loading dashboard...</p>
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="p-6">
//         <div className="bg-red-50 border border-red-200 rounded-md p-4">
//           <div className="flex">
//             <div className="flex-shrink-0">
//               <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
//                 <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
//               </svg>
//             </div>
//             <div className="ml-3">
//               <h3 className="text-sm font-medium text-red-800">Error loading dashboard</h3>
//               <p className="mt-2 text-sm text-red-700">{error}</p>
//               <button 
//                 onClick={() => window.location.reload()}
//                 className="mt-2 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
//               >
//                 Try Again
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   const stats = getStats();
//   const draftsInReview = allLetters.filter(letter => 
//     letter.status === 'draft' || letter.status === 'in_review'
//   );
//   const completedLetters = allLetters.filter(letter => letter.status === 'completed');

//   return (
//     <div className="p-6 bg-gray-50 min-h-screen">
//       <div className="mb-8">
//         <h1 className="text-3xl font-bold text-gray-900 mb-2">
//           📄 Dashboard
//         </h1>
//         <p className="text-gray-600">
//           Manage your recommendation letters
//         </p>
//       </div>

//       {/* Stats Cards */}
//       <StatsCards stats={stats} />

//       {/* Debug Info (Remove in production) */}
//       <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
//         <h3 className="font-semibold text-yellow-800 mb-2">Debug Info:</h3>
//         <p className="text-sm text-yellow-700">
//           Total Letters: {allLetters.length} | 
//           Pending Requests: {pendingRequests.length} | 
//           API Response: {allLetters.length > 0 ? '✅ Success' : '❌ Empty'}
//         </p>
//       </div>

//       {/* Content Sections */}
//       <div className="space-y-8">

//         {/* Pending Requests Section (For Referees) */}
//         {pendingRequests.length > 0 && (
//           <Section title="🕐 Pending Requests">
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//               {pendingRequests.map((request) => (
//                 <Card key={request.id}>
//                   <div className="space-y-2">
//                     <p className="font-semibold text-lg">{request.applicant.name}</p>
//                     <p className="text-sm text-gray-600">{request.applicant.program}</p>
//                     <p className="text-sm text-gray-500">
//                       Goal: {request.applicant.goal}
//                     </p>
//                     {request.preferences.deadline && (
//                       <p className="text-sm text-red-600">
//                         Deadline: {new Date(request.preferences.deadline).toLocaleDateString()}
//                       </p>
//                     )}
//                     <button
//                       onClick={() => navigate(`/letters/${request.id}/generate`)}
//                       className="w-full mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
//                     >
//                       Generate Draft
//                     </button>
//                   </div>
//                 </Card>
//               ))}
//             </div>
//           </Section>
//         )}

//         {/* Drafts / In Review Section */}
//         <Section title="✍️ Drafts / In Review">
//           {draftsInReview.length === 0 ? (
//             <EmptyState message="No drafts in progress." />
//           ) : (
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//               {draftsInReview.map((letter) => (
//                 <Card key={letter.id}>
//                   <div className="space-y-2">
//                     <p className="font-semibold text-lg">{letter.applicant.name}</p>
//                     <p className="text-sm text-gray-600">{letter.applicant.program}</p>
//                     <p className="text-sm">
//                       <span className={`inline-block px-2 py-1 rounded text-xs ${
//                         letter.status === 'draft' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
//                       }`}>
//                         {letter.status.replace('_', ' ').toUpperCase()}
//                       </span>
//                     </p>
//                     <div className="flex gap-2 mt-3">
//                       <button
//                         onClick={() => navigate(`/letters/${letter.id}/edit`)}
//                         className="flex-1 bg-yellow-500 text-white px-3 py-2 rounded-lg hover:bg-yellow-600 transition-colors"
//                       >
//                         Edit
//                       </button>
//                       <button 
//                         onClick={() => handleApproveLetter(letter.id)}
//                         className="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors"
//                       >
//                         Approve
//                       </button>
//                     </div>
//                   </div>
//                 </Card>
//               ))}
//             </div>
//           )}
//         </Section>

//         {/* Completed Letters Section */}
//         <Section title="✅ Completed Letters">
//           {completedLetters.length === 0 ? (
//             <EmptyState message="No completed letters yet." />
//           ) : (
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//               {completedLetters.map((letter) => (
//                 <Card key={letter.id}>
//                   <div className="space-y-2">
//                     <p className="font-semibold text-lg">{letter.applicant.name}</p>
//                     <p className="text-sm text-gray-600">{letter.applicant.program}</p>
//                     <p className="text-sm text-gray-500">
//                       Completed: {letter.completed_at 
//                         ? new Date(letter.completed_at).toLocaleDateString()
//                         : 'Recently'
//                       }
//                     </p>
//                     <button 
//                       onClick={() => navigate(`/letters/${letter.id}`)}
//                       className="w-full mt-3 bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
//                     >
//                       View Letter
//                     </button>
//                   </div>
//                 </Card>
//               ))}
//             </div>
//           )}
//         </Section>

//         {/* All Letters Table */}
//         <Section title="📋 All Letters">
//           {allLetters.length === 0 ? (
//             <EmptyState message="No letters found. Start by requesting a new letter!" />
//           ) : (
//             <div className="bg-white rounded-lg shadow overflow-hidden">
//               <div className="overflow-x-auto">
//                 <table className="min-w-full divide-y divide-gray-200">
//                   <thead className="bg-gray-50">
//                     <tr>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                         Applicant
//                       </th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                         Program
//                       </th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                         Status
//                       </th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                         Template
//                       </th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                         Created
//                       </th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                         Actions
//                       </th>
//                     </tr>
//                   </thead>
//                   <tbody className="bg-white divide-y divide-gray-200">
//                     {allLetters.map((letter) => (
//                       <tr key={letter.id} className="hover:bg-gray-50">
//                         <td className="px-6 py-4 whitespace-nowrap">
//                           <div className="font-medium text-gray-900">
//                             {letter.applicant.name}
//                           </div>
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                           {letter.applicant.program}
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap">
//                           <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
//                             letter.status === 'completed' ? 'bg-green-100 text-green-800' :
//                             letter.status === 'in_review' ? 'bg-yellow-100 text-yellow-800' :
//                             letter.status === 'draft' ? 'bg-blue-100 text-blue-800' :
//                             'bg-gray-100 text-gray-800'
//                           }`}>
//                             {letter.status.replace('_', ' ')}
//                           </span>
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                           {letter.template?.name || '—'}
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                           {new Date(letter.created_at).toLocaleDateString()}
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
//                           <button 
//                             onClick={() => navigate(`/letters/${letter.id}`)}
//                             className="text-blue-600 hover:text-blue-900"
//                           >
//                             View
//                           </button>
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             </div>
//           )}
//         </Section>

//       </div>
//     </div>
//   );
// };

// export default DashboardPage;

// // Helper Components
// const Section = ({
//   title,
//   children,
// }: {
//   title: string;
//   children: React.ReactNode;
// }) => (
//   <div className="mb-8">
//     <h2 className="text-xl font-semibold mb-4 text-gray-900">{title}</h2>
//     {children}
//   </div>
// );

// const Card = ({ children }: { children: React.ReactNode }) => (
//   <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
//     {children}
//   </div>
// );

// const EmptyState = ({ message }: { message: string }) => (
//   <div className="text-center py-12">
//     <div className="text-gray-400 text-6xl mb-4">📭</div>
//     <p className="text-gray-500 text-lg">{message}</p>
//   </div>
// );


import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { StatsCards } from "../../components/dashboard/StatsCards";
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
          // Not all users have pending requests
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

      // Show success message
      const message = action === 'accept'
        ? 'Letter request accepted successfully!'
        : 'Letter request rejected';

      // You can add a toast notification here
      console.log(message);

    } catch (err: any) {
      console.error(`Error ${action}ing letter:`, err);
      setError(err.response?.data?.error || `Failed to ${action} letter`);
    } finally {
      setActionLoading('');
    }
  };

  // Show reject modal
  const showRejectModal = (letterId: string, applicantName: string) => {
    const reason = window.prompt(
      `Why are you rejecting ${applicantName}'s request?\n\nThis message will be sent to the applicant (optional):`
    );

    // If user clicked cancel, don't proceed
    if (reason === null) return;

    handleLetterAction(letterId, 'reject', reason);
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
        // If we have an existing letter id, open generate for that letter,
        // otherwise go to the "create/request" page.
        if (letterId) {
          navigate(`/letters/${letterId}/generate`);
        } else {
          navigate('/letters/new'); // <- create/request page
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
  const recentLetters = allLetters.slice(0, 5); // Show 5 most recent
  const urgentDeadlines = allLetters.filter(letter => {
    if (!letter.generation_parameters?.deadline) return false;
    const deadline = new Date(letter.generation_parameters.deadline);
    const now = new Date();
    const daysUntilDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilDeadline <= 7 && daysUntilDeadline > 0;
  });

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="space-y-8">
        {/* Top nav */}
        <Navigation user={user} />
        {/* Welcome Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            {/* <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {user?.firstName || 'User'}! 👋
            </h1> */}
            <p className="text-gray-600 mt-2">
              Overview of your recommendation letters
            </p>
          </div>


          {/* Stats Cards */}
          <StatsCards stats={stats} />

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">

              {/* Pending Requests (For Referees) */}
              {/* Pending Requests (For Referees) */}
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
                              className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed min-w-16"
                            >
                              {actionLoading === `accept-${request.id}` ? '...' : 'Accept'}
                            </button>
                            <button
                              onClick={() => showRejectModal(request.id, request.applicant.name)}
                              disabled={actionLoading === `reject-${request.id}`}
                              className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed min-w-16"
                            >
                              {actionLoading === `reject-${request.id}` ? '...' : 'Reject'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {pendingRequests.length > 3 && (
                      <button
                        onClick={() => onNavigate?.('letters')}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View all {pendingRequests.length} requests →
                      </button>
                    )}
                  </div>
                </div>
              )}
              {/* {pendingRequests.length > 0 && (
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
                          <div>
                            <p className="font-medium text-gray-900">{request.applicant.name}</p>
                            <p className="text-sm text-gray-600">{request.applicant.program}</p>
                            {request.preferences.deadline && (
                              <p className="text-xs text-red-600 mt-1">
                                Due: {new Date(request.preferences.deadline).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => navigate(`/letters/${request.id}/generate`)}
                            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                          >
                            Generate
                          </button>
                        </div>
                      </div>
                    ))}
                    {pendingRequests.length > 3 && (
                      <button
                        onClick={() => onNavigate?.('letters')}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View all {pendingRequests.length} requests →
                      </button>
                    )}
                  </div>
                </div>
              )} */}

              {/* Urgent Deadlines */}
              {urgentDeadlines.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-red-800 mb-4">
                    ⚠️ Urgent Deadlines
                  </h2>
                  <div className="space-y-3">
                    {urgentDeadlines.map((letter) => (
                      <div key={letter.id} className="bg-white rounded-lg p-4 border border-red-300">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900">{letter.applicant.name}</p>
                            <p className="text-sm text-gray-600">{letter.applicant.program}</p>
                            <p className="text-xs text-red-600 mt-1">
                              Due: {letter.generation_parameters?.deadline
                                ? new Date(letter.generation_parameters.deadline).toLocaleDateString()
                                : 'Soon'
                              }
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            {letter.status === 'completed' ? (
                              <button
                                onClick={() => handleQuickAction('view_letter', letter.id)}
                                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                              >
                                View
                              </button>
                            ) : (
                              <button
                                onClick={() => handleQuickAction('edit_letter', letter.id)}
                                className="bg-orange-600 text-white px-3 py-1 rounded text-sm hover:bg-orange-700"
                              >
                                {letter.status === 'requested' ? 'Start' : 'Continue'}
                              </button>
                            )}
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
                            // onClick={() => handleQuickAction('view_letter', letter.id)}
                            onClick={() => {
                              if (letter.status === 'draft') {
                                handleQuickAction('edit_letter', letter.id);
                              } else if (letter.status === 'in_review') {
                                handleQuickAction('edit_letter', letter.id);
                              } else if (letter.status === 'in_progress') {
                                handleQuickAction('new_letter', letter.id); // Go to generate
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

            {/* Sidebar - Quick Actions */}
            {/* <div className="space-y-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="space-y-3">
                  <button
                    onClick={() => handleQuickAction('new_letter')} // now routes to /letters/new
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-left"
                  >
                    📝 Request New Letter
                  </button>
                  <button
                    onClick={() => handleQuickAction('view_all_letters')}
                    className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-left"
                  >
                    📋 View All Letters
                  </button>
                  <button
                    onClick={() => onNavigate?.('templates')}
                    className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-left"
                  >
                    📄 Manage Templates
                  </button>
                </div>
              </div> */}

            {/* Stats Summary */}
            {/* <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Summary</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">This Month</span>
                    <span className="font-medium">
                      {allLetters.filter(l => {
                        const created = new Date(l.created_at);
                        const now = new Date();
                        return created.getMonth() === now.getMonth() &&
                          created.getFullYear() === now.getFullYear();
                      }).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Completion Rate</span>
                    <span className="font-medium">
                      {allLetters.length > 0
                        ? Math.round((stats.completed / allLetters.length) * 100) + '%'
                        : '0%'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg. Response Time</span>
                    <span className="font-medium">2-3 days</span>
                  </div>
                </div>
              </div> */}
            {/* </div> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;