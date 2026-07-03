import { useState } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { FaBrain, FaSpinner, FaLeaf } from 'react-icons/fa';
import { MdConstruction } from 'react-icons/md';

const API_URL = import.meta.env.VITE_API_URL;

/**
 * Renders Gemini's markdown-lite response:
 * Converts **bold**, bullet lines (- or *), and numbered lines into styled HTML.
 */
function FormattedSuggestions({ text }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-1 text-sm text-gray-800">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-2" />;

        // Bold headings: lines like "**Category:**" or "## Heading"
        const headingMatch = trimmed.match(/^#{1,3}\s+(.+)/) || trimmed.match(/^\*\*(.+)\*\*\s*:?$/);
        if (headingMatch) {
          return (
            <p key={i} className="font-bold text-gray-900 mt-4 mb-1 text-base">
              {headingMatch[1]}
            </p>
          );
        }

        // Bullet points: lines starting with - or *
        if (/^[-*]\s+/.test(trimmed)) {
          const content = trimmed.replace(/^[-*]\s+/, '').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
          return (
            <div key={i} className="flex gap-2 ml-2">
              <span className="text-blue-500 mt-0.5 shrink-0">•</span>
              <p dangerouslySetInnerHTML={{ __html: content }} />
            </div>
          );
        }

        // Numbered lines
        if (/^\d+\.\s+/.test(trimmed)) {
          const [num, ...rest] = trimmed.split(/\.\s+/);
          const content = rest.join('. ').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
          return (
            <div key={i} className="flex gap-2 ml-2">
              <span className="text-blue-600 font-bold shrink-0">{num}.</span>
              <p dangerouslySetInnerHTML={{ __html: content }} />
            </div>
          );
        }

        // Regular inline bold
        const inlineBold = trimmed.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        return <p key={i} dangerouslySetInnerHTML={{ __html: inlineBold }} />;
      })}
    </div>
  );
}

export default function MaterialSuggestions({ project }) {
  const { user } = useAuthStore();
  const [suggestions, setSuggestions] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [projectDetails, setProjectDetails] = useState({
    description: project?.description || '',
    budget: project?.budget || '',
    location: project?.location || '',
    buildingType: '',
    floors: '',
    additionalNotes: ''
  });

  const handleChange = (e) => {
    setProjectDetails(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const fetchSuggestions = async () => {
    if (!projectDetails.description.trim()) {
      setError('Please provide at least a project description.');
      return;
    }
    setLoading(true);
    setError('');
    setSuggestions('');
    try {
      const res = await axios.post(`${API_URL}/ai/suggest-materials`, {
        projectDetails: {
          ...projectDetails,
          projectName: project?.name || 'Unnamed Project'
        }
      });
      setSuggestions(res.data.suggestions);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to get suggestions.';
      if (err.response?.status === 429) {
        setError('Rate limit reached. Please wait a moment and try again.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <FaBrain className="text-2xl" />
          <h3 className="text-xl font-bold">AI Material Suggestions</h3>
        </div>
        <p className="text-blue-100 text-sm">
          Powered by Google Gemini · Get intelligent recommendations tailored to your project's budget, location, and type.
        </p>
      </div>

      {/* Input Form */}
      <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-4">
        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
          <MdConstruction className="text-orange-500" /> Project Details
        </h4>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Project Description <span className="text-red-500">*</span>
          </label>
          <textarea
            name="description"
            value={projectDetails.description}
            onChange={handleChange}
            rows={3}
            placeholder="e.g., 3-bedroom residential house, modern style, with rooftop terrace"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Budget (₹)</label>
            <input
              type="number"
              name="budget"
              value={projectDetails.budget}
              onChange={handleChange}
              placeholder="e.g., 5000000"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location / City</label>
            <input
              type="text"
              name="location"
              value={projectDetails.location}
              onChange={handleChange}
              placeholder="e.g., Bangalore, Mumbai"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Building Type</label>
            <select
              name="buildingType"
              value={projectDetails.buildingType}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">Select type…</option>
              <option value="Residential – Independent House">Residential – Independent House</option>
              <option value="Residential – Apartment / Flat">Residential – Apartment / Flat</option>
              <option value="Commercial – Office">Commercial – Office</option>
              <option value="Commercial – Retail / Shop">Commercial – Retail / Shop</option>
              <option value="Industrial – Warehouse">Industrial – Warehouse</option>
              <option value="Industrial – Factory">Industrial – Factory</option>
              <option value="Renovation / Remodelling">Renovation / Remodelling</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Number of Floors</label>
            <input
              type="number"
              name="floors"
              value={projectDetails.floors}
              onChange={handleChange}
              placeholder="e.g., 2"
              min="1"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes (optional)</label>
          <input
            type="text"
            name="additionalNotes"
            value={projectDetails.additionalNotes}
            onChange={handleChange}
            placeholder="e.g., seismic zone, eco-friendly preference, coastal area"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        <button
          onClick={fetchSuggestions}
          disabled={loading}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition font-medium disabled:opacity-60 shadow-md"
        >
          {loading ? (
            <>
              <FaSpinner className="animate-spin" />
              Generating Suggestions…
            </>
          ) : (
            <>
              <FaBrain />
              Get AI Material Suggestions
            </>
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Suggestions Output */}
      {suggestions && (
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100 px-6 py-4 flex items-center gap-2">
            <FaLeaf className="text-green-600" />
            <h4 className="font-semibold text-green-900">AI Recommendations</h4>
            <span className="ml-auto text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">Gemini 1.5 Flash</span>
          </div>
          <div className="p-6">
            <FormattedSuggestions text={suggestions} />
          </div>
          <div className="border-t border-gray-100 px-6 py-3 bg-gray-50 text-xs text-gray-400 flex items-center gap-1">
            ⚡ AI-generated suggestions. Always verify with licensed engineers and local suppliers before procurement.
          </div>
        </div>
      )}
    </div>
  );
}
