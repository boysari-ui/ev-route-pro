import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    const priceId = process.env.STRIPE_PRICE_ID;
    const secretKey = process.env.STRIPE_SECRET_KEY;

    console.log("Checkout attempt:", { 
      hasPriceId: !!priceId, 
      hasSecretKey: !!secretKey,
      priceId: priceId?.slice(0, 10) + "...",
      email 
    });

    if (!secretKey) {
      return NextResponse.json({ error: "Stripe secret key not configured" }, { status: 500 });
    }
    if (!priceId) {
      return NextResponse.json({ error: "Price ID not configured" }, { status: 500 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      ...(email ? { customer_email: email } : {}),
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/?cancelled=true`,
      metadata: { priceId },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
