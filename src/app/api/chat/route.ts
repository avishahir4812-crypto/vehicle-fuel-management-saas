import { requireUser } from "@/lib/auth";
import { jsonError } from "@/lib/api";
import { getThreadForUser, getUnreadCountForUser, listMessages } from "@/lib/chat";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** One combined company thread — owner and all drivers, always present. */
export async function GET(req: Request) {
  try {
    const user = await requireUser();
    const url = new URL(req.url);
    if (url.searchParams.get("unread") === "1") {
      return Response.json({ totalUnread: await getUnreadCountForUser(user) });
    }

    const withMessages = url.searchParams.get("messages") === "1";
    const thread = await getThreadForUser(user);

    return Response.json({
      thread,
      totalUnread: thread.unread,
      messages: withMessages ? await listMessages(thread.id) : undefined,
    });
  } catch (error) {
    return jsonError(error);
  }
}
