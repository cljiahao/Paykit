"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAsyncAction } from "@/hooks/use-async-action";
import { setVendorPlan } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import type { VendorPlan } from "@/lib/types";

/** Per-row Make Pro / Make Free control — no modal, immediate write + toast. */
export function VendorPlanToggle({
  vendorId,
  email,
  plan,
}: {
  vendorId: string;
  email: string | null;
  plan: VendorPlan;
}) {
  const router = useRouter();
  const { pending, run } = useAsyncAction();
  const nextPlan: VendorPlan = plan === "pro" ? "free" : "pro";
  const who = email ?? "vendor";
  let label = plan === "pro" ? "Make Free" : "Make Pro";
  if (pending) label = "Saving…";

  function toggle() {
    run(async () => {
      const fd = new FormData();
      fd.set("vendorId", vendorId);
      fd.set("plan", nextPlan);
      const result = await setVendorPlan(fd);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(
        nextPlan === "pro" ? `${who} is now Pro.` : `${who} is now Free.`,
      );
      router.refresh();
    });
  }

  return (
    <Button
      type="button"
      variant={plan === "pro" ? "outline" : "default"}
      size="sm"
      disabled={pending}
      onClick={toggle}
      className="rounded-xl"
    >
      {label}
    </Button>
  );
}
