import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FaFlag, FaCheck, FaBan, FaRegClock } from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL;

export default function AdminReports() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);

    const fetchReports = async () => {
        try {
            const res = await axios.get(`${API_URL}/admin/reports`, { withCredentials: true });
            setReports(res.data);
        } catch (err) {
            toast.error('Failed to load reports');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    const handleAction = async (reportId, action) => {
        if (!window.confirm(`Are you sure you want to ${action} this report?`)) return;

        setActionLoading(reportId);
        try {
            const status = 'resolved';
            await axios.patch(`${API_URL}/admin/reports/${reportId}/action`, {
                status,
                actionTaken: action
            }, { withCredentials: true });
            
            toast.success(`Report marked as resolved (${action})`);
            setReports(reports.map(r => r._id === reportId ? { ...r, status, actionTaken: action } : r));
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update report');
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div></div>;

    const pendingReports = reports.filter(r => r.status === 'pending');
    const resolvedReports = reports.filter(r => r.status === 'resolved');

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                    <FaFlag className="mr-3 text-blue-600" /> Reports Queue
                </h1>
            </div>

            {/* Pending Queue */}
            <div className="bg-white rounded-xl shadow-sm border border-orange-100 overflow-hidden">
                <div className="bg-orange-50 px-6 py-4 border-b border-orange-100 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-orange-900 flex items-center">
                        <FaRegClock className="mr-2" /> Action Required
                    </h2>
                    <span className="bg-orange-200 text-orange-800 text-xs font-bold px-2.5 py-1 rounded-full">{pendingReports.length} pending</span>
                </div>
                
                <div className="divide-y divide-gray-100">
                    {pendingReports.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">No pending reports. All caught up! 🎉</div>
                    ) : (
                        pendingReports.map(report => (
                            <div key={report._id} className="p-6 hover:bg-gray-50 transition">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center space-x-2 mb-2">
                                            <span className="text-xs font-bold uppercase tracking-wide bg-red-100 text-red-700 px-2 py-0.5 rounded">
                                                {report.reason.replace('_', ' ')}
                                            </span>
                                            <span className="text-sm text-gray-500">{new Date(report.createdAt).toLocaleString()}</span>
                                        </div>
                                        <p className="text-gray-800 text-sm mb-4 bg-gray-50 p-3 rounded border border-gray-100">
                                            "{report.description || 'No additional description provided.'}"
                                        </p>
                                        <div className="flex space-x-8 text-sm">
                                            <div>
                                                <p className="text-gray-500 text-xs uppercase mb-1">Reported User</p>
                                                <p className="font-semibold text-gray-900">{report.reportedUser.firstName} {report.reportedUser.lastName}</p>
                                                <p className="text-gray-500 text-xs">{report.reportedUser.email} • {report.reportedUser.role}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500 text-xs uppercase mb-1">Reported By</p>
                                                <p className="font-medium text-gray-700">{report.reporter.firstName} {report.reporter.lastName}</p>
                                                <p className="text-gray-500 text-xs">{report.reporter.email}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col space-y-2 ml-4">
                                        <button 
                                            onClick={() => handleAction(report._id, 'suspend')}
                                            disabled={actionLoading === report._id}
                                            className="px-4 py-2 bg-red-600 text-white text-sm font-bold rounded shadow shadow-red-500/30 hover:bg-red-700 transition flex items-center justify-center disabled:opacity-50"
                                        >
                                            <FaBan className="mr-2" /> Suspend User
                                        </button>
                                        <button 
                                            onClick={() => handleAction(report._id, 'dismiss')}
                                            disabled={actionLoading === report._id}
                                            className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-bold rounded hover:bg-gray-300 transition flex items-center justify-center disabled:opacity-50"
                                        >
                                            <FaCheck className="mr-2" /> Dismiss Report
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Resolved Queue */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden opacity-75 hover:opacity-100 transition">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 text-gray-700 font-bold flex justify-between">
                    <span>Resolved Reports</span>
                    <span className="text-sm font-normal text-gray-500">{resolvedReports.length} total</span>
                </div>
                <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                    {resolvedReports.map(report => (
                        <div key={report._id} className="p-4 flex justify-between items-center text-sm">
                            <div>
                                <span className={`mr-3 px-2 py-0.5 rounded text-xs font-bold uppercase ${
                                    report.actionTaken === 'suspend' ? 'bg-red-100 text-red-700' : 'bg-gray-200 text-gray-700'
                                }`}>
                                    Action: {report.actionTaken}
                                </span>
                                <span className="text-gray-600">
                                    <strong className="text-gray-900">{report.reporter?.firstName}</strong> reported <strong className="text-gray-900">{report.reportedUser?.firstName}</strong> for <em>{report.reason.replace('_', ' ')}</em>
                                </span>
                            </div>
                            <span className="text-gray-400">{new Date(report.createdAt).toLocaleDateString()}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
