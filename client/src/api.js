import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });

// Attach the JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Turn server errors into a readable message
export const getErrorMessage = (err) =>
  err.response?.data?.message || 'Something went wrong. Please try again.';

export default api;
