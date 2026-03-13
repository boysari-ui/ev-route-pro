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
        try {
          const snap = await getDoc(doc(db, "users", firebaseUser.uid));
          setIsPro(snap.data()?.isPro === true);
        } catch (e) {
          // 오프라인 or 네트워크 에러 → isPro false 유지
          console.warn("Firestore offline, defaulting isPro to false");
          setIsPro(false);
        }
      } else {
        setIsPro(false);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return { user, isPro, loading };
}
