// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { refreshMock, setVendorPlanMock } = vi.hoisted(() => ({
  refreshMock: vi.fn(),
  setVendorPlanMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));
vi.mock("@/app/admin/actions", () => ({ setVendorPlan: setVendorPlanMock }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { toast } from "sonner";
import { VendorPlanToggle } from "./vendor-plan-toggle";

beforeEach(() => {
  refreshMock.mockReset();
  setVendorPlanMock.mockReset();
  vi.mocked(toast.success).mockReset();
  vi.mocked(toast.error).mockReset();
});

describe("VendorPlanToggle", () => {
  it("shows 'Make Pro' for a free vendor", () => {
    render(
      <VendorPlanToggle vendorId="v1" email="free@example.com" plan="free" />,
    );
    expect(
      screen.getByRole("button", { name: /make pro/i }),
    ).toBeInTheDocument();
  });

  it("shows 'Make Free' for a pro vendor", () => {
    render(
      <VendorPlanToggle vendorId="v1" email="pro@example.com" plan="pro" />,
    );
    expect(
      screen.getByRole("button", { name: /make free/i }),
    ).toBeInTheDocument();
  });

  it("upgrades a free vendor to pro and toasts + refreshes on success", async () => {
    setVendorPlanMock.mockResolvedValue({ success: true });
    const user = userEvent.setup();
    render(
      <VendorPlanToggle vendorId="v1" email="free@example.com" plan="free" />,
    );

    await user.click(screen.getByRole("button", { name: /make pro/i }));

    await waitFor(() => expect(setVendorPlanMock).toHaveBeenCalledTimes(1));
    const submittedFormData = setVendorPlanMock.mock.calls[0][0] as FormData;
    expect(submittedFormData.get("vendorId")).toBe("v1");
    expect(submittedFormData.get("plan")).toBe("pro");
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        "free@example.com is now Pro.",
      ),
    );
    expect(refreshMock).toHaveBeenCalledTimes(1);
  });

  it("toasts the action error and does not refresh when the action fails", async () => {
    setVendorPlanMock.mockResolvedValue({
      success: false,
      error: "Could not update plan",
    });
    const user = userEvent.setup();
    render(
      <VendorPlanToggle vendorId="v1" email="pro@example.com" plan="pro" />,
    );

    await user.click(screen.getByRole("button", { name: /make free/i }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Could not update plan"),
    );
    expect(refreshMock).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
  });
});
