import axios from 'axios';
import { supabase } from './supabase';

const getBaseURL = () => {
  let url = '';
  if (import.meta.env.VITE_API_URL) {
    url = import.meta.env.VITE_API_URL.trim();
  } else if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    url = 'https://apollo-ai-backend-production.up.railway.app';
  } else {
    url = 'http://localhost:3001';
  }

  // Prepend https:// if protocol is missing but it is a domain (contains dot)
  if (url && !/^https?:\/\//i.test(url)) {
    if (url.includes('.')) {
      url = `https://${url}`;
    }
  }
  return url;
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
