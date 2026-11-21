import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/api';
import { STATUSES, fmtDate, errMsg } from '../lib';
import { Modal, SevPill, StatusPill, TypeBadge, Empty } from './Ui';

// Shared by Municipal Dashboard and Report History.
export default function ReportTable({ rows, staff, onChange }) {
  const [assign, setAssign] = useState(null);     // report being assigned
  const [resolve, setResolve] = useState(null);   // report being resolved
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const setStatus = async (r, status, note) => {
    setBusy(true); setErr('');
    try { await api.patch(`/api/reports/${r.id}/status`, { status, note }); setResolve(null); onChange?.(); }
    catch (e) { setErr(errMsg(e)); }
    setBusy(false);
  };
  const doAssign = async () => {
    setBusy(true); setErr('');
    try { await api.patch(`/api/reports/${assign.id}/assign`, { assigned_to: text }); setAssign(null); onChange?.(); }
    catch (e) { setErr(errMsg(e)); }
    setBusy(false);
  };
  const pick = (r, v) => { if (!v) return; if (v === 'Resolved') { setText(r.resolution_note || ''); setResolve(r); } else setStatus(r, v); };

  if (!rows.length) return <Empty>No reports found.</Empty>;
  return (
    <>
      {err && !assign && !resolve && <p className="error">{err}</p>}
      <div className="tablewrap">
        <table className="tbl">
          <thead><tr><th>Report ID</th><th>Category</th><th>Garbage / Water</th><th>Severity</th><th>Location</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id}>
                <td><b className="code">{r.report_code}</b><small className="muted block">{fmtDate(r.created_at)}</small></td>
                <td><TypeBadge type={r.report_type} /></td>
                <td>{r.report_type === 'garbage' ? `${r.coverage_percentage}% / —%` : `—% / ${r.coverage_percentage}%`}</td>
                <td><SevPill s={r.severity} /></td>
                <td className="loc">{r.address || (r.latitude != null ? `${r.latitude.toFixed(4)}, ${r.longitude.toFixed(4)}` : '—')}
                  {r.assigned_to && <small className="muted block">→ {r.assigned_to}</small>}</td>
                <td><StatusPill s={r.status} /></td>
                <td>
                  <div className="acts">
                    <Link to={`/results/${r.id}`} className="act">View</Link>
                    {staff && <button className="act" onClick={() => { setText(r.assigned_to || ''); setErr(''); setAssign(r); }}>Assign</button>}
                  </div>
                  {staff && (
                    <select className="mini" value="" onChange={e => pick(r, e.target.value)}>
                      <option value="">Status</option>
                      {STATUSES.filter(s => s !== r.status).map(s => <option key={s}>{s}</option>)}
                    </select>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {assign && (
        <Modal title={`Assign ${assign.report_code}`} onClose={() => setAssign(null)}>
          <p className="muted">Enter the officer, ward team or contractor responsible. Leave empty to un-assign.</p>
          <input autoFocus value={text} onChange={e => setText(e.target.value)} placeholder="e.g. Ward 12 Sanitation Team" onKeyDown={e => e.key === 'Enter' && doAssign()} />
          {err && <p className="error">{err}</p>}
          <div className="modal-actions"><button className="btn" onClick={() => setAssign(null)}>Cancel</button><button className="btn primary" disabled={busy} onClick={doAssign}>Save assignment</button></div>
        </Modal>
      )}
      {resolve && (
        <Modal title={`Mark ${resolve.report_code} as resolved`} onClose={() => setResolve(null)}>
          <p className="muted">Resolved issues are removed from the live map. Add a short note about what was done on the ground (optional).</p>
          <textarea autoFocus value={text} onChange={e => setText(e.target.value)} placeholder="e.g. Water pumped out, drain cleaned on 17 Nov" />
          {err && <p className="error">{err}</p>}
          <div className="modal-actions"><button className="btn" onClick={() => setResolve(null)}>Cancel</button><button className="btn primary" disabled={busy} onClick={() => setStatus(resolve, 'Resolved', text)}>Mark resolved</button></div>
        </Modal>
      )}
    </>
  );
}
