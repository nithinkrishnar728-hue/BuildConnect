import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export const getProjects = () => axios.get(`${API_URL}/projects`, { withCredentials: true });
export const getAssignedProjects = () => axios.get(`${API_URL}/projects/assigned`, { withCredentials: true });
export const getProject = (id) => axios.get(`${API_URL}/projects/${id}`, { withCredentials: true });
export const createProject = (data) => axios.post(`${API_URL}/projects`, data, { withCredentials: true });
export const updateProject = (id, data) => axios.patch(`${API_URL}/projects/${id}`, data, { withCredentials: true });
export const deleteProject = (id) => axios.delete(`${API_URL}/projects/${id}`, { withCredentials: true });
export const getProjectTasks = (id, status) => {
    const params = status ? `?status=${status}` : '';
    return axios.get(`${API_URL}/projects/${id}/tasks${params}`);
};
