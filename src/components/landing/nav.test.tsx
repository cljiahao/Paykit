// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Nav } from "./nav";

describe("Nav", () => {
  it("links to the About page", () => {
    render(<Nav />);
    expect(screen.getByRole("link", { name: "About" })).toHaveAttribute(
      "href",
      "/about",
    );
  });

  it("shows Sign in / Get started when signed out, Dashboard when signed in", () => {
    const { rerender } = render(<Nav authed={false} />);
    expect(screen.getByRole("link", { name: "Sign in" })).toBeInTheDocument();

    rerender(<Nav authed />);
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
      "href",
      "/dashboard",
    );
  });
});
