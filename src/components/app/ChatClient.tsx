"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { AtSign, Send, ShieldCheck, Users } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { Avatar, Spinner } from "@/components/ui";
import { cn } from "@/lib/utils";

type Member = { id: string; name: string; role: "owner" | "driver" };
type Thread = { id: string; title: string; members: Member[]; unread: number };
type ChatMessage = {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: "owner" | "driver";
  body: string;
  createdAt: string;
};

/** Highlights @Name mentions against the real member list. */
function renderBody(body: string, members: Member[], mine: boolean) {
  if (members.length === 0) return body;
  const names = [...members]
    .map((m) => m.name)
    .sort((a, b) => b.length - a.length)
    .map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const re = new RegExp(`@(${names.join("|")})`, "g");
  const parts: Array<string | { tag: string }> = [];
  let last = 0;
  for (const match of body.matchAll(re)) {
    const idx = match.index ?? 0;
    if (idx > last) parts.push(body.slice(last, idx));
    parts.push({ tag: match[0] });
    last = idx + match[0].length;
  }
  if (last < body.length) parts.push(body.slice(last));

  return parts.map((p, i) =>
    typeof p === "string" ? (
      <span key={i}>{p}</span>
    ) : (
      <strong
        key={i}
        className={cn(
          "rounded px-1 font-bold",
          mine ? "bg-brand/25 text-brand" : "bg-brand/15 text-brand-ink"
        )}
      >
        {p.tag}
      </strong>
    )
  );
}

