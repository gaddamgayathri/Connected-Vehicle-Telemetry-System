
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Truck, User, Mail, Lock, Loader2, ArrowLeft, ShieldCheck } from 'lucide-react';
import ThemeToggle from '../components/common/ThemeToggle';
import { register } from '../api/auth';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!fullName.trim() || !email.trim() || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);

    try {
      await register(email.trim(), password, fullName.trim());
      setSubmitted(true);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        'Registration failed. Please check your details and try again.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center px-4 py-10">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
            <Truck className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="font-semibold text-slate-900 dark:text-slate-100">
              Vehicle Telemetry
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Connected fleet console
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-6">
          {submitted ? (
            <div className="text-center py-5">
              <ShieldCheck className="h-14 w-14 text-emerald-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                Registration submitted!
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-3 leading-6">
                Your account is waiting for administrator approval.
                You can log in after your registration has been approved.
              </p>
              <Link
                to="/login"
                className="mt-6 inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium"
              >
                Go to Login
              </Link>
            </div>
          ) : (
            <>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-brand-600 mb-5"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to login
              </Link>

              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                Create an account
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-6">
                Submit your details for administrator approval.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Field
                  label="Full name"
                  icon={User}
                  value={fullName}
                  onChange={setFullName}
                  placeholder="Your full name"
                  autoComplete="name"
                />

                <Field
                  label="Email"
                  icon={Mail}
                  type="email"
                  value={email}
                  onChange={setEmail}
                  placeholder="you@example.com"
                  autoComplete="email"
                />

                <Field
                  label="Password"
                  icon={Lock}
                  type="password"
                  value={password}
                  onChange={setPassword}
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                />

                <Field
                  label="Confirm password"
                  icon={Lock}
                  type="password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  placeholder="Enter password again"
                  autoComplete="new-password"
                />

                {error && (
                  <div className="text-sm px-3 py-2 rounded-md bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300 border border-red-200 dark:border-red-900">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 rounded-lg bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 text-white font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Request Account'
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  icon: Icon,
  type = 'text',
  value,
  onChange,
  placeholder,
  autoComplete,
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
        {label}
      </label>
      <div className="relative">
        <Icon className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required
          className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500/30 text-slate-900 dark:text-slate-100"
        />
      </div>
    </div>
  );
}
