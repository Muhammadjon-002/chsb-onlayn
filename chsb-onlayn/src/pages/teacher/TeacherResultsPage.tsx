import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { teacherService } from "../../services/teacherService";
import { ExamResult, ClassGroup } from "../../types";
import { Badge } from "../../components/common/Badge";
import {
  LoadingState,
  ErrorState,
  EmptyState,
} from "../../components/common/FeedbackStates";
import { formatExamDate } from "../../utils/examCalculations";
import { Award, Filter, CheckSquare, Search } from "lucide-react";

export const TeacherResultsPage: React.FC = () => {
  const { user } = useAuth();
  const [results, setResults] = useState<ExamResult[]>([]);
  const [assignedClasses, setAssignedClasses] = useState<ClassGroup[]>([]);
  const [selectedClassFilter, setSelectedClassFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [resList, clsList] = await Promise.all([
        teacherService.getTeacherResults(user),
        teacherService.getAssignedClasses(user),
      ]);
      setResults(resList);
      setAssignedClasses(clsList);
    } catch (err: any) {
      setError(err.message || "Failed to load class results");
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  const filteredResults = results.filter((r) => {
    const matchClass =
      selectedClassFilter === "all" || r.className === selectedClassFilter;
    const matchQuery =
      r.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.examTitle.toLowerCase().includes(searchQuery.toLowerCase());
    return matchClass && matchQuery;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">
          Biriktirilgan Sinflar Baholari
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Faqat sizga biriktirilgan sinf o'quvchilarining baholash jurnali
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="O'quvchi ismi bo'yicha qidirish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500">Sinf:</span>
          <select
            value={selectedClassFilter}
            onChange={(e) => setSelectedClassFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700"
          >
            <option value="all">Barcha biriktirilgan sinflar</option>
            {assignedClasses.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name} ({c.stream})
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <LoadingState message="Baholar jurnali yuklanmoqda..." />
      ) : error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : filteredResults.length === 0 ? (
        <EmptyState
          title="Natijalar topilmadi"
          description="Ushbu sinf o'quvchilari tomonidan topshirilgan natijalar hozircha mavjud emas."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="py-3.5 px-4">O'quvchi</th>
                  <th className="py-3.5 px-4">Sinf</th>
                  <th className="py-3.5 px-4">Imtihon nomi</th>
                  <th className="py-3.5 px-4 text-center">To'g'ri javoblar</th>
                  <th className="py-3.5 px-4 text-center">Ball</th>
                  <th className="py-3.5 px-4 text-center">Foiz</th>
                  <th className="py-3.5 px-4 text-right">Topshirilgan vaqt</th>
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
                    <td className="py-3.5 px-4 font-bold text-slate-700">
                      {r.className}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate text-slate-800">
                      {r.examTitle}
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
