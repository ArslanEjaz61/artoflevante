import forge from "node-forge";

/**
 * Apple Wallet signing material, read from env.
 *
 *   APPLE_PASS_CERT            Pass Type ID certificate (PEM)
 *   APPLE_PASS_KEY             Its private key (PEM, may be encrypted)
 *   APPLE_PASS_KEY_PASSPHRASE  Passphrase for the key, if encrypted (optional)
 *   APPLE_WWDR_CERT            Apple WWDR intermediate certificate, G4 (PEM)
 *
 * PEM values may be stored with literal "\n" sequences or base64-encoded as a whole.
 */
export interface ApplePassSigner {
  passTypeIdentifier: string;
  teamIdentifier: string;
  /** Same certificate/key, used as the TLS client identity for Apple push (APNs). */
  tls: { cert: string; key: string; passphrase?: string };
  sign(manifest: Buffer): Buffer;
}

function readPem(name: string): string | null {
  const raw = process.env[name]?.trim();
  if (!raw) return null;
  if (raw.includes("-----BEGIN")) return raw.replace(/\\n/g, "\n");
  const decoded = Buffer.from(raw, "base64").toString("utf8");
  return decoded.includes("-----BEGIN") ? decoded : null;
}

function subjectField(cert: forge.pki.Certificate, shortNameOrOid: string): string | undefined {
  const attr = cert.subject.attributes.find(
    (a) => a.shortName === shortNameOrOid || a.type === shortNameOrOid || a.name === shortNameOrOid
  );
  return attr?.value ? String(attr.value) : undefined;
}

let cached: { signer: ApplePassSigner | null; error: string | null } | undefined;

/** Returns a signer, or an error describing what is missing/wrong. Result is cached per process. */
export function getApplePassSigner(): { signer: ApplePassSigner | null; error: string | null } {
  if (cached) return cached;

  const certPem = readPem("APPLE_PASS_CERT");
  const keyPem = readPem("APPLE_PASS_KEY");
  const wwdrPem = readPem("APPLE_WWDR_CERT");
  const missing = [
    !certPem && "APPLE_PASS_CERT",
    !keyPem && "APPLE_PASS_KEY",
    !wwdrPem && "APPLE_WWDR_CERT",
  ].filter(Boolean);
  if (missing.length) {
    cached = { signer: null, error: `Apple Wallet is not configured (missing ${missing.join(", ")}).` };
    return cached;
  }

  try {
    const cert = forge.pki.certificateFromPem(certPem!);
    const wwdr = forge.pki.certificateFromPem(wwdrPem!);
    const passphrase = process.env.APPLE_PASS_KEY_PASSPHRASE;
    const key = passphrase
      ? forge.pki.decryptRsaPrivateKey(keyPem!, passphrase)
      : forge.pki.privateKeyFromPem(keyPem!);
    if (!key) throw new Error("Could not decrypt APPLE_PASS_KEY (wrong passphrase?).");

    // Apple's Pass Type ID cert carries the pass type id in UID and the team id in OU.
    const passTypeIdentifier =
      process.env.APPLE_PASS_TYPE_ID || subjectField(cert, "0.9.2342.19200300.100.1.1") || subjectField(cert, "UID");
    const teamIdentifier = process.env.APPLE_TEAM_ID || subjectField(cert, "OU");
    if (!passTypeIdentifier || !teamIdentifier) {
      throw new Error("Set APPLE_PASS_TYPE_ID and APPLE_TEAM_ID (could not read them from the certificate).");
    }

    const signer: ApplePassSigner = {
      passTypeIdentifier,
      teamIdentifier,
      tls: { cert: certPem!, key: keyPem!, passphrase: passphrase || undefined },
      sign(manifest: Buffer) {
        // Detached PKCS#7 signature over manifest.json, including the WWDR intermediate.
        const p7 = forge.pkcs7.createSignedData();
        p7.content = forge.util.createBuffer(manifest.toString("binary"));
        p7.addCertificate(cert);
        p7.addCertificate(wwdr);
        p7.addSigner({
          key,
          certificate: cert,
          digestAlgorithm: forge.pki.oids.sha256,
          authenticatedAttributes: [
            { type: forge.pki.oids.contentType, value: forge.pki.oids.data },
            { type: forge.pki.oids.messageDigest },
            { type: forge.pki.oids.signingTime, value: new Date() as unknown as string },
          ],
        });
        p7.sign({ detached: true });
        return Buffer.from(forge.asn1.toDer(p7.toAsn1()).getBytes(), "binary");
      },
    };
    cached = { signer, error: null };
  } catch (e: any) {
    cached = { signer: null, error: `Apple Wallet signing setup failed: ${e?.message || e}` };
  }
  return cached;
}
