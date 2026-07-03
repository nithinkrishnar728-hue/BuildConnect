import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBell, FaCheck, FaExclamationTriangle, FaShieldAlt, FaEnvelope, FaTasks, FaInfoCircle, FaTimes } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getIcon = (type) => {
    switch (type) {
        case 'compliance_expiry': return <FaExclamationTriangle className="text-amber-500" />;
        case 'job_offer':         return <FaEnvelope className="text-[#2A67EB]" />;
        case 'request':           return <FaTasks className="text-[#2A67EB]" />;
        case 'message':           return <FaEnvelope className="text-[#2A67EB]" />;
        case 'maintenance':       return <FaShieldAlt className="text-[#2A67EB]" />;
        default:                  return <FaInfoCircle className="text-[#2A67EB]" />;
    }
};

export default function NotificationBell() {
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const panelRef = useRef(null);
    const navigate = useNavigate();

    // Fetch on mount and every 60 seconds
    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_URL}/notifications?limit=15`, { withCredentials: true });
            setNotifications(res.data.notifications || []);
            setUnreadCount(res.data.unreadCount || 0);
        } catch {
            // silently ignore — user might not be logged in
        } finally {
            setLoading(false);
        }
    };

    const markRead = async (notification) => {
        if (!notification.read) {
            try {
                await axios.put(`${API_URL}/notifications/${notification._id}/read`, {}, { withCredentials: true });
                setUnreadCount(c => Math.max(0, c - 1));
                setNotifications(prev => prev.map(n => n._id === notification._id ? { ...n, read: true } : n));
            } catch { /* silent */ }
        }
        if (notification.actionUrl) {
            setOpen(false);
            navigate(notification.actionUrl);
        }
    };

    const markAllRead = async () => {
        try {
            await axios.put(`${API_URL}/notifications/mark-all/read`, {}, { withCredentials: true });
            setUnreadCount(0);
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch { /* silent */ }
    };

    const deleteNotification = async (e, id) => {
        e.stopPropagation();
        try {
            await axios.delete(`${API_URL}/notifications/${id}`, { withCredentials: true });
            setNotifications(prev => prev.filter(n => n._id !== id));
            setUnreadCount(prev => {
                const wasUnread = notifications.find(n => n._id === id && !n.read);
                return wasUnread ? Math.max(0, prev - 1) : prev;
            });
        } catch { /* silent */ }
    };

    return (
        <div className="relative" ref={panelRef}>
            {/* Bell Button */}
            <button
                onClick={() => { setOpen(o => !o); if (!open) fetchNotifications(); }}
                className="relative text-white hover:text-blue-100 transition p-1"
                title="Notifications"
            >
                <FaBell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold min-w-[16px] h-4 flex items-center justify-center rounded-full px-0.5 shadow-sm">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Panel - Aero Glass Overlay */}
            {open && (
                <div className="absolute right-0 mt-3 w-[22rem] bg-white/90 backdrop-blur-2xl rounded-2xl shadow-[0_20px_60px_rgba(42,103,235,0.15)] border border-[#2A67EB]/20 z-50 overflow-hidden text-left font-sans">
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0]/50 bg-white/50">
                        <h3 className="font-extrabold text-[#2248A8] text-xs uppercase tracking-widest">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllRead}
                                className="text-[11px] text-[#2A67EB] hover:text-[#2248A8] font-bold tracking-wide flex items-center gap-1 transition-colors"
                            >
                                <FaCheck size={10} /> Mark all read
                            </button>
                        )}
                    </div>

                    {/* Event Timeline List */}
                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                        {loading && notifications.length === 0 ? (
                            <div className="py-10 text-center text-[#2A67EB] text-sm font-semibold tracking-wide animate-pulse">Synchronizing...</div>
                        ) : notifications.length === 0 ? (
                            <div className="py-12 text-center">
                                <span className="inline-flex items-center justify-center w-12 h-12 bg-[#F1F5F9] rounded-full mb-3 shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] text-[#CBD5E1]">
                                   <FaBell size={20} />
                                </span>
                                <p className="text-[#64748B] text-sm font-medium">No active notifications</p>
                            </div>
                        ) : (
                            <div className="flex flex-col">
                                {notifications.map((n, index) => (
                                    <div
                                        key={n._id}
                                        onClick={() => markRead(n)}
                                        className={`flex items-start gap-4 px-5 py-4 cursor-pointer hover:bg-blue-50/50 transition-colors group relative border-b border-[#F1F5F9] last:border-0 ${!n.read ? 'bg-blue-50/30' : ''}`}
                                    >
                                        {/* Unread indicator dot */}
                                        {!n.read && (
                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-[#2A67EB] rounded-full shadow-[0_0_8px_rgba(42,103,235,0.6)]" />
                                        )}
                                        <div className={`mt-0.5 flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center shadow-sm ${n.type === 'compliance_expiry' ? 'bg-amber-50' : 'bg-[#EFF6FF]'}`}>
                                            {getIcon(n.type)}
                                        </div>
                                        <div className="flex-1 min-w-0 pr-2">
                                            <p className={`text-[13px] leading-tight mb-1 truncate ${!n.read ? 'font-bold text-[#2248A8]' : 'font-semibold text-[#334155]'}`}>
                                                {n.title}
                                            </p>
                                            <p className="text-[12px] text-[#64748B] leading-relaxed line-clamp-2">{n.message}</p>
                                        </div>
                                        {/* Time Stamp correctly aligned far right */}
                                        <div className="flex flex-col items-end gap-2 flex-shrink-0 pt-0.5">
                                            <span className="text-[10px] text-[#94A3B8] font-semibold tracking-wide whitespace-nowrap">
                                                {formatDistanceToNow(new Date(n.createdAt), { addSuffix: false }).replace('about ', '')}
                                            </span>
                                            <button
                                                onClick={(e) => deleteNotification(e, n._id)}
                                                className="opacity-0 group-hover:opacity-100 text-[#CBD5E1] hover:text-red-400 transition-colors p-1"
                                                title="Dismiss"
                                            >
                                                <FaTimes size={10} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="px-5 py-3 border-t border-[#E2E8F0]/50 bg-white/80 text-center">
                            <button
                                onClick={() => { setOpen(false); navigate('/notifications'); }}
                                className="text-[11px] text-[#2A67EB] hover:text-[#2248A8] font-bold uppercase tracking-widest transition-colors"
                            >
                                View full history →
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
