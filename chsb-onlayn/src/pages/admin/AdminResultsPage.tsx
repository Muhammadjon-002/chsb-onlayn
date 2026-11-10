import React, { useState, useEffect } from "react";
import { resultService } from "../../services/resultService";
import { examService } from "../../services/examService";
import { adminService } from "../../services/adminService";
import { ExamResult, Exam, ClassGroup } from "../../types";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import {
  LoadingState,
  ErrorState,
  EmptyState,
} from "../../components/common/FeedbackStates";
import { formatExamDate } from "../../utils/examCalculations";
import {
  Award,
  Download,
  Filter,
  Eye,
  EyeOff,
  CheckCircle,
  FileCheck2,
  Lock,
  Unlock,
} from "lucide-react";

export const AdminResultsPage: React.FC = () => {
  const [results, setResults] = useState<ExamResult[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [selectedExamFilter, setSelectedExamFilter] = useState("all");
  const [selectedClassFilter, setSelectedClassFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [allResults, allExams, allClasses] = await Promise.all([
        resultService.getAllResults(),
        examService.getAllExams(),
        adminService.getClasses(),
      ]);
      setResults(allResults);
      setExams(allExams);
      setClasses(allClasses);
    } catch (err: any) {
      setError(err.message || "Failed to load examination results");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleAnalysisRelease = async (
    examId: string,
    currentStatus: boolean,
  ) => {
    const nextStatus = !currentStatus;

    try {
      await resultService.toggleAnalysisRelease(examId, nextStatus);

      setExams((prev) =>
        prev.map((e) =>
          e.id === examId ? { ...e, isAnalysisReleased: nextStatus } : e,
        ),
      );

      setResults((prev) =>
        prev.map((r) =>
          r.examId === examId ? { ...r, isAnalysisReleased: nextStatus } : r,
        ),
      );
    } catch (err: any) {
      alert(err.message || "Tahlil holatini o'zgartirishda xatolik.");
    }
  };

  const handleExportCsv = () => {
    resultService.exportResultsCsv(
      filteredResults,
      "CHSB_Academic_Results_2026.csv",
    );
  };

  const filteredResults = results.filter((r) => {
    const matchExam =
      selectedExamFilter === "all" || r.examId === selectedExamFilter;
    const matchClass =
      selectedClassFilter === "all" || r.className === selectedClassFilter;
    return matchExam && matchClass;
  });

  return (
    <div className="space-y-6">
      {/* Page Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Natijalar va Baholash Nazorati
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            O'quvchilar javoblarini tekshirish, natijalarni e'lon qilish va
            hisobotlarni eksport qilish
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCsv}
          leftIcon={<Download className="w-3.5 h-3.5" />}
          className="text-xs"
        >
          CSV yuklab olish (Export)
        </Button>
      </div>

      {/* Exam Release Status Cards */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
          <span>Imtihonlar bo'yicha test tahlilini boshqarish</span>
          <span className="text-[11px] text-slate-400 font-normal">
            O'quvchilar ballarni avtomatik ko'radi. Bu sozlama faqat batafsil
            tahlilni boshqaradi.
          </span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {exams.map((ex) => (
            <div
              key={ex.id}
              className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs"
            >
              <div className="max-w-50">
                <strong className="text-slate-900 block truncate">
                  {ex.title}
                </strong>
                <span className="text-[11px] text-slate-500">
                  {ex.subjectName}
                </span>
              </div>

              <Button
                variant={ex.isAnalysisReleased ? "success" : "outline"}
                size="sm"
                onClick={() =>
                  handleToggleAnalysisRelease(
                    ex.id,
                    ex.isAnalysisReleased ?? false,
                  )
                }
                leftIcon={
                  ex.isAnalysisReleased ? (
                    <Unlock className="w-3 h-3" />
                  ) : (
                    <Lock className="w-3 h-3" />
                  )
                }
                className="text-[11px] font-semibold"
              >
                {ex.isAnalysisReleased ? "Tahlil ochiq" : "Tahlilni ochish"}
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Imtihon:</span>
            <select
              value={selectedExamFilter}
              onChange={(e) => setSelectedExamFilter(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 max-w-xs"
            >
              <option value="all">Barcha imtihonlar</option>
              {exams.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span>Sinf:</span>
            <select
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700"
            >
              <option value="all">Barcha sinflar</option>
              {classes.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <span className="text-xs text-slate-400 font-medium">
          Topilgan natijalar: <strong>{filteredResults.length} ta</strong>
        </span>
      </div>

      {/* Results Table */}
      {isLoading ? (
        <LoadingState message="O'quvchilar natijalari hisoblanmoqda..." />
      ) : error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : filteredResults.length === 0 ? (
        <EmptyState
          title="Natijalar topilmadi"
          description="Ushbu mezonlar bo'yicha hech qanday o'quvchi topshirig'i topilmadi."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="py-3.5 px-4 text-center">Tahlil holati</th>
                  <th className="py-3.5 px-4">Sinf</th>
                  <th className="py-3.5 px-4">Imtihon</th>
                  <th className="py-3.5 px-4 text-center">To'g'ri / Jami</th>
                  <th className="py-3.5 px-4 text-center">Ball</th>
                  <th className="py-3.5 px-4 text-center">Foiz</th>
                  <th className="py-3.5 px-4 text-center">E'lon holati</th>
                  <th className="py-3.5 px-4 text-right">Sana</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredResults.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <strong className="text-slate-900 block">
                        {r.studentName}
                      </strong>
                      <span className="text-[11px] font-mono text-slate-400">
                        {r.studentCode}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-bold">
                      {r.className}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate text-slate-800">
                      <div>{r.examTitle}</div>
                      <span className="text-[10px] text-blue-600 font-medium">
                        {r.subjectName}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-600">
                      {r.correctAnswers} / {r.totalQuestions}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-900">
                      {r.score} / {r.totalPoints}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`font-bold px-2 py-0.5 rounded text-xs ${
                          r.percentage >= 86
                            ? "bg-green-100 text-green-700"
                            : r.percentage >= 66
                              ? "bg-yellow-100 text-yellow-700"
                              : r.percentage >= 36
                                ? "bg-red-100 text-red-700"
                                : "bg-purple-100 text-purple-700"
                        }`}
                      >
                        {Number(r.percentage).toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {r.isAnalysisReleased ? (
                        <Badge variant="success" size="sm" dot>
                          Ochiq
                        </Badge>
                      ) : (
                        <Badge variant="neutral" size="sm">
                          Yopiq
                        </Badge>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-400 font-mono text-[11px]">
                      {formatExamDate(r.completedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
