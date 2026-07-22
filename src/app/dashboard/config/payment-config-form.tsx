"use client";

import { useActionState, useState } from "react";
import QRCode from "react-qr-code";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ImageUploader } from "@/components/image-uploader";
import { buildPayNowPayload } from "@/lib/payments/paynow";
import { saveConfigAction, type SaveConfigState } from "./actions";
import type { PaymentConfigKind, VendorPaymentConfig } from "@/lib/types";

type IdKind = "uen" | "mobile";
type PointerMode = "link" | "qr";

const KIND_OPTIONS: { k: PaymentConfigKind; label: string; hint: string }[] = [
  {
    k: "paynow",
    label: "PayNow QR",
    hint: "We generate a QR with the order amount already filled in.",
  },
  {
    k: "pointer",
    label: "Payment link or QR image",
    hint: "Qashier, HitPay, GrabPay for Business, Stripe Payment Links, or your bank's own QR: any of them work here.",
  },
];

export function PaymentConfigForm({
  initial,
  vendorId,
}: {
  initial: VendorPaymentConfig | null;
  vendorId: string;
}) {
  const [state, formAction, pending] = useActionState<
    SaveConfigState,
    FormData
  >(saveConfigAction, { status: "idle" });

  const [kind, setKind] = useState<PaymentConfigKind>(
    initial?.kind ?? "paynow",
  );

  // PayNow fields.
  const [idKind, setIdKind] = useState<IdKind>(
    initial?.mobile ? "mobile" : "uen",
  );
  const [idKindTouched, setIdKindTouched] = useState(
    Boolean(initial?.kind === "paynow"),
  );
  const [payeeName, setPayeeName] = useState(initial?.payee_name ?? "");
  const [uen, setUen] = useState(initial?.uen ?? "");
  const [mobile, setMobile] = useState(initial?.mobile ?? "");

  // Pointer fields.
  const [pointerMode, setPointerMode] = useState<PointerMode>(() =>
    initial?.kind === "pointer" && initial.qr_image_url && !initial.url
      ? "qr"
      : "link",
  );
  const [label, setLabel] = useState(initial?.label ?? "");
  const [url, setUrl] = useState(initial?.url ?? "");
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(
    initial?.qr_image_url ?? null,
  );

  const previewPayload =
    kind === "paynow" && payeeName && (idKind === "uen" ? uen : mobile)
      ? buildPayNowPayload({
          uen: idKind === "uen" ? uen : undefined,
          mobile: idKind === "mobile" ? mobile : undefined,
          payeeName,
          amountCents: 100,
          reference: "PREVIEW",
        })
      : null;

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="kind" value={kind} />

      <RadioGroup
        value={kind}
        onValueChange={(v) => setKind(v as PaymentConfigKind)}
        className="gap-2.5"
      >
        {KIND_OPTIONS.map(({ k, label: optLabel, hint }) => {
          const selected = kind === k;
          return (
            <label
              key={k}
              className={
                selected
                  ? "flex cursor-pointer items-start gap-3 rounded-xl border border-primary bg-primary/5 px-4 py-3 ring-1 ring-primary/30"
                  : "flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-card px-4 py-3 hover:bg-secondary/50"
              }
            >
              <RadioGroupItem
                value={k}
                aria-label={optLabel}
                className="mt-0.5"
              />
              <span className="min-w-0">
                <span className="block text-sm font-medium">{optLabel}</span>
                <span className="block text-xs text-muted-foreground">
                  {hint}
                </span>
              </span>
            </label>
          );
        })}
      </RadioGroup>

      {kind === "paynow" && (
        <>
          <div className="space-y-2">
            <Label htmlFor="payee_name">Payee name</Label>
            <Input
              id="payee_name"
              name="payee_name"
              value={payeeName}
              onChange={(e) => setPayeeName(e.target.value)}
              placeholder="Kopitiam Cart"
            />
          </div>

          <RadioGroup
            value={idKindTouched ? idKind : ""}
            onValueChange={(v) => {
              setIdKind(v as IdKind);
              setIdKindTouched(true);
            }}
            className="flex gap-4"
          >
            <span className="flex items-center gap-2">
              <RadioGroupItem value="uen" aria-label="Pay via UEN" /> UEN
            </span>
            <span className="flex items-center gap-2">
              <RadioGroupItem value="mobile" aria-label="Pay via mobile" />{" "}
              Mobile
            </span>
          </RadioGroup>

          {idKind === "uen" ? (
            <div className="space-y-2">
              <Label htmlFor="uen">UEN</Label>
              <Input
                id="uen"
                name="uen"
                value={uen}
                onChange={(e) => setUen(e.target.value)}
                placeholder="53312345A"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile</Label>
              <Input
                id="mobile"
                name="mobile"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="+6591234567"
              />
            </div>
          )}

          {previewPayload && (
            <div className="rounded-xl border p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Preview ($1.00 sample QR)
              </p>
              <QRCode value={previewPayload} size={160} />
            </div>
          )}
        </>
      )}

      {kind === "pointer" && (
        <>
          <div className="space-y-2">
            <Label htmlFor="label">Button label</Label>
            <Input
              id="label"
              name="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Pay with PayLah"
            />
          </div>

          <RadioGroup
            value={pointerMode}
            onValueChange={(v) => setPointerMode(v as PointerMode)}
            className="flex gap-4"
          >
            <span className="flex items-center gap-2">
              <RadioGroupItem value="link" aria-label="Use a payment link" />{" "}
              Payment link
            </span>
            <span className="flex items-center gap-2">
              <RadioGroupItem value="qr" aria-label="Use a QR image" /> QR image
            </span>
          </RadioGroup>

          {pointerMode === "link" ? (
            <div className="space-y-2">
              <Label htmlFor="url">Payment link</Label>
              <Input
                id="url"
                name="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://…"
              />
              <p className="text-xs text-muted-foreground">
                Any https link: a Qashier/HitPay/GrabPay checkout, your
                bank&apos;s payment page, or a Stripe Payment Link.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>QR image</Label>
              <ImageUploader
                bucket="vendor-images"
                pathPrefix={vendorId}
                value={qrImageUrl}
                onChange={setQrImageUrl}
              />
              <input
                type="hidden"
                name="qr_image_url"
                value={qrImageUrl ?? ""}
              />
              <p className="text-xs text-muted-foreground">
                A static QR you already have: your GrabPay, PayLah, or bank QR
                code, photographed or screenshotted.
              </p>
            </div>
          )}
        </>
      )}

      {state.status === "error" && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {state.message}
        </p>
      )}
      {state.status === "ok" && (
        <p className="text-sm font-medium text-emerald-600">Saved.</p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save payment config"}
      </Button>
    </form>
  );
}
