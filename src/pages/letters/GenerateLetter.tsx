import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Navigation } from '../../components/layout/Navigation';

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
}

interface Template {
    id: string;
    name: string;
    description: string;
}

interface AIModel {
    id: string;
    name: string;
    description: string;
    pricing: string;
}

interface Alert {
    message: string;
    type: 'success' | 'error';
}

const GenerateLetter = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [letter, setLetter] = useState<LetterData | null>(null);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [availableModels, setAvailableModels] = useState<AIModel[]>([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
    const [selectedModel, setSelectedModel] = useState<string>('llama-3.1-8b'); // Default to free model
    const [generatedContent, setGeneratedContent] = useState<string>('');
    const [showContent, setShowContent] = useState(false);
    const [alert, setAlert] = useState<Alert | null>(null);
    const { user } = useAuth();

    const [context, setContext] = useState({
        relationship: '',
        duration: '',
        strengths: '',
        specific_examples: '',
        additional_context: ''
    });

    // Steps configuration
    const steps = [
        { id: 1, label: 'Request Received', status: 'completed' },
        { id: 2, label: 'Generate Draft', status: 'active' },
        { id: 3, label: 'Review & Edit', status: 'pending' },
        { id: 4, label: 'Approve & Send', status: 'pending' }
    ];

    useEffect(() => {
        if (!id) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                const [letterRes, templateRes, modelsRes] = await Promise.all([
                    api.get(`/letters/${id}`),
                    api.get(`/templates?includeUserTemplates=true`),
                    api.get(`/letters/available-models`),
                ]);

                setLetter(letterRes.data);
                setTemplates(templateRes.data.templates || []);
                setAvailableModels(modelsRes.data.models || []);
                setSelectedTemplateId(letterRes.data.template?.id || '');

                // If letter already has content, show it
                if (letterRes.data.letter_content) {
                    setGeneratedContent(letterRes.data.letter_content);
                    setShowContent(true);
                }
            } catch (err) {
                console.error('Failed to fetch data:', err);
                showAlert('Failed to load letter data', 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    const showAlert = (message: string, type: 'success' | 'error') => {
        setAlert({ message, type });
        setTimeout(() => setAlert(null), 5000);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setContext({ ...context, [e.target.name]: e.target.value });
    };

    const validateForm = () => {
        const requiredFields = [
            { field: 'selectedTemplateId', label: 'Template' },
            { field: 'selectedModel', label: 'AI Model' },
            { field: 'relationship', label: 'Relationship' },
            { field: 'duration', label: 'Duration' },
            { field: 'strengths', label: 'Strengths' }
        ];

        for (const { field, label } of requiredFields) {
            const value = field === 'selectedTemplateId' ? selectedTemplateId : 
                         field === 'selectedModel' ? selectedModel : 
                         context[field as keyof typeof context];
            if (!value?.trim()) {
                showAlert(`Please select/fill in the ${label} field.`, 'error');
                return false;
            }
        }
        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setGenerating(true);
        try {
            const response = await api.post(`/letters/${id}/generate-draft`, {
                template_id: selectedTemplateId,
                selected_model: selectedModel,
                extra_context: context
            });

            navigate(`/letters/${id}/edit`, { state: { fromGenerate: true } });
            showAlert('Draft generated successfully!', 'success');
        } catch (err) {
            console.error('Error generating draft:', err);
            showAlert('Failed to generate draft. Please try again.', 'error');
        } finally {
            setGenerating(false);
        }
    };

    const handleRegenerate = () => {
        setShowContent(false);
        setGeneratedContent('');
        showAlert('Ready to generate a new draft with updated information.', 'success');
    };

    const handleProceedToEdit = () => {
        navigate(`/letters/${id}/edit`);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (!letter) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600">Letter not found</p>
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
                    <button onClick={() => navigate('/letters')} className="text-blue-600 hover:underline">
                        Letters
                    </button>
                    <span>›</span>
                    <span>Generate Letter</span>
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
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Generate Recommendation Letter</h1>
                    <p className="text-gray-600">Provide additional context and choose your AI model to generate a personalized letter draft</p>
                </div>

                {/* Alert */}
                {alert && (
                    <div className={`rounded-lg p-4 mb-6 ${alert.type === 'success'
                        ? 'bg-green-50 border border-green-200 text-green-800'
                        : 'bg-red-50 border border-red-200 text-red-800'
                        }`}>
                        {alert.message}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Left Column - Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden sticky top-8">
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

                        {/* Action Buttons */}
                        <div className="space-y-6 mt-8">
                            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                                    <p>Fill out the form and click "Generate Draft" to create your letter</p>
                                </div>
                                <div className="p-6">
                                    {generating && (
                                        <div className="flex items-center justify-center py-12">
                                            <div className="text-center">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                                                <p className="text-gray-600">Generating your letter draft...</p>
                                                <p className="text-sm text-gray-500 mt-2">Using {availableModels.find(m => m.id === selectedModel)?.name || selectedModel}</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex justify-end space-x-4 mt-6">
                                        <button
                                            type="button"
                                            onClick={() => navigate('/letters')}
                                            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                            </svg>
                                            Back to Letters
                                        </button>

                                        {!showContent ? (
                                            <button
                                                type="button"
                                                onClick={handleSubmit}
                                                disabled={generating || !selectedTemplateId || !selectedModel}
                                                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {generating ? (
                                                    <>
                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                                                        Generating...
                                                    </>
                                                ) : (
                                                    <>
                                                        <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l14 9-14 9V3z" />
                                                        </svg>
                                                        Generate Draft
                                                    </>
                                                )}
                                            </button>
                                        ) : (
                                            <div className="space-x-3">
                                                <button
                                                    type="button"
                                                    onClick={handleRegenerate}
                                                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                >
                                                    <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                    </svg>
                                                    Regenerate
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={handleProceedToEdit}
                                                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                                >
                                                    <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                    Edit & Finalize
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content - Form */}
                    <div className="lg:col-span-3">
                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                                <div className="flex items-center space-x-3">
                                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                    <h3 className="text-lg font-semibold text-gray-900">Letter Configuration & Context</h3>
                                </div>
                            </div>
                            <div className="p-6 space-y-6">
                                {/* Template Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Letter Template <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={selectedTemplateId}
                                        onChange={(e) => setSelectedTemplateId(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">Select a template...</option>
                                        {templates.map((tpl) => (
                                            <option key={tpl.id} value={tpl.id}>
                                                {tpl.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* AI Model Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        AI Model <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={selectedModel}
                                        onChange={(e) => setSelectedModel(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        disabled={generating}
                                    >
                                        {availableModels.map((model) => (
                                            <option key={model.id} value={model.id}>
                                                {model.name} - {model.description} ({model.pricing})
                                            </option>
                                        ))}
                                    </select>
                                    <p className="mt-1 text-xs text-gray-500">
                                        {selectedModel === 'llama-3.1-8b' || selectedModel === 'gemma-2-9b' || selectedModel === 'phi-3-mini' || selectedModel === 'mistral-7b' 
                                            ? '🎉 FREE model selected - no costs!' 
                                            : '💰 This model has usage costs. Free models are recommended for testing.'}
                                    </p>
                                </div>

                                {/* Context Fields */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Your Relationship <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="relationship"
                                        value={context.relationship}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="e.g., student in my Advanced AI course"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Duration of Relationship <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="duration"
                                        value={context.duration}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="e.g., 2 years, 1 semester"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Key Strengths <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        name="strengths"
                                        value={context.strengths}
                                        onChange={handleChange}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Describe the applicant's key strengths and qualities you've observed"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Specific Examples
                                    </label>
                                    <textarea
                                        name="specific_examples"
                                        value={context.specific_examples}
                                        onChange={handleChange}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Provide specific examples of their work, achievements, or notable incidents"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Additional Context
                                    </label>
                                    <textarea
                                        name="additional_context"
                                        value={context.additional_context}
                                        onChange={handleChange}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Any other relevant information you'd like to include"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GenerateLetter;