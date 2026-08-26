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

  it("renders a caption when given one", () => {
    render(<Stat label="Refunds · 30d" value={3} caption="$99.00" />);
    expect(screen.getByText("$99.00")).toBeInTheDocument();
  });

  it("renders an up delta pill", () => {
    render(<Stat label="Confirmed · 7d" value={12} delta={20} />);
    expect(screen.getByText("20%")).toBeInTheDocument();
  });

  it("renders no delta pill when delta is null", () => {
    render(<Stat label="Confirmed · 7d" value={12} delta={null} />);
    expect(screen.queryByText("%", { exact: false })).not.toBeInTheDocument();
  });
});
