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
vi.mock("@/components/image-uploader", () => ({
  ImageUploader: () => <div data-testid="image-uploader" />,
}));

beforeEach(() => {
  saveConfigActionMock.mockReset();
});

describe("PaymentConfigForm", () => {
  it("defaults to the PayNow section, shows the UEN field, switches to mobile on toggle", () => {
    render(<PaymentConfigForm initial={null} vendorId="v1" />);
    expect(screen.getByLabelText("UEN")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("radio", { name: /mobile/i }));
    expect(screen.getByLabelText("Mobile")).toBeInTheDocument();
  });

  it("renders a QR preview once payee name + identifier are filled", () => {
    render(<PaymentConfigForm initial={null} vendorId="v1" />);
    expect(screen.queryByText(/preview/i)).not.toBeInTheDocument();
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
    render(<PaymentConfigForm initial={null} vendorId="v1" />);

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /save payment config/i }),
    );

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Provide exactly one of UEN or mobile.",
      );
    });
    expect(saveConfigActionMock).toHaveBeenCalledTimes(1);
  });

  it("switches to the pointer section and shows link/QR-image sub-options", async () => {
    const user = userEvent.setup();
    render(<PaymentConfigForm initial={null} vendorId="v1" />);

    await user.click(
      screen.getByRole("radio", { name: /payment link or qr image/i }),
    );

    expect(screen.getByLabelText("Button label")).toBeInTheDocument();
    expect(screen.getByLabelText("Payment link")).toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: "Use a QR image" }));
    expect(screen.getByTestId("image-uploader")).toBeInTheDocument();
  });

  it("prefills the pointer section from an existing pointer config", () => {
    render(
      <PaymentConfigForm
        vendorId="v1"
        initial={{
          vendor_id: "v1",
          kind: "pointer",
          uen: null,
          mobile: null,
          payee_name: null,
          label: "Pay with PayLah",
          url: "https://pay.example/kopitiam",
          qr_image_url: null,
          verification_method: "manual",
          plan: "free",
          created_at: "2026-01-01T00:00:00Z",
          updated_at: "2026-01-01T00:00:00Z",
        }}
      />,
    );
    expect(screen.getByLabelText("Button label")).toHaveValue(
      "Pay with PayLah",
    );
    expect(screen.getByLabelText("Payment link")).toHaveValue(
      "https://pay.example/kopitiam",
    );
  });
});
