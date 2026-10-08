import { ApiError } from "./auth";
import { ZodError } from "zod";

/** Parse a JSON body, failing with a clean 400 on malformed payloads. */
export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw new ApiError(400, "invalid_input");
  }
}


export function jsonError(error: unknown): Response {
  if (error instanceof ApiError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof ZodError) {
    return Response.json(
      { error: "invalid_input", details: error.issues[0]?.message },
      { status: 400 }
    );
  }
  if (error instanceof Error && error.message.startsWith("rate_limited")) {
    return Response.json({ error: "rate_limited" }, { status: 429 });
  }
  console.error(error);
  return Response.json({ error: "server_error" }, { status: 500 });
}
