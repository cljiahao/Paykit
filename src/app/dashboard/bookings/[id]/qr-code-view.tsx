"use client";

import QRCode from "react-qr-code";

export function QrCodeView({ value }: { value: string }) {
  return <QRCode value={value} size={160} />;
}
