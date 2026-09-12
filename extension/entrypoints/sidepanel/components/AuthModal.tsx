import React, { useState, useEffect } from 'react';
import {
  Mail,
  Lock,
  Cloud,
  Sparkles,
  RefreshCw,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Server,
  Settings,
  ShieldCheck,
  X,
  ArrowRight,
} from 'lucide-react';
import {
  getAuthenticatedUser,
  getServerUrl,
  setServerUrl,
  loginApi,
  registerApi,
  logoutApi,
  restoreFromCloud,
  type UserProfile,
} from '../../../lib/sync';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestoreSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onRestoreSuccess,
}) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [serverUrlInput, setServerUrlInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadInitialData();
    }
  }, [isOpen]);

  const loadInitialData = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    const profile = await getAuthenticatedUser();
    setUser(profile);
    const currentUrl = await getServerUrl();
    setServerUrlInput(currentUrl);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      let profile: UserProfile;
      if (isRegisterMode) {
        profile = await registerApi(email, password);
        setSuccessMsg('Account created successfully! Syncing your notes...');
      } else {
        profile = await loginApi(email, password);
        setSuccessMsg('Logged in! Restoring cloud notes...');
      }
      setUser(profile);
      setEmail('');
      setPassword('');

      const result = await restoreFromCloud();
      setSuccessMsg(`Restored ${result.notesCount} notes & ${result.pinsCount} pins!`);
      setTimeout(() => {
        onRestoreSuccess();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualRestore = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);
    try {
      const result = await restoreFromCloud();
      setSuccessMsg(`Restored ${result.notesCount} notes & ${result.pinsCount} domain pins!`);
      setTimeout(() => {
        onRestoreSuccess();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Restore failed. Please check your network connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logoutApi();
    setUser(null);
    setSuccessMsg('Logged out safely.');
    onRestoreSuccess();
  };

  const handleSaveServerUrl = async () => {
    await setServerUrl(serverUrlInput);
    setSuccessMsg('Server URL updated successfully!');
    setShowSettings(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md z-50 flex items-center justify-center p-4 transition-all duration-300">
      <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-indigo-500/20 rounded-3xl p-6 w-full max-w-sm shadow-2xl shadow-indigo-950/50 text-slate-100 relative overflow-hidden">
        {/* Glow ambient background graphics */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 p-1.5 rounded-full transition-all"
          title="Close Modal"
        >
          <X size={16} />
        </button>

        {/* Header Branding */}
        <div className="flex items-center gap-3 mb-6 relative">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-sky-500 p-0.5 shadow-lg shadow-indigo-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
              <Cloud size={20} className="text-sky-400" />
            </div>
          </div>
          <div>
            <h3 className="text-base font-extrabold tracking-tight bg-gradient-to-r from-slate-100 via-slate-200 to-indigo-200 bg-clip-text text-transparent">
              {user ? 'Cloud Account' : isRegisterMode ? 'Create Cloud Account' : 'Sign In to Backup'}
            </h3>
            <p className="text-[11px] text-slate-400 font-medium">
              {user ? 'Notes sync automatically in background' : '0-Lag local editing + secure cloud backup'}
            </p>
          </div>
        </div>

        {/* Notification Banners */}
        {errorMsg && (
          <div className="mb-4 text-xs bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3 rounded-2xl flex items-start gap-2 animate-in fade-in slide-in-from-top-1">
            <AlertCircle size={15} className="text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 text-xs bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-3 rounded-2xl flex items-start gap-2 animate-in fade-in slide-in-from-top-1">
            <CheckCircle2 size={15} className="text-emerald-400 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Authenticated View */}
        {user ? (
          <div className="space-y-4">
            <div className="p-4 bg-slate-800/40 rounded-2xl border border-slate-700/50 backdrop-blur-xs flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">Account Profile</p>
                <p className="text-xs font-semibold text-slate-200 truncate max-w-[190px]">{user.email}</p>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ShieldCheck size={11} /> Connected
              </span>
            </div>

            <div className="flex flex-col gap-2.5 pt-1">
              <button
                onClick={handleManualRestore}
                disabled={loading}
                className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white rounded-2xl font-semibold text-xs tracking-wide shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" /> Restoring Cloud Notes...
                  </>
                ) : (
                  <>
                    <RefreshCw size={14} /> One-Time Cloud Restore
                  </>
                )}
              </button>

              <button
                onClick={handleLogout}
                className="w-full py-2.5 px-4 bg-slate-800/70 hover:bg-slate-800 text-slate-300 hover:text-slate-100 rounded-2xl font-medium text-xs transition-all flex items-center justify-center gap-1.5 border border-slate-700/50"
              >
                <LogOut size={13} /> Sign Out
              </button>
            </div>
          </div>
        ) : (
          /* Sign In / Register Form */
          <div>
            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-2 p-1 bg-slate-950/80 rounded-2xl border border-slate-800/80 mb-5">
              <button
                type="button"
                onClick={() => {
                  setIsRegisterMode(false);
                  setErrorMsg('');
                }}
                className={`py-1.5 text-xs font-semibold rounded-xl transition-all ${
                  !isRegisterMode
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsRegisterMode(true);
                  setErrorMsg('');
                }}
                className={`py-1.5 text-xs font-semibold rounded-xl transition-all ${
                  isRegisterMode
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Register
              </button>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1.5 ml-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950/60 border border-slate-800 rounded-2xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1.5 ml-1">
                  Password
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-9 py-2.5 bg-slate-950/60 border border-slate-800 rounded-2xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white rounded-2xl font-bold text-xs tracking-wide shadow-lg shadow-indigo-600/30 transition-all mt-3 flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" /> Processing...
                  </>
                ) : (
                  <>
                    {isRegisterMode ? 'Create Account & Sync' : 'Sign In & Sync'}
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Server Config & Footer */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5 truncate max-w-[200px]">
            <Server size={12} className="text-slate-400 shrink-0" />
            <span className="truncate">{serverUrlInput.replace('/api/v1', '')}</span>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 hover:underline shrink-0"
          >
            <Settings size={11} /> {showSettings ? 'Hide' : 'Server Config'}
          </button>
        </div>

        {/* Expandable Server Config Panel */}
        {showSettings && (
          <div className="mt-3 p-3.5 bg-slate-950/90 rounded-2xl border border-slate-800/90 space-y-2.5 animate-in fade-in slide-in-from-bottom-2">
            <label className="block text-[11px] font-semibold text-slate-300">Backend API URL</label>
            <input
              type="text"
              value={serverUrlInput}
              onChange={(e) => setServerUrlInput(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              placeholder="http://localhost:8000/api/v1"
            />
            <button
              onClick={handleSaveServerUrl}
              className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl transition-all"
            >
              Save Server URL
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
