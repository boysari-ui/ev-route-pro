"use client";

import { useState } from "react";
import {
  GoogleMap,
  useLoadScript,
  DirectionsRenderer,
  Marker,
  InfoWindow,
} from "@react-google-maps/api";

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";



function decodePolyline(encoded: string) {
  let points = [];
  let index = 0, lat = 0, lng = 0;

  while (index < encoded.length) {
    let b, shift = 0, result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lat += ((result & 1) ? ~(result >> 1) : (result >> 1));

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lng += ((result & 1) ? ~(result >> 1) : (result >> 1));

    points.push({
      lat: lat / 1e5,
      lng: lng / 1e5
    });
  }

  return points;
}


const containerStyle = { width: "100%", height: "600px" };
const center = { lat: -37.8136, lng: 144.9631 };

interface EVModel {
  name: string;
  batteryKWh: number;
  whPerKm: number;
}

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

interface ChargePoint {
  id: number;
  lat: number;
  lng: number;
  title: string;
  type: string;
  cost?: string;
  speed?: string;
  address?: string;
  isUsedAsWaypoint?: boolean;
  batteryAfterReach?: number;
  estimatedChargeTime?: number; // 분 단위
}



export default function Map() {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
  });

  const [directions, setDirections] = useState<any>(null);
  const [origin, setOrigin] = useState<string>("");
  const [destination, setDestination] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<EVModel>(EV_MODELS[0]);
  const [startBattery, setStartBattery] = useState<number>(80);
  const [resultText, setResultText] = useState<string>("");
  const [stations, setStations] = useState<ChargePoint[]>([]);
  const [selectedStation, setSelectedStation] = useState<ChargePoint | null>(null);

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
            d.Title?.toLowerCase().includes("supercharger") 
            ? "Supercharger" : "Standard",
      cost: d.UsageCost || "N/A",
      speed: d.Connections?.[0]?.Level?.Title || "N/A",
      address: d.AddressInfo.AddressLine1 || "",
      isUsedAsWaypoint: false,
      batteryAfterReach: undefined,
      estimatedChargeTime: undefined,
    }));
  };

  const computeDistanceKm = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const calculateChargeTime = (station: ChargePoint, batteryLeft: number, batteryKWh: number) => {
    // 단순 계산: 슈퍼차저 150kW, 일반 50kW
    const chargePower = station.type === "Supercharger" ? 150 : 50;
    const kWhNeeded = batteryKWh * (100 - batteryLeft) / 100;
    return (kWhNeeded / chargePower) * 60; // 분 단위
  };
function scoreStation(
  s: ChargePoint,
  detourKm: number
): number {
  let score = 0;

function minDistanceToRoute(
  station: ChargePoint,
  routePoints: {lat:number,lng:number}[]
) {
  let min = Infinity;

  for (const p of routePoints) {
    const d = computeDistanceKm(
      station.lat,
      station.lng,
      p.lat,
      p.lng
    );
    if (d < min) min = d;
  }

  return min;
}

  // ⚡ 속도
  if (s.type === "Supercharger") score += 50;
  else if (s.speed?.includes("150")) score += 40;
  else if (s.speed?.toLowerCase().includes("fast")) score += 25;
  else score += 10;

  // 💰 비용
  if (s.cost?.toLowerCase().includes("free")) score += 30;
  else if (s.cost && s.cost !== "N/A") score += 15;
  else score += 5;

  // 🔋 도착 배터리 안정성
  if (s.batteryAfterReach !== undefined) {
    if (s.batteryAfterReach >= 15 && s.batteryAfterReach <= 30) score += 20;
    else if (s.batteryAfterReach >= 8) score += 5;
    else score -= 30;
  }

  // 🗺️ 이탈 패널티
  score -= detourKm * 3;

  return score;
}
// 추천 충전소 자동 선택
const scored = stations.map((s: ChargePoint) => {
  const detourKm = 5; // v1 단순값 — 다음 단계에서 실제 계산
  return {
    station: s,
    score: scoreStation(s, detourKm)
  };
});

scored.sort((a, b) => b.score - a.score);

