import React, { useState, useEffect } from 'react';
import {
  Cloud,
  Server,
  ShieldCheck,
  LayoutDashboard,
  Layers,
  Pin,
  Trash2,
  Archive,
  RefreshCw,
} from 'lucide-react';
import {
  getAllNotes,
  deleteNote,
  restoreNote,
  purgeNotePermanently,
  type Note,
} from '../../lib/db';
import {
  getAuthenticatedUser,
  getServerUrl,
  setServerUrl,
  loginApi,
  registerApi,
  logoutApi,
  restoreFromCloud,
  backupNoteToCloud,
  fetchCloudBackupExplorer,
  restoreDeletedCloudNote,
  purgeCloudNote,
  type UserProfile,
  type CloudBackupExplorerData,
} from '../../lib/sync';
import { extractDomain } from '../../lib/urlKey';
import { ErrorBoundary } from '../sidepanel/components/ErrorBoundary';
import { OverviewTab } from './components/OverviewTab';
import { CloudNotesTab } from './components/CloudNotesTab';
import { DomainPinsTab } from './components/DomainPinsTab';
import { CloudTrashTab } from './components/CloudTrashTab';
import { ExportImportTab } from './components/ExportImportTab';

type ActiveTab = 'overview' | 'notes' | 'pins' | 'trash' | 'export';

