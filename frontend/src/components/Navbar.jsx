import { Link, useNavigate } from 'react-router-dom';
import { FaSignOutAlt, FaUser, FaPlus, FaClipboardList, FaSearch, FaHardHat, FaHome, FaExchangeAlt, FaProjectDiagram, FaCalendarAlt } from 'react-icons/fa';
import { useAuthStore } from '../store/authStore';
import NotificationBell from './NotificationBell';
import MessagesDropdown from './MessagesDropdown';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSwitchAccount = () => {
    logout();
    navigate('/login');
  };

  const isClient = user?.role === 'client';
  const isProvider = user?.role === 'worker' || user?.role === 'engineer' || user?.role === 'supervisor';
  const isSupervisor = user?.role === 'supervisor';

  return (
    <nav className="bg-[#2248A8] shadow-[0_4px_20px_rgba(34,72,168,0.15)] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-white">BuildConnect</span>
          </Link>

          <div className="hidden md:flex items-center space-x-4">
            {/* Client navigation */}
            {isClient && (
              <>
                <Link to="/browse-providers" className="text-white hover:text-blue-100 transition">
                  Find Providers
                </Link>
                <Link to="/my-requests" className="text-white hover:text-blue-100 transition flex items-center space-x-1">
                  <FaClipboardList />
                  <span>My Activity</span>
                </Link>
                <Link to="/projects" className="text-white hover:text-blue-100 transition flex items-center space-x-1">
                  <FaProjectDiagram />
                  <span>My Projects</span>
                </Link>
                <Link
                  to="/create-request"
                  className="bg-white text-[#2248A8] px-5 py-1.5 rounded-md hover:bg-blue-50 hover:shadow-[0_0_15px_rgba(255,255,255,0.4)] transition-all font-bold flex items-center space-x-2 border border-white/20 shadow-sm"
                >
                  <FaPlus className="text-sm" /> <span>Post Request</span>
                </Link>
              </>
            )}

                {isProvider && (
              <>
                {!isSupervisor && (
                  <Link to="/browse-requests" className="text-white hover:text-blue-100 transition">
                    Browse Requests
                  </Link>
                )}
                <Link to="/my-assigned-projects" className="text-white hover:text-blue-100 transition flex items-center space-x-1">
                  <FaProjectDiagram />
                  <span>My Projects</span>
                </Link>
                <Link to="/my-requests" className="text-white hover:text-blue-100 transition flex items-center space-x-1">
                  <FaClipboardList />
                  <span>My Activity</span>
                </Link>
                <Link to="/schedule" className="text-white hover:text-blue-100 transition flex items-center space-x-1">
                  <FaCalendarAlt />
                  <span>My Schedule</span>
                </Link>
              </>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <Link to="/" className="text-white hover:text-blue-100 transition" title="Home">
              <FaHome size={20} />
            </Link>
            {user && <MessagesDropdown currentUserId={user._id} />}
            {user && <NotificationBell />}
            <Link to="/profile" className="text-white hover:text-blue-100 transition" title="My Profile">
              <FaUser size={20} />
            </Link>

            <button
              onClick={handleSwitchAccount}
              className="text-white hover:text-blue-100 transition"
              title="Switch Account"
            >
              <FaExchangeAlt size={18} />
            </button>

            <button
              onClick={handleLogout}
              className="text-white hover:text-blue-100 transition"
              title="Logout"
            >
              <FaSignOutAlt size={20} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
