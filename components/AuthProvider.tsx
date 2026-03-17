"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

interface AuthContextValue {
  user: User | null;
  isPro: boolean;
  loading: boolean;
  refreshPro: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isPro: false,
  loading: true,
  refreshPro: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleIndexedDBError = (event: PromiseRejectionEvent) => {
      if (event.reason?.message?.includes("Connection to Indexed Database server lost")) {
        event.preventDefault();
        window.location.reload();
      }
    };
    window.addEventListener("unhandledrejection", handleIndexedDBError);
    return () => window.removeEventListener("unhandledrejection", handleIndexedDBError);
  }, []);

  useEffect(() => {
    let unsubFirestore: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (unsubFirestore) { unsubFirestore(); unsubFirestore = null; }

      if (firebaseUser) {
        // Save email/name so Firestore shows readable user info
        setDoc(doc(db, "users", firebaseUser.uid), {
          email: firebaseUser.email ?? "",
          displayName: firebaseUser.displayName ?? "",
        }, { merge: true }).catch(() => {});

        unsubFirestore = onSnapshot(
          doc(db, "users", firebaseUser.uid),
          (snap) => { setIsPro(snap.data()?.isPro === true); setLoading(false); },
          () => { setIsPro(false); setLoading(false); }
        );
      } else {
        setIsPro(false);
        setLoading(false);
      }
    });

    return () => { unsubAuth(); if (unsubFirestore) unsubFirestore(); };
  }, []);

  // no-op: onSnapshot handles real-time updates
  const refreshPro = async () => {};

  return (
    <AuthContext.Provider value={{ user, isPro, loading, refreshPro }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
