import React, { useState, useEffect } from 'react';
import {
  Cloud,
  Mail,
  Lock,
  Eye,
  EyeOff,
  RefreshCw,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Server,
  Settings,
  ShieldCheck,
  ArrowRight,
  Database,
  Globe,
  FileText,
  Download,
  Upload,
  Search,
  Trash2,
  Copy,
  ExternalLink,
  Layers,
  Sparkles,
  Zap,
} from 'lucide-react';
import {
  getAllNotes,
  deleteNote,
  saveNote,
  type Note,
} from '../../lib/db';
import {
  getUserProfile,
  getServerUrl,
  setServerUrl,
  loginApi,
  registerApi,
  logoutApi,
  restoreFromCloud,
  type UserProfile,
} from '../../lib/sync';

export default function DashboardApp() {
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

  // Notes & Stats
  const [allNotes, setAllNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const profile = await getUserProfile();
    setUser(profile);
    const currentUrl = await getServerUrl();
    setServerUrlInput(currentUrl);

    const notes = await getAllNotes();
    setAllNotes(notes);
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
        setSuccessMsg('Account registered successfully! Restoring cloud data...');
      } else {
        profile = await loginApi(email, password);
        setSuccessMsg('Logged in successfully! Restoring cloud data...');
      }
      setUser(profile);
      setEmail('');
      setPassword('');

      const result = await restoreFromCloud();
      setSuccessMsg(`Restored ${result.notesCount} notes & ${result.pinsCount} domain pins!`);
      const notes = await getAllNotes();
      setAllNotes(notes);
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
      const notes = await getAllNotes();
      setAllNotes(notes);
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
  };

  const handleSaveServerUrl = async () => {
    await setServerUrl(serverUrlInput);
    setSuccessMsg('Server URL updated!');
    setShowSettings(false);
  };

  const handleDeleteNoteItem = async (urlKey: string) => {
    if (window.confirm('Delete this note from local storage?')) {
      await deleteNote(urlKey);
      const notes = await getAllNotes();
      setAllNotes(notes);
    }
  };

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(allNotes, null, 2));
    const anchor = document.createElement('a');
    anchor.setAttribute('href', dataStr);
    anchor.setAttribute('download', `url-notes-backup-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  const handleImportJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const imported = JSON.parse(text);
      if (Array.isArray(imported)) {
        for (const n of imported) {
          if (n.urlKey && n.content) {
            await saveNote(n);
          }
        }
        alert(`Successfully imported notes!`);
        const notes = await getAllNotes();
        setAllNotes(notes);
      }
    } catch (err) {
      alert('Failed to import JSON file');
    }
  };

  // Group notes by domain
  const uniqueDomains = Array.from(new Set(allNotes.map((n) => n.domain || 'other')));
  const filteredNotes = allNotes.filter(
    (n) =>
      n.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.domain?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Background ambient lighting */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-sky-500 p-0.5 shadow-lg shadow-indigo-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Cloud size={20} className="text-sky-400" />
              </div>
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                URL Notes Cloud Dashboard
              </h1>
              <p className="text-xs text-slate-400 font-medium">Local-First Persistence & Synchronization Engine</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300">
              <Server size={13} className="text-indigo-400" />
              <span>{serverUrlInput.replace('/api/v1', '')}</span>
            </div>

            {user ? (
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-medium">
                <ShieldCheck size={14} />
                <span>{user.email}</span>
              </div>
            ) : (
              <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-semibold">
                Guest Mode
              </span>
            )}
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8 relative">
        {/* STATS SUMMARY METRICS BAR */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xs flex items-center gap-4">
            <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <FileText size={24} />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-100">{allNotes.length}</p>
              <p className="text-xs text-slate-400 font-medium">Saved Local Notes</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xs flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Globe size={24} />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-100">{uniqueDomains.length}</p>
              <p className="text-xs text-slate-400 font-medium">Tracked Websites</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xs flex items-center gap-4">
            <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
              <Database size={24} />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-100">IndexedDB</p>
              <p className="text-xs text-slate-400 font-medium">0ms Local Storage</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xs flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Cloud size={24} />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-100">{user ? 'Active' : 'Offline'}</p>
              <p className="text-xs text-slate-400 font-medium">Cloud Backup Engine</p>
            </div>
          </div>
        </div>

        {/* AUTHENTICATION DASHBOARD SECTION */}
        <section className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-indigo-500/20 rounded-3xl p-8 shadow-2xl shadow-indigo-950/40 relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Column: Feature Highlights */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider">
                <Sparkles size={14} /> Cloud Backup & Synchronization
              </div>
              <h2 className="text-3xl font-black tracking-tight text-slate-100 leading-tight">
                Never lose a single web note across any device or browser tab.
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed max-w-xl">
                URL Notes operates with a local-first philosophy. All your typing happens directly against IndexedDB in 0ms. When signed in, background sync automatically backs up your notes to MongoDB.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/40">
                  <Zap size={18} className="text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">0ms Local Response</h4>
                    <p className="text-[11px] text-slate-400">Instant save to browser storage</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/40">
                  <Cloud size={18} className="text-sky-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">Silent Cloud Backup</h4>
                    <p className="text-[11px] text-slate-400">Debounced background updates</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Authentication Card */}
            <div className="lg:col-span-5">
              <div className="bg-slate-950/80 border border-slate-800/90 rounded-3xl p-6 shadow-xl backdrop-blur-md">
                {/* Banners */}
                {errorMsg && (
                  <div className="mb-4 text-xs bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3 rounded-2xl flex items-start gap-2">
                    <AlertCircle size={15} className="text-rose-400 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}
                {successMsg && (
                  <div className="mb-4 text-xs bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-3 rounded-2xl flex items-start gap-2">
                    <CheckCircle2 size={15} className="text-emerald-400 shrink-0 mt-0.5" />
                    <span>{successMsg}</span>
                  </div>
                )}

                {user ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Logged In As</p>
                        <p className="text-sm font-bold text-slate-100 truncate">{user.email}</p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Active
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      <button
                        onClick={handleManualRestore}
                        disabled={loading}
                        className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white rounded-2xl font-bold text-xs tracking-wide shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
                      >
                        {loading ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                        One-Time Cloud Restore
                      </button>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={handleExportJson}
                          className="py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl font-medium text-xs border border-slate-800 flex items-center justify-center gap-1.5"
                        >
                          <Download size={13} /> Export JSON
                        </button>
                        <label className="py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl font-medium text-xs border border-slate-800 flex items-center justify-center gap-1.5 cursor-pointer">
                          <Upload size={13} /> Import JSON
                          <input type="file" onChange={handleImportJson} accept=".json" className="hidden" />
                        </label>
                      </div>

                      <button
                        onClick={handleLogout}
                        className="w-full py-2.5 px-4 bg-slate-900/60 hover:bg-slate-900 text-slate-400 hover:text-slate-200 rounded-xl font-medium text-xs transition-all border border-slate-800/60 flex items-center justify-center gap-1.5"
                      >
                        <LogOut size={13} /> Sign Out
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Form */
                  <div>
                    {/* Tab Switcher */}
                    <div className="grid grid-cols-2 p-1 bg-slate-900 rounded-2xl border border-slate-800 mb-5">
                      <button
                        type="button"
                        onClick={() => {
                          setIsRegisterMode(false);
                          setErrorMsg('');
                        }}
                        className={`py-2 text-xs font-bold rounded-xl transition-all ${
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
                        className={`py-2 text-xs font-bold rounded-xl transition-all ${
                          isRegisterMode
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Create Account
                      </button>
                    </div>

                    <form onSubmit={handleAuthSubmit} className="space-y-4">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1.5 ml-1">
                          Email Address
                        </label>
                        <div className="relative">
                          <Mail size={16} className="absolute left-3.5 top-3 text-slate-400" />
                          <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            className="w-full pl-10 pr-3 py-2.5 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1.5 ml-1">
                          Password
                        </label>
                        <div className="relative">
                          <Lock size={16} className="absolute left-3.5 top-3 text-slate-400" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full pl-10 pr-10 py-2.5 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-200"
                          >
                            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white rounded-2xl font-bold text-xs tracking-wide shadow-lg shadow-indigo-600/30 transition-all mt-2 flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
                      >
                        {loading ? (
                          <>
                            <RefreshCw size={15} className="animate-spin" /> Processing...
                          </>
                        ) : (
                          <>
                            {isRegisterMode ? 'Register Account & Sync' : 'Sign In & Restore'}
                            <ArrowRight size={15} />
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                )}

                {/* Server URL Settings Footer */}
                <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Server: {serverUrlInput.replace('/api/v1', '')}</span>
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 hover:underline"
                  >
                    <Settings size={11} /> {showSettings ? 'Hide Settings' : 'Server Config'}
                  </button>
                </div>

                {showSettings && (
                  <div className="mt-3 p-3 bg-slate-900 rounded-2xl border border-slate-800 space-y-2">
                    <label className="block text-[11px] font-semibold text-slate-300">Backend API URL</label>
                    <input
                      type="text"
                      value={serverUrlInput}
                      onChange={(e) => setServerUrlInput(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-slate-200"
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
          </div>
        </section>

        {/* FULL NOTES EXPLORER */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Layers size={20} className="text-indigo-400" />
              All Saved Notes ({filteredNotes.length})
            </h3>

            <div className="relative w-72">
              <Search size={15} className="absolute left-3.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search notes or domain..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {filteredNotes.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800/60 space-y-3">
              <FileText size={40} className="mx-auto text-slate-600" />
              <p className="text-sm font-semibold text-slate-400">No notes found matching search</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredNotes.map((note) => (
                <div
                  key={note.urlKey}
                  className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-indigo-500/40 transition-all flex flex-col justify-between space-y-3 group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                        {note.domain}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(note.updatedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-100 line-clamp-1 group-hover:text-indigo-300 transition-colors">
                      {note.title || 'Untitled Note'}
                    </h4>

                    <div
                      className="text-xs text-slate-300 line-clamp-4 leading-relaxed font-sans opacity-90"
                      dangerouslySetInnerHTML={{ __html: note.content || '<em>Empty note</em>' }}
                    />
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleCopy(note.urlKey, note.content)}
                        className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                        title="Copy Note Text"
                      >
                        {copiedKey === note.urlKey ? (
                          <CheckCircle2 size={14} className="text-emerald-400" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                      <a
                        href={note.fullUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                        title="Open Note Page"
                      >
                        <ExternalLink size={14} />
                      </a>
                    </div>

                    <button
                      onClick={() => handleDeleteNoteItem(note.urlKey)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                      title="Delete Note"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
