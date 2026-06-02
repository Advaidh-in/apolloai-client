import axios from 'axios';
import { supabase } from './supabase';

const getBaseURL = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // Auto-detect production environment and fallback to the Railway backend
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return 'https://apollo-ai-backend-production.up.railway.app';
  }
  return 'http://localhost:3001';
};

const api = axios.create({
  baseURL: getBaseURL(),
});

// Add a request interceptor to inject the Supabase user's JWT token
api.interceptors.request.use(
  async (config) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
      }
    } catch (err) {
      console.error("Error setting Authorization header in API interceptor:", err);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
