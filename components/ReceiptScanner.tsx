"use client";

import { useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { Camera, ImageUp, ScanLine, X, CheckCircle2, AlertCircle, RotateCcw, ReceiptText, Gift, Loader2 } from "lucide-react";

/**
 * "Scan your receipt" card for the customer dashboard.
 *
 * The phone camera opens through a plain file input (capture="environment"), so it works in the
 * browser and in the installed app on both iOS and Android without asking for camera permission
 * up front. The photo is shrunk in the browser, read on the server (/api/receipts/scan), shown back
 * for the customer to confirm, then claimed (/api/receipts/claim).
 */

type Scan = {
  receipt: { invoiceNumber: string; total: number; currency: string; date: string | null; outletText: string | null };
  branch: { id: string; name: string; city?: string | null } | null;
  branches: { id: string; name: string; city?: string | null }[];
  pointsToEarn: number;
  claimToken: string;
};

type Phase =
  | { step: "closed" }
  | { step: "reading"; photo: string }
  | { step: "review"; photo: string; scan: Scan }
  | { step: "claiming"; photo: string; scan: Scan }
  | { step: "done"; result: any }
  | { step: "error"; photo: string | null; message: string };

const MAX_SIDE = 1600;

/** Downscales the photo to a JPEG the server (and nginx) will happily take. */
async function shrinkPhoto(file: File): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("That file is not a photo we can open."));
      el.src = url;
    });
    const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not prepare the photo.");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not prepare the photo."))), "image/jpeg", 0.82)
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}

