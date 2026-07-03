import React, { useState, useEffect } from 'react';
import { format, addDays } from 'date-fns';
import { getProviderSchedule, getMySchedule } from '../api/availability';
import toast from 'react-hot-toast';

export default function AvailabilityWeekView({ 
    userId, 
    readOnly = false, 
    onDayClick,
    refreshTrigger = 0,
    renderDayContent
}) {
    const [events, setEvents] = useState([]);
    const [globalStatus, setGlobalStatus] = useState('available');
    const [loading, setLoading] = useState(true);

    const today = new Date();
    // 14 days starting from today
    const days = Array.from({ length: 14 }).map((_, i) => addDays(today, i));

    useEffect(() => {
        const fetchSchedule = async () => {
            try {
                setLoading(true);
                const startStr = format(today, 'yyyy-MM-dd');
                const endStr = format(addDays(today, 13), 'yyyy-MM-dd');
                
                let data;
                if (readOnly) {
                    // It's another provider's profile
                    const res = await getProviderSchedule(userId, startStr, endStr);
                    data = res.data;
                } else {
                    // It's the current user's own schedule
                    const res = await getMySchedule(startStr, endStr);
                    data = res.data;
                }
                
                setEvents(data.availabilitySchedule || []);
                setGlobalStatus(data.availabilityStatus || 'available');
            } catch (error) {
                console.error('Failed to load availability:', error);
                
            } finally {
                setLoading(false);
            }
        };

        if (userId || !readOnly) {
           fetchSchedule();
        }
    }, [userId, readOnly, refreshTrigger]);

    // Build quick lookup map for events by YYYY-MM-DD
    const eventMap = new Map();
    events.forEach(event => {
        const shortDate = new Date(event.date).toISOString().split('T')[0];
        eventMap.set(shortDate, event);
    });

    if (loading) {
        return (
            <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const getStatusProperties = (status) => {
        switch (status) {
            case 'available': return { color: 'bg-green-500', label: 'Available' };
            case 'busy': return { color: 'bg-red-500', label: 'Busy' };
            case 'limited': return { color: 'bg-yellow-500', label: 'Limited' };
            default: return { color: 'bg-gray-300', label: 'Unknown' };
        }
    };

    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
            {days.map(day => {
                const formattedDate = format(day, 'yyyy-MM-dd');
                const dayEvent = eventMap.get(formattedDate);
                const status = dayEvent ? dayEvent.status : globalStatus;
                const { color, label } = getStatusProperties(status);

                return (
                    <div
                        key={formattedDate}
                        onClick={() => !readOnly && onDayClick && onDayClick(formattedDate, dayEvent, status)}
                        className={`bg-white rounded-lg shadow-sm border p-4 flex flex-col items-center justify-center transition-all min-h-[140px] ${
                            !readOnly ? 'cursor-pointer hover:shadow-md hover:border-blue-300' : ''
                        }`}
                        title={dayEvent?.note || label}
                    >
                        <span className="text-gray-500 text-sm font-medium uppercase tracking-wider">
                            {format(day, 'EEE')}
                        </span>
                        <span className="text-2xl font-bold text-gray-800 my-1">
                            {format(day, 'd')}
                        </span>
                        <span className="text-gray-400 text-xs mb-3">
                            {format(day, 'MMM')}
                        </span>
                        
                        {/* Status Indicator */}
                        <div className={`w-3 h-3 rounded-full ${color} shadow-inner bg-opacity-90`}></div>
                        
                        {dayEvent?.note && (
                             <span className="mt-2 text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded truncate max-w-full text-center" title={dayEvent.note}>
                                 Note
                             </span>
                        )}

                        {renderDayContent && renderDayContent(day)}
                    </div>
                );
            })}
        </div>
    );
}
