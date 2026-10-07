import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
});

// Request interceptor to attach JWT Bearer token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('taskflow_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors cleanly
API.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // If token expired or unauthorized, clear storage if on protected path
    if (error.response?.status === 401 && !window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/join')) {
      // Don't forcefully redirect during previewing invitations
    }
    const message =
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred. Please try again.';

    return Promise.reject({
      message,
      status: error.response?.status,
      errors: error.response?.data?.errors || [],
      raw: error,
    });
  }
);

export default API;
