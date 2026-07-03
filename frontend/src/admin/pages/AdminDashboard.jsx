import { NavLink, Routes, Route, useNavigate } from 'react-router-dom';
import { useAdminAuthStore } from '../store/adminAuthStore';
import { FaChartBar, FaUsers, FaFlag, FaSignOutAlt, FaShieldAlt, FaBullhorn } from 'react-icons/fa';

import AdminAnalytics from './AdminAnalytics';
import AdminUsers from './AdminUsers';
import AdminReports from './AdminReports';
import AdminContent from './AdminContent';
import AdminAnnouncements from './AdminAnnouncements';

export default function AdminDashboard() {
    const { admin, logout } = useAdminAuthStore();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/admin/login');
    };

    const navItems = [
        { path: '', label: 'Analytics', icon: <FaChartBar />, end: true },
        { path: 'users', label: 'Users', icon: <FaUsers /> },
        { path: 'reports', label: 'Reports', icon: <FaFlag /> },
        { path: 'content', label: 'Moderation', icon: <FaShieldAlt /> },
        { path: 'announcements', label: 'Announcements', icon: <FaBullhorn /> },
    ];

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <div className="w-64 bg-slate-900 text-white flex flex-col">
                <div className="p-6 flex items-center space-x-3 border-b border-slate-800">
                    <FaShieldAlt className="text-blue-500 text-2xl" />
                    <span className="text-xl font-bold">Admin Portal</span>
                </div>
                
                <div className="p-4 border-b border-slate-800">
                    <p className="text-sm text-slate-400">Logged in as</p>
                    <p className="font-semibold truncate">{admin.email}</p>
                </div>

                <nav className="flex-1 p-4 flex flex-col space-y-2 overflow-y-auto">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={`/admin/${item.path}`}
                            end={item.end}
                            className={({ isActive }) => 
                                `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                                    isActive 
                                    ? 'bg-blue-600 text-white' 
                                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                }`
                            }
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <button 
                        onClick={handleLogout}
                        className="flex items-center space-x-3 text-slate-300 hover:text-white hover:bg-slate-800 w-full px-4 py-3 rounded-lg transition-colors"
                    >
                        <FaSignOutAlt />
                        <span>Sign Out</span>
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
                    <Routes>
                        <Route path="/" element={<AdminAnalytics />} />
                        <Route path="/users" element={<AdminUsers />} />
                        <Route path="/reports" element={<AdminReports />} />
                        <Route path="/content" element={<AdminContent />} />
                        <Route path="/announcements" element={<AdminAnnouncements />} />
                    </Routes>
                </main>
            </div>
        </div>
    );
}
