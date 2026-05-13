const {
  useState: useFPS,
  useRef: useRefFPS,
  useEffect: useEffFPS,
} = React;

const FP_DEFAULT_ATTRS = [
  { id: 'business-unit',     label: 'Business Unit',       sub: null,         icon: 'business-unit',       options: [] },
  { id: 'type-host',         label: 'Type',                sub: 'Host',       icon: 'type',                options: ['Server','Workstation','Mobile','Network','Printers','IOT','Scanners','Hypervisor','Cloud Storage'] },
  { id: 'infra-type',        label: 'Infrastructure Type', sub: null,         icon: 'infrastructure-type', options: [] },
  { id: 'data-source',       label: 'Data Source',         sub: null,         icon: 'data-source',         options: [] },
  { id: 'score',             label: 'Score',               sub: null,         icon: 'score',               options: [] },
  { id: 'asset-criticality', label: 'Asset Criticality',   sub: null,         icon: 'asset-criticality',   options: [] },
  { id: 'type-assessment',   label: 'Type',                sub: 'Assessment', icon: 'type',                options: [] },
];

const FP_SAVED_ITEMS = [
  { id: 'cs',  name: 'Critical Servers',           desc: 'Monitor activity on key servers.',                 author: 'You',      visibility: 'Private', count: 5,  pinned: true  },
  { id: 'chr', name: 'Corporate high risk assets', desc: 'Track sensitive corporate systems.',               author: 'John T',   visibility: 'Public',  count: 12, pinned: true  },
  { id: 'cdm', name: 'Client data management',     desc: 'Manage client information securely.',              author: 'Sarah L',  visibility: 'Public',  count: 8,  pinned: true  },
  { id: 'cm',  name: 'Compliance monitoring',      desc: 'Ensure regulatory compliance across departments.', author: 'Mark R',   visibility: 'Public',  count: 5,  pinned: false },
  { id: 'ir',  name: 'Incident response plans',    desc: 'Prepare for and respond to security incidents.',   author: 'You',      visibility: 'Public',  count: 10, pinned: false },
  { id: 'tif', name: 'Threat intel feeds',         desc: 'Stay ahead of emerging threats.',                  author: 'Jane Doe', visibility: 'Private', count: 8,  pinned: false },
];

const GF_ENTITIES = [
  { id: 'host',         label: 'Host',             file: 'entity-host.svg',              color: '#2B5690', tint: '#E3E9F1', stroke: '#AABBD3', count: 12382    },
  { id: 'storage',      label: 'Storage',          file: 'entity-storage.svg',           color: '#3A96C4', tint: '#E5F1F7', stroke: '#B0D5E7', count: 4070     },
  { id: 'cluster',      label: 'Cluster',          file: 'entity-cluster.svg',           color: '#3434B4', tint: '#E5E5F5', stroke: '#AEAEE1', count: 378      },
  { id: 'identity',     label: 'Identity',         file: 'entity-identity.svg',          color: '#A842D2', tint: '#F4E6F9', stroke: '#DCB3ED', count: 9928     },
  { id: 'network',      label: 'Network',          file: 'entity-network.svg',           color: '#00895E', tint: '#DEF0EA', stroke: '#99D0BF', count: 6389     },
  { id: 'finding',      label: 'Findings',         file: 'entity-finding.svg',           color: '#582DBB', tint: '#E9E4F6', stroke: '#BCABE4', count: 1398278  },
  { id: 'account',      label: 'Account',          file: 'entity-account.svg',           color: '#9269CF', tint: '#F1ECF9', stroke: '#D3C3EC', count: 15301    },
  { id: 'group',        label: 'Group',            file: 'entity-group.svg',             color: '#27BDC2', tint: '#E3F6F7', stroke: '#A9E5E7', count: 2        },
  { id: 'person',       label: 'Person',           file: 'entity-person.svg',            color: '#2E7690', tint: '#E4EDF1', stroke: '#ABC8D3', count: 304      },
  { id: 'application',  label: 'Application',      file: 'entity-application.svg',       color: '#AD803D', tint: '#F4EEE6', stroke: '#DECCB1', count: 4376     },
  { id: 'vulnerability',label: 'Vulnerability',    file: 'entity-vulnerability.svg',     color: '#AE5757', tint: '#F4E9E9', stroke: '#DFBCBC', count: 55230    },
  { id: 'assessment',   label: 'Assessment',       file: 'entity-assessment.svg',        color: '#AC6C36', tint: '#F4ECE5', stroke: '#DEC4AF', count: 497      },
  { id: 'container',    label: 'Container',        file: 'entity-cloud-container.svg',   color: '#66329C', tint: '#EBE4F2', stroke: '#C2ADD7', count: 358      },
  { id: 'cloudAccount', label: 'Cloud Account',    file: 'entity-cloud-account.svg',     color: '#3B43B0', tint: '#E6E7F5', stroke: '#B1B4DF', count: 15       },
  { id: 'ticket',       label: 'Ticket',           file: 'entity-ticket.svg',            color: '#3DBAAD', tint: '#E6F6F4', stroke: '#B1E3DE', count: 10       },
  { id: 'netSvc',       label: 'Network Services', file: 'entity-network-services.svg',  color: '#89A833', tint: '#F0F4E4', stroke: '#D0DCAD', count: 253      },
  { id: 'netIface',     label: 'Net Interface',    file: 'entity-network-interface.svg', color: '#BA3D8C', tint: '#F6E6F0', stroke: '#E3B1D1', count: 3303     },
];

