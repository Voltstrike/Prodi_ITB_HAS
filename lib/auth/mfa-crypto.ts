import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { Secret, TOTP } from "otpauth";

const ISSUER = "MM ITBHAS";

function encryptionKey(): Buffer {
    const key = process.env.MFA_ENCRYPTION_KEY;
    if (!key || !/^[a-fA-F0-9]{64}$/.test(key)) {
        throw new Error("MFA_ENCRYPTION_KEY harus berisi 64 karakter hexadecimal.");
    }
    return Buffer.from(key, "hex");
}

function accountContext(userId: number): Buffer {
    if (!Number.isSafeInteger(userId) || userId <= 0) {
        throw new Error("ID akun MFA tidak valid.");
    }
    return Buffer.from(`mm-itbhas:mfa:v1:${userId}`, "utf8");
}

function readSecret(secret: string): Secret {
    if (!/^[A-Z2-7]{32}$/.test(secret)) {
        throw new Error("Format secret MFA tidak valid.");
    }
    return Secret.fromBase32(secret);
}

export function assertMfaKeyConfigured(): void {
    encryptionKey();
}

export function createTotpSetup(email: string) {
    const secret = new Secret({ size: 20 });
    const totp = new TOTP({
        issuer: ISSUER,
        label: email,
        algorithm: "SHA1",
        digits: 6,
        period: 30,
        secret,
    });
    return { secret: secret.base32, uri: totp.toString() };
}

export function encryptMfaSecret(secret: string, userId: number): string {
    readSecret(secret);
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
    cipher.setAAD(accountContext(userId));
    const encrypted = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
    return ["v1", iv.toString("hex"), cipher.getAuthTag().toString("hex"),
        encrypted.toString("hex")].join(".");
}

export function decryptMfaSecret(value: string, userId: number): string {
    const match = /^v1\.([a-f0-9]{24})\.([a-f0-9]{32})\.([a-f0-9]{64})$/.exec(value);
    if (!match) throw new Error("Format data MFA terenkripsi tidak valid.");
    const decipher = createDecipheriv(
        "aes-256-gcm", encryptionKey(), Buffer.from(match[1], "hex"),
    );
    decipher.setAAD(accountContext(userId));
    decipher.setAuthTag(Buffer.from(match[2], "hex"));
    const secret = Buffer.concat([
        decipher.update(Buffer.from(match[3], "hex")), decipher.final(),
    ]).toString("utf8");
    readSecret(secret);
    return secret;
}

// lastUsedStep harus dibaca dan diperbarui dalam transaksi dengan lock akun.
export function verifyTotpStep(
    secret: string,
    token: string,
    lastUsedStep = -1,
    timestamp = Date.now(),
): number | null {
    if (
        !/^[0-9]{6}$/.test(token) ||
        !Number.isSafeInteger(timestamp) || timestamp < 0 ||
        !Number.isSafeInteger(lastUsedStep) || lastUsedStep < -1
    ) return null;

    const totp = new TOTP({
        secret: readSecret(secret), algorithm: "SHA1", digits: 6, period: 30,
    });
    const delta = totp.validate({ token, timestamp, window: 1 });
    if (delta === null) return null;
    const step = totp.counter({ timestamp }) + delta;
    return step > lastUsedStep ? step : null;
}

export function createRecoveryCodes(): string[] {
    const codes = new Set<string>();
    while (codes.size < 10) {
        const hex = randomBytes(16).toString("hex").toUpperCase();
        codes.add([hex.slice(0, 8), hex.slice(8, 16),
            hex.slice(16, 24), hex.slice(24, 32)].join("-"));
    }
    return [...codes];
}

export function recoveryCodeHash(code: string, userId: number): string | null {
    if (code.length > 64) return null;
    const normalized = code.trim().replace(/-/g, "").toUpperCase();
    if (!/^[A-F0-9]{32}$/.test(normalized)) return null;
    return createHash("sha256")
        .update(accountContext(userId))
        .update(":recovery:")
        .update(normalized)
        .digest("hex");
}
