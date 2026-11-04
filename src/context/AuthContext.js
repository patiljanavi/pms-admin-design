import { createContext, useContext, useMemo, useState } from 'react';

const AuthContext = createContext(null);
const KEY = 'harbor.user';

function readUser() {
  try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readUser);

  const value = useMemo(() => ({
    user,
    // Demo only: replace with a real API call that returns a session.
    signIn: (email) => {
      const u = { email, name: email.split('@')[0] };
      setUser(u);
      try { localStorage.setItem(KEY, JSON.stringify(u)); } catch {}
    },
    signOut: () => {
      setUser(null);
      try { localStorage.removeItem(KEY); } catch {}
    },
  }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
