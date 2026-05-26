"use client";

import { QRCodeSVG } from "qrcode.react";

export default function TotpQr({ uri }: { uri: string }) {
  return (
    <div className="inline-block rounded border bg-white p-3">
      <QRCodeSVG value={uri} size={180} level="M" />
    </div>
  );
}