export default function DashboardApp() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [serverUrlInput, setServerUrlInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  // Local & Cloud Data
  const [allNotes, setAllNotes] = useState<Note[]>([]);
  const [cloudExplorerData, setCloudExplorerData] = useState<CloudBackupExplorerData | null>(null);

  useEffect(() => {
    document.body.classList.add('dashboard-body');
    loadData();
    return () => {
      document.body.classList.remove('dashboard-body');
    };
  }, []);

  const loadData = async () => {
    try {
      const profile = await getAuthenticatedUser();
      setUser(profile);
      const currentUrl = await getServerUrl();
      setServerUrlInput(currentUrl);

      const localNotes = await getAllNotes();
      setAllNotes(localNotes);

      if (profile) {
        try {
          const cloudData = await fetchCloudBackupExplorer();
          setCloudExplorerData(cloudData);
        } catch {
          // Cloud fetch failed silently if offline or token expired
        }
      }
    } catch (err: any) {
      console.error('Error loading dashboard data:', err);
    }
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
      setSuccessMsg(`Synced & Restored ${result.notesCount} notes & ${result.pinsCount} domain pins!`);
      
      const localNotes = await getAllNotes();
      setAllNotes(localNotes);

      const cloudData = await fetchCloudBackupExplorer();
      setCloudExplorerData(cloudData);
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
      setSuccessMsg(`Synced & Restored ${result.notesCount} notes & ${result.pinsCount} pins!`);
      
      const localNotes = await getAllNotes();
      setAllNotes(localNotes);

      const cloudData = await fetchCloudBackupExplorer();
      setCloudExplorerData(cloudData);
    } catch (err: any) {
      setErrorMsg(err.message || 'Restore failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logoutApi();
    setUser(null);
    setCloudExplorerData(null);
    setSuccessMsg('Logged out successfully.');
  };

  const handleSaveServerUrl = async () => {
    await setServerUrl(serverUrlInput);
    setSuccessMsg('Server URL updated!');
    setShowSettings(false);
  };

  const handleDeleteNoteItem = async (urlKey: string) => {
    if (window.confirm('Delete this note from local storage and cloud backup?')) {
      const noteToDelete = allNotes.find((n) => n.urlKey === urlKey);
      const domain = noteToDelete?.domain || extractDomain(urlKey) || 'other';

      await deleteNote(urlKey);

      // Soft-delete from cloud backup
      await backupNoteToCloud({
        urlKey,
        domain,
        fullUrl: noteToDelete?.fullUrl || '',
        title: '',
        content: '',
        isDeleted: true,
      });

      const localNotes = await getAllNotes();
      setAllNotes(localNotes);

      if (user) {
        const cloudData = await fetchCloudBackupExplorer().catch(() => null);
        if (cloudData) setCloudExplorerData(cloudData);
      }
    }
  };

  const handleRestoreDeletedNote = async (urlKey: string) => {
    try {
      await restoreNote(urlKey);
      await restoreDeletedCloudNote(urlKey);
      await restoreFromCloud();
      const localNotes = await getAllNotes();
      setAllNotes(localNotes);

      const cloudData = await fetchCloudBackupExplorer();
      setCloudExplorerData(cloudData);
      setSuccessMsg('Note restored successfully from cloud trash bin!');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to restore note');
    }
  };

  const handlePurgeNote = async (urlKey: string) => {
    if (window.confirm('Permanently purge this note from local storage and cloud MongoDB? This action cannot be undone.')) {
      try {
        await purgeNotePermanently(urlKey);
        await purgeCloudNote(urlKey);
        const cloudData = await fetchCloudBackupExplorer();
        setCloudExplorerData(cloudData);
        setSuccessMsg('Note permanently purged from local storage and cloud backup.');
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to purge note');
      }
    }
  };

  const uniqueDomains = Array.from(new Set(allNotes.map((n) => n.domain || 'other')));

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  return (
    <ErrorBoundary>
      <div className="dash-root">
        {/* TOP NAVIGATION BAR */}
        <header className="dash-nav">
          <div className="dash-nav-container">
            <div className="dash-brand">
              <div className="dash-logo-box">
                <Cloud size={20} className="dash-logo-icon" />
              </div>
              <div>
                <h1 className="dash-brand-title">WebMemo Cloud Dashboard</h1>
                <p className="dash-brand-sub">Local-First Persistence & Synchronization Engine</p>
              </div>
            </div>

            {/* TAB PORTAL NAV BUTTONS */}
            <div className="dash-nav-tabs">
              <button
                onClick={() => setActiveTab('overview')}
                className={`dash-nav-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
              >
                <LayoutDashboard size={14} /> Overview
              </button>
              <button
                onClick={() => setActiveTab('notes')}
                className={`dash-nav-tab-btn ${activeTab === 'notes' ? 'active' : ''}`}
              >
                <Layers size={14} /> Cloud Notes ({allNotes.length})
              </button>
              <button
                onClick={() => setActiveTab('pins')}
                className={`dash-nav-tab-btn ${activeTab === 'pins' ? 'active' : ''}`}
              >
                <Pin size={14} /> Pins ({cloudExplorerData?.stats.totalPins || 0})
              </button>
              <button
                onClick={() => setActiveTab('trash')}
                className={`dash-nav-tab-btn ${activeTab === 'trash' ? 'active' : ''}`}
              >
                <Trash2 size={14} /> Trash ({cloudExplorerData?.stats.totalDeletedNotes || 0})
              </button>
              <button
                onClick={() => setActiveTab('export')}
                className={`dash-nav-tab-btn ${activeTab === 'export' ? 'active' : ''}`}
              >
                <Archive size={14} /> Export & Tools
              </button>
            </div>

            <div className="dash-nav-right">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className={`dash-refresh-btn ${isRefreshing ? 'refreshing' : ''}`}
                title="Refresh page data & cloud sync"
              >
                <RefreshCw size={13} className={isRefreshing ? 'dash-spin' : ''} />
                <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>

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

        {/* MAIN CONTAINER FOR MODULAR TABS */}
        <main className="dash-main">
          {activeTab === 'overview' && (
            <OverviewTab
              user={user}
              allNotesCount={allNotes.length}
              uniqueDomainsCount={uniqueDomains.length}
              cloudStats={cloudExplorerData?.stats}
              loading={loading}
              errorMsg={errorMsg}
              successMsg={successMsg}
              isRegisterMode={isRegisterMode}
              setIsRegisterMode={setIsRegisterMode}
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              handleAuthSubmit={handleAuthSubmit}
              handleManualRestore={handleManualRestore}
              handleLogout={handleLogout}
              serverUrlInput={serverUrlInput}
              setServerUrlInput={setServerUrlInput}
              showSettings={showSettings}
              setShowSettings={setShowSettings}
              handleSaveServerUrl={handleSaveServerUrl}
              setErrorMsg={setErrorMsg}
            />
          )}

          {activeTab === 'notes' && (
            <CloudNotesTab notes={allNotes} onDeleteNote={handleDeleteNoteItem} />
          )}

          {activeTab === 'pins' && (
            <DomainPinsTab pins={cloudExplorerData?.pins || []} />
          )}

          {activeTab === 'trash' && (
            <CloudTrashTab
              deletedNotes={cloudExplorerData?.deletedNotes || []}
              onRestoreDeleted={handleRestoreDeletedNote}
              onPurgeNote={handlePurgeNote}
            />
          )}

          {activeTab === 'export' && (
            <ExportImportTab notes={allNotes} />
          )}
        </main>
      </div>
    </ErrorBoundary>
  );
}
