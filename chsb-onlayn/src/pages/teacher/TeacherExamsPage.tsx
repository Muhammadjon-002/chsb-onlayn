import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { teacherService } from "../../services/teacherService";
import { examService } from "../../services/examService";
import { Exam, ClassGroup, Question } from "../../types";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { Modal } from "../../components/common/Modal";
import { adminService } from "../../services/adminService";
import { Subject } from "../../types";
import {
  LoadingState,
  ErrorState,
  EmptyState,
} from "../../components/common/FeedbackStates";
import { formatExamDate } from "../../utils/examCalculations";
import { FileText, Plus, Edit2, Trash2, Eye, HelpCircle } from "lucide-react";

export const TeacherExamsPage: React.FC = () => {
  const { user } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [assignedClasses, setAssignedClasses] = useState<ClassGroup[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Editor Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Partial<Exam> | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionMode, setQuestionMode] = useState<"manual" | "word">("manual");
  const [wordFile, setWordFile] = useState<File | null>(null);
  const [isParsingWord, setIsParsingWord] = useState(false);
  const [wordImportErrors, setWordImportErrors] = useState<string[]>([]);
  const [wordImportWarnings, setWordImportWarnings] = useState<string[]>([]);
  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [exList, clsList, subjectList] = await Promise.all([
        teacherService.getTeacherExams(user),
        teacherService.getAssignedClasses(user),
        teacherService.getSubjects(),
      ]);

      setExams(exList);
      setAssignedClasses(clsList);
      setSubjects(subjectList);
    } catch (err: any) {
      setError(err.message || "Failed to load examinations");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreate = () => {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 3600 * 1000);

    setEditingExam({
      title: "",
      description: "O'qituvchi nazorat testi.",
      targetClassIds: assignedClasses.map((c) => c.id).slice(0, 1),
      startDateTime: now.toISOString().slice(0, 16),
      endDateTime: tomorrow.toISOString().slice(0, 16),
      durationMinutes: 45,
      isPublished: false,
      createdByTeacherId: user?.id,
      createdByName: user?.fullName,
    });
    setQuestionMode("manual");
    setWordFile(null);
    setWordImportErrors([]);
    setWordImportWarnings([]);

    setQuestions([
      {
        id: `q-tch-${Date.now()}-1`,
        questionNumber: 1,
        text: "Savol matni...",
        options: [
          { id: "A", text: "Javob A" },
          { id: "B", text: "Javob B" },
          { id: "C", text: "Javob C" },
          { id: "D", text: "Javob D" },
        ],
        correctOptionId: "A",
        points: 3,
        explanation: "Yechim izohi...",
      },
    ]);

    setIsModalOpen(true);
  };
  const handleAddQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        id: `q-tch-${Date.now()}`,
        questionNumber: prev.length + 1,
        text: "",
        options: [
          { id: "A", text: "" },
          { id: "B", text: "" },
          { id: "C", text: "" },
          { id: "D", text: "" },
        ],
        correctOptionId: "A",
        points: 1,
        explanation: "",
      },
    ]);
  };
  const handleSaveExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExam?.title) return;

    if (!editingExam.targetClassIds?.length) {
      alert("Kamida bitta sinfni tanlang!");
      return;
    }

    try {
      const selectedClassNames = assignedClasses
        .filter((c) => editingExam.targetClassIds?.includes(c.id))
        .map((c) => c.name);

      const payload: Partial<Exam> = {
        ...editingExam,
        targetClassIds: editingExam.targetClassIds,
        targetClassNames: selectedClassNames,
        questions,
        totalQuestions: questions.length,
        totalPoints: questions.reduce((sum, q) => sum + (q.points || 1), 0),
      };

      const saved = await examService.saveExam(payload);

      if (editingExam.id) {
        setExams((prev) => prev.map((e) => (e.id === saved.id ? saved : e)));
      } else {
        setExams((prev) => [saved, ...prev]);
      }

      setIsModalOpen(false);
    } catch (err: any) {
      alert(
        err.response?.data?.message ||
          err.message ||
          "Failed to save examination",
      );
    }
  };

  const handleImportWord = async () => {
    if (!wordFile) {
      alert("Avval Word faylni tanlang.");
      return;
    }

    if (!wordFile.name.toLowerCase().endsWith(".docx")) {
      alert("Faqat .docx formatidagi fayl qabul qilinadi.");
      return;
    }

    if (wordFile.size > 20 * 1024 * 1024) {
      alert("Fayl hajmi 20 MB dan oshmasligi kerak.");
      return;
    }

    if (
      questions.length > 0 &&
      !window.confirm(
        "Mavjud savollar o'rniga Word faylidagi savollar yuklansinmi?",
      )
    ) {
      return;
    }

    setIsParsingWord(true);
    setWordImportErrors([]);
    setWordImportWarnings([]);

    try {
      const parsed = await examService.parseWordFile(wordFile);

      setQuestions(parsed.questions);
      setWordImportErrors(parsed.errors);
      setWordImportWarnings(parsed.warnings);

      if (parsed.questions.length === 0) {
        alert("Fayldan yaroqli savollar topilmadi.");
      } else {
        alert(`${parsed.questions.length} ta savol muvaffaqiyatli ajratildi!`);
      }
    } catch (err: any) {
      setWordImportErrors([
        err.response?.data?.message ||
          err.message ||
          "Word faylni o'qishda xatolik yuz berdi.",
      ]);
    } finally {
      setIsParsingWord(false);
      setWordFile(null);
    }
  };

  const handleTogglePublish = async (id: string) => {
    try {
      const updated = await examService.togglePublish(id);
      setExams((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    } catch (err: any) {
      alert(err.message || "Failed to update publication status");
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Mening Nazorat Sinovlarim
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Siz tuzgan imtihonlar, savollar bazasi va biriktirilgan sinflar
          </p>
        </div>

        <Button
          variant="success"
          size="sm"
          onClick={handleOpenCreate}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
          className="text-xs font-semibold"
        >
          Yangi imtihon tuzish
        </Button>
      </div>

      {isLoading ? (
        <LoadingState message="Imtihonlar yuklanmoqda..." />
      ) : error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : exams.length === 0 ? (
        <EmptyState
          title="Imtihonlar mavjud emas"
          description="Siz hali o'z sinflaringiz uchun nazorat sinovi tuzmagansiz."
          actionText="Yangi imtihon tuzish"
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Imtihon sarlavhasi</th>
                  <th className="py-3.5 px-4">Sinflar</th>
                  <th className="py-3.5 px-4">Davomiyligi</th>
                  <th className="py-3.5 px-4">Savollar</th>
                  <th className="py-3.5 px-4 text-center">Holat</th>
                  <th className="py-3.5 px-4 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {exams.map((ex) => (
                  <tr
                    key={ex.id}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="py-3.5 px-4 max-w-xs">
                      <strong className="text-slate-900 block truncate">
                        {ex.title}
                      </strong>
                      <span className="text-[11px] text-slate-400">
                        Muddat: {formatExamDate(ex.endDateTime)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      {ex.targetClassNames?.join(", ") || "10-A, 10-B"}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {ex.durationMinutes} daqiqa
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {ex.questions?.length || ex.totalQuestions} ta savol
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleTogglePublish(ex.id)}
                        className="cursor-pointer"
                      >
                        {ex.isPublished ? (
                          <Badge variant="success" size="sm" dot>
                            Faol
                          </Badge>
                        ) : (
                          <Badge variant="neutral" size="sm">
                            Qoralama
                          </Badge>
                        )}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingExam({
                            ...ex,
                            startDateTime: ex.startDateTime.slice(0, 16),
                            endDateTime: ex.endDateTime.slice(0, 16),
                          });
                          setQuestions(ex.questions || []);
                          setQuestionMode("manual");
                          setWordFile(null);
                          setWordImportErrors([]);
                          setWordImportWarnings([]);
                          setIsModalOpen(true);
                        }}
                        className="text-xs"
                      >
                        Tahrirlash
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Teacher Exam Creator Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          editingExam?.id ? "Imtihonni tahrirlash" : "Yangi imtihon tuzish"
        }
        subtitle="Sinf uchun savollar va muddatlarni belgilang"
        maxWidth="xl"
      >
        <form onSubmit={handleSaveExam} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Imtihon sarlavhasi *
            </label>
            <input
              type="text"
              required
              value={editingExam?.title || ""}
              onChange={(e) =>
                setEditingExam({ ...editingExam, title: e.target.value })
              }
              className="w-full text-xs p-2 border border-slate-300 rounded-lg"
              placeholder="e.g. Matematika: 1-Oraliq nazorat ishi"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Davomiyligi (Daqiqa)
              </label>
              <input
                type="number"
                min="10"
                max="120"
                required
                value={editingExam?.durationMinutes || 45}
                onChange={(e) =>
                  setEditingExam({
                    ...editingExam,
                    durationMinutes: Number(e.target.value),
                  })
                }
                className="w-full text-xs p-2 border border-slate-300 rounded-lg"
              />
            </div>

            {/* Target Classes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mo'ljallangan sinflar:
              </label>

              <div className="flex flex-wrap gap-2">
                {assignedClasses.map((c) => {
                  const isChecked = editingExam?.targetClassIds?.includes(c.id);

                  return (
                    <label
                      key={c.id}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium border cursor-pointer select-none transition-colors ${
                        isChecked
                          ? "bg-blue-600 border-blue-600 text-white"
                          : "bg-white border-slate-200 text-slate-700"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={!!isChecked}
                        onChange={(e) => {
                          const currentIds = editingExam?.targetClassIds || [];

                          if (e.target.checked) {
                            setEditingExam({
                              ...editingExam,
                              targetClassIds: [...currentIds, c.id],
                            });
                          } else {
                            setEditingExam({
                              ...editingExam,
                              targetClassIds: currentIds.filter(
                                (id) => id !== c.id,
                              ),
                            });
                          }
                        }}
                      />

                      <span>{c.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Fan *
              </label>

              <select
                required
                value={editingExam?.subjectId || ""}
                onChange={(e) => {
                  const subject = subjects.find((s) => s.id === e.target.value);

                  setEditingExam({
                    ...editingExam,
                    subjectId: e.target.value,
                    subjectName: subject?.name || "",
                  });
                }}
                className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="">Fanni tanlang</option>

                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3">
            {/* Question creation mode */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                type="button"
                onClick={() => setQuestionMode("manual")}
                className={`p-3 rounded-xl border text-left transition-all ${
                  questionMode === "manual"
                    ? "border-blue-500 bg-blue-50"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="font-bold text-sm text-slate-800">
                  ✏️ Oddiy yaratish
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Savollarni qo'lda kiriting
                </p>
              </button>

              <button
                type="button"
                onClick={() => setQuestionMode("word")}
                className={`p-3 rounded-xl border text-left transition-all ${
                  questionMode === "word"
                    ? "border-blue-500 bg-blue-50"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="font-bold text-sm text-slate-800">
                  📄 Word fayldan
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  DOCX fayldan savollar ajratish
                </p>
              </button>
            </div>
            {questionMode === "word" && (
              <div className="mb-4 p-4 border border-blue-200 bg-blue-50 rounded-xl">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Word (.docx) faylni tanlang
                </label>

                <input
                  type="file"
                  accept=".docx"
                  onChange={(e) => setWordFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-slate-600"
                />

                {wordFile && (
                  <p className="text-xs text-slate-600 mt-2">
                    Tanlangan fayl: {wordFile.name}
                  </p>
                )}

                <Button
                  type="button"
                  onClick={handleImportWord}
                  disabled={!wordFile || isParsingWord}
                  className="mt-3"
                >
                  {isParsingWord
                    ? "Yuklanmoqda..."
                    : "Savollarni ajratib olish"}
                </Button>

                {wordImportErrors.length > 0 && (
                  <div className="mt-3 text-sm text-red-600">
                    {wordImportErrors.map((error, index) => (
                      <p key={index}>{error}</p>
                    ))}
                  </div>
                )}

                {wordImportWarnings.length > 0 && (
                  <div className="mt-3 text-sm text-amber-600">
                    {wordImportWarnings.map((warning, index) => (
                      <p key={index}>{warning}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
            <span className="block text-xs font-bold text-slate-700 mb-2">
              Savol matni va to'g'ri javob kaliti
            </span>
            {questionMode === "manual" &&
              questions.map((q, idx) => (
                <div
                  key={q.id}
                  className="p-3 bg-slate-50 rounded-lg border border-slate-200 mb-2 space-y-2"
                >
                  <input
                    type="text"
                    required
                    placeholder={`Savol #${idx + 1} matni...`}
                    value={q.text}
                    onChange={(e) => {
                      const updated = [...questions];
                      updated[idx].text = e.target.value;
                      setQuestions(updated);
                    }}
                    className="w-full text-xs p-2 bg-white border border-slate-300 rounded"
                  />
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {q.options.map((opt, oIdx) => (
                      <div key={opt.id} className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...questions];
                            updated[idx].correctOptionId = opt.id;
                            setQuestions(updated);
                          }}
                          className={`w-6 h-6 rounded font-bold text-xs shrink-0 ${
                            q.correctOptionId === opt.id
                              ? "bg-emerald-600 text-white"
                              : "bg-slate-200 text-slate-700"
                          }`}
                        >
                          {opt.id}
                        </button>
                        <input
                          type="text"
                          required
                          placeholder={`Variant ${opt.id}...`}
                          value={opt.text}
                          onChange={(e) => {
                            const updated = [...questions];
                            updated[idx].options[oIdx].text = e.target.value;
                            setQuestions(updated);
                          }}
                          className="w-full text-xs p-1 border border-slate-200 rounded bg-white"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            {questionMode === "word" && questions.length > 0 && (
              <div className="space-y-3">
                <div className="text-sm font-bold text-slate-700">
                  Import qilingan savollar ({questions.length} ta)
                </div>

                {questions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="p-3 bg-slate-50 rounded-lg border border-slate-200"
                  >
                    <p className="text-sm font-semibold text-slate-800 mb-2">
                      {idx + 1}. {q.text}
                    </p>

                    <div className="grid grid-cols-2 gap-2">
                      {q.options.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setQuestions((prev) =>
                              prev.map((item) =>
                                item.id === q.id
                                  ? { ...item, correctOptionId: opt.id }
                                  : item,
                              ),
                            );
                          }}
                          className={`text-xs p-2 rounded border text-left transition-colors ${
                            q.correctOptionId === opt.id
                              ? "bg-emerald-50 border-emerald-500 text-emerald-700 font-bold"
                              : "bg-white border-slate-200 text-slate-600 hover:border-blue-400"
                          }`}
                        >
                          {opt.id}. {opt.text}
                          {q.correctOptionId === opt.id && " ✓"}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={handleAddQuestion}
              className="w-full py-2.5 border-2 border-dashed border-emerald-300 text-emerald-700 rounded-lg text-xs font-semibold hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Savol qo‘shish
            </button>
          </div>
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setIsModalOpen(false)}
            >
              Bekor qilish
            </Button>
            <Button variant="success" size="sm" type="submit">
              Saqlash va e'lon qilish
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
