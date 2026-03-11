"use client";
import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Firestore에서 Pro 상태 확인
        const snap = await getDoc(doc(db, "users", firebaseUser.uid));
        setIsPro(snap.data()?.isPro === true);
      } else {
        setIsPro(false);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return { user, isPro, loading };
}
