import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export const getProjectActivities = (projectId, page = 1, limit = 20) => {
    return axios.get(`${API_URL}/activities/project/${projectId}?page=${page}&limit=${limit}`, {
        withCredentials: true
    });
};
