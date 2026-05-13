import axios from 'axios';
import { formatApiError } from './errors';

const API = process.env.REACT_APP_BACKEND_URL;

const api = axios.create({
  baseURL: `${API}/api`,
  withCredentials: true,
});

// Always attach Bearer token from localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('kuxtal_token');
  if (token && !config.headers['Authorization']) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Normalize FastAPI/Pydantic 422 errors: replace the `detail` array of objects
// with a plain string so legacy `toast.error(e.response?.data?.detail)` calls
// throughout the app can no longer trigger React error #31.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const data = error?.response?.data;
    if (data && (Array.isArray(data.detail) || (data.detail && typeof data.detail === 'object'))) {
      data.detail = formatApiError(error, 'Error en la solicitud');
    }
    return Promise.reject(error);
  }
);

export default api;
