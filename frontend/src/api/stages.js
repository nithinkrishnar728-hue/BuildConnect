import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export const getProjectStages = (projectId) =>
  axios.get(`${API_URL}/stages/project/${projectId}`);

export const createStage = (data) =>
  axios.post(`${API_URL}/stages`, data);

export const updateStage = (id, data) =>
  axios.patch(`${API_URL}/stages/${id}`, data);

export const deleteStage = (id) =>
  axios.delete(`${API_URL}/stages/${id}`);
