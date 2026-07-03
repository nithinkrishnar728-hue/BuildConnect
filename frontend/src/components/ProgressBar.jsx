import React from 'react';

export default function ProgressBar({ percentage = 0, height = 'h-2', color = 'bg-blue-600', bgColor = 'bg-gray-200' }) {
    // Ensure percentage stays between 0 and 100
    const safePercentage = Math.min(Math.max(percentage, 0), 100);

    return (
        <div className={`w-full ${bgColor} rounded-full ${height}`}>
            <div
                className={`${color} ${height} rounded-full transition-all duration-500`}
                style={{ width: `${safePercentage}%` }}
            ></div>
        </div>
    );
}
