"use server";

import { getVendorSession } from "@/lib/vendor-session";
import { vendorPaymentConfigInputSchema } from "@/lib/schemas";
import type { VendorPaymentConfig } from "@/lib/types";

export async function getConfig(): Promise<VendorPaymentConfig | null> {
  const { supabase, user } = await getVendorSession();
  const { data } = await supabase
    .from("vendor_payment_config")
    .select("*")
    .eq("vendor_id", user.id)
    .maybeSingle();
  return data;
}

export type SaveConfigState = {
  status: "idle" | "ok" | "error";
  message?: string;
};

export async function saveConfigAction(
  _prev: SaveConfigState,
  formData: FormData,
): Promise<SaveConfigState> {
  const { supabase, user } = await getVendorSession();
  const parsed = vendorPaymentConfigInputSchema.safeParse({
    payee_name: formData.get("payee_name") ?? "",
    uen: formData.get("uen") ?? "",
    mobile: formData.get("mobile") ?? "",
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const { error } = await supabase.from("vendor_payment_config").upsert(
    {
      vendor_id: user.id,
      payee_name: parsed.data.payee_name,
      uen: parsed.data.uen ?? null,
      mobile: parsed.data.mobile ?? null,
    },
    { onConflict: "vendor_id" },
  );
  if (error) {
    console.error("saveConfigAction failed", error.message);
    return { status: "error", message: "Could not save. Try again." };
  }
  return { status: "ok" };
}
