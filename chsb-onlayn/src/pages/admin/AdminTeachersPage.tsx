import React, { useEffect, useState } from "react";
import { Subject } from "../../types";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Users,
  GraduationCap,
  UserCog,
  Save,
  Loader2,
} from "lucide-react";
import { adminService } from "../../services/adminService";
import type { User, ClassGroup } from "../../types";

interface Teacher extends User {
  classes?: {
    id: string;
    name: string;
    grade: number;
    stream?: string | null;
  }[];
  subjects?: {
    id: string;
    name: string;
    code: string;
  }[];
}

export const AdminTeachersPage: React.FC = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

  const [form, setForm] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
    status: "active" as "active" | "inactive",
  });

  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);

  const loadData = async () => {
    try {
      setLoading(true);

      const [teacherData, classData, subjectData] = await Promise.all([
        adminService.getTeachers(),
        adminService.getClasses(),
        adminService.getSubjects(),
      ]);

      setTeachers(teacherData as Teacher[]);
      setClasses(classData);
      setAllSubjects(subjectData);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Ma’lumotlarni yuklashda xatolik.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setForm({
      fullName: "",
      username: "",
      email: "",
      password: "",
      status: "active",
    });
    setSelectedClasses([]);
    setEditingId(null);
    setShowForm(false);
    setError("");
  };

  const openEdit = (teacher: Teacher) => {
    setEditingId(teacher.id);
    setForm({
      fullName: teacher.fullName,
      username: teacher.username,
      email: teacher.email,
      password: "",
      status: teacher.status as "active" | "inactive",
    });
    setSelectedClasses(teacher.classes?.map((c) => c.id) || []);
    setSelectedSubjects(teacher.subjects?.map((s) => s.id) || []);
    setShowForm(true);
    setError("");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!editingId && form.password.length < 6) {
      setError("Parol kamida 6 ta belgidan iborat bo‘lishi kerak.");
      return;
    }

    try {
      setSaving(true);

      const payload: any = {
        fullName: form.fullName.trim(),
        username: form.username.trim(),
        email: form.email.trim(),
        status: form.status,
      };

      if (!editingId) {
        payload.password = form.password;
      }

      const saved = await adminService.saveTeacher(
        editingId ? { id: editingId, ...payload } : payload,
      );
      await adminService.assignTeacherSubjects(saved.id, selectedSubjects);

      if (selectedClasses.length > 0) {
        await adminService.assignTeacherClasses(saved.id, selectedClasses);
      }

      resetForm();
      await loadData();
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Saqlashda xatolik yuz berdi.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (teacher: Teacher) => {
    const confirmed = window.confirm(
      `${teacher.fullName} o‘qituvchisini o‘chirmoqchimisiz?`,
    );

    if (!confirmed) return;

    try {
      await adminService.deleteTeacher(teacher.id);
      await loadData();
    } catch (err: any) {
      alert(
        err.response?.data?.message ||
          err.message ||
          "O‘qituvchini o‘chirishda xatolik.",
      );
    }
  };

  const toggleClass = (id: string) => {
    setSelectedClasses((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const filteredTeachers = teachers.filter((teacher) =>
    `${teacher.fullName} ${teacher.username} ${teacher.email}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">O‘qituvchilar</h1>
          <p className="text-sm text-slate-500 mt-1">
            O‘qituvchi akkauntlari va sinflarni boshqarish
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="flex items-center justify-center gap-2 bg-purple-700 hover:bg-purple-800 text-white px-4 py-2.5 rounded-xl font-semibold text-sm"
        >
          <Plus size={18} />
          O‘qituvchi qo‘shish
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <UserCog className="text-purple-600 mb-3" size={24} />
          <p className="text-sm text-slate-500">Jami o‘qituvchilar</p>
          <p className="text-2xl font-bold text-slate-900">{teachers.length}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <GraduationCap className="text-blue-600 mb-3" size={24} />
          <p className="text-sm text-slate-500">Jami sinflar</p>
          <p className="text-2xl font-bold text-slate-900">{classes.length}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <Users className="text-emerald-600 mb-3" size={24} />
          <p className="text-sm text-slate-500">Faol o‘qituvchilar</p>
          <p className="text-2xl font-bold text-slate-900">
            {teachers.filter((t) => t.status === "active").length}
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <div className="relative max-w-md">
            <Search
              className="absolute left-3 top-3 text-slate-400"
              size={17}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="O‘qituvchini qidirish..."
              className="w-full border border-slate-200 rounded-lg pl-10 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        {error && !showForm && (
          <p className="p-4 text-sm text-red-600">{error}</p>
        )}

        {loading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="animate-spin text-purple-600" size={28} />
          </div>
        ) : filteredTeachers.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            O‘qituvchilar topilmadi.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="p-4">O‘qituvchi</th>
                  <th className="p-4">Login</th>
                  <th className="p-4">Biriktirilgan sinflar</th>
                  <th className="p-4">Holati</th>
                  <th className="p-4 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTeachers.map((teacher) => (
                  <tr key={teacher.id} className="hover:bg-slate-50">
                    <td className="p-4">
                      <p className="font-semibold text-slate-900">
                        {teacher.fullName}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {teacher.email}
                      </p>
                    </td>
                    <td className="p-4 text-slate-600">{teacher.username}</td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {teacher.classes?.length ? (
                          teacher.classes.map((c) => (
                            <span
                              key={c.id}
                              className="bg-purple-50 text-purple-700 px-2 py-1 rounded-md text-xs font-medium"
                            >
                              {c.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 text-xs">
                            Sinf biriktirilmagan
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded-md text-xs font-semibold ${
                          teacher.status === "active"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {teacher.status === "active" ? "Faol" : "Nofaol"}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEdit(teacher)}
                          title="Tahrirlash"
                          className="p-2 rounded-lg text-blue-600 hover:bg-blue-50"
                        >
                          <Pencil size={17} />
                        </button>
                        <button
                          onClick={() => handleDelete(teacher)}
                          title="O‘chirish"
                          className="p-2 rounded-lg text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">
                {editingId ? "O‘qituvchini tahrirlash" : "Yangi o‘qituvchi"}
              </h2>
              <button
                onClick={resetForm}
                className="p-2 hover:bg-slate-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              {error && (
                <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  F.I.SH.
                </label>
                <input
                  required
                  minLength={2}
                  value={form.fullName}
                  onChange={(e) =>
                    setForm({ ...form, fullName: e.target.value })
                  }
                  placeholder="Aliyev Ali Valiyevich"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Login
                  </label>
                  <input
                    required
                    minLength={3}
                    value={form.username}
                    onChange={(e) =>
                      setForm({ ...form, username: e.target.value })
                    }
                    placeholder="teacher_ali"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Email
                  </label>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    placeholder="teacher@school.uz"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {!editingId && (
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Boshlang‘ich parol
                  </label>
                  <input
                    required
                    minLength={6}
                    type="password"
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    placeholder="Kamida 6 ta belgi"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">
                  O‘qituvchiga sinf biriktirish
                </label>
                <p className="text-xs text-slate-500 mb-3">
                  Bir nechta sinfni tanlashingiz mumkin. Mavjud biriktirishlar
                  saqlanadi, yangi tanlanganlari qo‘shiladi.
                </p>

                <div className="grid sm:grid-cols-2 gap-2 border border-slate-200 rounded-xl p-3 max-h-48 overflow-y-auto">
                  {classes.map((c) => (
                    <label
                      key={c.id}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedClasses.includes(c.id)}
                        onChange={() => toggleClass(c.id)}
                        className="accent-purple-600"
                      />
                      <span className="text-sm text-slate-700">{c.name}</span>
                    </label>
                  ))}
                  {classes.length === 0 && (
                    <p className="text-sm text-slate-400">
                      Hozircha sinflar mavjud emas.
                    </p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  O‘qituvchiga fan biriktirish
                </label>

                <p className="text-xs text-slate-500 mb-3">
                  O‘qituvchi dars beradigan fanlarni tanlang. Bir nechta fan
                  tanlash mumkin.
                </p>

                <div className="grid sm:grid-cols-2 gap-2 border border-slate-200 rounded-xl p-3 max-h-48 overflow-y-auto">
                  {allSubjects.map((s) => (
                    <label
                      key={s.id}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedSubjects.includes(s.id)}
                        onChange={() =>
                          setSelectedSubjects((prev) =>
                            prev.includes(s.id)
                              ? prev.filter((id) => id !== s.id)
                              : [...prev, s.id],
                          )
                        }
                        className="accent-purple-600"
                      />

                      <span className="text-sm text-slate-700">{s.name}</span>
                    </label>
                  ))}

                  {allSubjects.length === 0 && (
                    <p className="text-sm text-slate-400">
                      Hozircha fanlar mavjud emas.
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Akkaunt holati
                </label>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      status: e.target.value as "active" | "inactive",
                    })
                  }
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm"
                >
                  <option value="active">Faol</option>
                  <option value="inactive">Nofaol</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-medium"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-purple-700 hover:bg-purple-800 text-white text-sm font-semibold disabled:opacity-60"
                >
                  {saving ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  {saving ? "Saqlanmoqda..." : "Saqlash"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
