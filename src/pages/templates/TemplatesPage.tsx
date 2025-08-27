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

    if (loading) return <div className="p-6 text-gray-600">Loading…</div>;

    return (
        <div className="bg-gray-50 min-h-screen">
            {/* Top nav */}
            <Navigation user={user} />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Templates</h1>
                    </div>
                    <button
                        onClick={() => navigate('/templates/new')}
                        className="px-4 py-2 rounded-xl bg-black text-white"
                    >
                        New Template
                    </button>
                </div>

                {/* Filters */}
                <div className="rounded-xl bg-white border p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex gap-2 flex-wrap">
                        {CATEGORIES.map(c => (
                            <button
                                key={c}
                                onClick={() => setCategory(c)}
                                className={`px-3 py-1.5 rounded-lg border text-sm ${category === c ? 'bg-black text-white border-black' : 'bg-white text-gray-700 hover:bg-gray-100'
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
                                <li key={t.id} className="rounded-xl border bg-white p-4 flex flex-col shadow-sm hover:shadow-md transition">
                                    {/* Header */}
                                    <div className="flex items-start justify-between">
                                        <h3 className="font-semibold text-lg">{t.name}</h3>
                                        {(t.isSystemTemplate ?? t.is_system_template) ? (
                                            <span className="px-2 py-0.5 rounded text-xs bg-gray-200 text-gray-700">
                                                System 🔒
                                            </span>
                                        ) : mine ? (
                                            <span className="px-2 py-0.5 rounded text-xs bg-emerald-100 text-emerald-800">
                                                Mine
                                            </span>
                                        ) : (
                                            <span className="px-2 py-0.5 rounded text-xs bg-indigo-100 text-indigo-800">
                                                Custom
                                            </span>
                                        )}
                                    </div>

                                    {/* Category */}
                                    <span
                                        className={`mt-2 inline-block px-2 py-0.5 rounded text-xs ${badgeColor(
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
                                    <div className="flex items-center gap-2 text-xs text-gray-600 mt-3">
                                        <span
                                            className={`px-2 py-0.5 rounded ${(t.isSystemTemplate ?? t.is_system_template)
                                                ? "bg-indigo-100 text-indigo-700"
                                                : "bg-emerald-100 text-emerald-700"
                                                }`}
                                        >
                                            {(t.isSystemTemplate ?? t.is_system_template) ? "System" : "Custom"}
                                        </span>
                                    </div>

                                    {/* Actions */}
                                    <div className="mt-4 flex gap-2">
                                        <button
                                            onClick={() => setPreview(t)}
                                            className="px-3 py-2 rounded-lg border text-sm hover:bg-gray-50 transition"
                                        >
                                            Preview
                                        </button>
                                        <button
                                            onClick={() => handleUse(t)}
                                            className="px-3 py-2 rounded-lg bg-black text-white text-sm hover:bg-gray-800 transition"
                                        >
                                            Use
                                        </button>
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
                            <button onClick={() => setPreview(null)} className="px-3 py-1.5 rounded-lg bg-black text-white text-sm">Close</button>
                        </div>
                        <div className="p-4 max-h-[70vh] overflow-auto">
                            <pre className="whitespace-pre-wrap text-sm font-mono leading-6">{preview.promptTemplate}</pre>
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
                            <button onClick={() => handleUse(preview)} className="px-4 py-2 rounded-lg bg-black text-white text-sm">
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


// import React, { useEffect, useMemo, useState } from 'react';
// import { useAuth } from '../../context/AuthContext';
// import { api } from '../../services/api';
// import { useNavigate, useLocation } from 'react-router-dom';

// type Template = {
//   id: string;
//   name: string;
//   description?: string | null;
//   category: 'academic' | 'job' | 'scholarship' | 'general';
//   promptTemplate: string;
//   defaultParameters?: Record<string, any> | null;
//   createdBy?: string | null;
//   isSystemTemplate: boolean;
//   isActive: boolean;
//   usageCount: number;
//   createdAt: string;
//   updatedAt: string;
//   creator?: { id: string; firstName: string; lastName: string; email: string } | null;
// };

// const categories = ['all', 'academic', 'job', 'scholarship', 'general'] as const;

// const TemplatesPage: React.FC = () => {
//   const { token, user } = useAuth();
//   const navigate = useNavigate();
//   const location = useLocation() as any;

//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string>('');
//   const [templates, setTemplates] = useState<Template[]>([]);
//   const [search, setSearch] = useState('');
//   const [category, setCategory] = useState<(typeof categories)[number]>('all');
//   const [includeMine, setIncludeMine] = useState(false);

//   const [preview, setPreview] = useState<Template | null>(null);

//   // optional: allow passing a return path or letterId from previous page
//   const selectedLetterId = location?.state?.letterId as string | undefined;

//   useEffect(() => {
//     const fetchData = async () => {
//       if (!token) return;
//       try {
//         setLoading(true);
//         setError('');

//         const params: any = {};
//         if (category !== 'all') params.category = category;
//         if (includeMine) params.includeUserTemplates = 'true';

//         const res = await api.get('/templates', { params });
//         const list: Template[] = res.data.templates || [];
//         // sort: usage desc, then recent first
//         list.sort((a, b) => (b.usageCount - a.usageCount) || (new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
//         setTemplates(list);
//       } catch (err: any) {
//         console.error('Error fetching templates:', err);
//         setError(err.response?.data?.error || 'Failed to fetch templates');
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchData();
//   }, [token, category, includeMine]);

//   const filtered = useMemo(() => {
//     if (!search.trim()) return templates;
//     const q = search.toLowerCase();
//     return templates.filter(t =>
//       t.name.toLowerCase().includes(q) ||
//       (t.description || '').toLowerCase().includes(q) ||
//       JSON.stringify(t.defaultParameters || {}).toLowerCase().includes(q)
//     );
//   }, [templates, search]);

//   function handleUseTemplate(t: Template) {
//     // Referee flow: go where they can pick a letter and generate a draft
//     // If you have a letterId in state, send them straight there with the template preselected.
//     if (user?.role === 'referee') {
//       if (selectedLetterId) {
//         navigate(`/letters/${selectedLetterId}?templateId=${t.id}`, { state: { template: t } });
//       } else {
//         navigate(`/letters?templateId=${t.id}`, { state: { template: t, hint: 'select-letter-then-generate' } });
//       }
//       return;
//     }
//     // Applicant flow: optionally pass template to new request (if you want applicant to suggest a template)
//     navigate(`/letters/new?templateId=${t.id}`, { state: { template: t } });
//   }

//   if (loading) return <div className="p-6 text-gray-600">Loading…</div>;

//   return (
//     <div className="bg-gray-50 min-h-screen">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
//         <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
//           <div>
//             <h1 className="text-2xl font-semibold text-gray-900">Templates</h1>
//             <p className="text-gray-600 text-sm">Browse, preview, and use a template to generate a letter draft.</p>
//           </div>
//           <div className="flex gap-3">
//             <button
//               onClick={() => navigate('/templates/new')}
//               className="px-4 py-2 rounded-2xl bg-black text-white shadow hover:opacity-90"
//             >
//               New Template
//             </button>
//           </div>
//         </header>

//         {/* Filters */}
//         <div className="rounded-2xl bg-white border p-4 flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
//           <div className="flex gap-2 flex-wrap">
//             {categories.map(c => (
//               <button
//                 key={c}
//                 onClick={() => setCategory(c)}
//                 className={`px-3 py-1.5 rounded-xl border text-sm ${category === c ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
//               >
//                 {c === 'all' ? 'All' : c.charAt(0).toUpperCase() + c.slice(1)}
//               </button>
//             ))}
//           </div>
//           <div className="flex items-center gap-3">
//             <label className="flex items-center gap-2 text-sm">
//               <input
//                 type="checkbox"
//                 className="rounded border-gray-300"
//                 checked={includeMine}
//                 onChange={(e) => setIncludeMine(e.target.checked)}
//               />
//               Include my templates
//             </label>
//             <div className="relative">
//               <input
//                 value={search}
//                 onChange={(e) => setSearch(e.target.value)}
//                 placeholder="Search templates…"
//                 className="w-64 rounded-xl border px-3 py-2 pl-9"
//               />
//               <span className="pointer-events-none absolute left-2 top-2.5 text-gray-400">🔎</span>
//             </div>
//           </div>
//         </div>

//         {error && (
//           <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
//             {error}
//           </div>
//         )}

//         {/* Grid */}
//         {filtered.length === 0 ? (
//           <div className="rounded-2xl border bg-white p-12 text-center text-gray-500">
//             No templates found. Try a different filter.
//           </div>
//         ) : (
//           <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
//             {filtered.map(t => (
//               <li key={t.id} className="rounded-2xl border bg-white p-5 flex flex-col justify-between">
//                 <div className="space-y-2">
//                   <div className="flex items-start justify-between gap-3">
//                     <h3 className="font-semibold text-gray-900">{t.name}</h3>
//                     <span className={`px-2 py-0.5 rounded-lg text-xs ${badgeColor(t.category)}`}>
//                       {t.category}
//                     </span>
//                   </div>
//                   {t.description && (
//                     <p className="text-sm text-gray-600 line-clamp-3">{t.description}</p>
//                   )}
//                   <div className="flex flex-wrap items-center gap-2 text-xs mt-2">
//                     <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700">Uses: {t.usageCount}</span>
//                     <span className={`px-2 py-0.5 rounded ${t.isSystemTemplate ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
//                       {t.isSystemTemplate ? 'System' : 'Custom'}
//                     </span>
//                     {t.creator && !t.isSystemTemplate && (
//                       <span className="text-gray-500">by {t.creator.firstName} {t.creator.lastName}</span>
//                     )}
//                   </div>
//                 </div>

//                 <div className="mt-4 flex items-center gap-2">
//                   <button
//                     onClick={() => setPreview(t)}
//                     className="px-3 py-2 rounded-xl border hover:bg-gray-50 text-sm"
//                   >
//                     Preview
//                   </button>
//                   <button
//                     onClick={() => handleUseTemplate(t)}
//                     className="px-3 py-2 rounded-xl bg-black text-white text-sm"
//                   >
//                     Use template
//                   </button>
//                   {!t.isSystemTemplate && t.creator?.id === user?.id && (
//                     <button
//                       onClick={() => navigate(`/templates/${t.id}/edit`)}
//                       className="px-3 py-2 rounded-xl border text-sm hover:bg-gray-50"
//                     >
//                       Edit
//                     </button>
//                   )}
//                 </div>
//               </li>
//             ))}
//           </ul>
//         )}
//       </div>

//       {/* Preview Modal */}
//       {preview && (
//         <div className="fixed inset-0 z-50">
//           <div className="absolute inset-0 bg-black/40" onClick={() => setPreview(null)} />
//           <div className="absolute inset-x-0 top-10 mx-auto max-w-3xl">
//             <div className="rounded-2xl border bg-white shadow-xl overflow-hidden">
//               <div className="p-4 border-b flex items-center justify-between">
//                 <div className="flex items-center gap-2">
//                   <h4 className="font-semibold">{preview.name}</h4>
//                   <span className={`px-2 py-0.5 rounded-lg text-xs ${badgeColor(preview.category)}`}>
//                     {preview.category}
//                   </span>
//                 </div>
//                 <div className="flex items-center gap-2">
//                   <button
//                     onClick={() => copyToClipboard(preview.promptTemplate)}
//                     className="px-3 py-1.5 rounded-xl border text-sm hover:bg-gray-50"
//                   >
//                     Copy
//                   </button>
//                   <button
//                     onClick={() => setPreview(null)}
//                     className="px-3 py-1.5 rounded-xl bg-black text-white text-sm"
//                   >
//                     Close
//                   </button>
//                 </div>
//               </div>
//               <div className="p-4 max-h-[70vh] overflow-auto">
//                 <pre className="whitespace-pre-wrap text-sm font-mono leading-6">
//                   {highlightPlaceholders(preview.promptTemplate)}
//                 </pre>
//                 {preview.defaultParameters && (
//                   <div className="mt-4">
//                     <h5 className="font-medium text-sm text-gray-800">Default Parameters</h5>
//                     <div className="mt-2 rounded-xl border bg-gray-50 p-3 text-xs text-gray-700">
//                       <code>{JSON.stringify(preview.defaultParameters, null, 2)}</code>
//                     </div>
//                   </div>
//                 )}
//               </div>
//               <div className="p-4 border-t flex items-center justify-end gap-2">
//                 <button
//                   onClick={() => handleUseTemplate(preview)}
//                   className="px-4 py-2 rounded-xl bg-black text-white text-sm"
//                 >
//                   Use this template
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// // ---------- helpers ----------
// function badgeColor(cat: Template['category']) {
//   switch (cat) {
//     case 'academic': return 'bg-blue-100 text-blue-700';
//     case 'job': return 'bg-amber-100 text-amber-800';
//     case 'scholarship': return 'bg-purple-100 text-purple-800';
//     default: return 'bg-gray-100 text-gray-700';
//   }
// }

// function copyToClipboard(text: string) {
//   navigator.clipboard?.writeText(text).catch(() => {});
// }

// function highlightPlaceholders(text: string) {
//   // Wrap {placeholders} in a subtle highlight
//   const parts = text.split(/(\{[^}]+\})/g);
//   return parts.map((p, i) =>
//     p.match(/^\{[^}]+\}$/) ? (
//       <mark key={i} className="bg-yellow-100 text-yellow-900 rounded px-1">{p}</mark>
//     ) : (
//       <span key={i}>{p}</span>
//     )
//   );
// }

// export default TemplatesPage;
