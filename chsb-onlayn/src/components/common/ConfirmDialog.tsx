import React from 'react';
import { AlertTriangle, CheckCircle, HelpCircle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
  stats?: {
    total: number;
    answered: number;
    unanswered: number;
  };
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false,
  isLoading = false,
  stats,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="md">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div
            className={`p-2.5 rounded-full shrink-0 ${
              isDestructive || (stats && stats.unanswered > 0)
                ? 'bg-amber-100 text-amber-700'
                : 'bg-blue-100 text-blue-700'
            }`}
          >
            {isDestructive || (stats && stats.unanswered > 0) ? (
              <AlertTriangle className="w-5 h-5" />
            ) : (
              <CheckCircle className="w-5 h-5" />
            )}
          </div>
          <div>
            <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
          </div>
        </div>

        {stats && (
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-3 gap-2 text-center">
            <div className="p-2 bg-white rounded border border-slate-100">
              <span className="block text-xs font-medium text-slate-500 uppercase tracking-wider">Total</span>
              <span className="text-base font-bold text-slate-900">{stats.total}</span>
            </div>
            <div className="p-2 bg-white rounded border border-slate-100">
              <span className="block text-xs font-medium text-emerald-600 uppercase tracking-wider">Answered</span>
              <span className="text-base font-bold text-emerald-700">{stats.answered}</span>
            </div>
            <div className="p-2 bg-white rounded border border-slate-100">
              <span className="block text-xs font-medium text-amber-600 uppercase tracking-wider">Remaining</span>
              <span className="text-base font-bold text-amber-700">{stats.unanswered}</span>
            </div>
          </div>
        )}

        {stats && stats.unanswered > 0 && (
          <div className="p-2.5 text-xs text-amber-800 bg-amber-50 rounded-md border border-amber-200">
            ⚠️ Notice: You still have <strong>{stats.unanswered} unanswered question(s)</strong>. If you submit now, these will be scored as 0.
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button
            variant={isDestructive ? 'danger' : 'primary'}
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
