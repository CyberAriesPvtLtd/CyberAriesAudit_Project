import axios from 'axios';

// Base URL — reads from Vite env variable, falls back to localhost for dev
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
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

// ─── Evidence Review Endpoints ─────────────────────────────────────

// Approve/reject a piece of evidence. newStatus should match whatever
// values the backend's EvidenceItem.status is expected to hold
// (e.g. "Approved", "Rejected", "Pending Review").
export const updateEvidenceItemStatus = async (evidenceItemId, newStatus, auditorNotes) => {
  const { data } = await axiosClient.put(`/evidence-files/${evidenceItemId}`, {
    status: newStatus,
    ...(auditorNotes !== undefined ? { auditor_notes: auditorNotes } : {}),
  });
  return data;
};

// All evidence linked to a specific audit control, including which OTHER
// audit controls the same evidence item is also linked to - lets the
// auditor UI show "this evidence is shared with N other audits".
export const getEvidenceForAuditControl = async (auditControlId) => {
  const { data } = await axiosClient.get(`/evidence-files/audit-control/${auditControlId}`);
  return data;
};

// Default export for convenience
const api = {
  login,
  changePassword,
  updateEvidenceItemStatus,
  getEvidenceForAuditControl,
};

export default api;
