import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { Navigation } from '../../components/layout/Navigation';
import { useAuth } from '../../context/AuthContext';

interface LetterData {
  id: string;
  status: string;
  applicant_data: {
    firstName: string;
    lastName: string;
    email: string;
    program: string;
    goal: string;
    achievements: string[];
  };
  referee?: {
    firstName: string;
    lastName: string;
    title?: string;
    institution?: string;
    email?: string;
  };
  letter_content?: string;
  created_at?: string;
  updated_at?: string;
}

interface Alert {
  message: string;
  type: 'success' | 'error' | 'info';
}

const ApplicantLetterDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [letter, setLetter] = useState<LetterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<Alert | null>(null);

  // Steps for applicant view
  const getSteps = (status: string) => {
    const steps = [
      { id: 1, label: 'Submitted', status: 'completed' },
      { id: 2, label: 'In Progress', status: status === 'draft' || status === 'completed' ? 'completed' : 'pending' },
      { id: 3, label: 'Completed', status: status === 'completed' ? 'completed' : 'pending' }
    ];
    return steps;
  };

  useEffect(() => {
    const fetchLetter = async () => {
      if (!id) return;

      setLoading(true);
      try {
        const res = await api.get(`/letters/${id}`);
        setLetter(res.data);
      } catch (err) {
        console.error('Error loading letter:', err);
        showAlert('Failed to load letter data', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchLetter();
  }, [id]);

  const showAlert = (message: string, type: 'success' | 'error' | 'info') => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 4000);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const downloadPDF = async (preview = false) => {
    if (!letter || letter.status !== 'completed') return;
    try {
      const response = await api.get(`/letters/${id}/download/pdf${preview ? '?preview=true' : ''}`, {
        responseType: 'blob',
        headers: { 'Accept': 'application/pdf' }
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      if (preview) {
        window.open(url, '_blank');
        setTimeout(() => window.URL.revokeObjectURL(url), 100);
      } else {
        const link = document.createElement('a');
        link.href = url;
        link.download = `Recommendation_Letter_${letter.applicant_data.firstName}_${letter.applicant_data.lastName}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      showAlert('Failed to download PDF', 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-b-2 border-blue-600 rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading letter...</p>
        </div>
      </div>
    );
  }

  if (!letter) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600">Letter not found.</p>
          <button onClick={() => navigate('/letters')} className="mt-4 text-blue-600 hover:underline">
            Back to My Letters
          </button>
        </div>
      </div>
    );
  }

  const steps = getSteps(letter.status);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={user} />
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
          <button onClick={() => navigate('/dashboard')} className="text-blue-600 hover:underline">Dashboard</button>
          <span>›</span>
          <button onClick={() => navigate('/letters')} className="text-blue-600 hover:underline">My Letters</button>
          <span>›</span>
          <span>Letter Status</span>
        </div>

        {/* Status Steps */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-center space-x-4 overflow-x-auto">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center space-x-3 px-4 py-2 rounded-full text-sm font-medium ${
                  step.status === 'completed'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {step.status === 'completed' && (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                  <span>{step.label}</span>
                </div>
                {index < steps.length - 1 && <div className="w-8 h-px bg-gray-300 mx-2"></div>}
              </div>
            ))}
          </div>
        </div>

        {/* Letter Overview */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Letter Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-700">
            <div>
              <p className="font-medium">Referee:</p>
              <p className="text-gray-600">
                {letter.referee?.firstName} {letter.referee?.lastName}
                {letter.referee?.title ? `, ${letter.referee.title}` : ''}
              </p>
            </div>
            {letter.referee?.institution && (
              <div>
                <p className="font-medium">Institution:</p>
                <p className="text-gray-600">{letter.referee.institution}</p>
              </div>
            )}
            <div>
              <p className="font-medium">Status:</p>
              <p className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(letter.status)}`}>
                {letter.status.charAt(0).toUpperCase() + letter.status.slice(1)}
              </p>
            </div>
            {letter.created_at && (
              <div>
                <p className="font-medium">Requested On:</p>
                <p className="text-gray-600">{formatDate(letter.created_at)}</p>
              </div>
            )}
            {letter.updated_at && (
              <div>
                <p className="font-medium">Last Updated:</p>
                <p className="text-gray-600">{formatDate(letter.updated_at)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Letter Content */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Letter Content</h2>
          {letter.status !== 'completed' ? (
            <p className="text-gray-500 italic">
              Your referee is still working on your letter. You’ll be able to view it once it’s completed.
            </p>
          ) : (
            <>
              <div className="border border-gray-200 rounded-md p-6 bg-gray-50 mb-6">
                <pre className="whitespace-pre-wrap font-serif text-sm leading-relaxed text-gray-900">
                  {letter.letter_content}
                </pre>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => downloadPDF(true)}
                  className="px-4 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50"
                >
                  Preview PDF
                </button>
                <button
                  onClick={() => downloadPDF(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Download PDF
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApplicantLetterDetailPage;
