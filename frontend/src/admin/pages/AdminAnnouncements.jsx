import { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FaBullhorn, FaPaperPlane } from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL;

export default function AdminAnnouncements() {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [targetRole, setTargetRole] = useState('all');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await axios.post(`${API_URL}/admin/announcements`, {
                title,
                message,
                targetRole
            }, { withCredentials: true });
            
            toast.success(res.data.message);
            setTitle('');
            setMessage('');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to send announcement');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <FaBullhorn className="mr-3 text-blue-600" /> Platform Announcements
            </h1>
            
            <div className="bg-white rounded-xl shadow-sm border p-8">
                <p className="text-gray-600 mb-8">
                    Send a system-wide notification to all users or specific roles. Use this for maintenance alerts, new feature announcements, or community guidelines updates.
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Announcement Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g. Scheduled System Maintenance"
                            maxLength={100}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Target Audience</label>
                        <select
                            value={targetRole}
                            onChange={(e) => setTargetRole(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                            <option value="all">Every Active User</option>
                            <option value="client">Clients Only</option>
                            <option value="worker">Workers Only</option>
                            <option value="engineer">Engineers Only</option>
                            <option value="supervisor">Supervisors Only</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Message Content</label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg p-3 h-40 resize-none outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Type your message here..."
                            maxLength={1000}
                            required
                        ></textarea>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow shadow-blue-500/30 transition flex items-center disabled:opacity-50"
                        >
                            {loading ? (
                                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <><FaPaperPlane className="mr-2" /> Send Announcement</>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