const GF_DEFAULT_SHOWN = ['host', 'storage', 'cluster', 'identity', 'network', 'finding'];

const SHOW_LIMIT = 8;

// ── helpers ──────────────────────────────────────────────────────────────────

function FPAttrIcon({ icon, size = 16 }) {
  return <img src={`assets/icons/${icon}.svg`} width={size} height={size} alt="" style={{ flexShrink: 0 }} />;
}

function FPDragHandle() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" style={{ display: 'block' }}>
      <circle cx="4"  cy="3"  r="1.2"/><circle cx="10" cy="3"  r="1.2"/>
      <circle cx="4"  cy="7"  r="1.2"/><circle cx="10" cy="7"  r="1.2"/>
      <circle cx="4"  cy="11" r="1.2"/><circle cx="10" cy="11" r="1.2"/>
    </svg>
  );
}

function FPSubTooltip({ sub, children }) {
  const [show, setShow] = useFPS(false);
  return (
    <span
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <span style={{
          position: 'absolute', bottom: 'calc(100% + 6px)', left: '50%',
          transform: 'translateX(-50%)', background: '#1D1D1D', color: '#fff',
          fontSize: 11, fontWeight: 400, padding: '4px 8px', borderRadius: 4,
          whiteSpace: 'nowrap', zIndex: 200, pointerEvents: 'none',
          boxShadow: '0 2px 8px rgba(0,0,0,0.18)', lineHeight: 1.4,
        }}>
          {`Type is the attribute of the entity ${sub}`}
          <span style={{
            position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
            width: 0, height: 0,
            borderLeft: '4px solid transparent', borderRight: '4px solid transparent',
            borderTop: '4px solid #1D1D1D',
          }} />
        </span>
      )}
    </span>
  );
}

function FPCheckbox({ checked, indeterminate, onChange }) {
  return (
    <div onClick={onChange} style={{
      width: 14, height: 14, borderRadius: 3, cursor: 'pointer', flexShrink: 0,
      border: (checked || indeterminate) ? 'none' : '1.5px solid #E6E6E6',
      background: (checked || indeterminate) ? '#6360D8' : '#fff',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      boxSizing: 'border-box', transition: 'background 100ms',
    }}>
      {checked && (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M2 5l2.5 2.5L8 3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
      {!checked && indeterminate && (
        <svg width="8" height="2" viewBox="0 0 8 2" fill="none">
          <path d="M0.5 1h7" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      )}
    </div>
  );
}

function FPSavedCard({ item, selected, applied, onSelect }) {
  const dot = <span style={{ display: 'inline-block', width: 4, height: 4, borderRadius: '50%', background: '#CFCFCF', flexShrink: 0 }} />;
  return (
    <div onClick={onSelect} style={{
      background: '#fff', border: `1px solid ${selected ? PAI.indigo : PAI.borderStrong}`,
      borderRadius: 8, padding: 12, cursor: 'pointer',
    }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 14, fontWeight: 500, color: '#101010' }}>{item.name}</span>
              {applied && (
                <span style={{
                  background: '#EEF0FB', border: `1px solid ${PAI.indigo}`, borderRadius: 44,
                  padding: '1px 8px', fontSize: 12, fontWeight: 500, color: PAI.indigo,
                  flexShrink: 0, lineHeight: '17px',
                }}>Applied</span>
              )}
            </div>
            <span style={{ fontSize: 12, color: PAI.fg3, lineHeight: 1.4 }}>{item.desc}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: PAI.fg3 }}>{item.author}</span>
            {dot}
            <span style={{ fontSize: 12, color: PAI.fg3 }}>{item.visibility}</span>
            {dot}
            <span style={{ fontSize: 12, color: PAI.fg3 }}>{item.count} filters</span>
          </div>
        </div>
        {item.pinned && (
          <img src="assets/icons/pin.svg" width={16} height={16} alt="" style={{ flexShrink: 0, marginTop: 2 }} />
        )}
      </div>
    </div>
  );
}

