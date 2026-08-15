// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { toast } from "sonner";

const { setPricingMock } = vi.hoisted(() => ({ setPricingMock: vi.fn() }));

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("./actions", () => ({ setPricing: setPricingMock }));

import { PricingSection } from "./pricing-section";

beforeEach(() => {
  setPricingMock.mockReset();
});

describe("PricingSection", () => {
  it("submits the edited price as cents and toasts success", async () => {
    setPricingMock.mockResolvedValue({ success: true });
    render(
      <PricingSection initial={{ monthly_cents: 499, currency: "SGD" }} />,
    );
    fireEvent.change(screen.getByLabelText(/monthly/i), {
      target: { value: "5.99" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save/i }));
    await waitFor(() =>
      expect(setPricingMock).toHaveBeenCalledWith({ monthly_cents: 599 }),
    );
    expect(toast.success).toHaveBeenCalled();
  });

  it("toasts an error when the action returns failure", async () => {
    setPricingMock.mockResolvedValue({
      success: false,
      error: "Could not update pricing",
    });
    render(
      <PricingSection initial={{ monthly_cents: 499, currency: "SGD" }} />,
    );
    fireEvent.click(screen.getByRole("button", { name: /save/i }));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Could not update pricing"),
    );
  });
});
