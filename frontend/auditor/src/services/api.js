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
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
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

// ─── Master Controls Endpoints ──────────────────────────────────────

export const getControls = async () => {
  const { data } = await axiosClient.get('/controls');
  return data;
};

// ─── Auditor Dashboard / Assigned Audits ────────────────────────────

export const getAuditFrameworks = async () => {
  const { data } = await axiosClient.get('/audit-framework/');
  return data;
};

export const getCompanies = async () => {
  const { data } = await axiosClient.get('/company/');
  return data;
};

export const getAuditControls = async () => {
  const { data } = await axiosClient.get('/audit-control/');
  return data;
};

// ─── Evidence Review ────────────────────────────────────────────────

export const getEvidenceByCompany = async (companyId) => {
  const { data } = await axiosClient.get(`/evidence-files/company/${companyId}`);
  return data;
};

export const getEvidenceForAuditControl = async (auditControlId) => {
  const { data } = await axiosClient.get(`/evidence-files/audit-control/${auditControlId}`);
  return data;
};

export const getEvidenceBatch = async (auditControlIds) => {
  const ids = auditControlIds.join(',');
  const { data } = await axiosClient.get(`/evidence-files/batch?audit_control_ids=${ids}`);
  return data;
};

/*
 * Reuses the same evidence preview/download endpoint already used by the
 * Client frontend: GET /evidence-files/presign-download/{evidence_item_id}
 */
export const getEvidenceDownloadUrl = async (evidenceItemId) => {
  const { data } = await axiosClient.get(`/evidence-files/presign-download/${evidenceItemId}`);
  return data;
};

/*
 * Auditor Notes — updates evidence_files.auditor_notes via the existing
 * PUT /evidence-files/{evidence_item_id}/auditor-notes endpoint.
 */
export const updateEvidenceNotes = async (evidenceItemId, auditor_notes) => {
  const { data } = await axiosClient.put(
    `/evidence-files/${evidenceItemId}/auditor-notes`,
    { auditor_notes }
  );
  return data;
};

/*
 * Evidence Status — updates evidence_files.status via the existing
 * PUT /evidence-files/{evidence_item_id} endpoint.
 */
export const updateEvidenceStatus = async (evidenceItemId, status, userId) => {
  const { data } = await axiosClient.put(
    `/evidence-files/${evidenceItemId}`,
    { status, reviewed_by: userId }
  );
  return data;
};

// Default export for convenience
const api = {
  login,
  changePassword,
  getControls,
  getAuditFrameworks,
  getCompanies,
  getAuditControls,
  getEvidenceByCompany,
  getEvidenceForAuditControl,
  getEvidenceBatch,
  getEvidenceDownloadUrl,
  updateEvidenceNotes,
  updateEvidenceStatus,
};

export default api;