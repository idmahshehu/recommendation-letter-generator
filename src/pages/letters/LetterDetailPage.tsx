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
    template?: {
        id: string;
        name: string;
    };
    letter_content?: string;
    referee?: {
        firstName: string;
        lastName: string;
        institution: string;
    };
    created_at?: string;
    updated_at?: string;
}

interface Alert {
    message: string;
    type: 'success' | 'error' | 'info';
}

const LetterDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [letter, setLetter] = useState<LetterData | null>(null);
    const [loading, setLoading] = useState(true);
    const [alert, setAlert] = useState<Alert | null>(null);
    const [wordCount, setWordCount] = useState(0);
    const [showFullLetter, setShowFullLetter] = useState(true);
    const { user } = useAuth();

    // Steps configuration based on letter status
    const getSteps = (status: string) => {
        const baseSteps = [
            { id: 1, label: 'Request Received', status: 'completed' },
            { id: 2, label: 'Generate Draft', status: status === 'pending' ? 'pending' : 'completed' },
            { id: 3, label: 'Review & Edit', status: status === 'draft' ? 'active' : status === 'completed' ? 'completed' : 'pending' },
            { id: 4, label: 'Approve & Send', status: status === 'completed' ? 'completed' : 'pending' }
        ];
        return baseSteps;
    };

    useEffect(() => {
        const fetchLetter = async () => {
            if (!id) return;

            setLoading(true);
            try {
                const res = await api.get(`/letters/${id}`);
                const letterData = res.data;
                setLetter(letterData);

                if (letterData.letter_content) {
                    setWordCount(countWords(letterData.letter_content));
                }
            } catch (err) {
                console.error('Error loading letter:', err);
                showAlert('Failed to load letter data', 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchLetter();
    }, [id]);

    const countWords = (text: string): number => {
        return text.trim().split(/\s+/).filter(word => word.length > 0).length;
    };

    const showAlert = (message: string, type: 'success' | 'error' | 'info') => {
        setAlert({ message, type });
        setTimeout(() => setAlert(null), 5000);
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
            case 'completed':
                return 'bg-green-100 text-green-800';
            case 'draft':
                return 'bg-blue-100 text-blue-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const handleEdit = () => {
        navigate(`/letters/${id}/edit`);
    };

    const handleRegenerate = () => {
        navigate(`/letters/${id}/generate`);
    };

    const handleDownload = async () => {
        try {
            const response = await api.get(`/letters/${id}/download`, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `letter-${letter?.applicant_data.firstName}-${letter?.applicant_data.lastName}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Error downloading letter:', err);
            showAlert('Failed to download letter', 'error');
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this letter? This action cannot be undone.')) {
            return;
        }

        try {
            await api.delete(`/letters/${id}`);
            showAlert('Letter deleted successfully', 'success');
            setTimeout(() => navigate('/letters'), 1500);
        } catch (err) {
            console.error('Error deleting letter:', err);
            showAlert('Failed to delete letter', 'error');
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

    const steps = getSteps(letter.status);

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
                    <button onClick={() => navigate('/letters')} className="text-blue-600 hover:underline">
                        Letters
                    </button>
                    <span>›</span>
                    <span>Letter Details</span>
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
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            Letter for {letter.applicant_data.firstName} {letter.applicant_data.lastName}
                        </h1>
                        <div className="flex items-center space-x-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(letter.status)}`}>
                                {letter.status.charAt(0).toUpperCase() + letter.status.slice(1)}
                            </span>
                            {letter.created_at && (
                                <span className="text-gray-500 text-sm">
                                    Created {formatDate(letter.created_at)}
                                </span>
                            )}
                            {wordCount > 0 && (
                                <span className="text-gray-500 text-sm">
                                    {wordCount} words
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
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
                                    onClick={handleEdit}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    Edit
                                </button>

                                <button
                                    onClick={handleRegenerate}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    Regenerate
                                </button>

                                <button
                                    onClick={handleDownload}
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

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Left Sidebar - Applicant Info */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Applicant Information */}
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
                                    <span className="font-medium text-gray-700">Email:</span>
                                    <p className="text-gray-600">{letter.applicant_data.email}</p>
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

                        {/* Letter Information */}
                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                                <h3 className="font-semibold text-gray-900">Letter Information</h3>
                            </div>
                            <div className="p-4 space-y-3 text-sm">
                                <div>
                                    <span className="font-medium text-gray-700">Status:</span>
                                    <p className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ml-2 ${getStatusColor(letter.status)}`}>
                                        {letter.status.charAt(0).toUpperCase() + letter.status.slice(1)}
                                    </p>
                                </div>
                                {letter.template && (
                                    <div>
                                        <span className="font-medium text-gray-700">Template:</span>
                                        <p className="text-gray-600">{letter.template.name}</p>
                                    </div>
                                )}
                                {letter.created_at && (
                                    <div>
                                        <span className="font-medium text-gray-700">Created:</span>
                                        <p className="text-gray-600">{formatDate(letter.created_at)}</p>
                                    </div>
                                )}
                                {letter.updated_at && (
                                    <div>
                                        <span className="font-medium text-gray-700">Last Updated:</span>
                                        <p className="text-gray-600">{formatDate(letter.updated_at)}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                                <h3 className="font-semibold text-gray-900">Actions</h3>
                            </div>
                            <div className="p-4 space-y-2">
                                <button
                                    onClick={() => navigate('/letters')}
                                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                                >
                                    <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                    </svg>
                                    Back to Letters
                                </button>

                                <button
                                    onClick={handleDelete}
                                    className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
                                >
                                    <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Delete Letter
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Main Content - Letter Display */}
                    <div className="lg:col-span-3">
                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                            {/* Letter Header */}
                            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <h3 className="text-lg font-semibold text-gray-900">Letter Content</h3>
                                    </div>

                                    {letter.letter_content && (
                                        <button
                                            onClick={() => setShowFullLetter(!showFullLetter)}
                                            className="text-sm text-blue-600 hover:text-blue-700"
                                        >
                                            {showFullLetter ? 'Show Preview' : 'Show Full Letter'}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Letter Content */}
                            <div className="p-6">
                                {!letter.letter_content ? (
                                    <div className="text-center py-12 text-gray-500">
                                        <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <p className="mb-4">No letter content available yet</p>
                                        <button
                                            onClick={() => navigate(`/letters/${id}/generate`)}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                        >
                                            Generate Letter
                                        </button>
                                    </div>
                                ) : (
                                    // <div className={`border border-gray-200 rounded-md p-6 bg-white ${
                                    //     showFullLetter ? 'max-h-none' : 'max-h-96'
                                    // } overflow-y-auto`}>
                                    //     <pre className="whitespace-pre-wrap font-serif text-sm leading-relaxed text-gray-900">
                                    //         {letter.letter_content}
                                    //     </pre>
                                    // </div>
                                    <div className="border border-gray-200 rounded-md p-6 bg-white">
                                        <pre className="whitespace-pre-wrap font-serif text-sm leading-relaxed text-gray-900">
                                            {letter.letter_content}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LetterDetailPage;