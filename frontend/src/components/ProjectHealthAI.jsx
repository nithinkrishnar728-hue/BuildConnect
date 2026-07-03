import { useState } from 'react';
import axios from 'axios';
import { FaRobot, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

export default function ProjectHealthAI({ project, tasks }) {
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleAnalyze = async () => {
        setLoading(true);
        setError(null);

        // Gather metrics
        const completedTasks = tasks.filter(t => t.status === 'completed');
        const spent = completedTasks.reduce((sum, t) => sum + (t.budget || 0), 0);
        
        const metrics = {
            totalBudget: project.budget || 0,
            amountSpent: spent,
            totalTasksCount: tasks.length,
            completedTasksCount: completedTasks.length,
            overdueTasksCount: tasks.filter(t => t.status !== 'completed' && new Date(t.deadline || t.endDate) < new Date()).length,
            projectStatus: project.status,
            daysRemaining: project.endDate ? Math.ceil((new Date(project.endDate) - new Date()) / (1000 * 60 * 60 * 24)) : 'Unknown'
        };

        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/ai/analyze-project`, {
                projectName: project.name,
                metrics
            }, { withCredentials: true });

            if (res.data.success) {
                setAnalysis(res.data.analysis);
            }
        } catch (err) {
            setError('Failed to generate AI analysis. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl shadow-lg border border-indigo-100 p-6 mb-8 relative overflow-hidden">
            {/* Background design */}
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-purple-200 rounded-full opacity-50 blur-xl"></div>
            <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-32 h-32 bg-indigo-200 rounded-full opacity-50 blur-xl"></div>

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-600 text-white p-2.5 rounded-lg shadow-md">
                            <FaRobot size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">✨ AI Health Check</h2>
                            <p className="text-sm text-indigo-800 font-medium">Powered by Gemini AI</p>
                        </div>
                    </div>
                    
                    {!analysis && !loading && (
                        <button
                            onClick={handleAnalyze}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-bold shadow-md shadow-indigo-500/30 transition flex items-center gap-2"
                        >
                            Analyze Project
                        </button>
                    )}
                </div>

                {loading && (
                    <div className="flex items-center justify-center p-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mr-3"></div>
                        <span className="text-indigo-800 font-medium animate-pulse">Running full project diagnostics...</span>
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2">
                        <FaExclamationTriangle /> {error}
                    </div>
                )}

                {analysis && !loading && (
                    <div className="bg-white/80 backdrop-blur-sm rounded-lg p-5 border border-indigo-100 shadow-inner">
                        <div className="flex items-start gap-3">
                            <FaCheckCircle className="text-green-500 mt-1 flex-shrink-0" size={18} />
                            <div className="space-y-3 text-gray-800 leading-relaxed font-medium">
                                {analysis.split('\n').filter(p => p.trim()).map((paragraph, idx) => (
                                    <p key={idx}>{paragraph}</p>
                                ))}
                            </div>
                        </div>
                        <div className="mt-4 flex justify-end">
                            <button 
                                onClick={handleAnalyze}
                                className="text-xs font-semibold text-indigo-600 hover:underline"
                            >
                                ↺ Refresh Analysis
                            </button>
                        </div>
                    </div>
                )}

                {!analysis && !loading && !error && (
                    <p className="text-gray-600 mt-2">
                        Generate a smart, executive summary of your project's health based on your current budget burn rate, schedule, and task completion metrics.
                    </p>
                )}
            </div>
        </div>
    );
}
