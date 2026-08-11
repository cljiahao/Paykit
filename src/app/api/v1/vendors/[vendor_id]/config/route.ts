import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { verifyKitAuth } from "@/lib/kit-auth";
import { uuidSchema } from "@/lib/api-schemas";
import { vendorPaymentConfigInputSchema } from "@/lib/schemas";
import type { Database } from "@/lib/types";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ vendor_id: string }> },
) {
  const auth = await verifyKitAuth(request);
  if (!auth)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { vendor_id } = await params;
  if (!uuidSchema.safeParse(vendor_id).success) {
    return NextResponse.json({ error: "Invalid vendor id" }, { status: 400 });
  }
  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("vendor_payment_config")
    .select("kind, payee_name, label")
    .eq("vendor_id", vendor_id)
    .maybeSingle();
  if (error) {
    console.error("vendor config: read failed", error.message);
    return NextResponse.json(
      { error: "Upstream unavailable" },
      { status: 503 },
    );
  }

  const display_name = data
    ? data.kind === "paynow"
      ? data.payee_name
      : data.label
    : null;

  return NextResponse.json({
    has_config: Boolean(data),
    display_name,
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ vendor_id: string }> },
) {
  const auth = await verifyKitAuth(request);
  if (!auth)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { vendor_id } = await params;
  if (!uuidSchema.safeParse(vendor_id).success) {
    return NextResponse.json({ error: "Invalid vendor id" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const parsed = vendorPaymentConfigInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 },
    );
  }

  const row: Database["paykit"]["Tables"]["vendor_payment_config"]["Insert"] =
    parsed.data.kind === "paynow"
      ? {
          vendor_id,
          kind: "paynow",
          payee_name: parsed.data.payee_name,
          uen: parsed.data.uen ?? null,
          mobile: parsed.data.mobile ?? null,
          label: null,
          url: null,
          qr_image_url: null,
        }
      : {
          vendor_id,
          kind: "pointer",
          payee_name: null,
          uen: null,
          mobile: null,
          label: parsed.data.label,
          url: parsed.data.url ?? null,
          qr_image_url: parsed.data.qr_image_url ?? null,
        };

  const supabase = await createServiceClient();
  const { error } = await supabase
    .from("vendor_payment_config")
    .upsert(row, { onConflict: "vendor_id" });
  if (error) {
    console.error("vendor config: write failed", error.message);
    return NextResponse.json(
      { error: "Upstream unavailable" },
      { status: 503 },
    );
  }

  const display_name =
    parsed.data.kind === "paynow" ? parsed.data.payee_name : parsed.data.label;

  return NextResponse.json({
    has_config: true,
    display_name,
  });
}
