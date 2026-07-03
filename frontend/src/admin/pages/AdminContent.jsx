import { FaShieldAlt, FaTools } from 'react-icons/fa';

export default function AdminContent() {
    return (
        <div className="max-w-4xl mx-auto space-y-8 text-center pt-20">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-6 border-4 border-white shadow-sm">
                <FaTools size={40} />
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900">Content Moderation</h1>
            
            <div className="bg-white rounded-xl shadow-sm border p-8 max-w-2xl mx-auto">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center justify-center">
                    <FaShieldAlt className="text-blue-500 mr-2" />
                    Feature Under Construction
                </h2>
                <p className="text-gray-600 leading-relaxed mb-6">
                    Direct automated flagging for Tasks and Job Offers is planned for Phase 2. 
                    Currently, please rely on the <strong>User Reports</strong> queue for moderation, 
                    where clients can report bad actors directly from their profiles.
                </p>
            </div>
        </div>
    );
}
