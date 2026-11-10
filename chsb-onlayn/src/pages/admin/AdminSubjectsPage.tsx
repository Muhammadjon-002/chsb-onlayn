import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { Subject } from '../../types';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { LoadingState, ErrorState } from '../../components/common/FeedbackStates';
import { BookOpen, Plus, Edit2, Trash2 } from 'lucide-react';

export const AdminSubjectsPage: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Partial<Subject> | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getSubjects();
      setSubjects(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load subjects');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingSubject({
      name: '',
      code: 'SUB-10',
      description: '',
      status: 'active',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sub: Subject) => {
    setEditingSubject(sub);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Ushbu fanni o\'chirmoqchimisiz?')) return;
    try {
      await adminService.deleteSubject(id);
      setSubjects((prev) => prev.filter((s) => s.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete subject');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubject?.name) return;
    try {
      const saved = await adminService.saveSubject(editingSubject);
      if (editingSubject.id) {
        setSubjects((prev) => prev.map((s) => (s.id === saved.id ? saved : s)));
      } else {
        setSubjects((prev) => [...prev, saved]);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Failed to save subject');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">O'quv Fanlari Katalogi</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Imtihonlar tashkil etiladigan barcha akademik fanlar
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleOpenAdd}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
          className="text-xs font-semibold"
        >
          Yangi fan qo'shish
        </Button>
      </div>

      {isLoading ? (
        <LoadingState message="Fanlar katalogi yuklanmoqda..." />
      ) : error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((sub) => (
            <div
              key={sub.id}
              className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="font-mono text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {sub.code}
                  </span>
                  <Badge variant={sub.status === 'active' ? 'success' : 'neutral'} size="sm">
                    {sub.status === 'active' ? 'Faol' : 'Nofaol'}
                  </Badge>
                </div>

                <h3 className="text-base font-bold text-slate-900 mt-1">{sub.name}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {sub.description || 'Standart davlat ta\'lim standarti fani.'}
                </p>
              </div>

              <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-end gap-1.5">
                <button
                  onClick={() => handleOpenEdit(sub)}
                  className="p-1.5 text-slate-400 hover:text-blue-600 rounded"
                  title="Tahrirlash"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(sub.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
                  title="O'chirish"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Subject Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSubject?.id ? 'Fanni tahrirlash' : 'Yangi fan qo\'shish'}
        maxWidth="sm"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Fan nomi *</label>
            <input
              type="text"
              required
              value={editingSubject?.name || ''}
              onChange={(e) => setEditingSubject({ ...editingSubject, name: e.target.value })}
              className="w-full text-xs p-2 border border-slate-300 rounded-lg"
              placeholder="e.g. Kimyo (Aniq fanlar)"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Fan kodi *</label>
            <input
              type="text"
              required
              value={editingSubject?.code || ''}
              onChange={(e) => setEditingSubject({ ...editingSubject, code: e.target.value })}
              className="w-full text-xs p-2 border border-slate-300 rounded-lg font-mono"
              placeholder="e.g. CHEM-10"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tavsifi</label>
            <textarea
              rows={3}
              value={editingSubject?.description || ''}
              onChange={(e) => setEditingSubject({ ...editingSubject, description: e.target.value })}
              className="w-full text-xs p-2 border border-slate-300 rounded-lg"
              placeholder="Fan bo'yicha qisqacha ma'lumot..."
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
              Bekor qilish
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Saqlash
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
