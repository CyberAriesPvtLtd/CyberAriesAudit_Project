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

// ─── Evidence Endpoints ────────────────────────────────────────────

// Step 1 of upload: ask the backend for a presigned MinIO upload URL.
export const getPresignedUploadUrl = async (companyId, fileName, mimeType) => {
  const { data } = await axiosClient.post(
    `/evidence-files/presign?company_id=${encodeURIComponent(companyId)}`,
    { file_name: fileName, mime_type: mimeType }
  );
  return data; // { upload_url, storage_key }
};

// The actual byte transfer — goes straight to MinIO, not through our API.
// onProgress receives 0-100 for a real progress bar (replaces the old
// setInterval simulation in ControlDetails.jsx).
export const uploadFileToStorage = async (uploadUrl, file, onProgress) => {
  await axios.put(uploadUrl, file, {
    headers: { 'Content-Type': file.type || 'application/octet-stream' },
    onUploadProgress: (evt) => {
      if (onProgress && evt.total) {
        onProgress(Math.round((evt.loaded * 100) / evt.total));
      }
    },
  });
};

// Step 2 of upload: tell the backend the file landed, so it creates the
// EvidenceItem row and runs the auto-link logic across matching audits.
export const confirmEvidenceUpload = async (evidenceItemId, payload) => {
  const { data } = await axiosClient.post(
    `/evidence-files/confirm/${evidenceItemId}`,
    payload
  );
  return data; // { evidence, linked_audit_control_ids }
};

// The company's full evidence library — used for the "you already have
// this evidence, reuse it?" picker.
export const getCompanyEvidence = async (companyId) => {
  const { data } = await axiosClient.get(`/evidence-files/company/${companyId}`);
  return data;
};

// Evidence currently linked to one audit control.
export const getEvidenceForAuditControl = async (auditControlId) => {
  const { data } = await axiosClient.get(`/evidence-files/audit-control/${auditControlId}`);
  return data;
};

// Manually attach an existing evidence item to a control (the "reuse"
// action, when the auto-linker didn't already cover it).
export const linkEvidenceToControl = async (auditControlId, evidenceItemId, linkedByUser) => {
  const { data } = await axiosClient.post('/evidence-files/link', {
    audit_control_id: auditControlId,
    evidence_item_id: evidenceItemId,
    linked_by_user: linkedByUser,
  });
  return data;
};

export const unlinkEvidence = async (auditControlEvidenceId) => {
  const { data } = await axiosClient.delete(`/evidence-files/link/${auditControlEvidenceId}`);
  return data;
};

export const deleteEvidenceItem = async (evidenceItemId) => {
  const { data } = await axiosClient.delete(`/evidence-files/${evidenceItemId}`);
  return data;
};

// Full flow, composed: presign -> upload bytes -> confirm.
// Returns the same shape as confirmEvidenceUpload's response.
// Full flow, composed: presign -> upload bytes -> confirm.
// Returns the same shape as confirmEvidenceUpload's response.
export const uploadEvidenceFile = async ({
  file, companyId, uploadedBy, auditControlId, evidenceTypeId, onProgress,
}) => {
  const { upload_url, storage_key, evidence_item_id } = await getPresignedUploadUrl(
    companyId, file.name, file.type
  );

  await uploadFileToStorage(upload_url, file, onProgress);

  return confirmEvidenceUpload(evidence_item_id, {
    file_name: file.name,
    storage_key,
    file_size: file.size,
    mime_type: file.type,
    evidence_type_id: evidenceTypeId || null,
    uploaded_by: uploadedBy,
    company_id: companyId,
    audit_control_id: auditControlId || null,
  });
};

// Default export for convenience
const api = {
  login,
  changePassword,
  getPresignedUploadUrl,
  uploadFileToStorage,
  confirmEvidenceUpload,
  getCompanyEvidence,
  getEvidenceForAuditControl,
  linkEvidenceToControl,
  unlinkEvidence,
  deleteEvidenceItem,
  uploadEvidenceFile,
};

export default api;