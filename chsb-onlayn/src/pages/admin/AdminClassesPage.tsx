import React, { useState, useEffect } from "react";
import { adminService } from "../../services/adminService";
import { ClassGroup, User } from "../../types";
import { Button } from "../../components/common/Button";
import { Modal } from "../../components/common/Modal";
import {
  LoadingState,
  ErrorState,
} from "../../components/common/FeedbackStates";
import {
  GraduationCap,
  Plus,
  Users,
  Edit2,
  Layers,
  BookOpen,
} from "lucide-react";

export const AdminClassesPage: React.FC = () => {
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Class Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Partial<ClassGroup> | null>(
    null,
  );

  // Student list modal for selected class
  const [viewingStudentsClass, setViewingStudentsClass] =
    useState<ClassGroup | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [cls, std, tch] = await Promise.all([
        adminService.getClasses(),
        adminService.getStudents(),
        adminService.getTeachers(),
      ]);
      setClasses(cls);
      setStudents(std);
      setTeachers(tch);
    } catch (err: any) {
      setError(err.message || "Failed to load classes");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingClass({
      name: "",
      teacherId: "",
      grade: 10,
      stream: "Exact Sciences (Aniq fanlar)",
      academicYear: "2026-2027",
      classTeacherName: "",
      studentCount: 0,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: ClassGroup) => {
    setEditingClass(c);
    setIsModalOpen(true);
  };

  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClass?.name) return;

    try {
      const saved = await adminService.saveClass(editingClass);
      if (editingClass.id) {
        setClasses((prev) => prev.map((c) => (c.id === saved.id ? saved : c)));
      } else {
        setClasses((prev) => [...prev, saved]);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      alert(err.message || "Failed to save class");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Sinflar va Akademik Guruhlar
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Maktab sinflari, ixtisoslashgan yo'nalishlar va sinf rahbarlari
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleOpenAdd}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
          className="text-xs font-semibold"
        >
          Yangi sinf ochish
        </Button>
      </div>

      {isLoading ? (
        <LoadingState message="Sinflar ro'yxati yuklanmoqda..." />
      ) : error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {classes.map((cls) => {
            const classStudents = students.filter(
              (s) => s.classId === cls.id || s.className === cls.name,
            );

            return (
              <div
                key={cls.id}
                className="bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xl font-black text-blue-700 tracking-tight">
                      {cls.name}
                    </span>
                    <button
                      onClick={() => handleOpenEdit(cls)}
                      className="p-1 text-slate-400 hover:text-blue-600 rounded"
                      title="Sinf ma'lumotlarini tahrirlash"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1.5 mb-4">
                    <p className="font-semibold text-slate-800">
                      {cls.stream || "Umumiy ta'lim"}
                    </p>
                    <p className="text-slate-500">
                      Sinf rahbari:{" "}
                      <strong>{cls.classTeacherName || "Belgilanmagan"}</strong>
                    </p>
                    <p className="text-slate-400 text-[11px]">
                      O'quv yili: {cls.academicYear}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-blue-600" />
                    <strong>{classStudents.length} nafar o'quvchi</strong>
                  </span>

                  <button
                    onClick={() => setViewingStudentsClass(cls)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                  >
                    O'quvchilarni ko'rish →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Class Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingClass?.id ? "Sinfni tahrirlash" : "Yangi sinf yaratish"}
        maxWidth="sm"
      >
        <form onSubmit={handleSaveClass} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Sinf nomi (e.g. 10-A, 11-B) *
            </label>
            <input
              type="text"
              required
              value={editingClass?.name || ""}
              onChange={(e) =>
                setEditingClass({ ...editingClass, name: e.target.value })
              }
              className="w-full text-xs p-2 border border-slate-300 rounded-lg"
              placeholder="e.g. 10-C"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Ixtisoslashgan yo'nalish (Stream)
            </label>
            <input
              type="text"
              value={editingClass?.stream || ""}
              onChange={(e) =>
                setEditingClass({ ...editingClass, stream: e.target.value })
              }
              className="w-full text-xs p-2 border border-slate-300 rounded-lg"
              placeholder="e.g. Aniq fanlar (Matematika & Fizika)"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Sinf rahbari
            </label>

            <input
              type="text"
              value={editingClass?.classTeacherName || ""}
              onChange={(e) =>
                setEditingClass({
                  ...editingClass,
                  classTeacherName: e.target.value,
                })
              }
              placeholder="Sinf rahbarining F.I.SH.ini kiriting"
              className="w-full text-xs p-2 border border-slate-300 rounded-lg"
            />
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
            <Button variant="primary" size="sm" type="submit">
              Saqlash
            </Button>
          </div>
        </form>
      </Modal>

      {/* Students in Class Modal */}
      <Modal
        isOpen={!!viewingStudentsClass}
        onClose={() => setViewingStudentsClass(null)}
        title={`${viewingStudentsClass?.name} sinfi o'quvchilari`}
        subtitle={`${viewingStudentsClass?.stream} yo'nalishi`}
        maxWidth="lg"
      >
        <div className="space-y-3">
          {students.filter(
            (s) =>
              s.classId === viewingStudentsClass?.id ||
              s.className === viewingStudentsClass?.name,
          ).length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">
              Bu sinfga hozircha o'quvchilar biriktirilmagan.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
              {students
                .filter(
                  (s) =>
                    s.classId === viewingStudentsClass?.id ||
                    s.className === viewingStudentsClass?.name,
                )
                .map((st, i) => (
                  <div
                    key={st.id}
                    className="py-2.5 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-slate-400 font-mono w-5">
                        {i + 1}.
                      </span>
                      <div>
                        <strong className="text-slate-900 block">
                          {st.fullName}
                        </strong>
                        <span className="text-[11px] font-mono text-slate-500">
                          ID: {st.studentId}
                        </span>
                      </div>
                    </div>
                    <span className="font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-[11px]">
                      {st.username}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
