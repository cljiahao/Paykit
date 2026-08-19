"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cancelBookingAction } from "../actions";

export function CancelBookingDialog({ bookingId }: { bookingId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function onConfirm() {
    setError(null);
    start(async () => {
      const result = await cancelBookingAction(bookingId, reason);
      if (result.status === "error") {
        setError(result.message ?? "Could not cancel booking.");
        return;
      }
      toast.success("Booking cancelled.");
      setReason("");
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Cancel booking
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel this booking?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          This only marks the booking cancelled — it never changes the status of
          any payment already made.
        </p>
        <div className="space-y-2">
          <Label htmlFor="cancel_reason">Reason (optional)</Label>
          <Textarea
            id="cancel_reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        {error && (
          <p role="alert" className="text-sm font-medium text-destructive">
            {error}
          </p>
        )}
        <Button variant="destructive" disabled={pending} onClick={onConfirm}>
          {pending ? "Cancelling…" : "Confirm cancellation"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
