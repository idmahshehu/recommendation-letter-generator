import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import { Navigation } from "../../components/layout/Navigation";

/** Backend can return extra statuses; we'll normalize them for display. */
type RawStatus = "requested" | "in_progress" | "completed" | "rejected" | "draft" | "in_review";
type DisplayStatus = "requested" | "in_progress" | "completed" | "rejected";

interface Letter {
    id: string;
    status: RawStatus;
    applicant: { name: string; program: string };
    referee?: { name: string; institution?: string, email?: string };
    generation_parameters?: { deadline?: string; tone?: string; length?: string };
    created_at: string;
    completed_at?: string | null;
    content?: string;
    rejection_reason?: string | null;
    //   referee_email?: string;
}

/* -------------------- helpers -------------------- */
const parseDate = (dateString?: string | null): string => {
    if (!dateString) return "No date";
    try {
        const s = String(dateString).trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
            const d = new Date(s + "T00:00:00.000Z");
            return isNaN(d.getTime()) ? "Invalid date" : d.toLocaleDateString();
        }
        if (s.includes(" ")) {
            let iso = s.replace(" ", "T");
            if (/[+-]\d{2}$/.test(iso)) iso += ":00";
            const d = new Date(iso);
            return isNaN(d.getTime()) ? "Invalid date" : d.toLocaleDateString();
        }
        const d = new Date(s);
        return isNaN(d.getTime()) ? "Invalid date" : d.toLocaleDateString();
    } catch {
        return "Invalid date";
    }
};

const statusBadge = (status: DisplayStatus) => {
    switch (status) {
        case "completed": return "bg-green-100 text-green-800";
        case "in_progress": return "bg-blue-50 text-blue-700";
        case "rejected": return "bg-red-100 text-red-800";
        default: return "bg-gray-100 text-gray-800";
    }
};

const statusLabel = (s: DisplayStatus | "all") =>
    s === "requested" ? "Requested" :
        s === "in_progress" ? "Accepted" :
            s === "completed" ? "Completed" :
                s === "rejected" ? "Declined" : s;

/** Normalize backend statuses for display:
 * - map 'draft' and 'in_review' -> 'in_progress' so drafts are visible as Accepted
 */
const toDisplayStatus = (raw: RawStatus): DisplayStatus | null => {
    if (raw === "draft" || raw === "in_review") return "in_progress";
    if (raw === "requested" || raw === "in_progress" || raw === "completed" || raw === "rejected") return raw;
    return null;
};

