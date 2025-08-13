import React, { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [account, setAccount] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("scrmpkr_user");
    if (stored) setAccount(JSON.parse(stored));
  }, []);

  const login = (name) => {
    // Generate a simple UUID-like string for compatibility
    const generateId = () => {
      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
        /[xy]/g,
        function (c) {
          const r = (Math.random() * 16) | 0;
          const v = c == "x" ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        }
      );
    };

    const user = { id: generateId(), name };
    localStorage.setItem("scrmpkr_user", JSON.stringify(user));
    setAccount(user);
  };

  return (
    <AuthContext.Provider value={{ account, login }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
