import { create } from 'zustand';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export const useAdminAuthStore = create((set) => ({
    admin: null,
    loading: true,
    error: null,

    login: async (email, password) => {
        try {
            set({ loading: true, error: null });
            const response = await axios.post(`${API_URL}/auth/login`, { email, password });
            
            if (response.data.user.role !== 'admin') {
                throw new Error('Unauthorized access. Admin credentials required.');
            }

            sessionStorage.setItem('admin_token', response.data.token);
            axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
            set({ admin: response.data.user, loading: false });
            return response.data;
        } catch (error) {
            set({ error: error.response?.data?.message || error.message || 'Login failed', loading: false });
            throw error;
        }
    },

    logout: async () => {
        try {
            sessionStorage.removeItem('admin_token');
            delete axios.defaults.headers.common['Authorization'];
            set({ admin: null });
        } catch (error) {
            console.error('Logout failed:', error);
        }
    },

    checkAuth: async () => {
        const token = sessionStorage.getItem('admin_token');
        if (!token) {
            set({ admin: null, loading: false });
            return;
        }
        try {
            set({ loading: true });
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            const response = await axios.get(`${API_URL}/auth/me`);
            if (response.data.user && response.data.user.role === 'admin') {
                set({ admin: response.data.user, loading: false });
            } else {
                sessionStorage.removeItem('admin_token');
                set({ admin: null, loading: false });
            }
        } catch (error) {
            sessionStorage.removeItem('admin_token');
            set({ admin: null, loading: false });
        }
    }
}));
