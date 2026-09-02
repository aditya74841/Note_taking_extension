import React, { useState, useEffect } from 'react';
import {
  getUserProfile,
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
    const profile = await getUserProfile();
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
        setSuccessMsg('Account registered successfully! Restoring data...');
      } else {
        profile = await loginApi(email, password);
        setSuccessMsg('Logged in successfully! Restoring cloud notes...');
      }
      setUser(profile);
      setEmail('');
      setPassword('');

      // Perform one-time restore after login
      const result = await restoreFromCloud();
      setSuccessMsg(`Restored ${result.notesCount} notes and ${result.pinsCount} pins!`);
      setTimeout(() => {
        onRestoreSuccess();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed');
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
      setSuccessMsg(`Restored ${result.notesCount} notes & ${result.pinsCount} pins!`);
      setTimeout(() => {
        onRestoreSuccess();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Restore failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logoutApi();
    setUser(null);
    setSuccessMsg('Logged out successfully.');
    onRestoreSuccess();
  };

  const handleSaveServerUrl = async () => {
    await setServerUrl(serverUrlInput);
    setSuccessMsg('Server URL updated!');
    setShowSettings(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl text-slate-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors text-lg"
          title="Close"
        >
          ✕
        </button>

        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">☁️</span>
          <div>
            <h3 className="text-lg font-bold text-slate-100">
              {user ? 'Cloud Account' : isRegisterMode ? 'Create Cloud Backup Account' : 'Sign In for Cloud Backup'}
            </h3>
            <p className="text-xs text-slate-400">
              {user ? 'Your notes back up automatically' : 'Keep your notes safe & sync across devices'}
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 text-xs bg-red-500/10 border border-red-500/20 text-red-400 p-2.5 rounded-lg">
            ⚠️ {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-2.5 rounded-lg">
            ✅ {successMsg}
          </div>
        )}

        {user ? (
          <div className="space-y-4">
            <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/50 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Logged in as</p>
                <p className="text-sm font-medium text-slate-200 truncate max-w-[200px]">{user.email}</p>
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Connected
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={handleManualRestore}
                disabled={loading}
                className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Restoring...' : '📥 One-Time Cloud Restore'}
              </button>

              <button
                onClick={handleLogout}
                className="w-full py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium text-sm transition-all"
              >
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleAuthSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-medium text-sm transition-all mt-2 disabled:opacity-50"
            >
              {loading
                ? 'Processing...'
                : isRegisterMode
                ? 'Create Account & Backup'
                : 'Sign In & Sync'}
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => setIsRegisterMode(!isRegisterMode)}
                className="text-xs text-sky-400 hover:underline"
              >
                {isRegisterMode
                  ? 'Already have an account? Sign In'
                  : "Don't have an account? Create one"}
              </button>
            </div>
          </form>
        )}

        <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>Server: {serverUrlInput.replace('/api/v1', '')}</span>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="text-slate-400 hover:text-slate-200 underline"
          >
            {showSettings ? 'Hide Settings' : 'Server Config'}
          </button>
        </div>

        {showSettings && (
          <div className="mt-3 p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
            <label className="block text-[11px] text-slate-400">Backend API URL</label>
            <input
              type="text"
              value={serverUrlInput}
              onChange={(e) => setServerUrlInput(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200"
              placeholder="http://localhost:8000/api/v1"
            />
            <button
              onClick={handleSaveServerUrl}
              className="w-full py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg"
            >
              Save Server URL
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
