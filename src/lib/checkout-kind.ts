import { buildPayNowPayload } from "@/lib/payments/paynow";
type Kind = "qr" | "link" | "image";
function fields(payload: string): Map<string, string> {
  const bytes = new TextEncoder().encode(payload);
  const decoder = new TextDecoder("utf-8", { fatal: true });
  const result = new Map<string, string>();
  let offset = 0;
  while (offset < bytes.length) {
    const header = decoder.decode(bytes.slice(offset, offset + 4));
    if (!/^\d{4}$/.test(header)) throw new Error("Invalid TLV header");
    const id = header.slice(0, 2),
      length = Number(header.slice(2));
    if (result.has(id) || offset + 4 + length > bytes.length)
      throw new Error("Invalid TLV field");
    result.set(
      id,
      decoder.decode(bytes.slice(offset + 4, offset + 4 + length)),
    );
    offset += 4 + length;
  }
  return result;
}
/** Rebuilding proves a historical PayNow payload's fields, UTF-8 lengths and
 * CRC without relying on current vendor configuration. Old URLs stay unknown. */
export function checkoutKind(tx: {
  checkout_kind?: Kind | null;
  qr_payload: string;
  amount_cents: number;
}): Kind | null {
  if (tx.checkout_kind) return tx.checkout_kind;
  try {
    const top = fields(tx.qr_payload);
    const merchant = fields(top.get("26") ?? "");
    const additional = fields(top.get("62") ?? "");
    const proxy = merchant.get("02"),
      proxyType = merchant.get("01");
    const payeeName = top.get("59"),
      reference = additional.get("01");
    if (
      !proxy ||
      !payeeName ||
      reference === undefined ||
      (proxyType !== "2" && proxyType !== "0") ||
      !Number.isSafeInteger(tx.amount_cents) ||
      tx.amount_cents <= 0
    )
      return null;
    const rebuilt = buildPayNowPayload({
      ...(proxyType === "2" ? { uen: proxy } : { mobile: proxy }),
      payeeName,
      reference,
      amountCents: tx.amount_cents,
    });
    return rebuilt === tx.qr_payload ? "qr" : null;
  } catch {
    return null;
  }
}
