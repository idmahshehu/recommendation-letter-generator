import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface Letter {
  id: string;
  status: string;
  applicant: {
    name: string;
    program: string;
  };
  referee?: {
    name: string;
    institution: string;
  };
  template?: {
    name: string;
    description: string;
  };
  preferences?: {
    deadline?: string;
  };
  created_at: string;
  completed_at?: string | null;
  content?: string;
}

const DashboardPage: React.FC = () => {
  const [letters, setLetters] = useState<Letter[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<Letter[]>([]);
  const [drafts, setDrafts] = useState<Letter[]>([]);
  const [completed, setCompleted] = useState<Letter[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLetters = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/letters', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        setLetters(res.data.letters);
      } catch (err) {
        console.error('Failed to fetch letters:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLetters();
  }, []);

  useEffect(() => {
    const fetchLettersStatus = async () => {
      const headers = {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      };

      try {
        const [pendingRes, draftsRes, completedRes] = await Promise.all([
          axios.get('http://localhost:5000/api/letters/pending', headers),
          axios.get('http://localhost:5000/api/letters?status=draft,in_review', headers),
          axios.get('http://localhost:5000/api/letters?status=in_review', headers),
          axios.get('http://localhost:5000/api/letters?status=completed', headers),
        ]);

        setPending(pendingRes.data.pending_requests);
        setDrafts(draftsRes.data.letters);
        setCompleted(completedRes.data.letters);
        console.log(completedRes.data.letters);
      } catch (err) {
        console.error('Error loading letters:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLettersStatus();
  }, []);


  return (
    <div className="p-6">

      <h1 className="text-2xl font-bold mb-6">📄 Referee Dashboard</h1>

      {loading ? (
        <p>Loading letters...</p>
      ) : (
        <>
          {/* Pending Requests */}
          <Section title="🕐 Pending Requests">
            {pending.length === 0 ? (
              <EmptyState message="No pending requests." />
            ) : (
              pending.map((letter) => (
                <Card key={letter.id}>
                  <p className="font-semibold">{letter.applicant.name}</p>
                  <p className="text-sm text-gray-600">{letter.applicant.program}</p>
                  <p className="text-sm">Deadline: {letter.preferences?.deadline || '—'}</p>
                  <button
                    onClick={() => navigate(`/letters/${letter.id}/generate`)}
                    className="mt-2 bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                  >
                    Generate Draft
                  </button>
                </Card>
              ))
            )}
          </Section>

          {/* Drafts / In Review */}
          <Section title="✍️ Drafts / In Review">
            {drafts.length === 0 ? (
              <EmptyState message="No drafts in progress." />
            ) : (
              drafts.map((letter) => (
                <Card key={letter.id}>
                  <p className="font-semibold">{letter.applicant.name}</p>
                  <p className="text-sm text-gray-600">Status: {letter.status}</p>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => navigate(`/letters/${letter.id}/edit`)}
                      className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                    >
                      Edit
                    </button>
                    <button className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700">
                      Approve
                    </button>
                  </div>
                </Card>
              ))
            )}
          </Section>

          {/* Completed */}
          <Section title="✅ Completed Letters">
            {completed.length === 0 ? (
              <EmptyState message="No completed letters." />
            ) : (
              completed.map((letter) => (
                <Card key={letter.id}>
                  <p className="font-semibold">{letter.applicant.name}</p>
                  <p className="font-semibold">{letter.content}</p>
                  <p className="text-sm text-gray-600">
                    Completed on: {new Date(letter.completed_at!).toLocaleDateString()}
                  </p>
                  <button className="mt-2 bg-gray-700 text-white px-3 py-1 rounded hover:bg-gray-800">
                    View Letter
                  </button>
                </Card>
              ))
            )}
          </Section>
        </>
      )}

      {loading ? (
        <div className="text-gray-500">Loading...</div>
      ) : letters.length === 0 ? (
        <div className="text-gray-500">No letters found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left px-4 py-2">Applicant</th>
                <th className="text-left px-4 py-2">Program</th>
                <th className="text-left px-4 py-2">Status</th>
                <th className="text-left px-4 py-2">Template</th>
                <th className="text-left px-4 py-2">Created</th>
                <th className="text-left px-4 py-2">Completed</th>
              </tr>
            </thead>
            <tbody>
              {letters.map((letter) => (
                <tr key={letter.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2">{letter.applicant.name}</td>
                  <td className="px-4 py-2">{letter.applicant.program}</td>
                  <td className="px-4 py-2 capitalize">{letter.status}</td>
                  <td className="px-4 py-2">{letter.template?.name || '—'}</td>
                  <td className="px-4 py-2 text-sm text-gray-600">{new Date(letter.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-2 text-sm text-gray-600">
                    {letter.completed_at ? new Date(letter.completed_at).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;

// ✅ Helper Components (paste these below)

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-8">
    <h2 className="text-xl font-semibold mb-3">{title}</h2>
    <div className="space-y-3">{children}</div>
  </div>
);

const Card = ({ children }: { children: React.ReactNode }) => (
  <div className="p-4 border rounded shadow-sm bg-white">{children}</div>
);

const EmptyState = ({ message }: { message: string }) => (
  <p className="text-gray-500 italic">{message}</p>
);