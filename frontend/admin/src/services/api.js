import axios from 'axios';

// Base URL — reads from Vite env variable, falls back to localhost for dev
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('cyberaries_token');
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


// ─── Health Check ───────────────────────────────────────────────

export const testDbConnection = async () => {
  const { data } = await axiosClient.get('/test-db');
  return data;
};

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

// ─── Company Endpoints ──────────────────────────────────────────

export const getCompanies = async () => {
  const { data } = await axiosClient.get('/company/');
  return data;
};

export const getCompanyById = async (id) => {
  const { data } = await axiosClient.get(`/company/${id}`);
  return data;
};

export const createCompany = async ({ company_name, registration_no }) => {
  const { data } = await axiosClient.post('/company/', {
    company_name,
    registration_no,
  });
  return data;
};

export const updateCompany = async (id, { company_name, registration_no }) => {
  const { data } = await axiosClient.put(`/company/${id}`, {
    company_name,
    registration_no,
  });
  return data;
};

export const deleteCompany = async (id) => {
  const { data } = await axiosClient.delete(`/company/${id}`);
  return data;
};

// ─── User Endpoints (Clients & Auditors) ────────────────────────

export const getUsers = async () => {
  const { data } = await axiosClient.get('/user/');
  return data;
};

export const getUserById = async (id) => {
  const { data } = await axiosClient.get(`/user/${id}`);
  return data;
};

export const createUser = async ({ name, email, username, password, role, company_id }) => {
  const { data } = await axiosClient.post('/user/', {
    name,
    email,
    username,
    password,
    role,
    company_id: company_id || null,
  });
  return data;
};

export const updateUser = async (id, updates) => {
  const { data } = await axiosClient.put(`/user/${id}`, updates);
  return data;
};

export const reassignUserCompany = async (userId, companyId) => {
  const { data } = await axiosClient.put(`/user/${userId}/reassign-company`, {
    company_id: companyId,
  });
  return data;
};

export const deleteUser = async (id) => {
  const { data } = await axiosClient.delete(`/user/${id}`);
  return data;
};

// ─── Controls Endpoints ───────────────────────────────────────────

export const getControls = async () => {
  const { data } = await axiosClient.get('/controls/');
  return data;
};

export const createControl = async (controlData) => {
  const { data } = await axiosClient.post('/controls/', controlData);
  return data;
};

export const uploadControlsExcel = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await axiosClient.post('/controls/upload-excel', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
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

export const createAuditFramework = async (frameworkData) => {
  const { data } = await axiosClient.post('/audit-framework/', frameworkData);
  return data;
};

export const updateAuditFramework = async (id, updates) => {
  const { data } = await axiosClient.put(`/audit-framework/${id}`, updates);
  return data;
};

export const deleteAuditFramework = async (id) => {
  const { data } = await axiosClient.delete(`/audit-framework/${id}`);
  return data;
};

// ─── Audit Control Endpoints ──────────────────────────────────────

export const getAuditControlsByFramework = async (frameworkId) => {
  const { data } = await axiosClient.get(`/audit-control/framework/${frameworkId}`);
  return data;
};

export const updateAuditControl = async (id, updates) => {
  const { data } = await axiosClient.put(`/audit-control/${id}`, updates);
  return data;
};

// Default export for convenience
const api = {
  testDbConnection,
  getCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
  getUsers,
  getUserById,
  createUser,
  updateUser,
  reassignUserCompany,
  deleteUser,
  login,
  changePassword,
  getControls,
  createControl,
  uploadControlsExcel,
  getAuditFrameworks,
  getAuditFrameworkById,
  createAuditFramework,
  updateAuditFramework,
  deleteAuditFramework,
  getAuditControlsByFramework,
  updateAuditControl,
};

export default api;
