import { useEffect, useState } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function BudgetTrendChart({ projectId }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${API_URL}/projects/${projectId}/spending-timeline`, {
          withCredentials: true
        });
        setData(res.data.timeline);
      } catch (error) {
        console.error('Failed to fetch spending timeline', error);
      } finally {
        setLoading(false);
      }
    };
    if (projectId) {
      fetchData();
    }
  }, [projectId]);

  if (loading) {
    return <div className="h-[300px] w-full bg-gray-50 animate-pulse rounded-lg border border-gray-100 flex items-center justify-center text-gray-400">Loading chart...</div>;
  }

  if (data.length === 0) {
    return (
      <div className="h-[300px] w-full bg-white rounded-lg border border-gray-100 flex flex-col items-center justify-center p-8 text-center">
        <div className="bg-blue-50 p-4 rounded-full mb-3">
          <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
          </svg>
        </div>
        <p className="text-gray-900 font-medium mb-1">No Spending Data Available</p>
        <p className="text-sm text-gray-500 max-w-sm">
          Complete project tasks (Public Requests or Job Offers) to visualize cumulative project spending over time.
        </p>
      </div>
    );
  }

  // Format Y-axis to handle large currency values nicely (e.g. 15000 -> "15K")
  const formatYAxis = (value) => {
    if (value >= 1000) {
      return `₹${value / 1000}k`;
    }
    return `₹${value}`;
  };

  // Format tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 p-3 shadow-lg rounded-lg">
          <p className="font-semibold text-gray-700 mb-1">{new Date(label).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
          <p className="text-blue-600 font-bold">
            Cumulative: ₹{payload[0].value.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-gray-900 font-semibold text-lg">Budget Trend</h3>
          <p className="text-sm text-gray-500">Cumulative task spend over time</p>
        </div>
      </div>
      
      <div className="flex-grow min-h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(date) => new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} 
              stroke="#9ca3af"
              tickLine={false}
              axisLine={false}
              dy={10}
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              tickFormatter={formatYAxis} 
              stroke="#9ca3af"
              tickLine={false}
              axisLine={false}
              dx={-10}
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="cumulativeSpent" 
              stroke="#3b82f6" 
              strokeWidth={3} 
              dot={{ stroke: '#3b82f6', strokeWidth: 2, fill: '#fff', r: 4 }}
              activeDot={{ stroke: '#3b82f6', strokeWidth: 2, fill: '#3b82f6', r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
