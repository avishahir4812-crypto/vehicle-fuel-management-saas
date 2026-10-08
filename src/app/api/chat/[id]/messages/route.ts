import { db } from "@/db";
import { messages } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { jsonError, readJson } from "@/lib/api";
import { messageSchema } from "@/lib/validation";
import { canAccessConversation, listMessages, markRead } from "@/lib/chat";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    if (!(await canAccessConversation(id, user))) {
      return Response.json({ error: "forbidden" }, { status: 403 });
    }
    return Response.json({ messages: await listMessages(id) });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    if (!(await canAccessConversation(id, user))) {
      return Response.json({ error: "forbidden" }, { status: 403 });
    }
    const rl = rateLimit({ key: `msg:${user.id}`, limit: 40, windowMs: 60_000 });
    if (!rl.ok) return Response.json({ error: "rate_limited" }, { status: 429 });

    const { body } = messageSchema.parse(await readJson(req));
    const [msg] = await db
      .insert(messages)
      .values({ conversationId: id, senderId: user.id, body })
      .returning();
    await markRead(id, user.id);

    return Response.json(
      {
        message: {
          id: msg.id,
          senderId: user.id,
          senderName: user.name,
          senderRole: user.role,
          body: msg.body,
          createdAt: msg.createdAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return jsonError(error);
  }
}