// 최고 점수 자동 waypoint
if (scored.length > 0) {
  scored[0].station.isUsedAsWaypoint = true;
}

  const handleRouteCalculation = async () => {
    if (!origin || !destination) return;
    const service = new window.google.maps.DirectionsService();
    const res = await service.route({
      origin,
      destination,
      travelMode: window.google.maps.TravelMode.DRIVING,
    });

    const routeLegs = res.routes[0].legs;
    const batteryKWh = selectedModel.batteryKWh;
    const whPerKm = selectedModel.whPerKm;
    let remainingBattery = startBattery;
    let allStations: ChargePoint[] = [];



    // 출발지 주변 충전소
    const originLatLng = routeLegs[0].start_location.toJSON();
    const originStations: ChargePoint[] = await fetchStations(originLatLng.lat, originLatLng.lng);
    originStations.forEach((s: ChargePoint) => {
      const distToStation = computeDistanceKm(originLatLng.lat, originLatLng.lng, s.lat, s.lng);
      s.batteryAfterReach = remainingBattery - (distToStation * whPerKm) / (batteryKWh * 1000) * 100;
      s.estimatedChargeTime = calculateChargeTime(s, s.batteryAfterReach!, batteryKWh);
    });
    allStations.push(...originStations);

    // 경로 중간 충전소
    for (const leg of routeLegs) {
      const legDistanceKm = (leg.distance?.value || 0) / 1000;
      const midLat = (leg.start_location.lat() + leg.end_location.lat()) / 2;
      const midLng = (leg.start_location.lng() + leg.end_location.lng()) / 2;
      const legStations: ChargePoint[] = await fetchStations(midLat, midLng);

      legStations.forEach((s: ChargePoint) => {
        const distToStation = computeDistanceKm(leg.start_location.lat(), leg.start_location.lng(), s.lat, s.lng);
        s.batteryAfterReach = remainingBattery - (distToStation * whPerKm) / (batteryKWh * 1000) * 100;
        s.estimatedChargeTime = calculateChargeTime(s, s.batteryAfterReach!, batteryKWh);
      });

      allStations.push(...legStations);
      remainingBattery -= (legDistanceKm * whPerKm) / (batteryKWh * 1000) * 100;
    }

    // 🔽 자동 추천 충전소 선택 로직 추가
const scored = allStations.map((s: ChargePoint) => {
  const detourKm = 5; // v1 임시값
  return {
    station: s,
    score: scoreStation(s, detourKm),
  };
});

scored.sort((a, b) => b.score - a.score);

if (scored.length > 0) {
  scored[0].station.isUsedAsWaypoint = true;
}

// 🔽 그 다음에 상태 저장
setStations(allStations);
setDirections(res);


    const totalKm = routeLegs.reduce((sum: number, leg: any) => sum + (leg.distance?.value || 0), 0) / 1000;
    setResultText(
      remainingBattery < 10
        ? `거리 ${totalKm.toFixed(1)}km — 남은 배터리 ${remainingBattery.toFixed(1)}% → ⚠️ 충전 필요`
        : `거리 ${totalKm.toFixed(1)}km — 남은 배터리 ${remainingBattery.toFixed(1)}%`
    );
  };

  if (!isLoaded) return <div>Loading Map...</div>;

  return (
    <div>
      <form className="mb-4 flex gap-2 flex-wrap" onSubmit={e => { e.preventDefault(); handleRouteCalculation(); }}>
        <input placeholder="출발지" value={origin} onChange={e => setOrigin(e.target.value)} className="border p-2" />
        <input placeholder="도착지" value={destination} onChange={e => setDestination(e.target.value)} className="border p-2" />
        <select
          value={selectedModel.name}
          onChange={e => setSelectedModel(EV_MODELS.find(m => m.name === e.target.value) || EV_MODELS[0])}
          className="border p-2"
        >
          {EV_MODELS.map((m, idx) => (
            <option key={idx} value={m.name}>{m.name}</option>
          ))}
        </select>
        <input type="number" placeholder="시작 배터리 %" value={startBattery} onChange={e => setStartBattery(Number(e.target.value))} className="border p-2 w-32" />
        <button type="submit" className="bg-blue-600 text-white px-4 rounded">경로 + EV 계산 + 충전소</button>

        <button
          type="button"
          className="bg-orange-600 text-white px-4 rounded ml-2"
       onClick={() => {
  const waypointStr = stations
    .filter((s: ChargePoint) => s.isUsedAsWaypoint)
    .map((s: ChargePoint) => `${s.lat},${s.lng}`)
    .join("|");

  let url = `https://www.google.com/maps/dir/?api=1&travelmode=driving`;
  url += `&origin=${encodeURIComponent(origin)}`;
  url += `&destination=${encodeURIComponent(destination)}`;

  if (waypointStr) {
    url += `&waypoints=${encodeURIComponent(waypointStr)}`;
  }

  url += `&dir_action=navigate`;

  window.open(url, "_blank");
}}



        >
          Google Maps 네비 시작
        </button>
      </form>

      {resultText && <div className="mb-3 p-3 bg-green-100 rounded">{resultText}</div>}

      <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={10}>
        {directions && <DirectionsRenderer directions={directions} />}
        {stations.map((station: ChargePoint) => (
          <Marker
            key={station.id}
            position={{ lat: station.lat, lng: station.lng }}
            title={`${station.title} (${station.type})`}
            icon={{
              url: station.isUsedAsWaypoint
                ? "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
                : station.type === "Supercharger"
                  ? "http://maps.google.com/mapfiles/ms/icons/red-dot.png"
                  : "http://maps.google.com/mapfiles/ms/icons/green-dot.png",
            }}
            onClick={() => setSelectedStation(station)}
          />
        ))}
        {selectedStation && (
          <InfoWindow position={{ lat: selectedStation.lat, lng: selectedStation.lng }} onCloseClick={() => setSelectedStation(null)}>
            <div>
              <strong>{selectedStation.title}</strong>
              <p>Type: {selectedStation.type}</p>
              <p>Speed: {selectedStation.speed}</p>
              <p>Cost: {selectedStation.cost}</p>
              <p>Address: {selectedStation.address}</p>
              {selectedStation.batteryAfterReach !== undefined && (
                <p>배터리 잔량: {selectedStation.batteryAfterReach.toFixed(1)}%</p>
              )}
              {selectedStation.estimatedChargeTime !== undefined && (
                <p>예상 충전 시간: {selectedStation.estimatedChargeTime.toFixed(0)}분</p>
              )}
              <button
                className="bg-yellow-500 text-black px-2 mt-2 rounded"
                onClick={() => {
                  const updatedStations = stations.map((s: ChargePoint) =>
                    s.id === selectedStation.id ? { ...s, isUsedAsWaypoint: true } : s
                  );
                  setStations(updatedStations);
                  alert(`${selectedStation.title}을(를) 경유지로 추가했습니다.`);
                }}
              >
                경유지로 선택
              </button>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}



