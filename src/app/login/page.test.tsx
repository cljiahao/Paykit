// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const {
  useSearchParamsMock,
  useRouterMock,
  signInWithOAuthMock,
  signInWithPasswordMock,
  signUpMock,
  resetPasswordForEmailMock,
} = vi.hoisted(() => ({
  useSearchParamsMock: vi.fn(),
  useRouterMock: vi.fn(),
  signInWithOAuthMock: vi.fn(),
  signInWithPasswordMock: vi.fn(),
  signUpMock: vi.fn(),
  resetPasswordForEmailMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: useRouterMock,
  useSearchParams: useSearchParamsMock,
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    auth: {
      signInWithOAuth: signInWithOAuthMock,
      signInWithPassword: signInWithPasswordMock,
      signUp: signUpMock,
      resetPasswordForEmail: resetPasswordForEmailMock,
    },
  })),
}));

beforeEach(() => {
  useRouterMock.mockReset().mockReturnValue({
    push: vi.fn(),
    refresh: vi.fn(),
  });
  useSearchParamsMock.mockReset().mockReturnValue(new URLSearchParams());
  signInWithOAuthMock.mockReset().mockResolvedValue({ error: null });
  signInWithPasswordMock.mockReset().mockResolvedValue({ error: null });
  signUpMock
    .mockReset()
    .mockResolvedValue({ data: { session: {} }, error: null });
  resetPasswordForEmailMock.mockReset().mockResolvedValue({ error: null });
});

describe("LoginPage", () => {
  it("shows an error message when the URL has ?error=oauth", async () => {
    useSearchParamsMock.mockReturnValue(new URLSearchParams("error=oauth"));
    const { default: LoginPage } = await import("./page");
    render(<LoginPage />);

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(
      "Something went wrong signing in with Google. Please try again.",
    );
  });

  it("does not show an error message when there is no error param", async () => {
    const { default: LoginPage } = await import("./page");
    render(<LoginPage />);

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows a check-your-email state instead of redirecting when signUp returns no session", async () => {
    signUpMock.mockResolvedValue({ data: { session: null }, error: null });
    const push = vi.fn();
    useRouterMock.mockReturnValue({ push, refresh: vi.fn() });

    const user = userEvent.setup();
    const { default: LoginPage } = await import("./page");
    render(<LoginPage />);

    await user.click(
      screen.getByRole("button", { name: /create an account/i }),
    );
    await user.type(screen.getByLabelText(/email/i), "new@example.com");
    await user.type(screen.getByLabelText(/^password/i), "password123");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/check your email/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/new@example\.com/)).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it("redirects to the dashboard when signUp returns a session", async () => {
    const push = vi.fn();
    const refresh = vi.fn();
    useRouterMock.mockReturnValue({ push, refresh });

    const user = userEvent.setup();
    const { default: LoginPage } = await import("./page");
    render(<LoginPage />);

    await user.click(
      screen.getByRole("button", { name: /create an account/i }),
    );
    await user.type(screen.getByLabelText(/email/i), "new@example.com");
    await user.type(screen.getByLabelText(/^password/i), "password123");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/dashboard"));
    expect(screen.queryByText(/check your email/i)).not.toBeInTheDocument();
  });

  it("shows Forgot password only in signin mode and sends a reset email", async () => {
    const user = userEvent.setup();
    const { default: LoginPage } = await import("./page");
    render(<LoginPage />);

    expect(
      screen.getByRole("button", { name: /forgot password/i }),
    ).toBeInTheDocument();

    await user.type(screen.getByLabelText(/email/i), "vendor@example.com");
    await user.click(screen.getByRole("button", { name: /forgot password/i }));

    await waitFor(() => {
      expect(resetPasswordForEmailMock).toHaveBeenCalledWith(
        "vendor@example.com",
        expect.objectContaining({
          redirectTo: expect.stringContaining("/dashboard/profile"),
        }),
      );
    });

    await user.click(
      screen.getByRole("button", { name: /create an account/i }),
    );
    expect(
      screen.queryByRole("button", { name: /forgot password/i }),
    ).not.toBeInTheDocument();
  });
});
