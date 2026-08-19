// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { cancelBookingActionMock } = vi.hoisted(() => ({
  cancelBookingActionMock: vi.fn(),
}));

vi.mock("../actions", () => ({ cancelBookingAction: cancelBookingActionMock }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { toast } from "sonner";
import { CancelBookingDialog } from "./cancel-booking-dialog";

beforeEach(() => {
  cancelBookingActionMock.mockReset();
  vi.mocked(toast.success).mockReset();
});

describe("CancelBookingDialog", () => {
  it("opens, submits the typed reason, toasts, and closes on success", async () => {
    cancelBookingActionMock.mockResolvedValue({ status: "ok" });
    const user = userEvent.setup();
    render(<CancelBookingDialog bookingId="b1" />);

    await user.click(screen.getByRole("button", { name: "Cancel booking" }));
    await user.type(screen.getByLabelText(/reason/i), "Customer rescheduled");
    await user.click(
      screen.getByRole("button", { name: /confirm cancellation/i }),
    );

    await waitFor(() =>
      expect(cancelBookingActionMock).toHaveBeenCalledWith(
        "b1",
        "Customer rescheduled",
      ),
    );
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
    await waitFor(() =>
      expect(
        screen.queryByRole("heading", { name: /cancel this booking/i }),
      ).not.toBeInTheDocument(),
    );
  });

  it("keeps the dialog open and shows the error on failure", async () => {
    cancelBookingActionMock.mockResolvedValue({
      status: "error",
      message: "Could not cancel booking.",
    });
    const user = userEvent.setup();
    render(<CancelBookingDialog bookingId="b1" />);

    await user.click(screen.getByRole("button", { name: "Cancel booking" }));
    await user.click(
      screen.getByRole("button", { name: /confirm cancellation/i }),
    );

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Could not cancel booking.",
      ),
    );
    expect(
      screen.getByRole("heading", { name: /cancel this booking/i }),
    ).toBeInTheDocument();
  });
});
