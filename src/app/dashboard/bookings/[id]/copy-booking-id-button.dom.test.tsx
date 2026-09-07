// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { CopyBookingIdButton } from "./copy-booking-id-button";

vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));

describe("CopyBookingIdButton", () => {
  it("copies the booking id to the clipboard and confirms via toast", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(<CopyBookingIdButton bookingId="b1" />);
    await userEvent.click(
      screen.getByRole("button", { name: /copy booking id/i }),
    );

    expect(writeText).toHaveBeenCalledWith("b1");
    expect(toast.success).toHaveBeenCalledWith("Booking ID copied");
  });
});