/* -------------------- component -------------------- */
export default function ApplicantLetters() {
    const { token, user } = useAuth();
    const navigate = useNavigate();

    const [letters, setLetters] = useState<Letter[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedStatus, setSelectedStatus] = useState<"all" | DisplayStatus>("all");
    const [search, setSearch] = useState("");

    // Preview modal state (INSIDE component)
    const [preview, setPreview] = useState<(Letter & { displayStatus: DisplayStatus }) | null>(null);

    useEffect(() => {
        if (!token) return;
        (async () => {
            try {
                setLoading(true);
                setError("");
                // Use applicant-scoped endpoint if you have it (e.g., /me/letters). Using /letters here per your API.
                const { data } = await api.get("/letters");
                setLetters(data?.letters || []);
            } catch (e: any) {
                setError(e?.response?.data?.error || "Failed to fetch letters");
            } finally {
                setLoading(false);
            }
        })();
    }, [token]);

    /** Normalize once */
    const normalized = useMemo(() => {
        return letters
            .map(l => {
                const displayStatus = toDisplayStatus(l.status);
                return displayStatus ? ({ ...l, displayStatus }) : null;
            })
            .filter((x): x is (Letter & { displayStatus: DisplayStatus }) => x !== null);
    }, [letters]);

    /** Derived counts for tabs */
    const counts: Record<"all" | DisplayStatus, number> = useMemo(() => ({
        all: normalized.length,
        requested: normalized.filter(l => l.displayStatus === "requested").length,
        in_progress: normalized.filter(l => l.displayStatus === "in_progress").length,
        completed: normalized.filter(l => l.displayStatus === "completed").length,
        rejected: normalized.filter(l => l.displayStatus === "rejected").length,
    }), [normalized]);

    /** Apply filters/search */
    const filtered = useMemo(() => {
        let out = normalized;
        if (selectedStatus !== "all") out = out.filter(l => l.displayStatus === selectedStatus);
        if (search.trim()) {
            const q = search.toLowerCase();
            out = out.filter(l =>
                l.applicant.program.toLowerCase().includes(q) ||
                (l.referee?.name || "").toLowerCase().includes(q) ||
                l.applicant.name.toLowerCase().includes(q)
            );
        }
        return out;
    }, [normalized, selectedStatus, search]);

    /** Applicant action: withdraw only when 'requested' */
    const withdraw = async (id: string) => {
        if (!window.confirm("Withdraw this request?")) return;
        try {
            await api.delete(`/letters/${id}`); // adjust if you add an applicant-scoped route
            setLetters(prev => prev.filter(l => l.id !== id));
        } catch (e: any) {
            setError(e?.response?.data?.error || "Failed to withdraw");
        }
    };

    /** Single action renderer: open Preview for all statuses; Withdraw for requested */
    const actionCell = (l: Letter & { displayStatus: DisplayStatus }) => {
        if (l.displayStatus === "requested") {
            return (
                <div className="flex gap-2 justify-end">
                    <button
                        onClick={() => setPreview(l)}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                    >
                        View
                    </button>
                    <button
                        onClick={() => withdraw(l.id)}
                        className="bg-gray-800 text-white px-3 py-1 rounded text-sm hover:bg-gray-900"
                    >
                        Withdraw
                    </button>
                </div>
            );
        }
        return (
            <button
                onClick={() => setPreview(l)}
                className={`px-3 py-1 rounded text-sm text-white ${l.displayStatus === "completed" ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"
                    }`}
            >
                {l.displayStatus === "completed" ? "View Letter" : "View"}
            </button>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
                    <p className="mt-4 text-gray-600">Loading letters…</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="mt-2 text-sm text-red-700">{error}</p>
                <button onClick={() => window.location.reload()} className="mt-2 bg-red-600 text-white px-3 py-1 rounded text-sm">
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen">
            <Navigation user={user} />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">My Recommendation Letters</h1>
                    <p className="text-gray-600 mt-2">Track your requests, acceptance, and final letters.</p>
                </div>

                {/* Tabs / Filters */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex flex-wrap gap-2">
                            {(["all", "requested", "in_progress", "completed", "rejected"] as const).map(s => (
                                <button
                                    key={s}
                                    onClick={() => setSelectedStatus(s)}
                                    className={`px-3 py-2 rounded-md text-sm font-medium ${selectedStatus === s ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                        }`}
                                >
                                    {statusLabel(s)} ({counts[s]})
                                </button>
                            ))}
                        </div>

                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search by program, referee, or name…"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-lg shadow">
                    {filtered.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-gray-400 text-4xl mb-4">📋</div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No letters found</h3>
                            <p className="text-gray-500">Try another filter or create a new request.</p>
                        </div>
                    ) : (
                        <div className="overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Program</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Referee</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deadline</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filtered.map(l => (
                                        <tr key={l.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{l.applicant.program}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-700">{l.referee?.name || "—"}</div>
                                                {l.referee?.institution && <div className="text-xs text-gray-500">{l.referee.institution}</div>}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusBadge(l.displayStatus)}`}>
                                                    {statusLabel(l.displayStatus)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {l.generation_parameters?.deadline
                                                    ? new Date(l.generation_parameters.deadline).toLocaleDateString()
                                                    : "No deadline"}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {parseDate(l.created_at)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                {actionCell(l)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Preview Modal */}
                {preview && (
                    <div className="fixed inset-0 z-50 flex items-start justify-center">
                        <div className="absolute inset-0 bg-black/40" onClick={() => setPreview(null)} />
                        <div className="relative mt-10 w-full max-w-xl mx-4 rounded-xl border bg-white shadow">
                            <div className="p-4 border-b flex items-center justify-between">
                                <h4 className="font-semibold">Letter Details</h4>
                                <button onClick={() => setPreview(null)} className="px-3 py-1.5 rounded-lg bg-gray-800 text-white text-sm">
                                    Close
                                </button>
                            </div>

                            <div className="p-4 space-y-3 text-sm">
                                <div><span className="font-medium">Program:</span> {preview.applicant.program}</div>
                                <div><span className="font-medium">Referee:</span> {preview.referee?.name || "—"}</div>
                                <div><span className="font-medium">Referee Email:</span> {preview.referee?.email || "—"}</div>
                                {preview.referee?.institution && (
                                    <div><span className="font-medium">Institution:</span> {preview.referee.institution}</div>
                                )}
                                <div>
                                    <span className="font-medium">Status:</span>{" "}
                                    {preview.displayStatus === "in_progress" ? "Accepted" :
                                        preview.displayStatus === "rejected" ? "Declined" : "Completed"}
                                    {preview.displayStatus === "rejected" && preview.rejection_reason && (
                                        <div className="text-md text-red-600 mt-1">Reason: {preview.rejection_reason}</div>
                                    )}
                                </div>
                                <div>
                                    <span className="font-medium">Deadline:</span>{" "}
                                    {preview.generation_parameters?.deadline
                                        ? new Date(preview.generation_parameters.deadline).toLocaleDateString()
                                        : "No deadline"}
                                </div>
                                <div><span className="font-medium">Requested:</span> {parseDate(preview.created_at)}</div>
                                {preview.completed_at && (
                                    <div><span className="font-medium">Completed:</span> {parseDate(preview.completed_at)}</div>
                                )}
                            </div>

                            <div className="p-4 border-t flex justify-end gap-2">
                                {preview.displayStatus === "completed" && preview.content && (
                                    <a
                                        href={preview.content}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="px-4 py-2 rounded-lg font-medium bg-green-600 text-white text-sm"
                                    >
                                        Open Letter
                                    </a>
                                )}
                                <button onClick={() => setPreview(null)} className="px-4 py-2 rounded-lg border text-sm">
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}

