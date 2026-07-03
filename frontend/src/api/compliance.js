import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export const getComplianceTypes = () =>
  axios.get(`${API_URL}/compliance/types`);

export const getProjectComplianceItems = (projectId) =>
  axios.get(`${API_URL}/compliance/project/${projectId}`);

export const getComplianceSummary = (projectId) =>
  axios.get(`${API_URL}/compliance/project/${projectId}/summary`);

export const getComplianceItem = (id) =>
  axios.get(`${API_URL}/compliance/${id}`);

export const createComplianceItem = (data) =>
  axios.post(`${API_URL}/compliance`, data);

export const updateComplianceItem = (id, data) =>
  axios.patch(`${API_URL}/compliance/${id}`, data);

export const deleteComplianceItem = (id) =>
  axios.delete(`${API_URL}/compliance/${id}`);

export const addInspection = (itemId, data) =>
  axios.post(`${API_URL}/compliance/${itemId}/inspections`, data);

export const updateInspection = (inspectionId, data) =>
  axios.patch(`${API_URL}/compliance/inspections/${inspectionId}`, data);

export const getComplianceItemsAssignedToMe = () =>
  axios.get(`${API_URL}/compliance/assigned-to-me`);

export const uploadComplianceDocument = (itemId, file, description = '') => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('description', description);
  return axios.post(`${API_URL}/compliance/${itemId}/documents`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};
