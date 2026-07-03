import { useState } from 'react';
import toast from 'react-hot-toast';
import { createStage } from '../api/stages';

const STANDARD_STAGES = [
  'Site Preparation',
  'Foundation',
  'Framing',
  'Roofing',
  'Exterior Finishes',
  'Plumbing',
  'Electrical',
  'HVAC',
  'Insulation',
  'Drywall',
  'Interior Finishes',
  'Flooring',
  'Cabinetry & Millwork',
  'Painting',
  'Fixtures & Appliances',
  'Landscaping',
  'Final Inspection & Handover'
];

export default function StageFormModal({ projectId, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: 'Foundation',
    description: '',
    status: 'not_started',
    plannedStartDate: '',
    plannedEndDate: '',
    order: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Auto-fill order if name changes and order is currently empty
    if (name === 'name' && !formData.order) {
      const stageIndex = STANDARD_STAGES.indexOf(value);
      if (stageIndex !== -1) {
        setFormData(prev => ({ 
          ...prev, 
          [name]: value,
          order: stageIndex + 1 
        }));
        return;
      }
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validate required fields
    if (!formData.name.trim()) {
      toast.error('Stage name is required');
      return;
    }
    if (formData.plannedStartDate && formData.plannedEndDate &&
        new Date(formData.plannedStartDate) > new Date(formData.plannedEndDate)) {
      toast.error('End date must be after start date');
      return;
    }

    setLoading(true);
    try {
      await createStage({
        projectId,
        name: formData.name,
        description: formData.description,
        status: formData.status,
        plannedStartDate: formData.plannedStartDate || null,
        plannedEndDate: formData.plannedEndDate || null,
        order: formData.order ? parseInt(formData.order) : undefined
      });
      toast.success('Stage created');
      onSuccess(); // refresh stages
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create stage');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">Create New Stage</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Stage Name *</label>
                <select
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
                  required
                >
                  <option value="" disabled>Select a stage</option>
                  {STANDARD_STAGES.map((stage, idx) => (
                    <option key={idx} value={stage}>{stage}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Select the stage in construction order.</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Order</label>
                <input
                  type="number"
                  name="order"
                  value={formData.order}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="Auto"
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty to auto-assign the next order based on the selected stage’s default position.</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="not_started">Not Started</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="delayed">Delayed</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Planned Start Date</label>
                <input
                  type="date"
                  name="plannedStartDate"
                  value={formData.plannedStartDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Planned End Date</label>
                <input
                  type="date"
                  name="plannedEndDate"
                  value={formData.plannedEndDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            <div className="flex justify-end gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Stage'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
