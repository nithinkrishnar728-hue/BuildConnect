import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuthStore } from '../store/adminAuthStore';
import { FaShieldAlt, FaLock, FaEnvelope } from 'react-icons/fa';

export default function AdminLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login, loading, error } = useAdminAuthStore();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await login(email, password);
            navigate('/admin');
        } catch (err) {
            // Error is handled by store
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8 transform transition-all">
                <div className="text-center mb-8">
                    <div className="mx-auto bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-blue-500/30">
                        <FaShieldAlt className="text-white text-2xl" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900">Admin Portal</h2>
                    <p className="text-gray-500 mt-2">Sign in to manage BuildConnect</p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm mb-6 border border-red-100 flex items-start">
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Admin Email</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FaEnvelope className="text-gray-400" />
                            </div>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                                placeholder="admin@buildconnect.com"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FaLock className="text-gray-400" />
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-500/50 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center"
                    >
                        {loading ? (
                            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            'Access Dashboard'
                        )}
                    </button>
                </form>
                
                <div className="mt-6 text-center">
                    <a href="/" className="text-sm text-gray-500 hover:text-blue-600 transition">
                        &larr; Back to main site
                    </a>
                </div>
            </div>
        </div>
    );
}
