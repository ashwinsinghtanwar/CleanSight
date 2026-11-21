import { useEffect, useState } from 'react';
import api from '../api/api';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { Empty } from '../components/Ui';

const SEV = { Low: '#16a34a', Medium: '#f59e0b', High: '#ef233c', None: '#94a3b8' };
const pct = v => (v == null ? '—%' : v + '%');

export default function Analytics() {
  const [a, setA] = useState(null);
  useEffect(() => { api.get('/api/analytics').then(r => setA(r.data)); }, []);
  if (!a) return <div className="card"><Empty>Loading…</Empty></div>;
  const status = Object.entries(a.status_counts).map(([name, value]) => ({ name, value }));
  const sev = Object.entries(a.severity_counts).filter(([, v]) => v).map(([name, value]) => ({ name, value }));
  const types = [{ name: 'Waterlogging', value: a.waterlogging_reports, c: '#1677ff' }, { name: 'Land garbage', value: a.garbage_reports, c: '#ef233c' }].filter(x => x.value);
  const cats = Object.entries(a.category_counts).map(([name, value]) => ({ name, value }));
  const rate = a.total_reports ? Math.round((a.resolved_reports / a.total_reports) * 100) : 0;
  const none = !a.total_reports;

  return <>
    <section className="grid4">
      <div className="card stat"><small>Avg garbage coverage</small><h2>{pct(a.avg_garbage_coverage)}</h2></div>
      <div className="card stat"><small>Avg water coverage</small><h2>{pct(a.avg_water_coverage)}</h2></div>
      <div className="card stat"><small>Resolution rate</small><h2>{rate}%</h2></div>
      <div className="card stat"><small>Total reports</small><h2>{a.total_reports}</h2></div>
    </section>
    {none ? <div className="card"><Empty>No data yet. Charts appear after the first report.</Empty></div> :
    <section className="grid2e">
      <div className="card pad"><h3>Monthly reports</h3><ResponsiveContainer width="100%" height={280}>
        <LineChart data={a.monthly}><CartesianGrid strokeDasharray="3 3" stroke="#e5e9f2" /><XAxis dataKey="month" /><YAxis allowDecimals={false} /><Tooltip /><Legend />
          <Line type="monotone" dataKey="reports" name="Reported" stroke="#2563eb" strokeWidth={3} dot /><Line type="monotone" dataKey="resolved" name="Resolved" stroke="#16a34a" strokeWidth={3} dot /></LineChart></ResponsiveContainer></div>
      <div className="card pad"><h3>Status distribution</h3><ResponsiveContainer width="100%" height={280}>
        <BarChart data={status}><CartesianGrid strokeDasharray="3 3" stroke="#e5e9f2" /><XAxis dataKey="name" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="value" name="Reports" fill="#2563eb" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer></div>
      <div className="card pad"><h3>Complaint types</h3><ResponsiveContainer width="100%" height={260}>
        <PieChart><Pie data={types} dataKey="value" nameKey="name" outerRadius={90} label>{types.map(t => <Cell key={t.name} fill={t.c} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer></div>
      <div className="card pad"><h3>Severity</h3><ResponsiveContainer width="100%" height={260}>
        <PieChart><Pie data={sev} dataKey="value" nameKey="name" outerRadius={90} label>{sev.map(s => <Cell key={s.name} fill={SEV[s.name]} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer></div>
      {cats.length > 0 && <div className="card pad span2"><h3>Detected categories</h3><ResponsiveContainer width="100%" height={260}>
        <BarChart data={cats}><CartesianGrid strokeDasharray="3 3" stroke="#e5e9f2" /><XAxis dataKey="name" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="value" name="Detections" fill="#1677ff" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer></div>}
    </section>}
  </>;
}
