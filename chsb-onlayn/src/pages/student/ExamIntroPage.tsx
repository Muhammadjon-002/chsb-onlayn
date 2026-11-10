import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { examService } from '../../services/examService';
import { Exam } from '../../types';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { LoadingState, ErrorState } from '../../components/common/FeedbackStates';
import {
  ShieldAlert,
  Clock,
  HelpCircle,
  FileText,
  AlertTriangle,
  CheckCircle2,
  ArrowLeft,
  Play,
  Monitor,
} from 'lucide-react';
import { formatExamDate } from '../../utils/examCalculations';

export const ExamIntroPage: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [exam, setExam] = useState<Exam | null>(null);
  const [hasAgreed, setHasAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!examId || !user) return;
    loadExam();
  }, [examId, user]);

  const loadExam = async () => {
    if (!examId || !user) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await examService.getExamForStudent(examId, user.id);
      setExam(data.exam);
    } catch (err: any) {
      setError(err.message || 'Unable to prepare examination session.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartExam = () => {
    if (!examId) return;
    navigate(`/exam/${examId}`);
  };

  if (isLoading) {
    return <LoadingState message="Imtihon ma'lumotlari tayyorlanmoqda..." />;
  }

  if (error || !exam) {
    return (
      <div className="max-w-2xl mx-auto my-8">
        <ErrorState
          title="Imtihonga kirish cheklangan"
          message={error || 'Imtihon topilmadi yoki rejalashtirilgan vaqtga to\'g\'ri kelmaydi.'}
        />
        <div className="text-center mt-4">
          <Button variant="outline" onClick={() => navigate('/student/dashboard')}>
            Asosiy sahifaga qaytish
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-4">
      {/* Back button */}
      <div className="mb-4">
        <button
          onClick={() => navigate('/student/dashboard')}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Dashboardga qaytish</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        {/* Institutional Header Banner */}
        <div className="bg-slate-900 text-white p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
            <span className="text-xs font-bold tracking-wider uppercase text-blue-400 bg-blue-950/80 px-2.5 py-1 rounded border border-blue-800">
              {exam.subjectName}
            </span>
            <span className="text-xs text-slate-400">
              Yakunlanish: {formatExamDate(exam.endDateTime)}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold leading-tight">{exam.title}</h1>
          <p className="text-xs text-slate-300 mt-2 leading-relaxed">
            {exam.description || 'Chora yakuniy summative imtihon sinovi.'}
          </p>
        </div>

        {/* Candidate Identity Block */}
        <div className="p-6 border-b border-slate-100 bg-slate-50/60">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            Nomzod ma'lumotlari (Candidate Verification)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-white rounded-lg border border-slate-200">
              <span className="text-slate-400 block text-[10px]">O'quvchi F.I.SH</span>
              <strong className="text-slate-900 font-semibold">{user?.fullName}</strong>
            </div>
            <div className="p-3 bg-white rounded-lg border border-slate-200">
              <span className="text-slate-400 block text-[10px]">Student ID</span>
              <strong className="text-slate-900 font-mono font-semibold">{user?.studentId}</strong>
            </div>
            <div className="p-3 bg-white rounded-lg border border-slate-200">
              <span className="text-slate-400 block text-[10px]">Sinf va Yo'nalish</span>
              <strong className="text-slate-900 font-semibold">{user?.className}</strong>
            </div>
            <div className="p-3 bg-white rounded-lg border border-slate-200">
              <span className="text-slate-400 block text-[10px]">Savollar soni</span>
              <strong className="text-blue-700 font-semibold">{exam.totalQuestions} ta</strong>
            </div>
          </div>
        </div>

        {/* Examination Rules & Regulations */}
        <div className="p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            <span>Imtihon qoidalari va talablari (Rules & Regulations)</span>
          </div>

          <ul className="space-y-2.5 text-xs text-slate-600 leading-relaxed">
            <li className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-[11px] mt-0.5">
                1
              </span>
              <span>
                <strong>Vaqt chegarasi:</strong> Imtihon uchun ajratilgan umumiy vaqt{' '}
                <strong className="text-slate-900">{exam.durationMinutes} daqiqa</strong>. Vaqt server
                tomonidan doimiy hisoblanadi va to'xtatib turilmaydi.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-[11px] mt-0.5">
                2
              </span>
              <span>
                <strong>Avtomatik saqlanish:</strong> Har bir tanlangan javob darhol markaziy
                serverda saqlanadi. Brauzer sahifasini yangilash belgilangan javoblarni o'chirib
                yubormaydi.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-[11px] mt-0.5">
                3
              </span>
              <span>
                <strong>Erkin navigatsiya:</strong> Siz savollar orasida erkin harakatlanishingiz,
                qiyin savollarni belgilab (flag) keyinroq qaytishingiz mumkin.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-[11px] mt-0.5">
                4
              </span>
              <span>
                <strong>Avtomatik yakunlanish:</strong> Vaqt tugashi bilan imtihon avtomatik ravishda
                yakunlanadi va saqlangan natijalar tekshiruvga yuboriladi.
              </span>
            </li>
          </ul>

          {/* Acknowledgement checkbox */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hasAgreed}
                onChange={(e) => setHasAgreed(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              <span className="text-xs text-slate-700 font-medium">
                Men imtihon qoidalari bilan to'liq tanishdim va sinovni halol topshirishga roziman.
              </span>
            </label>
          </div>

          {/* Start CTA */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <Button
              variant="outline"
              size="md"
              className="w-full sm:w-auto text-xs"
              onClick={() => navigate('/student/dashboard')}
            >
              Keyinroq topshirish
            </Button>
            <Button
              variant="primary"
              size="lg"
              disabled={!hasAgreed}
              onClick={handleStartExam}
              leftIcon={<Play className="w-4 h-4 fill-current" />}
              className="w-full sm:w-auto text-xs font-bold"
            >
              Imtihonni Boshlash (Start Examination)
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
