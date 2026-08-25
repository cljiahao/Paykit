// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DownloadCsvButton } from "./download-csv-button";
import type { EarningsReport } from "@/lib/earnings-report";

const REPORT: EarningsReport = {
  year: 2026,
  months: [],
  lines: [
    { key: "booking:b1", label: "Jane Tan", event_date: "2026-12-25", revenue_cents: 100000 },
  ],
  total_revenue_cents: 100000,
};

let blobCalls: Array<{ parts: string[]; options: BlobPropertyBag }> = [];

class MockBlob {
  constructor(parts: string[], options: BlobPropertyBag) {
    blobCalls.push({ parts, options });
  }
}

beforeEach(() => {
  blobCalls = [];
  vi.stubGlobal("Blob", MockBlob);
  URL.createObjectURL = vi.fn(() => "blob:mock-url");
  URL.revokeObjectURL = vi.fn();
});

describe("DownloadCsvButton", () => {
  it("builds a CSV Blob from the report and triggers a download named after the year", async () => {
    const user = userEvent.setup();
    render(<DownloadCsvButton report={REPORT} />);

    await user.click(screen.getByRole("button", { name: /download csv/i }));

    expect(blobCalls).toHaveLength(1);
    expect(blobCalls[0].parts[0]).toContain("Jane Tan");
    expect(blobCalls[0].parts[0]).toContain("Total,1000.00");
    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
  });
});
