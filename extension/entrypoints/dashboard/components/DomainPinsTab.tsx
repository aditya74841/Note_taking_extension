import React from 'react';
import { Pin, Globe, ExternalLink, Trash2 } from 'lucide-react';
import type { CloudPinItem } from '../../../lib/sync';

interface DomainPinsTabProps {
  pins: CloudPinItem[];
  onUnpinDomain?: (domain: string) => void;
}

export const DomainPinsTab: React.FC<DomainPinsTabProps> = ({ pins, onUnpinDomain }) => {
  return (
    <section className="dash-explorer-section">
      <div className="dash-explorer-header">
        <h3 className="dash-explorer-title">
          <Pin size={20} className="dash-icon-amber" />
          Cloud Domain Pins ({pins.length})
        </h3>
      </div>

      {pins.length === 0 ? (
        <div className="dash-empty-box">
          <Pin size={40} className="dash-empty-icon" />
          <p className="dash-empty-text">No domain pins saved in cloud backup</p>
          <p className="dash-empty-sub">
            Pin a note on any website using the pin icon in the sidepanel header to lock it for that domain.
          </p>
        </div>
      ) : (
        <div className="dash-pins-grid">
          {pins.map((pin) => (
            <div key={pin.domain} className="dash-pin-card">
              <div className="dash-pin-header">
                <div className="dash-domain-pill">
                  <Globe size={14} className="icon-indigo" />
                  <span className="font-semibold text-slate-100">{pin.domain}</span>
                </div>
                <span className="dash-pin-badge">
                  <Pin size={11} /> Pinned
                </span>
              </div>

              <h4 className="dash-pin-title">{pin.title || 'Pinned Domain Note'}</h4>
              <p className="dash-pin-url">{pin.fullUrl}</p>

              <div className="dash-pin-footer">
                <a
                  href={pin.fullUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="dash-btn-secondary"
                >
                  <ExternalLink size={13} /> Visit Website
                </a>

                {onUnpinDomain && (
                  <button
                    onClick={() => onUnpinDomain(pin.domain)}
                    className="dash-icon-btn dash-icon-btn-danger"
                    title="Unpin Domain"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
