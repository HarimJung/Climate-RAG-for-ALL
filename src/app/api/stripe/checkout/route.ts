import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';

const PRICE_MAP: Record<string, string | undefined> = {
  library: process.env.STRIPE_PRICE_LIBRARY,
  pro: process.env.STRIPE_PRICE_PRO,
  kit: process.env.STRIPE_PRICE_KIT,
};

export async function POST(req: NextRequest) {
  try {
    const { planId, userId, email } = await req.json();

    if (!planId || !PRICE_MAP[planId]) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const priceId = PRICE_MAP[planId];
    if (!priceId || priceId.startsWith('price_') === false) {
      return NextResponse.json(
        { error: 'Stripe not configured yet', planId },
        { status: 503 }
      );
    }

    const session = await getStripe().checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email,
      metadata: { userId, planId },
      success_url: `${req.nextUrl.origin}/pricing?success=true`,
      cancel_url: `${req.nextUrl.origin}/pricing?canceled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
