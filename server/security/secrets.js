import crypto from "node:crypto";
import { config } from "../config.js";

const algorithm = "aes-256-gcm";

function getKey() {
  if (!config.appSecret) {
    throw new Error("APP_SECRET is required before storing encrypted tokens");
  }

  return crypto.createHash("sha256").update(config.appSecret).digest();
}

export function encryptSecret(value) {
  if (!value) return null;

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(algorithm, getKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(String(value), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [
    iv.toString("base64url"),
    tag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}

export function decryptSecret(value) {
  if (!value) return null;

  const [ivValue, tagValue, encryptedValue] = value.split(".");
  const decipher = crypto.createDecipheriv(
    algorithm,
    getKey(),
    Buffer.from(ivValue, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}
