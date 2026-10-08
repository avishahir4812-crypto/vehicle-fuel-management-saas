import "server-only";
import { db } from "@/db";
import {
  companies,
  conversationReads,
  conversations,
  messages,
  users,
  type User,
} from "@/db/schema";
import { and, asc, eq, gt, ne, sql } from "drizzle-orm";

export type ChatMember = { id: string; name: string; role: "owner" | "driver" };

/** One combined thread per company — owner and every driver together. */
export async function ensureCompanyThread(companyId: string): Promise<string> {
  const [existing] = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(eq(conversations.companyId, companyId))
    .limit(1);
  if (existing) return existing.id;

  await db.insert(conversations).values({ companyId }).onConflictDoNothing();
  const [created] = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(eq(conversations.companyId, companyId))
    .limit(1);
  return created.id;
}

export async function getCompanyMembers(companyId: string): Promise<ChatMember[]> {
  const rows = await db
    .select({ id: users.id, name: users.name, role: users.role })
    .from(users)
    .where(eq(users.companyId, companyId))
    .orderBy(users.role, users.name);
  return rows;
}

export async function getThreadForUser(user: User) {
  const conversationId = await ensureCompanyThread(user.companyId);
  const [company] = await db
    .select({ name: companies.name })
    .from(companies)
    .where(eq(companies.id, user.companyId))
    .limit(1);
  const members = await getCompanyMembers(user.companyId);

  const [read] = await db
    .select({ lastReadAt: conversationReads.lastReadAt })
    .from(conversationReads)
    .where(
      and(
        eq(conversationReads.conversationId, conversationId),
        eq(conversationReads.userId, user.id)
      )
    )
    .limit(1);

  const [unreadRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(messages)
    .where(
      and(
        eq(messages.conversationId, conversationId),
        ne(messages.senderId, user.id),
        read ? gt(messages.createdAt, read.lastReadAt) : undefined
      )
    );

  return {
    id: conversationId,
    title: company?.name ?? "Fleet",
    members,
    unread: unreadRow?.count ?? 0,
  };
}

export async function canAccessConversation(conversationId: string, user: User) {
  const [convo] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, conversationId))
    .limit(1);
  if (!convo || convo.companyId !== user.companyId) return null;
  return convo;
}

export async function listMessages(conversationId: string) {
  const rows = await db
    .select({
      id: messages.id,
      senderId: messages.senderId,
      senderName: users.name,
      senderRole: users.role,
      body: messages.body,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .innerJoin(users, eq(users.id, messages.senderId))
    .where(eq(messages.conversationId, conversationId))
    .orderBy(asc(messages.createdAt))
    .limit(500);
  return rows.map((m) => ({
    id: m.id,
    senderId: m.senderId,
    senderName: m.senderName,
    senderRole: m.senderRole,
    body: m.body,
    createdAt: m.createdAt.toISOString(),
  }));
}

export async function markRead(conversationId: string, userId: string) {
  await db
    .insert(conversationReads)
    .values({ conversationId, userId, lastReadAt: new Date() })
    .onConflictDoUpdate({
      target: [conversationReads.conversationId, conversationReads.userId],
      set: { lastReadAt: new Date() },
    });
}
