import { useCallback, useEffect, useState } from 'react';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import ReportTable from '../components/ReportTable';
import { STATUSES } from '../lib';
import { downloadCsv } from '../csv';

export default function History() {
  const { isStaff } = useAuth();
  const [rows, setRows] = useState([]), [status, setStatus] = useState('all'), [type, setType] = useState('all'), [q, setQ] = useState('');
  const load = useCallback(() => api.get('/api/reports', { params: { status, type, q } }).then(r => setRows(r.data)), [status, type, q]);
  useEffect(() => { const t = setTimeout(load, 200); return () => clearTimeout(t); }, [load]);
  return (
    <section className="card pad">
      <div className="rowbar">
        <div><h3>Report history</h3><p className="muted sub">{isStaff ? 'All stored reports and their status workflow' : 'Your submitted reports and their progress'}</p></div>
        <button className="linkbtn" onClick={() => downloadCsv({ status, type, q })}>Export CSV ↓</button>
      </div>
      <div className="filters">
        <input placeholder="Search ID or address…" value={q} onChange={e => setQ(e.target.value)} />
        <select value={status} onChange={e => setStatus(e.target.value)}><option value="all">All</option>{STATUSES.map(s => <option key={s}>{s}</option>)}</select>
        <select value={type} onChange={e => setType(e.target.value)}><option value="all">All categories</option><option value="waterlogging">Waterlogging</option><option value="garbage">Land garbage</option></select>
      </div>
      <ReportTable rows={rows} staff={isStaff} onChange={load} />
    </section>
  );
}
