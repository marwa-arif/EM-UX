import React from 'react'
import { Icons } from '../ui.jsx'

const CriticalIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const WarningIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

const SuccessIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

const InfoIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>
);

const RetryIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="1 4 1 10 7 10"/>
    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
  </svg>
);

const FileIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
  </svg>
);

const TYPE_META = {
  critical: { icon: <CriticalIcon />, className: 'notif-panel__icon--critical' },
  warning:  { icon: <WarningIcon />,  className: 'notif-panel__icon--warning' },
  success:  { icon: <SuccessIcon />,  className: 'notif-panel__icon--success' },
  info:     { icon: <InfoIcon />,     className: 'notif-panel__icon--info' },
};

const DOWNLOAD_STATUS_META = {
  processing:    { label: 'Processing',  className: 'notif-panel__dl-badge--processing' },
  'in-progress': { label: 'Downloading', className: 'notif-panel__dl-badge--in-progress' },
  completed:     { label: 'Completed',   className: 'notif-panel__dl-badge--completed' },
  failed:        { label: 'Failed',      className: 'notif-panel__dl-badge--failed' },
};

export const initialNotifications = [
  {
    id: 'n1', type: 'critical', read: false,
    title: 'Data source sync failed',
    message: 'Salesforce connector failed to sync — last successful sync 6h ago.',
    timestamp: '12m ago',
  },
  {
    id: 'n2', type: 'warning', read: false,
    title: 'New critical findings detected',
    message: '3 new critical findings surfaced in the Compliance scan for Vendor XYZ.',
    timestamp: '1h ago',
  },
  {
    id: 'n3', type: 'info', read: false,
    title: 'Weekly report ready',
    message: 'Your Exposure Factors report for Q3 is ready to view.',
    timestamp: '3h ago',
  },
  {
    id: 'n4', type: 'success', read: true,
    title: 'Remediation completed',
    message: 'Finding #4021 was marked resolved by J. Alvarez.',
    timestamp: '1d ago',
  },
  {
    id: 'n5', type: 'info', read: true,
    title: 'New vendor onboarded',
    message: 'Acme Corp was added to your vendor inventory.',
    timestamp: '2d ago',
  },
];

export const initialDownloads = [
  {
    id: 'd0', name: 'Risk-Assessment-Summary.pdf',
    status: 'processing', size: '—', timestamp: 'Just now',
  },
  {
    id: 'd1', name: 'Exposure-Factors-Report-Q3.xlsx',
    status: 'completed', size: '2.4 MB', timestamp: '10m ago',
  },
  {
    id: 'd2', name: 'Compliance-Findings.csv',
    status: 'in-progress', progress: 62, size: '—', timestamp: '1m ago',
  },
  {
    id: 'd3', name: 'Vendor-XYZ-Assessment.pdf',
    status: 'failed', size: '—', timestamp: '25m ago',
  },
  {
    id: 'd4', name: 'Asset-Inventory-Export.xlsx',
    status: 'completed', size: '5.1 MB', timestamp: '2h ago',
  },
  {
    id: 'd5', name: 'Findings-Summary.csv',
    status: 'failed', size: '—', timestamp: '1d ago',
  },
];

