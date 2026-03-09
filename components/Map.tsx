"use client";

import { ArrowLeftRight } from "lucide-react";
import { useState } from "react";
import {
  GoogleMap,
  useLoadScript,
  DirectionsRenderer,
  Marker,
  InfoWindow,
} from "@react-google-maps/api";

async function getAddress(lat: number, lng: number) {
  try {
    const geocoder = new window.google.maps.Geocoder();
    const res = await geocoder.geocode({ location: { lat, lng } });
    if (res.results && res.results.length > 0) return res.results[0].formatted_address;
    return null;
  } catch (err) {
    console.log("Geocoder error", err);
    return null;
  }
}

const containerStyle = { width: "100%", height: "calc(100vh - 180px)" };
const center = { lat: -37.8136, lng: 144.9631 };

interface EVModel { name: string; batteryKWh: number; whPerKm: number; }
const EV_MODELS: EVModel[] = [
  { name: "Tesla Model 3", batteryKWh: 60, whPerKm: 160 },
  { name: "Tesla Model Y", batteryKWh: 75, whPerKm: 170 },
  { name: "Tesla Model S", batteryKWh: 100, whPerKm: 190 },
  { name: "Hyundai Ioniq 5", batteryKWh: 72.6, whPerKm: 180 },
  { name: "Kia EV6", batteryKWh: 77.4, whPerKm: 185 },
  { name: "Ford Mustang Mach-E", batteryKWh: 98.8, whPerKm: 200 },
  { name: "Volkswagen ID.4", batteryKWh: 82, whPerKm: 190 },
  { name: "Nissan Ariya", batteryKWh: 87, whPerKm: 195 },
];

interface TimelineItem { type: "start" | "charge" | "arrival"; battery: number; location: string; lat?: number; lng?: number; }

interface ChargePoint {
  id: number; lat: number; lng: number; title: string; type: string;
  cost?: string; speed?: string; address?: string;
  isUsedAsWaypoint?: boolean; batteryAfterReach?: number; estimatedChargeTime?: number;
}

function computeDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function scoreStation(s: ChargePoint, detourKm: number): number {
  let score = 0;
  if (s.type === "Supercharger") score += 50;
  else if (s.speed?.includes("150")) score += 40;
  else if (s.speed?.toLowerCase().includes("fast")) score += 25;
  else score += 10;
  if (s.cost?.toLowerCase().includes("free")) score += 30;
  else if (s.cost && s.cost !== "N/A") score += 15;
  else score += 5;
  if (s.batteryAfterReach !== undefined) {
    if (s.batteryAfterReach >= 15 && s.batteryAfterReach <= 30) score += 20;
    else if (s.batteryAfterReach >= 8) score += 5;
    else score -= 30;
  }
  score -= detourKm * 3;
  return score;
}

function findBestChargingStation(stations: ChargePoint[]): ChargePoint | null {
  let bestStation: ChargePoint | null = null;
  let bestScore = -Infinity;
  for (const s of stations) {
    if (s.batteryAfterReach === undefined) continue;
    let score = 0;
    if (s.type === "Supercharger") score += 50;
    if (s.speed?.includes("150")) score += 30;
    if (s.cost?.toLowerCase().includes("free")) score += 20;
    if (s.batteryAfterReach > 10) score += 20; else score -= 50;
    if (score > bestScore) { bestScore = score; bestStation = s; }
  }
  return bestStation;
}

