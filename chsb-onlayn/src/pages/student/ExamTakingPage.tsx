import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { examService } from '../../services/examService';
import { Exam, Question, StudentExamSession } from '../../types';
import { useExamTimer } from '../../hooks/useExamTimer';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { LoadingState, ErrorState } from '../../components/common/FeedbackStates';
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Flag,
  CheckCircle,
  HelpCircle,
  Maximize2,
  Minimize2,
  AlertTriangle,
  GraduationCap,
  Save,
  Check,
  RotateCcw,
} from 'lucide-react';

export const ExamTakingPage: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [exam, setExam] = useState<Exam | null>(null);
  const [session, setSession] = useState<StudentExamSession | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D'>>({});
  const [flaggedIds, setFlaggedIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveIndicator, setSaveIndicator] = useState<'saved' | 'saving' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Submission dialog
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Load examination & active session
  useEffect(() => {
    if (!examId || !user) return;
    loadExamData();
  }, [examId, user]);

  const loadExamData = async () => {
    if (!examId || !user) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await examService.getExamForStudent(examId, user.id);

      // If already submitted, redirect to result or dashboard
      if (data.session.isSubmitted) {
        navigate(`/student/results/${examId}`);
        return;
      }

      setExam(data.exam);
      setSession(data.session);
      setAnswers(data.session.answers || {});
      setFlaggedIds(data.session.flaggedQuestionIds || []);
    } catch (err: any) {
      setError(err.message || 'Failed to initialize exam session.');
    } finally {
      setIsLoading(false);
    }
  };

  // Timer hook synced with server session expiration
  const handleAutoExpire = async () => {
    if (!examId || !user || isSubmitting) return;
    // Auto-finalize attempt
    try {
      setIsSubmitting(true);
      const result = await examService.submitExam(examId, user.id);
      navigate(`/student/results/${result.id}?expired=1`);
    } catch (err) {
      console.error('Failed to auto-submit expired exam:', err);
      navigate('/student/dashboard');
    }
  };

  const timer = useExamTimer({
    expiresAtIso: session?.expiresAt,
    totalDurationMinutes: exam?.durationMinutes || 45,
    onExpire: handleAutoExpire,
    autoStart: !!session && !session.isSubmitted,
  });

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  // Answer selection handler (autosaves immediately)
  const handleSelectOption = async (optionId: 'A' | 'B' | 'C' | 'D') => {
    if (!exam || !exam.questions || !session || session.isSubmitted || !user) return;

    const currentQuestion = exam.questions[currentQuestionIndex];
    if (!currentQuestion) return;

    // Optimistic state update
    const newAnswers = { ...answers, [currentQuestion.id]: optionId };
    setAnswers(newAnswers);
    setSaveIndicator('saving');

    try {
      await examService.saveAnswer(exam.id, user.id, currentQuestion.id, optionId);
      setSaveIndicator('saved');
      setTimeout(() => setSaveIndicator(null), 1500);
    } catch (err) {
      console.error('Failed to save answer:', err);
    }
  };

  // Clear answer choice for current question
  const handleClearAnswer = async () => {
    if (!exam || !exam.questions || !session || !user) return;
    const currentQuestion = exam.questions[currentQuestionIndex];
    if (!currentQuestion) return;

    const newAnswers = { ...answers };
    delete newAnswers[currentQuestion.id];
    setAnswers(newAnswers);

    // Update in mock session
    const sessionKey = `${user.id}_${exam.id}`;
    const rawSessions = localStorage.getItem('chsb_db_sessions');
    if (rawSessions) {
      const parsed = JSON.parse(rawSessions);
      if (parsed[sessionKey]) {
        delete parsed[sessionKey].answers[currentQuestion.id];
        localStorage.setItem('chsb_db_sessions', JSON.stringify(parsed));
      }
    }
  };

  // Toggle flag / review bookmark
  const handleToggleFlag = async () => {
    if (!exam || !exam.questions || !user) return;
    const currentQuestion = exam.questions[currentQuestionIndex];
    if (!currentQuestion) return;

    try {
      const updatedFlags = await examService.toggleQuestionFlag(exam.id, user.id, currentQuestion.id);
      setFlaggedIds(updatedFlags);
    } catch (err) {
      console.error('Failed to toggle flag:', err);
    }
  };

  // Final manual submit
  const handleFinalSubmit = async () => {
    if (!exam || !user) return;
    setIsSubmitting(true);
    try {
      const result = await examService.submitExam(exam.id, user.id);
      setIsSubmitModalOpen(false);
      navigate(`/student/results/${result.id}`);
    } catch (err: any) {
      alert(err.message || 'Submission failed. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingState message="Imtihon savollari xavfsiz kanaldan yuklanmoqda..." />;
  }

  if (error || !exam || !exam.questions || exam.questions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto my-12">
        <ErrorState
          title="Imtihonni yuklashda xatolik"
          message={error || 'Savollar ro\'yxati topilmadi yoki sessiya faol emas.'}
        />
        <div className="text-center mt-4">
          <Button variant="primary" onClick={() => navigate('/student/dashboard')}>
            Dashboardga qaytish
          </Button>
        </div>
      </div>
    );
  }

  const questions = exam.questions;
  const currentQuestion = questions[currentQuestionIndex];
  const selectedOption = answers[currentQuestion.id];
  const isCurrentFlagged = flaggedIds.includes(currentQuestion.id);

  const answeredCount = Object.keys(answers).length;
  const unansweredCount = questions.length - answeredCount;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans select-none">
      {/* Institutional Exam Header */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Title & Subject */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-xs">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-950 px-2 py-0.5 rounded border border-blue-900">
                  {exam.subjectName}
                </span>
                <h1 className="text-sm sm:text-base font-bold text-white truncate max-w-xs sm:max-w-md lg:max-w-lg mt-0.5">
                  {exam.title}
                </h1>
              </div>
            </div>

            {/* Timer & Controls */}
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Auto-save status indicator */}
              <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-400">
                {saveIndicator === 'saving' && (
                  <span className="flex items-center gap-1 text-amber-400 animate-pulse">
                    <Save className="w-3.5 h-3.5" /> Saqlanmoqda...
                  </span>
                )}
                {saveIndicator === 'saved' && (
                  <span className="flex items-center gap-1 text-emerald-400">
                    <Check className="w-3.5 h-3.5" /> Saqlandi
                  </span>
                )}
                {!saveIndicator && (
                  <span className="flex items-center gap-1 text-slate-400">
                    <CheckCircle className="w-3.5 h-3.5 text-slate-500" /> Avto-saqlash faol
                  </span>
                )}
              </div>

              {/* Countdown Timer */}
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono font-bold text-sm sm:text-base transition-colors ${
                  timer.isCritical
                    ? 'bg-rose-950/80 border-rose-600 text-rose-400 animate-pulse'
                    : timer.isWarning
                    ? 'bg-amber-950/70 border-amber-600 text-amber-400'
                    : 'bg-slate-800 border-slate-700 text-white'
                }`}
                title="Qolgan vaqt (Time remaining)"
              >
                <Clock className={`w-4 h-4 ${timer.isCritical ? 'text-rose-400' : 'text-blue-400'}`} />
                <span>{timer.formattedTime}</span>
              </div>

              {/* Fullscreen toggle */}
              <button
                onClick={toggleFullscreen}
                aria-label="Toggle Fullscreen"
                className="hidden sm:flex p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              {/* Finish Exam Button */}
              <Button
                variant="danger"
                size="sm"
                onClick={() => setIsSubmitModalOpen(true)}
                className="font-bold text-xs shadow-md"
              >
                Imtihonni yakunlash
              </Button>
            </div>
          </div>
        </div>

        {/* Linear Progress bar */}
        <div className="w-full h-1 bg-slate-800">
          <div
            className={`h-full transition-all duration-300 ${
              timer.isCritical ? 'bg-rose-500' : timer.isWarning ? 'bg-amber-500' : 'bg-blue-500'
            }`}
            style={{ width: `${Math.max(2, 100 - timer.progressPercent)}%` }}
          />
        </div>
      </header>

      {/* Main Examination workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Active Question & Options (8 cols on lg) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 sm:p-8 flex flex-col justify-between min-h-[460px]">
            <div>
              {/* Question Meta Bar */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                    Savol {currentQuestion.questionNumber} / {questions.length}
                  </span>
                  <span className="text-xs text-slate-400">
                    Ball: <strong className="text-slate-700">{currentQuestion.points || 1} ball</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleToggleFlag}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      isCurrentFlagged
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-transparent'
                    }`}
                  >
                    <Flag className={`w-3.5 h-3.5 ${isCurrentFlagged ? 'fill-amber-600 text-amber-600' : ''}`} />
                    <span>{isCurrentFlagged ? 'Belgilangan (Flagged)' : 'Belgilash'}</span>
                  </button>

                  {selectedOption && (
                    <button
                      onClick={handleClearAnswer}
                      className="text-xs text-slate-400 hover:text-rose-600 flex items-center gap-1 transition-colors px-2 py-1"
                      title="Tanlangan javobni bekor qilish"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Tozalash</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Question Text */}
              <div className="text-base sm:text-lg font-medium text-slate-900 leading-relaxed tracking-normal mb-8 select-text">
                {currentQuestion.text}
              </div>

              {/* Options list */}
              <div className="space-y-3">
                {currentQuestion.options.map((option) => {
                  const isSelected = selectedOption === option.id;

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handleSelectOption(option.id)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-start gap-4 cursor-pointer group ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/70 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/60'
                      }`}
                    >
                      {/* Option letter pill */}
                      <span
                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                        }`}
                      >
                        {option.id}
                      </span>

                      {/* Option text */}
                      <span
                        className={`text-sm sm:text-base font-normal pt-1 leading-snug select-text ${
                          isSelected ? 'text-blue-950 font-medium' : 'text-slate-700'
                        }`}
                      >
                        {option.text}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Question Navigation Controls */}
            <div className="pt-8 mt-6 border-t border-slate-100 flex items-center justify-between">
              <Button
                variant="outline"
                size="md"
                disabled={currentQuestionIndex === 0}
                onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                leftIcon={<ChevronLeft className="w-4 h-4" />}
                className="text-xs"
              >
                Oldingi (Previous)
              </Button>

              <span className="text-xs text-slate-400 font-medium">
                {currentQuestionIndex + 1} / {questions.length}
              </span>

              {currentQuestionIndex < questions.length - 1 ? (
                <Button
                  variant="primary"
                  size="md"
                  onClick={() =>
                    setCurrentQuestionIndex((prev) => Math.min(questions.length - 1, prev + 1))
                  }
                  rightIcon={<ChevronRight className="w-4 h-4" />}
                  className="text-xs"
                >
                  Keyingi (Next)
                </Button>
              ) : (
                <Button
                  variant="success"
                  size="md"
                  onClick={() => setIsSubmitModalOpen(true)}
                  className="text-xs font-bold"
                >
                  Imtihonni topshirish
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Question Navigator Palette (4 cols on lg) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center justify-between">
              <span>Savollar navigatsiyasi</span>
              <span className="text-blue-600">{answeredCount}/{questions.length} belgilandi</span>
            </h3>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-blue-600 shrink-0" />
                <span>Belgilangan ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-slate-100 border border-slate-300 shrink-0" />
                <span>Belgilanmagan ({unansweredCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-amber-400 shrink-0" />
                <span>Eslab qolingan ({flaggedIds.length})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded border-2 border-blue-600 bg-white shrink-0" />
                <span>Joriy savol</span>
              </div>
            </div>

            {/* Grid Palette */}
            <div className="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-5 gap-2 max-h-[360px] overflow-y-auto p-1">
              {questions.map((q, idx) => {
                const isAnswered = !!answers[q.id];
                const isCurrent = idx === currentQuestionIndex;
                const isFlagged = flaggedIds.includes(q.id);

                let cellClass = 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100';
                if (isAnswered) {
                  cellClass = 'bg-blue-600 border-blue-600 text-white font-bold';
                }
                if (isCurrent) {
                  cellClass += ' ring-2 ring-blue-500 ring-offset-2';
                }

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setCurrentQuestionIndex(idx)}
                    className={`relative h-10 rounded-lg border text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${cellClass}`}
                    title={`Savol ${idx + 1}: ${isAnswered ? 'Javob berilgan' : 'Javob berilmagan'}`}
                  >
                    <span>{idx + 1}</span>
                    {isFlagged && (
                      <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Quick Submit Block */}
            <div className="mt-6 pt-4 border-t border-slate-100">
              <Button
                variant="danger"
                size="md"
                onClick={() => setIsSubmitModalOpen(true)}
                className="w-full text-xs font-bold"
              >
                Imtihonni yakunlash (Submit Exam)
              </Button>
            </div>
          </div>

          {/* Student session card */}
          <div className="bg-slate-50 rounded-xl border border-slate-200/80 p-4 text-xs text-slate-600 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">O'quvchi:</span>
              <strong className="text-slate-800">{user?.fullName}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">ID raqami:</span>
              <strong className="font-mono text-slate-700">{user?.studentId}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Sinf guruhi:</span>
              <span className="text-slate-800">{user?.className}</span>
            </div>
          </div>
        </div>
      </main>

      {/* Confirmation Modal before final submission */}
      <ConfirmDialog
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onConfirm={handleFinalSubmit}
        isLoading={isSubmitting}
        title="Imtihonni yakunlashni tasdiqlaysizmi?"
        description="Imtihon topshirilgandan so'ng qayta javoblarni o'zgartirib bo'lmaydi. Natijangiz markaziy baholash tizimiga yuboriladi."
        confirmText="Ha, imtihonni topshirish"
        cancelText="Qaytish va davom ettirish"
        stats={{
          total: questions.length,
          answered: answeredCount,
          unanswered: unansweredCount,
        }}
      />
    </div>
  );
};
