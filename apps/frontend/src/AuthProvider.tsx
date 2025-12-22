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
      // Generate a RFC 4122 version 4 UUID using cryptographically secure randomness
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);

      // Per RFC 4122 section 4.4: set the version to 4
      bytes[6] = (bytes[6] & 0x0f) | 0x40;
      // Set the variant to 10xx
      bytes[8] = (bytes[8] & 0x3f) | 0x80;

      const hex: string[] = [];
      for (let i = 0; i < bytes.length; i++) {
        hex.push(bytes[i].toString(16).padStart(2, "0"));
      }

      return (
        hex.slice(0, 4).join("") +
        hex.slice(4, 6).join("") +
        "-" +
        hex.slice(6, 8).join("") +
        "-" +
        hex.slice(8, 10).join("") +
        "-" +
        hex.slice(10, 12).join("") +
        "-" +
        hex.slice(12, 16).join("")
      );
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
