import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import api, { asset } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { DEFAULT_CENTER, SEV_COLOR, SEV_LABEL, typeOf, errMsg } from '../lib';
import { pinIcon } from '../mapIcons';
import { SevPill, StatusPill } from '../components/Ui';

function Fit({ pts }) {
  const map = useMap();
  const key = pts.map(p => p.join()).join('|');
  useEffect(() => {
    if (pts.length === 1) map.setView(pts[0], 14);
    else if (pts.length > 1) map.fitBounds(pts, { padding: [50, 50], maxZoom: 15 });
  }, [key]);                       // refit only when the set of pins changes
  return null;
}

export default function LiveMap() {
  const { isStaff } = useAuth();
  const [d, setD] = useState([]), [f, setF] = useState('all'), [sf, setSf] = useState('all'), [showRes, setShowRes] = useState(false), [err, setErr] = useState('');
  const load = useCallback(() => api.get('/api/map-data', { params: { include_resolved: showRes } }).then(x => { setD(x.data); setErr(''); }).catch(() => setErr('Could not load map data.')), [showRes]);
  useEffect(() => { load(); const t = setInterval(load, 20000); return () => clearInterval(t); }, [load]);   // live refresh

  const n = k => d.filter(x => x.report_type === k && x.status !== 'Resolved').length;
  const sn = k => d.filter(x => x.severity === k && x.status !== 'Resolved' && (f === 'all' || x.report_type === f)).length;
  const shown = useMemo(() => d.filter(x => (f === 'all' || x.report_type === f) && (sf === 'all' || x.severity === sf)), [d, f, sf]);
  const pts = useMemo(() => shown.map(x => [x.latitude, x.longitude]), [shown]);
  const open = d.filter(x => x.status !== 'Resolved').length;

  const resolve = async id => {
    if (!confirm('Mark this issue as resolved? It will be removed from the map.')) return;
    try { await api.patch(`/api/reports/${id}/status`, { status: 'Resolved' }); load(); } catch (e) { alert(errMsg(e)); }
  };

  return (
    <section className="card pad">
      <div className="rowbar">
        <div><h3>All geolocated reports</h3><p className="muted sub">Pins are report points, not measured hazard boundaries. Resolved issues are removed automatically.</p></div>
        <label className="check"><input type="checkbox" checked={showRes} onChange={e => setShowRes(e.target.checked)} /> Show resolved</label>
      </div>
      <div className="legend">
        <span className="legtitle">Type</span>
        <button className={'legbtn' + (f === 'all' ? ' on' : '')} onClick={() => setF('all')}>All open ({open})</button>
        <button className={'legbtn' + (f === 'waterlogging' ? ' on' : '')} onClick={() => setF('waterlogging')}><i className="shape drop" /> Waterlogging ({n('waterlogging')})</button>
        <button className={'legbtn' + (f === 'garbage' ? ' on' : '')} onClick={() => setF('garbage')}><i className="shape sq" /> Land garbage ({n('garbage')})</button>
      </div>
      <div className="legend">
        <span className="legtitle">Severity</span>
        <button className={'legbtn' + (sf === 'all' ? ' on' : '')} onClick={() => setSf('all')}>All</button>
        {['High', 'Medium', 'Low', 'None'].map(k => (
          <button key={k} className={'legbtn' + (sf === k ? ' on' : '')} onClick={() => setSf(sf === k ? 'all' : k)}>
            <i className="sevdot" style={{ background: SEV_COLOR[k] }} /> {SEV_LABEL[k]} ({sn(k)})</button>
        ))}
      </div>
      {err && <p className="error">{err}</p>}
      {!err && !d.length && <p className="muted">No open reports right now. New reports appear here as soon as they are submitted.</p>}
      <MapContainer center={DEFAULT_CENTER} zoom={10} className="map tall">
        <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Fit pts={pts} />
        {shown.map(x => (
          <Marker key={x.id} position={[x.latitude, x.longitude]} icon={pinIcon(x.report_type, x.severity, x.status === 'Resolved')}>
            <Popup>
              <div className="pop">
                {x.thumbnail && <img src={asset(x.thumbnail)} alt="" />}
                <b style={{ color: typeOf(x.report_type).color }}>{typeOf(x.report_type).label}</b>
                <div className="code">{x.report_code}</div>
                <div className="pills"><SevPill s={x.severity} /><StatusPill s={x.status} /></div>
                {x.address && <small>{x.address}</small>}
                {x.assigned_to && <small>Assigned: {x.assigned_to}</small>}
                <div className="acts"><Link to={`/results/${x.id}`} className="act">View result</Link>
                  {isStaff && x.status !== 'Resolved' && <button className="act" onClick={() => resolve(x.id)}>Mark resolved</button>}</div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </section>
  );
}
