import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { asset } from '../api/api';
import { TypeBadge, StatusPill } from '../components/Ui';
import { fmtDate } from '../lib';

const badge = h => !h ? ['Checking…', 'warn'] : h.status === 'ready' ? ['Model ready', 'ok'] : h.status === 'loading' ? ['Loading model…', 'warn'] : ['Model unavailable', 'bad'];

export default function Overview() {
  const nav = useNavigate();
  const [a, setA] = useState(null), [h, setH] = useState(null), [recent, setRecent] = useState([]);
  useEffect(() => {
    api.get('/api/analytics').then(r => setA(r.data)).catch(() => {});
    api.get('/api/reports').then(r => setRecent(r.data.slice(0, 5))).catch(() => {});
    const load = () => api.get('/api/health').then(r => setH(r.data.models)).catch(() => {});
    load(); const t = setInterval(load, 4000); return () => clearInterval(t);
  }, []);
  const stat = (label, v) => <div className="card stat"><small>{label}</small><h2>{a ? v : '—'}</h2><span className="muted">Live from the database</span></div>;
  const svc = (title, sub, h2) => { const [txt, cls] = badge(h2); return <div className="card svc"><b>{title}</b><p className="muted">{sub}</p>{h2 !== undefined && <span className={'chip ' + cls}>{txt}</span>}</div>; };

  return <>
    <section className="card hero">
      <div className="hero-text">
        <div className="eyebrow">AI-assisted civic reporting</div>
        <h2>Spot it. Report it.<br /><span>Make it visible.</span></h2>
        <p className="muted">AI-assisted garbage and waterlogging reports connected to a central municipal view.</p>
        <div className="hero-btns"><button className="btn primary" onClick={() => nav('/report')}>Upload a report →</button><button className="btn" onClick={() => nav('/map')}>Explore live map</button></div>
      </div>
      <div className="target"><div className="r1"><div className="r2"><svg width="86" height="86" viewBox="0 0 86 86" fill="none" stroke="#2563eb" strokeWidth="4" strokeLinecap="round"><circle cx="43" cy="43" r="17" /><path d="M43 4v20M43 62v20M4 43h20M62 43h20" /></svg></div></div></div>
    </section>

    <h3 className="sect">Platform overview</h3><p className="muted sub">Live totals from saved backend records</p>
    <section className="grid4">{stat('Total reports', a?.total_reports)}{stat('Garbage', a?.garbage_reports)}{stat('Waterlogging', a?.waterlogging_reports)}{stat('Resolved', a?.resolved_reports)}</section>

    <h3 className="sect">Detection services</h3>
    <section className="grid4">
      {svc('Garbage detection', 'YOLO11m garbage detector · min 40% confidence', h?.garbage ?? null)}
      {svc('Waterlogging assessment', 'Separate water model · min 40% confidence', h?.waterlogging ?? null)}
      {svc('GPS tracking', 'Browser location + manual map')}
      {svc('Severity assessment', 'Coverage-based project thresholds')}
    </section>

    {recent.length > 0 && <>
      <h3 className="sect">Recent reports</h3>
      <div className="card list">
        {recent.map(r => <Link key={r.id} to={`/results/${r.id}`} className="row">
          <img src={asset(r.processed_image)} alt="" /><div className="grow"><b className="code">{r.report_code}</b><small className="muted block">{r.address || 'No address'} · {fmtDate(r.created_at)}</small></div>
          <TypeBadge type={r.report_type} /><StatusPill s={r.status} />
        </Link>)}
      </div>
    </>}
  </>;
}
