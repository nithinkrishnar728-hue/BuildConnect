import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export const getMySchedule = (start, end) => {
    const params = new URLSearchParams();
    if (start) params.append('start', start);
    if (end) params.append('end', end);
    return axios.get(`${API_URL}/availability/me?${params.toString()}`, {
        withCredentials: true // Depending on auth setup, required if using cookies/sessions 
    });
};

export const updateSchedule = (scheduleData) => {
    // scheduleData is an array of { date, status, note }
    // Wrapped in an object matching controller expectation
    return axios.put(`${API_URL}/availability/me`, { schedule: scheduleData });
};

export const updateDay = (date, status, note) => {
    return axios.patch(`${API_URL}/availability/me`, { date, status, note });
};

export const getProviderSchedule = (userId, start, end) => {
    const params = new URLSearchParams();
    if (start) params.append('start', start);
    if (end) params.append('end', end);
    return axios.get(`${API_URL}/availability/${userId}?${params.toString()}`, {
        withCredentials: true
    });
};
