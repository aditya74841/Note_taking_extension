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

  const uniqueDomains = Array.from(new Set(allNotes.map((n) => n.domain || 'other')));
  const filteredNotes = allNotes.filter(
    (n) =>
      n.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.domain?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="dash-root">
      {/* TOP NAVIGATION BAR */}
      <header className="dash-nav">
        <div className="dash-nav-container">
          <div className="dash-brand">
            <div className="dash-logo-box">
              <Cloud size={20} className="dash-logo-icon" />
            </div>
            <div>
              <h1 className="dash-brand-title">URL Notes Cloud Dashboard</h1>
              <p className="dash-brand-sub">Local-First Persistence & Synchronization Engine</p>
            </div>
          </div>

          <div className="dash-nav-right">
            <div className="dash-server-pill">
              <Server size={13} className="dash-server-icon" />
              <span>{serverUrlInput.replace('/api/v1', '')}</span>
            </div>

            {user ? (
              <div className="dash-user-badge">
                <ShieldCheck size={14} />
                <span>{user.email}</span>
              </div>
            ) : (
              <span className="dash-guest-badge">Guest Mode</span>
            )}
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="dash-main">
        {/* STATS SUMMARY METRICS BAR */}
        <div className="dash-metrics-grid">
          <div className="dash-metric-card">
            <div className="dash-metric-icon-box dash-icon-indigo">
              <FileText size={22} />
            </div>
            <div>
              <p className="dash-metric-value">{allNotes.length}</p>
              <p className="dash-metric-label">Saved Local Notes</p>
            </div>
          </div>

          <div className="dash-metric-card">
            <div className="dash-metric-icon-box dash-icon-purple">
              <Globe size={22} />
            </div>
            <div>
              <p className="dash-metric-value">{uniqueDomains.length}</p>
              <p className="dash-metric-label">Tracked Websites</p>
            </div>
          </div>

          <div className="dash-metric-card">
            <div className="dash-metric-icon-box dash-icon-sky">
              <Database size={22} />
            </div>
            <div>
              <p className="dash-metric-value">IndexedDB</p>
              <p className="dash-metric-label">0ms Local Storage</p>
            </div>
          </div>

          <div className="dash-metric-card">
            <div className="dash-metric-icon-box dash-icon-emerald">
              <Cloud size={22} />
            </div>
            <div>
              <p className="dash-metric-value">{user ? 'Active' : 'Offline'}</p>
              <p className="dash-metric-label">Cloud Backup Engine</p>
            </div>
          </div>
        </div>

        {/* AUTHENTICATION DASHBOARD HERO SECTION */}
        <section className="dash-hero-card">
          <div className="dash-hero-grid">
            {/* Left Column: Feature Highlights */}
            <div className="dash-hero-left">
              <div className="dash-pill-tag">
                <Sparkles size={13} /> Cloud Backup & Synchronization
              </div>
              <h2 className="dash-hero-title">
                Never lose a single web note across any device or browser tab.
              </h2>
              <p className="dash-hero-desc">
                URL Notes operates with a local-first philosophy. All your note-taking happens directly against IndexedDB in 0ms. When signed in, background sync automatically backs up your notes to MongoDB.
              </p>

              <div className="dash-hero-features">
                <div className="dash-feature-box">
                  <Zap size={18} className="dash-icon-amber" />
                  <div>
                    <h4 className="dash-feature-title">0ms Local Response</h4>
                    <p className="dash-feature-sub">Instant save to browser storage</p>
                  </div>
                </div>
                <div className="dash-feature-box">
                  <Cloud size={18} className="dash-icon-sky" />
                  <div>
                    <h4 className="dash-feature-title">Silent Cloud Backup</h4>
                    <p className="dash-feature-sub">Debounced background updates</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Authentication Card */}
            <div className="dash-hero-right">
              <div className="dash-auth-box">
                {/* Banners */}
                {errorMsg && (
                  <div className="dash-banner dash-banner-error">
                    <AlertCircle size={15} />
                    <span>{errorMsg}</span>
                  </div>
                )}
                {successMsg && (
                  <div className="dash-banner dash-banner-success">
                    <CheckCircle2 size={15} />
                    <span>{successMsg}</span>
                  </div>
                )}

                {user ? (
                  <div className="dash-user-panel">
                    <div className="dash-user-info-card">
                      <div>
                        <p className="dash-user-label">Logged In As</p>
                        <p className="dash-user-email">{user.email}</p>
                      </div>
                      <span className="dash-active-tag">Active</span>
                    </div>

                    <div className="dash-user-actions">
                      <button
                        onClick={handleManualRestore}
                        disabled={loading}
                        className="dash-btn-primary"
                      >
                        {loading ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                        One-Time Cloud Restore
                      </button>

                      <div className="dash-btn-row">
                        <button onClick={handleExportJson} className="dash-btn-secondary">
                          <Download size={13} /> Export JSON
                        </button>
                        <label className="dash-btn-secondary dash-upload-label">
                          <Upload size={13} /> Import JSON
                          <input type="file" onChange={handleImportJson} accept=".json" className="hidden" />
                        </label>
                      </div>

                      <button onClick={handleLogout} className="dash-btn-ghost">
                        <LogOut size={13} /> Sign Out
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Login & Signup Form */
                  <div>
                    {/* Tab Switcher */}
                    <div className="dash-tab-bar">
                      <button
                        type="button"
                        onClick={() => {
                          setIsRegisterMode(false);
                          setErrorMsg('');
                        }}
                        className={`dash-tab-btn ${!isRegisterMode ? 'dash-tab-active' : ''}`}
                      >
                        Sign In
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsRegisterMode(true);
                          setErrorMsg('');
                        }}
                        className={`dash-tab-btn ${isRegisterMode ? 'dash-tab-active' : ''}`}
                      >
                        Create Account
                      </button>
                    </div>

                    <form onSubmit={handleAuthSubmit} className="dash-form">
                      <div className="dash-form-group">
                        <label className="dash-label">Email Address</label>
                        <div className="dash-input-wrapper">
                          <Mail size={15} className="dash-input-icon" />
                          <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            className="dash-input"
                          />
                        </div>
                      </div>

                      <div className="dash-form-group">
                        <label className="dash-label">Password</label>
                        <div className="dash-input-wrapper">
                          <Lock size={15} className="dash-input-icon" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="dash-input"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="dash-eye-btn"
                          >
                            {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                      </div>

                      <button type="submit" disabled={loading} className="dash-btn-primary">
                        {loading ? (
                          <>
                            <RefreshCw size={14} className="animate-spin" /> Processing...
                          </>
                        ) : (
                          <>
                            {isRegisterMode ? 'Register Account & Sync' : 'Sign In & Restore'}
                            <ArrowRight size={14} />
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                )}

                {/* Server URL Settings Footer */}
                <div className="dash-server-footer">
                  <span>Server: {serverUrlInput.replace('/api/v1', '')}</span>
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="dash-settings-toggle"
                  >
                    <Settings size={11} /> {showSettings ? 'Hide Settings' : 'Server Config'}
                  </button>
                </div>

                {showSettings && (
                  <div className="dash-settings-box">
                    <label className="dash-label">Backend API URL</label>
                    <input
                      type="text"
                      value={serverUrlInput}
                      onChange={(e) => setServerUrlInput(e.target.value)}
                      className="dash-input"
                      placeholder="http://localhost:8000/api/v1"
                    />
                    <button onClick={handleSaveServerUrl} className="dash-btn-secondary">
                      Save Server URL
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* FULL NOTES EXPLORER */}
        <section className="dash-explorer-section">
          <div className="dash-explorer-header">
            <h3 className="dash-explorer-title">
              <Layers size={20} className="dash-icon-indigo" />
              All Saved Notes ({filteredNotes.length})
            </h3>

            <div className="dash-search-box">
              <Search size={15} className="dash-search-icon" />
              <input
                type="text"
                placeholder="Search notes or domain..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="dash-search-input"
              />
            </div>
          </div>

          {filteredNotes.length === 0 ? (
            <div className="dash-empty-box">
              <FileText size={40} className="dash-empty-icon" />
              <p className="dash-empty-text">No notes found matching search</p>
            </div>
          ) : (
            <div className="dash-notes-grid">
              {filteredNotes.map((note) => (
                <div key={note.urlKey} className="dash-note-card">
                  <div className="dash-note-top">
                    <div className="dash-note-meta">
                      <span className="dash-domain-badge">{note.domain}</span>
                      <span className="dash-note-date">
                        {new Date(note.updatedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h4 className="dash-note-title">{note.title || 'Untitled Note'}</h4>

                    <div
                      className="dash-note-body"
                      dangerouslySetInnerHTML={{ __html: note.content || '<em>Empty note</em>' }}
                    />
                  </div>

                  <div className="dash-note-footer">
                    <div className="dash-note-actions-left">
                      <button
                        onClick={() => handleCopy(note.urlKey, note.content)}
                        className="dash-icon-btn"
                        title="Copy Note Text"
                      >
                        {copiedKey === note.urlKey ? (
                          <CheckCircle2 size={14} className="dash-icon-emerald" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                      <a
                        href={note.fullUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="dash-icon-btn"
                        title="Open Note Page"
                      >
                        <ExternalLink size={14} />
                      </a>
                    </div>

                    <button
                      onClick={() => handleDeleteNoteItem(note.urlKey)}
                      className="dash-icon-btn dash-icon-btn-danger"
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
