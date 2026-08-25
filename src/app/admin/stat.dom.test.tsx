// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Stat } from "./stat";

describe("Stat", () => {
  it("renders a string value", () => {
    render(<Stat label="Vendors" value="42" />);
    expect(screen.getByText("Vendors")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("renders a number value coerced to a string", () => {
    render(<Stat label="Transactions" value={128} />);
    expect(screen.getByText("128")).toBeInTheDocument();
  });
});
