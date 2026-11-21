import { useEffect, useState } from 'react';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { user, isStaff, logout } = useAuth();
  const [h, setH] = useState(null);
  useEffect(() => { api.get('/api/health').then(r => setH(r.data.models)).catch(() => setH(false)); }, []);
  const row = (k, m) => !m ? null : (
    <div className="kvrow" key={k}><b>{m.label}</b>
      <span className={'chip ' + (m.status === 'ready' ? 'ok' : m.status === 'loading' ? 'warn' : 'bad')}>{m.status === 'ready' ? 'Ready' : m.status === 'loading' ? 'Loading…' : 'Unavailable'}</span>
      <small className="muted">{m.classes ? m.classes.join(', ') : m.error || ''}</small></div>);
  return <section className="grid2e">
    <div className="card pad"><h3>Account</h3>
      <dl className="kv"><dt>Name</dt><dd>{user.full_name}</dd><dt>Email</dt><dd>{user.email}</dd><dt>Role</dt><dd>{isStaff ? 'Municipal staff' : 'Citizen'}</dd></dl>
      {isStaff && <p className="muted">Staff access code for new staff accounts is set in <code>backend\.env</code> (<code>MUNICIPAL_ACCESS_CODE</code>).</p>}
      <button className="btn" onClick={logout}>Sign out</button></div>
    <div className="card pad"><h3>AI models</h3>
      {h === false ? <p className="error">Cannot reach the API.</p> : !h ? <p className="muted">Checking…</p> : <>{row('g', h.garbage)}{row('w', h.waterlogging)}</>}
      <p className="muted">Garbage: YOLO11m (<code>ai_models/garbage.pt</code>, 640 px). Waterlogging: <code>ai_models/waterlogging.pt</code> (512 px + test-time augmentation). Both models only report detections with at least <b>40% confidence</b> (raise it in <code>backend\.env</code>, it cannot go lower).</p></div>
  </section>;
}
