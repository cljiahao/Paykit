// @vitest-environment jsdom
//
// ProfilePage is an async Server Component, same pattern as
// layout.dom.test.tsx: await it directly and render the returned element
// tree with RTL. `ProfileForm` has its own full DOM coverage
// (profile-form.dom.test.tsx), so it's stubbed here to keep this test
// focused on ProfilePage's own job: fetching the profile + defensively
// reading `display_name`/`avatar_url` off `user_metadata`.
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import ProfilePage from "./page";

const { getVendorSessionMock, getOrCreateVendorProfileMock, ProfileFormMock } =
  vi.hoisted(() => ({
    getVendorSessionMock: vi.fn(),
    getOrCreateVendorProfileMock: vi.fn(),
    ProfileFormMock: vi.fn(() => <div data-testid="profile-form" />),
  }));

vi.mock("@/lib/vendor-session", () => ({
  getVendorSession: getVendorSessionMock,
}));
vi.mock("@/lib/merqo-vendor-profile", () => ({
  getOrCreateVendorProfile: getOrCreateVendorProfileMock,
}));
vi.mock("./profile-form", () => ({ ProfileForm: ProfileFormMock }));

beforeEach(() => {
  getOrCreateVendorProfileMock.mockReset().mockResolvedValue({
    stall_name: "Kopitiam Cart",
    social_links: { website: "https://example.com" },
  });
  ProfileFormMock.mockClear();
});

describe("ProfilePage", () => {
  it("renders the account heading and passes real display name/avatar through", async () => {
    getVendorSessionMock.mockReset().mockResolvedValue({
      supabase: {},
      user: {
        id: "v1",
        email: "aisha@example.com",
        user_metadata: {
          display_name: "Aisha",
          avatar_url: "https://cdn.example/avatar.png",
        },
      },
    });

    const jsx = await ProfilePage();
    render(jsx);

    expect(
      screen.getByRole("heading", { name: "Profile" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("profile-form")).toBeInTheDocument();
    expect(ProfileFormMock).toHaveBeenCalledWith(
      expect.objectContaining({
        vendorId: "v1",
        stallName: "Kopitiam Cart",
        displayName: "Aisha",
        email: "aisha@example.com",
        avatarUrl: "https://cdn.example/avatar.png",
        socialLinks: { website: "https://example.com" },
      }),
      undefined,
    );
  });

  it("defensively falls back to an empty display name and null avatar for non-string metadata", async () => {
    getVendorSessionMock.mockReset().mockResolvedValue({
      supabase: {},
      user: {
        id: "v1",
        email: undefined,
        user_metadata: { display_name: 42, avatar_url: null },
      },
    });

    const jsx = await ProfilePage();
    render(jsx);

    expect(ProfileFormMock).toHaveBeenCalledWith(
      expect.objectContaining({
        displayName: "",
        avatarUrl: null,
        email: "",
      }),
      undefined,
    );
  });
});
