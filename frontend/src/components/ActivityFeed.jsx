import { useEffect, useState } from 'react';
import { getProjectActivities } from '../api/activities';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { 
    FaPlusCircle, FaRegEdit, FaUserCheck, FaImage, 
    FaExchangeAlt, FaRegFileAlt, FaCheck, FaInfoCircle
} from 'react-icons/fa';

export default function ActivityFeed({ projectId }) {
    const [activities, setActivities] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadActivities(page);
    }, [page, projectId]);

    const loadActivities = async (currentPage) => {
        setLoading(true);
        setError(null);
        try {
            const res = await getProjectActivities(projectId, currentPage);
            setActivities(prev => 
                currentPage === 1 ? res.data.activities : [...prev, ...res.data.activities]
            );
            setHasMore(res.data.page < res.data.pages);
        } catch (err) {
            console.error('Failed to load activities', err);
            setError('Could not load project activities. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const getIconConfig = (type) => {
        switch (type) {
            case 'project_created': 
                return { icon: <FaPlusCircle />, color: 'text-purple-500', bg: 'bg-purple-100' };
            case 'task_created': 
                return { icon: <FaRegFileAlt />, color: 'text-blue-500', bg: 'bg-blue-100' };
            case 'task_status_changed': 
                return { icon: <FaExchangeAlt />, color: 'text-yellow-600', bg: 'bg-yellow-100' };
            case 'provider_hired': 
                return { icon: <FaUserCheck />, color: 'text-green-600', bg: 'bg-green-100' };
            case 'image_uploaded': 
                return { icon: <FaImage />, color: 'text-indigo-500', bg: 'bg-indigo-100' };
            case 'comment_added': 
                return { icon: <FaRegEdit />, color: 'text-gray-600', bg: 'bg-gray-200' };
            default: 
                return { icon: <FaInfoCircle />, color: 'text-gray-500', bg: 'bg-gray-100' };
        }
    };

    const getActionLink = (act) => {
        if (!act.relatedId || !act.relatedModel) return null;
        switch (act.relatedModel) {
            case 'Request': return `/requests/${act.relatedId}`;
            case 'JobOffer': return `/offers/${act.relatedId}`;
            case 'User': return `/providers/${act.relatedId}`;
            default: return null;
        }
    };

    if (error && activities.length === 0) {
        return <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>;
    }

    if (activities.length === 0 && !loading) {
        return (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                <p className="text-gray-500 italic">No activity recorded for this project yet.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flow-root">
                <ul className="-mb-8">
                    {activities.map((act, idx) => {
                        const { icon, color, bg } = getIconConfig(act.type);
                        const isLast = idx === activities.length - 1;
                        const actionUrl = getActionLink(act);

                        return (
                            <li key={act._id}>
                                <div className="relative pb-8">
                                    {!isLast && (
                                        <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                                    )}
                                    <div className="relative flex space-x-3">
                                        <div>
                                            <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${bg} ${color}`}>
                                                {icon}
                                            </span>
                                        </div>
                                        <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                                            <div>
                                                <p className="text-sm text-gray-800">
                                                    {actionUrl ? (
                                                        <Link to={actionUrl} className="hover:text-blue-600 font-medium transition-colors">
                                                            {act.description}
                                                        </Link>
                                                    ) : (
                                                        <span className="font-medium text-gray-900">{act.description}</span>
                                                    )}
                                                </p>
                                                {act.userId && (
                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                        by <span className="font-medium text-gray-700">{act.userId.firstName} {act.userId.lastName}</span>
                                                    </p>
                                                )}
                                            </div>
                                            <div className="whitespace-nowrap text-right text-xs text-gray-500">
                                                <time dateTime={act.createdAt}>
                                                    {formatDistanceToNow(new Date(act.createdAt), { addSuffix: true })}
                                                </time>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </div>

            {hasMore && (
                <div className="mt-6 pt-4 border-t flex justify-center">
                    <button
                        onClick={() => setPage(p => p + 1)}
                        disabled={loading}
                        className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg disabled:opacity-50 transition-colors"
                    >
                        {loading ? 'Loading...' : 'Load older activity'}
                    </button>
                </div>
            )}
        </div>
    );
}