// ─── ✨ ChargingTimeline Component ────────────────────────────────────────────
function ChargingTimeline({ items }: { items: TimelineItem[] }) {
  const getBatteryColor = (pct: number) => {
    if (pct >= 50) return { main: "#22c55e", glow: "rgba(34,197,94,0.35)" };
    if (pct >= 25) return { main: "#f59e0b", glow: "rgba(245,158,11,0.35)" };
    return { main: "#ef4444", glow: "rgba(239,68,68,0.35)" };
  };

  const config = {
    start:   { icon: "🚗", label: "DEPARTURE",      accent: "#60a5fa", glow: "rgba(96,165,250,0.3)",   bg: "rgba(59,130,246,0.08)",  border: "rgba(96,165,250,0.2)"  },
    charge:  { icon: "⚡", label: "CHARGING STOP",  accent: "#fbbf24", glow: "rgba(251,191,36,0.3)",  bg: "rgba(251,191,36,0.07)",  border: "rgba(251,191,36,0.25)" },
    arrival: { icon: "🏁", label: "ARRIVAL",        accent: "#a78bfa", glow: "rgba(167,139,250,0.3)", bg: "rgba(139,92,246,0.08)",  border: "rgba(167,139,250,0.2)" },
  };

  return (
    <div style={{
      maxWidth: 896,
      width: "100%",
      margin: "0 auto 28px",
      background: "linear-gradient(160deg, #0d1117 0%, #161b27 60%, #0d1117 100%)",
      borderRadius: 24,
      padding: "28px 24px 24px",
      boxShadow: "0 32px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
      border: "1px solid rgba(255,255,255,0.07)",
      boxSizing: "border-box" as const,
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 26 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
            borderRadius: 8, padding: "5px 11px",
            fontSize: 11, fontWeight: 800, color: "white", letterSpacing: "0.08em",
            boxShadow: "0 4px 12px rgba(16,185,129,0.35)",
          }}>TRIP PLAN</div>
          <span style={{ color: "#475569", fontSize: 12 }}>
            {items.filter(i => i.type === "charge").length} charging stop{items.filter(i => i.type === "charge").length !== 1 ? "s" : ""}
          </span>
        </div>
        <div style={{ fontSize: 11, color: "#334155", fontWeight: 600 }}>
          {items.length} waypoints
        </div>
      </div>

      {/* Steps */}
      <div style={{ position: "relative" }}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const c = config[item.type];
          const batt = getBatteryColor(item.battery);

          return (
            <div key={index} style={{ display: "flex", gap: 14 }}>
              {/* Spine */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 44, flexShrink: 0 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: "50%",
                  background: `radial-gradient(circle at 35% 35%, ${c.accent}33, #1a2035)`,
                  border: `2px solid ${c.accent}`,
                  boxShadow: `0 0 18px ${c.glow}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 20, flexShrink: 0, zIndex: 1,
                }}>
                  {c.icon}
                </div>
                {!isLast && (
                  <div style={{
                    width: 2, flex: 1, minHeight: 32,
                    background: `linear-gradient(to bottom, ${c.accent}66, #1e2a3a44)`,
                    margin: "3px 0",
                    borderRadius: 99,
                  }} />
                )}
              </div>

              {/* Card */}
              <div style={{
                flex: 1,
                background: c.bg,
                border: `1px solid ${c.border}`,
                borderRadius: 16,
                padding: "13px 16px",
                marginBottom: isLast ? 0 : 10,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  {/* Location info */}
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{
                      fontSize: 10, fontWeight: 800, letterSpacing: "0.12em",
                      color: c.accent, textTransform: "uppercase", marginBottom: 4,
                    }}>{c.label}</div>
                    <div style={{
                      color: "#e2e8f0", fontSize: 15, fontWeight: 600,
                      whiteSpace: "normal", wordBreak: "break-word",
                    }}>
                      {item.location}
                    </div>
                  </div>

                  {/* Battery indicator */}
                  <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 16 }}>
                    <div style={{
                      fontSize: 24, fontWeight: 900, lineHeight: 1,
                      color: batt.main,
                      textShadow: `0 0 16px ${batt.glow}`,
                    }}>
                      {item.battery.toFixed(0)}<span style={{ fontSize: 13, fontWeight: 600 }}>%</span>
                    </div>
                    {/* Mini bar */}
                    <div style={{
                      width: 56, height: 4, background: "#1e293b",
                      borderRadius: 99, marginTop: 6, overflow: "hidden",
                    }}>
                      <div style={{
                        height: "100%",
                        width: `${Math.max(0, Math.min(100, item.battery))}%`,
                        background: batt.main,
                        borderRadius: 99,
                      }} />
                    </div>
                    <div style={{ fontSize: 9, color: "#334155", marginTop: 3, fontWeight: 600, letterSpacing: "0.05em" }}>
                      BATTERY
                    </div>
                  </div>
                </div>

                {/* Charge tip */}
                {item.type === "charge" && (
                  <div style={{
                    marginTop: 10, padding: "5px 10px",
                    background: "rgba(251,191,36,0.1)", borderRadius: 8,
                    fontSize: 11, color: "#fbbf24",
                    display: "flex", alignItems: "center", gap: 6, fontWeight: 500,
                  }}>
                    ⚡ Charge to 80% before continuing
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

export default function Map() {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
  });

  const [chargingTimeline, setChargingTimeline] = useState<TimelineItem[]>([]);
  const [directions, setDirections] = useState<any>(null);
  const [origin, setOrigin] = useState<string>("");
  const [destination, setDestination] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<EVModel>(EV_MODELS[0]);
  const [startBattery, setStartBattery] = useState<number>(80);
  const [resultText, setResultText] = useState<string>("");
  const [stations, setStations] = useState<ChargePoint[]>([]);
  const [selectedStation, setSelectedStation] = useState<ChargePoint | null>(null);
  const [stops, setStops] = useState<string[]>([]);
  const [showMap, setShowMap] = useState(true);
  const [visibleTypes, setVisibleTypes] = useState<Set<string>>(new Set(["Selected Stop", "Supercharger", "Standard"]));

  const toggleType = (type: string) => {
    setVisibleTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const fetchStations = async (lat: number, lng: number): Promise<ChargePoint[]> => {
    const distanceKm = 50;
    const res = await fetch(`/api/stations?lat=${lat}&lng=${lng}&distance=${distanceKm}`);
    const data = await res.json();
    return data.map((d: any) => ({
      id: d.ID,
      lat: d.AddressInfo.Latitude,
      lng: d.AddressInfo.Longitude,
      title: d.AddressInfo.Title || "Unknown",
      type: d.UsageType?.Title?.toLowerCase().includes("tesla") ||
        d.AddressInfo?.Title?.toLowerCase().includes("tesla") ||
        d.OperatorInfo?.Title?.toLowerCase().includes("tesla") ||
        d.Title?.toLowerCase().includes("supercharger") ? "Supercharger" : "Standard",
      cost: d.UsageCost || "N/A",
      speed: d.Connections?.[0]?.Level?.Title || "N/A",
      address: [
        d.AddressInfo.AddressLine1,
        d.AddressInfo.Town,
        d.AddressInfo.StateOrProvince,
        d.AddressInfo.Postcode,
      ].filter(Boolean).join(", ") || "Address not available",
      isUsedAsWaypoint: false, batteryAfterReach: undefined, estimatedChargeTime: undefined,
    }));
  };

  const calculateChargeTime = (station: ChargePoint, batteryLeft: number, batteryKWh: number) => {
    const chargePower = station.type === "Supercharger" ? 150 : 50;
    const kWhNeeded = batteryKWh * (100 - batteryLeft) / 100;
    return (kWhNeeded / chargePower) * 60;
  };

  const handleRouteCalculation = async () => {
    if (!origin.trim() || !destination.trim()) { alert("Please enter Origin and Destination."); return; }
    if (!window.google?.maps) { alert("Google Maps not loaded yet."); return; }

    const cleanStops = stops.map(s => s.trim()).filter(s => s.length > 2);

    try {
      const service = new window.google.maps.DirectionsService();
      const res = await service.route({
        origin: origin.trim(), destination: destination.trim(),
        waypoints: cleanStops.map(s => ({ location: s, stopover: true })),
        region: "AU", optimizeWaypoints: false,
        travelMode: window.google.maps.TravelMode.DRIVING,
      });

      if (!res.routes?.length) { alert("No route found."); return; }
      setDirections(res);

      const routeLegs = res.routes[0].legs;
      const { batteryKWh, whPerKm } = selectedModel;
      const timeline: TimelineItem[] = [];
      let remainingBattery = startBattery;

      timeline.push({ type: "start", battery: startBattery, location: origin });

      // ── step 좌표 수집 ────────────────────────────────────────────
      const KM_PER_PERCENT = (batteryKWh * 1000) / whPerKm / 100;
      const CHARGE_THRESHOLD = 20;
      const CHARGE_TARGET = 80;

      const stepCoords: { km: number; lat: number; lng: number }[] = [];
      let cumKm = 0;
      for (const leg of routeLegs) {
        for (const step of (leg as any).steps || []) {
          stepCoords.push({
            km: cumKm,
            lat: step.start_location.lat(),
            lng: step.start_location.lng(),
          });
          cumKm += (step.distance?.value || 0) / 1000;
        }
      }
      const totalKm = cumKm;

      // ── 충전 지점 계산 + 각 지점 주변 충전소 fetch ────────────────
      const AU_CITIES = [
        { name: "Seymour VIC",      lat: -37.03, lng: 145.14 },
        { name: "Benalla VIC",      lat: -36.55, lng: 145.98 },
        { name: "Wangaratta VIC",   lat: -36.36, lng: 146.31 },
        { name: "Albury NSW",       lat: -36.08, lng: 146.91 },
        { name: "Holbrook NSW",     lat: -35.73, lng: 147.31 },
        { name: "Wagga Wagga NSW",  lat: -35.12, lng: 147.37 },
        { name: "Gundagai NSW",     lat: -35.06, lng: 148.10 },
        { name: "Goulburn NSW",     lat: -34.75, lng: 149.72 },
        { name: "Mittagong NSW",    lat: -34.45, lng: 150.45 },
        { name: "Campbelltown NSW", lat: -34.07, lng: 150.81 },
        { name: "Shepparton VIC",   lat: -36.38, lng: 145.40 },
        { name: "Canberra ACT",     lat: -35.28, lng: 149.13 },
      ];

      let currentBattery = startBattery;
      let travelledKm = 0;
      const allStations: ChargePoint[] = [];
      const fetchedCoords = new Set<string>();

      // 출발지 충전소
      const originLatLng = routeLegs[0].start_location.toJSON();
      const originStations = await fetchStations(originLatLng.lat, originLatLng.lng);
      originStations.forEach(s => {
        const dist = computeDistanceKm(originLatLng.lat, originLatLng.lng, s.lat, s.lng);
        s.batteryAfterReach = currentBattery - (dist * whPerKm) / (batteryKWh * 1000) * 100;
        s.estimatedChargeTime = calculateChargeTime(s, s.batteryAfterReach!, batteryKWh);
      });
      allStations.push(...originStations);
      fetchedCoords.add(`${originLatLng.lat.toFixed(1)},${originLatLng.lng.toFixed(1)}`);

      while (true) {
        const kmUntilThreshold = (currentBattery - CHARGE_THRESHOLD) * KM_PER_PERCENT;
        const chargeAtKm = travelledKm + kmUntilThreshold;
        if (chargeAtKm >= totalKm) break;

        // 해당 km의 경로 좌표
        const pt = stepCoords.reduce((prev, curr) =>
          Math.abs(curr.km - chargeAtKm) < Math.abs(prev.km - chargeAtKm) ? curr : prev
        );

        // 이 충전 지점 주변 충전소 fetch
        const coordKey = `${pt.lat.toFixed(1)},${pt.lng.toFixed(1)}`;
        let chargeLocationName: string | null = null;

        if (!fetchedCoords.has(coordKey)) {
          fetchedCoords.add(coordKey);
          const nearbyStations = await fetchStations(pt.lat, pt.lng);

          // 가장 가까운 충전소 찾기 → 그 주소를 timeline에 사용
          let closestStation: ChargePoint | null = null;
          let closestDist = Infinity;
          nearbyStations.forEach(s => {
            const dist = computeDistanceKm(pt.lat, pt.lng, s.lat, s.lng);
            if (dist < closestDist) {
              closestDist = dist;
              closestStation = s;
            }
            // 중복 제거 후 allStations에 추가
            if (!allStations.find(existing => existing.id === s.id)) {
              s.batteryAfterReach = CHARGE_THRESHOLD;
              s.estimatedChargeTime = calculateChargeTime(s, CHARGE_THRESHOLD, batteryKWh);
              allStations.push(s);
            }
          });

          if (closestStation) {
            // title + address 조합으로 정확한 주소 표시
            const st = closestStation as ChargePoint;
            chargeLocationName = [st.title, st.address].filter(Boolean).join(", ");
          }
        }

        // 충전소 주소 없으면 도시명 fallback
        if (!chargeLocationName) {
          const nearestCity = AU_CITIES.reduce((prev, curr) =>
            Math.hypot(curr.lat - pt.lat, curr.lng - pt.lng) < Math.hypot(prev.lat - pt.lat, prev.lng - pt.lng) ? curr : prev
          );
          chargeLocationName = nearestCity.name;
        }

        timeline.push({
          type: "charge",
          battery: CHARGE_THRESHOLD,
          location: chargeLocationName,
          lat: pt.lat,
          lng: pt.lng,
        });

        currentBattery = CHARGE_TARGET;
        travelledKm = chargeAtKm;
      }

      // 최종 도착 배터리
      const kmLeft = totalKm - travelledKm;
      remainingBattery = Math.max(0, currentBattery - kmLeft / KM_PER_PERCENT);

      timeline.push({ type: "arrival", battery: remainingBattery, location: destination });
      setChargingTimeline(timeline);

      // 타임라인의 충전 정거장 좌표를 파란 마커(isUsedAsWaypoint)로 지도에 표시
      const timelineChargeStops = timeline
        .filter(i => i.type === "charge" && i.lat && i.lng)
        .map((i, idx) => ({
          id: -(idx + 1), // 음수 ID로 실제 충전소와 구분
          lat: i.lat!,
          lng: i.lng!,
          title: i.location,
          type: "Timeline Stop",
          address: i.location,
          isUsedAsWaypoint: true,
          batteryAfterReach: i.battery,
        } as ChargePoint));

      // allStations에 타임라인 마커 추가 (중복 없이)
      const mergedStations = [...allStations];
      timelineChargeStops.forEach(ts => {
        if (!mergedStations.find(s => s.id === ts.id)) {
          mergedStations.push(ts);
        }
      });
      setStations(mergedStations);

    } catch (err) {
      console.error(err);
      alert("Error calculating route. Please check the console for details.");
    }
  };

  if (!isLoaded) return <div>Loading Map...</div>;

  return (
    <div>
      {/* Banner */}
      <div className="bg-linear-to-r from-emerald-600 to-green-500 text-white p-6 text-center mb-8">
        <h1 className="text-3xl font-bold">⚡ EV Route Pro</h1>
        <p className="mt-2 text-lg">Smart EV trip planner for Australia</p>
        <p className="text-sm mt-1 text-green-100">Plan your drive. Optimize charging. Arrive stress-free.</p>
        <button onClick={() => document.getElementById("planner-form")?.scrollIntoView({ behavior: "smooth" })}
          className="mt-4 bg-white text-emerald-600 font-semibold px-6 py-2 rounded-lg shadow hover:bg-gray-100 transition">
          Start Planning
        </button>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto bg-white p-4 rounded-xl shadow-lg -mt-8 relative z-10 mb-6">
        <form id="planner-form" className="mb-4 flex gap-3 flex-wrap items-center"
          onSubmit={e => { e.preventDefault(); handleRouteCalculation(); }}>
          <input placeholder="Origin" value={origin} onChange={e => setOrigin(e.target.value)}
            className="flex-1 bg-gray-100 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          <button type="button" onClick={() => { const t = origin; setOrigin(destination); setDestination(t); }}
            className="bg-white border border-gray-200 shadow-md hover:bg-gray-50 p-3 rounded-full transition hover:scale-105">
            <ArrowLeftRight size={20} />
          </button>
          <input placeholder="Destination" value={destination} onChange={e => setDestination(e.target.value)}
            className="flex-1 bg-gray-100 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />

          {stops.map((stop, index) => (
            <div key={index} className="flex gap-2 w-full">
              <input value={stop} onChange={e => { const u = [...stops]; u[index] = e.target.value; setStops(u); }}
                placeholder={`Stop ${index + 1}`}
                className="flex-1 bg-gray-100 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              <button type="button" onClick={() => setStops(stops.filter((_, i) => i !== index))}
                className="text-red-500 font-bold px-2">✕</button>
            </div>
          ))}

          <button type="button" onClick={() => setStops([...stops, ""])}
            className="mt-2 text-sm text-emerald-600 hover:underline">
            + Add Stop (Optional - city, landmark, charger)
          </button>

          <div className="flex gap-4 w-full">
            <select className="flex-1 bg-gray-100 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={selectedModel.name} onChange={e => setSelectedModel(EV_MODELS.find(m => m.name === e.target.value) || EV_MODELS[0])}>
              {EV_MODELS.map((m, idx) => <option key={idx} value={m.name}>{m.name}</option>)}
            </select>
            <input type="number" placeholder="시작 배터리 %" value={startBattery}
              onChange={e => setStartBattery(Number(e.target.value))}
              className="w-24 bg-gray-100 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>

          <div className="flex flex-col md:flex-row gap-4 w-full">
            <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-4 rounded-lg font-semibold transition">
              Plan route
            </button>
            {directions && (
              <button type="button"
                className="flex-1 border-2 border-orange-500 text-orange-500 hover:bg-orange-50 px-6 py-3 rounded-lg font-semibold transition"
                onClick={() => {
                  const waypointStr = stations.filter(s => s.isUsedAsWaypoint).map(s => `${s.lat},${s.lng}`).join("|");
                  let url = `https://www.google.com/maps/dir/?api=1&travelmode=driving&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`;
                  if (waypointStr) url += `&waypoints=${encodeURIComponent(waypointStr)}`;
                  url += `&dir_action=navigate`;
                  window.open(url, "_blank");
                }}>
                Open in Google Maps
              </button>
            )}
          </div>
        </form>
      </div>

      {resultText && <div className="mb-3 p-3 bg-green-100 rounded">{resultText}</div>}

      {/* ✨ Beautiful Charging Timeline */}
      {chargingTimeline.length > 0 && <ChargingTimeline items={chargingTimeline} />}

      {/* Map */}
      {showMap && (
        <div className="relative" style={{ borderRadius: 20, overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
          <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={10}>
            {directions && <DirectionsRenderer directions={directions} />}

            <div className="absolute top-16 left-3 flex flex-col gap-2 z-20">
              {[
                { label: "Selected Stop", color: "#3b82f6", type: "Selected Stop" },
                { label: "Supercharger",  color: "#ef4444", type: "Supercharger" },
                { label: "Standard Charger", color: "#22c55e", type: "Standard" },
              ].map(({ label, color, type }) => {
                const active = visibleTypes.has(type);
                return (
                  <button
                    key={type}
                    onClick={() => toggleType(type)}
                    style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "6px 12px",
                      borderRadius: 20,
                      border: `2px solid ${color}`,
                      background: active ? color : "rgba(255,255,255,0.92)",
                      color: active ? "white" : "#333",
                      fontSize: 12, fontWeight: 600,
                      cursor: "pointer",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                      transition: "all 0.15s ease",
                      backdropFilter: "blur(4px)",
                    }}
                  >
                    <span style={{
                      width: 10, height: 10, borderRadius: "50%",
                      background: active ? "white" : color,
                      flexShrink: 0,
                    }} />
                    {label}
                  </button>
                );
              })}
            </div>

            {stations
              .filter(station => {
                if (station.isUsedAsWaypoint) return visibleTypes.has("Selected Stop");
                if (station.type === "Supercharger") return visibleTypes.has("Supercharger");
                return visibleTypes.has("Standard");
              })
              .map(station => (
                <Marker key={station.id} position={{ lat: station.lat, lng: station.lng }}
                  title={`${station.title} (${station.type})`}
                  icon={{
                    url: station.isUsedAsWaypoint
                      ? "https://maps.google.com/mapfiles/ms/icons/blue-dot.png"
                      : station.type === "Supercharger"
                      ? "https://maps.google.com/mapfiles/ms/icons/red-dot.png"
                      : "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
                  }}
                  onClick={() => setSelectedStation(station)} />
              ))
            }

            {selectedStation && (
              <InfoWindow position={{ lat: selectedStation.lat, lng: selectedStation.lng }}
                onCloseClick={() => setSelectedStation(null)}>
                <div>
                  <strong>{selectedStation.title}</strong>
                  <p>Type: {selectedStation.type}</p>
                  <p>Speed: {selectedStation.speed}</p>
                  <p>Cost: {selectedStation.cost}</p>
                  <p>Address: {selectedStation.address}</p>
                  {selectedStation.batteryAfterReach !== undefined && (
                    <p>Battery on Arrival: {selectedStation.batteryAfterReach.toFixed(1)}%</p>
                  )}
                  {selectedStation.estimatedChargeTime !== undefined && (
                    <p>Estimated Charge Time: {selectedStation.estimatedChargeTime.toFixed(0)} min</p>
                  )}
                  <div className="flex gap-2 mt-3">
                    {!selectedStation.isUsedAsWaypoint ? (
                      <button className="bg-emerald-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-emerald-700 transition"
                        onClick={() => {
                          const u = stations.map(s => s.id === selectedStation.id ? { ...s, isUsedAsWaypoint: true } : s);
                          setStations(u);
                          setSelectedStation({ ...selectedStation, isUsedAsWaypoint: true });
                          // 타임라인에 추가: Arrival 바로 앞에 삽입
                          setChargingTimeline(prev => {
                            const arrivalIdx = prev.findIndex(i => i.type === "arrival");
                            const newStop: TimelineItem = {
                              type: "charge",
                              battery: selectedStation.batteryAfterReach ?? 20,
                              location: [selectedStation.title, selectedStation.address].filter(Boolean).join(", "),
                            };
                            if (arrivalIdx === -1) return [...prev, newStop];
                            const next = [...prev];
                            next.splice(arrivalIdx, 0, newStop);
                            return next;
                          });
                        }}>Add as Charging stop</button>
                    ) : (
                      <button className="bg-gray-300 text-black px-3 py-2 rounded-lg text-sm hover:bg-gray-400 transition"
                        onClick={() => {
                          const u = stations.map(s => s.id === selectedStation.id ? { ...s, isUsedAsWaypoint: false } : s);
                          setStations(u);
                          setSelectedStation({ ...selectedStation, isUsedAsWaypoint: false });
                          // 타임라인에서 제거: 이 충전소 title이 포함된 항목 삭제
                          setChargingTimeline(prev =>
                            prev.filter(i =>
                              !(i.type === "charge" && i.location.includes(selectedStation.title))
                            )
                          );
                        }}>Remove Charging stop</button>
                    )}
                  </div>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        </div>
      )}
    </div>
  );
}