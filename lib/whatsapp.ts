import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  useMultiFileAuthState,
  WASocket,
  Browsers,
} from "@whiskeysockets/baileys";
import pino from "pino";
import QRCode from "qrcode";
import path from "path";
import fs from "fs";

// Suppress internal libsignal cryptographic session dumps from console/terminal logs
if (typeof console !== "undefined") {
  const filterSignalNoise = (orig: (...args: any[]) => void) => {
    return (...args: any[]) => {
      const first = typeof args[0] === "string" ? args[0] : "";
      if (
        first.includes("Closing session") ||
        first.includes("Opening session") ||
        first.includes("Removing old closed session") ||
        first.includes("Migrating session to") ||
        first.includes("SessionEntry")
      ) {
        return; // drop noisy libsignal crypto dumps
      }
      return orig.apply(console, args);
    };
  };

  const g = globalThis as any;
  if (!g.__signalLogFiltered) {
    console.info = filterSignalNoise(console.info);
    console.log = filterSignalNoise(console.log);
    g.__signalLogFiltered = true;
  }
}

export type WhatsAppConnectionStatus = "DISCONNECTED" | "CONNECTING" | "SCAN_QR" | "CONNECTED";

export interface WhatsAppStatusInfo {
  status: WhatsAppConnectionStatus;
  qrDataUrl: string | null;
  qrRaw: string | null;
  pairingCode: string | null;
  connectedPhone: string | null;
  connectedName: string | null;
  connectedJid: string | null;
  lastConnectedAt: string | null;
}

export function formatPhoneToWhatsAppJid(phone?: string | null): string | null {
  if (!phone) return null;
  let digits = String(phone).replace(/[^0-9]/g, "");
  if (!digits) return null;

  // Drop international double zeros (00971... -> 971...)
  if (digits.startsWith("00")) {
    digits = digits.slice(2);
  }

  // UAE local numbers (0501234567 -> 971501234567)
  if (digits.startsWith("05") && digits.length === 10) {
    digits = "971" + digits.slice(1);
  } else if (digits.length === 9 && digits.startsWith("5")) {
    digits = "971" + digits;
  }

  // Pakistan local numbers (03001234567 -> 923001234567)
  if (digits.startsWith("03") && digits.length === 11) {
    digits = "92" + digits.slice(1);
  }

  // Saudi local numbers (0501234567 -> 966501234567)
  if (digits.startsWith("05") && digits.length === 10) {
    digits = "966" + digits.slice(1);
  }

  if (digits.length < 8) return null;

  return `${digits}@s.whatsapp.net`;
}

class WhatsAppServiceImpl {
  private socket: WASocket | null = null;
  private status: WhatsAppConnectionStatus = "DISCONNECTED";
  private qrRaw: string | null = null;
  private qrDataUrl: string | null = null;
  private pairingCode: string | null = null;
  private connectedPhone: string | null = null;
  private connectedName: string | null = null;
  private connectedJid: string | null = null;
  private lastConnectedAt: Date | null = null;

  private reconnectTimer: NodeJS.Timeout | null = null;
  private isInitializing = false;
  private qrResolvers: Array<() => void> = [];
  private hasInitialized = false;

  private authDir = path.resolve(process.cwd(), "data", "whatsapp_auth");

  constructor() {
    this.ensureAuthDir();
  }

  private ensureAuthDir() {
    try {
      if (!fs.existsSync(this.authDir)) {
        fs.mkdirSync(this.authDir, { recursive: true });
      }
    } catch (e: any) {
      console.error("[WhatsApp] Failed to create authDir:", e.message);
    }
  }

  private notifyQrOrConnection(): void {
    const resolvers = [...this.qrResolvers];
    this.qrResolvers = [];
    for (const resolve of resolvers) {
      try {
        resolve();
      } catch {}
    }
  }

