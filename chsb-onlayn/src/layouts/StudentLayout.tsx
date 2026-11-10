import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { InstitutionalHeader } from '../components/common/InstitutionalHeader';
import { BookOpen, Award, UserCheck, Calendar } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const StudentLayout: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <InstitutionalHeader />

      {/* Student sub-bar */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2.5 gap-2">
            <div className="flex items-center space-x-1 sm:space-x-4 overflow-x-auto text-sm">
              <NavLink
                to="/student/dashboard"
                end
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium text-xs sm:text-sm transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`
                }
              >
                <BookOpen className="w-4 h-4" />
                <span>Mening Imtihonlarim (Examinations)</span>
              </NavLink>

              <NavLink
                to="/student/results"
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium text-xs sm:text-sm transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`
                }
              >
                <Award className="w-4 h-4" />
                <span>Natijalarim (My Results)</span>
              </NavLink>
            </div>

            {user && (
              <div className="hidden md:flex items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-md text-slate-700">
                  <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                  <strong>{user.className}</strong>
                  {user.groupName && <span className="text-slate-500">({user.groupName})</span>}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>2026-2027 Academic Year</span>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main body content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>

      {/* Institutional Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4">
          <p>© 2026 SCHOOL CHSB — Specialized Schools Agency Online Testing & Assessment System.</p>
          <p className="text-[11px] text-slate-400 mt-1">All examination sessions are monitored and digitally recorded.</p>
        </div>
      </footer>
    </div>
  );
};
