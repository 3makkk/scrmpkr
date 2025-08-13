import React, { createContext, useContext, useEffect, useState } from 'react';
import { PublicClientApplication, InteractionType } from '@azure/msal-browser';
import { msalConfig } from './msalConfig';

const msalInstance = new PublicClientApplication(msalConfig);
const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [account, setAccount] = useState(null);
  useEffect(() => {
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length > 0) setAccount(accounts[0]);
  }, []);
  const login = () => msalInstance.loginPopup({ scopes: ['User.Read'] }).then(res => setAccount(res.account));
  const getToken = async () => {
    const res = await msalInstance.acquireTokenSilent({ account, scopes: ['User.Read'] }).catch(() => msalInstance.acquireTokenPopup({ scopes:['User.Read'] }));
    return res.idToken;
  };
  return <AuthContext.Provider value={{ account, login, getToken }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
