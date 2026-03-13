"use client";
import { useState } from "react";
import { useAuth } from "./useAuth";
import { logOut } from "./firebase";

interface Props {
  onOpenAuth: (mode: "signin" | "signup") => void;
  onOpenPro: () => void;
  onOpenProfile: () => void;
}

export default function AuthBar({ onOpenAuth, onOpenPro, onOpenProfile }: Props) {
  const { user, isPro, loading } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  if (loading) return <div style={{ width: 120, height: 32 }} />;

  if (!user) return (
    <div style={{ display: "flex", gap: 8 }}>
      <button onClick={() => onOpenAuth("signin")} style={{
        padding: "7px 14px", borderRadius: 8,
        border: "1px solid rgba(255,255,255,0.2)",
        background: "transparent", color: "white",
        fontSize: 13, fontWeight: 600, cursor: "pointer",
      }}>Log in</button>
      <button onClick={() => onOpenAuth("signup")} style={{
        padding: "7px 14px", borderRadius: 8, border: "none",
        background: "linear-gradient(135deg, #059669, #10b981)",
        color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer",
      }}>Sign up free</button>
    </div>
  );

  return (
    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
      {isPro ? (
        <div style={{
          background: "linear-gradient(135deg, #f59e0b, #fbbf24)",
          borderRadius: 8, padding: "4px 10px",
          fontSize: 11, fontWeight: 800, color: "#1a1a1a",
        }}>⚡ PRO+</div>
      ) : (
        <button onClick={onOpenPro} style={{
          padding: "7px 14px", borderRadius: 8, border: "none",
          background: "linear-gradient(135deg, #059669, #10b981)",
          color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer",
        }}>Upgrade to Pro Plus</button>
      )}

      <div style={{ position: "relative" }}>
        <button onClick={() => setShowMenu(!showMenu)} style={{
          width: 32, height: 32, borderRadius: "50%",
          border: "2px solid #059669", background: "#059669",
          color: "white", fontSize: 13, fontWeight: 700,
          cursor: "pointer", overflow: "hidden", padding: 0,
        }}>
          {user.photoURL
            ? <img src={user.photoURL} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
            : (user.email?.[0] || "U").toUpperCase()
          }
        </button>

        {showMenu && (
          <div style={{
            position: "absolute", top: 38, right: 0, zIndex: 200,
            background: "#1e2433", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 10, padding: 8, minWidth: 180,
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          }}>
            <div style={{ color: "#64748b", fontSize: 11, padding: "4px 10px 8px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              {user.email}
            </div>
            <button onClick={() => { onOpenProfile(); setShowMenu(false); }} style={{
              width: "100%", padding: "8px 10px", background: "none", border: "none",
              color: "#e2e8f0", fontSize: 13, cursor: "pointer", textAlign: "left", borderRadius: 6,
            }}>👤 My Profile</button>
            {!isPro && (
              <button onClick={() => { onOpenPro(); setShowMenu(false); }} style={{
                width: "100%", padding: "8px 10px", background: "none", border: "none",
                color: "#10b981", fontSize: 13, fontWeight: 700, cursor: "pointer", textAlign: "left", borderRadius: 6,
              }}>⚡ Upgrade to Pro Plus</button>
            )}
            <button onClick={() => { logOut(); setShowMenu(false); }} style={{
              width: "100%", padding: "8px 10px", background: "none", border: "none",
              color: "#94a3b8", fontSize: 13, cursor: "pointer", textAlign: "left", borderRadius: 6,
            }}>Sign out</button>
          </div>
        )}
      </div>
    </div>
  );
}
