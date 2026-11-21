import { createContext, useContext, useState } from 'react';
import api from '../api/api';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; } });
  const save = d => { localStorage.setItem('token', d.access_token); localStorage.setItem('user', JSON.stringify(d.user)); setUser(d.user); };
  const login = async x => save((await api.post('/api/auth/login', x)).data);
  const register = async x => save((await api.post('/api/auth/register', x)).data);
  const logout = () => { localStorage.clear(); setUser(null); };
  return <Ctx.Provider value={{ user, isStaff: user?.role === 'municipal', login, register, logout }}>{children}</Ctx.Provider>;
}
