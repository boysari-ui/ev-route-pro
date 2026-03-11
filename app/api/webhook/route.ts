import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Firebase Admin 초기화 (서버 전용)
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

const db = getFirestore();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-02-25.clover" });

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  switch (event.type) {
    // 결제 성공 → Firestore에 isPro: true 저장
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const uid = session.metadata?.uid;
      if (uid) {
        await db.collection("users").doc(uid).set({
          isPro: true,
          stripeCustomerId: session.customer,
          proSince: new Date().toISOString(),
        }, { merge: true });
        console.log("✅ Pro activated:", uid);
      }
      break;
    }
    // 구독 취소 → isPro: false
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const snapshot = await db.collection("users")
        .where("stripeCustomerId", "==", sub.customer).limit(1).get();
      if (!snapshot.empty) {
        await snapshot.docs[0].ref.update({ isPro: false });
        console.log("❌ Pro cancelled");
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
