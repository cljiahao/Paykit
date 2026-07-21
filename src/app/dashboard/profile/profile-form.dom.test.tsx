// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProfileForm } from "./profile-form";

const {
  updateStallNameMock,
  updateSocialLinksMock,
  updateUserMock,
  refreshMock,
} = vi.hoisted(() => ({
  updateStallNameMock: vi.fn(),
  updateSocialLinksMock: vi.fn(),
  updateUserMock: vi.fn(),
  refreshMock: vi.fn(),
}));

vi.mock("./actions", () => ({
  updateStallName: updateStallNameMock,
  updateSocialLinks: updateSocialLinksMock,
}));
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ auth: { updateUser: updateUserMock } }),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));
vi.mock("@/components/image-uploader", () => ({
  ImageUploader: () => <div data-testid="image-uploader" />,
}));

const DEFAULT_PROPS = {
  vendorId: "v1",
  stallName: "Kopitiam Cart",
  displayName: "Aisha",
  email: "aisha@example.com",
  avatarUrl: null,
  socialLinks: {},
};

function renderForm(props = {}) {
  return render(
    <TooltipProvider>
      <ProfileForm {...DEFAULT_PROPS} {...props} />
    </TooltipProvider>,
  );
}

beforeEach(() => {
  updateStallNameMock.mockReset().mockResolvedValue({ success: true });
  updateSocialLinksMock.mockReset().mockResolvedValue({ success: true });
  updateUserMock.mockReset().mockResolvedValue({ error: null });
  refreshMock.mockReset();
});

describe("ProfileForm", () => {
  it("renders the profile-icon upload widget", () => {
    renderForm();
    expect(screen.getByTestId("image-uploader")).toBeInTheDocument();
  });

  it("saves a changed stall/shop name", async () => {
    const user = userEvent.setup();
    renderForm();

    const input = screen.getByLabelText("Stall / shop name");
    await user.clear(input);
    await user.type(input, "New Cart Name");
    await user.click(
      screen.getByRole("button", { name: /save stall\/shop name/i }),
    );

    await waitFor(() => {
      expect(updateStallNameMock).toHaveBeenCalledWith({
        name: "New Cart Name",
      });
    });
  });

  it("blocks saving the stall name when cleared to empty", async () => {
    const user = userEvent.setup();
    renderForm();

    const input = screen.getByLabelText("Stall / shop name");
    await user.clear(input);
    await user.click(
      screen.getByRole("button", { name: /save stall\/shop name/i }),
    );

    expect(updateStallNameMock).not.toHaveBeenCalled();
    expect(screen.getByText(/required/i)).toBeInTheDocument();
  });

  it("updates the display name via the browser auth client, not a server action", async () => {
    const user = userEvent.setup();
    renderForm();

    const input = screen.getByLabelText("Display name");
    await user.clear(input);
    await user.type(input, "Bee");
    await user.click(
      screen.getByRole("button", { name: /save display name/i }),
    );

    await waitFor(() => {
      expect(updateUserMock).toHaveBeenCalledWith({
        data: { display_name: "Bee" },
      });
    });
  });

  it("rejects a mismatched password confirmation without calling the auth client", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText("New password"), "password123");
    await user.type(
      screen.getByLabelText("Confirm new password"),
      "password456",
    );
    await user.click(screen.getByRole("button", { name: /update password/i }));

    expect(updateUserMock).not.toHaveBeenCalled();
    expect(screen.getByText(/do not match/i)).toBeInTheDocument();
  });

  it("saves social links through the server action", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(
      screen.getByLabelText(/website/i),
      "https://kopitiam.example",
    );
    await user.click(screen.getByRole("button", { name: /save links/i }));

    await waitFor(() => {
      expect(updateSocialLinksMock).toHaveBeenCalledWith(
        expect.objectContaining({ website: "https://kopitiam.example" }),
      );
    });
  });
});
