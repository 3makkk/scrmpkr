import { createContext, useContext, useEffect, useState } from "react";

export type Account = { id: string; name: string };
type AuthContextValue = {
  account: Account | null;
  login: (name: string) => void;
  updateName: (name: string) => void;
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
      // Generate a 32-character hex string from cryptographically secure random bytes
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    };

    const user: Account = { id: generateId(), name };
    localStorage.setItem("scrmpkr_user", JSON.stringify(user));
    setAccount(user);
  };

  const updateName = (name: string) => {
    if (account) {
      const updatedUser: Account = { ...account, name };
      localStorage.setItem("scrmpkr_user", JSON.stringify(updatedUser));
      setAccount(updatedUser);
    }
  };

  return (
    <AuthContext.Provider value={{ account, login, updateName }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
