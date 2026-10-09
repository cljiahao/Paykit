import { describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";
import {
  parseKitKeyArgs,
  provisionKitKey,
} from "../../scripts/create-kit-key.mjs";

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => {
    throw new Error("Tests must never construct a real database client");
  }),
}));

function database(error: { code: string; message?: string } | null = null) {
  const result = Promise.resolve({ error });
  const single = vi.fn(() => result);
  const select = vi.fn(() => ({ single }));
  const eq = vi.fn(() => ({ select }));
  const update = vi.fn(() => ({ eq }));
  const insert = vi.fn(() => result);
  const from = vi.fn(() => ({ insert, update }));
  return { from, insert, update, eq, select, single };
}

describe("kit key provisioning", () => {
  it("defaults to provisioning without rotation", () => {
    expect(parseKitKeyArgs(["qkit"])).toEqual({
      kitSlug: "qkit",
      rotate: false,
    });
  });
  it.each(
    [
      ["qkit", "--rotate"],
      ["--rotate", "qkit"],
    ].map((args) => ({ args })),
  )("requires an explicit rotation flag", ({ args }) => {
    expect(parseKitKeyArgs(args)).toEqual({ kitSlug: "qkit", rotate: true });
  });
  it.each(
    [
      [],
      ["qkit", "paykit"],
      ["qkit", "--force"],
      ["QKIT"],
      ["qkit:token"],
      ["qkit", "--rotate", "--rotate"],
    ].map((args) => ({ args })),
  )("rejects malformed invocation", ({ args }) => {
    expect(() => parseKitKeyArgs(args)).toThrow("Usage:");
  });
  it("inserts only the hash and never changes an existing key implicitly", async () => {
    const client = database();
    const secret = await provisionKitKey(client, {
      kitSlug: "qkit",
      rotate: false,
    });
    expect(secret).toMatch(/^[a-f0-9]{64}$/);
    expect(client.insert).toHaveBeenCalledWith({
      kit_slug: "qkit",
      secret_hash: createHash("sha256").update(secret).digest("hex"),
    });
    expect(client.update).not.toHaveBeenCalled();
    expect(JSON.stringify(client.insert.mock.calls)).not.toContain(secret);
  });
  it("rejects duplicate provisioning without attempting rotation", async () => {
    const client = database({ code: "23505" });
    await expect(
      provisionKitKey(client, { kitSlug: "qkit", rotate: false }),
    ).rejects.toThrow("Use --rotate");
    expect(client.update).not.toHaveBeenCalled();
  });
  it("rotates only the selected existing slug", async () => {
    const client = database();
    await provisionKitKey(client, { kitSlug: "qkit", rotate: true });
    expect(client.update).toHaveBeenCalledWith({
      secret_hash: expect.stringMatching(/^[a-f0-9]{64}$/),
    });
    expect(client.eq).toHaveBeenCalledWith("kit_slug", "qkit");
    expect(client.single).toHaveBeenCalledOnce();
    expect(client.insert).not.toHaveBeenCalled();
  });
  it("does not provision an unknown slug during explicit rotation", async () => {
    const client = database({ code: "PGRST116" });
    await expect(
      provisionKitKey(client, { kitSlug: "unknown", rotate: true }),
    ).rejects.toThrow("No existing key");
    expect(client.insert).not.toHaveBeenCalled();
  });
  it("does not leak database error details", async () => {
    const client = database({
      code: "XX000",
      message: "private server connection details",
    });
    await expect(
      provisionKitKey(client, { kitSlug: "qkit", rotate: false }),
    ).rejects.toThrow("Failed to store the kit key.");
  });
});
