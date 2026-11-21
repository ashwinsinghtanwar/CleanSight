import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import StaffOnly from './components/StaffOnly';
import Auth from './pages/Auth';
import Overview from './pages/Overview';
import ReportIssue from './pages/ReportIssue';
import DetectionResults from './pages/DetectionResults';
import LiveMap from './pages/LiveMap';
import Municipal from './pages/Municipal';
import Analytics from './pages/Analytics';
import History from './pages/History';
import Settings from './pages/Settings';

export default function App() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Auth />} />
      <Route element={user ? <Layout /> : <Navigate to="/login" replace />}>
        <Route index element={<Overview />} />
        <Route path="report" element={<ReportIssue />} />
        <Route path="results" element={<DetectionResults />} />
        <Route path="results/:id" element={<DetectionResults />} />
        <Route path="map" element={<LiveMap />} />
        <Route path="municipal" element={<StaffOnly><Municipal /></StaffOnly>} />
        <Route path="analytics" element={<StaffOnly><Analytics /></StaffOnly>} />
        <Route path="history" element={<History />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
