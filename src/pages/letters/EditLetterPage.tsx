import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Navigation } from '../../components/layout/Navigation';
import VersionHistory from './VersionHistory';
import RegenerationModal from '../RegenerationModal';

interface LetterData {
  id: string;
  status: string;
  current_version?: number;
  applicant_data: {
    firstName: string;
    lastName: string;
    email: string;
    program: string;
    goal: string;
    achievements: string[];
  };
  letter_content: string;
  generation_parameters?: {
    extra_context?: {
      relationship?: string;
      duration?: string;
      strengths?: string;
      specific_examples?: string;
      additional_context?: string;
    };
    model_selection?: string;
    tokens_used?: number;
    regeneration_type?: string;
    tone?: string;
    length?: string;
    detailLevel?: string;
  };
  referee?: {
    firstName: string;
    lastName: string;
    institution: string;
  };
}

interface Alert {
  message: string;
  type: 'success' | 'error' | 'info';
}

const EditLetterPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [letter, setLetter] = useState<LetterData | null>(null);
  const [content, setContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<Alert | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [showRegenerationModal, setShowRegenerationModal] = useState(false);
  const { user } = useAuth();

  // Steps configuration
  const steps = [
    { id: 1, label: 'Request Received', status: 'completed' },
    { id: 2, label: 'Generate Draft', status: 'completed' },
    { id: 3, label: 'Review & Edit', status: 'active' },
    { id: 4, label: 'Approve & Send', status: 'pending' }
  ];

  useEffect(() => {
    const fetchLetter = async () => {
      if (!id) return;

      setLoading(true);
      try {
        const res = await api.get(`/letters/${id}`);
        const letterData = res.data;
        setLetter(letterData);

        const letterContent = letterData.letter_content || '';
        setContent(letterContent);
        setOriginalContent(letterContent);
        setWordCount(countWords(letterContent));
      } catch (err) {
        console.error('Error loading letter:', err);
        showAlert('Failed to load letter data', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchLetter();
  }, [id]);

  // Track unsaved changes
  useEffect(() => {
    setHasUnsavedChanges(content !== originalContent);
  }, [content, originalContent]);

  // Update word count when content changes
  useEffect(() => {
    setWordCount(countWords(content));
  }, [content]);

  // Warn user about unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const countWords = (text: string): number => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const showAlert = (message: string, type: 'success' | 'error' | 'info') => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleSave = async () => {
    if (!content.trim()) {
      showAlert('Letter content cannot be empty', 'error');
      return;
    }

    setSaving(true);
    try {
      await api.put(`/letters/${id}/edit`, { letter_content: content });
      setOriginalContent(content);
      showAlert('Letter updated successfully', 'success');
    } catch (err) {
      console.error('Error updating letter:', err);
      showAlert('Failed to update the letter', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async () => {
    if (hasUnsavedChanges) {
      showAlert('Please save your changes before approving the letter', 'error');
      return;
    }

    try {
      await api.post(`/letters/${id}/approve`);
      showAlert('Letter approved and completed successfully', 'success');
      setTimeout(() => navigate('/letters'), 1500);
    } catch (err) {
      console.error('Error approving letter:', err);
      showAlert('Failed to approve the letter', 'error');
    }
  };

  const handleRegenerateClick = () => {
    if (hasUnsavedChanges) {
      if (window.confirm('You have unsaved changes. Regenerating will discard these changes. Continue?')) {
        setShowRegenerationModal(true);
      }
    } else {
      setShowRegenerationModal(true);
    }
  };

  const handleRegenerated = (newContent: string, metadata: any) => {
    setContent(newContent);
    setOriginalContent(newContent);
    setWordCount(countWords(newContent));
    
    // Update letter data to reflect new generation parameters
    if (letter) {
      setLetter({
        ...letter,
        current_version: metadata.version,
        generation_parameters: {
          ...letter.generation_parameters,
          model_selection: metadata.selected_model,
          tokens_used: metadata.tokens_used,
          regeneration_type: 'regeneration'
        }
      });
    }
    
    showAlert(`Letter regenerated successfully with ${metadata.selected_model || 'selected model'}`, 'success');
  };

  const handleVersionRestored = (newContent: string, version: number) => {
    setContent(newContent);
    setOriginalContent(newContent);
    setWordCount(countWords(newContent));
    
    // Update letter data to reflect restoration
    if (letter) {
      setLetter({
        ...letter,
        current_version: version,
        generation_parameters: {
          ...letter.generation_parameters,
          regeneration_type: 'restoration'
        }
      });
    }
    
    showAlert(`Version restored successfully`, 'success');
  };

  const handleRevert = () => {
    if (window.confirm('Are you sure you want to revert all changes? This action cannot be undone.')) {
      setContent(originalContent);
      showAlert('Changes reverted', 'info');
    }
  };

  const handleBack = () => {
    if (hasUnsavedChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
        navigate('/letters');
      }
    } else {
      navigate('/letters');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading letter...</p>
        </div>
      </div>
    );
  }

  if (!letter) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Letter not found</p>
          <button
            onClick={() => navigate('/letters')}
            className="mt-4 text-blue-600 hover:underline"
          >
            Back to Letters
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <Navigation user={user} />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
          <button onClick={() => navigate('/dashboard')} className="text-blue-600 hover:underline">
            Dashboard
          </button>
          <span>›</span>
          <button onClick={handleBack} className="text-blue-600 hover:underline">
            Letters
          </button>
          <span>›</span>
          <span>Edit Letter</span>
        </div>

        {/* Step Indicator */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-center space-x-4 overflow-x-auto">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center space-x-3 px-4 py-2 rounded-full text-sm font-medium ${step.status === 'completed'
                  ? 'bg-green-100 text-green-800'
                  : step.status === 'active'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-600'
                  }`}>
                  {step.status === 'completed' && (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                  <span>{step.label}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className="w-8 h-px bg-gray-300 mx-2"></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Page Header */}
        <div className='flex justify-between items-start mb-8'>
          <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Edit Letter for {letter.applicant_data.firstName} {letter.applicant_data.lastName}
          </h1>
          <p className="text-gray-600">Review and edit the letter content before final approval</p>
          </div>

          <div className="flex space-x-3">
                        {letter.status === 'pending' && (
                            <button
                                onClick={() => navigate(`/letters/${id}/generate`)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l14 9-14 9V3z" />
                                </svg>
                                Generate Draft
                            </button>
                        )}

                        {(letter.status === 'draft' || letter.status === 'completed') && (
                            <>
                                <button
                                    // onClick={handleEdit}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    Edit
                                </button>

                                <button
                                    // onClick={handleDownload}
                                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                                >
                                    <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Download
                                </button>
                            </>
                        )}
           </div>
        
        </div>
        

        {/* Alert */}
        {alert && (
          <div className={`rounded-lg p-4 mb-6 ${alert.type === 'success'
            ? 'bg-green-50 border border-green-200 text-green-800'
            : alert.type === 'error'
              ? 'bg-red-50 border border-red-200 text-red-800'
              : 'bg-blue-50 border border-blue-200 text-blue-800'
            }`}>
            {alert.message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left Sidebar - Info Cards */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Applicant Details */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900">Applicant Details</h3>
                </div>
                <div className="p-4 space-y-3 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Name:</span>
                    <p className="text-gray-600">{letter.applicant_data.firstName} {letter.applicant_data.lastName}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Program:</span>
                    <p className="text-gray-600">{letter.applicant_data.program}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Goal:</span>
                    <p className="text-gray-600">{letter.applicant_data.goal}</p>
                  </div>
                  {letter.applicant_data.achievements?.length > 0 && (
                    <div>
                      <span className="font-medium text-gray-700">Achievements:</span>
                      <ul className="mt-1 space-y-1">
                        {letter.applicant_data.achievements.map((achievement, idx) => (
                          <li key={idx} className="text-gray-600 text-xs flex items-start">
                            <span className="text-blue-500 mr-1">•</span>
                            {achievement}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Generation Context */}
              {letter.generation_parameters?.extra_context && (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="bg-blue-50 px-4 py-3 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900">Your Context Input</h3>
                    <p className="text-xs text-gray-600 mt-1">Context you provided for generation</p>
                  </div>
                  <div className="p-4 space-y-3 text-sm">
                    {letter.generation_parameters.extra_context.relationship && (
                      <div>
                        <span className="font-medium text-gray-700">Relationship:</span>
                        <p className="text-gray-600 text-xs mt-1">{letter.generation_parameters.extra_context.relationship}</p>
                      </div>
                    )}
                    {letter.generation_parameters.extra_context.duration && (
                      <div>
                        <span className="font-medium text-gray-700">Duration:</span>
                        <p className="text-gray-600 text-xs mt-1">{letter.generation_parameters.extra_context.duration}</p>
                      </div>
                    )}
                    {letter.generation_parameters.extra_context.strengths && (
                      <div>
                        <span className="font-medium text-gray-700">Strengths:</span>
                        <p className="text-gray-600 text-xs mt-1">{letter.generation_parameters.extra_context.strengths}</p>
                      </div>
                    )}
                    {letter.generation_parameters.extra_context.specific_examples && (
                      <div>
                        <span className="font-medium text-gray-700">Examples:</span>
                        <p className="text-gray-600 text-xs mt-1">{letter.generation_parameters.extra_context.specific_examples}</p>
                      </div>
                    )}
                    {letter.generation_parameters.extra_context.additional_context && (
                      <div>
                        <span className="font-medium text-gray-700">Additional:</span>
                        <p className="text-gray-600 text-xs mt-1">{letter.generation_parameters.extra_context.additional_context}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Generation Metadata */}
              {letter.generation_parameters && (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="bg-green-50 px-4 py-3 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900">Generation Info</h3>
                    <p className="text-xs text-gray-600 mt-1">AI model and settings used</p>
                  </div>
                  <div className="p-4 space-y-3 text-sm">
                    {letter.generation_parameters.model_selection && (
                      <div>
                        <span className="font-medium text-gray-700">AI Model:</span>
                        <p className="text-gray-600 text-xs mt-1 capitalize">{letter.generation_parameters.model_selection.replace('-', ' ')}</p>
                      </div>
                    )}
                    {letter.generation_parameters.regeneration_type && (
                      <div>
                        <span className="font-medium text-gray-700">Last Action:</span>
                        <p className="text-gray-600 text-xs mt-1 capitalize">{letter.generation_parameters.regeneration_type.replace('_', ' ')}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Version History */}
              <VersionHistory
                letterId={id!}
                currentVersion={letter.current_version || 1}
                onVersionRestored={handleVersionRestored}
              />
            </div>
          </div>

          {/* Main Editor Area */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              {/* Editor Header */}
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-900">Letter Content</h3>
                    {hasUnsavedChanges && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Unsaved changes
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    {wordCount} words
                  </div>
                </div>
              </div>

              {/* Editor Content */}
              <div className="p-6">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full p-4 border border-gray-300 rounded-md
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
    font-serif text-sm leading-relaxed resize-none"
                  placeholder="Enter your letter content here..."
                  rows={Math.max(10, content.split('\n').length + 2)}
                />

                {/* Editor Actions */}
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={handleBack}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                      Back to Letters
                    </button>

                    {hasUnsavedChanges && (
                      <button
                        type="button"
                        onClick={handleRevert}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Revert Changes
                      </button>
                    )}
                  </div>

                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={handleRegenerateClick}
                      className="px-4 py-2 border border-orange-300 text-orange-700 rounded-md hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    >
                      <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Regenerate
                    </button>
                    
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={saving || !hasUnsavedChanges}
                      className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Save Changes
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleApprove}
                      disabled={hasUnsavedChanges || !content.trim()}
                      className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Approve & Complete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Regeneration Modal */}
      <RegenerationModal
        isOpen={showRegenerationModal}
        onClose={() => setShowRegenerationModal(false)}
        letterId={id!}
        onRegenerated={handleRegenerated}
        currentContent={content}
      />
    </div>
  );
};

export default EditLetterPage;