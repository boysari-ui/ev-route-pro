import React, { JSX } from "react";
import { Marker } from "@react-google-maps/api";

interface Station {
  id: string;
  lat: number;
  lng: number;
  title: string;
  type: string;
  isUsedAsWaypoint: boolean;
}

export default function StationMarkers({
  stations,
  setSelectedStation,
  visibleTypes,
}: {
  stations: Station[];
  setSelectedStation: (station: Station) => void;
  visibleTypes: Set<string>;
}): JSX.Element {
  return (
    <>
      {stations
        .filter(station => {
          // isUsedAsWaypoint이거나 type이 "Selected Stop"이면 파란 마커
          if (station.isUsedAsWaypoint || station.type === "Selected Stop") {
            return visibleTypes.has("Selected Stop");
          }
          if (station.type === "Fast Charger") return visibleTypes.has("Fast Charger");
          return visibleTypes.has("Standard");
        })
        .map(station => (
          <Marker
            key={station.id}
            position={{ lat: station.lat, lng: station.lng }}
            title={`${station.title} (${station.type})`}
            icon={{
              url:
                station.isUsedAsWaypoint || station.type === "Selected Stop"
                  ? "https://maps.google.com/mapfiles/ms/icons/blue-dot.png"
                  : station.type === "Fast Charger"
                  ? "https://maps.google.com/mapfiles/ms/icons/red-dot.png"
                  : "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
            }}
            onClick={() => setSelectedStation(station)}
          />
        ))}
    </>
  );
}
