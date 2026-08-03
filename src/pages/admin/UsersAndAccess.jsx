import React, { useState } from 'react'
import TablePagination from '../../components/TablePagination.jsx'
import DSDropdown from '../../components/DSDropdown.jsx'
import { DSPillSearch } from '../../context/WorkspaceCtx.jsx'
import { IcUsers, IcUserGroup, IcShield, IcDownload, ROLE_BADGE, STATUS_BADGE, initials, SectionHead, RowMenu, FormModal } from './shared.jsx'

/* ── Mock data ───────────────────────────────────────────────────── */
export const INITIAL_USERS = [
  { id: 1,  name: 'MP (You)',        email: 'mp@prevalent.ai',            role: 'Owner',   status: 'Active',  lastActive: 'Today',       joined: 'Sep 25, 2020', group: 'IT Administrators',    removable: false },
  { id: 2,  name: 'Alex Rivera',     email: 'alex.rivera@prevalent.ai',   role: 'Admin',   status: 'Active',  lastActive: 'Today',       joined: 'Jul 16, 2021', group: 'IT Administrators',    removable: true },
  { id: 3,  name: 'Jordan Lee',      email: 'jordan.lee@prevalent.ai',    role: 'Analyst', status: 'Active',  lastActive: 'Today',       joined: 'Jan 10, 2022', group: 'Security Operations',  removable: true },
  { id: 4,  name: 'Sam Okafor',      email: 'sam.okafor@prevalent.ai',    role: 'Viewer',  status: 'Invited', lastActive: '—',           joined: 'May 1, 2024',  group: 'Executive Viewers',    removable: true },
  { id: 5,  name: 'Priya Nair',      email: 'priya.nair@prevalent.ai',    role: 'Analyst', status: 'Active',  lastActive: 'Yesterday',   joined: 'Jul 30, 2022', group: 'Security Operations',  removable: true },
  { id: 6,  name: 'Marcus Chen',     email: 'marcus.chen@prevalent.ai',   role: 'Admin',   status: 'Active',  lastActive: 'Yesterday',   joined: 'Jun 20, 2021', group: 'IT Administrators',    removable: true },
  { id: 7,  name: 'Elena Volkov',    email: 'elena.volkov@prevalent.ai',  role: 'Viewer',  status: 'Active',  lastActive: '2 days ago',  joined: 'Mar 10, 2023', group: 'Executive Viewers',    removable: true },
  { id: 8,  name: 'David Osei',      email: 'david.osei@prevalent.ai',    role: 'Analyst', status: 'Active',  lastActive: '2 days ago',  joined: 'Jun 3, 2023',  group: 'Security Operations',  removable: true },
  { id: 9,  name: 'Grace Kim',       email: 'grace.kim@prevalent.ai',     role: 'Viewer',  status: 'Invited', lastActive: '—',           joined: 'Feb 14, 2025', group: 'Compliance Team',      removable: true },
  { id: 10, name: 'Tom Bracewell',   email: 'tom.bracewell@prevalent.ai', role: 'Analyst', status: 'Active',  lastActive: '4 days ago',  joined: 'Oct 8, 2022',  group: 'Compliance Team',      removable: true },
  { id: 11, name: 'Nadia Farouk',    email: 'nadia.farouk@prevalent.ai',  role: 'Admin',   status: 'Suspended', lastActive: '5 days ago', joined: 'Apr 2, 2021',  group: 'IT Administrators',    removable: true },
  { id: 12, name: 'Ravi Deshmukh',   email: 'ravi.deshmukh@prevalent.ai', role: 'Viewer',  status: 'Active',  lastActive: '1 week ago',  joined: 'Nov 19, 2023', group: 'Executive Viewers',    removable: true },
];

export const INITIAL_GROUPS = [
  { id: 1, name: 'Security Operations', role: 'Analyst', created: 'Jan 10, 2022' },
  { id: 2, name: 'IT Administrators',   role: 'Admin',   created: 'Sep 25, 2020' },
  { id: 3, name: 'Executive Viewers',   role: 'Viewer',  created: 'Mar 2, 2023'  },
  { id: 4, name: 'Compliance Team',     role: 'Analyst', created: 'Jun 14, 2023' },
];

export const INITIAL_ROLES = [
  { id: 'owner',   name: 'Owner',                desc: 'Full access, including billing and workspace deletion.',     perms: ['Read', 'Write', 'Manage Users', 'Billing'], custom: false },
  { id: 'admin',   name: 'Admin',                desc: 'Manage users, roles, and data source integrations.',         perms: ['Read', 'Write', 'Manage Users'],            custom: false },
  { id: 'analyst', name: 'Analyst',               desc: 'Read/write access to findings, reports, and remediation.',   perms: ['Read', 'Write'],                            custom: false },
  { id: 'viewer',  name: 'Viewer',                desc: 'Read-only access to dashboards and reports.',                perms: ['Read'],                                     custom: false },
  { id: 'soc',     name: 'SOC Analyst (Custom)',  desc: 'Read access to findings plus remediation queue only.',       perms: ['Read', 'Remediate'],                        custom: true },
];

