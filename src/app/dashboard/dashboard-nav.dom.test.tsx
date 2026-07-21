// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DashboardNav } from "./dashboard-nav";

vi.mock("next/navigation", () => ({ usePathname: () => "/dashboard" }));

describe("DashboardNav", () => {
  const baseProps = {
    signOut: vi.fn(async () => {}),
    vendorName: "vendor@example.com",
    plan: "free" as const,
  };

  it("renders the inline page links", () => {
    render(<DashboardNav {...baseProps} />);
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
      "href",
      "/dashboard",
    );
    expect(screen.getByRole("link", { name: "PayNow setup" })).toHaveAttribute(
      "href",
      "/dashboard/config",
    );
    expect(screen.getByRole("link", { name: "Transactions" })).toHaveAttribute(
      "href",
      "/dashboard/transactions",
    );
    expect(screen.getByRole("link", { name: "Reports" })).toHaveAttribute(
      "href",
      "/dashboard/reports",
    );
  });

  it("account menu has Profile, Plan, Get help, Feedback, then Sign out, in order", async () => {
    const user = userEvent.setup();
    render(<DashboardNav {...baseProps} />);
    await user.click(screen.getByRole("button", { name: /account menu/i }));
    const menuItems = screen.getAllByRole("menuitem");
    expect(menuItems.map((item) => item.textContent)).toEqual([
      "Profile",
      "Plan",
      "Get help",
      "Feedback",
      "Sign out",
    ]);
    expect(screen.getByRole("menuitem", { name: "Plan" })).toHaveAttribute(
      "href",
      "/dashboard/plan",
    );
  });

  it("sign-out is a real form submit that calls the signOut action", async () => {
    const { container } = render(<DashboardNav {...baseProps} />);
    const form = container.querySelector("form");
    expect(form).not.toBeNull();

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /account menu/i }));
    await user.click(screen.getByRole("menuitem", { name: "Sign out" }));

    await waitFor(() => expect(baseProps.signOut).toHaveBeenCalled());
  });
});
