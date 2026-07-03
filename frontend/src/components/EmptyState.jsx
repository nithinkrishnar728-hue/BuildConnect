import React from 'react';

export default function EmptyState({ icon, title, description, message, buttonText, onClick }) {
  // Support both 'description' and 'message' props depending on where it's used
  const displayMessage = description || message;

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-xl border border-gray-100 shadow-sm col-span-full w-full min-h-[300px]">
      {icon && (
        <div className="bg-gray-50 p-6 rounded-full mb-4 inline-flex items-center justify-center pointer-events-none">
          {icon}
        </div>
      )}
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      {displayMessage && (
        <p className="text-gray-500 max-w-sm mx-auto mb-6">
          {displayMessage}
        </p>
      )}
      {buttonText && onClick && (
        <button
          onClick={onClick}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 font-medium shadow-sm transition"
        >
          {buttonText}
        </button>
      )}
    </div>
  );
}
