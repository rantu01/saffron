"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebaseClient";
import { setCurrentAuthUser, installAuthFetch } from "@/lib/clientAuth";

const AuthContext = createContext({
  user: null,
  loading: true,
  logout: async () => { },
});

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    installAuthFetch();
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setCurrentAuthUser(nextUser);
      setUser(nextUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await signOut(auth);
  };

  const value = useMemo(() => ({ user, loading, logout }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}