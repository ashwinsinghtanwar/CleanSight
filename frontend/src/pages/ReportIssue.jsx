import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import api from '../api/api';
import { TYPES, DEFAULT_CENTER, errMsg } from '../lib';
import { pinIcon } from '../mapIcons';

const MAX = 15 * 1024 * 1024;

function Picker({ pos, onPick, flyTo }) {
  const map = useMap();
  useMapEvents({ click: e => onPick(e.latlng.lat, e.latlng.lng) });
  useEffect(() => { if (flyTo && pos) map.flyTo(pos, Math.max(map.getZoom(), 16)); }, [flyTo]);   // only after GPS / typed coordinates
  return null;
}

export default function ReportIssue() {
  const nav = useNavigate();
  const fileRef = useRef();
  const [type, setType] = useState('');
  const [file, setFile] = useState(null);
  const [drag, setDrag] = useState(false);
  const [desc, setDesc] = useState('');
  const [lat, setLat] = useState(''), [lng, setLng] = useState('');
  const [acc, setAcc] = useState(''), [source, setSource] = useState('manual');
  const [addr, setAddr] = useState('');
  const [fly, setFly] = useState(0);
  const [msg, setMsg] = useState({ t: '', k: '' });
  const [busy, setBusy] = useState(false);
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

  const pos = lat !== '' && lng !== '' && !isNaN(+lat) && !isNaN(+lng) ? [+lat, +lng] : null;
  const say = (t, k = 'info') => setMsg({ t, k });

  const takeFile = f => {
    if (!f) return;
    if (!/^image\/(jpeg|png|webp)$/.test(f.type)) return say('Only JPG, PNG or WEBP images are supported.', 'error');
    if (f.size > MAX) return say('Image is too large (max 15 MB).', 'error');
    setFile(f); say('');
  };

  const reverse = async (la, ln) => {                          // best-effort address lookup (needs internet)
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${la}&lon=${ln}`, { headers: { 'Accept-Language': 'en' } });
      const j = await r.json();
      if (j?.display_name) setAddr(a => a || j.display_name.split(', ').slice(0, 5).join(', '));
    } catch { /* offline: user can type the address */ }
  };

  const pick = (la, ln) => {
    setLat(la.toFixed(6)); setLng(ln.toFixed(6)); setAcc(''); setSource('manual'); reverse(la, ln);
  };

  const gps = () => {
    if (!navigator.geolocation) return say('Geolocation is not supported by this browser. Tap the map instead.', 'error');
    say('Getting your location…');
    navigator.geolocation.getCurrentPosition(p => {
      setLat(p.coords.latitude.toFixed(6)); setLng(p.coords.longitude.toFixed(6));
      setAcc(String(Math.round(p.coords.accuracy))); setSource('gps'); setFly(n => n + 1);
      reverse(p.coords.latitude, p.coords.longitude); say('Location captured from your device.', 'ok');
    }, e => say(e.code === 1 ? 'Location permission denied. Tap the map to set the location manually.' : 'Could not get your location. Tap the map instead.', 'error'),
    { enableHighAccuracy: true, timeout: 20000 });
  };

  const submit = async e => {
    e.preventDefault();
    if (!type) return say('Choose the complaint type: Waterlogging or Land Garbage.', 'error');
    if (!file) return say('Upload a photo of the affected area.', 'error');
    if (!pos || Math.abs(pos[0]) > 90 || Math.abs(pos[1]) > 180) return say('Set the location: use your current location or tap the map.', 'error');
    setBusy(true); say('Uploading and analysing the photo with AI…');
    try {
      const f = new FormData();
      f.append('file', file); f.append('report_type', type);
      f.append('latitude', pos[0]); f.append('longitude', pos[1]);
      f.append('description', desc); f.append('address', addr); f.append('location_source', source);
      if (acc) f.append('accuracy', acc);
      const { data } = await api.post('/api/reports', f);
      nav(`/results/${data.id}`);
    } catch (x) { say(errMsg(x, 'Could not submit the report.'), 'error'); setBusy(false); }
  };

  return (
    <form className="grid2" onSubmit={submit}>
      <section className="card pad">
        <h3>Submit a civic report</h3>
        <p className="muted sub">Upload a clear photo of the affected public area.</p>

        <div className="label">What are you reporting?</div>
        <div className="typepick">
          {Object.entries(TYPES).map(([k, v]) => (
            <button type="button" key={k} className={'typebtn ' + k + (type === k ? ' on' : '')} onClick={() => { setType(k); say(''); }}>
              <i className={'shape big ' + (k === 'waterlogging' ? 'drop' : 'sq')} style={{ background: v.color }} /><span>{v.label}</span>
            </button>
          ))}
        </div>

        <div className={'dropzone' + (drag ? ' over' : '') + (file ? ' has' : '')}
          onClick={() => fileRef.current.click()}
          onDragOver={e => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
          onDrop={e => { e.preventDefault(); setDrag(false); takeFile(e.dataTransfer.files[0]); }}>
          {preview ? <><img src={preview} alt="preview" /><small>{file.name} · click to replace</small></> :
            <><span className="plus">+</span><b>Drop image or browse files</b><small className="muted">JPG, PNG, WEBP · max 15 MB</small></>}
          <input ref={fileRef} type="file" hidden accept="image/png,image/jpeg,image/webp" onChange={e => takeFile(e.target.files[0])} />
        </div>

        <label>Description<textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Describe the issue (optional)" /></label>

        <h3 className="mt">Location</h3>
        <button type="button" className="btn soft wide" onClick={gps}>◈ Get my current location</button>
        <div className="two">
          <label>Latitude<input value={lat} onChange={e => { setLat(e.target.value); setSource('manual'); }} onBlur={() => pos && setFly(n => n + 1)} placeholder="Latitude" inputMode="decimal" /></label>
          <label>Longitude<input value={lng} onChange={e => { setLng(e.target.value); setSource('manual'); }} onBlur={() => pos && setFly(n => n + 1)} placeholder="Longitude" inputMode="decimal" /></label>
        </div>
        <div className="two">
          <label>Accuracy (metres)<input readOnly value={acc ? `±${acc} m` : ''} placeholder="Browser reported" /></label>
          <label>Source<input readOnly value={source === 'gps' ? 'Device GPS' : 'Manual selection'} /></label>
        </div>
        <label>Address<input value={addr} onChange={e => setAddr(e.target.value)} placeholder="Address / landmark" /></label>
        <small className="muted">Tap the map to set manual coordinates. No default location is silently assigned.</small>

        {msg.t && <p className={msg.k === 'error' ? 'error' : msg.k === 'ok' ? 'okmsg' : 'muted'}>{msg.t}</p>}
        <button className="btn primary wide big" disabled={busy}>{busy ? 'Analysing…' : 'Submit report →'}</button>
      </section>

      <section className="card pad mapcard">
        <h3>Select location on map</h3>
        <p className="muted sub">Click the map to place a marker.</p>
        <MapContainer center={pos || DEFAULT_CENTER} zoom={pos ? 16 : 10} className="map">
          <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Picker pos={pos} onPick={pick} flyTo={fly} />
          {pos && <Marker position={pos} icon={pinIcon(type || 'none', 'pick')} draggable eventHandlers={{ dragend: e => { const p = e.target.getLatLng(); pick(p.lat, p.lng); } }} />}
        </MapContainer>
        <small className="muted">{pos ? `Selected: ${pos[0].toFixed(5)}, ${pos[1].toFixed(5)}` : 'No location selected'}</small>
      </section>
    </form>
  );
}
