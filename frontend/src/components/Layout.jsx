import { useNavigate, Link } from "react-router-dom";
import {
  User,
  Calendar,
  LogOut,
  LayoutDashboard,
  Users,
  MessageSquare,
} from "lucide-react";
import { getUser, clearAuthData, isAdmin, isAgent } from "../utils/auth";
import Aurora from "./Aurora";

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const user = getUser();

  const handleLogout = () => {
    clearAuthData();
    window.location.href = "http://localhost:3000/";
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-gradient-to-b from-transparent to-slate-950">
      {/* Aurora Background - Fixed */}
      <div className="fixed inset-0 z-0">
        <Aurora
          colorStops={["#3A29FF", "#FF94B4", "#FF3232"]}
          blend={0.5}
          amplitude={1.0}
          speed={0.5}
        />
        {/* Dark gradient overlay at bottom */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-950/70 pointer-events-none"></div>
      </div>

      {/* Content Wrapper with backdrop */}
      <div className="relative z-10 min-h-screen">
        {/* Header */}
        <header
          className="bg-slate-900/60 backdrop-blur-xl shadow-lg border-b border-white/20"
          style={{
            boxShadow:
              "0 8px 32px rgba(139, 92, 246, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
          }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-xl">IS</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">
                    Insurance System
                  </h1>
                  <p className="text-xs text-gray-300">AI-Powered Solutions</p>
                </div>
              </Link>

              <nav className="flex items-center space-x-6">
                <Link
                  to="/"
                  className="flex items-center space-x-1 text-gray-200 hover:text-purple-400 transition-all duration-300 px-3 py-2 rounded-lg hover:bg-white/10 hover:backdrop-blur-sm"
                >
                  <LayoutDashboard size={20} />
                  <span>Dashboard</span>
                </Link>

                {!isAdmin() && !isAgent() && (
                  <Link
                    to="/appointments"
                    className="flex items-center space-x-1 text-gray-200 hover:text-purple-400 transition-all duration-300 px-3 py-2 rounded-lg hover:bg-white/10 hover:backdrop-blur-sm"
                  >
                    <Calendar size={20} />
                    <span>Appointments</span>
                  </Link>
                )}

                {!isAdmin() && !isAgent() && (
                  <Link
                    to="/agents"
                    className="flex items-center space-x-1 text-gray-200 hover:text-purple-400 transition-all duration-300 px-3 py-2 rounded-lg hover:bg-white/10 hover:backdrop-blur-sm"
                  >
                    <Users size={20} />
                    <span>Agents</span>
                  </Link>
                )}

                {!isAdmin() && (
                  <Link
                    to="/ai-assistant"
                    className="flex items-center space-x-1 text-gray-200 hover:text-purple-400 transition-all duration-300 px-3 py-2 rounded-lg hover:bg-white/10 hover:backdrop-blur-sm"
                  >
                    <MessageSquare size={20} />
                    <span>AI Assistant</span>
                  </Link>
                )}

                <div className="flex items-center space-x-3 ml-6 pl-6 border-l border-gray-600">
                  <div className="flex items-center space-x-2">
                    <User size={20} className="text-gray-300" />
                    <div className="text-sm">
                      <p className="font-medium text-white">{user?.fullName}</p>
                      <p className="text-xs text-gray-400">
                        {user?.roles?.[0]}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-1 text-red-400 hover:text-red-300 transition-all duration-300 px-3 py-2 rounded-lg hover:bg-red-500/10 hover:backdrop-blur-sm"
                  >
                    <LogOut size={20} />
                  </button>
                </div>
              </nav>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>

        {/* Footer */}
        <footer
          className="bg-slate-900/60 backdrop-blur-xl border-t border-white/20 mt-12"
          style={{
            boxShadow:
              "0 -8px 32px rgba(139, 92, 246, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
          }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <p className="text-center text-gray-300 text-sm">
              © 2025 Online Corporate Insurance System. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Layout;
