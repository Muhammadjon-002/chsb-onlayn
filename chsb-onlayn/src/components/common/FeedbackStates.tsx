import React from 'react';
import { Loader2, AlertCircle, Inbox, ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from './Button';
import { Link } from 'react-router-dom';

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading examination records...',
  className = '',
}) => (
  <div className={`flex flex-col items-center justify-center py-16 px-4 text-center ${className}`}>
    <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-3">
      <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
    </div>
    <h4 className="text-sm font-semibold text-slate-800">{message}</h4>
    <p className="text-xs text-slate-500 mt-1 max-w-sm">Please wait while the platform synchronizes with secure examination servers.</p>
  </div>
);

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'An error occurred',
  message,
  onRetry,
  className = '',
}) => (
  <div className={`bg-rose-50 border border-rose-200 rounded-xl p-6 text-center my-4 ${className}`}>
    <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
      <AlertCircle className="w-5 h-5" />
    </div>
    <h4 className="text-sm font-bold text-rose-900">{title}</h4>
    <p className="text-xs text-rose-700 mt-1 max-w-md mx-auto">{message}</p>
    {onRetry && (
      <div className="mt-4">
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try Again
        </Button>
      </div>
    )}
  </div>
);

interface EmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionText,
  onAction,
  icon,
  className = '',
}) => (
  <div className={`border-2 border-dashed border-slate-200 rounded-xl p-10 text-center bg-slate-50/50 ${className}`}>
    <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
      {icon || <Inbox className="w-6 h-6" />}
    </div>
    <h4 className="text-sm font-semibold text-slate-800">{title}</h4>
    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">{description}</p>
    {actionText && onAction && (
      <div className="mt-4">
        <Button variant="outline" size="sm" onClick={onAction}>
          {actionText}
        </Button>
      </div>
    )}
  </div>
);

export const UnauthorizedPage: React.FC = () => (
  <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
    <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
      <ShieldAlert className="w-8 h-8" />
    </div>
    <span className="text-xs font-bold text-amber-700 uppercase tracking-widest bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
      Access Restricted
    </span>
    <h1 className="text-2xl font-bold text-slate-900 mt-3">Unauthorized Portal Access</h1>
    <p className="text-sm text-slate-600 mt-2 max-w-md">
      Your institutional role does not have permission to view this section of the School CHSB system.
    </p>
    <div className="mt-6 flex gap-3">
      <Link to="/login">
        <Button variant="primary" leftIcon={<ArrowLeft className="w-4 h-4" />}>
          Return to Login
        </Button>
      </Link>
    </div>
  </div>
);
