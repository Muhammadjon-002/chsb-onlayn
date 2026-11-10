import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { resultService } from "../../services/resultService";
import { ExamResult, Exam, Question } from "../../types";
import { Badge } from "../../components/common/Badge";
import { Button } from "../../components/common/Button";
import {
  LoadingState,
  ErrorState,
} from "../../components/common/FeedbackStates";
import { formatExamDate } from "../../utils/examCalculations";
import {
  Award,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Calendar,
  Lock,
  ArrowLeft,
  Printer,
  Sparkles,
  Info,
  Check,
  X,
} from "lucide-react";

export const StudentResultPage: React.FC = () => {
  const { resultId } = useParams<{ resultId: string }>();
  const [searchParams] = useSearchParams();
  const isExpiredRedirect = searchParams.get("expired") === "1";
  const navigate = useNavigate();

  const [result, setResult] = useState<ExamResult | null>(null);
  const [exam, setExam] = useState<Exam | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!resultId) return;
    loadResultData();
  }, [resultId]);

  const loadResultData = async () => {
    if (!resultId) return;

    setIsLoading(true);
    setError(null);
    setExam(null);

    try {
      const res = await resultService.getResultById(resultId);
      setResult(res);

      if (res.isAnalysisReleased) {
        try {
          const ex = await resultService.getExamAnalysis(res.id);
          console.log("STUDENT ANSWERS:", res.studentAnswers);

          console.log(
            "EXAM QUESTION IDS:",
            ex.questions?.map((q) => q.id),
          );

          console.log(
            "SAVED ANSWER IDS:",
            Object.keys(res.studentAnswers ?? {}),
          );
          setExam(ex);
        } catch (analysisError) {
          console.error("ANALYSIS LOAD ERROR:", analysisError);     
          setExam(null);
        }
      }
    } catch (err: any) {
      setError(err.message || "Result could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return <LoadingState message="Natijalar yuklanmoqda..." />;
  }

  if (error || !result) {
    return (
      <div className="max-w-2xl mx-auto my-8">
        <ErrorState
          title="Natija topilmadi"
          message={error || "Ushbu imtihon natijasi mavjud emas."}
        />
        <div className="text-center mt-4">
          <Button
            variant="primary"
            onClick={() => navigate("/student/dashboard")}
          >
            Dashboardga qaytish
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-4 space-y-6">
      {/* Top action bar */}
      <div className="flex items-center justify-between no-print">
        <button
          onClick={() => navigate("/student/dashboard")}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Mening imtihonlarimga qaytish</span>
        </button>

        <Button
          variant="outline"
          size="sm"
          onClick={handlePrint}
          leftIcon={<Printer className="w-4 h-4" />}
          className="text-xs"
        >
          Chop etish
        </Button>
      </div>

      {/* Auto-expire notice banner if user ran out of time */}
      {isExpiredRedirect && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3 text-xs text-amber-800">
          <Info className="w-5 h-5 text-amber-600 shrink-0" />
          <span>
            <strong>Imtihon vaqti yakunlandi:</strong> Belgilangan vaqt
            tugaganligi sababli test avtomatik topshirildi va saqlangan javoblar
            hisob-kitob qilindi.
          </span>
        </div>
      )}

      {/* Primary Result Summary Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Banner */}
        <div className="bg-slate-900 text-white p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-950 px-2.5 py-1 rounded border border-blue-900">
              {result.subjectName}
            </span>
            <div className="flex items-center gap-2">
              {result.isAnalysisReleased ? (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Tahlil ochiq
                </span>
              ) : (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Tahlil yopiq
                </span>
              )}
            </div>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold">{result.examTitle}</h1>
          <p className="text-xs text-slate-300 mt-1">
            Topshirilgan sana: {formatExamDate(result.completedAt)}
          </p>
        </div>
        {/* Student details header */}
        <div className="p-6 bg-slate-50/70 border-b border-slate-200/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">
              O'quvchi
            </span>
            <strong className="text-slate-900 text-sm font-semibold">
              {result.studentName}
            </strong>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">
              Student ID
            </span>
            <strong className="font-mono text-slate-800 text-sm">
              {result.studentCode}
            </strong>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">
              Sinf guruhi
            </span>
            <strong className="text-slate-800 text-sm">
              {result.className}
            </strong>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">
              Umumiy savollar
            </span>
            <strong className="text-slate-800 text-sm">
              {result.totalQuestions} ta
            </strong>
          </div>
        </div>
        {/* Ball va natija test tugashi bilan ko'rinadi */}
        {/* Released Score Breakdown */}
        <div className="p-6 sm:p-8 space-y-8">
          {/* Score Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 block mb-1">
                To'plangan ball
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-blue-900">
                {result.score}{" "}
                <span className="text-xs font-medium text-blue-600">
                  / {result.totalPoints}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200 text-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 block mb-1">
                O'zlashtirish foizi
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-indigo-900">
                {Number(result.percentage).toFixed(1)}%
              </div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 block mb-1">
                To'g'ri javoblar
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-800">
                {result.correctAnswers}{" "}
                <span className="text-xs font-medium text-emerald-600">ta</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200 text-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 block mb-1">
                Noto'g'ri javoblar
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-rose-800">
                {result.incorrectAnswers + result.unansweredCount}{" "}
                <span className="text-xs font-medium text-rose-600">ta</span>
              </div>
            </div>
          </div>

          {/* Questions breakdown if questions are available */}
          {result.isAnalysisReleased && exam?.questions && (
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center justify-between">
                <span>Savollar bo'yicha batafsil tahlil</span>
                <span className="text-xs text-slate-500 font-normal">
                  {exam.questions.length} ta savol ko'rib chiqilmoqda
                </span>
              </h3>

              <div className="space-y-4">
                {exam.questions.map((q, idx) => {
                  const studentAns = result.studentAnswers?.[q.id];
                  const isCorrect = studentAns === q.correctOptionId;

                  return (
                    <div
                      key={q.id}
                      className={`p-5 rounded-xl border ${
                        isCorrect
                          ? "bg-emerald-50/30 border-emerald-200"
                          : "bg-rose-50/30 border-rose-200"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <span className="text-xs font-bold text-slate-700">
                          Savol {idx + 1}
                        </span>
                        {isCorrect ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                            <Check className="w-3.5 h-3.5" /> To'g'ri (+
                            {q.points} ball)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                            <X className="w-3.5 h-3.5" /> Noto'g'ri (0 ball)
                          </span>
                        )}
                      </div>

                      <p className="text-sm font-medium text-slate-900 mb-3">
                        {q.text}
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {q.options.map((opt) => {
                          const isChosen = studentAns === opt.id;
                          const isAnswerKey = q.correctOptionId === opt.id;

                          let optClass =
                            "bg-white border-slate-200 text-slate-700";
                          if (isAnswerKey) {
                            optClass =
                              "bg-emerald-100/70 border-emerald-400 font-semibold text-emerald-950";
                          } else if (isChosen && !isAnswerKey) {
                            optClass =
                              "bg-rose-100/70 border-rose-400 font-semibold text-rose-950 line-through";
                          }

                          return (
                            <div
                              key={opt.id}
                              className={`p-2.5 rounded-lg border flex items-center justify-between ${optClass}`}
                            >
                              <span>
                                <strong>{opt.id})</strong> {opt.text}
                              </span>
                              {isAnswerKey && (
                                <span className="text-[10px] text-emerald-800 font-bold uppercase">
                                  To'g'ri javob
                                </span>
                              )}
                              {isChosen && !isAnswerKey && (
                                <span className="text-[10px] text-rose-800 font-bold uppercase">
                                  Sizning javobingiz
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {q.explanation && (
                        <div className="mt-3 p-2.5 bg-slate-100/80 rounded-lg text-xs text-slate-600 border border-slate-200">
                          <strong>Izoh:</strong> {q.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {!result.isAnalysisReleased && (
            <div className="p-6 rounded-xl border border-amber-200 bg-amber-50 text-center space-y-2">
              <Lock className="w-7 h-7 text-amber-600 mx-auto" />

              <h3 className="font-bold text-slate-800">
                Test tahlili hozircha yopiq
              </h3>

              <p className="text-xs text-slate-600">
                Savollar, to‘g‘ri javoblar va batafsil izohlarni ma'muriyat
                tahlilni ochganidan so‘ng ko‘rishingiz mumkin.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
