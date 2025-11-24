import { signOut as firebaseSignOut, onAuthStateChanged } from "firebase/auth";
import React, { createContext, useEffect, useState } from "react";
import { auth } from "../api/firebase";

export const AuthContext = createContext({
  user: null,
  initializing: true,
  setUser: () => {},
  logout: async () => {}
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (initializing) setInitializing(false);
    });
    return () => unsub();
  }, []);

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
    } catch (e) {
      console.warn("Logout error:", e);
      throw e;
    }
  };

  return (
    <AuthContext.Provider value={{ user, initializing, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
