import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCommentDots, FaTimes } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function MessagesDropdown({ currentUserId }) {
    const [open, setOpen] = useState(false);
    const [conversations, setConversations] = useState([]);
    const [totalUnread, setTotalUnread] = useState(0);
    const [loading, setLoading] = useState(false);
    const panelRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchConversations();
        const interval = setInterval(fetchConversations, 30000); // poll every 30s
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchConversations = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_URL}/chat/conversations`, { withCredentials: true });
            const convs = res.data.conversations || [];
            setConversations(convs);
            setTotalUnread(convs.reduce((sum, c) => sum + (c.unreadCount || 0), 0));
        } catch {
            // silent — user may not be logged in
        } finally {
            setLoading(false);
        }
    };

    const openChat = (convId) => {
        setOpen(false);
        navigate(`/chat?conv=${convId}`);
    };

    // Get the other participant's name and avatar
    const getOther = (conv) => {
        if (!conv.participantIds || !currentUserId) return { name: 'Unknown', avatar: null };
        const other = conv.participantIds.find(p => p._id !== currentUserId && p._id?.toString() !== currentUserId?.toString());
        return {
            name: other ? `${other.firstName} ${other.lastName}` : 'Unknown',
            avatar: other?.profileImage || null,
            initials: other ? (other.firstName[0] + other.lastName[0]).toUpperCase() : '?'
        };
    };

    return (
        <div className="relative" ref={panelRef}>
            {/* Icon Button */}
            <button
                onClick={() => { setOpen(o => !o); if (!open) fetchConversations(); }}
                className="relative text-white hover:text-blue-100 transition p-1"
                title="Messages"
            >
                <FaCommentDots size={20} />
                {totalUnread > 0 && (
                    <span className="absolute -top-1 -right-1 bg-green-500 text-white text-[10px] font-bold min-w-[16px] h-4 flex items-center justify-center rounded-full px-0.5">
                        {totalUnread > 99 ? '99+' : totalUnread}
                    </span>
                )}
            </button>

            {/* Dropdown Panel - Aero Glass Overlay */}
            {open && (
                <div className="absolute right-0 mt-3 w-[22rem] bg-white/90 backdrop-blur-2xl rounded-2xl shadow-[0_20px_60px_rgba(42,103,235,0.15)] border border-[#2A67EB]/20 z-50 overflow-hidden text-left font-sans">
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0]/50 bg-white/50">
                        <h3 className="font-extrabold text-[#2248A8] text-xs uppercase tracking-widest">Messages</h3>
                        <button
                            onClick={() => { setOpen(false); navigate('/chat'); }}
                            className="text-[11px] text-[#2A67EB] hover:text-[#2248A8] font-bold tracking-wide transition-colors"
                        >
                            Open all →
                        </button>
                    </div>

                    {/* Conversation List */}
                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                        {loading && conversations.length === 0 ? (
                            <div className="py-10 text-center text-[#2A67EB] text-sm font-semibold tracking-wide animate-pulse">Synchronizing...</div>
                        ) : conversations.length === 0 ? (
                            <div className="py-12 text-center">
                                <span className="inline-flex items-center justify-center w-12 h-12 bg-[#F1F5F9] rounded-full mb-3 shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] text-[#CBD5E1]">
                                   <FaCommentDots size={20} />
                                </span>
                                <p className="text-[#64748B] text-sm font-medium">No active conversations</p>
                            </div>
                        ) : (
                            <div className="flex flex-col">
                                {conversations.map((conv, index) => {
                                    const other = getOther(conv);
                                    const hasUnread = conv.unreadCount > 0;
                                    return (
                                        <div
                                            key={conv._id}
                                            onClick={() => openChat(conv._id)}
                                            className={`flex items-start gap-4 px-5 py-4 cursor-pointer hover:bg-blue-50/50 transition-colors group relative border-b border-[#F1F5F9] last:border-0 ${hasUnread ? 'bg-blue-50/30' : ''}`}
                                        >
                                            {/* Avatar */}
                                            <div className="mt-0.5 flex-shrink-0 relative">
                                                {other.avatar ? (
                                                    <img src={other.avatar} alt={other.name} className={`w-9 h-9 rounded-full object-cover shadow-sm ${hasUnread ? 'ring-2 ring-[#2A67EB]/30' : ''}`} />
                                                ) : (
                                                    <div className={`w-9 h-9 rounded-full text-white flex items-center justify-center text-sm font-bold shadow-sm ${hasUnread ? 'bg-[#2A67EB] ring-2 ring-[#2A67EB]/30' : 'bg-[#64748B]'}`}>
                                                        {other.initials}
                                                    </div>
                                                )}
                                                {hasUnread && (
                                                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#2A67EB] rounded-full border-2 border-white shadow-sm" />
                                                )}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0 pr-2">
                                                <div className="flex items-center justify-between mb-1">
                                                    <p className={`text-[13px] leading-tight truncate ${hasUnread ? 'font-bold text-[#2248A8]' : 'font-semibold text-[#334155]'}`}>
                                                        {other.name}
                                                    </p>
                                                    {conv.lastMessageAt && (
                                                        <span className="text-[10px] text-[#94A3B8] font-semibold tracking-wide whitespace-nowrap ml-2">
                                                            {formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: false }).replace('about ', '')}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className={`text-[12px] leading-relaxed line-clamp-1 ${hasUnread ? 'text-[#334155] font-medium' : 'text-[#64748B]'}`}>
                                                    {conv.lastMessage || 'No messages yet'}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
