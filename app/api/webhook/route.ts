import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

function getDb() {
  if (!getApps().length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT!);
    initializeApp({ credential: cert(serviceAccount) });
  }
  return getFirestore();
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  try {
    const db = getDb();

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const uid = session.metadata?.uid;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        if (uid) {
          await db.collection("users").doc(uid).set({
            isPro: true,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            proSince: new Date().toISOString(),
          }, { merge: true });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        const snapshot = await db.collection("users")
          .where("stripeCustomerId", "==", customerId).get();
        if (!snapshot.empty) {
          await snapshot.docs[0].ref.update({ isPro: false });
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        const snapshot = await db.collection("users")
          .where("stripeCustomerId", "==", customerId).get();
        if (!snapshot.empty) {
          await snapshot.docs[0].ref.update({ isPro: false });
        }
        break;
      }
    }
  } catch (err: any) {
    // Return 500 so Stripe retries the webhook
    return NextResponse.json({ error: "Internal error processing webhook" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
