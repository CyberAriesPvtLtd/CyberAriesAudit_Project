import axios from 'axios';

// Base URL — reads from Vite env variable, falls back to localhost for dev
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Auth Token Interceptor ──────────────────────────────────────
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('cc_token');
  if (token) {
    if (config.headers.set) {
      config.headers.set('Authorization', `Bearer ${token}`);
    } else {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// ─── Authentication Endpoints ─────────────────────────────────────

export const login = async (username, password) => {
  const { data } = await axiosClient.post('/auth/login', {
    username,
    password,
  });
  return data;
};

export const changePassword = async (userId, current_password, new_password) => {
  const { data } = await axiosClient.put(`/auth/change-password/${userId}`, {
    current_password,
    new_password,
  });
  return data;
};

// ─── Audit Framework Endpoints ────────────────────────────────────

export const getAuditFrameworks = async () => {
  const { data } = await axiosClient.get('/audit-framework/');
  return data;
};

export const getAuditFrameworkById = async (id) => {
  const { data } = await axiosClient.get(`/audit-framework/${id}`);
  return data;
};

// ─── Audit Control Endpoints ──────────────────────────────────────

export const getAuditControlsByFramework = async (frameworkId) => {
  const { data } = await axiosClient.get(`/audit-control/framework/${frameworkId}`);
  return data;
};

// ─── Controls (Rulebook) Endpoints ────────────────────────────────

export const getControls = async () => {
  const { data } = await axiosClient.get('/controls/');
  return data;
};

// ─── Company Endpoints ──────────────────────────────────────────

export const getCompanyById = async (id) => {
  const { data } = await axiosClient.get(`/company/${id}`);
  return data;
};

// Default export for convenience
const api = {
  login,
  changePassword,
  getAuditFrameworks,
  getAuditFrameworkById,
  getAuditControlsByFramework,
  getControls,
  getCompanyById,
};

export default api;
