import { NextRequest, NextResponse } from "next/server";

let teslaCache: { data: any[]; ts: number } | null = null;
const TESLA_TTL_MS = 86400 * 1000; // 24h

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const distance = searchParams.get("distance") || "50";

  if (!lat || !lng) {
    return NextResponse.json([], { status: 400 });
  }

  const ocmResult = await fetch(
    `https://api.openchargemap.io/v3/poi/?output=json&latitude=${lat}&longitude=${lng}&distance=${distance}&maxresults=100&key=${process.env.OPEN_CHARGE_MAP_API_KEY}`
  ).catch(() => null);

  const ocmData: any[] = ocmResult?.ok
    ? await ocmResult.json().catch(() => [])
    : [];

  // Module-level 24h cache for Tesla data (avoids Next.js fetch cache bugs in API routes)
  if (!teslaCache || Date.now() - teslaCache.ts > TESLA_TTL_MS) {
    try {
      const res = await fetch("https://supercharge.info/service/supercharge/allSites");
      if (res.ok) {
        const raw: any[] = await res.json();
        teslaCache = { data: raw, ts: Date.now() };
      }
    } catch {
      // Tesla API unavailable — keep existing cache or use empty
    }
  }

  let teslaStations: any[] = [];
  if (teslaCache) {
    try {
      const allTesla: any[] = teslaCache.data;
      teslaStations = allTesla
        .filter((site) => {
          if (site.address?.country !== "Australia") return false;
          if (site.status === "CLOSED") return false;
          const d = distanceKm(Number(lat), Number(lng), site.gps?.latitude, site.gps?.longitude);
          return d <= Number(distance);
        })
        .map((site) => ({
          ID: `tesla-${site.id}`,
          AddressInfo: {
            Latitude: site.gps.latitude,
            Longitude: site.gps.longitude,
            Title: `Tesla Supercharger - ${site.name}`,
            AddressLine1: site.address?.street || "",
            Town: site.address?.city || "",
            StateOrProvince: site.address?.state || "",
          },
          UsageType: { Title: "Tesla Supercharger" },
          OperatorInfo: { Title: "Tesla" },
          Connections: [{ Level: { Title: "DC Fast Charger" }, ConnectionType: { Title: "Tesla" }, PowerKW: site.powerKilowatt || 150, Quantity: site.stallCount || null }],
          NumberOfPoints: site.stallCount || null,
          UsageCost: "Paid (Tesla account)",
        }));
    } catch {
      // Tesla API failed — use OCM only
    }
  }

  return NextResponse.json([...ocmData, ...teslaStations]);
}
