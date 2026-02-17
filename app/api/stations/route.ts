import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  if (!lat || !lng) return NextResponse.json([], { status: 400 });

  try {
    const response = await fetch(
      `https://api.openchargemap.io/v3/poi/?output=json&latitude=${lat}&longitude=${lng}&distance=50&maxresults=10&key=a5cf13e3-aca3-4979-bcac-3f5386ebfdfb`
    );
    const data = await response.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("OpenChargeMap API error:", err);
    return NextResponse.json([], { status: 500 });
  }
}