function NotificationPanel({
  notifications, filter, onFilterChange, onMarkAllRead, onMarkRead, onDismiss,
  downloads, onRetryDownload, onDismissDownload,
}) {
  const unreadCount = notifications.filter(n => !n.read).length;
  const failedDownloadCount = downloads.filter(d => d.status === 'failed').length;
  const visible = filter === 'unread' ? notifications.filter(n => !n.read) : notifications;

  return (
    <div className="notif-panel" role="menu">
      <div className="notif-panel__header">
        <span className="notif-panel__title">Notifications</span>
        {filter !== 'downloads' && (
          <button
            className="notif-panel__mark-all"
            disabled={unreadCount === 0}
            onClick={onMarkAllRead}
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="notif-panel__tabs">
        <button
          className={`notif-panel__tab${filter === 'all' ? ' notif-panel__tab--active' : ''}`}
          onClick={() => onFilterChange('all')}
        >
          All
        </button>
        <button
          className={`notif-panel__tab${filter === 'unread' ? ' notif-panel__tab--active' : ''}`}
          onClick={() => onFilterChange('unread')}
        >
          Unread{unreadCount > 0 ? ` (${unreadCount})` : ''}
        </button>
        <button
          className={`notif-panel__tab${filter === 'downloads' ? ' notif-panel__tab--active' : ''}`}
          onClick={() => onFilterChange('downloads')}
        >
          Downloads
          {failedDownloadCount > 0 && <span className="notif-panel__tab-dot" />}
        </button>
      </div>

      {filter === 'downloads' ? (
        <div className="notif-panel__body">
          {downloads.length === 0 && (
            <div className="notif-panel__empty">No downloads yet</div>
          )}
          {downloads.map(d => {
            const meta = DOWNLOAD_STATUS_META[d.status] || DOWNLOAD_STATUS_META.completed;
            return (
              <div key={d.id} className="notif-panel__item notif-panel__item--download">
                <span className="notif-panel__icon notif-panel__icon--file"><FileIcon /></span>
                <div className="notif-panel__item-body">
                  <div className="notif-panel__item-title">{d.name}</div>
                  <div className="notif-panel__dl-meta">
                    <span className={`notif-panel__dl-badge ${meta.className}`}>{meta.label}</span>
                    <span className="notif-panel__item-timestamp">{d.size} · {d.timestamp}</span>
                  </div>
                  {d.status === 'processing' && (
                    <div className="notif-panel__dl-progress">
                      <div className="notif-panel__dl-progress-track">
                        <div className="notif-panel__dl-progress-fill notif-panel__dl-progress-fill--indeterminate" />
                      </div>
                      <span className="notif-panel__dl-progress-pct">Preparing…</span>
                    </div>
                  )}
                  {d.status === 'in-progress' && (
                    <div className="notif-panel__dl-progress">
                      <div className="notif-panel__dl-progress-track">
                        <div className="notif-panel__dl-progress-fill" style={{ width: `${d.progress}%` }} />
                      </div>
                      <span className="notif-panel__dl-progress-pct">{d.progress}%</span>
                    </div>
                  )}
                </div>
                {d.status === 'failed' && (
                  <button className="notif-panel__dl-retry" onClick={() => onRetryDownload(d.id)}>
                    <RetryIcon /> Retry
                  </button>
                )}
                {d.status !== 'processing' && d.status !== 'in-progress' && (
                  <button
                    className="notif-panel__dismiss"
                    title="Dismiss"
                    onClick={() => onDismissDownload(d.id)}
                  >
                    {Icons.close}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="notif-panel__body">
          {visible.length === 0 && (
            <div className="notif-panel__empty">
              {filter === 'unread' ? "You're all caught up" : 'No notifications yet'}
            </div>
          )}
          {visible.map(n => {
            const meta = TYPE_META[n.type] || TYPE_META.info;
            return (
              <div
                key={n.id}
                className={`notif-panel__item${n.read ? '' : ' notif-panel__item--unread'}`}
                onClick={() => !n.read && onMarkRead(n.id)}
              >
                <span className={`notif-panel__icon ${meta.className}`}>{meta.icon}</span>
                <div className="notif-panel__item-body">
                  <div className="notif-panel__item-title">{n.title}</div>
                  <div className="notif-panel__item-message">{n.message}</div>
                  <div className="notif-panel__item-timestamp">{n.timestamp}</div>
                </div>
                {!n.read && <span className="notif-panel__item-dot" />}
                <button
                  className="notif-panel__dismiss"
                  title="Dismiss"
                  onClick={(e) => { e.stopPropagation(); onDismiss(n.id); }}
                >
                  {Icons.close}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default NotificationPanel;
