import { readFile } from "fs/promises";
import path from "path";
import { requireUser } from "@/lib/auth";
import { jsonError } from "@/lib/api";

export const runtime = "nodejs";

const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

/** Serves locally-stored proof photos (auth required). */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    await requireUser();
    const { name } = await params;
    if (!/^[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$/i.test(name)) {
      return Response.json({ error: "not_found" }, { status: 404 });
    }
    const ext = name.split(".").pop()!.toLowerCase();
    const file = await readFile(
      path.join(process.cwd(), "data", "uploads", name)
    );
    return new Response(new Uint8Array(file), {
      headers: {
        "Content-Type": MIME[ext] ?? "application/octet-stream",
        "Cache-Control": "private, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (error instanceof Error && "code" in error && (error as NodeJS.ErrnoException).code === "ENOENT") {
      return Response.json({ error: "not_found" }, { status: 404 });
    }
    return jsonError(error);
  }
}
