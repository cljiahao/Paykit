"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createBalanceCheckoutAction } from "../actions";

export function CreateBalanceCheckoutButton({
  bookingId,
}: {
  bookingId: string;
}) {
  const [pending, start] = useTransition();

  function onClick() {
    start(async () => {
      const result = await createBalanceCheckoutAction(bookingId);
      if (result.status === "error") {
        toast.error(result.message ?? "Could not create the balance checkout.");
        return;
      }
      toast.success("Balance checkout created.");
    });
  }

  return (
    <Button size="sm" disabled={pending} onClick={onClick}>
      {pending ? "Creating…" : "Create balance checkout"}
    </Button>
  );
}
