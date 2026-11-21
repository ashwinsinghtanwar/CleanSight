import api from './api/api';

// Fetches the CSV with the login token, then saves it as a file.
export async function downloadCsv(params = {}) {
  const r = await api.get('/api/reports/export.csv', { params, responseType: 'blob' });
  const url = URL.createObjectURL(r.data);
  const a = document.createElement('a');
  a.href = url; a.download = 'cleansight-reports.csv'; a.click();
  URL.revokeObjectURL(url);
}
