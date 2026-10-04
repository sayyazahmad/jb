import React, { useState } from 'react';
import { X, ShieldCheck, KeyRound, AlertCircle, ArrowRight, User, Lock, Eye, EyeOff } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  expectedUsername?: string;
  expectedPassword?: string;
  onSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  expectedUsername = 'admin',
  expectedPassword = 'Ochor1!',
  onSuccess
}) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetUser = expectedUsername.trim().toLowerCase();
    const targetPass = expectedPassword;

    if (username.trim().toLowerCase() === targetUser && password === targetPass) {
      setError('');
      setPassword('');
      onSuccess();
    } else {
      setError('Invalid username or password. Please verify your credentials.');
    }
  };

  const handleFillCredentials = () => {
    setUsername(expectedUsername || 'admin');
    setPassword(expectedPassword || 'Ochor1!');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose}></div>

      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 p-6 z-10 space-y-4">
        <div className="flex items-center justify-between">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-emerald-700" />
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-1">
          <h3 className="text-lg font-bold text-slate-900">Admin Login</h3>
          <p className="text-xs text-slate-500">
            Sign in with admin credentials to collect offline donations and manage ledger transactions.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Username Field */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>Admin Username</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError('');
              }}
              placeholder="e.g. admin"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Password Field */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Password</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder="Enter password"
                className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-xs text-rose-600 font-medium text-center flex items-center justify-center gap-1 bg-rose-50 p-2 rounded-xl border border-rose-200">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{error}</span>
            </p>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm"
          >
            <span>Sign In to Admin Desk</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleFillCredentials}
            className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
          >
          </button>
        </form>
      </div>
    </div>
  );
};
