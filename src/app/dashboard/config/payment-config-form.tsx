"use client";

import { useActionState, useState } from "react";
import Image from "next/image";
import QRCode from "react-qr-code";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ImageUploader } from "@merqo/ui";
import { uploadPaykitImage } from "@/lib/image-upload-adapter";
import { resizeToWebp } from "@/lib/image-resize";
import { buildPayNowPayload } from "@/lib/payments/paynow";
import { saveConfigAction, type SaveConfigState } from "./actions";
import {
  POINTER_PRESETS,
  POINTER_PRESET_ORDER,
  derivePointerPreset,
  type PointerPresetId,
} from "./pointer-presets";
import type { PaymentConfigKind, VendorPaymentConfig } from "@/lib/types";

type IdKind = "uen" | "mobile";
type PointerMode = "link" | "qr";

function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

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
  const [preset, setPreset] = useState<PointerPresetId>(() =>
    initial?.kind === "pointer" ? derivePointerPreset(initial) : "stripe",
  );
  // A brand-new config lands on the default preset's suggested label.
  const [label, setLabel] = useState(
    initial?.label ?? POINTER_PRESETS[preset].labelSuggestion,
  );
  // Tracks a vendor-typed label so a preset switch never clobbers it.
  const [labelTouched, setLabelTouched] = useState(Boolean(initial?.label));
  const [url, setUrl] = useState(initial?.url ?? "");
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(
    initial?.qr_image_url ?? null,
  );

  function handlePresetChange(id: PointerPresetId) {
    setPreset(id);
    const next = POINTER_PRESETS[id];
    if (next.mode !== "choice") {
      setPointerMode(next.mode);
    }
    if (!labelTouched) {
      setLabel(next.labelSuggestion);
    }
  }

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
            <Label>Preset</Label>
            <RadioGroup
              value={preset}
              onValueChange={(v) => handlePresetChange(v as PointerPresetId)}
              className="grid grid-cols-2 gap-2.5"
            >
              {POINTER_PRESET_ORDER.map((id) => {
                const p = POINTER_PRESETS[id];
                const selected = preset === id;
                return (
                  <label
                    key={id}
                    className={
                      selected
                        ? "flex cursor-pointer items-start gap-2 rounded-xl border border-primary bg-primary/5 px-3 py-2.5 ring-1 ring-primary/30"
                        : "flex cursor-pointer items-start gap-2 rounded-xl border border-border bg-card px-3 py-2.5 hover:bg-secondary/50"
                    }
                  >
                    <RadioGroupItem
                      value={id}
                      aria-label={p.cardLabel}
                      className="mt-0.5"
                    />
                    <span className="text-sm font-medium">{p.cardLabel}</span>
                  </label>
                );
              })}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="label">Button label</Label>
            <Input
              id="label"
              name="label"
              value={label}
              onChange={(e) => {
                setLabel(e.target.value);
                setLabelTouched(true);
              }}
              placeholder="Pay with PayLah"
            />
          </div>

          {preset === "other" && (
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
                <RadioGroupItem value="qr" aria-label="Use a QR image" /> QR
                image
              </span>
            </RadioGroup>
          )}

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
                {POINTER_PRESETS[preset].instructions}
              </p>
              {POINTER_PRESETS[preset].urlPattern &&
                url &&
                !POINTER_PRESETS[preset].urlPattern!.test(url) && (
                  <p className="text-xs font-medium text-amber-600 dark:text-amber-500">
                    {POINTER_PRESETS[preset].urlWarning}
                  </p>
                )}
              {isValidHttpUrl(url) && (
                <a
                  // Re-serialized through URL rather than the raw input: an
                  // explicit sanitizing step CodeQL's dataflow can see,
                  // on top of isValidHttpUrl's existing http(s)-only guard.
                  href={new URL(url).href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary underline-offset-4 hover:underline"
                >
                  Open link
                  <ExternalLink className="size-3" />
                </a>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Label>QR image</Label>
              <ImageUploader
                bucket="vendor-images"
                pathPrefix={vendorId}
                value={qrImageUrl}
                onChange={setQrImageUrl}
                onUpload={uploadPaykitImage}
                resizeImage={resizeToWebp}
                imageComponent={Image}
                variant="thumb"
              />
              <input
                type="hidden"
                name="qr_image_url"
                value={qrImageUrl ?? ""}
              />
              <p className="text-xs text-muted-foreground">
                {POINTER_PRESETS[preset].instructions}
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
        <p className="text-sm font-medium text-mint">Saved.</p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save payment config"}
      </Button>
    </form>
  );
}
