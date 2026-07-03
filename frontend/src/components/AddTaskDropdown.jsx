import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaClipboardList, FaPaperPlane } from 'react-icons/fa';

export default function AddTaskDropdown({ projectId }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef();
    const navigate = useNavigate();

    // Close the dropdown when clicking outside of it
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleOptionClick = (path) => {
        setIsOpen(false);
        navigate(path);
    };

    return (
        <div className="relative inline-block z-50 py-1" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition flex items-center space-x-2 font-medium shadow-sm hover:shadow-md"
            >
                <FaPlus size={14} /> <span>Add Task</span>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-[340px] bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden transform origin-top-right transition-all animate-fade-in-down">
                    <div className="p-2 space-y-1">
                        
                        {/* Option 1: Public Request */}
                        <div
                            onClick={() => handleOptionClick(`/create-request?projectId=${projectId}`)}
                            className="flex items-start p-4 hover:bg-gray-50 rounded-lg cursor-pointer transition group"
                        >
                            <div className="bg-blue-50 p-3 rounded-lg text-blue-600 group-hover:bg-blue-100 group-hover:text-blue-700 transition mr-4 flex-shrink-0">
                                <FaClipboardList size={22} />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 group-hover:text-blue-700 transition">Post Public Request</h4>
                                <p className="text-sm text-gray-500 mt-1 leading-snug">
                                    Get applications from multiple providers. Best for when you're open to offers.
                                </p>
                            </div>
                        </div>

                        <div className="border-b border-gray-100 mx-4"></div>

                        {/* Option 2: Direct Offer */}
                        <div
                            onClick={() => handleOptionClick(`/browse-providers?projectId=${projectId}`)}
                            className="flex items-start p-4 hover:bg-gray-50 rounded-lg cursor-pointer transition group"
                        >
                            <div className="bg-green-50 p-3 rounded-lg text-green-600 group-hover:bg-green-100 group-hover:text-green-700 transition mr-4 flex-shrink-0">
                                <FaPaperPlane size={22} />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 group-hover:text-green-700 transition">Send Direct Offer</h4>
                                <p className="text-sm text-gray-500 mt-1 leading-snug">
                                    Hire a specific provider directly. Best when you already know who you want.
                                </p>
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}