function FPStepper({ value, onChange, min = 1, max = 20 }) {
  return (
    <div style={{
      background: '#F5F5F5', border: '1px solid #D8D9DD', borderRadius: 8,
      height: 32, display: 'inline-flex', alignItems: 'center',
      padding: '0 4px', gap: 2, width: 64, boxSizing: 'border-box',
    }}>
      <span style={{ flex: 1, fontSize: 14, color: PAI.fg1, paddingLeft: 4 }}>{value}</span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0, flexShrink: 0 }}>
        <button onClick={() => onChange(Math.min(max, value + 1))} style={{
          background: 'none', border: 'none', padding: 0, cursor: 'pointer', lineHeight: 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center', height: 14, color: PAI.fg3,
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
        </button>
        <button onClick={() => onChange(Math.max(min, value - 1))} style={{
          background: 'none', border: 'none', padding: 0, cursor: 'pointer', lineHeight: 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center', height: 14, color: PAI.fg3,
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
        </button>
      </div>
    </div>
  );
}

// ── Graph filter node (shared by the drawer) ──────────────────────────────
function GFNode({ entity, selected, dimmed, onClick, onContextMenu }) {
  const [hovered, setHovered] = useFPS(false);
  return (
    <div
      onClick={onClick}
      onContextMenu={onContextMenu}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
        cursor: 'pointer', userSelect: 'none',
        opacity: dimmed ? 0.3 : 1, transition: 'opacity 150ms',
      }}
    >
      <div style={{
        background: '#fff', border: '1px solid #D0D3D9', borderRadius: 44,
        padding: '2px 10px', fontSize: 11, fontWeight: 600, color: '#101010',
        whiteSpace: 'nowrap', boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      }}>
        {entity.count.toLocaleString()}
      </div>
      <div style={{
        width: 52, height: 52, borderRadius: '50%',
        background: selected ? entity.color : entity.tint,
        border: `${selected ? 2.5 : hovered ? 2 : 1.5}px solid ${selected ? entity.color : entity.stroke}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: selected ? `0 0 0 4px ${entity.tint}, 0 4px 12px rgba(0,0,0,0.12)` : hovered ? '0 4px 12px rgba(0,0,0,0.1)' : '0 2px 6px rgba(0,0,0,0.06)',
        transition: 'all 150ms', flexShrink: 0,
      }}>
        <img src={`assets/icons/${entity.file}`} width={26} height={26} alt="" style={{ display: 'block' }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 500, color: selected ? entity.color : '#1D1D1D', transition: 'color 150ms' }}>
        {entity.label}
      </span>
    </div>
  );
}

// ── Graph Filter side drawer ──────────────────────────────────────────────
function GraphFilterDrawer({ open, onClose, onApply, top = 0 }) {
  const [gfShownIds,    setGfShownIds]    = useFPS(GF_DEFAULT_SHOWN);
  const [gfSelectedIds, setGfSelectedIds] = useFPS(new Set());
  const [gfContextMenu, setGfContextMenu] = useFPS(null);
  const [gfAddHideOpen, setGfAddHideOpen] = useFPS(false);

  const gfShownEntities = GF_ENTITIES.filter(e => gfShownIds.includes(e.id));

  const toggleGFNode = (id) => setGfSelectedIds(prev => {
    const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next;
  });
  const toggleGFShown = (id) => setGfShownIds(prev =>
    prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
  );
  const addFromMenu = () => {
    if (!gfContextMenu) return;
    setGfSelectedIds(prev => { const n = new Set(prev); n.add(gfContextMenu.entityId); return n; });
    setGfContextMenu(null);
  };

  const handleApply = () => {
    onApply && onApply(gfSelectedIds.size);
  };
  const handleClearAll = () => {
    setGfSelectedIds(new Set());
    onApply && onApply(0);
  };

  const canvasBtnStyle = {
    width: 32, height: 32, padding: 0,
    background: '#fff', border: '1px solid #E6E6E6', borderRadius: 8,
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: PAI.fg2, boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
  };

  return (
    <>
      {/* Backdrop — scoped to canvas area only */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', top: top, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.3)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'all' : 'none',
          transition: 'opacity 280ms cubic-bezier(0.4,0,0.2,1)',
          zIndex: 998,
        }}
      />

      {/* Drawer */}
      <div
        onClick={() => { if (gfContextMenu) setGfContextMenu(null); if (gfAddHideOpen) setGfAddHideOpen(false); }}
        style={{
          position: 'fixed', top: top, right: 0, bottom: 0,
          width: '75vw',
          background: '#fff',
          borderLeft: '1px solid #E6E6E6',
          boxShadow: '-8px 0 32px rgba(0,0,0,0.1)',
          zIndex: 999,
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 320ms cubic-bezier(0.32,0.72,0,1)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 20px', flexShrink: 0, borderBottom: '1px solid #EFEFEF',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src="assets/icons/navbar-kg.svg" width={18} height={18} alt="" style={{ opacity: 0.7 }} />
            <span style={{ fontSize: 15, fontWeight: 600, color: '#1D1D1D' }}>Graph Filter</span>
          </div>
          <button onClick={onClose} style={{
            width: 28, height: 28, padding: 0, background: 'none',
            border: 'none', cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: PAI.fg3,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Canvas */}
        <div style={{
          flex: 1, position: 'relative', overflow: 'hidden',
          backgroundImage: 'radial-gradient(circle, #CDD1D9 1.2px, transparent 1.2px)',
          backgroundSize: '22px 22px', backgroundColor: '#F5F6F8',
        }}>
          {/* Zoom controls */}
          <div style={{ position: 'absolute', top: 12, left: 16, display: 'flex', flexDirection: 'column', gap: 4, zIndex: 5 }}>
            {[
              { title: 'Zoom in',  icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg> },
              { title: 'Zoom out', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg> },
              { title: 'Center',   icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/></svg> },
            ].map(b => (
              <button key={b.title} title={b.title} style={canvasBtnStyle}>{b.icon}</button>
            ))}
          </div>

          {/* Show Attributes */}
          <button style={{
            position: 'absolute', top: 12, right: 16, zIndex: 5,
            height: 32, padding: '0 14px',
            background: '#fff', border: '1px solid #E6E6E6', borderRadius: 44,
            display: 'flex', alignItems: 'center', gap: 6,
            cursor: 'pointer', fontSize: 13, fontWeight: 500, color: PAI.fg2,
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)', fontFamily: 'inherit',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            Show Attributes
          </button>

          {/* Entity nodes */}
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexWrap: 'wrap', gap: '28px 56px',
            padding: '56px 80px 16px',
          }}>
            {gfShownEntities.map(entity => (
              <GFNode
                key={entity.id}
                entity={entity}
                selected={gfSelectedIds.has(entity.id)}
                dimmed={gfSelectedIds.size > 0 && !gfSelectedIds.has(entity.id)}
                onClick={() => toggleGFNode(entity.id)}
                onContextMenu={(e) => { e.preventDefault(); setGfContextMenu({ entityId: entity.id, x: e.clientX, y: e.clientY }); }}
              />
            ))}
            {gfShownEntities.length === 0 && (
              <div style={{ fontSize: 13, color: PAI.fg3 }}>No entities shown. Use <strong>Add / Hide Entity</strong> to add some.</div>
            )}
          </div>

          {/* Bottom-left tool buttons */}
          <div style={{ position: 'absolute', bottom: 12, left: 16, display: 'flex', flexDirection: 'column', gap: 4, zIndex: 5 }}>
            {[
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2"/></svg>,
            ].map((icon, i) => (
              <button key={i} style={canvasBtnStyle}>{icon}</button>
            ))}
          </div>

          {/* Right-click context menu */}
          {gfContextMenu && (
            <div
              onClick={e => e.stopPropagation()}
              style={{
                position: 'fixed', top: gfContextMenu.y, left: gfContextMenu.x,
                background: '#fff', border: '1px solid #E6E6E6', borderRadius: 8,
                boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 1100, minWidth: 180, overflow: 'hidden',
              }}
            >
              {[
                { label: 'Add to filter', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>, action: addFromMenu },
                { label: 'View more options', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>, action: () => setGfContextMenu(null) },
              ].map(item => (
                <button key={item.label} onClick={item.action} style={{
                  width: '100%', padding: '9px 14px', background: 'none', border: 'none',
                  display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                  fontSize: 13, color: PAI.fg1, fontFamily: 'inherit', textAlign: 'left',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = '#F5F5F7'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <span style={{ color: PAI.fg3 }}>{item.icon}</span>{item.label}
                </button>
              ))}
            </div>
          )}

          {/* Add/Hide Entity popover */}
          {gfAddHideOpen && (
            <div
              onClick={e => e.stopPropagation()}
              style={{
                position: 'absolute', bottom: 56, left: 16,
                background: '#fff', border: '1px solid #E6E6E6', borderRadius: 10,
                boxShadow: '0 4px 20px rgba(0,0,0,0.12)', zIndex: 20,
                width: 220, maxHeight: 280, overflowY: 'auto',
              }}
            >
              <div style={{ padding: '10px 12px 6px', fontSize: 11, fontWeight: 600, color: PAI.fg3, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Entity Types</div>
              {GF_ENTITIES.map(entity => (
                <label key={entity.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', cursor: 'pointer', fontSize: 13, color: PAI.fg1 }}
                  onMouseEnter={e => e.currentTarget.style.background = '#F5F5F7'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <FPCheckbox checked={gfShownIds.includes(entity.id)} onChange={() => toggleGFShown(entity.id)} />
                  <div style={{ width: 18, height: 18, borderRadius: '50%', background: entity.tint, border: `1.5px solid ${entity.stroke}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <img src={`assets/icons/${entity.file}`} width={11} height={11} alt="" />
                  </div>
                  {entity.label}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Toolbar */}
        <div style={{ flexShrink: 0, borderTop: '1px solid #EFEFEF', background: '#fff' }}>
          <div style={{ padding: '8px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={e => { e.stopPropagation(); setGfAddHideOpen(v => !v); }}
              style={{
                height: 32, padding: '0 12px', flexShrink: 0,
                background: gfAddHideOpen ? '#EEEEFB' : '#fff',
                border: `1px solid ${gfAddHideOpen ? PAI.indigo : '#D0D3D9'}`, borderRadius: 6,
                display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                fontSize: 13, fontWeight: 500, color: gfAddHideOpen ? PAI.indigo : PAI.fg1, fontFamily: 'inherit',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/>
                <line x1="14" y1="17.5" x2="21" y2="17.5"/><line x1="17.5" y1="14" x2="17.5" y2="21"/>
              </svg>
              Add / Hide Entity
            </button>

            <span style={{ flex: 1, fontSize: 12, color: '#C07B1A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }}>
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
              </svg>
              Right click any node to add filter or view more options
            </span>

            <button onClick={handleClearAll} style={{
              height: 32, padding: '0 12px', flexShrink: 0,
              background: '#fff', border: '1px solid #E15252', borderRadius: 44,
              display: 'flex', alignItems: 'center', gap: 6,
              cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#E15252', fontFamily: 'inherit',
            }}>
              Clear All
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>
              </svg>
            </button>

            <button onClick={handleApply} style={{
              height: 32, padding: '0 14px', flexShrink: 0,
              background: '#fff', border: `1px solid ${PAI.borderStrong}`, borderRadius: 44,
              display: 'flex', alignItems: 'center', gap: 6,
              cursor: 'pointer', fontSize: 13, fontWeight: 500, color: PAI.fg1, fontFamily: 'inherit',
            }}>
              Apply filter
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </button>
          </div>

          {/* Preview */}
          <div style={{ borderTop: '1px solid #F0F0F0', padding: '7px 20px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', minHeight: 42 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: PAI.fg3, flexShrink: 0 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
              </svg>
              <span style={{ fontSize: 12, fontWeight: 500 }}>Preview</span>
            </div>
            <span style={{ fontSize: 12, color: PAI.fg3 }}>Show</span>
            {gfSelectedIds.size === 0
              ? <span style={{ fontSize: 12, color: PAI.fg3, fontStyle: 'italic' }}>All entities</span>
              : [...gfSelectedIds].map(id => {
                  const ent = GF_ENTITIES.find(e => e.id === id);
                  if (!ent) return null;
                  return (
                    <span key={id} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      background: ent.tint, border: `1px solid ${ent.stroke}`,
                      borderRadius: 44, padding: '2px 8px 2px 6px',
                      fontSize: 12, fontWeight: 500, color: ent.color,
                    }}>
                      <div style={{ width: 14, height: 14, borderRadius: '50%', background: ent.tint, border: `1px solid ${ent.stroke}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src={`assets/icons/${ent.file}`} width={9} height={9} alt="" />
                      </div>
                      {ent.label}
                      <button onClick={() => toggleGFNode(id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1, color: ent.color, display: 'flex', alignItems: 'center' }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </span>
                  );
                })
            }
          </div>
        </div>
      </div>
    </>
  );
}

// ── main filter panel ─────────────────────────────────────────────────────────

function FilterPanel({ onApply, onClose, onOpenGraphFilter, graphFilterOpen }) {
  const [tab,             setTab]            = useFPS('quick');
  const [settingsView,    setSettingsView]   = useFPS(false);
  const [search,          setSearch]         = useFPS('');
  const [savedSearch,     setSavedSearch]    = useFPS('');
  const [expanded,        setExpanded]       = useFPS(new Set(['type-host']));
  const [selections,      setSelections]     = useFPS({});
  const [groupSearch,     setGroupSearch]    = useFPS({});
  const [showAll,         setShowAll]        = useFPS({});
  const [attrs,           setAttrs]          = useFPS(FP_DEFAULT_ATTRS);
  const [pendingAttrs,    setPendingAttrs]   = useFPS(null);
  const [editingId,       setEditingId]      = useFPS(null);
  const [editingLabel,    setEditingLabel]   = useFPS('');
  const [selectedSavedId, setSelectedSavedId] = useFPS(null);
  const [appliedSavedId,  setAppliedSavedId]  = useFPS(null);
  const [savedOrder,      setSavedOrder]     = useFPS(FP_SAVED_ITEMS.map(i => i.id));
  const [savedShowCount,  setSavedShowCount] = useFPS(FP_SAVED_ITEMS.length);
  const [pendingSaved,    setPendingSaved]   = useFPS(null);
  const [qdragIdx,        setQdragIdx]       = useFPS(null);
  const [qdragOver,       setQdragOver]      = useFPS(null);
  const [sdragIdx,        setSdragIdx]       = useFPS(null);
  const [sdragOver,       setSdragOver]      = useFPS(null);

  const liveAttrs      = pendingAttrs || attrs;
  const liveSaved      = pendingSaved || { order: savedOrder, count: savedShowCount };
  const liveSavedItems = liveSaved.order.map(id => FP_SAVED_ITEMS.find(i => i.id === id)).filter(Boolean);

  const toggleExpanded  = (id) => setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleOption    = (attrId, opt) => setSelections(prev => { const c = new Set(prev[attrId] || []); c.has(opt) ? c.delete(opt) : c.add(opt); return { ...prev, [attrId]: c }; });
  const toggleSelectAll = (attr) => setSelections(prev => {
    const cur = prev[attr.id] || new Set();
    return { ...prev, [attr.id]: attr.options.every(o => cur.has(o)) ? new Set() : new Set(attr.options) };
  });

  const enterSettings = () => {
    if (tab === 'saved') setPendingSaved({ order: [...savedOrder], count: savedShowCount });
    else setPendingAttrs([...attrs]);
    setEditingId(null); setSettingsView(true);
  };
  const exitSettings = (save) => {
    if (save) {
      if (tab === 'saved' && pendingSaved) { setSavedOrder(pendingSaved.order); setSavedShowCount(pendingSaved.count); }
      else if (pendingAttrs) setAttrs(pendingAttrs);
    }
    setPendingAttrs(null); setPendingSaved(null); setEditingId(null); setSettingsView(false);
  };

  const deleteAttr  = (id) => { if (liveAttrs.length > 1) setPendingAttrs(liveAttrs.filter(a => a.id !== id)); };
  const startEdit   = (attr) => { setEditingId(attr.id); setEditingLabel(attr.label + (attr.sub ? ` · ${attr.sub}` : '')); };
  const applyEdit   = () => { setPendingAttrs(liveAttrs.map(a => a.id === editingId ? { ...a, label: editingLabel, sub: null } : a)); setEditingId(null); };
  const sortAttrsAZ = () => setPendingAttrs([...liveAttrs].sort((a, b) => (a.label + (a.sub || '')).localeCompare(b.label + (b.sub || ''))));

  const onQDragStart = (i) => setQdragIdx(i);
  const onQDragOver  = (e, i) => { e.preventDefault(); if (i !== qdragIdx) setQdragOver(i); };
  const onQDrop      = (e, i) => { e.preventDefault(); if (qdragIdx === null || qdragIdx === i) { setQdragIdx(null); setQdragOver(null); return; } const arr = [...liveAttrs]; const [m] = arr.splice(qdragIdx, 1); arr.splice(i, 0, m); setPendingAttrs(arr); setQdragIdx(null); setQdragOver(null); };
  const onQDragEnd   = () => { setQdragIdx(null); setQdragOver(null); };

  const onSDragStart = (i) => setSdragIdx(i);
  const onSDragOver  = (e, i) => { e.preventDefault(); if (i !== sdragIdx) setSdragOver(i); };
  const onSDrop      = (e, i) => { e.preventDefault(); if (sdragIdx === null || sdragIdx === i) { setSdragIdx(null); setSdragOver(null); return; } const arr = [...liveSaved.order]; const [m] = arr.splice(sdragIdx, 1); arr.splice(i, 0, m); setPendingSaved({ ...liveSaved, order: arr }); setSdragIdx(null); setSdragOver(null); };
  const onSDragEnd   = () => { setSdragIdx(null); setSdragOver(null); };

  const handleReset = () => {
    if (tab === 'saved') { setSelectedSavedId(null); setAppliedSavedId(null); onApply && onApply(0); }
    else setSelections({});
  };
  const handleApply = () => {
    if (tab === 'saved') { setAppliedSavedId(selectedSavedId); const item = FP_SAVED_ITEMS.find(i => i.id === selectedSavedId); onApply && onApply(item ? item.count : 0); }
    else onApply && onApply(Object.values(selections).filter(s => s && s.size > 0).length);
  };

  const filteredAttrs = attrs.filter(a => !search || (a.label + (a.sub ? ` ${a.sub}` : '')).toLowerCase().includes(search.toLowerCase()));
  const filteredSaved = FP_SAVED_ITEMS.filter(item => !savedSearch || item.name.toLowerCase().includes(savedSearch.toLowerCase()));

  const footerBtn = (variant) => ({
    flex: 1, height: 32, borderRadius: 44, fontSize: 14, fontWeight: 500,
    cursor: 'pointer', fontFamily: 'inherit',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    ...(variant === 'primary'
      ? { background: '#6360D8', border: 'none', color: '#fff' }
      : variant === 'danger'
      ? { background: '#fff', border: '1px solid #E15252', color: '#E15252' }
      : { background: '#fff', border: `1px solid ${PAI.borderStrong}`, color: PAI.fg1 }),
  });

  return (
    <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <style>{`
        .fp-body::-webkit-scrollbar { width: 12px; }
        .fp-body::-webkit-scrollbar-track { background: rgba(0,0,51,0.06); }
        .fp-body::-webkit-scrollbar-thumb { background: rgba(0,8,48,0.27); border-radius: 6px; }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #EFEFEF', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={onClose} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, flexShrink: 0 }}>
            <img src="assets/icons/sidebar-collapse.svg" width={18} height={18} alt="" />
          </button>
          <span style={{ fontSize: 16, fontWeight: 500, color: '#1D1D1D' }}>Filter</span>
        </div>
        <button onClick={settingsView ? () => exitSettings(false) : enterSettings} style={{
          width: 27, height: 27, padding: 0,
          background: settingsView ? '#EEEEFB' : 'none',
          border: `1px solid ${settingsView ? PAI.indigo : PAI.borderStrong}`,
          borderRadius: '50%', cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          color: settingsView ? PAI.indigo : PAI.fg2,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </button>
      </div>

      {/* Tabs */}
      <div style={{ padding: '10px 16px 4px', flexShrink: 0 }}>
        <SegmentedTabs
          value={graphFilterOpen ? 'Graph Filter' : (tab === 'quick' ? 'Quick Filters' : 'Saved Filters')}
          options={['Quick Filters', 'Saved Filters', 'Graph Filter']}
          onChange={(v) => {
            if (v === 'Graph Filter') { onOpenGraphFilter && onOpenGraphFilter(); return; }
            if (graphFilterOpen) onOpenGraphFilter && onOpenGraphFilter();
            setTab(v === 'Quick Filters' ? 'quick' : 'saved');
            setSettingsView(false);
          }}
          fullWidth
          compact
        />
      </div>

      {/* Scrollable body */}
      <div className="fp-body" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', minHeight: 0 }}>

        {/* Quick Settings */}
        {settingsView && tab === 'quick' && (
          <div style={{ padding: '12px 16px 0' }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <button onClick={sortAttrsAZ} style={{
                height: 34, padding: '0 14px', background: '#F5F5F5', border: `1px solid ${PAI.borderStrong}`,
                borderRadius: 44, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 12, fontWeight: 500, color: PAI.fg2, fontFamily: 'inherit',
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M7 12h10M11 18h2"/></svg>
                Sort A–Z
              </button>
              <button onClick={onOpenGraphFilter} style={{
                flex: 1, height: 34, background: '#F3F2FC', border: `1.5px solid ${PAI.indigo}`,
                borderRadius: 44, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                fontSize: 12, fontWeight: 500, color: PAI.indigo, fontFamily: 'inherit',
              }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Add Attributes
              </button>
            </div>
            {liveAttrs.map((attr, i) => {
              const isEditing = editingId === attr.id;
              const isDragging = qdragIdx === i;
              const isOver = qdragOver === i && qdragIdx !== i;
              return (
                <div key={attr.id} onDragOver={(e) => onQDragOver(e, i)} onDrop={(e) => onQDrop(e, i)} style={{ borderTop: isOver ? `2px solid ${PAI.indigo}` : '2px solid transparent' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0', borderBottom: '1px solid #F5F5F5', opacity: isDragging ? 0.4 : 1, transition: 'opacity 120ms' }}>
                    <span draggable onDragStart={() => onQDragStart(i)} onDragEnd={onQDragEnd} style={{ color: '#C8C8C8', cursor: 'grab', flexShrink: 0, display: 'flex' }}><FPDragHandle /></span>
                    <span style={{ flex: 1, fontSize: 12, fontWeight: 500, color: PAI.fg1, minWidth: 0 }}>
                      {attr.label}{attr.sub && <span style={{ color: PAI.fg3 }}> · {attr.sub}</span>}
                    </span>
                    <button onClick={() => startEdit(attr)} style={{ width: 24, height: 24, padding: 0, background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: PAI.fg3, borderRadius: 4, flexShrink: 0 }}
                      onMouseEnter={e => e.currentTarget.style.color = PAI.fg1} onMouseLeave={e => e.currentTarget.style.color = PAI.fg3}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button onClick={() => deleteAttr(attr.id)} disabled={liveAttrs.length <= 1} style={{ width: 24, height: 24, padding: 0, background: 'none', border: 'none', cursor: liveAttrs.length <= 1 ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: liveAttrs.length <= 1 ? '#D0D0D0' : '#E5534B', borderRadius: 4, flexShrink: 0 }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                    </button>
                  </div>
                  {isEditing && (
                    <div style={{ paddingBottom: 12 }}>
                      <input autoFocus value={editingLabel} onChange={e => setEditingLabel(e.target.value)} style={{ width: '100%', height: 32, boxSizing: 'border-box', padding: '0 10px', border: `1.5px solid ${PAI.indigo}`, borderRadius: 6, fontSize: 12, color: PAI.fg1, fontFamily: 'inherit', outline: 'none', marginTop: 8 }} />
                      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        <button onClick={() => setEditingId(null)} style={{ height: 28, padding: '0 14px', background: '#fff', border: `1px solid ${PAI.borderStrong}`, borderRadius: 44, fontSize: 12, fontWeight: 500, color: PAI.fg1, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                        <button onClick={applyEdit} style={{ height: 28, padding: '0 14px', background: PAI.indigo, border: 'none', borderRadius: 44, fontSize: 12, fontWeight: 500, color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>Apply</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Saved Settings */}
        {settingsView && tab === 'saved' && (
          <div style={{ padding: '12px 16px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 16 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#101010', whiteSpace: 'nowrap' }}>Recent Filters</span>
              <div style={{ flex: 1, height: 1, background: PAI.borderStrong }} />
              <FPStepper value={liveSaved.count} onChange={(v) => setPendingSaved({ ...liveSaved, count: v })} />
            </div>
            {liveSavedItems.map((item, i) => {
              const isDragging = sdragIdx === i;
              const isOver = sdragOver === i && sdragIdx !== i;
              return (
                <div key={item.id} onDragOver={(e) => onSDragOver(e, i)} onDrop={(e) => onSDrop(e, i)} style={{ borderTop: isOver ? `2px solid ${PAI.indigo}` : '2px solid transparent', marginBottom: 8 }}>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center', opacity: isDragging ? 0.4 : 1, transition: 'opacity 120ms' }}>
                    <span draggable onDragStart={() => onSDragStart(i)} onDragEnd={onSDragEnd} style={{ color: '#C8C8C8', cursor: 'grab', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24 }}><FPDragHandle /></span>
                    <div style={{ flex: 1, minWidth: 0, background: '#fff', border: `1px solid ${PAI.borderStrong}`, borderRadius: 8, padding: 12 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <span style={{ fontSize: 14, fontWeight: 500, color: '#101010' }}>{item.name}</span>
                            <span style={{ fontSize: 12, color: PAI.fg3, lineHeight: 1.4 }}>{item.desc}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 12, color: PAI.fg3 }}>{item.author}</span>
                            <span style={{ display: 'inline-block', width: 4, height: 4, borderRadius: '50%', background: '#CFCFCF' }} />
                            <span style={{ fontSize: 12, color: PAI.fg3 }}>{item.visibility}</span>
                            <span style={{ display: 'inline-block', width: 4, height: 4, borderRadius: '50%', background: '#CFCFCF' }} />
                            <span style={{ fontSize: 12, color: PAI.fg3 }}>{item.count} filters</span>
                          </div>
                        </div>
                        {item.pinned && <img src="assets/icons/pin.svg" width={16} height={16} alt="" style={{ flexShrink: 0, marginTop: 2 }} />}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Saved Filters view */}
        {!settingsView && tab === 'saved' && (
          <div style={{ padding: '8px 16px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <DSPillSearch value={savedSearch} onChange={setSavedSearch} placeholder="Search Saved Filters" width="100%" />
              </div>
              <button style={{ height: 32, padding: '0 12px', flexShrink: 0, background: 'rgba(99,96,216,0.1)', border: '1px solid #A2A1F7', borderRadius: 68, display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 14, fontWeight: 500, color: PAI.indigo, fontFamily: 'inherit' }}>
                View all
                <img src="assets/icons/explore.svg" width={16} height={16} alt="" />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#101010', whiteSpace: 'nowrap' }}>Recent Filters</span>
                <div style={{ flex: 1, height: 1, background: PAI.borderStrong }} />
              </div>
              {filteredSaved.map(item => (
                <FPSavedCard key={item.id} item={item}
                  selected={selectedSavedId === item.id}
                  applied={appliedSavedId === item.id}
                  onSelect={() => setSelectedSavedId(id => id === item.id ? null : item.id)}
                />
              ))}
              {filteredSaved.length === 0 && <p style={{ fontSize: 12, color: PAI.fg3, textAlign: 'center', padding: '16px 0', margin: 0 }}>No saved filters found.</p>}
            </div>
          </div>
        )}

        {/* Quick Filters view */}
        {!settingsView && tab === 'quick' && (
          <div>
            <div style={{ padding: '8px 16px 10px' }}>
              <DSPillSearch value={search} onChange={setSearch} placeholder="Search Quick Filters" width="100%" />
            </div>
            {filteredAttrs.map((attr) => {
              const isOpen = expanded.has(attr.id);
              const sel    = selections[attr.id] || new Set();
              const gSrch  = groupSearch[attr.id] || '';
              const allOpts = attr.options.filter(o => !gSrch || o.toLowerCase().includes(gSrch.toLowerCase()));
              const visible = showAll[attr.id] ? allOpts : allOpts.slice(0, SHOW_LIMIT);
              const allChk  = attr.options.length > 0 && attr.options.every(o => sel.has(o));
              const someChk = attr.options.some(o => sel.has(o)) && !allChk;
              return (
                <div key={attr.id} style={{ borderBottom: '1px solid #F5F5F5' }}>
                  <button onClick={() => toggleExpanded(attr.id)} style={{ width: '100%', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
                    <span style={{ color: PAI.fg3, flexShrink: 0, display: 'flex' }}><FPAttrIcon icon={attr.icon} size={16} /></span>
                    <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: PAI.fg1, display: 'flex', alignItems: 'center', gap: 6 }}>
                      {attr.label}
                      {attr.sub && <FPSubTooltip sub={attr.sub}><span style={{ color: PAI.fg3, fontWeight: 400 }}> · {attr.sub}</span></FPSubTooltip>}
                      {sel.size > 0 && <span style={{ background: '#E6E6E6', color: '#6E6E6E', borderRadius: '50%', width: 16, height: 16, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, flexShrink: 0 }}>{sel.size}</span>}
                    </span>
                    <span style={{ color: PAI.fg3, flexShrink: 0, display: 'inline-flex', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 150ms' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </span>
                  </button>
                  {isOpen && attr.options.length > 0 && (
                    <div style={{ padding: '0 16px 10px' }}>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                          <DSPillSearch value={gSrch} onChange={v => setGroupSearch(p => ({ ...p, [attr.id]: v }))} placeholder={`Search ${attr.label}`} width="100%" />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={PAI.fg3} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 16V4m0 0L3 8m4-4 4 4M17 8v12m0 0 4-4m-4 4-4-4"/></svg>
                          <span style={{ fontSize: 11, color: PAI.indigo, fontWeight: 500 }}>A-Z</span>
                        </div>
                      </div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: PAI.fg1 }}>
                        <FPCheckbox checked={allChk} indeterminate={someChk} onChange={() => toggleSelectAll(attr)} />
                        Select All
                      </label>
                      {visible.map(opt => (
                        <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', cursor: 'pointer', fontSize: 12, color: PAI.fg1 }}>
                          <FPCheckbox checked={sel.has(opt)} onChange={() => toggleOption(attr.id, opt)} />
                          {opt}
                        </label>
                      ))}
                      {allOpts.length > SHOW_LIMIT && (
                        <button onClick={() => setShowAll(p => ({ ...p, [attr.id]: !p[attr.id] }))} style={{ background: 'none', border: 'none', padding: '4px 0', fontSize: 12, fontWeight: 500, color: '#101010', cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline' }}>
                          {showAll[attr.id] ? 'Show Less' : 'Show All'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ flexShrink: 0, padding: '12px 16px', borderTop: '1px solid #EFEFEF', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {settingsView ? (
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => exitSettings(false)} style={footerBtn('outline')}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
              Reset changes
            </button>
            <button onClick={() => exitSettings(true)} style={footerBtn('primary')}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              Save changes
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleReset} style={footerBtn('danger')}>
                <span style={{ display: 'inline-block', width: 16, height: 16, flexShrink: 0, backgroundColor: 'currentColor', WebkitMaskImage: 'url(assets/icons/reset.svg)', WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat', WebkitMaskPosition: 'center', maskImage: 'url(assets/icons/reset.svg)', maskSize: 'contain', maskRepeat: 'no-repeat', maskPosition: 'center' }} />
                Reset
              </button>
              <button onClick={handleApply} style={footerBtn('primary')}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                Apply
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

window.FilterPanel = FilterPanel;
window.GraphFilterDrawer = GraphFilterDrawer;
