import axios from 'axios';

export const generateLetter = async (
  letterId: string,
  prompt: string,
  token: string | null
) => {
  return await axios.post(
    'http://localhost:5000/api/letters/generate',
    { letterId, prompt },
    { headers: { Authorization: token ? `Bearer ${token}` : '' } }
  );
};
