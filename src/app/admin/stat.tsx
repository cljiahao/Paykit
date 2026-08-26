import { StatTile } from "@merqo/ui";
import { cn } from "@/lib/utils";
import { ElevatedCard } from "@/components/elevated-card";

/** A back-office figure tile: wraps @merqo/ui's shared StatTile in paykit's own card shell. */
export function Stat({
  label,
  value,
  caption,
  delta,
  deltaTooltip,
  className,
}: {
  label: string;
  value: string | number;
  caption?: string;
  /** Period-over-period delta, e.g. `pctChange(current, prior)`. Null renders no pill. */
  delta?: number | null;
  deltaTooltip?: string;
  className?: string;
}) {
  return (
    <ElevatedCard className={cn("p-4", className)}>
      <StatTile
        label={label}
        value={String(value)}
        caption={caption}
        delta={delta}
        deltaSize="xs"
        deltaTooltip={deltaTooltip}
      />
    </ElevatedCard>
  );
}
