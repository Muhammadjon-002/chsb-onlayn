import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { teacherService } from '../../services/teacherService';
import { ClassGroup, Exam, ExamResult } from '../../types';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { LoadingState, ErrorState } from '../../components/common/FeedbackStates';
import { formatExamDate } from '../../utils/examCalculations';
import {
  BookOpen,
  Users,
  FileText,
  Award,
  PlusCircle,
  Clock,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

export const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    loadTeacherData();
  }, [user]);

  const loadTeacherData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [cls, exList, resList] = await Promise.all([
        teacherService.getAssignedClasses(user),
        teacherService.getTeacherExams(user),
        teacherService.getTeacherResults(user),
      ]);
      setClasses(cls);
      setExams(exList);
      setResults(resList);
    } catch (err: any) {
      setError(err.message || 'Failed to load teacher portal data');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  if (isLoading) {
    return <LoadingState message="O'qituvchi jurnali yuklanmoqda..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadTeacherData} />;
  }

  const averageScore =
    results.length > 0
      ? Math.round(results.reduce((sum, r) => sum + r.percentage, 0) / results.length)
      : 0;

  return (
    <div className="space-y-6">
      {/* Teacher Profile & Welcome banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-emerald-500/20">
            {user.fullName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">{user.fullName}</h2>
              <Badge variant="success" size="sm">
                Fan O'qituvchisi (Teacher)
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
              <span>{user.email}</span>
              <span>•</span>
              <span>Biriktirilgan fan: <strong>Matematika (Algebra & Geometriya)</strong></span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="success"
            size="sm"
            onClick={() => navigate('/teacher/exams')}
            leftIcon={<PlusCircle className="w-4 h-4" />}
            className="text-xs font-semibold"
          >
            Yangi sinov yaratish
          </Button>
        </div>
      </div>

      {/* KPI stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Biriktirilgan Sinflar
          </span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{classes.length} ta sinf</div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            {classes.map((c) => c.name).join(', ') || '10-A, 10-B'}
          </span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Mening Imtihonlarim
          </span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{exams.length} ta</div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Nazorat testlari</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            O'rtacha o'zlashtirish
          </span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{Number(averageScore).toFixed(1)}%</div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            {results.length} ta topshirilgan ish bo'yicha
          </span>
        </div>
      </div>

      {/* Assigned Classes and Active Exams Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assigned Classes */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center justify-between">
            <span>Mening biriktirilgan sinflarim</span>
            <span className="text-xs text-slate-400">Faqat ruxsat berilgan</span>
          </h3>

          <div className="space-y-3">
            {classes.map((c) => (
              <div
                key={c.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs"
              >
                <div>
                  <strong className="text-sm font-bold text-slate-900">{c.name} sinfi</strong>
                  <div className="text-slate-500 text-[11px] mt-0.5">
                    {c.stream} • {c.studentCount} o'quvchi
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/teacher/results')}
                  className="text-xs"
                >
                  Natijalarni ko'rish
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Live Examination Progress */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center justify-between">
            <span>Imtihon jarayonlari va natijalar</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/teacher/exams')}
              className="text-xs text-blue-600"
            >
              Barchasi →
            </Button>
          </h3>

          <div className="space-y-3">
            {exams.slice(0, 3).map((ex) => {
              const examSubmissions = results.filter((r) => r.examId === ex.id);

              return (
                <div
                  key={ex.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <strong className="text-slate-900 block">{ex.title}</strong>
                      <span className="text-[11px] text-slate-500">
                        Muddat: {formatExamDate(ex.endDateTime)}
                      </span>
                    </div>
                    <Badge variant={ex.isPublished ? 'success' : 'neutral'} size="sm">
                      {ex.isPublished ? 'Nashr qilingan' : 'Qoralama'}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-slate-600 pt-1 border-t border-slate-200/60">
                    <span>
                      Topshirganlar: <strong>{examSubmissions.length} nafar o'quvchi</strong>
                    </span>
                    <span className="text-blue-700 font-semibold">{ex.durationMinutes} daqiqa</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
