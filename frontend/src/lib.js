export const STATUSES = ['Reported', 'Verified', 'Assigned', 'In Progress', 'Resolved'];

export const TYPES = {
  garbage:      { label: 'Land Garbage', short: 'Garbage',      color: '#ef233c', soft: '#fee2e2', unit: 'Garbage objects', none: 'No garbage objects were detected by the AI.' },
  waterlogging: { label: 'Waterlogging', short: 'Waterlogging', color: '#1677ff', soft: '#e0edff', unit: 'Water areas',     none: 'No waterlogging was detected by the AI.' },
};
export const typeOf = t => TYPES[t] || TYPES.garbage;

export const SEV_COLOR = { Low: '#16a34a', Medium: '#f59e0b', High: '#dc2626', None: '#64748b' };
export const SEV_LABEL = { Low: 'Low', Medium: 'Medium', High: 'High', None: 'No detection' };
export const DEFAULT_CENTER = [28.6139, 77.209];

export const fmtDate = s => s ? new Date(s).toLocaleDateString('en-GB') : '—';
export const fmtDateTime = s => s ? new Date(s).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
export const errMsg = (e, fallback = 'Something went wrong.') => {
  const d = e?.response?.data?.detail;
  if (typeof d === 'string') return d;
  if (Array.isArray(d) && d[0]?.msg) return d[0].msg;
  return e?.response ? fallback : 'Cannot reach the server. Is the API window running?';
};
