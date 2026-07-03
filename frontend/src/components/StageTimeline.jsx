import React, { useEffect, useRef, useState } from 'react';
import { Timeline } from 'vis-timeline/standalone';
import 'vis-timeline/styles/vis-timeline-graph2d.css';
import StageForm from './StageForm';

export default function StageTimeline({ stages, tasks, projectStart, projectEnd, projectId, onStageChange, userRole }) {
  const containerRef = useRef(null);
  const timelineRef = useRef(null);
  const [editingStage, setEditingStage] = useState(null);

  const canManage = userRole === 'client' || userRole === 'supervisor';

  // Prepare items for vis-timeline
  const items = stages.map(stage => {
    let className = '';
    switch (stage.status) {
      case 'completed': className = 'timeline-item-completed'; break;
      case 'in_progress': className = 'timeline-item-inprogress'; break;
      case 'delayed': className = 'timeline-item-delayed'; break;
      default: className = 'timeline-item-notstarted';
    }

    // Calculate progress for this stage
    const stageTasks = tasks.filter(t => (t.stageId?._id || t.stageId) === stage._id);
    const total = stageTasks.length;
    const completed = stageTasks.filter(t => t.status === 'completed').length;
    const progress = total ? Math.round((completed / total) * 100) : 0;

    const label = `${stage.name} (${progress}%)`;

    return {
      id: stage._id,
      content: label,
      start: stage.plannedStartDate || new Date(),
      end: stage.plannedEndDate || new Date(),
      className: className,
      type: (stage.plannedStartDate && stage.plannedEndDate) ? 'range' : 'point',
      data: stage // Keep internal data reference
    };
  });

  // Calculate timeline start/end fallback if not provided
  let start = projectStart;
  let end = projectEnd;

  if (!start && items.length > 0) {
    start = new Date(Math.min(...items.map(i => new Date(i.start))));
  }
  if (!end && items.length > 0) {
    end = new Date(Math.max(...items.map(i => i.end ? new Date(i.end) : new Date(i.start))));
  }

  if (!start) start = new Date(new Date().setDate(new Date().getDate() - 14));
  if (!end) end = new Date(new Date().setDate(new Date().getDate() + 14));

  const options = {
    width: '100%',
    height: '400px',
    stack: true,
    showCurrentTime: true,
    editable: false,
    orientation: 'top',
    zoomable: true,
    moveable: true,
    start: start,
    end: end,
    tooltip: {
      followMouse: true,
      overflowMethod: 'cap'
    }
  };

  useEffect(() => {
    if (containerRef.current && !timelineRef.current) {
      // Initialize vis-timeline directly
      timelineRef.current = new Timeline(containerRef.current, items, options);
      
      // Handle clicks internally
      timelineRef.current.on('click', (properties) => {
        if (properties.item && canManage) {
          const stage = items.find(item => item.id === properties.item)?.data;
          if (stage) {
            setEditingStage(stage);
          }
        }
      });
    } else if (timelineRef.current) {
      // Update existing timeline
      timelineRef.current.setOptions(options);
      timelineRef.current.setItems(items);
    }
    
    return () => {
      // We don't necessarily want to destroy on every re-render, 
      // but it's safe to let it live while mounted.
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stages, tasks]); // Re-run when stages or tasks change

  // Clean-up on unmount specifically
  useEffect(() => {
    return () => {
      if (timelineRef.current) {
        timelineRef.current.destroy();
        timelineRef.current = null;
      }
    };
  }, []);

  if (stages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <p className="text-base font-medium">No stages configured yet</p>
        <p className="text-sm mt-1">Add stages to view the advanced timeline.</p>
      </div>
    );
  }

  return (
    <div className="stage-timeline-container bg-white rounded-xl border border-gray-200 p-5">
      {editingStage && (
        <StageForm
          projectId={projectId}
          stage={editingStage}
          onClose={() => setEditingStage(null)}
          onSave={() => { setEditingStage(null); onStageChange(); }}
        />
      )}
      
      <div ref={containerRef} className="vis-timeline-wrapper" />
      
      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4 pt-3 border-t border-gray-100 text-sm">
        <span className="flex items-center"><span className="w-3 h-3 bg-green-500 rounded-sm inline-block mr-1.5"></span> Completed</span>
        <span className="flex items-center"><span className="w-3 h-3 bg-blue-500 rounded-sm inline-block mr-1.5"></span> In Progress</span>
        <span className="flex items-center"><span className="w-3 h-3 bg-red-500 rounded-sm inline-block mr-1.5"></span> Delayed</span>
        <span className="flex items-center"><span className="w-3 h-3 bg-gray-400 rounded-sm inline-block mr-1.5"></span> Not Started</span>
        {canManage && <span className="text-gray-400 italic text-xs ml-auto self-center">Click a stage bar to edit it</span>}
      </div>
    </div>
  );
}
