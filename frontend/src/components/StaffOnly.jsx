import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function StaffOnly({ children }) {
  const { isStaff } = useAuth();
  if (isStaff) return children;
  return (
    <div className="card center-card">
      <div className="big-ico">🔒</div>
      <h3>Municipal staff only</h3>
      <p className="muted">This section is for municipal officers who manage and resolve reports. Your account is a citizen account.
        To get staff access, create a new account and choose <b>Municipal staff</b> with the access code from your administrator.</p>
      <Link className="btn primary" to="/">Back to overview</Link>
    </div>
  );
}
