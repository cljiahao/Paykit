import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { verifyKitAuth } from "@/lib/kit-auth";
import { checkoutRequestSchema } from "@/lib/api-schemas";
import { renderCheckout } from "@/lib/payments/adapter";
import type { VendorPaymentConfig } from "@/lib/types";

export async function POST(request: Request) {
  const auth = await verifyKitAuth(request);
  if (!auth)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = checkoutRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 },
    );
  }
  const { vendor_id, amount_cents, order_ref } = parsed.data;

  const supabase = await createServiceClient();

  const { data: config, error: configError } = await supabase
    .from("vendor_payment_config")
    .select("*")
    .eq("vendor_id", vendor_id)
    .maybeSingle();
  if (configError) {
    console.error("checkout: config read failed", configError.message);
    return NextResponse.json(
      { error: "Upstream unavailable" },
      { status: 503 },
    );
  }
  if (!config) {
    return NextResponse.json(
      { error: "vendor has no PayNow config" },
      { status: 422 },
    );
  }

  const view = renderCheckout(config as VendorPaymentConfig, {
    amountCents: amount_cents,
    orderRef: order_ref,
  });
  if (!view) {
    return NextResponse.json(
      { error: "vendor payment config is incomplete" },
      { status: 422 },
    );
  }

  // qr_payload is a generic "checkout payload" store — the QR payload for
  // type "qr", the link/image URL for "link"/"image". Column name unchanged
  // (additive-only migration), meaning generalized. See the design spec.
  const payloadValue = view.type === "qr" ? view.payload : view.url;

  const { data: inserted, error: insertError } = await supabase
    .from("transactions")
    .insert({
      vendor_id,
      kit_slug: auth.kitSlug,
      order_ref,
      amount_cents,
      qr_payload: payloadValue,
    })
    .select("id, qr_payload")
    .single();
  if (insertError || !inserted) {
    console.error("checkout: insert failed", insertError?.message);
    return NextResponse.json(
      { error: "Could not create checkout" },
      { status: 503 },
    );
  }

  if (view.type === "qr") {
    return NextResponse.json({
      type: "qr",
      transaction_id: inserted.id,
      payload: inserted.qr_payload,
    });
  }
  if (view.type === "link") {
    return NextResponse.json({
      type: "link",
      transaction_id: inserted.id,
      url: inserted.qr_payload,
      label: view.label,
    });
  }
  return NextResponse.json({
    type: "image",
    transaction_id: inserted.id,
    url: inserted.qr_payload,
  });
}
