"use client";
import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkPro = async (firebaseUser: User): Promise<boolean> => {
    try {
      const snap = await getDoc(doc(db, "users", firebaseUser.uid));
      const pro = snap.data()?.isPro === true;
      setIsPro(pro);
      return pro;
    } catch (e) {
      console.warn("Firestore offline, defaulting isPro to false");
      setIsPro(false);
      return false;
    }
  };

  useEffect(() => {
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

  // 결제 후 Pro 상태 확인 - 최대 10초간 2초마다 재시도
  const refreshPro = async () => {
    if (!user) return;
    const currentUser = user;
    for (let i = 0; i < 5; i++) {
      await new Promise(res => setTimeout(res, 2000));
      const pro = await checkPro(currentUser);
      if (pro) return; // Pro 확인되면 즉시 종료
    }
  };

  return { user, isPro, loading, refreshPro };
}
