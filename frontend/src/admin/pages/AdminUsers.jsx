import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FaBan, FaCheckCircle, FaSearch } from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL;

export default function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [actionLoading, setActionLoading] = useState(null);

    const fetchUsers = async () => {
        try {
            const res = await axios.get(`${API_URL}/admin/users`, { withCredentials: true });
            setUsers(res.data);
            setFilteredUsers(res.data);
        } catch (err) {
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        const lower = searchTerm.toLowerCase();
        setFilteredUsers(
            users.filter(u => 
                u.firstName.toLowerCase().includes(lower) || 
                u.lastName.toLowerCase().includes(lower) || 
                u.email.toLowerCase().includes(lower) ||
                u.role.toLowerCase().includes(lower) ||
                (u.city && u.city.toLowerCase().includes(lower))
            )
        );
    }, [searchTerm, users]);

    const handleSuspend = async (userId, isCurrentlyActive) => {
        const action = isCurrentlyActive ? 'suspend' : 'unsuspend';
        if (!window.confirm(`Are you sure you want to ${action} this user?`)) return;

        setActionLoading(userId);
        try {
            await axios.patch(`${API_URL}/admin/users/${userId}/${action}`, {}, { withCredentials: true });
            toast.success(`User successfully ${action}ed`);
            setUsers(users.map(u => u._id === userId ? { ...u, isActive: !isCurrentlyActive } : u));
        } catch (err) {
            toast.error(err.response?.data?.message || `Failed to ${action} user`);
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div></div>;

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            </div>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                    <div className="relative w-72">
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search users..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="text-sm font-medium text-gray-500">
                        {filteredUsers.length} Users Found
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white text-gray-500 text-sm border-b uppercase tracking-wider">
                                <th className="p-4 font-semibold">User</th>
                                <th className="p-4 font-semibold">Role</th>
                                <th className="p-4 font-semibold">Location</th>
                                <th className="p-4 font-semibold">Joined</th>
                                <th className="p-4 font-semibold">Status</th>
                                <th className="p-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredUsers.map(u => (
                                <tr key={u._id} className="hover:bg-gray-50 transition">
                                    <td className="p-4">
                                        <div className="font-bold text-gray-900">{u.firstName} {u.lastName}</div>
                                        <div className="text-sm text-gray-500">{u.email}</div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`inline-block px-2 py-1 rounded text-xs font-bold uppercase tracking-wide border ${
                                            u.role === 'client' ? 'bg-green-100 text-green-800 border-green-200' :
                                            u.role === 'engineer' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                            u.role === 'supervisor' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                                            'bg-gray-100 text-gray-800 border-gray-200'
                                        }`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="p-4 text-sm text-gray-700">{u.city || 'N/A'}</td>
                                    <td className="p-4 text-sm text-gray-700">{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                                    <td className="p-4">
                                        {u.isActive ? (
                                            <span className="inline-flex items-center text-xs font-semibold text-green-700 bg-green-100 px-2.5 py-0.5 rounded-full">
                                                Active
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center text-xs font-semibold text-red-700 bg-red-100 px-2.5 py-0.5 rounded-full">
                                                Suspended
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4 text-right">
                                        <button
                                            onClick={() => handleSuspend(u._id, u.isActive)}
                                            disabled={actionLoading === u._id}
                                            className={`inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-bold rounded transition disabled:opacity-50 ${
                                                u.isActive 
                                                ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200' 
                                                : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                                            }`}
                                        >
                                            {u.isActive ? <><FaBan size={12}/><span>Suspend</span></> : <><FaCheckCircle size={12}/><span>Unsuspend</span></>}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredUsers.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-gray-500">
                                        No users match your search.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
