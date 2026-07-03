import React from 'react';
import { format, parseISO } from 'date-fns';

export default function AvailabilityPreview({ preview = [], size = 'sm' }) {
    if (!preview || preview.length === 0) return null;

    const sizeClass = size === 'md' ? 'w-5 h-5' : 'w-3 h-3';

    const getStatusColor = (status) => {
        switch (status) {
            case 'available': return 'bg-[#10B981]';
            case 'busy': return 'bg-[#EF4444]';
            case 'limited': return 'bg-[#F59E0B]';
            default: return 'bg-[#CBD5E1]';
        }
    };

    return (
        <div className="flex items-center gap-3">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest shrink-0">Next 7 Days</span>
            <div className="flex gap-1 flex-wrap">
                {preview.map((day, idx) => {
                    const dateObj = parseISO(day.date);
                    const formattedDate = format(dateObj, 'MMM d');
                    const statusText = day.status.charAt(0).toUpperCase() + day.status.slice(1);

                    return (
                        <div
                            key={idx}
                            title={`${formattedDate}: ${statusText}`}
                            className={`${sizeClass} rounded-[2px] ${getStatusColor(day.status)} shadow-sm cursor-help hover:scale-110 transition-transform`}
                        ></div>
                    );
                })}
            </div>
        </div>
    );
}
