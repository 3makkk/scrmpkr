import { createContext, useContext, useEffect, useState } from "react";

export type Account = { id: string; name: string };
type AuthContextValue = {
  account: Account | null;
  login: (name: string) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<Account | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("scrmpkr_user");
    if (stored) setAccount(JSON.parse(stored) as Account);
  }, []);

  const login = (name: string) => {
    const generateId = () => {
      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    };

    const user: Account = { id: generateId(), name };
    localStorage.setItem("scrmpkr_user", JSON.stringify(user));
    setAccount(user);
  };

  return (
    <AuthContext.Provider value={{ account, login }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
