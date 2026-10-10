import "server-only";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

/**
 * Image storage adapter.
 * - On Vercel (BLOB_READ_WRITE_TOKEN present) → uploads to Vercel Blob.
 * - Locally → writes to ./data/uploads and serves via /api/uploads/[name].
 */

const MAX_BYTES = 3.5 * 1024 * 1024; // 3.5 MB per image (client compresses first)
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

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const { put } = await import("@vercel/blob");
      const blob = await put(`fuel/${name}`, buffer, {
        access: "public",
        contentType: match[1],
      });
      return blob.url;
    } catch (err) {
      console.error("blob upload failed, falling back to local disk", err);
    }
  }

  const dir = path.join(process.cwd(), "data", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), buffer);
  return `/api/uploads/${name}`;
}
