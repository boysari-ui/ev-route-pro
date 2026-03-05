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


const containerStyle = { width: "100%", height: "calc(100vh - 180px)" };
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
  const [chargingTimeline, setChargingTimeline] = useState<any[]>([]);
  const [directions, setDirections] = useState<any>(null);
  const [origin, setOrigin] = useState<string>("");
  const [destination, setDestination] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<EVModel>(EV_MODELS[0]);
  const [startBattery, setStartBattery] = useState<number>(80);
  const [resultText, setResultText] = useState<string>("");
  const [stations, setStations] = useState<ChargePoint[]>([]);
  const [selectedStation, setSelectedStation] = useState<ChargePoint | null>(null);
  const [stops, setStops] = useState<string[]>([]);
 
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
let recommendedId: number | null = null;

if (scored.length > 0) {
  recommendedId = scored[0].station.id;
}


 const handleRouteCalculation = async () => {
   let timeline:any[] = []; 
   timeline.push({
  type: "start",
  battery: startBattery
});
  if (!origin.trim() || !destination.trim()) {
    alert("Please enter Origin and Destination.");
    return;
  }

  const cleanStops = stops
    .map((s) => s.trim())
    .filter((s) => s.length > 2);

  try {
    const service = new window.google.maps.DirectionsService();

    const res = await service.route({
      origin: origin.trim(),
      destination: destination.trim(),
      waypoints: cleanStops.map((s) => ({
        location: s,
        stopover: true,
      })),
      region: "AU",
      optimizeWaypoints: false,
      travelMode: window.google.maps.TravelMode.DRIVING,
    });

    if (!res.routes || res.routes.length === 0) {
      alert("No route found.");
      return;
    }
if (!window.google || !window.google.maps) {
  alert("Google Maps not loaded yet.");
  return;
}
    setDirections(res);

   // ✅ 여기서부터 배터리 계산

    const routeLegs = res.routes[0].legs;
    const batteryKWh = selectedModel.batteryKWh;
    const whPerKm = selectedModel.whPerKm;

    let remainingBattery = startBattery;
    let allStations: ChargePoint[] = [];

    // 여기에 기존 충전소 계산 코드 전부 넣기



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

  const batteryUsed =
    (legDistanceKm * whPerKm) / (batteryKWh * 1000) * 100;

  // 이동 전에 부족한지 체크
  if (remainingBattery - batteryUsed <= 15) {

  timeline.push({
    type: "charge",
    battery: remainingBattery
  });
    console.log("⚡ Charging before next leg");

    // 80%까지 충전했다고 가정
    remainingBattery = 80;
  }

  
  // 이동
  remainingBattery -= batteryUsed;

  // 안전장치
  if (remainingBattery < 0) {
    remainingBattery = 0;
  }
  
      const midLat = (leg.start_location.lat() + leg.end_location.lat()) / 2;
      const midLng = (leg.start_location.lng() + leg.end_location.lng()) / 2;
      const legStations: ChargePoint[] = await fetchStations(midLat, midLng);

      legStations.forEach((s: ChargePoint) => {
        const distToStation = computeDistanceKm(leg.start_location.lat(), leg.start_location.lng(), s.lat, s.lng);
        s.batteryAfterReach = remainingBattery - (distToStation * whPerKm) / (batteryKWh * 1000) * 100;
        s.estimatedChargeTime = calculateChargeTime(s, s.batteryAfterReach!, batteryKWh);
     
     
      });

      allStations.push(...legStations);
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
      remainingBattery < 15
        ? `Trip distance ${totalKm.toFixed(1)}km — Battery on arrival ${remainingBattery.toFixed(1)}% → ⚠️ Charging required`
        : `Trip distance ${totalKm.toFixed(1)}km — Battery on arrival ${remainingBattery.toFixed(1)}%`
    ); 
    timeline.push({
  type: "arrival",
  battery: remainingBattery
});

setChargingTimeline(timeline);

  } catch (err) {
    console.error(err);
    alert("Error calculating route. Please check the console for details.");          
 }
};
  

  if (!isLoaded) return <div>Loading Map...</div>;

  return (
    
    <div>
      {/* 🔥 상단 배너 */}
<div className="bg-linear-to-r from-emerald-600 to-green-500 text-white p-6 text-center mb-8">
  <h1 className="text-3xl font-bold">⚡ EV Route Pro</h1>
  <p className="mt-2 text-lg">
    Smart EV Trip Planner for Australia
  </p>
  <p className="text-sm mt-1 text-green-100">
    Plan your drive. Optimize charging. Arrive stress-free.
  </p>

  <button
    onClick={() => {
      const form = document.getElementById("planner-form");
      form?.scrollIntoView({ behavior: "smooth" });
    }}
    className="mt-4 bg-white text-emerald-600 font-semibold px-6 py-2 rounded-lg shadow hover:bg-gray-100 transition"
  >
    Start Planning
  </button>
</div>
<div className="max-w-4xl mx-auto bg-white p-4 rounded-xl shadow-lg -mt-8 relative z-10 mb-6">
      <form
  id="planner-form"
  className="mb-4 flex gap-3 flex-wrap items-center"
  onSubmit={e => { e.preventDefault(); handleRouteCalculation(); }}
>
        <input placeholder="Origin" value={origin} onChange={e => setOrigin(e.target.value)} className="flex-1 bg-gray-100 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        <button
  type="button"
  onClick={() => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  }}
  
  className="bg-white border border-gray-200 shadow-md hover:bg-gray-50 p-3 rounded-full transition hover:scale-105"