function formatDate(d: string | null) {
  if (!d) return "Not printed";
  return new Date(`${d}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function ReceiptScanner({ onClaimed }: { onClaimed: () => void }) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>({ step: "closed" });
  const [branchId, setBranchId] = useState("");

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // lets the same photo be picked again after a retake
    if (!file) return;

    let photo = "";
    try {
      const blob = await shrinkPhoto(file);
      photo = URL.createObjectURL(blob);
      setPhase({ step: "reading", photo });
      setBranchId("");

      const form = new FormData();
      form.append("image", blob, "receipt.jpg");
      const r = await fetch("/api/receipts/scan", { method: "POST", body: form });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Could not read the receipt.");
      setPhase({ step: "review", photo, scan: d });
    } catch (err: any) {
      setPhase({ step: "error", photo: photo || null, message: String(err?.message || err) });
    }
  }

  async function claim(photo: string, scan: Scan) {
    if (!scan.branch && !branchId) return;
    setPhase({ step: "claiming", photo, scan });
    try {
      const r = await fetch("/api/receipts/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claimToken: scan.claimToken, branchId: scan.branch ? undefined : branchId }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Could not add the points.");
      setPhase({ step: "done", result: d });
      onClaimed();
    } catch (err: any) {
      setPhase({ step: "error", photo, message: String(err?.message || err) });
    }
  }

  function close() {
    if (phase.step === "reading" || phase.step === "claiming") return;
    setPhase({ step: "closed" });
  }

  const retake = () => cameraRef.current?.click();

  return (
    <>
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
      <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

      {/* the card on the dashboard */}
      <div className="rounded-3xl bg-white shadow-sm mb-4 overflow-hidden border border-[#0E331E]/10">
        <div className="px-4.5 sm:px-6 pt-4 pb-3.5 flex items-center gap-3.5">
          <div className="relative w-12 h-12 rounded-2xl bg-[#0E331E] text-[#F5EFE0] flex items-center justify-center shrink-0 shadow-md shadow-[#0E331E]/25">
            <ReceiptText className="w-6 h-6" />
            <ScanLine className="w-4 h-4 absolute -right-1 -bottom-1 bg-[#CC8820] text-white rounded-md p-0.5" />
          </div>
          <div className="min-w-0">
            <div className="font-display font-extrabold text-[#0E331E] text-[17px] sm:text-[19px] leading-tight">Scan your receipt</div>
            <p className="font-display text-[12.5px] sm:text-[13.5px] text-[#8A7F7C] leading-snug mt-0.5">
              Snap your Levante bill and the points land in your account.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 px-4.5 sm:px-6 pb-4">
          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            className="bg-[#0E331E] hover:bg-[#0A2617] text-[#F5EFE0] rounded-2xl py-3 px-3 font-display font-bold text-[14.5px] flex items-center justify-center gap-2 transition-colors cursor-pointer active:scale-[0.99]"
          >
            <Camera className="w-[18px] h-[18px] shrink-0" />
            Open camera
          </button>
          <button
            type="button"
            onClick={() => galleryRef.current?.click()}
            className="bg-[#FAF7F4] hover:bg-[#F3ECE6] text-[#0E331E] rounded-2xl py-3 px-3 font-display font-bold text-[14.5px] flex items-center justify-center gap-2 transition-colors cursor-pointer active:scale-[0.99] border border-[#0E331E]/15"
          >
            <ImageUp className="w-[18px] h-[18px] shrink-0" />
            Upload photo
          </button>
        </div>
      </div>

      {phase.step !== "closed" && (
        <div className="fixed inset-0 z-[80] bg-black/55 backdrop-blur-[2px] flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={close}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Scan receipt"
            className="w-full sm:max-w-[420px] max-h-[92dvh] overflow-y-auto bg-[#FFFBF5] rounded-t-[28px] sm:rounded-[28px] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <div className="font-display font-extrabold text-[#0E331E] text-[17px]">
                {phase.step === "done" ? "Points added" : phase.step === "error" ? "Couldn't use this receipt" : "Your receipt"}
              </div>
              {phase.step !== "reading" && phase.step !== "claiming" && (
                <button type="button" onClick={close} className="w-9 h-9 rounded-full hover:bg-black/5 flex items-center justify-center cursor-pointer" aria-label="Close">
                  <X className="w-5 h-5 text-[#4A3F39]" />
                </button>
              )}
            </div>

            {/* photo with a scan sweep while it is being read */}
            {"photo" in phase && phase.photo && (
              <div className="mx-5 mb-3 relative rounded-2xl overflow-hidden bg-[#172A1D] h-[34dvh] max-h-[300px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={phase.photo} alt="Your receipt" className="w-full h-full object-contain" />
                {phase.step === "reading" && (
                  <>
                    <div className="absolute inset-0 bg-[#0E331E]/15" />
                    <div className="bc-receipt-sweep" />
                  </>
                )}
              </div>
            )}

            <div className="px-5 pb-5" aria-live="polite">
              {phase.step === "reading" && (
                <div className="flex items-center gap-2.5 py-3 font-display font-bold text-[#4A3F39]">
                  <Loader2 className="w-5 h-5 animate-spin text-[#0E331E]" />
                  Reading your bill…
                </div>
              )}

              {(phase.step === "review" || phase.step === "claiming") && (
                <>
                  <div className="mb-3 px-3.5 py-2.5 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Levante Receipt Verified</span>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white border border-[#0E331E]/10 divide-y divide-[#0E331E]/8 font-display text-[14px]">
                    <Row label="Invoice #" value={<span className="font-mono font-bold">{phase.scan.receipt.invoiceNumber}</span>} />
                    <Row label="Date" value={formatDate(phase.scan.receipt.date)} />
                    <Row
                      label="Outlet"
                      value={
                        phase.scan.branch ? (
                          phase.scan.branch.name
                        ) : (
                          <select
                            value={branchId}
                            onChange={(e) => setBranchId(e.target.value)}
                            className="max-w-[190px] bg-[#FAF7F4] border border-[#0E331E]/20 rounded-lg px-2 py-1.5 text-[13px] font-semibold text-[#221C1A]"
                            aria-label="Choose the outlet"
                          >
                            <option value="">Choose outlet…</option>
                            {phase.scan.branches.map((b) => (
                              <option key={b.id} value={b.id}>
                                {b.name}
                              </option>
                            ))}
                          </select>
                        )
                      }
                    />
                    <Row
                      label="Total paid"
                      value={
                        <span className="font-extrabold text-[#221C1A] text-[16px]">
                          {phase.scan.receipt.currency} {phase.scan.receipt.total.toFixed(2)}
                        </span>
                      }
                    />
                  </div>

                  <div className="mt-3 rounded-2xl bg-[#0E331E] text-[#F5EFE0] px-4 py-3 flex items-center justify-between">
                    <div>
                      <span className="font-display font-bold text-[14px] block">You&apos;ll earn</span>
                      <span className="text-[11px] text-[#F5EFE0]/80 font-medium">+1 Visit Stamp included</span>
                    </div>
                    <span className="font-display font-extrabold text-[#F2C76B] text-[26px] leading-none">+{phase.scan.pointsToEarn} pts</span>
                  </div>

                  {!phase.scan.branch && (
                    <p className="text-[12px] text-[#8A7F7C] mt-2 font-display">We couldn&apos;t tell which outlet this bill is from. Please pick it above.</p>
                  )}

                  <div className="grid grid-cols-[auto_1fr] gap-2 mt-4">
                    <button
                      type="button"
                      onClick={retake}
                      disabled={phase.step === "claiming"}
                      className="px-4 py-3 rounded-2xl border border-[#0E331E]/20 text-[#0E331E] font-display font-bold text-[14px] flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <RotateCcw className="w-4 h-4" /> Retake
                    </button>
                    <button
                      type="button"
                      onClick={() => claim(phase.photo, phase.scan)}
                      disabled={phase.step === "claiming" || (!phase.scan.branch && !branchId)}
                      className="py-3 rounded-2xl bg-[#CC8820] hover:bg-[#b5781b] text-white font-display font-extrabold text-[15px] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 transition-colors"
                    >
                      {phase.step === "claiming" ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                      {phase.step === "claiming" ? "Claiming visit & points…" : `Add ${phase.scan.pointsToEarn} pts + 1 Visit`}
                    </button>
                  </div>
                  <p className="text-[11px] text-[#8A7F7C] mt-2.5 font-display text-center">
                    Numbers wrong? Retake the photo flat and in good light.
                  </p>
                </>
              )}

              {phase.step === "done" && (
                <div className="text-center pt-2 pb-1">
                  <div className="bc-receipt-pop mx-auto w-20 h-20 rounded-full bg-[#0E331E] flex items-center justify-center shadow-lg shadow-[#0E331E]/30">
                    <CheckCircle2 className="w-11 h-11 text-[#F2C76B]" />
                  </div>
                  <div className="font-display font-extrabold text-[#CC8820] text-[36px] sm:text-[40px] leading-none mt-4">
                    +{phase.result.transaction?.pointsEarned ?? 0} pts
                  </div>
                  <div className="font-display font-bold text-[#0E331E] text-[15px] mt-1">
                    Points &amp; +1 Visit Stamp Added!
                  </div>
                  <p className="font-display text-[13px] text-[#4A3F39] mt-2">
                    Invoice #{phase.result.transaction?.invoiceNumber} · {phase.result.transaction?.branchName}
                  </p>
                  <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-[#FAF2E2] px-3.5 py-1.5 font-display text-[12.5px] font-bold text-[#8A5600]">
                      Points: {phase.result.customer?.pointsBalance ?? "—"} pts
                    </div>
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 px-3.5 py-1.5 font-display text-[12.5px] font-bold text-emerald-800">
                      Total Visits: {phase.result.customer?.visitCount ?? "—"} visits
                    </div>
                  </div>
                  {phase.result.newRewards?.length > 0 && (
                    <div className="mt-3 rounded-2xl border-2 border-[#E5A93C] bg-[#FFF8EA] p-3 text-left">
                      {phase.result.newRewards.map((r: any) => (
                        <div key={r.id} className="flex items-center gap-2 font-display text-[13.5px] font-bold text-[#8A5600]">
                          <Gift className="w-4 h-4 shrink-0" /> Unlocked: {r.name}
                        </div>
                      ))}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={close}
                    className="w-full mt-5 py-3 rounded-2xl bg-[#0E331E] text-[#F5EFE0] font-display font-extrabold text-[15px] cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              )}

              {phase.step === "error" && (
                <>
                  <div className="flex items-start gap-2.5 rounded-2xl bg-[#FBEDEA] border border-[#0E331E]/15 p-3.5 font-display text-[14px] text-[#0A2617]">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-px" />
                    <span>{phase.message}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <button
                      type="button"
                      onClick={close}
                      className="py-3 rounded-2xl border border-[#0E331E]/20 text-[#0E331E] font-display font-bold text-[14px] cursor-pointer"
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      onClick={retake}
                      className="py-3 rounded-2xl bg-[#0E331E] text-[#F5EFE0] font-display font-bold text-[14px] flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Camera className="w-4 h-4" /> Try again
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5">
      <span className="text-[#8A7F7C] font-semibold">{label}</span>
      <span className="text-[#221C1A] font-semibold text-right">{value}</span>
    </div>
  );
}
