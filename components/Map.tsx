"use client";
import AuthBar from "./AuthBar";
import AuthModal from "./AuthModal";
import ProUpgradeModal from "./ProUpgradeModal";
import ProfilePage from "./ProfilePage";
import { useAuth } from "./useAuth";
import ChargingTimeline from "./ChargingTimeline";
import RoutePlanner from "./RoutePlanner";
import StationMarkers from "./StationMarkers";
import { EVModel } from "../types/ev";
import { EV_MODELS } from "../data/evModels";
import { useState, useEffect } from "react";
import ChargerFilters from "./ChargerFilters";
import Link from "next/link";
import { trackRouteCalculated, trackChargerClick, trackNavigationStart, trackMapLoaded } from "../lib/analytics";
import * as Sentry from "@sentry/nextjs";
import {
  GoogleMap,
  useLoadScript,
  DirectionsRenderer,
  InfoWindow,
} from "@react-google-maps/api";

const containerStyle = { width: "100%", height: "calc(100vh - 180px)" };
const LIBRARIES: ("places" | "marker" | "geometry")[] = ["places", "marker"];
const center = { lat: -37.8136, lng: 144.9631 };

interface NearestSupercharger {
  title: string;
  address?: string;
  lat: number;
  lng: number;
  estimatedChargeTime?: number;
}

interface TimelineItem {
  type: "start" | "charge" | "waypoint" | "arrival";
  battery: number;
  location: string;
  address?: string;
  lat?: number;
  lng?: number;
  stationType?: "Supercharger" | "Standard";
  nearestSupercharger?: NearestSupercharger;
  stopId?: string;
  estimatedChargeTime?: number;
  routeKm?: number; // exact km along route — set during initial calculation
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
  chargerType?: "Supercharger" | "Standard"; // preserved original type for Selected Stop markers
  routeKm?: number; // exact km along route for accurate recalc
}

interface SavedRoute {
  id: string;
  origin: string;
  destination: string;
  model: string;
  battery: number;
  savedAt: string;
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
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
    libraries: LIBRARIES,
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
  const [routeStepCoords, setRouteStepCoords] = useState<{ km: number; lat: number; lng: number }[]>([]);
  const [routeTotalKm, setRouteTotalKm] = useState<number>(0);
  const [selectedStation, setSelectedStation] = useState<ChargePoint | null>(null);
  const [stops, setStops] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signup");
  const [showPro, setShowPro] = useState(false);
  const [proLimitReached, setProLimitReached] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [pendingSharedRoute, setPendingSharedRoute] = useState<{from: string, to: string} | null>(null);
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>([]);

  const { user, isPro, refreshPro } = useAuth();
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const openAuth = (mode: "signin" | "signup") => { setAuthMode(mode); setShowAuth(true); setModalOpen(true); };
  const closeAuth = () => { setShowAuth(false); setModalOpen(false); };
  const openPro = (limitReached = false) => { setProLimitReached(limitReached); setShowPro(true); setModalOpen(true); };
  const closePro = () => { setShowPro(false); setProLimitReached(false); setModalOpen(false); };
  const openProfile = () => { setShowProfile(true); setModalOpen(true); };
  const closeProfile = () => { setShowProfile(false); setModalOpen(false); };

  const [visibleTypes, setVisibleTypes] = useState<Set<string>>(
    new Set(["Selected Stop"])
  );

