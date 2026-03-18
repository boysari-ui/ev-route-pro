import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function getAdmin() {
  if (!getApps().length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT!);
    initializeApp({ credential: cert(serviceAccount) });
  }
  return { auth: getAuth(), db: getFirestore() };
}

const FREE_WEEKLY_LIMIT = 10;
const ANON_WEEKLY_LIMIT = 3;

// Monday of the current UTC week — resets every Monday
function getWeekKey(): string {
  const d = new Date();
  const day = d.getUTCDay();
  d.setUTCDate(d.getUTCDate() - (day === 0 ? 6 : day - 1));
  return d.toISOString().slice(0, 10);
}

export async function POST(req: NextRequest) {
  const { origin, destination, stops } = await req.json();

  if (!origin || !destination) {
    return NextResponse.json({ error: "Missing origin or destination" }, { status: 400 });
  }

  // --- Server-side rate limiting ---
  const authHeader = req.headers.get("Authorization");
  const idToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const week = getWeekKey();

  try {
    const { auth, db } = getAdmin();

    if (idToken) {
      // Authenticated user
      let decoded;
      try { decoded = await auth.verifyIdToken(idToken); } catch {
        return NextResponse.json({ error: "Invalid token" }, { status: 401 });
      }

      const userRef = db.collection("users").doc(decoded.uid);
      const userSnap = await userRef.get();
      const userData = userSnap.data() || {};

      // Pro users: unlimited
      if (!userData.isPro) {
        const usageKey = `routeUsage_${week}`;
        const count = userData[usageKey] || 0;
        if (count >= FREE_WEEKLY_LIMIT) {
          return NextResponse.json({ error: "Weekly limit reached", limitReached: true }, { status: 429 });
        }
        await userRef.set({ [usageKey]: count + 1 }, { merge: true });
      }
    } else {
      // Anonymous user — rate limit by IP
      const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
      const ipKey = `anon_${ip.replace(/\./g, "_").replace(/:/g, "_")}`;
      const ipRef = db.collection("rateLimit").doc(ipKey);
      const ipSnap = await ipRef.get();
      const ipData = ipSnap.data() || {};
      const count = ipData.week === week ? (ipData.count || 0) : 0;
      if (count >= ANON_WEEKLY_LIMIT) {
        return NextResponse.json({ error: "Weekly limit reached", limitReached: true }, { status: 429 });
      }
      await ipRef.set({ week, count: count + 1 }, { merge: true });
    }
  } catch (err) {
    // Rate limiting failure should not block the request — log and continue
    Sentry.captureException(err, { tags: { api: "route-ratelimit" } });
  }

  try {
    const waypointsParam = stops && stops.length > 0
      ? `&waypoints=${stops.map((s: string) => encodeURIComponent(s)).join("|")}`
      : "";
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}${waypointsParam}&key=${process.env.GOOGLE_MAPS_SERVER_KEY}`;

    const response = await fetch(url);
    const data = await response.json();
    return NextResponse.json(data);
  } catch (err) {
    Sentry.captureException(err, { tags: { api: "directions" }, extra: { origin, destination } });
    return NextResponse.json({ error: "Failed to fetch directions" }, { status: 500 });
  }
}
