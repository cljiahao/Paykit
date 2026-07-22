import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { verifyKitAuth } from "@/lib/kit-auth";
import { uuidSchema } from "@/lib/api-schemas";

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
