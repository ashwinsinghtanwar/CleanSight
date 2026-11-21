import { useEffect } from 'react';
import { SEV_COLOR, typeOf } from '../lib';

export const TypeBadge = ({ type }) => {
  const t = typeOf(type);
  return <span className="pill" style={{ background: t.soft, color: t.color }}><i className={'shape ' + (type === 'waterlogging' ? 'drop' : 'sq')} style={{ background: t.color }} />{t.label}</span>;
};
export const SevPill = ({ s }) => <span className="pill" style={{ background: SEV_COLOR[s] + '1a', color: SEV_COLOR[s] }}>{s === 'None' ? 'No detection' : s}</span>;
export const StatusPill = ({ s }) => <span className={'pill st st-' + s.toLowerCase().replace(' ', '-')}>{s}</span>;

export function Modal({ title, onClose, children }) {
  useEffect(() => { const k = e => e.key === 'Escape' && onClose(); window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [onClose]);
  return (
    <div className="modal-bg" onMouseDown={onClose}>
      <div className="modal" onMouseDown={e => e.stopPropagation()}>
        <h3>{title}</h3>{children}
      </div>
    </div>
  );
}

export const Empty = ({ children }) => <div className="empty">{children}</div>;

export function Steps({ status }) {
  const order = ['Reported', 'Verified', 'Assigned', 'In Progress', 'Resolved'];
  const at = order.indexOf(status);
  return (
    <div className="steps">
      {order.map((s, i) => (
        <div key={s} className={'step' + (i < at ? ' done' : i === at ? ' now' : '')}>
          <span className="dotn">{i < at ? '✓' : i + 1}</span><small>{s}</small>
        </div>
      ))}
    </div>
  );
}
