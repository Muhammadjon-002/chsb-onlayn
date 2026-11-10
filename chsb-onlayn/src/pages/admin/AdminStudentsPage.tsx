import React, { useState, useEffect } from "react";
import { adminService } from "../../services/adminService";
import { User, ClassGroup } from "../../types";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { Modal } from "../../components/common/Modal";
import {
  LoadingState,
  ErrorState,
  EmptyState,
} from "../../components/common/FeedbackStates";
import {
  Users,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  Key,
  Upload,
  UserCheck,
  CheckCircle,
} from "lucide-react";

export const AdminStudentsPage: React.FC = () => {
  const [students, setStudents] = useState<User[]>([]);
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClassFilter, setSelectedClassFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Partial<User> | null>(
    null,
  );
  const [formInitialPassword, setFormInitialPassword] = useState("student123");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [fetchedStudents, fetchedClasses] = await Promise.all([
        adminService.getStudents(),
        adminService.getClasses(),
      ]);
      setStudents(fetchedStudents);
      setClasses(fetchedClasses);
    } catch (err: any) {
      setError(err.message || "Failed to load students");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAdd = () => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    setEditingStudent({
      fullName: "",
      username: `student_${randomSuffix}`,
      studentId: `ST-2026-${randomSuffix}`,
      classId: classes[0]?.id || "cls-10a",
      className: classes[0]?.name || "10-A",
      groupName: classes[0]?.stream || "Exact Sciences",
      email: "",
      status: "active",
      role: "student",
    });
    setFormInitialPassword("student123");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (student: User) => {
    setEditingStudent(student);
    setFormInitialPassword("••••••••");
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Haqiqatdan ham ushbu o'quvchini o'chirmoqchimisiz?")) return;
    try {
      await adminService.deleteStudent(id);
      setStudents((prev) => prev.filter((s) => s.id !== id));
    } catch (err: any) {
      alert(err.message || "O'chirishda xatolik yuz berdi");
    }
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingStudent?.fullName || !editingStudent?.username) return;

    if (!editingStudent.id && formInitialPassword.length < 6) {
      alert("Parol kamida 6 ta belgidan iborat bo‘lishi kerak.");
      return;
    }

    setIsSaving(true);

    try {
      const selectedClass = classes.find(
        (c) => c.id === editingStudent.classId,
      );

      const payload = {
        ...editingStudent,
        email:
          editingStudent.email || `${editingStudent.username}@school-chsb.uz`,
        password: formInitialPassword,
        className: selectedClass?.name || editingStudent.className || "10-A",
        groupName: selectedClass?.stream || editingStudent.groupName,
      };

      const saved = await adminService.saveStudent(payload);

      if (editingStudent.id) {
        setStudents((prev) => prev.map((s) => (s.id === saved.id ? saved : s)));
      } else {
        setStudents((prev) => [saved, ...prev]);
      }

      setIsModalOpen(false);
    } catch (err: any) {
      alert(
        err.response?.data?.message || err.message || "Failed to save student.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Mock student batch import
  const handleBatchImport = () => {
    const sampleNames = [
      "Shaxzod Karimov",
      "Ziyoda Nurmatova",
      "Rustam Xalilov",
    ];
    const newStudents: User[] = sampleNames.map((name, i) => {
      const code = Math.floor(2000 + Math.random() * 8000);
      return {
        id: `usr-import-${Date.now()}-${i}`,
        fullName: name,
        username: `student_${code}`,
        studentId: `ST-2026-${code}`,
        classId: "cls-10a",
        className: "10-A",
        groupName: "Exact Sciences",
        email: `st_${code}@school-chsb.uz`,
        role: "student",
        status: "active",
        createdAt: new Date().toISOString(),
      };
    });

    const updated = [...newStudents, ...students];
    adminService.getStudents().then(() => {
      localStorage.setItem(
        "chsb_db_users",
        JSON.stringify([
          ...newStudents,
          ...(adminService.getStudents() as any),
        ]),
      );
    });
    setStudents(updated);
    alert(
      `Muvaffaqiyatli import qilindi: ${newStudents.length} ta yangi o'quvchi qo'shildi.`,
    );
  };

  const filteredStudents = students.filter((s) => {
    const matchQuery =
      s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.studentId &&
        s.studentId.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchClass =
      selectedClassFilter === "all" || s.className === selectedClassFilter;
    return matchQuery && matchClass;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            O'quvchilar Kontingenti
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            O'quvchilar ro'yxati, login/parol berish va sinflarga biriktirish
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBatchImport}
            leftIcon={<Upload className="w-3.5 h-3.5" />}
            className="text-xs"
          >
            Import (CSV)
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenAdd}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            className="text-xs font-semibold"
          >
            Yangi o'quvchi
          </Button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="F.I.SH, ID yoki login bo'yicha qidirish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/30"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 whitespace-nowrap">
            Sinf filtri:
          </span>
          <select
            value={selectedClassFilter}
            onChange={(e) => setSelectedClassFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700"
          >
            <option value="all">Barcha sinflar</option>
            {classes.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name} ({c.stream || "Umumiy"})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Students Table */}
      {isLoading ? (
        <LoadingState message="O'quvchilar ma'lumotlari yuklanmoqda..." />
      ) : error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : filteredStudents.length === 0 ? (
        <EmptyState
          title="O'quvchilar topilmadi"
          description="Qidiruv talablariga mos keluvchi o'quvchi topilmadi."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="py-3.5 px-4">F.I.SH</th>
                  <th className="py-3.5 px-4">Student ID</th>
                  <th className="py-3.5 px-4">Login nomi</th>
                  <th className="py-3.5 px-4">Sinf va Yo'nalish</th>
                  <th className="py-3.5 px-4 text-center">Holat</th>
                  <th className="py-3.5 px-4 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredStudents.map((st) => (
                  <tr
                    key={st.id}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {st.fullName}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {st.studentId || "—"}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-blue-700 bg-blue-50/30">
                      {st.username}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      <span className="font-semibold text-slate-800">
                        {st.className}
                      </span>
                      {st.groupName && (
                        <span className="text-[11px] text-slate-400 block">
                          {st.groupName}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Badge
                        variant={st.status === "active" ? "success" : "danger"}
                        size="sm"
                      >
                        {st.status === "active" ? "Faol" : "Nofaol"}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(st)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                          title="Tahrirlash"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(st.id)}
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

      {/* Add / Edit Student Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          editingStudent?.id
            ? "O'quvchi ma'lumotlarini tahrirlash"
            : "Yangi o'quvchi qo'shish"
        }
        subtitle="Maktab CHSB tizimi uchun shaxsiy hisob va login yaratish"
        maxWidth="md"
      >
        <form onSubmit={handleSaveStudent} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              To'liq ismi sharifi (Full Name) *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Sardor Rahimov"
              value={editingStudent?.fullName || ""}
              onChange={(e) =>
                setEditingStudent({
                  ...editingStudent,
                  fullName: e.target.value,
                })
              }
              className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Student ID raqami *
              </label>
              <input
                type="text"
                required
                value={editingStudent?.studentId || ""}
                onChange={(e) =>
                  setEditingStudent({
                    ...editingStudent,
                    studentId: e.target.value,
                  })
                }
                className="w-full text-xs p-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tizim logini (Username) *
              </label>
              <input
                type="text"
                required
                value={editingStudent?.username || ""}
                onChange={(e) =>
                  setEditingStudent({
                    ...editingStudent,
                    username: e.target.value,
                  })
                }
                className="w-full text-xs p-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Dastlabki parol (Initial Password)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={formInitialPassword}
                onChange={(e) => setFormInitialPassword(e.target.value)}
                className="w-full text-xs p-2 border border-slate-300 rounded-lg font-mono bg-slate-50"
              />
              <span className="text-[11px] text-slate-400 whitespace-nowrap">
                Default: student123
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Biriktiriladigan sinf *
              </label>
              <select
                value={editingStudent?.classId || ""}
                onChange={(e) => {
                  const cls = classes.find((c) => c.id === e.target.value);
                  setEditingStudent({
                    ...editingStudent,
                    classId: e.target.value,
                    className: cls?.name,
                    groupName: cls?.stream,
                  });
                }}
                className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.stream})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Holati (Account Status)
              </label>
              <select
                value={editingStudent?.status || "active"}
                onChange={(e) =>
                  setEditingStudent({
                    ...editingStudent,
                    status: e.target.value as any,
                  })
                }
                className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="active">Faol (Active)</option>
                <option value="inactive">Nofaol (Inactive)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setIsModalOpen(false)}
            >
              Bekor qilish
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              isLoading={isSaving}
            >
              Saqlash
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
