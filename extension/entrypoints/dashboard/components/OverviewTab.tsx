import React from 'react';
import {
  FileText,
  Globe,
  Database,
  Cloud,
  Sparkles,
  Zap,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  LogOut,
  Mail,
  Lock,
  EyeOff,
  Eye,
  ArrowRight,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import type { UserProfile } from '../../../lib/sync';

interface OverviewTabProps {
  user: UserProfile | null;
  allNotesCount: number;
  uniqueDomainsCount: number;
  cloudStats?: {
    totalActiveNotes: number;
    totalDeletedNotes: number;
    totalPins: number;
    totalDomains: number;
  };
  loading: boolean;
  errorMsg: string;
  successMsg: string;
  isRegisterMode: boolean;
  setIsRegisterMode: (val: boolean) => void;
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  showPassword: boolean;
  setShowPassword: (val: boolean) => void;
  handleAuthSubmit: (e: React.FormEvent) => void;
  handleManualRestore: () => void;
  handleLogout: () => void;
  serverUrlInput: string;
  setServerUrlInput: (val: string) => void;
  showSettings: boolean;
  setShowSettings: (val: boolean) => void;
  handleSaveServerUrl: () => void;
  setErrorMsg: (val: string) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  user,
  allNotesCount,
  uniqueDomainsCount,
  cloudStats,
  loading,
  errorMsg,
  successMsg,
  isRegisterMode,
  setIsRegisterMode,
  email,
  setEmail,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  handleAuthSubmit,
  handleManualRestore,
  handleLogout,
  serverUrlInput,
  setServerUrlInput,
  showSettings,
  setShowSettings,
  handleSaveServerUrl,
  setErrorMsg,
}) => {
  return (
    <div className="dash-overview-tab">
      {/* STATS SUMMARY METRICS BAR */}
      <div className="dash-metrics-grid">
        <div className="dash-metric-card">
          <div className="dash-metric-icon-box dash-icon-indigo">
            <FileText size={22} />
          </div>
          <div>
            <p className="dash-metric-value">{allNotesCount}</p>
            <p className="dash-metric-label">Saved Local Notes</p>
          </div>
        </div>

        <div className="dash-metric-card">
          <div className="dash-metric-icon-box dash-icon-purple">
            <Globe size={22} />
          </div>
          <div>
            <p className="dash-metric-value">{uniqueDomainsCount}</p>
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
            <p className="dash-metric-value">
              {user ? `${cloudStats?.totalActiveNotes ?? allNotesCount} Cloud Notes` : 'Offline'}
            </p>
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
              WebMemo operates with a local-first philosophy. All your note-taking happens directly against IndexedDB in 0ms. When signed in, background sync automatically backs up your notes to MongoDB.
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
    </div>
  );
};
