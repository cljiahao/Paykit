import type { ReactElement } from "react";

// "Signal & Mint" marks, approximated from the OKLCH theme tokens as
// concrete hex — ImageResponse needs literal CSS colors.
export const BRAND_MINT = "#3fa878";
export const BRAND_INK = "#14161f";

/**
 * The paykit "P" app mark for ImageResponse-generated icons (favicon,
 * apple-touch). paykit's display font is Space Grotesk (sans), so a system
 * sans-serif stands in here — fine at icon scale and avoids shipping font
 * data to the icon route.
 */
export function brandIcon(size: number): ReactElement {
  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: BRAND_MINT,
        color: BRAND_INK,
        fontFamily: "system-ui, sans-serif",
        fontWeight: 700,
        fontSize: size * 0.62,
        lineHeight: 1,
        borderRadius: size * 0.22,
      }}
    >
      P
    </div>
  );
}
