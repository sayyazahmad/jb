import React, { useState } from 'react';
import { ShieldCheck, Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight, RefreshCw, CheckCircle2 } from 'lucide-react';
import { AdminAuthStatus } from './useAdminAuth';

interface AdminLoginProps {
  status: AdminAuthStatus;
  email: string | null;
  onSignIn: (email: string, password: string) => Promise<void>;
  onSendReset: (email: string) => Promise<void>;
  onSetPassword: (password: string) => Promise<void>;
  onSignOut: () => Promise<void>;
}

const inputClass =
  'w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500';
const primaryButton =
  'w-full py-3 bg-emerald-700 hover:bg-emerald-800 active:scale-95 disabled:opacity-60 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer';
const linkButton = 'text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer';

export const AdminLogin: React.FC<AdminLoginProps> = ({ status, email, onSignIn, onSendReset, onSetPassword, onSignOut }) => {
  const [mode, setMode] = useState<'signIn' | 'forgot'>('signIn');
  const [formEmail, setFormEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const run = async (action: () => Promise<void>) => {
    setError('');
    setNotice('');
    setBusy(true);
    try {
      await action();
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const passwordField = (value: string, onChange: (v: string) => void, placeholder: string, autoComplete: string) => (
    <div className="relative">
      <input
        type={showPassword ? 'text' : 'password'}
        required
        value={value}
        onChange={(e) => { onChange(e.target.value); setError(''); }}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={`${inputClass} pr-10`}
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 p-1"
        title={showPassword ? 'Hide password' : 'Show password'}
      >
        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );

  let title = 'Admin Login';
  let subtitle = 'Sign in with your committee account to manage donations.';
  let body: React.ReactNode;

  if (status === 'loading') {
    body = (
      <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2 py-6">
        <RefreshCw className="w-4 h-4 animate-spin" /> Checking sign-in…
      </p>
    );
  } else if (status === 'notAdmin') {
    title = 'No admin access';
    subtitle = '';
    body = (
      <div className="space-y-4">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          <strong className="text-slate-900 dark:text-slate-100">{email}</strong> is signed in but isn't on the committee's admin list.
          Ask the project admin to add this email.
        </p>
        <button type="button" onClick={() => run(onSignOut)} className={primaryButton}>Sign out</button>
      </div>
    );
  } else if (status === 'recovery') {
    title = 'Set a new password';
    subtitle = email ? `For ${email}` : '';
    body = (
      <form
        className="space-y-3.5"
        onSubmit={(e) => {
          e.preventDefault();
          if (password !== confirm) {
            setError('The two passwords do not match.');
            return;
          }
          run(() => onSetPassword(password));
        }}
      >
        {passwordField(password, setPassword, 'New password', 'new-password')}
        {passwordField(confirm, setConfirm, 'Repeat new password', 'new-password')}
        {error && <ErrorBox message={error} />}
        <button type="submit" disabled={busy} className={primaryButton}>
          {busy ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          <span>Save password</span>
        </button>
      </form>
    );
  } else if (mode === 'forgot') {
    title = 'Reset password';
    subtitle = "Enter your email and we'll send you a link to set a new password.";
    body = (
      <form className="space-y-3.5" onSubmit={(e) => { e.preventDefault(); run(async () => { await onSendReset(formEmail); setNotice('Check your email for the reset link. It can take a minute to arrive.'); }); }}>
        <EmailField value={formEmail} onChange={(v) => { setFormEmail(v); setError(''); }} />
        {error && <ErrorBox message={error} />}
        {notice && <p className="text-xs text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl p-2.5">{notice}</p>}
        <button type="submit" disabled={busy} className={primaryButton}>
          {busy ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
          <span>Send reset link</span>
        </button>
        <div className="text-center">
          <button type="button" onClick={() => { setMode('signIn'); setError(''); setNotice(''); }} className={linkButton}>Back to sign in</button>
        </div>
      </form>
    );
  } else {
    body = (
      <form className="space-y-3.5" onSubmit={(e) => { e.preventDefault(); run(() => onSignIn(formEmail, password)); }}>
        <EmailField value={formEmail} onChange={(v) => { setFormEmail(v); setError(''); }} autoFocus />
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            <span>Password</span>
          </label>
          {passwordField(password, setPassword, 'Enter password', 'current-password')}
        </div>
        {error && <ErrorBox message={error} />}
        <button type="submit" disabled={busy} className={primaryButton}>
          {busy ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
          <span>Sign in</span>
        </button>
        <div className="text-center">
          <button type="button" onClick={() => { setMode('forgot'); setError(''); }} className={linkButton}>Forgot password?</button>
        </div>
      </form>
    );
  }

  return (
    <div className="max-w-sm mx-auto mt-10 px-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
        <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>
        {body}
        <div className="text-center pt-1">
          <a href="/" className="text-xs text-slate-500 dark:text-slate-400 hover:underline">← Back to public site</a>
        </div>
      </div>
    </div>
  );
};

const EmailField: React.FC<{ value: string; onChange: (v: string) => void; autoFocus?: boolean }> = ({ value, onChange, autoFocus }) => (
  <div className="space-y-1">
    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
      <Mail className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
      <span>Email</span>
    </label>
    <input
      type="email"
      required
      autoFocus={autoFocus}
      autoComplete="email"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="you@example.com"
      className={inputClass}
    />
  </div>
);

const ErrorBox: React.FC<{ message: string }> = ({ message }) => (
  <p className="text-xs text-rose-600 dark:text-rose-400 font-medium flex items-center justify-center gap-1 bg-rose-50 dark:bg-rose-950/40 p-2 rounded-xl border border-rose-200 dark:border-rose-800/60">
    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
    <span>{message}</span>
  </p>
);
