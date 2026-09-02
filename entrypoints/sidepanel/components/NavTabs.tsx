import React from 'react';
import { FileText, Globe, Layers } from 'lucide-react';

export type ActiveTab = 'page' | 'website' | 'all';

interface NavTabsProps {
  activeNav: ActiveTab;
  setActiveNav: (tab: ActiveTab) => void;
  websiteNotesCount: number;
  allNotesCount: number;
  onSelectActivePage: () => void;
}

export const NavTabs: React.FC<NavTabsProps> = ({
  activeNav,
  setActiveNav,
  websiteNotesCount,
  allNotesCount,
  onSelectActivePage,
}) => {
  return (
    <nav className="nav-tabs">
      <button
        className={`nav-tab ${activeNav === 'page' ? 'active' : ''}`}
        onClick={onSelectActivePage}
      >
        <FileText size={14} />
        <span>Active Page</span>
      </button>

      <button
        className={`nav-tab ${activeNav === 'website' ? 'active' : ''}`}
        onClick={() => setActiveNav('website')}
      >
        <Globe size={14} />
        <span>This Website ({websiteNotesCount})</span>
      </button>

      <button
        className={`nav-tab ${activeNav === 'all' ? 'active' : ''}`}
        onClick={() => setActiveNav('all')}
      >
        <Layers size={14} />
        <span>All Saved ({allNotesCount})</span>
      </button>
    </nav>
  );
};
