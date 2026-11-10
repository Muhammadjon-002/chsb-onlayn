import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { examService } from "../../services/examService";
import { resultService } from "../../services/resultService";
import { Exam, ExamResult, ExamStatus } from "../../types";
import {
  determineExamStatus,
  formatExamDate,
} from "../../utils/examCalculations";
import { Badge } from "../../components/common/Badge";
import { Button } from "../../components/common/Button";
import {
  LoadingState,
  ErrorState,
  EmptyState,
} from "../../components/common/FeedbackStates";
import {
  Clock,
  HelpCircle,
  Calendar,
  CheckCircle2,
  AlertCircle,
  PlayCircle,
  Eye,
  FileCheck2,
  Lock,
  GraduationCap,
  Sparkles,
  ArrowRight,
} from "lucide-react";

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [exams, setExams] = useState<Exam[]>([]);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [activeTab, setActiveTab] = useState<
    "all" | "available" | "upcoming" | "completed"
  >("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const [fetchedExams, fetchedResults] = await Promise.all([
        examService.getStudentExams(user),
        resultService.getStudentResults(user.id),
      ]);
      setExams(fetchedExams);
      setResults(fetchedResults);
    } catch (err: any) {
      setError(err.message || "Failed to load examinations list.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  // Compute status for each exam
  const computedExams = exams.map((exam) => {
    const hasSubmitted = results.some((r) => r.examId === exam.id);
    const resultRecord = results.find((r) => r.examId === exam.id);

    // Check if there is an active saved session
    const sessionKey = `${user.id}_${exam.id}`;
    const rawSessions = localStorage.getItem("chsb_db_sessions");
    let hasActiveSession = false;
    if (rawSessions) {
      try {
        const sessions = JSON.parse(rawSessions);
        if (sessions[sessionKey] && !sessions[sessionKey].isSubmitted) {
          hasActiveSession = true;
        }
      } catch {}
    }

    const status = determineExamStatus(exam, hasSubmitted, hasActiveSession);
    return {
      ...exam,
      computedStatus: status,
      resultRecord,
    };
  });

  // Filter based on active tab
  const filteredExams = computedExams.filter((exam) => {
    if (activeTab === "all") return true;
    if (activeTab === "available")
      return (
        exam.computedStatus === "available" ||
        exam.computedStatus === "in_progress"
      );
    if (activeTab === "upcoming") return exam.computedStatus === "upcoming";
    if (activeTab === "completed") return exam.computedStatus === "completed";
    return true;
  });

  const availableCount = computedExams.filter(
    (e) =>
      e.computedStatus === "available" || e.computedStatus === "in_progress",
  ).length;
  const upcomingCount = computedExams.filter(
    (e) => e.computedStatus === "upcoming",
  ).length;
  const completedCount = computedExams.filter(
    (e) => e.computedStatus === "completed",
  ).length;

  return (
    <div className="space-y-6">
      {/* Student Profile Overview Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-blue-500/20">
              {user.fullName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">
                  {user.fullName}
                </h2>
                <Badge variant="primary" size="sm">
                  O'quvchi / Student
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
                <span>
                  ID:{" "}
                  <strong className="text-slate-700 font-mono">
                    {user.studentId || "ST-2026-0842"}
                  </strong>
                </span>
                <span>•</span>
                <span>
                  Sinf:{" "}
                  <strong className="text-slate-700">
                    {user.className || "10-A"}
                  </strong>
                </span>
                {user.groupName && (
                  <>
                    <span>•</span>
                    <span className="text-slate-600 font-medium">
                      {user.groupName}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-100 self-start md:self-auto">
            <div className="text-right px-3 border-r border-slate-200">
              <span className="text-[11px] text-slate-400 block uppercase font-semibold">
                Topshirilgan
              </span>
              <span className="text-base font-bold text-slate-800">
                {completedCount} imtihon
              </span>
            </div>
            <div className="text-left px-3">
              <span className="text-[11px] text-slate-400 block uppercase font-semibold">
                Faol / Kutilayotgan
              </span>
              <span className="text-base font-bold text-blue-600">
                {availableCount + upcomingCount} ta
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs and Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === "all"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            <span>Barchasi</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === "all"
                  ? "bg-blue-700 text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {computedExams.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("available")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === "available"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            <span>Mavjud (Available)</span>
            {availableCount > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  activeTab === "available"
                    ? "bg-blue-700 text-white"
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                {availableCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("upcoming")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === "upcoming"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            <span>Kutilayotgan (Upcoming)</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === "upcoming"
                  ? "bg-blue-700 text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {upcomingCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("completed")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === "completed"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            <span>Topshirilgan (Completed)</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === "completed"
                  ? "bg-blue-700 text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {completedCount}
            </span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <LoadingState message="Biriktirilgan imtihonlar ro'yxati yuklanmoqda..." />
      ) : error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : filteredExams.length === 0 ? (
        <EmptyState
          title="Ushbu toifada imtihonlar mavjud emas"
          description="Hozirda tanlangan toifa bo'yicha sizga biriktirilgan faol sinovlar mavjud emas."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredExams.map((exam) => {
            const isAvail = exam.computedStatus === "available";
            const isInProg = exam.computedStatus === "in_progress";
            const isUpcom = exam.computedStatus === "upcoming";
            const isComp = exam.computedStatus === "completed";

            return (
              <div
                key={exam.id}
                className="bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
              >
                {/* Header section with Subject pill & Status */}
                <div className="p-5 pb-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60 line-clamp-1">
                      {exam.subjectName}
                    </span>

                    {/* Status Badge */}
                    {isAvail && (
                      <Badge variant="success" dot size="sm">
                        Mavjud (Available)
                      </Badge>
                    )}
                    {isInProg && (
                      <Badge variant="warning" dot size="sm">
                        Davom etmoqda
                      </Badge>
                    )}
                    {isUpcom && (
                      <Badge variant="neutral" size="sm">
                        Kutilmoqda
                      </Badge>
                    )}
                    {isComp && (
                      <Badge variant="info" size="sm">
                        Yakunlangan
                      </Badge>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-900 leading-snug line-clamp-2 mt-1">
                    {exam.title}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">
                    {exam.description || "Chora yakuniy baholash imtihoni."}
                  </p>
                </div>

                {/* Exam Meta Info */}
                <div className="px-5 py-3 bg-slate-50/60 border-y border-slate-100 text-xs text-slate-600 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Davomiyligi (Duration):
                    </span>
                    <strong className="text-slate-800 font-medium">
                      {exam.durationMinutes} daqiqa
                    </strong>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                      Savollar soni:
                    </span>
                    <strong className="text-slate-800 font-medium">
                      {exam.totalQuestions} ta savol
                    </strong>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Muddati:
                    </span>
                    <span className="text-[11px] text-slate-700">
                      {formatExamDate(exam.endDateTime)}
                    </span>
                  </div>
                </div>

                {/* Card Action footer */}
                <div className="p-4 bg-white">
                  {(isAvail || isInProg) && (
                    <Button
                      variant="primary"
                      size="md"
                      className="w-full text-xs font-semibold"
                      leftIcon={<PlayCircle className="w-4 h-4" />}
                      onClick={() => navigate(`/student/exam/${exam.id}/intro`)}
                    >
                      {isInProg
                        ? "Davom ettirish (Resume Exam)"
                        : "Imtihonni boshlash (Start Exam)"}
                    </Button>
                  )}

                  {isUpcom && (
                    <div className="flex items-center justify-center gap-2 py-2 px-3 bg-slate-100 text-slate-500 text-xs font-medium rounded-lg border border-slate-200">
                      <Lock className="w-3.5 h-3.5" />
                      <span>
                        Boshlanish vaqti: {formatExamDate(exam.startDateTime)}
                      </span>
                    </div>
                  )}

                  {isComp && (
                    <div>
                      {exam.resultRecord ? (
                        <Button
                          variant="outline"
                          size="md"
                          className="w-full text-xs font-semibold border-blue-200 text-blue-700 hover:bg-blue-50"
                          leftIcon={<Eye className="w-4 h-4" />}
                          onClick={() =>
                            navigate(
                              `/student/results/${exam.resultRecord!.id}`,
                            )
                          }
                        >
                          Natijani ko'rish ({exam.resultRecord.score}/
                          {exam.resultRecord.totalPoints} ball •{" "}
                          {Number(exam.resultRecord.percentage).toFixed(1)}%)
                        </Button>
                      ) : (
                        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-center">
                          <span className="text-[11px] text-slate-500 font-medium block">
                            Natija tayyorlanmoqda...
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
