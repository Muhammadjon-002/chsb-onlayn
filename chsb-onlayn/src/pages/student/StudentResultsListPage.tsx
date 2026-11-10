import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { resultService } from '../../services/resultService';
import { ExamResult } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { LoadingState, ErrorState, EmptyState } from '../../components/common/FeedbackStates';
import { formatExamDate } from '../../utils/examCalculations';
import { Award, Eye, Lock, CheckCircle2, Calendar, FileText } from 'lucide-react';

export const StudentResultsListPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [results, setResults] = useState<ExamResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    loadResults();
  }, [user]);

  const loadResults = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const data = await resultService.getStudentResults(user.id);
      setResults(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load results history.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingState message="Natijalar tarixi yuklanmoqda..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadResults} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Mening Natijalarim (My Exam Results)</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Topshirilgan barcha baholash sinovlari va rasmiy e'lon qilingan ballar
          </p>
        </div>
      </div>

      {results.length === 0 ? (
        <EmptyState
          title="Hozircha natijalar mavjud emas"
          description="Siz hali birorta ham imtihon topshirmagansiz."
          actionText="Imtihonlar ro'yxatiga o'tish"
          onAction={() => navigate('/student/dashboard')}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Imtihon nomi (Examination)</th>
                  <th className="py-3.5 px-4">Fan (Subject)</th>
                  <th className="py-3.5 px-4">Topshirilgan sana</th>
                  <th className="py-3.5 px-4 text-center">To'plangan ball</th>
                  <th className="py-3.5 px-4 text-center">Foiz (%)</th>
                  <th className="py-3.5 px-4 text-center">Holat</th>
                  <th className="py-3.5 px-4 text-right">Amal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {results.map((res) => (
                  <tr key={res.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 max-w-xs truncate">
                      {res.examTitle}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100 font-semibold text-[11px]">
                        {res.subjectName}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {formatExamDate(res.completedAt)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {res.isReleased ? (
                        <span className="font-bold text-slate-900">
                          {res.score} / {res.totalPoints}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal italic">Tekshiruvda</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {res.isReleased ? (
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-xs ${
                            res.percentage >= 60
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {Number(res.percentage).toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {res.isReleased ? (
                        <Badge variant="success" size="sm" dot>
                          E'lon qilingan
                        </Badge>
                      ) : (
                        <Badge variant="warning" size="sm">
                          Kutilmoqda
                        </Badge>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/student/results/${res.id}`)}
                        leftIcon={res.isReleased ? <Eye className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                        className="text-xs"
                      >
                        {res.isReleased ? 'Batafsil' : 'Holat'}
                      </Button>
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
