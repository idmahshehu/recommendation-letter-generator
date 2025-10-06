import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { Navigation } from '../../components/layout/Navigation';

type Template = {
    id: string;
    name: string;
    description?: string | null;
    category: 'academic' | 'job' | 'scholarship' | 'general';
    promptTemplate: string;
    defaultParameters?: Record<string, any> | null;
    isSystemTemplate: boolean;
    usageCount: number;
    createdAt: string;
    createdBy?: string | null;
    created_by?: string | null;
    is_system_template?: boolean;
};

const CATEGORIES = ['all', 'academic', 'job', 'scholarship', 'general'] as const;

export default function TemplatesPage() {
    const { token, user } = useAuth();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [templates, setTemplates] = useState<Template[]>([]);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('all');
    const [includeMine, setIncludeMine] = useState(true);
    const [preview, setPreview] = useState<Template | null>(null);

    useEffect(() => {
        if (!token) return;
        (async () => {
            try {
                setLoading(true);
                setError('');

                // Build query from UI state
                const params = {
                    ...(category !== 'all' && { category }),
                    ...(includeMine && { includeUserTemplates: 'true' }),
                };

                // Fetch raw templates
                const { data } = await api.get('/templates', { params });
                let raw: Template[] = data?.templates ?? [];


                const byId = new Map(raw.map(t => [t.id, t]));
                const unique = [...byId.values()];

                unique.sort((a, b) =>
                    mineFirst(a, b, user?.id) ||                           // 1) mine on top
                    (b.usageCount - a.usageCount) ||                       // 2) most used
                    (Date.parse(b.createdAt) - Date.parse(a.createdAt))    // 3) newest
                );

                setTemplates(unique);
            } catch (e: any) {
                console.error("API Error:", e);
                setError(e?.response?.data?.error || 'Failed to fetch templates');
            } finally {
                setLoading(false);
            }
        })();
    }, [token, category, includeMine, user?.id]);

    const isMine = (template: Template, userId?: string): boolean => {
        if (!userId) {
            console.log("No user ID provided");
            return false;
        }

        const creatorId = template.createdBy || template.created_by;
        const isSystem = template.isSystemTemplate ?? template.is_system_template;

        // System templates are not "mine"
        if (creatorId === null || creatorId === undefined || isSystem) {
            return false;
        }

        // current user created this template
        const result = String(creatorId) === String(userId);
        // console.log("mine:", result);
        return result;
    };

    const mineFirst = (a: Template, b: Template, userId?: string) =>
        Number(isMine(b, userId)) - Number(isMine(a, userId));

    const filtered = useMemo(() => {
        if (!search.trim()) return templates;
        const q = search.toLowerCase();
        return templates.filter(t =>
            t.name.toLowerCase().includes(q) ||
            (t.description || '').toLowerCase().includes(q)
        );
    }, [templates, search]);

    function handleUse(t: Template) {
        if (user?.role === 'referee') {
            navigate(`/letters?templateId=${t.id}`);
        } else {
            navigate(`/letters/new?templateId=${t.id}`, { state: { template: t } });
        }
    }

    async function handleDelete(templateId: string) {
        if (!window.confirm("Are you sure you want to delete this template? This cannot be undone.")) return;

        try {
            await api.delete(`/templates/${templateId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            // remove from the UI
            setTemplates(prev => prev.filter(t => t.id !== templateId));

            alert("Template deleted successfully");
        } catch (err: any) {
            console.error("Delete error:", err);
            alert(err?.response?.data?.error || "Failed to delete template");
        }
    }


    if (loading) return <div className="p-6 text-gray-600">Loading…</div>;

    function friendlyPreview(text: string) {
        return text.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key) => {
            const label = key
                .replace(/([A-Z])/g, ' $1')
                .replace(/_/g, ' ')
                .trim();
            return `[${label.charAt(0).toUpperCase() + label.slice(1)}]`;
        });
    }


    return (
        <div className="bg-gray-50 min-h-screen">
            {/* Top nav */}
            <Navigation user={user} />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="mb-3">
                        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
                            <button onClick={() => navigate('/dashboard')} className="text-blue-600 hover:underline">
                                Dashboard
                            </button>
                            <span>›</span>
                            <button onClick={() => navigate('/templates')} className="text-blue-600 hover:underline">
                                Templates
                            </button>
                        </div>

                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Template</h1>
                    </div>

                    {/* <button
                        onClick={() => navigate('/templates/new')}
                        className="px-4 py-2 rounded-xl font-medium bg-blue-600 text-white"
                    >
                        New Template
                    </button> */}

                    <button
                        onClick={() => navigate('/templates/generate-template')}
                        className="px-4 py-2 rounded-xl font-medium bg-blue-600 text-white"
                    >
                        Generate Personalized Template
                    </button>
                </div>

                {/* Filters */}
                <div className="rounded-xl bg-white border p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex gap-2 flex-wrap">
                        {CATEGORIES.map(c => (
                            <button
                                key={c}
                                onClick={() => setCategory(c)}
                                className={`px-3 py-1.5 rounded-lg border text-sm ${category === c ? 'font-medium bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 hover:bg-gray-100'
                                    }`}
                            >
                                {c === 'all' ? 'All' : c[0].toUpperCase() + c.slice(1)}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                className="rounded border-gray-300"
                                checked={includeMine}
                                onChange={e => setIncludeMine(e.target.checked)}
                            />
                            Include my templates
                        </label>
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search…"
                            className="w-64 rounded-lg border px-3 py-2"
                        />
                    </div>
                </div>

                {error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
                )}


                {/* Grid */}
                {filtered.length === 0 ? (
                    <div className="rounded-xl border bg-white p-10 text-center text-gray-500">No templates found.</div>
                ) : (
                    <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {filtered.map((t) => {
                            const mine = isMine(t, user?.id);

                            return (
                                <li key={t.id} className="rounded-xl border bg-white p-4 flex flex-col justify-between shadow-sm hover:shadow-md transition">
                                    {/* Header */}
                                    <div className="flex items-start justify-between">
                                        <h3 className="font-semibold text-lg">{t.name}</h3>
                                        {(t.isSystemTemplate ?? t.is_system_template) ? (
                                            <span className="px-2 py-0.5 rounded text-xs bg-gray-200 text-gray-700">
                                                Default
                                            </span>
                                        ) : mine ? (
                                            <span className="px-2 py-0.5 rounded text-xs bg-emerald-100 text-emerald-800">
                                                Custom
                                            </span>
                                        ) : (
                                            <span className="px-2 py-0.5 rounded text-xs bg-indigo-100 text-indigo-800">
                                                Custom
                                            </span>
                                        )}
                                    </div>

                                    {/* Category */}
                                    <span
                                        className={`mt-2 inline-block px-2 py-0.5 rounded text-xs w-fit ${badgeColor(
                                            t.category
                                        )}`}
                                    >
                                        {t.category}
                                    </span>

                                    {/* Description */}
                                    {t.description && (
                                        <p className="text-sm text-gray-600 mt-2">{t.description}</p>
                                    )}

                                    {/* Tags (System / Custom) */}
                                    {/* <div className="flex items-center gap-2 text-xs text-gray-600 mt-3">
                                        <span
                                            className={`px-2 py-0.5 rounded ${(t.isSystemTemplate ?? t.is_system_template)
                                                ? "bg-indigo-100 text-indigo-700"
                                                : "bg-emerald-100 text-emerald-700"
                                                }`}
                                        >
                                            {(t.isSystemTemplate ?? t.is_system_template) ? "System" : "Custom"}
                                        </span>
                                    </div> */}

                                    {/* Actions */}
                                    <div className="mt-4 flex justify-between gap-2 items-center">
                                        <button
                                            onClick={() => setPreview(t)}
                                            className="px-3 py-2 rounded-lg border text-sm hover:bg-gray-50 transition"
                                        >
                                            Preview
                                        </button>
                                        <div className="flex space-x-2">
                                            {/* Only show edit/delete for user's own templates */}
                                            {!t.isSystemTemplate && (
                                                <>
                                                    <button className="px-3 py-2 rounded-lg border text-sm text-blue-600 hover:text-blue-700">
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(t.id)}
                                                        className="px-3 py-2 rounded-lg border text-sm text-red-600 hover:text-red-700"
                                                    >
                                                        Delete
                                                    </button>

                                                </>
                                            )}
                                        </div>
                                        {/* <button
                                            onClick={() => handleUse(t)}
                                            className="px-3 py-2 rounded-lg font-medium bg-blue-600 text-white text-white text-sm hover:bg-gray-800 transition"
                                        >
                                            Use
                                        </button> */}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>

            {/* Preview Modal */}
            {preview && (
                <div className="fixed inset-0 z-50 flex items-start justify-center">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setPreview(null)} />
                    <div className="relative mt-10 max-w-3xl w-full mx-4 rounded-xl border bg-white shadow">
                        <div className="p-4 border-b flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <h4 className="font-semibold">{preview.name}</h4>
                                <span className={`px-2 py-0.5 rounded text-xs ${badgeColor(preview.category)}`}>{preview.category}</span>
                            </div>
                            <button onClick={() => setPreview(null)} className="px-3 py-1.5 rounded-lg bg-blue-500 text-white text-sm">Close</button>
                        </div>
                        <div className="p-4 max-h-[70vh] overflow-auto">
                            <pre className="whitespace-pre-wrap text-sm font-mono leading-6">{friendlyPreview(preview.promptTemplate)}</pre>
                            {preview.defaultParameters && (
                                <div className="mt-4">
                                    <div className="text-sm font-medium">Default Parameters</div>
                                    <pre className="mt-1 text-xs bg-gray-50 rounded-lg border p-3">
                                        {JSON.stringify(preview.defaultParameters, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t flex justify-end">
                            <button onClick={() => handleUse(preview)} className="px-4 py-2 rounded-lg font-medium bg-blue-600 text-white text-white text-sm">
                                Use this template
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ---- helpers ---- */
function badgeColor(cat: Template['category']) {
    switch (cat) {
        case 'academic': return 'bg-blue-100 text-blue-700';
        case 'job': return 'bg-amber-100 text-amber-800';
        case 'scholarship': return 'bg-purple-100 text-purple-800';
        default: return 'bg-gray-100 text-gray-700';
    }
}
