import axios from 'axios';

export const API = import.meta.env.VITE_API_URL || '';
const api = axios.create({ baseURL: API });
api.interceptors.request.use(c => {
  const t = localStorage.getItem('token');
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});
// expired / invalid token -> back to login
api.interceptors.response.use(r => r, e => {
  if (e.response?.status === 401 && !e.config.url.includes('/api/auth/')) {
    localStorage.clear();
    if (location.pathname !== '/login') location.href = '/login';
  }
  return Promise.reject(e);
});
export default api;
export const asset = u => (u ? API + u : '');
