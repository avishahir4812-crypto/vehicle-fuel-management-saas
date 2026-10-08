import { requireUser } from "@/lib/auth";
import { jsonError } from "@/lib/api";
import { saveImageDataUrl } from "@/lib/storage";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 30;

/** Accepts compressed data-URLs, persists them, returns serving URLs. */
export async function POST(req: Request) {
  try {
    await requireUser();
    const rl = rateLimit({
      key: `upload:${clientIp(req)}`,
      limit: 30,
      windowMs: 60_000,
    });
    if (!rl.ok) return Response.json({ error: "rate_limited" }, { status: 429 });

    // Reject oversized JSON bodies before parsing.
    const contentLength = Number(req.headers.get("content-length") ?? "0");
    if (contentLength > 15_000_000) {
      return Response.json({ error: "payload_too_large" }, { status: 413 });
    }

    const body = await req.json().catch(() => null);
    const images: unknown = body?.images;
    if (!Array.isArray(images) || images.length === 0 || images.length > 4) {
      return Response.json({ error: "invalid_input" }, { status: 400 });
    }

    const urls: string[] = [];
    for (const img of images) {
      if (typeof img !== "string" || img.length > 5_500_000) {
        return Response.json({ error: "invalid_image" }, { status: 400 });
      }
      urls.push(await saveImageDataUrl(img));
    }
    return Response.json({ urls });
  } catch (error) {
    return jsonError(error);
  }
}
