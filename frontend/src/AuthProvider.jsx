import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [account, setAccount] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('scrmpkr_user');
    if (stored) setAccount(JSON.parse(stored));
  }, []);

  const login = (name) => {
    const user = { id: crypto.randomUUID(), name };
    localStorage.setItem('scrmpkr_user', JSON.stringify(user));
    setAccount(user);
  };

  return (
    <AuthContext.Provider value={{ account, login }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

