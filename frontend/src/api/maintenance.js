import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL;

export const createMaintenanceRequest = (data) =>
    axios.post(`${API_URL}/maintenance`, data);

export const getMaintenanceRequests = (status = '') => {
    const params = status ? `?status=${status}` : '';
    return axios.get(`${API_URL}/maintenance${params}`);
};

export const getMaintenanceRequest = (id) =>
    axios.get(`${API_URL}/maintenance/${id}`);

export const updateMaintenanceStatus = (id, status, responseMessage = '') =>
    axios.patch(`${API_URL}/maintenance/${id}/status`, { status, responseMessage });
