import { useState, useEffect } from 'react';
import axios from 'axios';
import { FaUsers, FaProjectDiagram, FaClipboardList, FaHandshake, FaUserTie } from 'react-icons/fa';
import { useAdminAuthStore } from '../store/adminAuthStore';

const API_URL = import.meta.env.VITE_API_URL;

export default function AdminAnalytics() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { admin } = useAdminAuthStore();

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const res = await axios.get(`${API_URL}/admin/analytics`, { withCredentials: true });
                setStats(res.data);
            } catch (err) {
                setError('Failed to load platform analytics');
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div></div>;
    if (error) return <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>;

    const statCards = [
        { title: 'Total Users', value: stats.totalUsers, icon: <FaUsers />, color: 'bg-blue-500' },
        { title: 'Clients', value: stats.clients, icon: <FaUserTie />, color: 'bg-green-500' },
        { title: 'Providers', value: stats.providers, icon: <FaUsers />, color: 'bg-purple-500' },
        { title: 'Projects', value: stats.projects, icon: <FaProjectDiagram />, color: 'bg-indigo-500' },
        { title: 'Requests', value: stats.requests, icon: <FaClipboardList />, color: 'bg-orange-500' },
        { title: 'Job Offers', value: stats.offers, icon: <FaHandshake />, color: 'bg-teal-500' },
    ];

    return (
        <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Platform Analytics</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {statCards.map((card, idx) => (
                    <div key={idx} className="bg-white rounded-xl shadow-sm border p-6 flex items-center">
                        <div className={`w-14 h-14 rounded-lg flex items-center justify-center text-white text-2xl ${card.color} mr-4`}>
                            {card.icon}
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">{card.title}</p>
                            <p className="text-3xl font-bold text-gray-900">{card.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Welcome back, {admin.firstName}!</h2>
                <p className="text-gray-600 leading-relaxed max-w-2xl">
                    This is your centralized command center for BuildConnect. Use the sidebar to manage users,
                    review community reports, and monitor platform activity. 
                </p>
            </div>
        </div>
    );
}
