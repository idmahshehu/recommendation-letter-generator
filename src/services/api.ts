// import axios from 'axios';

// export const generateLetter = async (
//   letterId: string,
//   prompt: string,
//   token: string | null
// ) => {
//   return await axios.post(
//     'http://localhost:5000/api/letters/generate',
//     { letterId, prompt },
//     { headers: { Authorization: token ? `Bearer ${token}` : '' } }
//   );
// };

import axios from "axios";

export const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach token automatically before each request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);


api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or unauthorized → redirect to login
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

