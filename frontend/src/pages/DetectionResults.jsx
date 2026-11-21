import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import api, { asset } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { typeOf, fmtDateTime, STATUSES, errMsg } from '../lib';
import { pinIcon } from '../mapIcons';
import { TypeBadge, SevPill, StatusPill, Steps, Empty, Modal } from '../components/Ui';

export default function DetectionResults() {
  const { id: param } = useParams();
  const id = param || sessionStorage.getItem('lastReport');
  const { isStaff } = useAuth(); const nav = useNavigate();
  const [r, setR] = useState(null), [err, setErr] = useState(''), [modal, setModal] = useState(null), [text, setText] = useState(''), [busy, setBusy] = useState(false);
  const load = () => api.get('/api/reports/' + id).then(x => setR(x.data)).catch(() => setErr('Report not found.'));
  useEffect(() => { setR(null); setErr(''); if (id) { load(); if (param) sessionStorage.setItem('lastReport', param); } }, [id]);

  if (!id) return <div className="card"><Empty>Submit a report or select one from history.</Empty></div>;
  if (err) return <div className="card"><Empty>{err}</Empty></div>;
  if (!r) return <div className="card"><Empty>Loading…</Empty></div>;
  const t = typeOf(r.report_type);

  const act = async (fn) => { setBusy(true); try { await fn(); setModal(null); await load(); } catch (e) { setErr(errMsg(e)); } setBusy(false); };
  const status = v => v === 'Resolved' ? (setText(r.resolution_note || ''), setModal('resolve')) : v && act(() => api.patch(`/api/reports/${r.id}/status`, { status: v }));

  return <>
    <section className="card pad">
      <div className="rowbar">
        <div><b className="code xl">{r.report_code}</b><small className="muted block">Submitted {fmtDateTime(r.created_at)} by {r.reporter_name || 'a citizen'}</small></div>
        <div className="pills"><TypeBadge type={r.report_type} /><SevPill s={r.severity} /><StatusPill s={r.status} /></div>
      </div>
      <Steps status={r.status} />
    </section>

    <section className="grid2e">
      <div className="card pad">
        <h3>AI detection</h3>
        <div className="imgs">
          <figure><img src={asset(r.original_image)} alt="original" /><figcaption>Original photo</figcaption></figure>
          <figure><img src={asset(r.processed_image)} alt="detected" /><figcaption>{t.label} detection</figcaption></figure>
        </div>
        <div className="grid4 tight">
          <div className="mini-stat"><small>{t.unit}</small><b>{r.detection_count}</b></div>
          <div className="mini-stat"><small>Image coverage</small><b>{r.coverage_percentage}%</b></div>
          <div className="mini-stat"><small>Severity</small><b>{r.severity === 'None' ? '—' : r.severity}</b></div>
          <div className="mini-stat"><small>Status</small><b>{r.status}</b></div>
        </div>
        {r.detection_count === 0
          ? <p className="notice">{t.none} The report is still saved so municipal staff can verify it manually. Check that you chose the right complaint type.</p>
          : <div className="chips">{Object.entries(r.detected_classes).map(([k, v]) => <span key={k} className="chip">{k} × {v}</span>)}</div>}
        <small className="muted">Coverage is the share of the photo covered by detection boxes — an estimate, not a measured area.</small>
      </div>

      <div className="card pad">
        <h3>Location &amp; details</h3>
        {r.latitude != null && <MapContainer center={[r.latitude, r.longitude]} zoom={15} className="map small" scrollWheelZoom={false}>
          <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={[r.latitude, r.longitude]} icon={pinIcon(r.report_type, r.severity, r.status === 'Resolved')} />
        </MapContainer>}
        <dl className="kv">
          <dt>Address</dt><dd>{r.address || '—'}</dd>
          <dt>Coordinates</dt><dd>{r.latitude?.toFixed(5)}, {r.longitude?.toFixed(5)} · {r.location_source === 'gps' ? `GPS${r.accuracy ? ` (±${Math.round(r.accuracy)} m)` : ''}` : 'Manual'}</dd>
          <dt>Description</dt><dd>{r.description || '—'}</dd>
          <dt>Assigned to</dt><dd>{r.assigned_to || 'Not assigned yet'}</dd>
          {r.resolved_at && <><dt>Resolved</dt><dd>{fmtDateTime(r.resolved_at)}{r.resolution_note ? ` — ${r.resolution_note}` : ''}</dd></>}
        </dl>
        {isStaff && <div className="staffbox">
          <b>Municipal actions</b>
          <div className="acts">
            <select className="mini" value="" onChange={e => status(e.target.value)}><option value="">Change status…</option>{STATUSES.filter(s => s !== r.status).map(s => <option key={s}>{s}</option>)}</select>
            <button className="btn" onClick={() => { setText(r.assigned_to || ''); setModal('assign'); }}>Assign</button>
            <button className="btn danger" onClick={() => setModal('delete')}>Delete</button>
          </div>
        </div>}
      </div>
    </section>
    <div className="actions-row"><Link className="btn" to="/map">View on live map</Link><Link className="btn" to="/history">Report history</Link></div>

    {modal === 'assign' && <Modal title="Assign report" onClose={() => setModal(null)}>
      <input autoFocus value={text} onChange={e => setText(e.target.value)} placeholder="Officer / team name" />
      <div className="modal-actions"><button className="btn" onClick={() => setModal(null)}>Cancel</button><button className="btn primary" disabled={busy} onClick={() => act(() => api.patch(`/api/reports/${r.id}/assign`, { assigned_to: text }))}>Save</button></div></Modal>}
    {modal === 'resolve' && <Modal title="Mark as resolved" onClose={() => setModal(null)}>
      <p className="muted">This removes the pin from the live map.</p>
      <textarea autoFocus value={text} onChange={e => setText(e.target.value)} placeholder="What was done on the ground? (optional)" />
      <div className="modal-actions"><button className="btn" onClick={() => setModal(null)}>Cancel</button><button className="btn primary" disabled={busy} onClick={() => act(() => api.patch(`/api/reports/${r.id}/status`, { status: 'Resolved', note: text }))}>Mark resolved</button></div></Modal>}
    {modal === 'delete' && <Modal title="Delete this report?" onClose={() => setModal(null)}>
      <p className="muted">This permanently removes the report from the database and the map.</p>
      <div className="modal-actions"><button className="btn" onClick={() => setModal(null)}>Cancel</button><button className="btn danger solid" disabled={busy} onClick={async () => { setBusy(true); try { await api.delete('/api/reports/' + r.id); sessionStorage.removeItem('lastReport'); nav('/municipal'); } catch (e) { setErr(errMsg(e)); } setBusy(false); }}>Delete</button></div></Modal>}
  </>;
}
