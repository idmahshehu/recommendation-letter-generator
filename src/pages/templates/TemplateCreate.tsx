import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from '../../services/api';
import { useAuth } from "../../context/AuthContext";

const TemplateCreate: React.FC = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [promptTemplate, setPromptTemplate] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post(
        "/templates",
        {
          name,
          description,
          category,
          promptTemplate,
        }
      );

      console.log("Template created:", res.data);
      navigate("/templates"); 
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || "Failed to create template");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-6">Create New Template</h1>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2"
            >
              <option value="academic">Academic</option>
              <option value="job">Job</option>
              <option value="scholarship">Scholarship</option>
              <option value="general">General</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Prompt Template</label>
            <textarea
              value={promptTemplate}
              onChange={(e) => setPromptTemplate(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border px-3 py-2 font-mono text-sm"
              rows={6}
              placeholder="Write your prompt here, e.g. 'Generate a letter of recommendation for {{studentName}} ...'"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-black px-4 py-2 text-white hover:bg-gray-800 transition"
          >
            {loading ? "Creating..." : "Create Template"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TemplateCreate;
