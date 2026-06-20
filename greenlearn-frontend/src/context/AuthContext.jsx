import { createContext, useContext, useState, useEffect } from 'react';
import { getMe } from '../api';
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from '../config/authStorage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => !!getAccessToken());

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    getMe()
      .then(({ data }) => setUser(data))
      .catch(() => {
        clearTokens();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const signIn = (tokens, userData) => {
    setTokens(tokens);
    setUser(userData);
  };

  const signOut = () => {
    const refresh = getRefreshToken();
    if (refresh) {
      import('../api').then(({ logout }) => logout({ refresh }).catch(() => {}));
    }
    clearTokens();
    setUser(null);
  };

  const refreshUser = () => {
    return getMe()
      .then(({ data }) => { setUser(data); return data; })
      .catch(() => {});
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
