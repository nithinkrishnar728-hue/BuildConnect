import { useState } from 'react';
import StageCard from './StageCard';
import StageForm from './StageForm';
import TaskCard from './TaskCard';
import { FaPlus } from 'react-icons/fa';

export default function StageList({ stages, tasks, projectId, onStageChange, userRole }) {
  const [showAddStage, setShowAddStage] = useState(false);

  // Group tasks by stageId
  const tasksByStage = {};
  tasks.forEach((task) => {
    const key = task.stageId?._id || task.stageId || 'ungrouped';
    if (!tasksByStage[key]) tasksByStage[key] = [];
    tasksByStage[key].push(task);
  });

  const sortedStages = [...stages].sort((a, b) => a.order - b.order);
  const ungroupedTasks = tasksByStage['ungrouped'] || [];

  const canManage = userRole === 'client' || userRole === 'supervisor';

  return (
    <div>
      {/* Add Stage Button */}
      {canManage && (
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setShowAddStage(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition shadow-sm"
          >
            <FaPlus size={12} />
            Add Stage
          </button>
        </div>
      )}

      {showAddStage && (
        <StageForm
          projectId={projectId}
          onClose={() => setShowAddStage(false)}
          onSave={() => { setShowAddStage(false); onStageChange(); }}
        />
      )}

      {/* Stage Cards */}
      {sortedStages.length === 0 && ungroupedTasks.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg font-medium">No stages or tasks yet.</p>
          {canManage && (
            <p className="text-sm mt-1">Click "Add Stage" to create your first project stage.</p>
          )}
        </div>
      )}

      {sortedStages.map((stage) => (
        <StageCard
          key={stage._id}
          stage={stage}
          tasks={tasksByStage[stage._id] || []}
          projectId={projectId}
          onStageChange={onStageChange}
          userRole={userRole}
        />
      ))}

      {/* Ungrouped Tasks */}
      {ungroupedTasks.length > 0 && (
        <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-5 mt-2">
          <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            📂 Ungrouped Tasks ({ungroupedTasks.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {ungroupedTasks.map((task) => (
              <TaskCard key={task._id} task={task} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
