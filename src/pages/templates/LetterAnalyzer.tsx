import React, { useState } from 'react';
import { Upload, FileText, Loader2, CheckCircle, AlertCircle, Download } from 'lucide-react';
import { api } from '../../services/api';

// interface AnalysisResult {
//     introduction_pattern: string;
//     strengths_mentioned: string[];
//     example_types: string[];
//     conclusion_style: string;
//     tone: string;
//     key_phrases: string[];
// }
interface AnalysisResult {
    introduction_pattern: string;
    conclusion_style: string;
    tone: string;
    key_phrases: string[];
    structure: string[];
    letter_length: string;
    relationship_description: string;
}


interface LetterAnalyzerProps {
    token?: string;
}

const LetterAnalyzer: React.FC<LetterAnalyzerProps> = ({ token }) => {
    const [file, setFile] = useState<File | null>(null);
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [templateName, setTemplateName] = useState('');
    const [templateDescription, setTemplateDescription] = useState('');
    const [creatingTemplate, setCreatingTemplate] = useState(false);
    const [templateCreated, setTemplateCreated] = useState(false);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setError(null);
            setAnalysis(null);
            setTemplateCreated(false);
        }
    };

    const handleFileUpload = async () => {
        if (!file) return;

        const formData = new FormData();
        formData.append('letter', file);

        setLoading(true);
        setError(null);

        try {
            const { data } = await api.post(
                '/templates/analyze-letter',
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': undefined as any,
                    },
                    transformRequest: (d) => d,
                }
            );

            setAnalysis(data.analysis);
            setTemplateName(`Template from ${file.name.replace(/\.[^.]+$/, '')}`);
        } catch (err: any) {
            console.error('Upload failed:', err?.response?.data || err);
            setError(err?.response?.data?.error || 'Upload failed');
        } finally {
            setLoading(false);
        }
    };

    const createTemplate = async () => {
        if (!analysis || !templateName.trim()) return;

        setCreatingTemplate(true);
        setError(null);

        try {
            const response = await api.post(
                '/templates/create-from-analysis',
                {
                    analysis,
                    templateName: templateName.trim(),
                    templateDescription: templateDescription.trim(),
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            setTemplateCreated(true);
        } catch (err: any) {
            console.error('Template creation failed:', err?.response?.data || err);
            setError(err?.response?.data?.error || 'Template creation failed');
        } finally {
            setCreatingTemplate(false);
        }
    };


    const resetAnalyzer = () => {
        setFile(null);
        setAnalysis(null);
        setError(null);
        setTemplateName('');
        setTemplateDescription('');
        setTemplateCreated(false);
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Letter Style Analyzer</h1>
                <p className="text-gray-600">
                    Upload a recommendation letter you've written to create a personalized template that matches your writing style.
                </p>
            </div>

            {/* Upload Section */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                    <Upload className="mr-2" size={20} />
                    Upload Letter
                </h2>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                        type="file"
                        onChange={handleFileSelect}
                        accept=".txt,.pdf"
                        className="hidden"
                        id="letter-upload"
                    />
                    <label
                        htmlFor="letter-upload"
                        className="cursor-pointer flex flex-col items-center space-y-2"
                    >
                        <FileText size={48} className="text-gray-400" />
                        <span className="text-sm text-gray-600">
                            Click to select a letter file (.txt or .pdf)
                        </span>
                    </label>

                    {file && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-md">
                            <p className="text-sm font-medium text-blue-900">Selected: {file.name}</p>
                            <p className="text-xs text-blue-600">Size: {(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                    )}
                </div>

                <button
                    onClick={handleFileUpload}
                    disabled={!file || loading}
                    className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                >
                    {loading ? (
                        <>
                            <Loader2 className="animate-spin mr-2" size={16} />
                            Analyzing Letter...
                        </>
                    ) : (
                        'Analyze Letter Style'
                    )}
                </button>
            </div>

            {/* Error Display */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                    <div className="flex items-center">
                        <AlertCircle className="text-red-500 mr-2" size={20} />
                        <p className="text-red-700">{error}</p>
                    </div>
                </div>
            )}

            {/* Analysis Results */}
            {analysis && (
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4 flex items-center">
                        <CheckCircle className="text-green-500 mr-2" size={20} />
                        Analysis Results
                    </h2>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <h3 className="font-medium text-gray-900 mb-1">Writing Tone</h3>
                                <p className="text-gray-600 capitalize">{analysis.tone}</p>
                            </div>

                            <div>
                                <h3 className="font-medium text-gray-900 mb-1">Letter Length</h3>
                                <p className="text-gray-600 capitalize">{analysis.letter_length}</p>
                            </div>

                            <div>
                                <h3 className="font-medium text-gray-900 mb-1">Introduction Pattern</h3>
                                <p className="text-gray-600 text-sm">{analysis.introduction_pattern}</p>
                            </div>

                            <div>
                                <h3 className="font-medium text-gray-900 mb-1">Conclusion Style</h3>
                                <p className="text-gray-600 text-sm">{analysis.conclusion_style}</p>
                            </div>

                            <div>
                                <h3 className="font-medium text-gray-900 mb-1">Relationship</h3>
                                <p className="text-gray-600 text-sm">{analysis.relationship_description}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <h3 className="font-medium text-gray-900 mb-2">Strengths Mentioned</h3>
                                <div className="flex flex-wrap gap-2">
                                    {/* {analysis.strengths_mentioned.map((strength, index) => (
                                        <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-xs">
                                            {strength}
                                        </span>
                                    ))} */}
                                </div>
                            </div>

                            <div>
                                <h3 className="font-medium text-gray-900 mb-2">Example Types</h3>
                                <div className="flex flex-wrap gap-2">
                                    {/* {analysis.example_types.map((type, index) => (
                                        <span key={index} className="bg-green-100 text-green-800 px-2 py-1 rounded-md text-xs">
                                            {type}
                                        </span>
                                    ))} */}
                                </div>
                            </div>

                            {analysis.key_phrases.length > 0 && (
                                <div>
                                    <h3 className="font-medium text-gray-900 mb-2">Key Phrases</h3>
                                    <div className="space-y-1">
                                        {analysis.key_phrases.slice(0, 3).map((phrase, index) => (
                                            <p key={index} className="text-gray-600 text-xs italic">
                                                "{phrase}"
                                            </p>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Letter Structure */}
                    <div className="mt-6">
                        <h3 className="font-medium text-gray-900 mb-2">Letter Structure</h3>
                        <div className="bg-gray-50 rounded-md p-3">
                            <ol className="text-sm text-gray-600 space-y-1">
                                {analysis.structure.map((section, index) => (
                                    <li key={index} className="flex items-start">
                                        <span className="font-medium mr-2">{index + 1}.</span>
                                        <span>{section}</span>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    </div>
                </div>
            )}

            {/* Template Creation */}
            {analysis && !templateCreated && (
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4">Create Template</h2>

                    <div className="space-y-4">
                        <div>
                            <label htmlFor="template-name" className="block text-sm font-medium text-gray-700 mb-1">
                                Template Name
                            </label>
                            <input
                                type="text"
                                id="template-name"
                                value={templateName}
                                onChange={(e) => setTemplateName(e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter template name"
                            />
                        </div>

                        <div>
                            <label htmlFor="template-description" className="block text-sm font-medium text-gray-700 mb-1">
                                Description (Optional)
                            </label>
                            <textarea
                                id="template-description"
                                value={templateDescription}
                                onChange={(e) => setTemplateDescription(e.target.value)}
                                rows={3}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Describe when to use this template"
                            />
                        </div>

                        <button
                            onClick={createTemplate}
                            disabled={!templateName.trim() || creatingTemplate}
                            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {creatingTemplate ? (
                                <>
                                    <Loader2 className="animate-spin mr-2" size={16} />
                                    Creating Template...
                                </>
                            ) : (
                                'Create Template from This Style'
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Success Message */}
            {templateCreated && (
                <div className="bg-green-50 border border-green-200 rounded-md p-6">
                    <div className="flex items-center mb-3">
                        <CheckCircle className="text-green-500 mr-2" size={24} />
                        <h2 className="text-lg font-semibold text-green-900">Template Created Successfully!</h2>
                    </div>
                    <p className="text-green-700 mb-4">
                        Your personalized template "{templateName}" has been created and is now available for generating recommendation letters.
                    </p>
                    <div className="flex space-x-3">
                        <button
                            onClick={resetAnalyzer}
                            className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
                        >
                            Analyze Another Letter
                        </button>
                        <button
                            onClick={() => window.location.href = '/templates'}
                            className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700"
                        >
                            View My Templates
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LetterAnalyzer;