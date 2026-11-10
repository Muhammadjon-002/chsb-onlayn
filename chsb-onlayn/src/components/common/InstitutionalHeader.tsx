import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../types';
import { Badge } from './Badge';
import { Button } from './Button';
import {
  GraduationCap,
  LogOut,
  User as UserIcon,
  Shield,
  BookOpen,
  ChevronDown,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  minimal?: boolean; // When in strict examination mode
}

export const InstitutionalHeader: React.FC<HeaderProps> = ({ minimal = false }) => {
  const { user, role, logout, switchDemoRole } = useAuth();
  const navigate = useNavigate();
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleSwitch = async (targetRole: UserRole) => {
    setIsRoleDropdownOpen(false);
    const switchedUser = await switchDemoRole(targetRole);
    if (switchedUser.role === 'admin') navigate('/admin/dashboard');
    else if (switchedUser.role === 'teacher') navigate('/teacher/dashboard');
    else navigate('/student/dashboard');
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 select-none shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-700 flex items-center justify-center text-white shadow-xs">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-slate-900 font-sans">
                  SCHOOL <span className="text-blue-600">CHSB</span>
                </span>
                <span className="hidden sm:inline-block text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                  PIIMA v2.6
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden md:block">
                O'quvchilar bilimini baholash tizimi / Online Examination Platform
              </p>
            </div>
          </div>

          {/* User profile & actions */}
          {user && (
            <div className="flex items-center gap-3">
              {/* Quick Role Switcher Pill (Great for evaluators to test student, teacher, admin effortlessly) */}
              {!minimal && (
                <div className="relative">
                  <button
                    onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                    className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors"
                    title="Switch role for testing"
                  >
                    <Layers className="w-3.5 h-3.5 text-blue-600" />
                    <span>Role:</span>
                    <strong className="capitalize text-blue-700 font-semibold">{role}</strong>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>

                  {isRoleDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95">
                      <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                        Quick Demo Account Switcher
                      </div>
                      <button
                        onClick={() => handleSwitch('student')}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-blue-50 transition-colors ${
                          role === 'student' ? 'text-blue-700 font-semibold bg-blue-50/50' : 'text-slate-700'
                        }`}
                      >
                        <UserIcon className="w-3.5 h-3.5 text-blue-600" />
                        <div>
                          <div>Student (Sardor Rahimov)</div>
                          <div className="text-[10px] text-slate-400">Class 10-A, ST-2026-0842</div>
                        </div>
                      </button>
                      <button
                        onClick={() => handleSwitch('teacher')}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-blue-50 transition-colors ${
                          role === 'teacher' ? 'text-blue-700 font-semibold bg-blue-50/50' : 'text-slate-700'
                        }`}
                      >
                        <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                        <div>
                          <div>Teacher (Nodira Yusupova)</div>
                          <div className="text-[10px] text-slate-400">Math Dept • 10-A, 10-B</div>
                        </div>
                      </button>
                      <button
                        onClick={() => handleSwitch('admin')}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-blue-50 transition-colors ${
                          role === 'admin' ? 'text-blue-700 font-semibold bg-blue-50/50' : 'text-slate-700'
                        }`}
                      >
                        <Shield className="w-3.5 h-3.5 text-purple-600" />
                        <div>
                          <div>Administrator (Alisher K.)</div>
                          <div className="text-[10px] text-slate-400">Full Academic Dean Access</div>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* User Identity Info */}
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center">
                  {user.fullName.charAt(0)}
                </div>
                <div className="hidden lg:block text-left">
                  <div className="text-xs font-bold text-slate-800 leading-tight flex items-center gap-1.5">
                    {user.fullName}
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1">
                    {user.studentId ? (
                      <span>ID: {user.studentId} • {user.className}</span>
                    ) : (
                      <span className="capitalize">{user.role}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Sign out */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-slate-500 hover:text-rose-600"
                title="Log out from School CHSB"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
