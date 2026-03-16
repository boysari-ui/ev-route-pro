import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

export async function POST(req: NextRequest) {
  const { origin, destination, stops } = await req.json();

  if (!origin || !destination) {
    return NextResponse.json({ error: "Missing origin or destination" }, { status: 400 });
  }

  try {
    const waypointsParam = stops && stops.length > 0
      ? `&waypoints=${stops.map((s: string) => encodeURIComponent(s)).join("|")}`
      : "";
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}${waypointsParam}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();
    return NextResponse.json(data);
  } catch (err) {
    Sentry.captureException(err, { tags: { api: "directions" }, extra: { origin, destination } });
    return NextResponse.json({ error: "Failed to fetch directions" }, { status: 500 });
  }
}
