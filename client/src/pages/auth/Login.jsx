import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, AlertCircle, ArrowRight, Shield, User, KeyRound } from 'lucide-react';
import AppLogo from '../../components/common/AppLogo';

export const Login = () => {
  const [roleMode, setRoleMode] = useState('user'); // 'user' | 'admin'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminAccessCode, setAdminAccessCode] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || (typeof location.state?.from === 'string' ? location.state.from : null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (roleMode === 'admin' && !adminAccessCode.trim()) {
      setError('Admin Access Code is required to log in as Administrator.');
      return;
    }

    setIsSubmitting(true);

    try {
      const user = await login({
        email,
        password,
        portalType: roleMode,
        adminAccessCode: roleMode === 'admin' ? adminAccessCode.trim() : undefined,
      });

      // Always route based on the actual role returned from the server
      if (user?.globalRole === 'admin') {
        navigate(from || '/admin', { replace: true });
      } else {
        navigate(from || '/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = () => {
    alert('Google authentication is configured for production SSO. Please use email and password to log in.');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center space-x-2.5">
          <div className="w-10 h-10 flex items-center justify-center">
            <AppLogo size="w-10 h-10" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-white">TaskFlow</span>
        </Link>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-white">
          {roleMode === 'admin' ? 'Admin Portal Sign In' : 'Sign in to your account'}
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          {roleMode === 'admin'
            ? 'Enter your credentials and admin access code to access the console'
            : 'Welcome back! Please enter your details to continue'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-2xl">
          {/* Mode Switcher */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl mb-5">
            <button
              type="button"
              onClick={() => {
                setRoleMode('user');
                setError('');
              }}
              className={`flex items-center justify-center space-x-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                roleMode === 'user'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>User</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setRoleMode('admin');
                setError('');
              }}
              className={`flex items-center justify-center space-x-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                roleMode === 'admin'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center space-x-2 text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Admin Access Code Field */}
            {roleMode === 'admin' && (
              <div>
                <label className="block text-xs font-semibold text-purple-300 mb-1">
                  Admin Access Code
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-purple-400 absolute left-3.5 top-3 pointer-events-none" />
                  <input
                    type="password"
                    required
                    value={adminAccessCode}
                    onChange={(e) => setAdminAccessCode(e.target.value)}
                    placeholder="Enter Admin Access Code"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900 border border-purple-500/40 rounded-xl text-xs text-purple-100 placeholder-purple-400/50 focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-2.5 text-white font-semibold rounded-xl text-xs shadow-lg disabled:opacity-50 flex items-center justify-center space-x-2 transition-all ${
                roleMode === 'admin'
                  ? 'bg-purple-600 hover:bg-purple-500 shadow-purple-600/30'
                  : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30'
              }`}
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>{roleMode === 'admin' ? 'Sign In as Admin' : 'Sign In'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Continue with Google */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800"></div>
            </div>
            <div className="relative flex justify-center text-[11px]">
              <span className="px-2 bg-slate-900 text-slate-400">or continue with</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-850 border border-slate-700/80 rounded-xl text-xs font-semibold text-slate-200 hover:text-white flex items-center justify-center space-x-2.5 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
              />
              <path
                fill="#4285F4"
                d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
              />
              <path
                fill="#FBBC05"
                d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.2s.7 5.5 1.9 7.9l3.7-2.9z"
              />
              <path
                fill="#34A853"
                d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2-6.4-4.8L1.9 16.9C3.7 20.6 7.5 23.5 12 23.5z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="mt-5 text-center text-xs text-slate-400">
            Don't have an account?{' '}
            <Link
              to="/register"
              state={{ ...location.state, role: roleMode }}
              className="font-semibold text-indigo-400 hover:text-indigo-300"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
