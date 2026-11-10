import React from "react";
import { Outlet, NavLink } from "react-router-dom";
import { InstitutionalHeader } from "../components/common/InstitutionalHeader";
import {
  LayoutDashboard,
  FileCheck2,
  Users,
  GraduationCap,
  BookOpen,
  Award,
  ShieldCheck,
  UserCog,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";

export const AdminLayout: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <InstitutionalHeader />

      {/* Admin navigation bar */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between py-2 gap-2">
            <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto text-xs sm:text-sm">
              <NavLink
                to="/admin/dashboard"
                end
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition-colors ${
                    isActive
                      ? "bg-purple-50 text-purple-800 font-semibold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`
                }
              >
                <LayoutDashboard className="w-4 h-4 text-purple-600" />
                <span>Dashboard</span>
              </NavLink>

              <NavLink
                to="/admin/exams"
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition-colors ${
                    isActive
                      ? "bg-purple-50 text-purple-800 font-semibold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`
                }
              >
                <FileCheck2 className="w-4 h-4 text-purple-600" />
                <span>Examinations</span>
              </NavLink>

              <NavLink
                to="/admin/students"
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition-colors ${
                    isActive
                      ? "bg-purple-50 text-purple-800 font-semibold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`
                }
              >
                <Users className="w-4 h-4 text-purple-600" />
                <span>Students</span>
              </NavLink>

              <NavLink
                to="/admin/teachers"
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition-colors ${
                    isActive
                      ? "bg-purple-50 text-purple-800 font-semibold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`
                }
              >
                <UserCog className="w-4 h-4 text-purple-600" />
                <span>Teachers</span>
              </NavLink>
              <NavLink
                to="/admin/classes"
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition-colors ${
                    isActive
                      ? "bg-purple-50 text-purple-800 font-semibold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`
                }
              >
                <GraduationCap className="w-4 h-4 text-purple-600" />
                <span>Classes</span>
              </NavLink>

              <NavLink
                to="/admin/subjects"
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition-colors ${
                    isActive
                      ? "bg-purple-50 text-purple-800 font-semibold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`
                }
              >
                <BookOpen className="w-4 h-4 text-purple-600" />
                <span>Subjects</span>
              </NavLink>

              <NavLink
                to="/admin/results"
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition-colors ${
                    isActive
                      ? "bg-purple-50 text-purple-800 font-semibold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`
                }
              >
                <Award className="w-4 h-4 text-purple-600" />
                <span>Results & Release</span>
              </NavLink>
            </div>

            <div className="hidden lg:flex items-center gap-2 text-xs text-purple-900 bg-purple-50 px-2.5 py-1 rounded-md border border-purple-200">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
              <span>Full System Administration</span>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>

      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4">
          <p>
            © 2026 SCHOOL CHSB — Administrative Center & Examination Controller.
          </p>
        </div>
      </footer>
    </div>
  );
};
