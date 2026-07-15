// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PaymentConfigForm } from "./payment-config-form";

const { saveConfigActionMock } = vi.hoisted(() => ({
  saveConfigActionMock: vi.fn(),
}));

vi.mock("./actions", () => ({
  saveConfigAction: saveConfigActionMock,
}));

beforeEach(() => {
  saveConfigActionMock.mockReset();
});

describe("PaymentConfigForm", () => {
  it("shows the UEN field by default and switches to mobile on toggle", () => {
    render(<PaymentConfigForm initial={null} />);
    expect(screen.getByLabelText("UEN")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("radio", { name: /mobile/i }));
    expect(screen.getByLabelText("Mobile")).toBeInTheDocument();
  });

  it("renders a QR preview once payee name + identifier are filled", () => {
    render(<PaymentConfigForm initial={null} />);
    expect(document.querySelector("svg")).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Payee name"), {
      target: { value: "Kopitiam Cart" },
    });
    fireEvent.change(screen.getByLabelText("UEN"), {
      target: { value: "53312345A" },
    });
    expect(document.querySelector("svg")).toBeInTheDocument();
  });

  it("renders a role=alert error message once the server action returns status: error", async () => {
    saveConfigActionMock.mockResolvedValue({
      status: "error",
      message: "Provide exactly one of UEN or mobile.",
    });
    const user = userEvent.setup();
    render(<PaymentConfigForm initial={null} />);

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /save paynow config/i }),
    );

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Provide exactly one of UEN or mobile.",
      );
    });
    expect(saveConfigActionMock).toHaveBeenCalledTimes(1);
  });
});
