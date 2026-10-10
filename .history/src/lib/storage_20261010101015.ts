import "server-only";
import { put } from "@vercel/blob";
import { randomUUID } from "crypto";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB tak allow karo
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function saveImageDataUrl(dataUrl: string): Promise<string> {
  const match = /^data:(image\/[a-z+]+);base64,(.+)$/.exec(dataUrl);
  if (!match || !ALLOWED.has(match[1])) {
    throw new Error("invalid_image");
  }

  const buffer = Buffer.from(match[2], "base64");
  if (buffer.byteLength === 0 || buffer.byteLength > MAX_BYTES) {
    throw new Error("image_too_large");
  }

  const ext = match[1] === "image/png" ? "png" : match[1] === "image/webp" ? "webp" : "jpg";
  const name = `${randomUUID()}.${ext}`;

  try {
    // Direct Vercel Blob upload with explicit token
    const blob = await put(`fuel/${name}`, buffer, {
      access: "public",
      contentType: match[1],
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    return blob.url;
  } catch (err: any) {
    console.error("Vercel Blob Upload Error:", err?.message || err);
    throw new Error(`blob_failed: ${err?.message || "unknown"}`);
  }
}