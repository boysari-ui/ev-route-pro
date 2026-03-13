"use client";
import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkPro = async (firebaseUser: User) => {
    try {
      const snap = await getDoc(doc(db, "users", firebaseUser.uid));
      setIsPro(snap.data()?.isPro === true);
    } catch (e) {
      console.warn("Firestore offline, defaulting isPro to false");
      setIsPro(false);
    }
  };

  useEffect(() => {
    // 3초 안에 응답 없으면 강제로 loading 해제
    const timeout = setTimeout(() => setLoading(false), 3000);

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      clearTimeout(timeout);
      setUser(firebaseUser);
      if (firebaseUser) {
        await checkPro(firebaseUser);
      } else {
        setIsPro(false);
      }
      setLoading(false);
    });
    return () => { unsub(); clearTimeout(timeout); };
  }, []);

  // 결제 후 Pro 상태 수동으로 다시 확인
  const refreshPro = async () => {
    if (user) await checkPro(user);
  };

  return { user, isPro, loading, refreshPro };
}
