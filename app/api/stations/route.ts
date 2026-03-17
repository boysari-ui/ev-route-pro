import { NextRequest, NextResponse } from "next/server";

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

  const [ocmResult, teslaResult] = await Promise.allSettled([
    fetch(
      `https://api.openchargemap.io/v3/poi/?output=json&latitude=${lat}&longitude=${lng}&distance=${distance}&maxresults=100&connectiontypeid=25,27,30,32,33&key=${process.env.OPEN_CHARGE_MAP_API_KEY}`
    ),
    fetch("https://supercharge.info/service/supercharge/allSites", {
      next: { revalidate: 86400 }, // cache 24h
    }),
  ]);

  const ocmData: any[] = ocmResult.status === "fulfilled" && ocmResult.value.ok
    ? await ocmResult.value.json().catch(() => [])
    : [];

  let teslaStations: any[] = [];
  if (teslaResult.status === "fulfilled" && teslaResult.value.ok) {
    try {
      const allTesla: any[] = await teslaResult.value.json();
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
          Connections: [{ Level: { Title: "DC Fast Charger" } }],
          UsageCost: "Paid (Tesla account)",
        }));
    } catch {
      // Tesla API failed — use OCM only
    }
  }

  return NextResponse.json([...ocmData, ...teslaStations]);
}
