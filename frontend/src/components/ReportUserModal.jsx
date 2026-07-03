import { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FaTimes, FaFlag, FaExclamationCircle } from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL;

export default function ReportUserModal({ reportedUserId, reportedUserName, onClose }) {
    const [reason, setReason] = useState('fraud');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    const reasons = [
        { value: 'fraud', label: 'Fraud or Scam' },
        { value: 'fake_profile', label: 'Fake Profile' },
        { value: 'inappropriate_content', label: 'Inappropriate Content' },
        { value: 'harassment', label: 'Harassment or Abuse' },
        { value: 'spam', label: 'Spam' },
        { value: 'other', label: 'Other' }
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await axios.post(`${API_URL}/reports`, {
                reportedUser: reportedUserId,
                reason,
                description
            }, { withCredentials: true });
            
            toast.success('Report submitted successfully. We will review it shortly.');
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to submit report');
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
                <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center">
                        <FaFlag className="text-red-500 mr-2" /> Report User
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition p-1">
                        <FaTimes size={20} />
                    </button>
                </div>

                <div className="p-6">
                    <div className="bg-red-50 border border-red-100 rounded-lg p-4 mb-6 flex items-start">
                        <FaExclamationCircle className="text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                        <div className="text-sm text-red-800">
                            <p className="font-semibold mb-1">Reporting {reportedUserName}</p>
                            <p>This report goes directly to the platform administrators. False reporting may result in your own account suspension.</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Reason for reporting</label>
                            <select
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-red-500 bg-white"
                                required
                            >
                                {reasons.map(r => (
                                    <option key={r.value} value={r.value}>{r.label}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Additional Details <span className="text-gray-400 font-normal">(Optional)</span>
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg p-3 h-28 resize-none outline-none focus:ring-2 focus:ring-red-500"
                                placeholder="Please provide specific details to help us investigate..."
                                maxLength={1000}
                            ></textarea>
                            <p className="text-xs text-gray-500 mt-1 text-right">{description.length}/1000</p>
                        </div>

                        <div className="pt-4 flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-5 py-2.5 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition"
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow shadow-red-500/30 transition disabled:opacity-50 flex items-center"
                            >
                                {loading ? (
                                    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    'Submit Report'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
