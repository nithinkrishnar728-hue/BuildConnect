import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  getComplianceSummary,
  getProjectComplianceItems,
  getComplianceTypes
} from '../api/compliance';
import { FaPlus, FaFileAlt, FaCalendarAlt, FaExclamationTriangle, FaShieldAlt } from 'react-icons/fa';

const STATUS_COLORS = {
  not_started: 'bg-gray-100 text-gray-700',
  in_progress:  'bg-blue-100 text-blue-700',
  submitted:    'bg-yellow-100 text-yellow-700',
  approved:     'bg-green-100 text-green-700',
  rejected:     'bg-red-100 text-red-700',
  expired:      'bg-red-100 text-red-700'
};

// Returns expiry urgency info for a given expiryDate
const getExpiryInfo = (expiryDate) => {
  if (!expiryDate) return null;
  const now = new Date();
  const expiry = new Date(expiryDate);
  const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
  if (daysLeft < 0)  return { label: 'Expired',            color: 'text-red-600',    bg: 'bg-red-50',     border: 'border-red-300',    badge: 'bg-red-100 text-red-700' };
  if (daysLeft <= 30) return { label: `Expires in ${daysLeft}d`, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-300', badge: 'bg-orange-100 text-orange-700' };
  return { label: `Expires ${expiry.toLocaleDateString('en-IN')}`, color: 'text-gray-400', bg: '', border: 'border-transparent', badge: null };
};

function SummaryCard({ title, value, icon, colorClass }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-lg ${colorClass}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

export default function ComplianceTab({ projectId }) {
  const { user } = useAuthStore();
  const [summary, setSummary] = useState(null);
  const [items, setItems] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [summaryRes, itemsRes, typesRes] = await Promise.all([
        getComplianceSummary(projectId),
        getProjectComplianceItems(projectId),
        getComplianceTypes()
      ]);
      setSummary(summaryRes.data.summary);
      setItems(itemsRes.data.items);
      setTypes(typesRes.data.types);
    } catch (err) {
      console.error('Failed to load compliance data', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(item => {
    if (filterStatus !== 'all' && item.status !== filterStatus) return false;
    if (filterType !== 'all' && item.type?._id !== filterType) return false;
    return true;
  });

  const canManage = user?.role === 'client' || user?.role === 'supervisor';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3" />
        Loading compliance data…
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SummaryCard title="Total Items" value={summary.total}      icon={<FaFileAlt />}              colorClass="bg-blue-500" />
          <SummaryCard title="Approved"    value={summary.completed}   icon={<FaShieldAlt />}            colorClass="bg-green-500" />
          <SummaryCard title="Pending"     value={summary.pending}     icon={<FaFileAlt />}              colorClass="bg-yellow-500" />
          <SummaryCard title="Expired"     value={summary.expired}     icon={<FaExclamationTriangle />}  colorClass="bg-red-500" />
        </div>
      )}

      {/* Expiry Alert Banner */}
      {summary?.upcomingExpiries?.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <h4 className="font-semibold text-yellow-800 flex items-center gap-2 mb-2">
            <FaCalendarAlt /> Expiring in Next 30 Days
          </h4>
          <ul className="space-y-1">
            {summary.upcomingExpiries.map(exp => (
              <li key={exp._id} className="text-sm">
                <Link to={`/compliance/${exp._id}`} className="text-blue-600 hover:underline">
                  {exp.title}
                </Link>
                <span className="text-yellow-700 ml-2">
                  — expires {new Date(exp.expiryDate).toLocaleDateString('en-IN')}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h3 className="text-xl font-bold text-gray-900">Compliance Items</h3>
        {canManage && (
          <Link
            to={`/projects/${projectId}/compliance/new`}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
          >
            <FaPlus /> Add Item
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Statuses</option>
          <option value="not_started">Not Started</option>
          <option value="in_progress">In Progress</option>
          <option value="submitted">Submitted</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="expired">Expired</option>
        </select>
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Types</option>
          {types.map(t => (
            <option key={t._id} value={t._id}>{t.icon} {t.name}</option>
          ))}
        </select>
      </div>

      {/* Items List */}
      {filteredItems.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-10 text-center border border-dashed border-gray-200">
          <FaFileAlt className="text-gray-300 text-4xl mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No compliance items found.</p>
          {canManage && (
            <Link
              to={`/projects/${projectId}/compliance/new`}
              className="mt-4 inline-flex items-center gap-1 text-blue-600 hover:underline text-sm"
            >
              <FaPlus /> Add your first compliance item
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map(item => {
            const expiry = getExpiryInfo(item.expiryDate);
            return (
              <Link
                key={item._id}
                to={`/compliance/${item._id}`}
                className={`block bg-white rounded-xl shadow-sm border-2 p-4 hover:shadow-md transition group ${expiry?.border || 'border-gray-100'}`}
              >
                {/* Expiry alert banner */}
                {expiry?.badge && (
                  <div className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg mb-3 ${expiry.badge}`}>
                    <FaExclamationTriangle size={11} />
                    {expiry.label} — action required
                  </div>
                )}
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{item.type?.icon || '📄'}</span>
                      <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition truncate">
                        {item.title}
                      </h4>
                    </div>
                    {item.description && (
                      <p className="text-sm text-gray-500 line-clamp-1">{item.description}</p>
                    )}
                    {item.authority && (
                      <p className="text-xs text-gray-400 mt-1">{item.authority}</p>
                    )}
                    <div className="flex flex-wrap gap-3 mt-2 text-xs">
                      {item.applicationDate && (
                        <span className="text-gray-400">Applied: {new Date(item.applicationDate).toLocaleDateString('en-IN')}</span>
                      )}
                      {item.expiryDate && (
                        <span className={`font-medium ${expiry?.color || 'text-gray-400'}`}>
                          📅 {expiry?.label}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${STATUS_COLORS[item.status]}`}>
                    {item.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
