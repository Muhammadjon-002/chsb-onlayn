import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { InstitutionalHeader } from '../components/common/InstitutionalHeader';
import { LayoutDashboard, FileText, CheckSquare, Users } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const TeacherLayout: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <InstitutionalHeader />

      {/* Teacher sub-bar */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2.5 gap-2">
            <div className="flex items-center space-x-1 sm:space-x-3 overflow-x-auto text-sm">
              <NavLink
                to="/teacher/dashboard"
                end
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium text-xs sm:text-sm transition-colors ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`
                }
              >
                <LayoutDashboard className="w-4 h-4 text-emerald-600" />
                <span>Dashboard</span>
              </NavLink>

              <NavLink
                to="/teacher/exams"
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium text-xs sm:text-sm transition-colors ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`
                }
              >
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>Imtihonlar (My Examinations)</span>
              </NavLink>

              <NavLink
                to="/teacher/results"
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium text-xs sm:text-sm transition-colors ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`
                }
              >
                <CheckSquare className="w-4 h-4 text-emerald-600" />
                <span>Baholar & Natijalar (Class Results)</span>
              </NavLink>
            </div>

            {user && (
              <div className="hidden md:flex items-center gap-2 text-xs text-slate-500">
                <span className="bg-emerald-100/60 text-emerald-800 px-2 py-0.5 rounded font-semibold">
                  Teacher Portal
                </span>
                <span>Assigned: 10-A, 10-B (Math)</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>

      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4">
          <p>© 2026 SCHOOL CHSB — Teacher Academic Module.</p>
        </div>
      </footer>
    </div>
  );
};
