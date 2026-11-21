import { useCallback, useEffect, useState } from 'react';
import api from '../api/api';
import ReportTable from '../components/ReportTable';
import { STATUSES } from '../lib';
import { downloadCsv } from '../csv';

export default function Municipal() {
  const [rows, setRows] = useState([]), [a, setA] = useState(null);
  const [q, setQ] = useState(''), [status, setStatus] = useState('all'), [type, setType] = useState('all'), [sev, setSev] = useState('all');
  const load = useCallback(() => {
    api.get('/api/reports', { params: { q, status, type, severity: sev } }).then(r => setRows(r.data));
    api.get('/api/analytics').then(r => setA(r.data));
  }, [q, status, type, sev]);
  useEffect(() => { const t = setTimeout(load, 200); return () => clearTimeout(t); }, [load]);

  const card = (l, v, c) => <div className="card stat"><small>{l}</small><h2 style={c ? { color: c } : null}>{a ? v : '—'}</h2></div>;
  return <>
    <section className="grid4 five">
      {card('Open issues', a?.open_reports)}{card('New (Reported)', a?.status_counts?.Reported)}{card('In progress', a?.in_progress_reports)}
      {card('Resolved', a?.resolved_reports, '#16a34a')}{card('High severity open', a?.high_open, '#dc2626')}
    </section>
    <section className="card pad">
      <div className="rowbar">
        <div><h3>Municipal report management</h3><p className="muted sub">Verify, assign and resolve reports. Resolved issues leave the live map.</p></div>
        <button className="linkbtn" onClick={() => downloadCsv({ q, status, type, severity: sev })}>Export CSV ↓</button>
      </div>
      <div className="filters">
        <input placeholder="Search ID, address, team…" value={q} onChange={e => setQ(e.target.value)} />
        <select value={status} onChange={e => setStatus(e.target.value)}><option value="all">All statuses</option>{STATUSES.map(s => <option key={s}>{s}</option>)}</select>
        <select value={type} onChange={e => setType(e.target.value)}><option value="all">All categories</option><option value="waterlogging">Waterlogging</option><option value="garbage">Land garbage</option></select>
        <select value={sev} onChange={e => setSev(e.target.value)}><option value="all">All severities</option><option>High</option><option>Medium</option><option>Low</option><option>None</option></select>
      </div>
      <ReportTable rows={rows} staff onChange={load} />
    </section>
  </>;
}
