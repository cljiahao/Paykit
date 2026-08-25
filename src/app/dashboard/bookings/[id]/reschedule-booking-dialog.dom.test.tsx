// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { rescheduleBookingActionMock } = vi.hoisted(() => ({
  rescheduleBookingActionMock: vi.fn(),
}));

vi.mock("../actions", () => ({
  rescheduleBookingAction: rescheduleBookingActionMock,
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { toast } from "sonner";
import { RescheduleBookingDialog } from "./reschedule-booking-dialog";

beforeEach(() => {
  rescheduleBookingActionMock.mockReset();
  vi.mocked(toast.success).mockReset();
});

describe("RescheduleBookingDialog", () => {
  it("opens prefilled with the current dates, submits the new ones, toasts, and closes on success", async () => {
    rescheduleBookingActionMock.mockResolvedValue({ status: "ok" });
    const user = userEvent.setup();
    render(
      <RescheduleBookingDialog
        bookingId="b1"
        eventDate="2026-12-01"
        balanceDueDate="2026-11-24"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Reschedule" }));
    expect(screen.getByLabelText(/new event date/i)).toHaveValue("2026-12-01");

    const eventDateInput = screen.getByLabelText(/new event date/i);
    await user.clear(eventDateInput);
    await user.type(eventDateInput, "2027-01-15");
    const balanceDateInput = screen.getByLabelText(/new balance due date/i);
    await user.clear(balanceDateInput);
    await user.type(balanceDateInput, "2027-01-08");

    await user.click(
      screen.getByRole("button", { name: /confirm reschedule/i }),
    );

    await waitFor(() =>
      expect(rescheduleBookingActionMock).toHaveBeenCalledWith(
        "b1",
        "2027-01-15",
        "2027-01-08",
      ),
    );
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
    await waitFor(() =>
      expect(
        screen.queryByRole("heading", { name: /reschedule this booking/i }),
      ).not.toBeInTheDocument(),
    );
  });

  it("keeps the dialog open and shows the error on failure", async () => {
    rescheduleBookingActionMock.mockResolvedValue({
      status: "error",
      message: "Cannot reschedule a cancelled booking.",
    });
    const user = userEvent.setup();
    render(
      <RescheduleBookingDialog
        bookingId="b1"
        eventDate="2026-12-01"
        balanceDueDate="2026-11-24"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Reschedule" }));
    await user.click(
      screen.getByRole("button", { name: /confirm reschedule/i }),
    );

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Cannot reschedule a cancelled booking.",
      ),
    );
    expect(
      screen.getByRole("heading", { name: /reschedule this booking/i }),
    ).toBeInTheDocument();
  });
});
