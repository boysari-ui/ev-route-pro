import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const distance = searchParams.get("distance") || "50";

  if (!lat || !lng) {
    return NextResponse.json([], { status: 400 });
  }

  try {
    const response = await fetch(
      `https://api.openchargemap.io/v3/poi/?output=json&latitude=${lat}&longitude=${lng}&distance=${distance}&maxresults=20&connectiontypeid=25,33&key=${process.env.OPEN_CHARGE_MAP_API_KEY}`
    );
    const data = await response.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("OpenChargeMap API error:", err);
    return NextResponse.json([], { status: 500 });
  }
}