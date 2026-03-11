"use client";
import { useState } from "react";
import { signInWithGoogle, signInWithEmail, signUpWithEmail } from "./firebase";

interface Props {
  onClose: () => void;
  defaultMode?: "signin" | "signup";
}

export default function AuthModal({ onClose, defaultMode = "signup" }: Props) {
  const [mode, setMode] = useState<"signin" | "signup">(defaultMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGoogle = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      onClose();
    } catch (e: any) {
      setError("Google sign in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEmail = async () => {
    if (!email || !password) { setError("Please enter email and password."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true);
    setError("");
    try {
      if (mode === "signup") {
        await signUpWithEmail(email, password);
      } else {
        await signInWithEmail(email, password);
      }
      onClose();
    } catch (e: any) {
      if (e.code === "auth/email-already-in-use") setError("Email already in use. Try signing in.");
      else if (e.code === "auth/user-not-found") setError("No account found. Sign up first.");
      else if (e.code === "auth/wrong-password") setError("Wrong password.");
      else setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "20px 20px", overflowY: "auto",
    }}>
      <div style={{
        background: "linear-gradient(160deg, #0d1117, #161b27)",
        borderRadius: 20, padding: "32px 28px",
        maxWidth: 400, width: "100%",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 32px 64px rgba(0,0,0,0.6)",
        position: "relative",
      }}>
        {/* Close */}
        <button onClick={onClose} style={{
          position: "absolute", top: 14, right: 14,
          background: "rgba(255,255,255,0.08)", border: "none",
          borderRadius: "50%", width: 30, height: 30,
          color: "white", fontSize: 14, cursor: "pointer",
        }}>✕</button>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 36, marginBottom: 6 }}>⚡</div>
          <div style={{ color: "white", fontSize: 20, fontWeight: 800 }}>
            {mode === "signup" ? "Create your free account" : "Welcome back"}
          </div>
          <div style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>
            {mode === "signup" ? "Start planning EV trips for free" : "Sign in to EV Route Pro"}
          </div>
        </div>

        {/* Google 버튼 */}
        <button onClick={handleGoogle} disabled={loading} style={{
          width: "100%", padding: "11px", borderRadius: 10,
          background: "white", border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          fontSize: 14, fontWeight: 700, color: "#1a1a1a",
          marginBottom: 16, opacity: loading ? 0.6 : 1,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        {/* 구분선 */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
          <span style={{ color: "#475569", fontSize: 12 }}>or</span>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
        </div>

        {/* 이메일 입력 */}
        <input
          type="email" placeholder="Email address" value={email}
          onChange={e => setEmail(e.target.value)}
          style={{
            width: "100%", padding: "11px 14px", borderRadius: 10, marginBottom: 10,
            background: "#0d1117", border: "1px solid rgba(255,255,255,0.1)",
            color: "white", fontSize: 14, outline: "none", boxSizing: "border-box",
          }}
        />
        <input
          type="password" placeholder="Password (min 6 chars)" value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleEmail()}
          style={{
            width: "100%", padding: "11px 14px", borderRadius: 10, marginBottom: 14,
            background: "#0d1117", border: "1px solid rgba(255,255,255,0.1)",
            color: "white", fontSize: 14, outline: "none", boxSizing: "border-box",
          }}
        />

        {/* 에러 */}
        {error && (
          <div style={{ color: "#f87171", fontSize: 12, marginBottom: 12, textAlign: "center" }}>
            {error}
          </div>
        )}

        {/* 제출 버튼 */}
        <button onClick={handleEmail} disabled={loading} style={{
          width: "100%", padding: "12px", borderRadius: 10, border: "none",
          background: loading ? "#334155" : "linear-gradient(135deg, #059669, #10b981)",
          color: "white", fontSize: 15, fontWeight: 800,
          cursor: loading ? "not-allowed" : "pointer",
          boxShadow: "0 6px 20px rgba(16,185,129,0.3)",
        }}>
          {loading ? "Loading..." : mode === "signup" ? "Create Free Account" : "Sign In"}
        </button>

        {/* 모드 전환 */}
        <div style={{ textAlign: "center", marginTop: 16, color: "#64748b", fontSize: 13 }}>
          {mode === "signup" ? "Already have an account? " : "Don't have an account? "}
          <button onClick={() => { setMode(mode === "signup" ? "signin" : "signup"); setError(""); }}
            style={{ background: "none", border: "none", color: "#10b981", cursor: "pointer", fontWeight: 700, fontSize: 13 }}>
            {mode === "signup" ? "Sign in" : "Sign up free"}
          </button>
        </div>

        <div style={{ textAlign: "center", color: "#334155", fontSize: 11, marginTop: 12 }}>
          🔒 Your data is secure. No spam, ever.
        </div>
      </div>
    </div>
  );
}
