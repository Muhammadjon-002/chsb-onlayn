import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import { SystemStats } from '../../types';
import { LoadingState, ErrorState } from '../../components/common/FeedbackStates';
import { Button } from '../../components/common/Button';
import {
  Users,
  GraduationCap,
  FileCheck2,
  CheckCircle,
  Activity,
  PlusCircle,
  Award,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getDashboardStats();
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load system metrics.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingState message="Tizim statistikasi yuklanmoqda..." />;
  }

  if (error || !stats) {
    return <ErrorState message={error || 'Statistika topilmadi'} onRetry={loadStats} />;
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Ma'muriyat Boshqaruv Markazi</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            SCHOOL CHSB — Specialized Schools Agency Online Testing Administration
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin/students')}
            leftIcon={<Users className="w-3.5 h-3.5" />}
            className="text-xs"
          >
            + O'quvchi qo'shish
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/admin/exams')}
            leftIcon={<PlusCircle className="w-3.5 h-3.5" />}
            className="text-xs font-semibold"
          >
            Yangi imtihon yaratish
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">O'quvchilar</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.totalStudents}</div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Ro'yxatdan o'tgan</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">O'qituvchilar</span>
            <GraduationCap className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.totalTeachers}</div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Fan o'qituvchilari</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Jami Imtihonlar</span>
            <FileCheck2 className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.totalExaminations}</div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Bazadagi sinovlar</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Faol Sinovlar</span>
            <Activity className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-600">{stats.activeExaminations}</div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Hozir davom etmoqda</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-2xs col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Topshirilgan</span>
            <CheckCircle className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.completedExaminations}</div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">O'quvchi urinishlari</span>
        </div>
      </div>

      {/* Grid: Recent Activity & Management Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity Feed (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center justify-between">
            <span>So'nggi tizim hodisalari (Recent Activity)</span>
            <span className="text-[11px] text-slate-400 font-normal">Real-vaqt jurnali</span>
          </h3>

          <div className="space-y-3">
            {stats.recentActivity.map((act) => (
              <div
                key={act.id}
                className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                  <span className="text-slate-700 font-medium">{act.description}</span>
                </div>
                <span className="text-slate-400 shrink-0 font-mono text-[11px]">
                  {act.timeAgo}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Management Shortcuts (1 col) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Boshqaruv bo'limlari</h3>

          <div className="space-y-2">
            <button
              onClick={() => navigate('/admin/exams')}
              className="w-full p-3 rounded-xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50/50 flex items-center justify-between text-left transition-colors cursor-pointer group"
            >
              <div>
                <strong className="text-xs font-bold text-slate-800 group-hover:text-purple-900 block">
                  Imtihonlar boshqaruvi
                </strong>
                <span className="text-[11px] text-slate-500">
                  Yaratish, savollar qo'shish va nashr qilish
                </span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600" />
            </button>

            <button
              onClick={() => navigate('/admin/results')}
              className="w-full p-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 flex items-center justify-between text-left transition-colors cursor-pointer group"
            >
              <div>
                <strong className="text-xs font-bold text-slate-800 group-hover:text-blue-900 block">
                  Natijalarni e'lon qilish & Eksport
                </strong>
                <span className="text-[11px] text-slate-500">
                  O'quvchilarga natijalarni ochish va CSV yuklab olish
                </span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
            </button>

            <button
              onClick={() => navigate('/admin/students')}
              className="w-full p-3 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 flex items-center justify-between text-left transition-colors cursor-pointer group"
            >
              <div>
                <strong className="text-xs font-bold text-slate-800 group-hover:text-emerald-900 block">
                  O'quvchilar kontingenti
                </strong>
                <span className="text-[11px] text-slate-500">
                  Login/parollar generatsiyasi va sinflarga biriktirish
                </span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
            </button>

            <button
              onClick={() => navigate('/admin/classes')}
              className="w-full p-3 rounded-xl border border-slate-200 hover:border-amber-300 hover:bg-amber-50/50 flex items-center justify-between text-left transition-colors cursor-pointer group"
            >
              <div>
                <strong className="text-xs font-bold text-slate-800 group-hover:text-amber-900 block">
                  Sinflar va Yo'nalishlar
                </strong>
                <span className="text-[11px] text-slate-500">
                  10-A, 10-B, tabiiy va aniq fanlar guruhlari
                </span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
