// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { submitFeedbackActionMock } = vi.hoisted(() => ({
  submitFeedbackActionMock: vi.fn(async () => ({ success: true })),
}));

vi.mock("@/app/actions/feedback", () => ({
  submitFeedbackAction: submitFeedbackActionMock,
}));

import { FeedbackForm } from "./feedback-form";

describe("FeedbackForm", () => {
  it("requires a score before sending", async () => {
    const user = userEvent.setup();
    render(<FeedbackForm />);
    await user.click(screen.getByRole("button", { name: /send feedback/i }));
    expect(submitFeedbackActionMock).not.toHaveBeenCalled();
  });

  it("submits the picked score and message", async () => {
    const user = userEvent.setup();
    render(<FeedbackForm />);
    await user.click(screen.getByRole("radio", { name: "9" }));
    await user.type(screen.getByLabelText(/anything else/i), "Works great");
    await user.click(screen.getByRole("button", { name: /send feedback/i }));
    expect(submitFeedbackActionMock).toHaveBeenCalledWith({
      nps: 9,
      message: "Works great",
    });
    expect(
      await screen.findByText(/thanks for the feedback/i),
    ).toBeInTheDocument();
  });
});