const RESOURCES = ['Findings & Assets', 'Reports', 'Remediation', 'Data Sources', 'User Management', 'Billing'];

const DEFAULT_MATRIX = {
  owner:   { 'Findings & Assets': true,  'Reports': true,  'Remediation': true,  'Data Sources': true,  'User Management': true,  'Billing': true  },
  admin:   { 'Findings & Assets': true,  'Reports': true,  'Remediation': true,  'Data Sources': true,  'User Management': true,  'Billing': false },
  analyst: { 'Findings & Assets': true,  'Reports': true,  'Remediation': true,  'Data Sources': false, 'User Management': false, 'Billing': false },
  viewer:  { 'Findings & Assets': false, 'Reports': true,  'Remediation': false, 'Data Sources': false, 'User Management': false, 'Billing': false },
  soc:     { 'Findings & Assets': true,  'Reports': false, 'Remediation': true,  'Data Sources': false, 'User Management': false, 'Billing': false },
};

/* ── Users ───────────────────────────────────────────────────────── */
export function UsersSection({ users, setUsers, groups, onConfirm }) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All Roles');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [selected, setSelected] = useState(new Set());
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Viewer');

  const filtered = users.filter(u => {
    if (search && !`${u.name} ${u.email}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (roleFilter !== 'All Roles' && u.role !== roleFilter) return false;
    if (statusFilter !== 'All Statuses' && u.status !== statusFilter) return false;
    return true;
  });
  const pageStart = (page - 1) * rowsPerPage;
  const pageRows = filtered.slice(pageStart, pageStart + rowsPerPage);
  const allVisibleSelected = pageRows.length > 0 && pageRows.every(u => selected.has(u.id));

  const toggleOne = (id) => setSelected(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  const toggleAllVisible = () => setSelected(prev => {
    const next = new Set(prev);
    if (allVisibleSelected) pageRows.forEach(u => next.delete(u.id));
    else pageRows.forEach(u => u.removable && next.add(u.id));
    return next;
  });

  const removeUsers = (ids) => {
    setUsers(prev => prev.filter(u => !ids.includes(u.id)));
    setSelected(prev => { const next = new Set(prev); ids.forEach(id => next.delete(id)); return next; });
  };
  const setUserStatus = (id, status) => setUsers(prev => prev.map(u => u.id === id ? { ...u, status } : u));

  const requestRemoveOne = (user) => onConfirm({
    title: `Remove "${user.name}"?`,
    body: `Immediately revokes ${user.name}'s access to this workspace. Can't be undone.`,
    confirmLabel: 'Remove',
    onConfirm: () => removeUsers([user.id]),
  });
  const requestSuspend = (user) => onConfirm({
    title: `Suspend "${user.name}"?`,
    body: `${user.name} will be signed out until reinstated.`,
    confirmLabel: 'Suspend',
    tier: 'warning',
    onConfirm: () => setUserStatus(user.id, 'Suspended'),
  });
  const requestRemoveBulk = () => {
    const ids = [...selected];
    onConfirm({
      title: `Remove ${ids.length} user${ids.length === 1 ? '' : 's'}?`,
      body: `Immediately revokes workspace access for the selected user${ids.length === 1 ? '' : 's'}. Can't be undone.`,
      confirmLabel: 'Remove',
      onConfirm: () => removeUsers(ids),
    });
  };

  const sendInvite = () => {
    if (!inviteEmail.trim()) return;
    setUsers(prev => [...prev, {
      id: Date.now(), name: inviteEmail.split('@')[0], email: inviteEmail.trim(), role: inviteRole,
      status: 'Invited', lastActive: '—', joined: 'Just now', group: groups[0]?.name || '—', removable: true,
    }]);
    setInviteEmail(''); setInviteRole('Viewer'); setShowInvite(false);
  };

  return (
    <>
      <SectionHead icon={<IcUsers/>} title="Users" count={users.length} />

      <div className="admin-toolbar">
        <DSPillSearch value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Find a user by name or email" width={260} />
        <DSDropdown value={roleFilter} onChange={(v) => { setRoleFilter(v); setPage(1); }} options={['All Roles', 'Owner', 'Admin', 'Analyst', 'Viewer']} />
        <DSDropdown value={statusFilter} onChange={(v) => { setStatusFilter(v); setPage(1); }} options={['All Statuses', 'Active', 'Invited', 'Suspended']} />
        <div className="admin-toolbar__spacer" />
        <button className="ds-btn sz-md t-primary" onClick={() => setShowInvite(true)}>Invite User</button>
        <button className="ds-btn sz-md t-outline" title="Export CSV"><IcDownload /> CSV</button>
      </div>

      {selected.size > 0 && (
        <div className="admin-bulkbar">
          <span>{selected.size} selected</span>
          <div className="admin-bulkbar__spacer" />
          <button className="ds-btn sz-sm t-outline" onClick={() => setSelected(new Set())}>Clear</button>
          <button className="ds-btn sz-sm t-danger" onClick={requestRemoveBulk}>Remove</button>
        </div>
      )}

      <div className="ds-table-wrap">
        <table className="ds-table admin-users-table">
          <thead>
            <tr>
              <th className="admin-th-checkbox"><input type="checkbox" className="admin-checkbox" checked={allVisibleSelected} onChange={toggleAllVisible} /></th>
              <th>Name</th>
              <th>Role</th>
              <th>Group</th>
              <th>Last Active</th>
              <th>Joined</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map(u => (
              <tr key={u.id}>
                <td>
                  <input type="checkbox" className="admin-checkbox" checked={selected.has(u.id)} disabled={!u.removable}
                         onChange={() => toggleOne(u.id)} />
                </td>
                <td>
                  <div className="admin-user-cell">
                    <div className="admin-user-avatar">{initials(u.name)}</div>
                    <div className="admin-user-cell__text">
                      <div className="admin-user-cell__name">{u.name}</div>
                      <div className="admin-user-cell__email">{u.email}</div>
                    </div>
                  </div>
                </td>
                <td><span className={`ds-badge ${ROLE_BADGE[u.role] || 'neutral'}`}>{u.role}</span></td>
                <td>{u.group}</td>
                <td>{u.lastActive}</td>
                <td>{u.joined}</td>
                <td><span className={`ds-badge ${STATUS_BADGE[u.status] || 'neutral'}`}>{u.status}</span></td>
                <td>
                  <RowMenu items={u.removable ? [
                    ...(u.status !== 'Suspended' ? [{ label: 'Suspend access', onClick: () => requestSuspend(u) }] : [{ label: 'Reinstate access', onClick: () => setUserStatus(u.id, 'Active') }]),
                    { label: 'Remove from workspace', danger: true, onClick: () => requestRemoveOne(u) },
                  ] : []} />
                </td>
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr><td colSpan={8} className="admin-empty-row">No users match this filter.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <TablePagination
        total={filtered.length}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={setPage}
        onRowsPerPageChange={(n) => { setRowsPerPage(n); setPage(1); }}
      />

      {showInvite && (
        <FormModal title="Invite User" onClose={() => setShowInvite(false)} onSubmit={sendInvite} submitLabel="Send Invite" submitDisabled={!inviteEmail.trim()}>
          <label className="admin-field-label">Email address</label>
          <input className="admin-input" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="name@company.com" />
          <label className="admin-field-label">Role</label>
          <DSDropdown value={inviteRole} onChange={setInviteRole} options={['Owner', 'Admin', 'Analyst', 'Viewer']} />
        </FormModal>
      )}
    </>
  );
}

/* ── Groups ──────────────────────────────────────────────────────── */
export function GroupsSection({ groups, setGroups, users, onConfirm }) {
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState('Analyst');

  const memberCount = (groupName) => users.filter(u => u.group === groupName).length;
  const rows = groups.filter(g => !search || g.name.toLowerCase().includes(search.toLowerCase()));

  const createGroup = () => {
    if (!name.trim()) return;
    setGroups(prev => [...prev, { id: Date.now(), name: name.trim(), role, created: 'Just now' }]);
    setName(''); setRole('Analyst'); setShowCreate(false);
  };

  const requestDelete = (g) => onConfirm({
    title: `Delete "${g.name}"?`,
    body: `Members lose the ${g.role} permissions granted through it. Can't be undone.`,
    confirmLabel: 'Delete',
    onConfirm: () => setGroups(prev => prev.filter(x => x.id !== g.id)),
  });

  return (
    <>
      <SectionHead icon={<IcUserGroup/>} title="Groups" count={groups.length} desc="Organize users and grant roles in bulk through group membership." />

      <div className="admin-toolbar">
        <DSPillSearch value={search} onChange={setSearch} placeholder="Find a group" width={240} />
        <div className="admin-toolbar__spacer" />
        <button className="ds-btn sz-md t-primary" onClick={() => setShowCreate(true)}>Create Group</button>
      </div>

      <div className="ds-table-wrap">
        <table className="ds-table">
          <thead>
            <tr><th>Group</th><th>Role granted</th><th>Members</th><th>Created</th><th></th></tr>
          </thead>
          <tbody>
            {rows.map(g => (
              <tr key={g.id}>
                <td>{g.name}</td>
                <td><span className={`ds-badge ${ROLE_BADGE[g.role] || 'neutral'}`}>{g.role}</span></td>
                <td>{memberCount(g.name)}</td>
                <td>{g.created}</td>
                <td><RowMenu items={[{ label: 'Delete group', danger: true, onClick: () => requestDelete(g) }]} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <FormModal title="Create Group" onClose={() => setShowCreate(false)} onSubmit={createGroup} submitLabel="Create" submitDisabled={!name.trim()}>
          <label className="admin-field-label">Group name</label>
          <input className="admin-input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Threat Response Team" />
          <label className="admin-field-label">Role granted to members</label>
          <DSDropdown value={role} onChange={setRole} options={['Owner', 'Admin', 'Analyst', 'Viewer']} />
        </FormModal>
      )}
    </>
  );
}

/* ── Roles & Permissions ─────────────────────────────────────────── */
export function RolesSection({ roles, setRoles, onConfirm }) {
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [matrix, setMatrix] = useState(DEFAULT_MATRIX);

  const createRole = () => {
    if (!name.trim()) return;
    const id = `custom-${Date.now()}`;
    setRoles(prev => [...prev, { id, name: `${name} (Custom)`, desc: desc || 'Custom role.', perms: ['Read'], custom: true }]);
    setMatrix(prev => ({ ...prev, [id]: Object.fromEntries(RESOURCES.map(r => [r, false])) }));
    setName(''); setDesc(''); setShowCreate(false);
  };

  const requestDelete = (role) => onConfirm({
    title: `Delete "${role.name}"?`,
    body: `Users assigned to this role will need reassigning. Can't be undone.`,
    confirmLabel: 'Delete',
    onConfirm: () => setRoles(prev => prev.filter(r => r.id !== role.id)),
  });

  const toggleCell = (roleId, resource) => {
    if (roleId === 'owner') return;
    setMatrix(prev => ({ ...prev, [roleId]: { ...prev[roleId], [resource]: !prev[roleId]?.[resource] } }));
  };

  return (
    <>
      <SectionHead icon={<IcShield/>} title="Roles & Permissions" count={roles.length} desc="Predefined and custom roles that can be assigned to users or groups." />

      <div className="admin-toolbar">
        <div className="admin-toolbar__spacer" />
        <button className="ds-btn sz-md t-primary" onClick={() => setShowCreate(true)}>Create Custom Role</button>
      </div>

      <div className="ds-table-wrap">
        <table className="ds-table">
          <thead>
            <tr><th>Role</th><th>Description</th><th>Permissions</th><th></th></tr>
          </thead>
          <tbody>
            {roles.map(r => (
              <tr key={r.id}>
                <td>{r.name}</td>
                <td>{r.desc}</td>
                <td>
                  <div className="admin-perm-badges">
                    {r.perms.map(p => <span key={p} className="ds-badge neutral">{p}</span>)}
                  </div>
                </td>
                <td>
                  <RowMenu items={r.custom ? [{ label: 'Delete role', danger: true, onClick: () => requestDelete(r) }] : []} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="admin-card">
        <div className="admin-card__header">
          <div className="admin-card__title">Permission matrix</div>
          <div className="admin-card__subtitle">Fine-grained access per role. Owner always has full access.</div>
        </div>
        <div className="ds-table-wrap">
          <table className="ds-table admin-matrix-table">
            <thead>
              <tr>
                <th>Resource</th>
                {roles.map(r => <th key={r.id}>{r.name.replace(' (Custom)', '')}</th>)}
              </tr>
            </thead>
            <tbody>
              {RESOURCES.map(res => (
                <tr key={res}>
                  <td>{res}</td>
                  {roles.map(r => (
                    <td key={r.id} className="admin-matrix-cell">
                      <input
                        type="checkbox"
                        className="admin-checkbox"
                        checked={!!matrix[r.id]?.[res]}
                        disabled={r.id === 'owner'}
                        onChange={() => toggleCell(r.id, res)}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showCreate && (
        <FormModal title="Create Custom Role" onClose={() => setShowCreate(false)} onSubmit={createRole} submitLabel="Create" submitDisabled={!name.trim()}>
          <label className="admin-field-label">Role name</label>
          <input className="admin-input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. SOC Analyst" />
          <label className="admin-field-label">Description</label>
          <input className="admin-input" value={desc} onChange={e => setDesc(e.target.value)} placeholder="What can this role do?" />
        </FormModal>
      )}
    </>
  );
}
