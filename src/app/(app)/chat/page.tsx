import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { ChatClient } from "@/components/app/ChatClient";

export const metadata: Metadata = { title: "Messages" };

export default async function ChatPage() {
  const user = await getSessionUser();
  if (!user) notFound();
  return <ChatClient userId={user.id} role={user.role} />;
}
