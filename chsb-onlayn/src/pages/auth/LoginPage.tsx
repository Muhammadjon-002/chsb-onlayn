import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  GraduationCap,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { Button } from '../../components/common/Button';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('student2026');
  const [password, setPassword] = useState('student123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!username.trim()) {
      setErrorMessage('Please enter your institutional username or Student ID.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      const user = await login(username, password);
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (user.role === 'teacher') {
        navigate('/teacher/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Institutional Crest / Logo */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-700 text-white flex items-center justify-center shadow-lg shadow-blue-700/20 ring-4 ring-blue-100">
            <GraduationCap className="w-9 h-9" />
          </div>
        </div>

        <h1 className="mt-4 text-center text-2xl font-bold tracking-tight text-slate-900">
          SCHOOL <span className="text-blue-600">CHSB</span>
        </h1>
        <p className="mt-1 text-center text-xs font-medium text-slate-500 uppercase tracking-widest">
          O'quvchilar bilimini baholash tizimi
        </p>
        <p className="text-center text-xs text-slate-400 mt-0.5">
          Specialized School Online Examination Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 rounded-2xl border border-slate-200/80 sm:px-10">
          {errorMessage && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="username"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Foydalanuvchi nomi / Student ID or Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. student2026 or ST-2026-0842"
                  className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 transition-colors"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Parol / Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-9 pr-10 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                <span>Meni eslab qol (Remember me)</span>
              </label>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                className="w-full text-sm font-semibold"
              >
                Tizimga kirish (Sign In)
              </Button>
            </div>
          </form>

          {/* Institutional Security Notice */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-start gap-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200/60">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong>Eslatma:</strong> O'quvchilar mustaqil ro'yxatdan o'ta olmaydilar.
                Hisob ma'lumotlari maktab ma'muriyati (Admin) tomonidan taqdim etiladi.
              </p>
            </div>
          </div>

          {/* Demo account helper pills */}
          <div className="mt-5 pt-4 border-t border-dashed border-slate-200">
            <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 text-center">
              Demo Credentials (Click to prefill)
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('student2026', 'student123')}
                className="px-2 py-1.5 text-[11px] font-medium rounded-lg border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-800 transition-colors text-center"
              >
                👤 Student
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('teacher.nodira', 'teacher123')}
                className="px-2 py-1.5 text-[11px] font-medium rounded-lg border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100 text-emerald-800 transition-colors text-center"
              >
                📚 Teacher
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('admin', 'admin123')}
                className="px-2 py-1.5 text-[11px] font-medium rounded-lg border border-purple-200 bg-purple-50/70 hover:bg-purple-100 text-purple-800 transition-colors text-center"
              >
                🛡️ Admin
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