>
  <ArrowLeftRight size={20} />
</button>
        <input placeholder="Destination" value={destination} onChange={e => setDestination(e.target.value)} className="flex-1 bg-gray-100 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
      {/* 🔥 Optional Stops */}
{stops.map((stop, index) => (
  <div key={index} className="flex gap-2">
    <input
      value={stop}
      onChange={(e) => {
        const updatedStops = [...stops];
        updatedStops[index] = e.target.value;
        setStops(updatedStops);
      }}
      placeholder={`Stop ${index + 1}`}
      className="flex-1 bg-gray-100 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
    />

    <button
      type="button"
      onClick={() => {
        const updatedStops = stops.filter((_, i) => i !== index);
        setStops(updatedStops);
      }}
      className="text-red-500 font-bold px-2"
    >
      ✕
    </button>
  </div>
))}

<button
  type="button"
  onClick={() => setStops([...stops, ""])}
  className="mt-2 text-sm text-emerald-600 hover:underline"
>
  + Add Stop (Optional - city, landmark, charger)
</button> 
       <div className="flex gap-4">
        <select
          className="flex-1 bg-gray-100 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          value={selectedModel.name}
          onChange={e => setSelectedModel(EV_MODELS.find(m => m.name === e.target.value) || EV_MODELS[0])}
        
        >
          {EV_MODELS.map((m, idx) => (
            <option key={idx} value={m.name}>{m.name}</option>
          ))}
        </select>
        <input type="number" placeholder="시작 배터리 %" value={startBattery} onChange={e => setStartBattery(Number(e.target.value))} className="w-24 bg-gray-100 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
      
        </div>

        <div className="flex flex-col md:flex-row gap-4">
        <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-4 rounded-lg font-semibold transition">Plan route</button>
        {directions && (
        <button
          type="button"
          className="flex-1 border-2 border-orange-500 text-orange-500 hover:bg-orange-50 px-6 py-3 rounded-lg font-semibold transition"
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
          Open in Google Maps
        </button>)}
        </div>
      </form>
      
    </div>

      {resultText && <div className="mb-3 p-3 bg-green-100 rounded">{resultText}</div>}
<div className="relative"></div>

{/* 🔋 Charging Timeline */}
{chargingTimeline.length > 0 && (
  <div className="bg-white p-4 rounded-xl shadow mb-4">
    <h3 className="font-semibold mb-2">Trip Charging Plan</h3>

    {chargingTimeline.map((item, index) => (
      <div key={index} className="flex justify-between text-sm py-1">

        {item.type === "start" && <span>🚗 Start</span>}
        {item.type === "charge" && <span>⚡ Charging Stop</span>}
        {item.type === "arrival" && <span>🏁 Arrival</span>}

        <span>{item.battery.toFixed(1)}%</span>

      </div>
    ))}
  </div>
)}
      <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={10}>
        {directions && <DirectionsRenderer directions={directions} />}
       <div className="absolute top-4 right-4 bg-white/90 backdrop-blur p-3 rounded-xl shadow-md text-sm z-20">
  <div className="flex items-center gap-2 mb-1">
    <span className="w-3 h-3 rounded-full bg-blue-500 inline-block"></span>
    Selected Stop
  </div>
  <div className="flex items-center gap-2 mb-1">
    <span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span>
    Supercharger
  </div>
  <div className="flex items-center gap-2">
    <span className="w-3 h-3 rounded-full bg-green-500 inline-block"></span>
    Standard Charger
  </div>
</div>
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
  <InfoWindow
    position={{
      lat: selectedStation.lat,
      lng: selectedStation.lng
    }}
    onCloseClick={() => setSelectedStation(null)}
  >
    <div>
      <strong>{selectedStation.title}</strong>

      <p>Type: {selectedStation.type}</p>
      <p>Speed: {selectedStation.speed}</p>
      <p>Cost: {selectedStation.cost}</p>
      <p>Address: {selectedStation.address}</p>

      {selectedStation.batteryAfterReach !== undefined && (
        <p>
          Battery on Arrival:{" "}
          {selectedStation.batteryAfterReach.toFixed(1)}%
        </p>
      )}

      {selectedStation.estimatedChargeTime !== undefined && (
        <p>
          Estimated Charge Time:{" "}
          {selectedStation.estimatedChargeTime.toFixed(0)} min
        </p>
      )}

      <div className="flex gap-2 mt-3">
        {!selectedStation.isUsedAsWaypoint ? (
          <button
            className="bg-emerald-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-emerald-700 transition"
            onClick={() => {
  const updatedStations = stations.map((s) =>
    s.id === selectedStation.id
      ? { ...s, isUsedAsWaypoint: true }
      : s
  );

  setStations(updatedStations);

  setSelectedStation({
    ...selectedStation,
    isUsedAsWaypoint: true,
  });
}}
          >
            Add as Charging stop
          </button>
        ) : (
          <button
            className="bg-gray-300 text-black px-3 py-2 rounded-lg text-sm hover:bg-gray-400 transition"
           onClick={() => {
  const updatedStations = stations.map((s) =>
    s.id === selectedStation.id
      ? { ...s, isUsedAsWaypoint: false }
      : s
  );

  setStations(updatedStations);

  setSelectedStation({
    ...selectedStation,
    isUsedAsWaypoint: false,
  });
}}
          >
            Remove Charging stop
          </button>
        )}
      </div>
    </div>
  </InfoWindow>
)}
              </GoogleMap>
            </div>
          );
        }