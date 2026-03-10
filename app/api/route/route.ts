import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { origin, destination } = await req.json();

  if (!origin || !destination) {
    return NextResponse.json({ error: "Missing origin or destination" }, { status: 400 });
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();
    console.log("Directions API response status:", data.status);

    return NextResponse.json(data);
  } catch (err) {
    console.error("Directions API error:", err);
    return NextResponse.json({ error: "Failed to fetch directions" }, { status: 500 });
  }
}