  private waitForQrOrConnection(timeoutMs = 12000): Promise<void> {
    if (this.qrDataUrl || this.status === "CONNECTED") {
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      let timer: NodeJS.Timeout | null = null;
      const resolver = () => {
        if (timer) clearTimeout(timer);
        resolve();
      };
      timer = setTimeout(() => {
        const idx = this.qrResolvers.indexOf(resolver);
        if (idx !== -1) this.qrResolvers.splice(idx, 1);
        resolve();
      }, timeoutMs);

      this.qrResolvers.push(resolver);
    });
  }

  /**
   * Auto-bootstraps connection if existing credentials exist in ./data/whatsapp_auth
   */
  public async init() {
    if (this.hasInitialized) return;
    this.hasInitialized = true;

    try {
      this.ensureAuthDir();
      const credsPath = path.join(this.authDir, "creds.json");
      if (fs.existsSync(credsPath)) {
        console.log("[WhatsApp] Found existing credentials, auto-connecting session in background...");
        await this.startConnection({ waitForQr: false });
      } else {
        console.log("[WhatsApp] Standby (No active session credentials stored yet).");
      }
    } catch (err: any) {
      console.error("[WhatsApp] Failed to auto-initialize session:", err);
    }
  }

  /**
   * Starts or restarts the Baileys WebSocket instance to generate QR or reconnect
   */
  public async startConnection(options?: { forceNew?: boolean; waitForQr?: boolean }): Promise<WhatsAppStatusInfo> {
    const shouldWaitForQr = options?.waitForQr !== false;

    // If ongoing handshake is running, wait for it
    if (this.isInitializing) {
      if (shouldWaitForQr && !this.qrDataUrl && this.status !== "CONNECTED") {
        await this.waitForQrOrConnection(10000);
      }
      return this.getStatus();
    }

    if (!options?.forceNew && this.status === "CONNECTED") {
      return this.getStatus();
    }

    if (!options?.forceNew && this.status === "SCAN_QR" && this.qrDataUrl) {
      return this.getStatus();
    }

    if (options?.forceNew) {
      await this.disconnect();
    }

    this.isInitializing = true;
    this.status = "CONNECTING";

    try {
      this.ensureAuthDir();

      const { state, saveCreds } = await useMultiFileAuthState(this.authDir);
      const { version } = await fetchLatestBaileysVersion().catch(() => ({ version: [2, 3000, 1015901307] as any }));

      if (this.socket) {
        try {
          this.socket.ev.removeAllListeners("connection.update");
          this.socket.ev.removeAllListeners("creds.update");
          this.socket.end(undefined);
        } catch {}
        this.socket = null;
      }

      const silentLogger = pino({ level: "silent" }) as any;

      this.socket = makeWASocket({
        version,
        logger: silentLogger,
        printQRInTerminal: false,
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, silentLogger),
        },
        browser: Browsers.windows("Levante Rewards"),
        markOnlineOnConnect: true,
        syncFullHistory: false,
      });

      this.socket.ev.on("creds.update", saveCreds);

      this.socket.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          this.qrRaw = qr;
          try {
            this.qrDataUrl = await QRCode.toDataURL(qr, {
              width: 320,
              margin: 2,
              color: {
                dark: "#0E331E",
                light: "#FFFFFF",
              },
            });
          } catch {
            this.qrDataUrl = null;
          }
          this.status = "SCAN_QR";
          console.log("[WhatsApp] Fresh QR code generated, ready for scanning.");
          this.notifyQrOrConnection();
        }

        if (connection === "close") {
          const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
          const isLoggedOut = statusCode === DisconnectReason.loggedOut;

          console.warn(`[WhatsApp] Connection closed (Status Code: ${statusCode}). Logged out: ${isLoggedOut}`);

          if (isLoggedOut) {
            this.status = "DISCONNECTED";
            this.cleanupAuthFiles();
            this.resetState();
          } else {
            this.status = "CONNECTING";
            if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
            this.reconnectTimer = setTimeout(() => {
              this.startConnection({ waitForQr: false });
            }, 2000);
          }
          this.notifyQrOrConnection();
        } else if (connection === "open") {
          this.status = "CONNECTED";
          this.qrRaw = null;
          this.qrDataUrl = null;
          this.pairingCode = null;

          const user = this.socket?.user;
          this.connectedJid = user?.id || null;
          this.connectedPhone = user?.id ? user.id.split(":")[0].split("@")[0] : null;
          this.connectedName = user?.name || "Levante Loyalty Admin";
          this.lastConnectedAt = new Date();

          console.log(`[WhatsApp] CONNECTED as +${this.connectedPhone} (${this.connectedName})`);
          this.notifyQrOrConnection();
        }
      });

      // Await initial QR code or connection event
      if (shouldWaitForQr && !this.qrDataUrl && (this.status as string) !== "CONNECTED") {
        await this.waitForQrOrConnection(10000);
      }
    } catch (err: any) {
      console.error("[WhatsApp] Error during socket connection start:", err);
      this.status = "DISCONNECTED";
      this.notifyQrOrConnection();
    } finally {
      this.isInitializing = false;
    }

    return this.getStatus();
  }

  /**
   * Helper to wait until the socket WebSocket is open
   */
  private async waitForSocketReady(timeoutMs = 8000): Promise<boolean> {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      if (this.socket && ((this.socket as any).ws?.isOpen || (this.socket as any).ws?.readyState === 1)) {
        return true;
      }
      await new Promise((r) => setTimeout(r, 200));
    }
    return false;
  }

  /**
   * Request an 8-character Pairing Code for phone number linking
   */
  public async requestPairingCode(phoneNumber: string): Promise<string> {
    if (!phoneNumber) throw new Error("Phone number is required");

    let cleanNumber = phoneNumber.replace(/[^0-9]/g, "");
    if (cleanNumber.startsWith("00")) {
      cleanNumber = cleanNumber.slice(2);
    }
    if (cleanNumber.startsWith("05") && cleanNumber.length === 10) {
      cleanNumber = "971" + cleanNumber.slice(1);
    } else if (cleanNumber.length === 9 && cleanNumber.startsWith("5")) {
      cleanNumber = "971" + cleanNumber;
    }
    if (cleanNumber.startsWith("03") && cleanNumber.length === 11) {
      cleanNumber = "92" + cleanNumber.slice(1);
    }

    if (cleanNumber.length < 8) {
      throw new Error("Invalid phone number format. Please provide full phone number with country code.");
    }

    if (this.status === "CONNECTED" && this.socket?.user) {
      throw new Error("WhatsApp is already connected. Disconnect the current session first to pair a new number.");
    }

    await this.disconnect();
    await this.startConnection({ forceNew: true, waitForQr: false });

    await this.waitForSocketReady(8000);
    await new Promise((r) => setTimeout(r, 1200));

    if (!this.socket) {
      throw new Error("WhatsApp engine failed to spawn socket");
    }

    let lastError: any = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const rawCode = await this.socket.requestPairingCode(cleanNumber);
        const formattedCode =
          rawCode && rawCode.length === 8 ? `${rawCode.slice(0, 4)}-${rawCode.slice(4)}` : rawCode;

        this.pairingCode = formattedCode;
        this.status = "SCAN_QR";
        console.log(`[WhatsApp] Pairing Code generated for ${cleanNumber}: ${formattedCode}`);
        return formattedCode;
      } catch (err: any) {
        lastError = err;
        console.warn(`[WhatsApp] Pairing code attempt ${attempt} failed: ${err.message}`);
        if (attempt < 3) {
          await new Promise((r) => setTimeout(r, 1500));
        }
      }
    }

    throw new Error(lastError?.message || "Failed to request pairing code from WhatsApp.");
  }

  /**
   * Disconnects and removes authentication files from disk
   */
  public async disconnect(): Promise<void> {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.socket) {
      try {
        this.socket.ev.removeAllListeners("connection.update");
        this.socket.ev.removeAllListeners("creds.update");
        this.socket.end(undefined);
      } catch {}
      this.socket = null;
    }

    this.cleanupAuthFiles();
    this.resetState();
    console.log("[WhatsApp] Session disconnected and cleared.");
  }

  private cleanupAuthFiles() {
    try {
      if (fs.existsSync(this.authDir)) {
        fs.rmSync(this.authDir, { recursive: true, force: true });
        fs.mkdirSync(this.authDir, { recursive: true });
      }
    } catch (e: any) {
      console.warn("Failed to wipe auth dir:", e.message);
    }
  }

  private resetState() {
    this.status = "DISCONNECTED";
    this.qrRaw = null;
    this.qrDataUrl = null;
    this.pairingCode = null;
    this.connectedPhone = null;
    this.connectedName = null;
    this.connectedJid = null;
    this.lastConnectedAt = null;
  }

  /**
   * Retrieves current status
   */
  public getStatus(): WhatsAppStatusInfo {
    return {
      status: this.status,
      qrDataUrl: this.qrDataUrl,
      qrRaw: this.qrRaw,
      pairingCode: this.pairingCode,
      connectedPhone: this.connectedPhone,
      connectedName: this.connectedName,
      connectedJid: this.connectedJid,
      lastConnectedAt: this.lastConnectedAt ? this.lastConnectedAt.toISOString() : null,
    };
  }

  public isConnected(): boolean {
    return this.status === "CONNECTED" && !!this.socket;
  }

  /**
   * Sends a plain text message to any phone number
   */
  public async sendMessage(
    phoneNumber: string,
    message: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (this.status !== "CONNECTED" || !this.socket) {
        return { success: false, error: "WhatsApp is not connected" };
      }

      const jid = formatPhoneToWhatsAppJid(phoneNumber);
      if (!jid) {
        return { success: false, error: "Invalid phone number format" };
      }

      const res = await this.socket.sendMessage(jid, { text: message });
      const msgId = res?.key?.id || undefined;
      console.log(`[WhatsApp] Message successfully dispatched to ${jid}`);
      return { success: true, messageId: msgId };
    } catch (err: any) {
      console.error(`[WhatsApp] Failed to dispatch message to ${phoneNumber}:`, err);
      return { success: false, error: err.message || "Failed to dispatch WhatsApp message" };
    }
  }
}

// Global singleton to persist WhatsApp socket across Next.js API reloads
const globalForWhatsApp = globalThis as unknown as {
  __loyaltyWhatsAppService?: WhatsAppServiceImpl;
};

export const WhatsAppService: WhatsAppServiceImpl =
  globalForWhatsApp.__loyaltyWhatsAppService || new WhatsAppServiceImpl();

if (process.env.NODE_ENV !== "production") {
  globalForWhatsApp.__loyaltyWhatsAppService = WhatsAppService;
}

// Auto-trigger background restore if credentials exist
WhatsAppService.init().catch(() => {});
