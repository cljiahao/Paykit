import { it, expect, vi } from "vitest";
import { stampTourSeen } from "./tour-prefs";
it("does not fail dashboard rendering when cosmetic tour persistence rejects", async () => {
  const upsert = vi.fn().mockRejectedValue(new Error("network"));
  const client = { from: () => ({ upsert }) } as unknown as Parameters<
    typeof stampTourSeen
  >[0];
  await expect(stampTourSeen(client, "vendor")).resolves.toBeUndefined();
  expect(upsert).toHaveBeenCalledWith(
    expect.objectContaining({ vendor_id: "vendor" }),
  );
});
