import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  randomUUID,
} from "crypto";

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const TOTP_PERIOD_SECONDS = 30;
const TOTP_DIGITS = 6;
const TOTP_WINDOW = 1;
const SECRET_BYTE_LENGTH = 20;

function normalizeBase32Secret(secret: string): string {
  return secret.replace(/\s+/g, "").replace(/=+$/g, "").toUpperCase();
}

function normalizeCode(code: string): string {
  return code.replace(/\D/g, "");
}

function encodeBase32(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = "";

  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;

    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

function decodeBase32(secret: string): Buffer {
  const normalized = normalizeBase32Secret(secret);
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (const character of normalized) {
    const index = BASE32_ALPHABET.indexOf(character);
    if (index === -1) {
      throw new Error("Invalid two-factor secret");
    }

    value = (value << 5) | index;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

function generateHotp(secret: string, counter: number, digits = TOTP_DIGITS): string {
  const key = decodeBase32(secret);
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(counter));

  const digest = createHmac("sha1", key).update(counterBuffer).digest();
  const lastByte = digest.at(-1);
  if (lastByte === undefined) {
    throw new Error("Failed to generate two-factor digest");
  }

  const offset = lastByte & 0x0f;
  const binary = digest.readUInt32BE(offset) & 0x7fffffff;

  return String(binary % 10 ** digits).padStart(digits, "0");
}

function getEncryptionKey(): Buffer {
  const rawKey =
    process.env.TWO_FACTOR_ENCRYPTION_KEY ||
    process.env.JWT_SECRET ||
    "ims-two-factor-default-key";

  return createHash("sha256").update(rawKey).digest();
}

export function getTwoFactorAppIssuer(): string {
  return process.env.TWO_FACTOR_APP_NAME?.trim() || "IMS";
}

export function getTwoFactorDefaults() {
  return {
    digits: TOTP_DIGITS,
    periodSeconds: TOTP_PERIOD_SECONDS,
    window: TOTP_WINDOW,
  };
}

export function generateTwoFactorSecret(): string {
  return encodeBase32(randomBytes(SECRET_BYTE_LENGTH));
}

export function formatTwoFactorSecret(secret: string): string {
  const normalized = normalizeBase32Secret(secret);
  return normalized.match(/.{1,4}/g)?.join(" ") ?? normalized;
}

export function buildTwoFactorOtpAuthUri(options: {
  secret: string;
  accountName: string;
  issuer?: string;
}): string {
  const issuer = options.issuer?.trim() || getTwoFactorAppIssuer();
  const label = `${issuer}:${options.accountName}`;

  return `otpauth://totp/${encodeURIComponent(label)}?secret=${normalizeBase32Secret(options.secret)}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=${TOTP_DIGITS}&period=${TOTP_PERIOD_SECONDS}`;
}

export function verifyTwoFactorCode(
  secret: string,
  code: string,
  options?: { timestamp?: number; window?: number }
): boolean {
  const normalizedCode = normalizeCode(code);
  if (!/^\d{6}$/.test(normalizedCode)) {
    return false;
  }

  const timestamp = options?.timestamp ?? Date.now();
  const window = options?.window ?? TOTP_WINDOW;
  const currentCounter = Math.floor(timestamp / 1000 / TOTP_PERIOD_SECONDS);

  for (let offset = -window; offset <= window; offset += 1) {
    if (generateHotp(secret, currentCounter + offset) === normalizedCode) {
      return true;
    }
  }

  return false;
}

export function encryptTwoFactorSecret(secret: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(normalizeBase32Secret(secret), "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return `${iv.toString("hex")}.${authTag.toString("hex")}.${encrypted.toString("hex")}`;
}

export function decryptTwoFactorSecret(value: string): string {
  const normalized = value.trim();

  if (/^[A-Z2-7\s]+$/.test(normalized)) {
    return normalizeBase32Secret(normalized);
  }

  const [ivHex, authTagHex, encryptedHex] = normalized.split(".");
  if (!ivHex || !authTagHex || !encryptedHex) {
    throw new Error("Invalid encrypted two-factor secret");
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    Buffer.from(ivHex, "hex"),
  );
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, "hex")),
    decipher.final(),
  ]).toString("utf8");

  return normalizeBase32Secret(decrypted);
}

export function createTwoFactorLoginChallengeId(): string {
  return randomUUID();
}

export function getTwoFactorLoginChallengeIdentifier(userId: string): string {
  return `two-factor-login:${userId}`;
}

export function parseTwoFactorLoginChallengeUserId(
  identifier: string,
): string | null {
  const prefix = "two-factor-login:";
  return identifier.startsWith(prefix) ? identifier.slice(prefix.length) : null;
}
