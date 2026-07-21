import { InfoTooltip } from "@/components/info-tooltip";

/**
 * Shared field-group shell for dashboard settings pages (profile, config,
 * etc.) — icon chip, eyebrow (who sees this), title, one-line description,
 * optional tooltip. paykit's own bordered-box style (matches the existing
 * `rounded-xl border` idiom in config/page.tsx and dashboard/page.tsx)
 * rather than qkit's ticket-shaped card, since paykit has no equivalent
 * branded card component.
 */
export function Section({
  icon,
  eyebrow,
  title,
  description,
  tooltip,
  children,
}: {
  icon: React.ReactNode;
  eyebrow?: string;
  title: string;
  description: string;
  // Extra detail that doesn't need to be visible by default — rendered
  // behind an (i) next to the title instead of bloating `description`.
  tooltip?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border p-6">
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </span>
        <div>
          {eyebrow && (
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {eyebrow}
            </p>
          )}
          <div className="flex items-center gap-1.5">
            <h2 className="font-display text-xl font-semibold leading-tight">
              {title}
            </h2>
            {tooltip && (
              <InfoTooltip label="More about this section">
                {tooltip}
              </InfoTooltip>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}