export function ChatClient({ userId }: { userId: string; role: "owner" | "driver" }) {
  const { t, locale } = useI18n();
  const [thread, setThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const tag = locale === "hi" ? "hi-IN" : locale === "gu" ? "gu-IN" : "en-IN";

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/chat?messages=1", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { thread: Thread; messages: ChatMessage[] };
      setThread(data.thread);
      setMessages(data.messages ?? []);
      if (data.thread.unread > 0) {
        await fetch(`/api/chat/${data.thread.id}/read`, { method: "POST" });
        window.dispatchEvent(new Event("fm:messages"));
      }
    } catch {
      /* retry on next poll */
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    void load();
    const interval = setInterval(load, 4000);
    return () => clearInterval(interval);
  }, [load]);

  const lastCount = useRef(0);
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    if (messages.length > lastCount.current) {
      el.scrollTo({ top: el.scrollHeight, behavior: lastCount.current === 0 ? "auto" : "smooth" });
    }
    lastCount.current = messages.length;
  }, [messages]);

  const members = thread?.members ?? [];

  const suggestions = useMemo(() => {
    if (mentionQuery === null) return [];
    const q = mentionQuery.toLowerCase();
    return members
      .filter((m) => m.id !== userId && m.name.toLowerCase().includes(q))
      .slice(0, 5);
  }, [mentionQuery, members, userId]);

  function onInputChange(value: string) {
    setInput(value);
    const caret = inputRef.current?.selectionStart ?? value.length;
    const upto = value.slice(0, caret);
    const match = /@([\p{L} ]{0,20})$/u.exec(upto);
    setMentionQuery(match ? match[1] : null);
  }

  function applyMention(member: Member) {
    const el = inputRef.current;
    const caret = el?.selectionStart ?? input.length;
    const upto = input.slice(0, caret);
    const rest = input.slice(caret);
    const replaced = upto.replace(/@([\p{L} ]{0,20})$/u, `@${member.name} `);
    const next = replaced + rest;
    setInput(next);
    setMentionQuery(null);
    requestAnimationFrame(() => {
      el?.focus();
      const pos = replaced.length;
      el?.setSelectionRange(pos, pos);
    });
  }

  async function send(e?: FormEvent) {
    e?.preventDefault();
    const body = input.trim();
    if (!body || !thread || sending) return;
    setSending(true);
    setInput("");
    setMentionQuery(null);
    try {
      const res = await fetch(`/api/chat/${thread.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (res.ok) {
        const data = (await res.json()) as { message: ChatMessage };
        setMessages((prev) => [...prev, data.message]);
      } else {
        setInput(body);
      }
    } catch {
      setInput(body);
    } finally {
      setSending(false);
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (suggestions.length > 0 && (e.key === "Tab" || e.key === "Enter") && mentionQuery !== null) {
      e.preventDefault();
      applyMention(suggestions[0]);
      return;
    }
    if (e.key === "Escape") setMentionQuery(null);
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  }

  const dayLabel = (iso: string) => {
    const date = new Date(iso);
    return date.toDateString() === new Date().toDateString()
      ? t("common.today")
      : date.toLocaleDateString(tag, { day: "numeric", month: "short" });
  };
  const timeLabel = (iso: string) =>
    new Date(iso).toLocaleTimeString(tag, { hour: "2-digit", minute: "2-digit" });

  return (
    <div>
      <header className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">{t("chat.title")}</h1>
        <p className="mt-1 text-[15px] text-ink-soft">{t("chat.sub")}</p>
      </header>

      <div className="flex h-[calc(100dvh-15.5rem)] min-h-[440px] flex-col overflow-hidden rounded-card border border-line bg-surface shadow-soft lg:h-[calc(100dvh-12rem)]">
        {/* Header — single combined thread */}
        <div className="flex items-center gap-3 border-b border-line px-4 py-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-ink text-brand">
            <Users className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-ink">{thread?.title ?? t("chat.team")}</p>
            <p className="truncate text-[11px] font-semibold text-ink-soft">
              {members.length} {t("chat.members2")} ·{" "}
              {members
                .slice(0, 3)
                .map((m) => m.name.split(" ")[0])
                .join(", ")}
              {members.length > 3 ? "…" : ""}
            </p>
          </div>
          <span className="hidden items-center gap-1 text-[11px] font-bold text-emerald-600 sm:flex">
            <ShieldCheck className="size-3.5" />
            {t("chat.encrypted")}
          </span>
        </div>

        {/* Messages */}
        <div ref={scrollerRef} className="flex-1 space-y-2.5 overflow-y-auto bg-paper/60 px-4 py-4">
          {!loaded ? (
            <div className="grid h-full place-items-center text-ink-soft">
              <Spinner className="size-6" />
            </div>
          ) : messages.length === 0 ? (
            <div className="grid h-full place-items-center">
              <p className="max-w-60 text-center text-sm font-medium text-ink-soft">
                {t("chat.emptyTeam")}
              </p>
            </div>
          ) : (
            messages.map((m, i) => {
              const mine = m.senderId === userId;
              const showName = !mine && (i === 0 || messages[i - 1].senderId !== m.senderId);
              return (
                <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                  <div className={cn("max-w-[82%] sm:max-w-[66%]", mine && "flex flex-col items-end")}>
                    {showName && (
                      <p className="mb-1 flex items-center gap-1.5 pl-1 text-[11px] font-bold text-ink-soft">
                        <Avatar name={m.senderName} id={m.senderId} size="sm" className="size-4 text-[8px]" />
                        {m.senderName}
                        {m.senderRole === "owner" && (
                          <span className="rounded bg-brand/15 px-1 text-[9px] uppercase text-brand-ink">
                            {t("common.owner")}
                          </span>
                        )}
                      </p>
                    )}
                    <div
                      className={cn(
                        "bubble-in rounded-2xl px-3.5 py-2 text-[14px] leading-relaxed shadow-soft",
                        mine
                          ? "rounded-br-md bg-ink text-paper"
                          : "rounded-bl-md border border-line bg-surface text-ink"
                      )}
                    >
                      <p className="whitespace-pre-wrap break-words">
                        {renderBody(m.body, members, mine)}
                      </p>
                      <p
                        className={cn(
                          "mt-1 text-right text-[10px] font-semibold",
                          mine ? "text-white/45" : "text-ink-soft/60"
                        )}
                      >
                        {dayLabel(m.createdAt)} · {timeLabel(m.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Composer with @mention suggestions */}
        <form onSubmit={(e) => void send(e)} className="relative border-t border-line bg-surface p-3">
          {suggestions.length > 0 && (
            <div className="absolute inset-x-3 bottom-[calc(100%-0.5rem)] z-20 overflow-hidden rounded-xl border border-line bg-surface shadow-lift">
              {suggestions.map((m, i) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => applyMention(m)}
                  className={cn(
                    "flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-brand/[0.07]",
                    i === 0 && "bg-brand/[0.05]"
                  )}
                >
                  <Avatar name={m.name} id={m.id} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-ink">{m.name}</span>
                    <span className="block text-[11px] text-ink-soft">
                      {t(m.role === "owner" ? "common.owner" : "common.driver")}
                    </span>
                  </span>
                  {i === 0 && (
                    <span className="rounded bg-ink/[0.06] px-1.5 py-0.5 text-[10px] font-bold text-ink-soft">
                      Tab
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-end gap-2">
            <div className="relative flex-1">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => onInputChange(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={t("chat.placeholder")}
                rows={1}
                maxLength={2000}
                className="max-h-32 w-full resize-none rounded-xl border border-line bg-paper px-3.5 py-2.5 text-[14px] outline-none transition-all placeholder:text-ink-soft/60 focus:border-brand focus:ring-4 focus:ring-brand/15"
              />
              {input.length === 0 && (
                <span className="pointer-events-none absolute -top-5 left-1 flex items-center gap-1 text-[10px] font-semibold text-ink-soft/70">
                  <AtSign className="size-3" />
                  {t("chat.mention")}
                </span>
              )}
            </div>
            <button
              type="submit"
              disabled={!input.trim() || sending}
              aria-label={t("chat.send")}
              className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand text-night shadow-amber transition hover:bg-brand-deep hover:text-white disabled:opacity-40"
            >
              {sending ? <Spinner /> : <Send className="size-4.5" />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
