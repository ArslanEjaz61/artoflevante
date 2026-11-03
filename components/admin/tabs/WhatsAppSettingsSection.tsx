"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  MessageSquare,
  QrCode,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Power,
  Send,
  Loader2,
  Copy,
  Check,
  Zap,
} from "lucide-react";

interface WhatsAppStatusData {
  status: "DISCONNECTED" | "CONNECTING" | "SCAN_QR" | "CONNECTED";
  qrDataUrl: string | null;
  pairingCode: string | null;
  connectedPhone: string | null;
  connectedName: string | null;
  connectedJid: string | null;
  lastConnectedAt: string | null;
}

export default function WhatsAppSettingsSection() {
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [statusData, setStatusData] = useState<WhatsAppStatusData>({
    status: "DISCONNECTED",
    qrDataUrl: null,
    pairingCode: null,
    connectedPhone: null,
    connectedName: null,
    connectedJid: null,
    lastConnectedAt: null,
  });

  // Pairing code mode
  const [linkMode, setLinkMode] = useState<"qr" | "code">("qr");
  const [pairingPhone, setPairingPhone] = useState("");
  const [pairingLoading, setPairingLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Test message
  const [testPhone, setTestPhone] = useState("");
  const [testMessage, setTestMessage] = useState("");
  const [testSending, setTestSending] = useState(false);
  const [testAlert, setTestAlert] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Determine overall connecting state (local action or server status)
  const isConnecting = connecting || statusData.status === "CONNECTING";

  // Fetch status
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/whatsapp/status");
      const d = await res.json();
      if (res.ok && d.ok) {
        setStatusData({
          status: d.status,
          qrDataUrl: d.qrDataUrl,
          pairingCode: d.pairingCode,
          connectedPhone: d.connectedPhone,
          connectedName: d.connectedName,
          connectedJid: d.connectedJid,
          lastConnectedAt: d.lastConnectedAt,
        });
      }
    } catch (e: any) {
      console.error("Failed to fetch WhatsApp status:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll status when scanning QR or connecting
  useEffect(() => {
    fetchStatus();

    const interval = setInterval(() => {
      // Poll if waiting for QR scan or connecting
      if (statusData.status === "SCAN_QR" || statusData.status === "CONNECTING" || connecting) {
        fetchStatus();
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [fetchStatus, statusData.status, connecting]);

  // Connect / Generate QR
  const handleConnect = async () => {
    setConnecting(true);
    setTestAlert(null);
    try {
      const res = await fetch("/api/admin/whatsapp/connect", { method: "POST" });
      const d = await res.json();
      if (res.ok && d.ok) {
        setStatusData({
          status: d.status,
          qrDataUrl: d.qrDataUrl,
          pairingCode: d.pairingCode,
          connectedPhone: d.connectedPhone,
          connectedName: d.connectedName,
          connectedJid: d.connectedJid,
          lastConnectedAt: d.lastConnectedAt,
        });
      } else {
        alert(d.error || "Failed to start WhatsApp connection");
      }
    } catch (err: any) {
      alert(err.message || "Network error");
    } finally {
      setConnecting(false);
    }
  };

  // Disconnect
  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect this WhatsApp session? OTPs will stop going via WhatsApp until reconnected.")) {
      return;
    }
    setDisconnecting(true);
    setTestAlert(null);
    try {
      const res = await fetch("/api/admin/whatsapp/disconnect", { method: "POST" });
      if (res.ok) {
        await fetchStatus();
      }
    } catch (err: any) {
      alert(err.message || "Failed to disconnect");
    } finally {
      setDisconnecting(false);
    }
  };

  // Request Pairing Code
  const handleRequestPairingCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pairingPhone.trim()) return;
    setPairingLoading(true);
    setTestAlert(null);
    try {
      const res = await fetch("/api/admin/whatsapp/pairing-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: pairingPhone.trim() }),
      });
      const d = await res.json();
      if (res.ok && d.ok && d.pairingCode) {
        setStatusData((prev) => ({ ...prev, pairingCode: d.pairingCode, status: "SCAN_QR" }));
      } else {
        alert(d.error || "Failed to generate pairing code");
      }
    } catch (err: any) {
      alert(err.message || "Failed to request code");
    } finally {
      setPairingLoading(false);
    }
  };

  // Send Test Message
  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhone.trim()) return;
    setTestSending(true);
    setTestAlert(null);
    try {
      const res = await fetch("/api/admin/whatsapp/send-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: testPhone.trim(),
          message: testMessage.trim() || undefined,
        }),
      });
      const d = await res.json();
      if (res.ok && d.ok) {
        setTestAlert({ type: "ok", text: "WhatsApp test message delivered successfully!" });
        setTestMessage("");
      } else {
        setTestAlert({ type: "err", text: d.error || "Failed to send test message" });
      }
    } catch (err: any) {
      setTestAlert({ type: "err", text: err.message || "Network error" });
    } finally {
      setTestSending(false);
    }
  };

  const copyPairingCode = () => {
    if (!statusData.pairingCode) return;
    navigator.clipboard.writeText(statusData.pairingCode.replace("-", ""));
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="bg-white border border-[#EAE3DC] rounded-2xl sm:rounded-3xl p-4 sm:p-7 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EAE3DC] pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#0E331E]/10 text-[#0E331E] border border-[#0E331E]/20 flex items-center justify-center font-bold shadow-xs shrink-0">
            <MessageSquare className="w-6 h-6 text-[#0E331E]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-black tracking-tight text-[#1E1815]">
                WhatsApp &amp; OTP Engine
              </h3>
              {statusData.status === "CONNECTED" ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-black uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live Connected
                </span>
              ) : statusData.status === "SCAN_QR" ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-black uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  Waiting for Link
                </span>
              ) : isConnecting ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-black uppercase tracking-wider">
                  <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                  Connecting...
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-stone-100 text-[#7A6E67] border border-[#EAE3DC] text-[11px] font-black uppercase tracking-wider">
                  Offline / Disconnected
                </span>
              )}
            </div>
            <p className="text-xs text-[#7A6E67] font-medium mt-1">
              Direct self-hosted WhatsApp Gateway. Delivers instant verification codes to customer phones at 0 per-message cost.
            </p>
          </div>
        </div>

        {/* Global Action Button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={fetchStatus}
            disabled={loading}
            className="p-2.5 rounded-xl border border-[#EAE3DC] text-[#7A6E67] hover:bg-[#FAF7F4] hover:text-[#1E1815] transition cursor-pointer"
            title="Refresh Status"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          {statusData.status === "CONNECTED" ? (
            <button
              type="button"
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 text-xs font-bold transition cursor-pointer"
            >
              <Power className="w-4 h-4" />
              <span>{disconnecting ? "Disconnecting..." : "Disconnect WhatsApp"}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleConnect}
              disabled={isConnecting}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0E331E] hover:bg-[#0F662D] text-white shadow-sm text-xs font-bold transition cursor-pointer disabled:opacity-50"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-white" />
                  <span>{statusData.status === "SCAN_QR" ? "Regenerate QR" : "Connect WhatsApp"}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {statusData.status === "CONNECTED" ? (
        /* CONNECTED STATE DASHBOARD */
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-50/50 to-transparent border border-emerald-500/20 rounded-2xl p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-600/20 shrink-0">
                  <Smartphone className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-black text-emerald-800 uppercase tracking-wider">
                      Active Sender
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  </div>
                  <h4 className="text-lg sm:text-xl font-mono font-black text-[#1E1815] mt-0.5">
                    +{statusData.connectedPhone}
                  </h4>
                  <p className="text-xs text-[#7A6E67] font-semibold mt-0.5">
                    {statusData.connectedName || "Morango Loyalty Verified Number"}
                  </p>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-xs border border-emerald-200/60 rounded-xl px-4 py-3 text-right sm:text-right">
                <p className="text-[11px] font-black text-[#7A6E67] uppercase tracking-wider">Routing Priority</p>
                <p className="text-xs font-black text-emerald-800 mt-0.5 flex items-center gap-1.5 justify-start sm:justify-end">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Primary OTP Channel 
                </p>
              </div>
            </div>
          </div>

          {/* Test Sender Utility */}
          <div className="bg-[#FAF7F4] border border-[#EAE3DC] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Send className="w-4 h-4 text-[#0E331E]" />
              <h4 className="font-extrabold text-sm text-[#1E1815]">Send Live WhatsApp Test Message</h4>
            </div>
            <p className="text-xs text-[#7A6E67] mb-4">
              Send a test message to your personal mobile number to ensure WhatsApp delivery and socket latency are optimal.
            </p>

            {testAlert && (
              <div
                className={`p-3.5 rounded-xl text-xs font-bold mb-4 flex items-center gap-2 ${
                  testAlert.type === "ok"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}
              >
                {testAlert.type === "ok" ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                )}
                <span>{testAlert.text}</span>
              </div>
            )}

            <form onSubmit={handleSendTest} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black text-[#1E1815] uppercase tracking-wider mb-1">
                    Recipient Mobile Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. +971 50 123 4567 or +92 300 1234567"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-white border border-[#EAE3DC] rounded-xl text-xs font-mono font-bold text-[#1E1815] focus:outline-none focus:border-[#0E331E]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-[#1E1815] uppercase tracking-wider mb-1">
                    Message Body (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Morango Loyalty test verification message..."
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#EAE3DC] rounded-xl text-xs text-[#1E1815] focus:outline-none focus:border-[#0E331E]"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={testSending || !testPhone.trim()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0E331E] hover:bg-[#0F662D] text-white text-xs font-bold transition disabled:opacity-50 cursor-pointer shadow-sm"
              >
                {testSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>{testSending ? "Sending..." : "Send Test WhatsApp Message"}</span>
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* DISCONNECTED / SCAN QR STATE */
        <div className="space-y-6">
          {/* Link Mode Switcher */}
          <div className="flex items-center gap-2 border-b border-[#EAE3DC] pb-3">
            <button
              type="button"
              onClick={() => setLinkMode("qr")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                linkMode === "qr"
                  ? "bg-[#0E331E] text-white shadow-xs"
                  : "bg-[#FAF7F4] text-[#7A6E67] hover:text-[#1E1815]"
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Link with QR Code</span>
            </button>
            <button
              type="button"
              onClick={() => setLinkMode("code")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                linkMode === "code"
                  ? "bg-[#0E331E] text-white shadow-xs"
                  : "bg-[#FAF7F4] text-[#7A6E67] hover:text-[#1E1815]"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Link with Phone Number Code</span>
            </button>
          </div>

          {linkMode === "qr" ? (
            /* QR SCAN VIEW */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* QR Display */}
              <div className="flex flex-col items-center justify-center p-6 bg-[#FAF7F4] border border-[#EAE3DC] rounded-2xl min-h-[300px]">
                {statusData.status === "SCAN_QR" && statusData.qrDataUrl ? (
                  <div className="text-center space-y-3">
                    <div className="p-3 bg-white rounded-2xl border border-[#EAE3DC] shadow-sm inline-block">
                      <img
                        src={statusData.qrDataUrl}
                        alt="WhatsApp QR Code"
                        className="w-56 h-56 sm:w-64 sm:h-64 object-contain mx-auto"
                      />
                    </div>
                    <p className="text-[11px] font-mono font-bold text-[#7A6E67] flex items-center justify-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Auto-refreshes automatically. Scan with WhatsApp camera.
                    </p>
                  </div>
                ) : isConnecting ? (
                  <div className="text-center py-12 space-y-3">
                    <div className="w-16 h-16 rounded-full bg-[#0E331E]/10 text-[#0E331E] flex items-center justify-center mx-auto mb-2 shadow-2xs">
                      <Loader2 className="w-8 h-8 animate-spin text-[#0E331E]" />
                    </div>
                    <h4 className="text-base font-black text-[#1E1815]">Connecting to WhatsApp...</h4>
                    <p className="text-xs text-[#7A6E67] max-w-xs mx-auto">
                      Establishing secure WebSocket link. Your QR code or session is syncing...
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-10 space-y-4">
                    <div className="w-16 h-16 rounded-3xl bg-[#FAF7F4] border border-[#EAE3DC] flex items-center justify-center mx-auto text-[#7A6E67]">
                      <QrCode className="w-8 h-8 opacity-40" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-[#1E1815]">No Active QR Code</h4>
                      <p className="text-xs text-[#7A6E67] max-w-xs mx-auto mt-1">
                        Click below to generate a fresh QR code and link your business phone.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleConnect}
                      disabled={isConnecting}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0E331E] hover:bg-[#0F662D] text-white font-bold text-xs transition cursor-pointer shadow-sm disabled:opacity-50"
                    >
                      <Zap className="w-4 h-4 fill-white" />
                      <span>Generate QR Code</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div className="space-y-4">
                <h4 className="font-display font-black text-base text-[#1E1815]">
                  How to link WhatsApp in 3 quick steps:
                </h4>
                <div className="space-y-3 text-xs text-[#4A3F39]">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-[#FAF7F4] border border-[#EAE3DC]">
                    <span className="w-6 h-6 rounded-full bg-[#0E331E] text-white flex items-center justify-center font-black text-xs shrink-0">
                      1
                    </span>
                    <div>
                      <strong className="text-[#1E1815]">Open WhatsApp</strong> on your Android phone or iPhone.
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-[#FAF7F4] border border-[#EAE3DC]">
                    <span className="w-6 h-6 rounded-full bg-[#0E331E] text-white flex items-center justify-center font-black text-xs shrink-0">
                      2
                    </span>
                    <div>
                      Tap <strong>Settings (or 3 dots)</strong> &rarr; <strong>Linked Devices</strong> &rarr;{" "}
                      <strong>Link a Device</strong>.
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-[#FAF7F4] border border-[#EAE3DC]">
                    <span className="w-6 h-6 rounded-full bg-[#0E331E] text-white flex items-center justify-center font-black text-xs shrink-0">
                      3
                    </span>
                    <div>
                      Point your phone camera at this QR code. Once scanned, your phone links instantly!
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/60 text-[11px] text-amber-900 leading-relaxed">
                  <strong>Tip:</strong> Session keys are securely saved on your server (<code>./data/whatsapp_auth</code>).
                  Once paired, the connection stays alive and reconnects automatically across server restarts.
                </div>
              </div>
            </div>
          ) : (
            /* PAIRING CODE VIEW */
            <div className="max-w-xl mx-auto p-6 bg-[#FAF7F4] border border-[#EAE3DC] rounded-2xl space-y-5">
              <div>
                <h4 className="font-extrabold text-sm text-[#1E1815]">Link with 8-Digit Pairing Code</h4>
                <p className="text-xs text-[#7A6E67] mt-1">
                  If your phone camera is blurry or you prefer entering a code on your phone, enter your phone number below.
                </p>
              </div>

              <form onSubmit={handleRequestPairingCode} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-black text-[#1E1815] uppercase tracking-wider mb-1">
                    Your WhatsApp Phone Number (with Country Code)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. +971501234567 or +923001234567"
                      value={pairingPhone}
                      onChange={(e) => setPairingPhone(e.target.value)}
                      required
                      className="flex-1 px-3.5 py-2.5 bg-white border border-[#EAE3DC] rounded-xl text-xs font-mono font-bold text-[#1E1815] focus:outline-none focus:border-[#0E331E]"
                    />
                    <button
                      type="submit"
                      disabled={pairingLoading || !pairingPhone.trim()}
                      className="px-4 py-2.5 rounded-xl bg-[#0E331E] hover:bg-[#0F662D] text-white text-xs font-bold transition disabled:opacity-50 cursor-pointer shrink-0 shadow-sm"
                    >
                      {pairingLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Get Code"}
                    </button>
                  </div>
                </div>
              </form>

              {statusData.pairingCode && (
                <div className="bg-white border border-emerald-300 rounded-xl p-4 text-center space-y-2">
                  <span className="text-[10px] font-mono font-black text-emerald-800 uppercase tracking-widest">
                    Enter this code on your phone
                  </span>
                  <div className="flex items-center justify-center gap-2">
                    <span className="font-mono text-2xl font-black text-[#1E1815] tracking-widest bg-emerald-50 px-4 py-1.5 rounded-lg border border-emerald-200">
                      {statusData.pairingCode}
                    </span>
                    <button
                      type="button"
                      onClick={copyPairingCode}
                      className="p-2 rounded-lg border border-[#EAE3DC] hover:bg-[#FAF7F4] text-[#7A6E67] cursor-pointer"
                      title="Copy code"
                    >
                      {copiedCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-[#7A6E67]">
                    On WhatsApp: <strong>Settings &rarr; Linked Devices &rarr; Link with phone number instead</strong>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
