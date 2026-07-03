import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaMoneyBillWave, FaCalendarAlt, FaArrowRight, FaTasks } from 'react-icons/fa';

export default function ProjectCard({ project }) {
    const navigate = useNavigate();

    const getStatusStyle = (status) => {
        switch (status) {
            case 'in-progress': return 'bg-[#EFF6FF] text-[#2A67EB] border border-[#2A67EB]/20';
            case 'completed':   return 'bg-green-50 text-green-700 border border-green-200';
            case 'on-hold':     return 'bg-amber-50 text-amber-700 border border-amber-200';
            case 'planning':    return 'bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]';
            default:            return 'bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]';
        }
    };

    let progressPercentage = 0;
    if (project.tasks) {
        const allTasks = [
            ...(project.tasks.requests || []),
            ...(project.tasks.jobOffers || [])
        ];
        if (allTasks.length > 0) {
            const completedTasks = allTasks.filter(t => t.status === 'completed');
            progressPercentage = Math.round((completedTasks.length / allTasks.length) * 100);
        }
    } else if (project.progress !== undefined) {
        progressPercentage = Math.round(project.progress);
    }

    return (
        <div 
            onClick={() => navigate(`/projects/${project._id}`)}
            className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(42,103,235,0.06)] border border-[#E2E8F0] hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(42,103,235,0.12)] transition-all cursor-pointer flex flex-col h-full group"
            style={{ fontFamily: "'Inter', sans-serif" }}
        >
            <div className="p-6 flex-grow flex flex-col">
                <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="text-lg font-extrabold text-[#0F172A] group-hover:text-[#2A67EB] transition-colors line-clamp-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        {project.name}
                    </h3>
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-widest shrink-0 ${getStatusStyle(project.status)}`}>
                        {project.status.replace('-', ' ')}
                    </span>
                </div>

                <p className="text-sm text-[#475569] line-clamp-2 leading-relaxed mb-5 flex-grow">
                    {project.description || 'No description provided.'}
                </p>

                {/* ERP Financials Row */}
                <div className="grid grid-cols-2 gap-3 mb-5 border-t border-[#F8FAFC] pt-4">
                    <div>
                        <p className="text-[10px] font-extrabold text-[#94A3B8] uppercase tracking-widest mb-1 flex items-center gap-1.5"><FaMoneyBillWave className="text-[#2A67EB]" /> Total Budget</p>
                        <p className="text-sm font-bold text-[#334155]">{project.budget ? `₹${project.budget.toLocaleString()}` : 'TBD'}</p>
                    </div>
                    <div>
                         <p className="text-[10px] font-extrabold text-[#94A3B8] uppercase tracking-widest mb-1 flex items-center gap-1.5"><FaMoneyBillWave className="text-green-500" /> Spent to Date</p>
                         <p className="text-sm font-bold text-[#334155]">₹{project.spent?.toLocaleString() || 0}</p>
                    </div>
                </div>

                <div className="space-y-1.5 mt-auto">
                    <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-[#64748B]">Project Completion</span>
                        <span className="text-[#2A67EB]">{progressPercentage}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-[#2A67EB] rounded-full transition-all duration-500"
                            style={{ width: `${progressPercentage}%` }}
                        />
                    </div>
                </div>
            </div>

            <div className="border-t border-[#E2E8F0] px-6 py-4 bg-[#F8FAFC] rounded-b-2xl group-hover:bg-[#EFF6FF] transition-colors">
                <div className="text-[#2A67EB] text-xs font-extrabold uppercase tracking-widest flex items-center justify-center gap-2">
                    Open Dashboard <FaArrowRight size={10} className="group-hover:translate-x-1 transition-transform" />
                </div>
            </div>
        </div>
    );
}
