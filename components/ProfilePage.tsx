"use client";
import { useAuth } from "./useAuth";
import { logOut } from "./firebase";
import { useState } from "react";

interface SavedRoute {
  id: string;
  origin: string;
  destination: string;
  savedAt: string;
}

interface Props {
  onClose: () => void;
  onOpenPro: () => void;
  savedRoutes?: SavedRoute[];
  onLoadRoute?: (origin: string, destination: string) => void;
  onDeleteRoute?: (id: string) => void;
}

export default function ProfilePage({ onClose, onOpenPro, savedRoutes = [], onLoadRoute, onDeleteRoute }: Props) {
  const { user, isPro } = useAuth();
  const [tab, setTab] = useState<"profile" | "routes">("profile");

  if (!user) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 999999,
      background: "rgba(0,0,0,0.7)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20, backdropFilter: "blur(6px)",
    }}>
      <div style={{
        background: "linear-gradient(160deg, #0d1117, #161b27)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 24, width: "100%", maxWidth: 480,
        boxShadow: "0 32px 64px rgba(0,0,0,0.6)",
        overflow: "hidden",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}>
        {/* 헤더 */}
        <div style={{
          padding: "24px 24px 0",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 48, height: 48, borderRadius: "50%",
              background: "linear-gradient(135deg, #059669, #10b981)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, fontWeight: 800, color: "white", overflow: "hidden",
            }}>
              {user.photoURL
                ? <img src={user.photoURL} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
                : (user.email?.[0] || "U").toUpperCase()
              }
            </div>
            <div>
              <div style={{ color: "white", fontWeight: 700, fontSize: 16 }}>
                {user.displayName || user.email?.split("@")[0]}
              </div>
              <div style={{ color: "#64748b", fontSize: 12 }}>{user.email}</div>
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "rgba(255,255,255,0.08)", border: "none",
            color: "white", fontSize: 16, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>✕</button>
        </div>

        {/* Pro Plus 상태 */}
        <div style={{ padding: "16px 24px 0" }}>
          {isPro ? (
            <div style={{
              background: "linear-gradient(135deg, rgba(245,158,11,0.15), rgba(251,191,36,0.1))",
              border: "1px solid rgba(245,158,11,0.3)",
              borderRadius: 12, padding: "12px 16px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 20 }}>⚡</span>
                <div>
                  <div style={{ color: "#fbbf24", fontWeight: 700, fontSize: 13 }}>Pro Plus Active</div>
                  <div style={{ color: "#64748b", fontSize: 11 }}>Billed monthly · Cancel anytime</div>
                </div>
              </div>
              <button
                onClick={async () => {
                  const res = await fetch("/api/billing-portal", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ uid: user.uid }),
                  });
                  const data = await res.json();
                  if (data.url) window.location.href = data.url;
                }}
                style={{
                  fontSize: 11, color: "#64748b", cursor: "pointer",
                  textDecoration: "underline", background: "none", border: "none",
                }}
              >Manage</button>
            </div>
          ) : (
            <button onClick={onOpenPro} style={{
              width: "100%", padding: "12px 16px", borderRadius: 12,
              background: "linear-gradient(135deg, #059669, #10b981)",
              border: "none", color: "white", fontWeight: 700, fontSize: 14,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}>
              ⚡ Upgrade to Pro Plus — $4.99/month
            </button>
          )}
        </div>

        {/* 탭 */}
        <div style={{ display: "flex", gap: 4, padding: "20px 24px 0" }}>
          {(["profile", "routes"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, padding: "8px 12px", borderRadius: 10, border: "none",
              background: tab === t ? "rgba(255,255,255,0.1)" : "transparent",
              color: tab === t ? "white" : "#64748b",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}>
              {t === "profile" ? "👤 Profile" : "📍 Saved Routes"}
            </button>
          ))}
        </div>

        {/* 탭 컨텐츠 */}
        <div style={{ padding: "16px 24px 24px" }}>

          {/* 프로필 탭 */}
          {tab === "profile" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{
                background: "rgba(255,255,255,0.04)", borderRadius: 12,
                padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748b", fontSize: 12 }}>Email</span>
                  <span style={{ color: "white", fontSize: 12, fontWeight: 600 }}>{user.email}</span>
                </div>
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 8, display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748b", fontSize: 12 }}>Plan</span>
                  <span style={{ color: isPro ? "#fbbf24" : "#64748b", fontSize: 12, fontWeight: 700 }}>
                    {isPro ? "⚡ Pro Plus" : "Free"}
                  </span>
                </div>
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 8, display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748b", fontSize: 12 }}>Saved Routes</span>
                  <span style={{ color: "white", fontSize: 12, fontWeight: 600 }}>{savedRoutes.length}</span>
                </div>
              </div>

              <button onClick={async () => { await logOut(); onClose(); }} style={{
                width: "100%", padding: "12px", borderRadius: 12,
                background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
                color: "#ef4444", fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}>
                Sign out
              </button>
            </div>
          )}

          {/* 저장된 경로 탭 */}
          {tab === "routes" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {!isPro && (
                <div style={{
                  background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)",
                  borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "#fbbf24", textAlign: "center",
                }}>
                  🔒 Save routes with Pro Plus
                </div>
              )}
              {savedRoutes.length === 0 ? (
                <div style={{ textAlign: "center", padding: "32px 0", color: "#64748b", fontSize: 13 }}>
                  No saved routes yet.<br />
                  <span style={{ fontSize: 11, marginTop: 4, display: "block" }}>Plan a route and tap ⭐ Save Route</span>
                </div>
              ) : (
                savedRoutes.map(route => (
                  <div key={route.id} style={{
                    background: "rgba(255,255,255,0.04)", borderRadius: 12,
                    padding: "12px 14px", display: "flex", alignItems: "center", gap: 10,
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: "white", fontSize: 13, fontWeight: 600 }}>
                        {route.origin} → {route.destination}
                      </div>
                      <div style={{ color: "#64748b", fontSize: 11, marginTop: 2 }}>
                        {new Date(route.savedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <button onClick={() => { onLoadRoute?.(route.origin, route.destination); onClose(); }} style={{
                      padding: "6px 12px", borderRadius: 8, border: "none",
                      background: "linear-gradient(135deg, #059669, #10b981)",
                      color: "white", fontSize: 11, fontWeight: 700, cursor: "pointer",
                    }}>Load</button>
                    <button onClick={() => onDeleteRoute?.(route.id)} style={{
                      padding: "6px 10px", borderRadius: 8, border: "none",
                      background: "rgba(239,68,68,0.15)",
                      color: "#ef4444", fontSize: 11, cursor: "pointer",
                    }}>✕</button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
