import { NextResponse } from "next/server";
import { verifyKitAuth } from "@/lib/kit-auth";
import { checkoutRequestSchema } from "@/lib/api-schemas";
import { createCheckout } from "@/lib/checkout";
import { createServiceClient } from "@/lib/supabase/server";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const auth = await verifyKitAuth(request);
  if (!auth)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip = clientIp(request.headers);
  const allowed = await rateLimit(
    await createServiceClient(),
    `checkout:${auth.kitSlug}:${ip}`,
    60,
    60,
  );
  if (!allowed)
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const body = await request.json().catch(() => null);
  const parsed = checkoutRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 },
    );
  }

  const result = await createCheckout({
    vendorId: parsed.data.vendor_id,
    kitSlug: auth.kitSlug,
    orderRef: parsed.data.order_ref,
    amountCents: parsed.data.amount_cents,
  });
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  if (result.type === "qr") {
    return NextResponse.json({
      type: "qr",
      transaction_id: result.transaction_id,
      payload: result.payload,
    });
  }
  if (result.type === "link") {
    return NextResponse.json({
      type: "link",
      transaction_id: result.transaction_id,
      url: result.url,
      label: result.label,
    });
  }
  return NextResponse.json({
    type: "image",
    transaction_id: result.transaction_id,
    url: result.url,
  });
}
