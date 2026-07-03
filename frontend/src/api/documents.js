import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const uploadDocument = async (formData) => {
    return axios.post(`${API_URL}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true
    });
};

export const getProjectDocuments = async (projectId, page = 1, limit = 10) => {
    return axios.get(`${API_URL}/documents/project/${projectId}?page=${page}&limit=${limit}`, {
        withCredentials: true
    });
};
