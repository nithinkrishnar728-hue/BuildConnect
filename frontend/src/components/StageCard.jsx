import { useState } from 'react';
import TaskCard from './TaskCard';
import StageForm from './StageForm';
import { deleteStage } from '../api/stages';
import toast from 'react-hot-toast';
import { FaEdit, FaTrash, FaChevronDown, FaChevronUp, FaCalendarAlt } from 'react-icons/fa';

const STATUS_STYLES = {
  not_started: 'bg-gray-100 text-gray-600',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  delayed: 'bg-red-100 text-red-700',
};

const STATUS_BAR_COLORS = {
  not_started: 'bg-gray-400',
  in_progress: 'bg-blue-500',
  completed: 'bg-green-500',
  delayed: 'bg-red-500',
};

const STATUS_LABELS = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  completed: 'Completed',
  delayed: 'Delayed',
};

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null;

export default function StageCard({ stage, tasks, projectId, onStageChange, userRole }) {
  const [collapsed, setCollapsed] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === 'completed').length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  const canManage = userRole === 'client' || userRole === 'supervisor';

  const handleDelete = async () => {
    if (!window.confirm(`Delete stage "${stage.name}"? Tasks will become ungrouped.`)) return;
    setDeleting(true);
    try {
      await deleteStage(stage._id);
      toast.success('Stage deleted');
      onStageChange();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete stage');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      {showEdit && (
        <StageForm
          projectId={projectId}
          stage={stage}
          onClose={() => setShowEdit(false)}
          onSave={() => { setShowEdit(false); onStageChange(); }}
        />
      )}

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-4">
        {/* Stage Header */}
        <div className="px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                  Stage {stage.order}
                </span>
                <h3 className="text-base font-semibold text-gray-900">{stage.name}</h3>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[stage.status]}`}>
                  {STATUS_LABELS[stage.status]}
                </span>
              </div>

              {stage.description && (
                <p className="text-sm text-gray-500 mt-1">{stage.description}</p>
              )}

              {/* Dates */}
              {(stage.plannedStartDate || stage.plannedEndDate) && (
                <div className="flex items-center gap-1 mt-1.5 text-xs text-gray-400">
                  <FaCalendarAlt size={10} />
                  <span>
                    {fmt(stage.plannedStartDate)} {stage.plannedStartDate && stage.plannedEndDate && '→'} {fmt(stage.plannedEndDate)}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {canManage && (
                <>
                  <button
                    onClick={() => setShowEdit(true)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="Edit Stage"
                  >
                    <FaEdit size={13} />
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                    title="Delete Stage"
                  >
                    <FaTrash size={13} />
                  </button>
                </>
              )}
              <button
                onClick={() => setCollapsed((c) => !c)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
                title={collapsed ? 'Expand' : 'Collapse'}
              >
                {collapsed ? <FaChevronDown size={13} /> : <FaChevronUp size={13} />}
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>{completed}/{total} tasks completed</span>
              <span className="font-semibold">{progress}%</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${STATUS_BAR_COLORS[stage.status]}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Task List */}
        {!collapsed && (
          <div className="px-5 pb-4">
            {tasks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
                {tasks.map((task) => (
                  <TaskCard key={task._id} task={task} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic py-2">No tasks in this stage yet.</p>
            )}
          </div>
        )}
      </div>
    </>
  );
}
