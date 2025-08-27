import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";

const LetterRequest: React.FC = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [refereeId, setRefereeId] = useState("");
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [program, setProgram] = useState("");
  const [goal, setGoal] = useState("");
  const [achievementsText, setAchievementsText] = useState(""); // one per line
  const [deadline, setDeadline] = useState<string>("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>("");

  const validate = () => {
    if (!refereeId.trim()) return "Referee ID is required.";
    if (!firstName.trim()) return "First name is required.";
    if (!lastName.trim()) return "Last name is required.";
    if (!email.trim()) return "Email is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Enter a valid email.";
    if (!program.trim()) return "Program is required.";
    if (!goal.trim()) return "Goal is required.";
    if (!deadline) return "Deadline is required.";
    if (isNaN(Date.parse(deadline))) return "Deadline must be a valid date.";
    if (new Date(deadline) <= new Date(new Date().toDateString())) {
      return "Deadline must be in the future.";
    }
    // at least one non-empty achievement line
    const ach = achievementsText.split("\n").map(s => s.trim()).filter(Boolean);
    if (ach.length === 0) return "Please add at least one achievement (one per line).";
    return "";
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    const achievements = achievementsText
      .split("\n")
      .map(s => s.trim())
      .filter(Boolean);

    const payload = {
      referee_id: refereeId,
      applicant_data: {
        firstName,
        lastName,
        email,
        program,
        goal,
        achievements,
      },
      // Keep ethics clean: only the deadline; tone/length decided by referee/system
      preferences: {
        deadline,
      },
    };

    setSubmitting(true);
    try {
      await api.post("/letters/request", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      navigate("/letters"); // or to details page if you prefer
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to submit request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-semibold mb-6">Request a Recommendation Letter</h1>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-6 rounded-xl border bg-white p-6 shadow-sm">
          {/* Referee */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Referee ID (UUID) *</label>
            <input
              type="text"
              value={refereeId}
              onChange={(e) => setRefereeId(e.target.value)}
              placeholder="266d8b9d-e939-440b-85b9-be40f0315b13"
              className="mt-1 w-full rounded-lg border px-3 py-2"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Later you can replace this with a searchable dropdown of referees.
            </p>
          </div>

          {/* Applicant */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">First name *</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Last name *</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2"
              required
            />
          </div>

          {/* Academic */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Program *</label>
              <input
                type="text"
                value={program}
                onChange={(e) => setProgram(e.target.value)}
                placeholder="MSc in Computer Science"
                className="mt-1 w-full rounded-lg border px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Goal *</label>
              <input
                type="text"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="Apply to graduate school"
                className="mt-1 w-full rounded-lg border px-3 py-2"
                required
              />
            </div>
          </div>

          {/* Achievements (simple textarea, one per line) */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Achievements *</label>
            <textarea
              value={achievementsText}
              onChange={(e) => setAchievementsText(e.target.value)}
              rows={5}
              placeholder={`One per line, e.g.
• Top 10% of class
• Led research project on AI
• Teaching assistant in Algorithms`}
              className="mt-1 w-full rounded-lg border px-3 py-2 font-sans"
            />
            <p className="mt-1 text-xs text-gray-500">Add each achievement on a new line.</p>
          </div>

          {/* Deadline only (ethics: tone/length set by referee/system) */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Deadline *</label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="mt-1 w-full rounded-lg border px-3 py-2"
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-black px-4 py-2 text-white hover:bg-gray-800 transition disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Send Request"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LetterRequest;
