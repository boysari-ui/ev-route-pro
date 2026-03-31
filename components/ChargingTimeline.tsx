// ─── ✨ ChargingTimeline Component ────────────────────────────────────────────

interface NearestFastCharger {
  title: string;
  address?: string;
  lat: number;
  lng: number;
  estimatedChargeTime?: number;
}

type TimelineItem = {
  type: "start" | "charge" | "waypoint" | "arrival";
  location: string;
  address?: string;
  battery: number;
  stationType?: "Fast Charger" | "Standard";
  nearestFastCharger?: NearestFastCharger;
  stopId?: string;
  estimatedChargeTime?: number;
  lat?: number;
  lng?: number;
};

export default function ChargingTimeline({
  items,
  onRemoveStop,
  onViewOnMap,
  isPro,
  onOpenPro,
  chargeTarget = 100,
  totalKm = 0,
  totalDurationSec = 0,
}: {
  items: TimelineItem[];
  onRemoveStop?: (item: TimelineItem) => void;
  onViewOnMap?: (lat: number, lng: number) => void;
  isPro?: boolean;
  onOpenPro?: () => void;
  chargeTarget?: number;
  totalKm?: number;
  totalDurationSec?: number;
}) {
  const getBatteryColor = (pct: number) => {
    if (pct >= 50) return { main: "#22c55e", glow: "rgba(34,197,94,0.35)" };
    if (pct >= 15) return { main: "#f59e0b", glow: "rgba(245,158,11,0.35)" };
    return { main: "#ef4444", glow: "rgba(239,68,68,0.35)" };
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${Math.round(minutes)} min`;
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
  };

  const config = {
    start:    { icon: "🚗", label: "DEPARTURE",     accent: "#60a5fa", glow: "rgba(96,165,250,0.3)",   bg: "rgba(59,130,246,0.08)",  border: "rgba(96,165,250,0.2)"  },
    charge:   { icon: "⚡", label: "CHARGING STOP", accent: "#fbbf24", glow: "rgba(251,191,36,0.3)",  bg: "rgba(251,191,36,0.07)",  border: "rgba(251,191,36,0.25)" },
    waypoint: { icon: "📍", label: "WAYPOINT",      accent: "#34d399", glow: "rgba(52,211,153,0.3)",  bg: "rgba(52,211,153,0.07)",  border: "rgba(52,211,153,0.2)"  },
    arrival:  { icon: "🏁", label: "ARRIVAL",       accent: "#a78bfa", glow: "rgba(167,139,250,0.3)", bg: "rgba(139,92,246,0.08)",  border: "rgba(167,139,250,0.2)" },
  };

  if (items.length === 0) return null;

  return (
    <div style={{
      maxWidth: 896, width: "100%", margin: "0 auto",
      background: "linear-gradient(160deg, #0d1117 0%, #161b27 60%, #0d1117 100%)",
      borderRadius: 24, padding: "28px 24px 24px",
      boxShadow: "0 32px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
      border: "1px solid rgba(255,255,255,0.07)", boxSizing: "border-box" as const,
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 26 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" as const }}>
          <div style={{
            background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
            borderRadius: 8, padding: "5px 11px",
            fontSize: 11, fontWeight: 800, color: "white", letterSpacing: "0.08em",
            boxShadow: "0 4px 12px rgba(16,185,129,0.35)",
          }}>TRIP PLAN</div>
          <span style={{ color: "#94a3b8", fontSize: 12 }}>
            {items.filter(i => i.type === "charge").length} charging stop{items.filter(i => i.type === "charge").length !== 1 ? "s" : ""}
          </span>
          {totalKm > 0 && (
            <span style={{ color: "#64748b", fontSize: 12 }}>·</span>
          )}
          {totalKm > 0 && (
            <span style={{ color: "#94a3b8", fontSize: 12, fontWeight: 700 }}>
              {Math.round(totalKm)} km · {formatTime(totalDurationSec / 60)}
            </span>
          )}
        </div>
        <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>
          {items.length} waypoints
        </div>
      </div>

      {/* Steps */}
      <div style={{ position: "relative" }}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const c = config[item.type];
          const batt = getBatteryColor(item.battery);
          const isFastCharger = item.stationType === "Fast Charger";

          return (
            <div key={index} style={{ display: "flex", gap: 14 }}>
              {/* Spine */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 44, flexShrink: 0 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: "50%",
                  background: `radial-gradient(circle at 35% 35%, ${c.accent}33, #1a2035)`,
                  border: `2px solid ${c.accent}`, boxShadow: `0 0 18px ${c.glow}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 20, flexShrink: 0, zIndex: 1,
                }}>{c.icon}</div>
                {!isLast && (
                  <div style={{
                    width: 2, flex: 1, minHeight: 32,
                    background: `linear-gradient(to bottom, ${c.accent}66, #1e2a3a44)`,
                    margin: "3px 0", borderRadius: 99,
                  }} />
                )}
              </div>

              {/* Card */}
              <div style={{
                flex: 1, background: c.bg, border: `1px solid ${c.border}`,
                borderRadius: 16, padding: "13px 16px", marginBottom: isLast ? 0 : 10,
                position: "relative",
              }}>
                {/* X 버튼 — 우상단 */}
                {item.type === "charge" && item.stopId && (
                  <button
                    onClick={() => onRemoveStop?.(item)}
                    title="Remove stop"
                    style={{
                      position: "absolute", top: 10, right: 10,
                      width: 22, height: 22, borderRadius: "50%",
                      background: "rgba(239,68,68,0.15)", color: "#ef4444",
                      border: "1px solid rgba(239,68,68,0.35)",
                      fontSize: 12, fontWeight: 800, lineHeight: 1,
                      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all 0.15s ease", flexShrink: 0,
                    }}
                  >✕</button>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  {/* Left */}
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", color: c.accent, textTransform: "uppercase" }}>
                        {c.label}
                      </div>
                      {item.type === "charge" && item.stationType && (
                        <div style={{
                          fontSize: 9, fontWeight: 700, letterSpacing: "0.08em",
                          padding: "2px 7px", borderRadius: 99,
                          background: isFastCharger ? "rgba(239,68,68,0.15)" : "rgba(34,197,94,0.15)",
                          color: isFastCharger ? "#ef4444" : "#22c55e",
                          border: `1px solid ${isFastCharger ? "rgba(239,68,68,0.3)" : "rgba(34,197,94,0.3)"}`,
                        }}>
                          {isFastCharger ? "⚡ FAST CHARGER" : "🔌 STANDARD"}
                        </div>
                      )}
                    </div>

                    {item.type === "charge" && (
                      <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 4, fontStyle: "italic" }}>
                        {isFastCharger
                          ? "Nearest fast charger on route · planned stop when battery reaches 20%"
                          : "Nearest charger on route · planned stop when battery reaches 20%"}
                      </div>
                    )}

                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <div style={{ whiteSpace: "normal", wordBreak: "break-word" }}>
                        <div style={{ color: "#e2e8f0", fontSize: 15, fontWeight: 600 }}>{item.location}</div>
                        {item.address && (
                          <div style={{ color: "#94a3b8", fontSize: 11, marginTop: 2 }}>{item.address}</div>
                        )}
                      </div>
                      {item.type === "charge" && item.lat && item.lng && (
                        <button
                          onClick={() => onViewOnMap?.(item.lat!, item.lng!)}
                          style={{
                            fontSize: 10, color: "#a78bfa", fontWeight: 600,
                            background: "none", border: "none", cursor: "pointer",
                            padding: 0, textDecoration: "underline", flexShrink: 0,
                          }}
                        >
                          📍 View on map
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Right: battery + charge time */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0, marginLeft: 16, paddingRight: item.type === "charge" && item.stopId ? 28 : 0 }}>
                    {/* 배터리 */}
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 24, fontWeight: 900, lineHeight: 1, color: batt.main, textShadow: `0 0 16px ${batt.glow}` }}>
                        {item.battery.toFixed(0)}<span style={{ fontSize: 13, fontWeight: 600 }}>%</span>
                      </div>
                      <div style={{ width: 56, height: 6, background: "#1e293b", borderRadius: 99, marginTop: 6, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${Math.max(0, Math.min(100, item.battery))}%`, background: batt.main, borderRadius: 99 }} />
                      </div>
                      {item.type !== "start" && (
                        <div style={{ fontSize: 9, color: "#94a3b8", marginTop: 3, fontWeight: 600, letterSpacing: "0.05em" }}>
                          {item.type === "charge" ? "ARRIVAL BATTERY" : item.type === "waypoint" ? "PASSING BATTERY" : "ESTIMATED BATTERY"}
                        </div>
                      )}
                      {item.type === "charge" && item.battery < 10 && (
                        <div style={{ fontSize: 10, color: "#f87171", marginTop: 4, fontWeight: 700, textAlign: "right" }}>
                          ⚠️ Low battery
                        </div>
                      )}
                    </div>

                    {/* 충전 소요 시간 */}
                    {item.type === "charge" && item.estimatedChargeTime !== undefined && (
                      <div style={{
                        textAlign: "center", padding: "5px 10px", borderRadius: 8,
                        background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.2)",
                      }}>
                        <div style={{ fontSize: 9, color: "#fbbf24", fontWeight: 700, letterSpacing: "0.06em" }}>CHARGE TIME</div>
                        <div style={{ fontSize: 14, color: "#fbbf24", fontWeight: 800 }}>
                          {formatTime(item.estimatedChargeTime)}
                        </div>
                        <div style={{ fontSize: 9, color: "#fbbf24", opacity: 0.7 }}>to {chargeTarget}%</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Nearest Fast Charger */}
                {item.type === "charge" && item.nearestFastCharger && (
                  isPro ? (
                    <div style={{
                      marginTop: 10, padding: "8px 12px",
                      background: "rgba(239,68,68,0.07)", borderRadius: 10,
                      border: "1px solid rgba(239,68,68,0.15)",
                    }}>
                      <div style={{ fontSize: 9, fontWeight: 800, color: "#ef4444", letterSpacing: "0.1em", marginBottom: 3 }}>
                        ⚡ NEAREST SUPERCHARGER AVAILABLE
                      </div>
                      <div style={{ fontSize: 12, color: "#e2e8f0", fontWeight: 500 }}>
                        {item.nearestFastCharger.title}
                      </div>
                      {item.nearestFastCharger.address && (
                        <div style={{ fontSize: 11, color: "#64748b", marginTop: 1 }}>
                          {item.nearestFastCharger.address}
                        </div>
                      )}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
                        {item.nearestFastCharger.estimatedChargeTime !== undefined && (
                          <div style={{ fontSize: 10, color: "#94a3b8" }}>
                            ~{formatTime(item.nearestFastCharger.estimatedChargeTime)} charge time
                          </div>
                        )}
                        <button
                          onClick={() => onViewOnMap?.(item.nearestFastCharger!.lat, item.nearestFastCharger!.lng)}
                          style={{
                            fontSize: 10, color: "#a78bfa", fontWeight: 600,
                            background: "none", border: "none", cursor: "pointer",
                            padding: 0, textDecoration: "underline",
                          }}
                        >
                          📍 View on map
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={onOpenPro}
                      style={{
                        marginTop: 10, width: "100%", padding: "8px 12px",
                        background: "rgba(239,68,68,0.07)", borderRadius: 10,
                        border: "1px solid rgba(239,68,68,0.15)",
                        cursor: "pointer", textAlign: "left",
                      }}
                    >
                      <div style={{ fontSize: 9, fontWeight: 800, color: "#ef4444", letterSpacing: "0.1em" }}>
                        ⚡ PRO PLUS: Nearest Fast Charger
                      </div>
                      <div style={{ fontSize: 10, color: "#e2e8f0", marginTop: 2 }}>
                        Upgrade to see nearby supercharger details
                      </div>
                    </button>
                  )
                )}

                {/* Charge tip */}
                {item.type === "charge" && (
                  <div style={{
                    marginTop: 8, padding: "5px 10px",
                    background: "rgba(251,191,36,0.1)", borderRadius: 8,
                    fontSize: 11, color: "#fbbf24",
                    display: "flex", alignItems: "center", gap: 6, fontWeight: 500,
                  }}>
                    ⚡ Charge to {chargeTarget}% before continuing
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Disclaimer */}
      <div style={{
        marginTop: 20, padding: "12px 14px",
        background: "rgba(255,255,255,0.03)", borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.07)",
      }}>
        <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.6 }}>
          <span style={{ fontWeight: 700, color: "#94a3b8" }}>⚠️ Before you depart:</span> Always verify charger availability before driving — charging stations may be offline, occupied, or incompatible with your vehicle.
        </div>
        <div style={{ fontSize: 10, color: "#475569", marginTop: 6, lineHeight: 1.5 }}>
          Charging station data sourced from{" "}
          <span style={{ color: "#64748b", fontWeight: 600 }}>OpenChargeMap</span> and{" "}
          <span style={{ color: "#64748b", fontWeight: 600 }}>supercharge.info</span>.
          Battery estimates are approximate and may vary based on speed, temperature, and driving conditions.
        </div>
      </div>
    </div>
  );
}