  // 저장된 경로 불러오기
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("ev_saved_routes") || "[]");
    setSavedRoutes(stored);
  }, []);

  // 맵 진입 시 Pro 상태 갱신 - user 확인 후 폴링 시작
  useEffect(() => {
    if (user) refreshPro();
  }, [user]);

  // 공유 URL 파라미터 읽기
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromParam = params.get("from");
    const toParam = params.get("to");
    const modelParam = params.get("model");
    const batteryParam = params.get("battery");
    if (fromParam && toParam) {
      setOrigin(fromParam);
      setDestination(toParam);
      if (batteryParam) setStartBattery(Number(batteryParam));
      if (modelParam) {
        const found = EV_MODELS.find(m => m.name === modelParam);
        if (found) setSelectedModel(found);
      }
      setPendingSharedRoute({ from: fromParam, to: toParam });
    }
  }, []);

  // Maps 로드 완료 후 공유 경로 자동 계산
  useEffect(() => {
    if (isLoaded && pendingSharedRoute) {
      setTimeout(() => {
        handleRouteCalculation();
        setPendingSharedRoute(null);
      }, 500);
    }
  }, [isLoaded, pendingSharedRoute]);

  const toggleType = (type: string) => {
    setVisibleTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const handleViewOnMap = (lat: number, lng: number) => {
    if (mapRef) {
      mapRef.panTo({ lat, lng });
      mapRef.setZoom(14);
    }
    document.getElementById("map-section")?.scrollIntoView({ behavior: "smooth" });
  };

  // 경로 저장
  const handleSaveRoute = () => {
    if (!user) { openAuth("signup"); return; }
    if (!isPro) { openPro(); return; }

    const existing: SavedRoute[] = JSON.parse(localStorage.getItem("ev_saved_routes") || "[]");
    const isDuplicate = existing.some(r => r.origin === origin && r.destination === destination && r.model === selectedModel?.name);
    if (isDuplicate) {
      alert("이미 저장된 경로예요! ✅");
      return;
    }
    const newRoute: SavedRoute = {
      id: Date.now().toString(),
      origin,
      destination,
      model: selectedModel?.name || "",
      battery: startBattery,
      savedAt: new Date().toISOString(),
    };
    const updated = [newRoute, ...existing];
    localStorage.setItem("ev_saved_routes", JSON.stringify(updated));
    setSavedRoutes(updated);
    alert("Route saved! ✅");
  };

  // 저장된 경로 불러오기
  const handleLoadRoute = (origin: string, destination: string) => {
    const route = savedRoutes.find(r => r.origin === origin && r.destination === destination);
    setOrigin(origin);
    setDestination(destination);
    if (route) {
      setStartBattery(route.battery);
      const found = EV_MODELS.find(m => m.name === route.model);
      if (found) setSelectedModel(found);
    }
    closeProfile();
    setPendingSharedRoute({ from: origin, to: destination });
  };

  // 저장된 경로 삭제
  const handleDeleteRoute = (id: string) => {
    const updated = savedRoutes.filter(r => r.id !== id);
    localStorage.setItem("ev_saved_routes", JSON.stringify(updated));
    setSavedRoutes(updated);
  };

  const fetchStations = async (lat: number, lng: number, distance = 50): Promise<ChargePoint[]> => {
    try {
      const res = await fetch(`/api/stations?lat=${lat}&lng=${lng}&distance=${distance}`);
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

  const recalcArrivalBattery = (newTimeline: TimelineItem[]) => {
    if (!selectedModel || routeTotalKm === 0) return newTimeline;
    const { batteryKWh, whPerKm } = selectedModel;
    const KM_PER_PERCENT = (batteryKWh * 1000) / whPerKm / 100;
    const CHARGE_TARGET = 100;

    const getKmForCoord = (lat: number, lng: number) => {
      if (!lat || !lng || routeStepCoords.length === 0) return routeTotalKm;
      // Project point onto each route segment and find the closest projected km
      let bestKm = routeStepCoords[0].km;
      let bestDist = Infinity;
      for (let i = 0; i < routeStepCoords.length - 1; i++) {
        const A = routeStepCoords[i];
        const B = routeStepCoords[i + 1];
        const dx = B.lat - A.lat;
        const dy = B.lng - A.lng;
        const segLenSq = dx * dx + dy * dy;
        if (segLenSq === 0) continue;
        const t = Math.max(0, Math.min(1, ((lat - A.lat) * dx + (lng - A.lng) * dy) / segLenSq));
        const projLat = A.lat + t * dx;
        const projLng = A.lng + t * dy;
        const dist = computeDistanceKm(lat, lng, projLat, projLng);
        if (dist < bestDist) {
          bestDist = dist;
          bestKm = A.km + t * (B.km - A.km);
        }
      }
      return bestKm;
    };

    const getItemKm = (item: TimelineItem) => {
      if (item.routeKm !== undefined) return item.routeKm;
      if (item.lat && item.lng) return getKmForCoord(item.lat, item.lng);
      return routeTotalKm;
    };

    // Sort: start first → charge/waypoint stops by km position → arrival last
    const startItems = newTimeline.filter(i => i.type === "start");
    const midItems = newTimeline.filter(i => i.type === "charge" || i.type === "waypoint")
      .sort((a, b) => getItemKm(a) - getItemKm(b));
    const arrivalItems = newTimeline.filter(i => i.type === "arrival");
    const sorted = [...startItems, ...midItems, ...arrivalItems];

    let battery = startBattery;
    let lastKm = 0;
    const updated = sorted.map(item => {
      if (item.type === "start") return item;
      const itemKm = getItemKm(item);
      const kmDriven = Math.max(0, itemKm - lastKm);
      battery = Math.max(0, battery - kmDriven / KM_PER_PERCENT);
      const updatedItem = { ...item, battery: parseFloat(battery.toFixed(1)) };
      if (item.type === "charge") {
        battery = CHARGE_TARGET;
        lastKm = itemKm;
      } else if (item.type === "waypoint") {
        lastKm = itemKm;
      }
      return updatedItem;
    });
    return updated;
  };

  const handleRemoveStop = (item: TimelineItem) => {
    if (!item.stopId) return;
    setStations(prev => prev.map(s => s.id === item.stopId ? { ...s, isUsedAsWaypoint: false } : s));
    setChargingTimeline(prev => {
      const filtered = prev.filter(i => i.stopId !== item.stopId);
      return recalcArrivalBattery(filtered);
    });
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
    setVisibleTypes(new Set(["Selected Stop"]));
    try {
      const idToken = user ? await user.getIdToken() : null;
      const response = await fetch("/api/route", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({ origin, destination, stops: stops.filter(Boolean) }),
      });

      if (response.status === 429) {
        setIsLoading(false);
        if (!user) {
          openAuth("signup");
        } else {
          openPro(true);
        }
        return;
      }

      const res = await response.json();
      if (!res.routes || res.routes.length === 0) {
        alert("No route found");
        setIsLoading(false);
        return;
      }

      new window.google.maps.DirectionsService().route(
        {
          origin,
          destination,
          travelMode: window.google.maps.TravelMode.DRIVING,
          waypoints: stops.filter(Boolean).map((s: string) => ({ location: s, stopover: true })),
        },
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
      setRouteStepCoords(stepCoords);
      setRouteTotalKm(totalKm);

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
        // Break if we can reach destination with at least 5% battery remaining
        const remainingKm = totalKm - travelledKm;
        if (currentBattery - remainingKm / KM_PER_PERCENT >= 5) break;

        const kmUntilThreshold = (currentBattery - CHARGE_THRESHOLD) * KM_PER_PERCENT;
        const chargeAtKm = travelledKm + kmUntilThreshold;
        if (chargeAtKm >= totalKm) break;

        // Only look at steps AHEAD of current position to prevent duplicate stops
        const forwardSteps = stepCoords.filter(s => s.km > travelledKm);
        if (forwardSteps.length === 0) break;
        const pt = forwardSteps.reduce((prev, curr) =>
          Math.abs(curr.km - chargeAtKm) < Math.abs(prev.km - chargeAtKm) ? curr : prev
        );

        const kmDriven = chargeAtKm - travelledKm;
        const batteryOnArrival = Math.max(0, currentBattery - kmDriven / KM_PER_PERCENT);
        const coordKey = `${pt.lat.toFixed(1)},${pt.lng.toFixed(1)}`;

        let chargeLocationName: string | null = null;
        let chargeStationAddress = "";
        let chargeStationSpeed: string | undefined;
        let chargeStationCost: string | undefined;
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
            const preferred = (isPro && closestSupercharger) ? closestSupercharger : closestStation;
            const st = preferred as ChargePoint;
            chargeLocationName = st.title;
            chargeStationAddress = st.address || "";
            chargeStationSpeed = st.speed;
            chargeStationCost = st.cost;
            chargeLat = st.lat;
            chargeLng = st.lng;
            chargeStationType = st.type === "Supercharger" ? "Supercharger" : "Standard";
          }

          if (!isPro && closestSupercharger && chargeStationType !== "Supercharger") {
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
            chargeLocationName = st.title;
            chargeStationAddress = st.address || "";
            chargeStationSpeed = st.speed;
            chargeStationCost = st.cost;
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
          address: chargeStationAddress,
          lat: chargeLat,
          lng: chargeLng,
          stationType: chargeStationType,
          nearestSupercharger,
          stopId,
          estimatedChargeTime: chargeTime,
          routeKm: chargeAtKm,
        });

        const stopMarker: ChargePoint = {
          id: stopId,
          lat: chargeLat,
          lng: chargeLng,
          title: chargeLocationName,
          type: "Selected Stop",
          address: chargeStationAddress,
          speed: chargeStationSpeed,
          cost: chargeStationCost,
          isUsedAsWaypoint: true,
          batteryAfterReach: batteryOnArrival,
          estimatedChargeTime: chargeTime,
          chargerType: chargeStationType,
          routeKm: chargeAtKm,
        };
        timelineChargeStops.push(stopMarker);

        currentBattery = CHARGE_TARGET;
        travelledKm = chargeAtKm;
      }

      // Fetch stations along entire route (parallel) — 60km intervals from start, 100km radius
      const gapFetchPoints: { km: number; lat: number; lng: number }[] = [];
      for (let fetchKm = 60; fetchKm < totalKm - 20; fetchKm += 60) {
        const nearPt = stepCoords.reduce((prev, curr) =>
          Math.abs(curr.km - fetchKm) < Math.abs(prev.km - fetchKm) ? curr : prev
        );
        const key = `${nearPt.lat.toFixed(1)},${nearPt.lng.toFixed(1)}`;
        if (!fetchedCoords.has(key)) {
          fetchedCoords.add(key);
          gapFetchPoints.push({ km: fetchKm, lat: nearPt.lat, lng: nearPt.lng });
        }
      }

      // Also add waypoint locations
      const validStopsForFetch = stops.filter(Boolean);
      let legKmAcc = 0;
      for (let i = 0; i < validStopsForFetch.length; i++) {
        legKmAcc += (routeLegs[i]?.distance?.value || 0) / 1000;
        const wpPt = stepCoords.reduce((prev, curr) =>
          Math.abs(curr.km - legKmAcc) < Math.abs(prev.km - legKmAcc) ? curr : prev
        );
        const wpKey = `wp-${i}`;
        if (!fetchedCoords.has(wpKey)) {
          fetchedCoords.add(wpKey);
          gapFetchPoints.push({ km: legKmAcc, lat: wpPt.lat, lng: wpPt.lng });
        }
      }

      // Fetch all in parallel
      const gapResults = await Promise.all(
        gapFetchPoints.map(pt => fetchStations(pt.lat, pt.lng, 100))
      );
      gapResults.forEach((nearbyS, idx) => {
        const pt = gapFetchPoints[idx];
        const battHere = Math.max(0, Math.min(100, startBattery - pt.km / KM_PER_PERCENT));
        nearbyS.forEach(s => {
          s.batteryAfterReach = battHere;
          s.estimatedChargeTime = calculateChargeTime(s.type, battHere, batteryKWh);
        });
        allStations.push(...nearbyS);
      });

      // Insert user waypoints at their leg-boundary km positions
      const validStops = stops.filter(Boolean);
      let legCumKm = 0;
      for (let i = 0; i < validStops.length; i++) {
        legCumKm += (routeLegs[i]?.distance?.value || 0) / 1000;
        timeline.push({ type: "waypoint", battery: 0, location: validStops[i], routeKm: legCumKm });
      }

      timeline.push({ type: "arrival", battery: 0, location: destination, routeKm: totalKm });

      // Sort and recalculate battery for all items
      const startItems2 = timeline.filter(i => i.type === "start");
      const midItems2 = timeline.filter(i => i.type === "charge" || i.type === "waypoint")
        .sort((a, b) => (a.routeKm ?? totalKm) - (b.routeKm ?? totalKm));
      const arrivalItems2 = timeline.filter(i => i.type === "arrival");
      const sortedTimeline = [...startItems2, ...midItems2, ...arrivalItems2];

      let batt = startBattery;
      let lastKm2 = 0;
      const finalTimeline = sortedTimeline.map(item => {
        if (item.type === "start") return item;
        const itemKm = item.routeKm ?? totalKm;
        const kmDriven = Math.max(0, itemKm - lastKm2);
        batt = Math.max(0, batt - kmDriven / KM_PER_PERCENT);
        const updated = { ...item, battery: parseFloat(batt.toFixed(1)) };
        if (item.type === "charge") { batt = CHARGE_TARGET; lastKm2 = itemKm; }
        else if (item.type === "waypoint") { lastKm2 = itemKm; }
        return updated;
      });

      setChargingTimeline(finalTimeline);
      // Deduplicate by id — duplicate keys cause React markers to ignore filter state changes
      const allCombined = [...allStations, ...timelineChargeStops];
      const seenIds = new Set<string>();
      const dedupedStations = allCombined.filter(s => {
        if (seenIds.has(s.id)) return false;
        seenIds.add(s.id);
        return true;
      });
      setStations(dedupedStations);
      setRoutePlanned(true);
      trackRouteCalculated({ origin, destination, stops: stops.length, model: selectedModel.name });

    } catch (err) {
      Sentry.captureException(err, { tags: { feature: "route_calculation" }, extra: { origin, destination, model: selectedModel?.name } });
      alert("Error calculating route.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isLoaded) return <div>Loading Map...</div>;

  return (
    <div style={{ position: "relative", zIndex: 0, minHeight: "100vh", background: "linear-gradient(to right, #059669, #22c55e)", display: "flex", flexDirection: "column" }}>
      {/* 모달 - 블러 밖 최상위 */}
      {showAuth && <AuthModal onClose={closeAuth} defaultMode={authMode} />}
      {showPro && <ProUpgradeModal onClose={closePro} limitReached={proLimitReached} />}
      {showProfile && (
        <ProfilePage
          onClose={closeProfile}
          onOpenPro={openPro}
          savedRoutes={savedRoutes}
          onLoadRoute={handleLoadRoute}
          onDeleteRoute={handleDeleteRoute}
        />
      )}

      {/* 상단 헤더 */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: "rgba(10,15,35,0.97)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        padding: "10px 20px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
          onClick={() => { localStorage.removeItem("ev_on_map"); window.location.reload(); }}>
          <img src="/ev-route-pro-logo.png" alt="EV Route Pro" width={36} height={36} style={{ borderRadius: 9, objectFit: "cover" }} />
          <div>
            <div style={{ fontWeight: 800, fontSize: "1.05rem", color: "white", letterSpacing: "-0.02em" }}>EV Route Pro</div>
            <div style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.6)" }}>Australia</div>
          </div>
        </div>
        <AuthBar onOpenAuth={openAuth} onOpenPro={openPro} onOpenProfile={openProfile} />
      </div>
      <div style={{ height: 52 }} />

      {/* 콘텐츠 블러 wrapper */}
      <div style={{ filter: modalOpen ? "blur(5px)" : "none", transition: "filter 0.2s", pointerEvents: modalOpen ? "none" : "auto", flex: 1, display: "flex", flexDirection: "column" }}>

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

        {/* 메인 콘텐츠 */}
        <div style={{ flex: 1 }}>

        {/* 배너 */}
        <div style={{ textAlign: "center", padding: "32px 24px 40px", fontFamily: "'Inter', system-ui, sans-serif" }}>
          <h1 style={{ color: "white", fontWeight: 800, fontSize: "clamp(2rem, 4vw, 2.8rem)", letterSpacing: "-0.03em", marginBottom: 10, lineHeight: 1.15 }}>⚡ Plan. Charge. Drive.</h1>
          <p style={{ color: "white", fontWeight: 500, fontSize: "1.15rem", marginBottom: 6, opacity: 0.95 }}>Calculate your charging stops and launch straight to Google Maps.</p>
        </div>

        {/* 폼 */}
        <div className="px-4 -mt-6 mb-4">
          <RoutePlanner
            origin={origin} setOrigin={setOrigin}
            destination={destination} setDestination={setDestination}
            selectedModel={selectedModel} setSelectedModel={setSelectedModel}
            startBattery={startBattery} setStartBattery={setStartBattery}
            EV_MODELS={isPro ? EV_MODELS : EV_MODELS.filter(m => !m.proPlus)}
            handleRouteCalculation={handleRouteCalculation}
            stops={stops} setStops={setStops}
            directions={directions} stations={stations}
            isPro={isPro} onOpenPro={openPro}
          />
        </div>

        {/* 트립플랜 + 지도 */}
        {routePlanned && (
          <>
            {/* 공유 / 저장 버튼 바 */}
            <div className="max-w-4xl mx-auto px-4 mb-3">
              <div style={{
                display: "flex", gap: 10, alignItems: "center",
                background: "white", borderRadius: 14, padding: "10px 16px",
                boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
              }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#374151", flex: 1 }}>
                  {origin} → {destination}
                </span>

                {/* 저장 버튼 */}
                <button
                  onClick={handleSaveRoute}
                  style={{
                    display: "flex", alignItems: "center", gap: 5,
                    padding: "7px 14px", borderRadius: 8, border: "none",
                    background: isPro ? "linear-gradient(135deg, #f59e0b, #fbbf24)" : "#f1f5f9",
                    color: isPro ? "#1a1a1a" : "#64748b",
                    fontSize: 12, fontWeight: 700, cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  {isPro ? "⭐ Save Route" : "🔒 Save (Pro Plus)"}
                </button>

                {/* 공유 버튼 */}
                <div style={{ position: "relative" }}>
                  <button
                    onClick={() => setShowShareMenu(!showShareMenu)}
                    style={{
                      display: "flex", alignItems: "center", gap: 5,
                      padding: "7px 14px", borderRadius: 8, border: "none",
                      background: "linear-gradient(135deg, #059669, #10b981)",
                      color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    🔗 Share
                  </button>

                  {showShareMenu && (
                    <div style={{
                      position: "absolute", top: 42, right: 0, zIndex: 300,
                      background: "white", borderRadius: 12, padding: 8,
                      boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
                      minWidth: 180, border: "1px solid #f1f5f9",
                    }}>
                      <button
                        onClick={() => {
                          const baseUrl = `${window.location.origin}?from=${encodeURIComponent(origin)}&to=${encodeURIComponent(destination)}&model=${encodeURIComponent(selectedModel?.name || "")}&battery=${startBattery}`;
                          const shareText = isPro ? baseUrl : `${baseUrl}\n\n⚡ Planned with EV Route Pro — evroutepro.com`;
                          navigator.clipboard.writeText(shareText);
                          setCopySuccess(true);
                          setTimeout(() => { setCopySuccess(false); setShowShareMenu(false); }, 2000);
                        }}
                        style={{
                          width: "100%", padding: "9px 12px", background: copySuccess ? "#f0fdf4" : "none",
                          border: "none", borderRadius: 8, cursor: "pointer",
                          fontSize: 13, fontWeight: 600, color: copySuccess ? "#059669" : "#374151",
                          textAlign: "left", display: "flex", alignItems: "center", gap: 8,
                        }}
                      >
                        {copySuccess ? "✅ Copied!" : "🔗 Copy link"}
                      </button>

                      <button
                        onClick={() => {
                          const text = `Planning my EV trip from ${origin} to ${destination} with EV Route Pro! ⚡`;
                          window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.href)}`, "_blank");
                          setShowShareMenu(false);
                        }}
                        style={{
                          width: "100%", padding: "9px 12px", background: "none",
                          border: "none", borderRadius: 8, cursor: "pointer",
                          fontSize: 13, fontWeight: 600, color: "#374151",
                          textAlign: "left", display: "flex", alignItems: "center", gap: 8,
                        }}
                      >
                        𝕏 Share on X
                      </button>

                      <button
                        onClick={() => {
                          const url = `${window.location.origin}?from=${encodeURIComponent(origin)}&to=${encodeURIComponent(destination)}&model=${encodeURIComponent(selectedModel?.name || "")}&battery=${startBattery}`;
                          window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank");
                          setShowShareMenu(false);
                        }}
                        style={{
                          width: "100%", padding: "9px 12px", background: "none",
                          border: "none", borderRadius: 8, cursor: "pointer",
                          fontSize: 13, fontWeight: 600, color: "#374151",
                          textAlign: "left", display: "flex", alignItems: "center", gap: 8,
                        }}
                      >
                        📘 Share on Facebook
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div style={{ padding: "0 16px", marginBottom: 12 }}>
              <ChargingTimeline
                items={chargingTimeline}
                onRemoveStop={handleRemoveStop}
                onViewOnMap={handleViewOnMap}
                isPro={isPro}
                onOpenPro={openPro}
              />
            </div>

            <div id="map-section" className="max-w-4xl mx-auto px-4 pb-8" style={{ display: modalOpen ? "none" : "block" }}>
              <div className="relative" style={{ borderRadius: 20, overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
                <GoogleMap
                  mapContainerStyle={containerStyle}
                  center={center}
                  zoom={10}
                  onLoad={(map) => { setMapRef(map); trackMapLoaded(); }}
                  options={{ disableDefaultUI: true }}
                >
                  {directions && <DirectionsRenderer directions={directions} />}
                  <ChargerFilters visibleTypes={visibleTypes} toggleType={toggleType} />
                  <StationMarkers
                    stations={stations.map(s => ({ ...s, isUsedAsWaypoint: s.isUsedAsWaypoint ?? false }))}
                    setSelectedStation={(s) => { if (s) trackChargerClick(s.title); setSelectedStation(s); }}
                    visibleTypes={visibleTypes}
                  />

                  {selectedStation && (
                    <InfoWindow
                      position={{ lat: selectedStation.lat, lng: selectedStation.lng }}
                      onCloseClick={() => setSelectedStation(null)}
                    >
                      <div style={{ minWidth: 220, maxWidth: 280, fontSize: 14, lineHeight: 1.6 }}>
                        {/* Off-route warning */}
                        {routePlanned && routeStepCoords.length > 0 && (() => {
                          let minDist = Infinity;
                          for (let i = 0; i < routeStepCoords.length - 1; i++) {
                            const A = routeStepCoords[i];
                            const B = routeStepCoords[i + 1];
                            const dx = B.lat - A.lat, dy = B.lng - A.lng;
                            const lenSq = dx * dx + dy * dy;
                            const t = lenSq === 0 ? 0 : Math.max(0, Math.min(1, ((selectedStation.lat - A.lat) * dx + (selectedStation.lng - A.lng) * dy) / lenSq));
                            const d = computeDistanceKm(selectedStation.lat, selectedStation.lng, A.lat + t * dx, A.lng + t * dy);
                            if (d < minDist) minDist = d;
                          }
                          if (minDist > 30) return (
                            <div style={{ background: "#fef3c7", border: "1px solid #f59e0b", borderRadius: 8, padding: "6px 10px", marginBottom: 8, fontSize: 11, color: "#92400e" }}>
                              ⚠️ This stop is ~{Math.round(minDist)}km from your route — order and battery estimates may be inaccurate
                            </div>
                          );
                          return null;
                        })()}
                        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{selectedStation.title}</div>
                        <div style={{ color: "#444", marginBottom: 2 }}>🔌 {selectedStation.type}</div>
                        {selectedStation.speed && <div style={{ color: "#444", marginBottom: 2 }}>⚡ {selectedStation.speed}</div>}
                        {selectedStation.cost && <div style={{ color: "#444", marginBottom: 2 }}>💰 {selectedStation.cost}</div>}
                        {selectedStation.address && <div style={{ color: "#444", marginBottom: 6 }}>📍 {selectedStation.address}</div>}
                        {selectedStation.batteryAfterReach !== undefined && (() => {
                          const timelineMatch = chargingTimeline.find(i =>
                            i.stopId === selectedStation.id ||
                            (i.lat === selectedStation.lat && i.lng === selectedStation.lng)
                          );
                          const displayBattery = timelineMatch ? timelineMatch.battery : selectedStation.batteryAfterReach;
                          return (
                            <div style={{ color: "#333", marginBottom: 2 }}>
                              🔋 Arrival: <strong>{displayBattery.toFixed(1)}%</strong>
                              <div style={{ fontSize: 11, color: "#888", marginTop: 1 }}>
                                Estimated battery when your route reaches this area
                              </div>
                              {!timelineMatch && (
                                <div style={{ fontSize: 11, color: "#1a73e8", marginTop: 3 }}>
                                  ℹ️ Add this stop to your trip plan for an accurate estimate
                                </div>
                              )}
                              {timelineMatch && displayBattery < 10 && (
                                <div style={{ fontSize: 11, color: "#d93025", marginTop: 3, fontWeight: 600 }}>
                                  ⚠️ Low battery — consider adding a charging stop before this point
                                </div>
                              )}
                            </div>
                          );
                        })()}
                        {selectedStation.estimatedChargeTime !== undefined && (
                          <div style={{ color: "#333", marginBottom: 10 }}>
                            ⏱ Charge to 100%: <strong>{selectedStation.estimatedChargeTime.toFixed(0)} min</strong>
                          </div>
                        )}
                        {!selectedStation.isUsedAsWaypoint ? (
                          <button
                            style={{
                              width: "100%", padding: "10px 12px", borderRadius: 10,
                              background: "#059669", color: "white", border: "none",
                              fontSize: 14, fontWeight: 700, cursor: "pointer",
                            }}
                            onClick={() => {
                              const alreadyInTimeline = chargingTimeline.some(i =>
                                i.type === "charge" && i.lat === selectedStation.lat && i.lng === selectedStation.lng
                              );
                              if (alreadyInTimeline) return;
                              const u = stations.map(s => s.id === selectedStation.id ? { ...s, isUsedAsWaypoint: true } : s);
                              setStations(u);
                              setSelectedStation({ ...selectedStation, isUsedAsWaypoint: true });
                              setChargingTimeline(prev => {
                                const newStop: TimelineItem = {
                                  type: "charge",
                                  battery: selectedStation.batteryAfterReach ?? 20,
                                  // avoid doubling address for Selected Stop markers
                                  location: selectedStation.type === "Selected Stop"
                                    ? selectedStation.title
                                    : [selectedStation.title, selectedStation.address].filter(Boolean).join(", "),
                                  // preserve original charger type (Supercharger vs Standard)
                                  stationType: selectedStation.chargerType ?? (selectedStation.type === "Supercharger" ? "Supercharger" : "Standard"),
                                  estimatedChargeTime: selectedStation.estimatedChargeTime,
                                  stopId: selectedStation.id,
                                  lat: selectedStation.lat,
                                  lng: selectedStation.lng,
                                  routeKm: selectedStation.routeKm, // preserve exact km for accurate battery recalc
                                };
                                // recalcArrivalBattery will sort stops by km position automatically
                                return recalcArrivalBattery([...prev, newStop]);
                              });
                            }}
                          >+ Add as Charging Stop</button>
                        ) : (
                          <button
                            style={{
                              width: "100%", padding: "10px 12px", borderRadius: 10,
                              background: "#e5e7eb", color: "#374151", border: "none",
                              fontSize: 14, fontWeight: 700, cursor: "pointer",
                            }}
                            onClick={() => {
                              const u = stations.map(s => s.id === selectedStation.id ? { ...s, isUsedAsWaypoint: false } : s);
                              setStations(u);
                              setSelectedStation({ ...selectedStation, isUsedAsWaypoint: false });
                              setChargingTimeline(prev => recalcArrivalBattery(prev.filter(i =>
                                !(i.stopId === selectedStation.id || (i.lat === selectedStation.lat && i.lng === selectedStation.lng))
                              )));
                            }}
                          >− Remove Charging Stop</button>
                        )}
                      </div>
                    </InfoWindow>
                  )}
                </GoogleMap>

                <div className="absolute top-4 right-4 z-20" style={{ display: "flex", flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
                  <button
                    onClick={() => {
                      trackNavigationStart();
                      const waypointStr = stations.filter(s => s.isUsedAsWaypoint).map(s => `${s.lat},${s.lng}`).join("|");
                      let url = `https://www.google.com/maps/dir/?api=1&travelmode=driving&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`;
                      if (waypointStr) url += `&waypoints=${encodeURIComponent(waypointStr)}`;
                      window.open(url, "_blank");
                    }}
                    style={{ background: "white", borderRadius: 10, border: "none", cursor: "pointer", padding: "10px 14px", fontSize: 13, fontWeight: 600, boxShadow: "0 2px 8px rgba(0,0,0,0.2)", display: "flex", alignItems: "center", gap: 6, height: 48, whiteSpace: "nowrap" }}
                  >📍 Open in Maps</button>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <button onClick={() => mapRef?.setZoom((mapRef.getZoom() || 10) + 1)}
                      style={{ width: 48, height: 48, background: "white", borderRadius: 10, border: "none", fontSize: 24, fontWeight: 700, cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                    <button onClick={() => mapRef?.setZoom((mapRef.getZoom() || 10) - 1)}
                      style={{ width: 48, height: 48, background: "white", borderRadius: 10, border: "none", fontSize: 24, fontWeight: 700, cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        </div>{/* 메인 콘텐츠 끝 */}

        <footer style={{ background:"white", borderTop:"1px solid #e5e7eb", display:"flex", flexDirection:"column", alignItems:"center", gap:12, textAlign:"center", padding:"24px 20px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:9 }}>
            <img src="/ev-route-pro-logo.png" alt="EV Route Pro" width={40} height={40} style={{ borderRadius:7, objectFit:"cover" }}/>
            <span style={{ fontWeight:800, fontSize:"0.95rem", color:"#059669" }}>EV Route Pro</span>
          </div>
          <p style={{ fontSize:"0.8rem", color:"#9ca3af", maxWidth:480, lineHeight:1.6, margin:0 }}>
            EV Route Pro is a simple EV road trip planner that helps drivers find charging stops and navigate with Google Maps.
          </p>
          <div style={{ display:"flex", gap:24 }}>
            {[["Privacy","/privacy"],["Terms","/terms"],["Contact","/contact"]].map(([label,href])=>(
              <Link key={label} href={href} style={{ fontSize:"0.8rem", color:"#9ca3af", textDecoration:"none" }}>{label}</Link>
            ))}
          </div>
        </footer>
      </div>
    </div>
  );
}
