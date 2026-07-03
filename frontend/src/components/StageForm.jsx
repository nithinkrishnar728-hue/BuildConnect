import { useState } from 'react';
import { createStage, updateStage } from '../api/stages';
import toast from 'react-hot-toast';

export default function StageForm({ projectId, stage, onClose, onSave }) {
  const isEdit = Boolean(stage);

  const [formData, setFormData] = useState({
    name: stage?.name || '',
    description: stage?.description || '',
    order: stage?.order ?? '',
    status: stage?.status || 'not_started',
    plannedStartDate: stage?.plannedStartDate
      ? new Date(stage.plannedStartDate).toISOString().split('T')[0]
      : '',
    plannedEndDate: stage?.plannedEndDate
      ? new Date(stage.plannedEndDate).toISOString().split('T')[0]
      : '',
  });

  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...formData,
        order: parseInt(formData.order, 10),
        plannedStartDate: formData.plannedStartDate || null,
        plannedEndDate: formData.plannedEndDate || null,
      };

      if (isEdit) {
        await updateStage(stage._id, payload);
        toast.success('Stage updated!');
      } else {
        await createStage({ ...payload, projectId });
        toast.success('Stage created!');
      }
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save stage');
    } finally {
      setSaving(false);
    }
  };

  const statusOptions = [
    { value: 'not_started', label: 'Not Started' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'delayed', label: 'Delayed' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold text-gray-900">
            {isEdit ? 'Edit Stage' : 'Add New Stage'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl font-bold leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stage Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="e.g. Foundation Work"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={2}
              placeholder="Brief description of this stage..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* Order + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Order *
              </label>
              <input
                type="number"
                name="order"
                value={formData.order}
                onChange={handleChange}
                required
                min={1}
                placeholder="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              >
                {statusOptions.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Planned Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Planned Start
              </label>
              <input
                type="date"
                name="plannedStartDate"
                value={formData.plannedStartDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm text-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Planned End
              </label>
              <input
                type="date"
                name="plannedEndDate"
                value={formData.plannedEndDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm text-gray-600"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition text-sm"
            >
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Stage'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-200 transition text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
