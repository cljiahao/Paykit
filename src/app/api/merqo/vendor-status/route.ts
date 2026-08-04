import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { bearerOk } from "@/lib/merqo-auth";
import { listAllUsers } from "@/lib/list-all-users";
import { resolveVendorStatus } from "@/lib/merqo-vendor-status";
import type { VendorPlan } from "@/lib/types";

export const revalidate = 0;

const querySchema = z.object({ email: z.string().email() });

export async function GET(request: Request) {
  if (!bearerOk(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    email: searchParams.get("email") ?? "",
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  const supabase = await createServiceClient();

  const [usersRes, configsRes] = await Promise.all([
    listAllUsers(supabase),
    supabase.from("vendor_payment_config").select("vendor_id, plan"),
  ]);
  if (usersRes.error) {
    console.error("paykit vendor-status: read failed", usersRes.error.message);
    return NextResponse.json(
      { error: "Upstream unavailable" },
      { status: 503 },
    );
  }
  if (configsRes.error) {
    console.error(
      "paykit vendor-status: read failed",
      configsRes.error.message,
    );
    return NextResponse.json(
      { error: "Upstream unavailable" },
      { status: 503 },
    );
  }

  const status = resolveVendorStatus(
    parsed.data.email,
    (usersRes.data?.users ?? []).map((u) => ({
      id: u.id,
      email: u.email ?? null,
    })),
    (configsRes.data ?? []) as { vendor_id: string; plan: VendorPlan }[],
  );

  return NextResponse.json(status);
}
