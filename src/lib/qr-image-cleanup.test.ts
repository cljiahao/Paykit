import { describe, expect, it, vi } from "vitest";
import { removeReplacedQrImage, replacedQrImage } from "./qr-image-cleanup";

const PUBLIC = "https://abc.supabase.co/storage/v1/object/public";
const PAYKIT_QR = `${PUBLIC}/vendor-images/v1/old.webp`;
const QKIT_QR = `${PUBLIC}/booth-images/v1/old.webp`;
const NEW_QR = `${PUBLIC}/vendor-images/v1/new.webp`;

describe("replacedQrImage", () => {
  it("finds a replaced image uploaded from paykit", () => {
    expect(replacedQrImage("v1", PAYKIT_QR, NEW_QR)).toEqual({
      bucket: "vendor-images",
      path: "v1/old.webp",
    });
  });

  it("finds a replaced image uploaded from qkit", () => {
    expect(replacedQrImage("v1", QKIT_QR, NEW_QR)).toEqual({
      bucket: "booth-images",
      path: "v1/old.webp",
    });
  });

  it("finds a cleared image", () => {
    expect(replacedQrImage("v1", PAYKIT_QR, null)).toEqual({
      bucket: "vendor-images",
      path: "v1/old.webp",
    });
  });

  it.each([
    ["no previous image", null, NEW_QR],
    ["the same image kept", PAYKIT_QR, PAYKIT_QR],
    ["a pasted external URL", "https://cdn.example/qr.png", NEW_QR],
    ["another bucket", `${PUBLIC}/payment-proofs/v1/old.webp`, NEW_QR],
    ["another vendor folder", `${PUBLIC}/vendor-images/v2/old.webp`, NEW_QR],
  ])("returns null for %s", (_label, before, after) => {
    expect(replacedQrImage("v1", before, after)).toBeNull();
  });
});

function storageClient(
  remove: (paths: string[]) => Promise<{ error: { message: string } | null }>,
) {
  const from = vi.fn(() => ({ remove }));
  return { client: { storage: { from } }, from };
}

describe("removeReplacedQrImage", () => {
  it("deletes the replaced image from its own bucket", async () => {
    const remove = vi.fn().mockResolvedValue({ error: null });
    const { client, from } = storageClient(remove);
    await removeReplacedQrImage(client, "v1", QKIT_QR, NEW_QR);
    expect(from).toHaveBeenCalledWith("booth-images");
    expect(remove).toHaveBeenCalledWith(["v1/old.webp"]);
  });

  it("deletes nothing when the image is unchanged", async () => {
    const remove = vi.fn();
    const { client } = storageClient(remove);
    await removeReplacedQrImage(client, "v1", PAYKIT_QR, PAYKIT_QR);
    expect(remove).not.toHaveBeenCalled();
  });

  it("logs, and never throws, when storage reports an error", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const { client } = storageClient(
      vi.fn().mockResolvedValue({ error: { message: "denied" } }),
    );
    await expect(
      removeReplacedQrImage(client, "v1", PAYKIT_QR, NEW_QR),
    ).resolves.toBeUndefined();
    expect(log).toHaveBeenCalledWith("QR image cleanup failed", "denied");
    log.mockRestore();
  });

  it("logs, and never throws, when the storage call rejects", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const { client } = storageClient(
      vi.fn().mockRejectedValue(new Error("network")),
    );
    await expect(
      removeReplacedQrImage(client, "v1", PAYKIT_QR, NEW_QR),
    ).resolves.toBeUndefined();
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });
});
