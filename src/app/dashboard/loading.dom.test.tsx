// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import DashboardLoading from "./loading";

describe("DashboardLoading", () => {
  it("renders the title-plus-cards skeleton shape", () => {
    const { container } = render(<DashboardLoading />);
    const skeletons = container.querySelectorAll('[data-slot="skeleton"]');
    // 2 title-line skeletons + 3 card-block skeletons, matching the
    // title + card-block shape every dashboard page shares.
    expect(skeletons).toHaveLength(5);
  });

  it("sizes the title-line skeletons ahead of the card-block ones", () => {
    const { container } = render(<DashboardLoading />);
    const skeletons = Array.from(
      container.querySelectorAll('[data-slot="skeleton"]'),
    );
    expect(skeletons[0]).toHaveClass("h-8", "w-48");
    expect(skeletons[1]).toHaveClass("h-4", "w-72");
    expect(skeletons[2]).toHaveClass("h-20", "w-full", "rounded-xl");
    expect(skeletons[3]).toHaveClass("h-20", "w-full", "rounded-xl");
    expect(skeletons[4]).toHaveClass("h-20", "w-full", "rounded-xl");
  });
});
