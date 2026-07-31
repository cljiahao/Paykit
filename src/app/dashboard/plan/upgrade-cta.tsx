"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { requestProUpgradeAction } from "@/app/actions/plan";

/**
 * Interest CTA for the Pro plan. Files an in-product request (no payment
 * provider involved — paykit never touches funds); Pro is granted manually
 * once the vendor is set up. Mirrors qkit's UpgradeCta pattern, simplified
 * for paykit's single free→pro upgrade path.
 */
export function UpgradeCta() {
  const [pending, start] = useTransition();

  function onClick() {
    start(async () => {
      const res = await requestProUpgradeAction();
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      toast.success("Request sent. We'll set you up shortly.");
    });
  }

  return (
    <Button
      size="sm"
      disabled={pending}
      onClick={onClick}
      className="mt-3 rounded-lg"
    >
      {pending ? "Sending…" : "Ask us to upgrade to Pro"}
    </Button>
  );
}
