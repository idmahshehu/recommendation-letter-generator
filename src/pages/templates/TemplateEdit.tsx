import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Navigation } from '../../components/layout/Navigation';
import { Loader2, Save, X, FileText } from 'lucide-react';

export default function EditTemplate() {
    const { id } = useParams();
    const { token, user } = useAuth();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState<'academic' | 'job' | 'scholarship' | 'general'>('general');
    const [promptTemplate, setPromptTemplate] = useState('');

    useEffect(() => {
        if (!token || !id) return;
        
        (async () => {
            try {
                setLoading(true);
                setError('');
                
                const { data } = await api.get(`/templates/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                const template = data.template;
                
                setName(template.name);
                setDescription(template.description || '');
                setCategory(template.category);
                setPromptTemplate(template.promptTemplate);
            } catch (err: any) {
                console.error('Error fetching template:', err);
                setError(err?.response?.data?.error || 'Failed to load template');
            } finally {
                setLoading(false);
            }
        })();
    }, [token, id]);

    const handleSave = async () => {
        if (!name.trim() || !promptTemplate.trim()) {
            setError('Name and template content are required');
            return;
        }

        try {
            setSaving(true);
            setError('');

            await api.put(`/templates/${id}`, {
                name: name.trim(),
                description: description.trim(),
                category,
                promptTemplate: promptTemplate.trim()
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            navigate('/templates');
        } catch (err: any) {
            console.error('Error saving template:', err);
            setError(err?.response?.data?.error || 'Failed to save template');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-gray-50 min-h-screen">
                <Navigation user={user} />
                <div className="max-w-4xl mx-auto p-6 text-center">
                    <Loader2 className="animate-spin mx-auto" size={32} />
                    <p className="mt-2 text-gray-600">Loading template...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen">
            <Navigation user={user} />
            <div className="max-w-4xl mx-auto p-6">
                {/* Breadcrumb */}
                <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
                    <button onClick={() => navigate('/dashboard')} className="text-blue-600 hover:underline">
                        Dashboard
                    </button>
                    <span>›</span>
                    <button onClick={() => navigate('/templates')} className="text-blue-600 hover:underline">
                        Templates
                    </button>
                    <span>›</span>
                    <span className="text-gray-900">Edit Template</span>
                </div>

                <div className="flex items-center mb-6">
                    {/* <FileText className="mr-3 text-blue-600" size={32} /> */}
                    <h1 className="text-3xl font-bold text-gray-900">Edit Template</h1>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                        <p className="text-red-700">{error}</p>
                    </div>
                )}

                <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
                    {/* Template Name */}
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                            Template Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Category */}
                    <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                            Category <span className="text-red-500">*</span>
                        </label>
                        <select
                            id="category"
                            value={category}
                            onChange={(e) => setCategory(e.target.value as any)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="academic">Academic</option>
                            <option value="job">Job</option>
                            <option value="scholarship">Scholarship</option>
                            <option value="general">General</option>
                        </select>
                    </div>

                    {/* Description */}
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                        </label>
                        <textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={2}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Template Content */}
                    <div>
                        <label htmlFor="promptTemplate" className="block text-sm font-medium text-gray-700 mb-1">
                            Template Content <span className="text-red-500">*</span>
                        </label>
                        <div className="text-xs text-gray-500 mb-2">
                            Use placeholders like {'{applicantName}'}, {'{position}'}, {'{relationship}'}, {'{strengths}'}, etc.
                        </div>
                        <textarea
                            id="promptTemplate"
                            value={promptTemplate}
                            onChange={(e) => setPromptTemplate(e.target.value)}
                            rows={20}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-3">
                        <button
                            onClick={() => navigate('/templates')}
                            className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center"
                        >
                            <X size={16} className="mr-2" />
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 flex items-center"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="animate-spin mr-2" size={16} />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}