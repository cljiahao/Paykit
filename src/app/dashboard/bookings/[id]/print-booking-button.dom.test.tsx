// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PrintBookingButton } from "./print-booking-button";

describe("PrintBookingButton", () => {
  it("renders a Print button", () => {
    render(<PrintBookingButton />);
    expect(screen.getByRole("button", { name: /print/i })).toBeInTheDocument();
  });

  it("calls window.print when clicked", async () => {
    const printSpy = vi.fn();
    window.print = printSpy;
    render(<PrintBookingButton />);
    await userEvent.click(screen.getByRole("button", { name: /print/i }));
    expect(printSpy).toHaveBeenCalledOnce();
  });

  it("is marked print:hidden so it never appears on the printed page itself", () => {
    render(<PrintBookingButton />);
    expect(screen.getByRole("button", { name: /print/i })).toHaveClass(
      "print:hidden",
    );
  });
});
