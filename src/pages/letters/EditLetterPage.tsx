import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

const EditLetterPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLetter = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/letters/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        console.log('Letter response:', res.data);
        setContent(res.data.letter_content || res.data.letter?.letter_content || '');
      } catch (err) {
        console.error('Error loading letter:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLetter();
  }, [id]);

  const handleSave = async () => {
    try {
      await axios.put(
        `http://localhost:5000/api/letters/${id}/edit`,
        { letter_content: content },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      alert('Letter updated successfully');
      navigate('/dashboard');
    } catch (err) {
      console.error('Error updating letter:', err);
      alert('Failed to update the letter');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">✍️ Edit Letter</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="space-y-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-[400px] p-4 border rounded"
          />
          <button
            onClick={handleSave}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Save Changes
          </button>
        </div>
      )}
    </div>
  );
};

export default EditLetterPage;
