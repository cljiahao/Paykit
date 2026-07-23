"use client";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { submitFeedbackAction } from "@/app/actions/feedback";
import { feedbackSchema } from "@/lib/schemas";

/** Vendor NPS + optional comment widget, ported from Merqo's own hub-level
 *  FeedbackForm — paykit has no orders/booths, so only the NPS branch
 *  applies. Designed to be mounted in a Sheet off the account menu (wiring
 *  is a separate, later task). */
export function FeedbackForm() {
  const [score, setScore] = useState(-1);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [pending, start] = useTransition();

  function send() {
    if (score < 0) {
      toast.error("Pick a score first");
      return;
    }
    const parsed = feedbackSchema.safeParse({
      nps: score,
      message: message.trim() || undefined,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid feedback");
      return;
    }
    start(async () => {
      const res = await submitFeedbackAction({
        nps: score,
        message: message.trim() || undefined,
      });
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      setSent(true);
    });
  }

  if (sent) {
    return (
      <div className="rounded-xl border bg-card px-4 py-3 text-center text-sm text-muted-foreground">
        Thanks for the feedback — it helps us improve.
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border bg-card p-4">
      <p className="text-sm font-medium">
        How likely are you to recommend paykit to another vendor?
      </p>
      <ToggleGroup
        type="single"
        value={score >= 0 ? String(score) : undefined}
        onValueChange={(v) => v && setScore(Number(v))}
        spacing={1}
        aria-label="Recommend score, 0 to 10"
        className="grid grid-cols-11"
      >
        {Array.from({ length: 11 }, (_, n) => (
          <ToggleGroupItem
            key={n}
            value={String(n)}
            aria-label={`${n}`}
            className={cn(
              "flex aspect-square items-center justify-center rounded-md border border-border text-sm font-semibold tabular-nums text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/5",
              "data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground",
            )}
          >
            {n}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <div className="flex justify-between text-[11px] font-medium text-muted-foreground">
        <span>Not likely</span>
        <span>Very likely</span>
      </div>
      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        aria-label="Anything else?"
        placeholder="Anything we can improve? (optional)"
        rows={3}
        maxLength={2000}
        className="rounded-lg text-sm"
      />
      <Button
        type="button"
        className="h-11 w-full rounded-xl font-semibold"
        onClick={send}
        disabled={pending}
      >
        {pending ? "Sending…" : "Send feedback"}
      </Button>
    </div>
  );
}
