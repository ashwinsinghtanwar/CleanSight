import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { to: '/', label: 'Overview', icon: '⌂', end: true, title: 'Overview' },
  { to: '/report', label: 'Report an Issue', icon: '+', title: 'Report an Issue' },
  { to: '/results', label: 'Detection Results', icon: '▣', title: 'Detection Results' },
  { to: '/map', label: 'Live Map', icon: '✦', title: 'Live Map' },
  { to: '/municipal', label: 'Municipal Dashboard', icon: '▦', title: 'Municipal Dashboard', staff: true },
  { to: '/analytics', label: 'Analytics', icon: '▤', title: 'Analytics', staff: true },
  { to: '/history', label: 'Report History', icon: '◷', title: 'Report History' },
  { to: '/settings', label: 'Settings', icon: '⚙', title: 'Settings' },
];

export default function Layout() {
  const { user, isStaff, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const loc = useLocation(), nav = useNavigate();
  const cur = NAV.find(n => (n.end ? loc.pathname === n.to : loc.pathname.startsWith(n.to))) || NAV[0];

  return (
    <div className="shell">
      <aside className={'side' + (open ? ' open' : '')}>
        <div className="brand">
          <div className="logo">C</div>
          <div><b>CleanSight</b><small>Civic intelligence</small></div>
        </div>
        <div className="eyebrow nav-label">Workspace</div>
        <nav onClick={() => setOpen(false)}>
          {NAV.map(n => (
            <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => 'navitem' + (isActive ? ' active' : '')}>
              <span className="ico">{n.icon}</span>{n.label}
              {n.staff && !isStaff && <span className="lock" title="Municipal staff only">🔒</span>}
            </NavLink>
          ))}
        </nav>
        <div className="side-foot">
          <div className="usercard">
            <div className="avatar">{(user?.full_name || '?')[0].toUpperCase()}</div>
            <div className="uinfo"><b>{user?.full_name}</b><small>{isStaff ? 'Municipal staff' : 'Citizen'}</small></div>
            <button className="linkbtn" onClick={logout} title="Sign out">Sign out</button>
          </div>
          <div className="instance"><i className="dot" /> Local project instance</div>
        </div>
      </aside>
      {open && <div className="scrim" onClick={() => setOpen(false)} />}
      <div className="main">
        <header className="top">
          <button className="burger" onClick={() => setOpen(true)} aria-label="Menu">☰</button>
          <div className="titles">
            <div className="eyebrow">Municipal monitoring platform</div>
            <h1>{cur.title}</h1>
          </div>
          <button className="btn primary" onClick={() => nav('/report')}>+ New report</button>
        </header>
        <div className="content"><Outlet /></div>
        <footer className="foot"><span>CleanSight · Civic reporting and monitoring</span><span>Blue &amp; white light theme</span></footer>
      </div>
    </div>
  );
}
