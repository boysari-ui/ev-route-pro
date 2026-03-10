"use client";
import ChargingTimeline from "./ChargingTimeline";
import RoutePlanner from "./RoutePlanner";
import StationMarkers from "./StationMarkers";
import { EVModel } from "../types/ev";
import { EV_MODELS } from "../data/evModels";
import { useState } from "react";
import ChargerFilters from "./ChargerFilters";
import {
  GoogleMap,
  useLoadScript,
  DirectionsRenderer,
  InfoWindow,
} from "@react-google-maps/api";

const containerStyle = { width: "100%", height: "calc(100vh - 180px)" };
const center = { lat: -37.8136, lng: 144.9631 };

interface NearestSupercharger {
  title: string;
  address?: string;
  lat: number;
  lng: number;
  estimatedChargeTime?: number;
}

interface TimelineItem {
  type: "start" | "charge" | "arrival";
  battery: number;
  location: string;
  lat?: number;
  lng?: number;
  stationType?: "Supercharger" | "Standard";
  nearestSupercharger?: NearestSupercharger;
  stopId?: string;
  estimatedChargeTime?: number;
}

interface ChargePoint {
  id: string;
  lat: number;
  lng: number;
  title: string;
  type: string;
  cost?: string;
  speed?: string;
  address?: string;
  isUsedAsWaypoint?: boolean;
  batteryAfterReach?: number;
  estimatedChargeTime?: number;
}

function computeDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function Map() {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries: ["places"] as any,
  });

  const [mapRef, setMapRef] = useState<google.maps.Map | null>(null);
  const [chargingTimeline, setChargingTimeline] = useState<TimelineItem[]>([]);
  const [directions, setDirections] = useState<any>(null);
  const [routePlanned, setRoutePlanned] = useState<boolean>(false);
  const [origin, setOrigin] = useState<string>("");
  const [destination, setDestination] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<EVModel | null>(null);
  const [startBattery, setStartBattery] = useState<number>(80);
  const [stations, setStations] = useState<ChargePoint[]>([]);
  const [selectedStation, setSelectedStation] = useState<ChargePoint | null>(null);
  const [stops, setStops] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [visibleTypes, setVisibleTypes] = useState<Set<string>>(
    new Set(["Selected Stop", "Supercharger", "Standard"])
  );

  const toggleType = (type: string) => {
    setVisibleTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  // 지도에서 해당 위치로 이동
  const handleViewOnMap = (lat: number, lng: number) => {
    if (mapRef) {
      mapRef.panTo({ lat, lng });
      mapRef.setZoom(14);
    }
    document.getElementById("map-section")?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchStations = async (lat: number, lng: number): Promise<ChargePoint[]> => {
    try {
      const res = await fetch(`/api/stations?lat=${lat}&lng=${lng}&distance=50`);
      const data = await res.json();
      if (!Array.isArray(data)) return [];
      return data.map((d: any) => ({
        id: String(d.ID),
        lat: d.AddressInfo.Latitude,
        lng: d.AddressInfo.Longitude,
        title: d.AddressInfo.Title || "Unknown",
        type:
          d.UsageType?.Title?.toLowerCase().includes("tesla") ||
          d.AddressInfo?.Title?.toLowerCase().includes("tesla") ||
          d.OperatorInfo?.Title?.toLowerCase().includes("tesla") ||
          d.Title?.toLowerCase().includes("supercharger")
            ? "Supercharger"
            : "Standard",
        cost: d.UsageCost || "N/A",
        speed: d.Connections?.[0]?.Level?.Title || "N/A",
        address: [
          d.AddressInfo.AddressLine1,
          d.AddressInfo.Town,
          d.AddressInfo.StateOrProvince,
          d.AddressInfo.Postcode,
        ].filter(Boolean).join(", ") || "Address not available",
        isUsedAsWaypoint: false,
      }));
    } catch {
      return [];
    }
  };

  const calculateChargeTime = (stationType: string, batteryLeft: number, batteryKWh: number) => {
    const chargePower = stationType === "Supercharger" ? 150 : 50;
    const kWhNeeded = (batteryKWh * (100 - batteryLeft)) / 100;
    return (kWhNeeded / chargePower) * 60;
  };

  const handleRemoveStop = (item: TimelineItem) => {
    if (!item.stopId) return;
    setStations(prev => prev.map(s => s.id === item.stopId ? { ...s, isUsedAsWaypoint: false } : s));
    setChargingTimeline(prev => prev.filter(i => i.stopId !== item.stopId));
  };

  const handleRouteCalculation = async () => {
    if (!origin.trim() || !destination.trim()) {
      alert("Please enter Origin and Destination.");
      return;
    }
    if (!selectedModel) {
      alert("Please select your EV model.");
      return;
    }
    if (!window.google?.maps) {
      alert("Google Maps not loaded yet.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origin, destination }),
      });

      const res = await response.json();
      if (!res.routes || res.routes.length === 0) {
        alert("No route found");
        setIsLoading(false);
        return;
      }

      new window.google.maps.DirectionsService().route(
        { origin, destination, travelMode: window.google.maps.TravelMode.DRIVING },
        (result: any, status: string) => { if (status === "OK" && result) setDirections(result); }
      );

      const routeLegs = res.routes[0].legs;
      const { batteryKWh, whPerKm } = selectedModel;
      const timeline: TimelineItem[] = [];
      timeline.push({ type: "start", battery: startBattery, location: origin });

      const KM_PER_PERCENT = (batteryKWh * 1000) / whPerKm / 100;
      const CHARGE_THRESHOLD = 20;
      const CHARGE_TARGET = 100;

      const stepCoords: { km: number; lat: number; lng: number }[] = [];
      let cumKm = 0;
      for (const leg of routeLegs) {
        for (const step of (leg as any).steps || []) {
          stepCoords.push({ km: cumKm, lat: step.start_location.lat, lng: step.start_location.lng });
          cumKm += (step.distance?.value || 0) / 1000;
        }
      }
      const totalKm = cumKm;

      let currentBattery = startBattery;
      let travelledKm = 0;
      const allStations: ChargePoint[] = [];
      const timelineChargeStops: ChargePoint[] = [];
      const fetchedCoords = new Set<string>();

      const originLatLng = { lat: routeLegs[0].start_location.lat, lng: routeLegs[0].start_location.lng };
      const originStations = await fetchStations(originLatLng.lat, originLatLng.lng);
      originStations.forEach(s => {
        const dist = computeDistanceKm(originLatLng.lat, originLatLng.lng, s.lat, s.lng);
        s.batteryAfterReach = currentBattery - (dist * whPerKm) / (batteryKWh * 1000) * 100;
        s.estimatedChargeTime = calculateChargeTime(s.type, s.batteryAfterReach!, batteryKWh);
      });
      allStations.push(...originStations);
      fetchedCoords.add(`${originLatLng.lat.toFixed(1)},${originLatLng.lng.toFixed(1)}`);

      while (true) {
        const kmUntilThreshold = (currentBattery - CHARGE_THRESHOLD) * KM_PER_PERCENT;
        const chargeAtKm = travelledKm + kmUntilThreshold;
        if (chargeAtKm >= totalKm) break;

        const pt = stepCoords.reduce((prev, curr) =>
          Math.abs(curr.km - chargeAtKm) < Math.abs(prev.km - chargeAtKm) ? curr : prev
        );

        const kmDriven = chargeAtKm - travelledKm;
        const batteryOnArrival = Math.max(0, currentBattery - kmDriven / KM_PER_PERCENT);
        const coordKey = `${pt.lat.toFixed(1)},${pt.lng.toFixed(1)}`;

        let chargeLocationName: string | null = null;
        let chargeLat = pt.lat;
        let chargeLng = pt.lng;
        let chargeStationType: "Supercharger" | "Standard" = "Standard";
        let nearestSupercharger: NearestSupercharger | undefined;

        if (!fetchedCoords.has(coordKey)) {
          fetchedCoords.add(coordKey);
          const nearbyStations = await fetchStations(pt.lat, pt.lng);

          let closestStation: ChargePoint | null = null;
          let closestDist = Infinity;
          let closestSupercharger: ChargePoint | null = null;
          let closestSuperchargerDist = Infinity;

          nearbyStations.forEach(s => {
            const dist = computeDistanceKm(pt.lat, pt.lng, s.lat, s.lng);
            if (dist < closestDist) { closestDist = dist; closestStation = s; }
            if (s.type === "Supercharger" && dist < closestSuperchargerDist) {
              closestSuperchargerDist = dist;
              closestSupercharger = s;
            }
            if (!allStations.find(e => e.id === s.id)) {
              s.batteryAfterReach = batteryOnArrival;
              s.estimatedChargeTime = calculateChargeTime(s.type, batteryOnArrival, batteryKWh);
              allStations.push(s);
            }
          });

          if (closestStation) {
            const st = closestStation as ChargePoint;
            chargeLocationName = [st.title, st.address].filter(Boolean).join(", ");
            chargeLat = st.lat;
            chargeLng = st.lng;
            chargeStationType = st.type === "Supercharger" ? "Supercharger" : "Standard";
          }

          if (closestSupercharger && chargeStationType !== "Supercharger") {
            const sc = closestSupercharger as ChargePoint;
            nearestSupercharger = {
              title: sc.title,
              address: sc.address,
              lat: sc.lat,
              lng: sc.lng,
              estimatedChargeTime: calculateChargeTime("Supercharger", batteryOnArrival, batteryKWh),
            };
          }
        } else {
          let closestStation: ChargePoint | null = null;
          let closestDist = Infinity;
          let closestSupercharger: ChargePoint | null = null;
          let closestSuperchargerDist = Infinity;

          allStations.forEach(s => {
            const dist = computeDistanceKm(pt.lat, pt.lng, s.lat, s.lng);
            if (dist < closestDist) { closestDist = dist; closestStation = s; }
            if (s.type === "Supercharger" && dist < closestSuperchargerDist) {
              closestSuperchargerDist = dist;
              closestSupercharger = s;
            }
          });
          if (closestStation) {
            const st = closestStation as ChargePoint;
            chargeLocationName = [st.title, st.address].filter(Boolean).join(", ");
            chargeLat = st.lat;
            chargeLng = st.lng;
            chargeStationType = st.type === "Supercharger" ? "Supercharger" : "Standard";
          }
          if (closestSupercharger && chargeStationType !== "Supercharger") {
            const sc = closestSupercharger as ChargePoint;
            nearestSupercharger = {
              title: sc.title,
              address: sc.address,
              lat: sc.lat,
              lng: sc.lng,
              estimatedChargeTime: calculateChargeTime("Supercharger", batteryOnArrival, batteryKWh),
            };
          }
        }

        if (!chargeLocationName) {
          chargeLocationName = `Charging Stop (${pt.lat.toFixed(2)}, ${pt.lng.toFixed(2)})`;
        }

        const stopId = `selected-stop-${timelineChargeStops.length}`;
        const chargeTime = calculateChargeTime(chargeStationType, batteryOnArrival, batteryKWh);

        timeline.push({
          type: "charge",
          battery: batteryOnArrival,
          location: chargeLocationName,
          lat: chargeLat,
          lng: chargeLng,
          stationType: chargeStationType,
          nearestSupercharger,
          stopId,
          estimatedChargeTime: chargeTime,
        });

        const stopMarker: ChargePoint = {
          id: stopId,
          lat: chargeLat,
          lng: chargeLng,
          title: chargeLocationName,
          type: "Selected Stop",
          address: chargeLocationName,
          isUsedAsWaypoint: true,
          batteryAfterReach: batteryOnArrival,
          estimatedChargeTime: chargeTime,
        };
        timelineChargeStops.push(stopMarker);

        currentBattery = CHARGE_TARGET;
        travelledKm = chargeAtKm;
      }

      const kmLeft = totalKm - travelledKm;
      const remainingBattery = Math.max(0, currentBattery - kmLeft / KM_PER_PERCENT);
      timeline.push({ type: "arrival", battery: remainingBattery, location: destination });
      setChargingTimeline(timeline);
      setStations([...allStations, ...timelineChargeStops]);
      setRoutePlanned(true);

    } catch (err) {
      console.error(err);
      alert("Error calculating route.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isLoaded) return <div>Loading Map...</div>;

  return (
    <div>
      {/* 로딩 오버레이 */}
      {isLoading && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "rgba(0,0,0,0.6)",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          backdropFilter: "blur(4px)",
        }}>
          <div style={{
            background: "linear-gradient(160deg, #0d1117, #161b27)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 20, padding: "36px 48px",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
            boxShadow: "0 32px 64px rgba(0,0,0,0.5)",
          }}>
            <div style={{
              width: 52, height: 52,
              border: "4px solid rgba(16,185,129,0.2)",
              borderTop: "4px solid #10b981",
              borderRadius: "50%",
              animation: "spin 0.9s linear infinite",
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <div style={{ color: "#e2e8f0", fontSize: 16, fontWeight: 600 }}>Calculating your route...</div>
            <div style={{ color: "#475569", fontSize: 12 }}>Finding charging stops along the way</div>
          </div>
        </div>
      )}

      {/* 배너 */}
      <div className="bg-linear-to-r from-emerald-600 to-green-500 text-white p-6 text-center pb-10">
        <h1 className="text-3xl font-bold">⚡ EV Route Pro</h1>
        <p className="mt-2 text-lg">Smart EV trip planner for Australia</p>
        <p className="text-sm mt-1 text-green-100">Plan your drive. Optimize charging. Arrive stress-free.</p>
        <button
          onClick={() => document.getElementById("planner-form")?.scrollIntoView({ behavior: "smooth" })}
          className="mt-4 bg-white text-emerald-600 font-semibold px-6 py-2 rounded-lg shadow hover:bg-gray-100 transition"
        >
          Start Planning
        </button>
      </div>

      {/* 폼 */}
      <div className="px-4 -mt-6 mb-4">
        <RoutePlanner
          origin={origin} setOrigin={setOrigin}
          destination={destination} setDestination={setDestination}
          selectedModel={selectedModel} setSelectedModel={setSelectedModel}
          startBattery={startBattery} setStartBattery={setStartBattery}
          EV_MODELS={EV_MODELS}
          handleRouteCalculation={handleRouteCalculation}
          stops={stops} setStops={setStops}
          directions={directions} stations={stations}
        />
      </div>

      {/* 트립플랜 + 지도 */}
      {routePlanned && (
        <>
          <div className="px-4 mb-4">
            <ChargingTimeline
              items={chargingTimeline}
              onRemoveStop={handleRemoveStop}
              onViewOnMap={handleViewOnMap}
            />
          </div>

          <div id="map-section" className="max-w-4xl mx-auto px-4 pb-8">
            <div className="relative" style={{ borderRadius: 20, overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
              <GoogleMap
                mapContainerStyle={containerStyle}
                center={center}
                zoom={10}
                onLoad={(map) => setMapRef(map)}
                options={{ disableDefaultUI: true }}
              >
                {directions && <DirectionsRenderer directions={directions} />}
                <ChargerFilters visibleTypes={visibleTypes} toggleType={toggleType} />
                <StationMarkers
                  stations={stations.map(s => ({ ...s, isUsedAsWaypoint: s.isUsedAsWaypoint ?? false }))}
                  setSelectedStation={setSelectedStation}
                  visibleTypes={visibleTypes}
                />

                {selectedStation && (
                  <InfoWindow
                    position={{ lat: selectedStation.lat, lng: selectedStation.lng }}
                    onCloseClick={() => setSelectedStation(null)}
                  >
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
                              // 같은 위치의 스탑이 이미 트립플랜에 있으면 추가 안 함
                              const alreadyInTimeline = chargingTimeline.some(i =>
                                i.type === "charge" && i.lat === selectedStation.lat && i.lng === selectedStation.lng
                              );
                              if (alreadyInTimeline) return;
                              const u = stations.map(s => s.id === selectedStation.id ? { ...s, isUsedAsWaypoint: true } : s);
                              setStations(u);
                              setSelectedStation({ ...selectedStation, isUsedAsWaypoint: true });
                              setChargingTimeline(prev => {
                                const arrivalIdx = prev.findIndex(i => i.type === "arrival");
                                const newStop: TimelineItem = {
                                  type: "charge",
                                  battery: selectedStation.batteryAfterReach ?? 20,
                                  location: [selectedStation.title, selectedStation.address].filter(Boolean).join(", "),
                                  stationType: selectedStation.type === "Supercharger" ? "Supercharger" : "Standard",
                                  estimatedChargeTime: selectedStation.estimatedChargeTime,
                                  stopId: selectedStation.id,
                                  lat: selectedStation.lat,
                                  lng: selectedStation.lng,
                                };
                                if (arrivalIdx === -1) return [...prev, newStop];
                                const next = [...prev]; next.splice(arrivalIdx, 0, newStop); return next;
                              });
                            }}>Add as Charging stop</button>
                        ) : (
                          <button className="bg-gray-300 text-black px-3 py-2 rounded-lg text-sm hover:bg-gray-400 transition"
                            onClick={() => {
                              const u = stations.map(s => s.id === selectedStation.id ? { ...s, isUsedAsWaypoint: false } : s);
                              setStations(u);
                              setSelectedStation({ ...selectedStation, isUsedAsWaypoint: false });
                              // stopId 또는 같은 위치로 제거
                              setChargingTimeline(prev => prev.filter(i =>
                                !(i.stopId === selectedStation.id || (i.lat === selectedStation.lat && i.lng === selectedStation.lng))
                              ));
                            }}>Remove Charging stop</button>
                        )}
                      </div>
                    </div>
                  </InfoWindow>
                )}
              </GoogleMap>

              <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
                <button onClick={() => mapRef?.setZoom((mapRef.getZoom() || 10) + 1)}
                  className="bg-white shadow-md w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold hover:scale-105 transition">+</button>
                <button onClick={() => mapRef?.setZoom((mapRef.getZoom() || 10) - 1)}
                  className="bg-white shadow-md w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold hover:scale-105 transition">−</button>
              </div>

              <div className="absolute top-40 left-3 z-20">
                <button
                  onClick={() => {
                    const waypointStr = stations.filter(s => s.isUsedAsWaypoint).map(s => `${s.lat},${s.lng}`).join("|");
                    let url = `https://www.google.com/maps/dir/?api=1&travelmode=driving&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`;
                    if (waypointStr) url += `&waypoints=${encodeURIComponent(waypointStr)}`;
                    window.open(url, "_blank");
                  }}
                  className="bg-white shadow-lg px-4 py-2 rounded-full flex items-center gap-2 font-medium hover:scale-105 transition"
                >📍 Open in Maps</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
