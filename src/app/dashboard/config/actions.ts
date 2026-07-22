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
  const kind = formData.get("kind");
  const parsed = vendorPaymentConfigInputSchema.safeParse(
    kind === "pointer"
      ? {
          kind: "pointer",
          label: formData.get("label") ?? "",
          url: formData.get("url") || undefined,
          qr_image_url: formData.get("qr_image_url") || undefined,
        }
      : {
          kind: "paynow",
          payee_name: formData.get("payee_name") ?? "",
          uen: formData.get("uen") ?? "",
          mobile: formData.get("mobile") ?? "",
        },
  );
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const row: {
    vendor_id: string;
    kind: "paynow" | "pointer";
    payee_name: string | null;
    uen: string | null;
    mobile: string | null;
    label: string | null;
    url: string | null;
    qr_image_url: string | null;
  } =
    parsed.data.kind === "paynow"
      ? {
          vendor_id: user.id,
          kind: "paynow",
          payee_name: parsed.data.payee_name,
          uen: parsed.data.uen ?? null,
          mobile: parsed.data.mobile ?? null,
          label: null,
          url: null,
          qr_image_url: null,
        }
      : {
          vendor_id: user.id,
          kind: "pointer",
          payee_name: null,
          uen: null,
          mobile: null,
          label: parsed.data.label,
          url: parsed.data.url ?? null,
          qr_image_url: parsed.data.qr_image_url ?? null,
        };

  const { error } = await supabase
    .from("vendor_payment_config")
    .upsert(row, { onConflict: "vendor_id" });
  if (error) {
    console.error("saveConfigAction failed", error.message);
    return { status: "error", message: "Could not save. Try again." };
  }
  return { status: "ok" };
}
