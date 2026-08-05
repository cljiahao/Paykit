import { describe, it, expect, vi, beforeEach } from "vitest";

// Mirrors the mocking convention used elsewhere in this repo for the
// browser Supabase client: hoist shared spies, mock the client factory
// module, let each test configure the resolved values it needs.
const h = vi.hoisted(() => ({
  uploadMock: vi.fn(),
  getPublicUrlMock: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    storage: {
      from: (bucket: string) => ({
        upload: (...args: unknown[]) => h.uploadMock(bucket, ...args),
        getPublicUrl: (...args: unknown[]) =>
          h.getPublicUrlMock(bucket, ...args),
      }),
    },
  }),
}));

import { uploadPaykitImage } from "./image-upload-adapter";

beforeEach(() => {
  h.uploadMock.mockReset();
  h.getPublicUrlMock.mockReset();
});

describe("uploadPaykitImage", () => {
  it("uploads to the given bucket/path and returns the public URL", async () => {
    h.uploadMock.mockResolvedValue({ error: null });
    h.getPublicUrlMock.mockReturnValue({
      data: {
        publicUrl:
          "https://proj.supabase.co/storage/v1/object/public/vendor-images/vendor-123/some-uuid.webp",
      },
    });

    const url = await uploadPaykitImage({
      bucket: "vendor-images",
      path: "vendor-123/some-uuid.webp",
      blob: new Blob(["x"], { type: "image/webp" }),
      contentType: "image/webp",
    });

    expect(url).toMatch(/^https?:\/\//);
    expect(h.uploadMock).toHaveBeenCalledWith(
      "vendor-images",
      "vendor-123/some-uuid.webp",
      expect.any(Blob),
      { upsert: false, contentType: "image/webp" },
    );
  });

  it("propagates a storage upload failure", async () => {
    h.uploadMock.mockResolvedValue({ error: new Error("upload failed") });

    await expect(
      uploadPaykitImage({
        bucket: "vendor-images",
        path: "vendor-123/x.webp",
        blob: new Blob(["x"]),
        contentType: "image/webp",
      }),
    ).rejects.toThrow();
  });
});
