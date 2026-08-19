import { createServerClient } from "@/lib/supabase/server";
import type { Booking } from "@/lib/types";

export async function listBookings(vendorId: string): Promise<Booking[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("vendor_id", vendorId)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) {
    console.error("listBookings failed", error.message);
    return [];
  }
  return data ?? [];
}

export async function getBooking(
  vendorId: string,
  bookingId: string,
): Promise<Booking | null> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("vendor_id", vendorId)
    .eq("id", bookingId)
    .maybeSingle();
  if (error) {
    console.error("getBooking failed", error.message);
    return null;
  }
  return data;
}
