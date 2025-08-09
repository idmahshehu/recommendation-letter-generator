import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const GenerateLetter = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [letter, setLetter] = useState<any>(null);
    const [templates, setTemplates] = useState<any[]>([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

    const [context, setContext] = useState({
        relationship: '',
        duration: '',
        strengths: '',
        specific_examples: '',
        additional_context: ''
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');

                const [letterRes, templateRes] = await Promise.all([
                    axios.get(`http://localhost:5000/api/letters/${id}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                    axios.get(`http://localhost:5000/api/templates`, {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                ]);

                setLetter(letterRes.data);
                setTemplates(templateRes.data.templates || []);
                console.log('Templates:', templateRes.data.templates);
                setSelectedTemplateId(letterRes.data.template?.id || '');
            } catch (err) {
                console.error('Failed to fetch data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setContext({ ...context, [e.target.name]: e.target.value });
    };

    const handleSubmit = async () => {
        try {
            await axios.post(`http://localhost:5000/api/letters/${id}/generate-draft`, {
                template_id: selectedTemplateId,
                extra_context: context
            }, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });

            alert('✅ Draft generated successfully!');
            navigate('/dashboard');
        } catch (err) {
            console.error('Error generating draft:', err);
            alert('❌ Failed to generate draft');
        }
    };

    console.log(context);

    if (loading) return <div className="p-6">Loading...</div>;

    return (
        <div className="p-6 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-4"> Generate Draft for {letter?.applicant_data?.firstName} {letter?.applicant_data?.lastName}</h1>

            {/* Select Template */}
            <label className="block font-semibold mt-4">Template</label>
            <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="w-full border p-2 rounded"
            >
                <option value="">Select a template</option>
                {templates.map((tpl) => (
                    <option key={tpl.id} value={tpl.id}>
                        {tpl.name}
                    </option>
                ))}
            </select>

            {/* Form Inputs */}
            <label className="block font-semibold mt-4">Relationship</label>
            <input
                name="relationship"
                value={context.relationship}
                onChange={handleChange}
                className="w-full border p-2 rounded"
                placeholder="e.g. student in my AI course"
            />

            <label className="block font-semibold mt-4">Duration</label>
            <input
                name="duration"
                value={context.duration}
                onChange={handleChange}
                className="w-full border p-2 rounded"
                placeholder="e.g. 2 years"
            />

            <label className="block font-semibold mt-4">Strengths</label>
            <textarea
                name="strengths"
                value={context.strengths}
                onChange={handleChange}
                className="w-full border p-2 rounded"
                placeholder="e.g. critical thinking, leadership"
            />

            <label className="block font-semibold mt-4">Specific Examples</label>
            <textarea
                name="specific_examples"
                value={context.specific_examples}
                onChange={handleChange}
                className="w-full border p-2 rounded"
                placeholder="e.g. Led a group project with 95% accuracy"
            />

            <label className="block font-semibold mt-4">Additional Context</label>
            <textarea
                name="additional_context"
                value={context.additional_context}
                onChange={handleChange}
                className="w-full border p-2 rounded"
                placeholder="Any other comments you want AI to consider"
            />

            <button
                type="button"
                onClick={handleSubmit}
                disabled={!selectedTemplateId}
                className="mt-6 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
                🚀 Generate Draft
            </button>
        </div>
    );
};

export default GenerateLetter;
