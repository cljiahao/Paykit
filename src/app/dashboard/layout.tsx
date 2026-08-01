import type { ReactNode } from "react";
import { getVendorSession, getVendorPlan } from "@/lib/vendor-session";
import { getOrCreateVendorProfile } from "@/lib/merqo-vendor-profile";
import { signOutAction } from "@/app/actions/auth";
import { DashboardTour } from "@/components/dashboard-tour";
import { DashboardNav } from "./dashboard-nav";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { supabase, user } = await getVendorSession();
  const [config, profile, { data: prefs }] = await Promise.all([
    getVendorPlan(supabase, user.id),
    getOrCreateVendorProfile(supabase, user.id, null),
    supabase
      .from("vendor_prefs")
      .select("tour_seen_at")
      .eq("vendor_id", user.id)
      .maybeSingle(),
  ]);

  // Profile icon lives on the auth user's metadata, same as qkit/loopkit —
  // no schema change needed.
  const rawAvatar = user.user_metadata?.avatar_url;
  const avatarUrl = typeof rawAvatar === "string" ? rawAvatar : null;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 px-5 py-3.5 backdrop-blur-md print:hidden">
        <DashboardNav
          signOut={signOutAction}
          vendorName={profile.stall_name || (user.email ?? "Account")}
          avatarUrl={avatarUrl}
          plan={config?.plan ?? "free"}
        />
      </header>
      <main>{children}</main>
      <DashboardTour seen={!!prefs?.tour_seen_at} />
    </div>
  );
}
