import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export const getUpcomingJobs = () => axios.get(`${API_URL}/jobs/upcoming`, { withCredentials: true });

export const confirmRequestDate = (requestId, date) =>
    axios.post(`${API_URL}/requests/${requestId}/confirm-date`, { date }, { withCredentials: true });

export const confirmOfferDate = (offerId, date) =>
    axios.post(`${API_URL}/job-offers/${offerId}/confirm-date`, { date }, { withCredentials: true });
