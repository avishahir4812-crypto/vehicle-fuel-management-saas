import { requireUser } from "@/lib/auth";
import { jsonError } from "@/lib/api";
import { canAccessConversation, markRead } from "@/lib/chat";

export const runtime = "nodejs";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    if (!(await canAccessConversation(id, user))) {
      return Response.json({ error: "forbidden" }, { status: 403 });
    }
    await markRead(id, user.id);
    return Response.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
