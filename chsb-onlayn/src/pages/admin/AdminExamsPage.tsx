import React, { useState, useEffect } from "react";
import { adminService } from "../../services/adminService";
import { examService } from "../../services/examService";
import { Exam, Question, Subject, ClassGroup } from "../../types";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { Modal } from "../../components/common/Modal";
import {
  LoadingState,
  ErrorState,
  EmptyState,
} from "../../components/common/FeedbackStates";
import { formatExamDate } from "../../utils/examCalculations";
import {
  FileCheck2,
  Plus,
  Edit2,
  Trash2,
  Eye,
  CheckCircle,
  Clock,
  HelpCircle,
  Calendar,
  Layers,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  BookOpen,
} from "lucide-react";

export const AdminExamsPage: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Exam Editor Modal
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Partial<Exam> | null>(null);
  const [currentQuestions, setCurrentQuestions] = useState<Question[]>([]);
  // Question creation modes
  const [questionMode, setQuestionMode] = useState<"manual" | "word">("manual");

  // Word import states
  const [wordFile, setWordFile] = useState<File | null>(null);
  const [isParsingWord, setIsParsingWord] = useState(false);
  const [wordImportErrors, setWordImportErrors] = useState<string[]>([]);
  const [wordImportWarnings, setWordImportWarnings] = useState<string[]>([]);

  // Preview Modal
  const [previewExam, setPreviewExam] = useState<Exam | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [exList, subList, clsList] = await Promise.all([
        examService.getAllExams(),
        adminService.getSubjects(),
        adminService.getClasses(),
      ]);
      setExams(exList);
      setSubjects(subList);
      setClasses(clsList);
    } catch (err: any) {
      setError(err.message || "Failed to load examinations");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreate = () => {
    const defaultSub = subjects[0];
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 3600 * 1000);

    setEditingExam({
      title: "",
      subjectId: defaultSub?.id || "sub-math",
      subjectName: defaultSub?.name || "Mathematics",
      description: "Chora yakuniy baholash testi.",
      targetClassIds: classes.map((c) => c.id).slice(0, 1),
      startDateTime: now.toISOString().slice(0, 16),
      endDateTime: tomorrow.toISOString().slice(0, 16),
      durationMinutes: 45,
      passingScore: 60,
      isPublished: false,
      isAnalysisReleased: false,
      areResultsReleased: false,
    });

    setCurrentQuestions([
      {
        id: `q-${Date.now()}-1`,
        questionNumber: 1,
        text: "Savol matnini kiriting...",
        options: [
          { id: "A", text: "Variant A" },
          { id: "B", text: "Variant B" },
          { id: "C", text: "Variant C" },
          { id: "D", text: "Variant D" },
        ],
        correctOptionId: "A",
        points: 3,
        explanation: "Izoh matni...",
      },
    ]);

    setIsEditorOpen(true);
  };

  const handleOpenEdit = (exam: Exam) => {
    setEditingExam({
      ...exam,
      startDateTime: exam.startDateTime.slice(0, 16),
      endDateTime: exam.endDateTime.slice(0, 16),
    });
    setCurrentQuestions(exam.questions || []);
    setIsEditorOpen(true);
  };

  const handleTogglePublish = async (id: string) => {
    try {
      const updated = await examService.togglePublish(id);
      setExams((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    } catch (err: any) {
      alert(err.message || "Failed to toggle publication");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Haqiqatdan ham ushbu imtihonni o'chirmoqchimisiz?")) return;
    try {
      await examService.deleteExam(id);
      setExams((prev) => prev.filter((e) => e.id !== id));
    } catch (err: any) {
      alert(err.message || "Failed to delete exam");
    }
  };

  const handleAddQuestion = () => {
    const nextNum = currentQuestions.length + 1;
    setCurrentQuestions([
      ...currentQuestions,
      {
        id: `q-${Date.now()}-${nextNum}`,
        questionNumber: nextNum,
        text: "",
        options: [
          { id: "A", text: "" },
          { id: "B", text: "" },
          { id: "C", text: "" },
          { id: "D", text: "" },
        ],
        correctOptionId: "A",
        points: 3,
        explanation: "",
      },
    ]);
  };

  const handleRemoveQuestion = (idx: number) => {
    if (currentQuestions.length <= 1) {
      alert("Imtihonda kamida bitta savol bo'lishi shart.");
      return;
    }
    const updated = currentQuestions
      .filter((_, i) => i !== idx)
      .map((q, i) => ({
        ...q,
        questionNumber: i + 1,
      }));
    setCurrentQuestions(updated);
  };
  const handleImportWord = async () => {
    if (
      currentQuestions.length > 0 &&
      !window.confirm(
        "Mavjud savollar o'rniga Word faylidagi savollar yuklansinmi?",
      )
    ) {
      return;
    }
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

    setIsParsingWord(true);
    setWordImportErrors([]);
    setWordImportWarnings([]);

    try {
      const parsed = await examService.parseWordFile(wordFile);

      setCurrentQuestions(parsed.questions);
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

  const handleSaveExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExam?.title) return;

    try {
      const selectedSub = subjects.find((s) => s.id === editingExam.subjectId);
      const selectedClassNames = classes
        .filter((c) => editingExam.targetClassIds?.includes(c.id))
        .map((c) => c.name);

      const payload: Partial<Exam> = {
        ...editingExam,
        subjectName: selectedSub?.name || editingExam.subjectName,
        targetClassNames: selectedClassNames,
        questions: currentQuestions,
        totalQuestions: currentQuestions.length,
        totalPoints: currentQuestions.reduce(
          (sum, q) => sum + (q.points || 1),
          0,
        ),
      };

      const saved = await examService.saveExam(payload);
      if (editingExam.id) {
        setExams((prev) => prev.map((e) => (e.id === saved.id ? saved : e)));
      } else {
        setExams((prev) => [saved, ...prev]);
      }
      setIsEditorOpen(false);
    } catch (err: any) {
      alert(err.message || "Failed to save examination");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Imtihonlar Boshqaruvi
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Test sinovlari tuzish, savollar banki, nashr qilish va muddatlarni
            belgilash
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleOpenCreate}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
          className="text-xs font-semibold"
        >
          Yangi imtihon tuzish
        </Button>
      </div>

      {isLoading ? (
        <LoadingState message="Imtihonlar bazasi yuklanmoqda..." />
      ) : error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : exams.length === 0 ? (
        <EmptyState
          title="Imtihonlar topilmadi"
          description="Hozircha hech qanday imtihon yaratilmagan."
          actionText="Yangi imtihon yaratish"
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Imtihon nomi</th>
                  <th className="py-3.5 px-4">Fan</th>
                  <th className="py-3.5 px-4">Biriktirilgan sinflar</th>
                  <th className="py-3.5 px-4">Vaqt / Savollar</th>
                  <th className="py-3.5 px-4 text-center">Nashr holati</th>
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
                    <td className="py-3.5 px-4 text-slate-600">
                      <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-semibold text-[11px]">
                        {ex.subjectName}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      <div className="flex flex-wrap gap-1">
                        {ex.targetClassNames?.map((cn) => (
                          <span
                            key={cn}
                            className="bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded text-[10px] font-semibold"
                          >
                            {cn}
                          </span>
                        )) || "Barcha sinflar"}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div>{ex.durationMinutes} daqiqa</div>
                      <span className="text-[11px] text-slate-400">
                        {ex.questions?.length || ex.totalQuestions} ta savol (
                        {ex.totalPoints} ball)
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleTogglePublish(ex.id)}
                        className="cursor-pointer"
                        title="Nashr holatini o'zgartirish"
                      >
                        {ex.isPublished ? (
                          <Badge variant="success" size="sm" dot>
                            Faol / Nashr qilingan
                          </Badge>
                        ) : (
                          <Badge variant="neutral" size="sm">
                            Qoralama (Unpublished)
                          </Badge>
                        )}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setPreviewExam(ex)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                          title="Savollarni ko'rish / Preview"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(ex)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                          title="Tahrirlash"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(ex.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded"
                          title="O'chirish"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Full Examination Editor Modal */}
      <Modal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        title={
          editingExam?.id ? "Imtihonni tahrirlash" : "Yangi imtihon tuzish"
        }
        subtitle="Asosiy parametrlar va savollar konstruktori"
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveExam} className="space-y-6">
          {/* Question creation mode */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setQuestionMode("manual")}
              className={`p-4 rounded-xl border text-left transition-all ${
                questionMode === "manual"
                  ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500/10"
                  : "border-slate-200 bg-white hover:bg-slate-50"
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
              className={`p-4 rounded-xl border text-left transition-all ${
                questionMode === "word"
                  ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500/10"
                  : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
            >
              <div className="font-bold text-sm text-slate-800">
                📄 Word fayldan
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                DOCX fayldan avtomatik savol ajratish
              </p>
            </button>
          </div>
          {/* Word file upload */}
          {questionMode === "word" && (
            <div className="p-5 rounded-xl border border-blue-200 bg-blue-50/40 space-y-4">
              <div>
                <h4 className="text-sm font-bold text-slate-800">
                  Word fayldan savollar yuklash
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  .docx formatidagi faylni tanlang. Maksimal hajm: 20 MB.
                </p>
              </div>

              <input
                type="file"
                accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setWordFile(file);
                  setWordImportErrors([]);
                  setWordImportWarnings([]);
                }}
                className="block w-full text-xs text-slate-600
        file:mr-3 file:py-2 file:px-4
        file:rounded-lg file:border-0
        file:bg-blue-600 file:text-white
        file:font-semibold file:cursor-pointer
        hover:file:bg-blue-700"
              />

              {wordFile && (
                <div className="text-xs text-slate-600">
                  Tanlangan fayl: <strong>{wordFile.name}</strong>
                  <span className="ml-2 text-slate-400">
                    ({(wordFile.size / (1024 * 1024)).toFixed(2)} MB)
                  </span>
                </div>
              )}

              <button
                type="button"
                disabled={!wordFile || isParsingWord}
                onClick={handleImportWord}
                className="px-4 py-2 rounded-lg bg-blue-600
        text-white text-xs font-semibold
        hover:bg-blue-700 disabled:opacity-50
        disabled:cursor-not-allowed"
              >
                {isParsingWord
                  ? "Savollar ajratilmoqda..."
                  : "Word fayldan savollarni ajratish"}
              </button>

              {wordImportErrors.length > 0 && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                  <strong className="text-xs text-red-700">
                    Aniqlangan xatolar:
                  </strong>
                  {wordImportErrors.map((error, index) => (
                    <p key={index} className="text-xs text-red-600 mt-1">
                      • {error}
                    </p>
                  ))}
                </div>
              )}

              {wordImportWarnings.length > 0 && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                  <strong className="text-xs text-amber-700">
                    Ogohlantirishlar:
                  </strong>
                  {wordImportWarnings.map((warning, index) => (
                    <p key={index} className="text-xs text-amber-700 mt-1">
                      • {warning}
                    </p>
                  ))}
                </div>
              )}

              {currentQuestions.length > 0 && (
                <p className="text-xs text-emerald-700 font-semibold">
                  <CheckCircle className="w-4 h-4 inline mr-1" />
                  {currentQuestions.length} ta savol konstruktor oynasiga
                  yuklandi. Quyida tekshirishingiz mumkin.
                </p>
              )}
            </div>
          )}
          {questionMode === "word" && currentQuestions.length > 0 && (
            <div className="rounded-xl border border-green-200 bg-green-50/50 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-green-800">
                  Ajratilgan savollar
                </h3>
                <span className="text-sm font-semibold text-green-700">
                  {currentQuestions.length} ta savol
                </span>
              </div>

              {currentQuestions.map((question, index) => (
                <div
                  key={question.id}
                  className="rounded-lg border border-slate-200 bg-white p-4"
                >
                  <p className="font-semibold text-slate-800">
                    {index + 1}. {question.text}
                  </p>

                  <div className="mt-3 space-y-2">
                    {question.options.map((option) => (
                      <label
                        key={option.id}
                        className={`flex items-center gap-2 rounded-lg border p-3 cursor-pointer ${
                          option.id === question.correctOptionId
                            ? "border-green-400 bg-green-50"
                            : "border-slate-200"
                        }`}
                      >
                        <input
                          type="radio"
                          name={`correct-${question.id}`}
                          checked={question.correctOptionId === option.id}
                          onChange={() => {
                            setCurrentQuestions((prev) =>
                              prev.map((q) =>
                                q.id === question.id
                                  ? { ...q, correctOptionId: option.id }
                                  : q,
                              ),
                            );
                          }}
                        />

                        <span className="text-sm text-slate-700">
                          {option.id}) {option.text}
                        </span>

                        {question.correctOptionId === option.id && (
                          <span className="ml-auto text-xs font-bold text-green-700">
                            To‘g‘ri javob
                          </span>
                        )}
                      </label>
                    ))}
                  </div>

                  <p className="mt-2 text-xs text-slate-500">
                    Ball: {question.points}
                  </p>
                </div>
              ))}
            </div>
          )}
          {/* Section 1: Meta parameters */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              1. Imtihon parametrlari
            </h4>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Imtihon sarlavhasi (Title) *
              </label>
              <input
                type="text"
                required
                value={editingExam?.title || ""}
                onChange={(e) =>
                  setEditingExam({ ...editingExam, title: e.target.value })
                }
                className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
                placeholder="e.g. 1-Chora Yakuniy Baholash: Matematika"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Fan *
                </label>
                <select
                  value={editingExam?.subjectId || ""}
                  onChange={(e) =>
                    setEditingExam({
                      ...editingExam,
                      subjectId: e.target.value,
                    })
                  }
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Davomiyligi (Daqiqada) *
                </label>
                <input
                  type="number"
                  min="5"
                  max="180"
                  required
                  value={editingExam?.durationMinutes || 45}
                  onChange={(e) =>
                    setEditingExam({
                      ...editingExam,
                      durationMinutes: Number(e.target.value),
                    })
                  }
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Boshlanish vaqti (Start) *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={editingExam?.startDateTime || ""}
                  onChange={(e) =>
                    setEditingExam({
                      ...editingExam,
                      startDateTime: e.target.value,
                    })
                  }
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tugash vaqti (End) *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={editingExam?.endDateTime || ""}
                  onChange={(e) =>
                    setEditingExam({
                      ...editingExam,
                      endDateTime: e.target.value,
                    })
                  }
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
                />
              </div>
            </div>

            {/* Target Classes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mo'ljallangan sinflar:
              </label>
              <div className="flex flex-wrap gap-2">
                {classes.map((c) => {
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
          </div>

          {/* Section 2: Questions Builder */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  2. Savollar konstruktori ({currentQuestions.length} ta savol)
                </h4>
                <p className="text-[11px] text-slate-400">
                  Savol matni, variantlar va to'g'ri kalitni belgilang
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddQuestion}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                className="text-xs"
              >
                Savol qo'shish
              </Button>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
              {currentQuestions.map((q, qIdx) => (
                <div
                  key={q.id}
                  className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-blue-700">
                      Savol #{qIdx + 1}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">Ball:</span>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={q.points || 3}
                        onChange={(e) => {
                          const updated = [...currentQuestions];
                          updated[qIdx].points = Number(e.target.value);
                          setCurrentQuestions(updated);
                        }}
                        className="w-14 text-xs p-1 border border-slate-300 rounded text-center"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion(qIdx)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded ml-2"
                        title="Savolni o'chirish"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <input
                      type="text"
                      required
                      placeholder="Savol matnini kiriting..."
                      value={q.text}
                      onChange={(e) => {
                        const updated = [...currentQuestions];
                        updated[qIdx].text = e.target.value;
                        setCurrentQuestions(updated);
                      }}
                      className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                    />
                  </div>

                  {/* Options A, B, C, D */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {q.options.map((opt, optIdx) => {
                      const isCorrect = q.correctOptionId === opt.id;

                      return (
                        <div
                          key={opt.id}
                          className={`p-2 rounded-lg border flex items-center gap-2 ${
                            isCorrect
                              ? "bg-emerald-50 border-emerald-400"
                              : "bg-slate-50 border-slate-200"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...currentQuestions];
                              updated[qIdx].correctOptionId = opt.id;
                              setCurrentQuestions(updated);
                            }}
                            className={`w-6 h-6 rounded flex items-center justify-center font-bold text-xs shrink-0 cursor-pointer ${
                              isCorrect
                                ? "bg-emerald-600 text-white"
                                : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                            }`}
                            title="To'g'ri javob sifatida belgilash"
                          >
                            {opt.id}
                          </button>

                          <input
                            type="text"
                            required
                            placeholder={`Variant ${opt.id}...`}
                            value={opt.text}
                            onChange={(e) => {
                              const updated = [...currentQuestions];
                              updated[qIdx].options[optIdx].text =
                                e.target.value;
                              setCurrentQuestions(updated);
                            }}
                            className="w-full text-xs bg-transparent border-0 focus:outline-hidden"
                          />
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation */}
                  <div>
                    <input
                      type="text"
                      placeholder="To'g'ri javob izohi yoki yechimi (O'quvchiga natija e'lon qilinganda ko'rinadi)..."
                      value={q.explanation || ""}
                      onChange={(e) => {
                        const updated = [...currentQuestions];
                        updated[qIdx].explanation = e.target.value;
                        setCurrentQuestions(updated);
                      }}
                      className="w-full text-[11px] p-1.5 border border-slate-200 rounded text-slate-600 bg-slate-50"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 font-medium">
              <input
                type="checkbox"
                checked={editingExam?.isPublished || false}
                onChange={(e) =>
                  setEditingExam({
                    ...editingExam,
                    isPublished: e.target.checked,
                  })
                }
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span>
                Darhol o'quvchilarga e'lon qilish (Publish immediately)
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 font-medium">
              <input
                type="checkbox"
                checked={editingExam?.isAnalysisReleased ?? false}
                onChange={(e) =>
                  setEditingExam({
                    ...editingExam,
                    isAnalysisReleased: e.target.checked,
                  })
                }
                className="w-4 h-4 text-emerald-600 rounded"
              />
              <span>Test tahlilini o‘quvchilarga ochish</span>
            </label>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => setIsEditorOpen(false)}
              >
                Bekor qilish
              </Button>
              <Button variant="primary" size="sm" type="submit">
                Saqlash
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Preview Exam Modal */}
      <Modal
        isOpen={!!previewExam}
        onClose={() => setPreviewExam(null)}
        title={previewExam?.title || "Imtihon ko'rinishi"}
        subtitle={`Fan: ${previewExam?.subjectName} • ${previewExam?.questions?.length || 0} ta savol`}
        maxWidth="xl"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {previewExam?.questions?.map((q, idx) => (
            <div
              key={q.id}
              className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-800">
                  Savol #{idx + 1} ({q.points || 1} ball)
                </span>
                <span className="text-emerald-700 font-semibold bg-emerald-100 px-2 py-0.5 rounded">
                  Kalit: {q.correctOptionId}
                </span>
              </div>
              <p className="text-sm text-slate-900 font-medium mb-3">
                {q.text}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {q.options.map((opt) => (
                  <div
                    key={opt.id}
                    className={`p-2 rounded border ${
                      opt.id === q.correctOptionId
                        ? "bg-emerald-100/70 border-emerald-400 font-semibold text-emerald-950"
                        : "bg-white border-slate-200 text-slate-700"
                    }`}
                  >
                    <strong>{opt.id})</strong> {opt.text}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
};
