import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { errMsg } from '../lib';

export default function Auth() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [f, setF] = useState({ full_name: '', email: '', password: '', account_type: 'citizen', access_code: '' });
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const set = k => e => setF({ ...f, [k]: e.target.value });

  const submit = async e => {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      if (mode === 'login') await login({ email: f.email, password: f.password });
      else await register({ ...f, access_code: f.account_type === 'municipal' ? f.access_code : null });
    } catch (x) { setErr(errMsg(x, 'Request failed.')); }
    setBusy(false);
  };

  return (
    <div className="authwrap">
      <form className="card authcard" onSubmit={submit}>
        <div className="brand"><div className="logo">C</div><div><b>CleanSight</b><small>Civic intelligence</small></div></div>
        <h2>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
        <p className="muted">{mode === 'login' ? 'Sign in to report issues and track them on the live map.' : 'Citizens report issues. Municipal staff manage and resolve them.'}</p>
        <div className="tabs">
          <button type="button" className={mode === 'login' ? 'on' : ''} onClick={() => { setMode('login'); setErr(''); }}>Sign in</button>
          <button type="button" className={mode === 'register' ? 'on' : ''} onClick={() => { setMode('register'); setErr(''); }}>Create account</button>
        </div>
        {mode === 'register' && <>
          <label>Full name<input required minLength={2} value={f.full_name} onChange={set('full_name')} placeholder="Your name" /></label>
        </>}
        <label>Email<input required type="email" value={f.email} onChange={set('email')} placeholder="you@example.com" autoComplete="email" /></label>
        <label>Password<input required type="password" minLength={6} value={f.password} onChange={set('password')} placeholder="At least 6 characters" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /></label>
        {mode === 'register' && <>
          <div className="seg2">
            <button type="button" className={f.account_type === 'citizen' ? 'on' : ''} onClick={() => setF({ ...f, account_type: 'citizen' })}><b>Citizen</b><small>Report &amp; track issues</small></button>
            <button type="button" className={f.account_type === 'municipal' ? 'on' : ''} onClick={() => setF({ ...f, account_type: 'municipal' })}><b>Municipal staff</b><small>Dashboard &amp; management</small></button>
          </div>
          {f.account_type === 'municipal' && <label>Staff access code<input value={f.access_code} onChange={set('access_code')} placeholder="Code from your administrator" />
            <small className="muted">The very first account on a fresh install becomes staff automatically. Default code: <code>CLEANSIGHT-STAFF</code> (change it in backend\.env).</small></label>}
        </>}
        {err && <p className="error">{err}</p>}
        <button className="btn primary wide" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Sign in →' : 'Create account →'}</button>
      </form>
    </div>
  );
}
