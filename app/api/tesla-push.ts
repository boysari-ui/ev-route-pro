// pages/api/tesla-push.ts
import type { NextApiRequest, NextApiResponse } from "next";

const TESLA_TOKEN = process.env.TESLA_BEARER_TOKEN;
const VEHICLE_ID = process.env.TESLA_VEHICLE_ID;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { lat, lng, title } = req.body;
  if (!lat || !lng) {
    return res.status(400).json({ error: "Missing latitude or longitude" });
  }

  try {
    const response = await fetch(
      `https://owner-api.teslamotors.com/api/1/vehicles/${VEHICLE_ID}/command/navigation_request`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${TESLA_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "share_ext_content_raw",
          latitude: lat,
          longitude: lng,
          title: title || "EV Route Planner",
        }),
      }
    );

    const data = await response.json();
    return res.status(200).json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
