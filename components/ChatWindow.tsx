"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import Avatar from "./Avatar";
import type { Chat, MessageStatus } from "@/lib/useChats";
import { formatTime } from "@/lib/format";

const STATUS_ICON: Record<MessageStatus, string> = {
  pending: "🕓",
  sent: "✓",
  delivered: "✓✓",
  read: "✓✓",
  failed: "!",
};

type Props = {
  chat: Chat;
  onSend: (text: string) => void;
  onBack: () => void;
};

export default function ChatWindow({ chat, onSend, onBack }: Props) {
  const [text, setText] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [chat.messages.length, chat.chatId]);

  function submit(e?: FormEvent) {
    e?.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText("");
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <section className="flex h-full flex-1 flex-col bg-[var(--chat-bg)]">
      <header className="flex items-center gap-3 border-b border-[var(--border)] bg-[var(--panel)] px-4 py-2.5">
        <button onClick={onBack} className="rounded-lg px-2 py-1 text-xl md:hidden" aria-label="Назад">
          ←
        </button>
        <Avatar title={chat.title} size={40} />
        <div className="min-w-0">
          <div className="truncate font-medium">{chat.title}</div>
          <div className="truncate text-xs text-[var(--muted)]">MAX · {chat.chatId}</div>
        </div>
      </header>

      <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto flex max-w-3xl flex-col gap-1.5">
          {chat.messages.length === 0 && (
            <p className="mt-10 text-center text-sm text-[var(--muted)]">Напишите первое сообщение</p>
          )}
          {chat.messages.map((m) => (
            <div key={m.id} className={`flex ${m.outgoing ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-3 py-1.5 shadow-sm ${
                  m.outgoing
                    ? "rounded-br-md bg-[var(--bubble-out)]"
                    : "rounded-bl-md bg-[var(--bubble-in)]"
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{m.text}</p>
                <div className="mt-0.5 flex items-center justify-end gap-1 text-[11px] text-[var(--muted)]">
                  {formatTime(m.timestamp)}
                  {m.outgoing && m.status && (
                    <span
                      title={m.status}
                      className={
                        m.status === "read" ? "text-[var(--accent)]" : m.status === "failed" ? "text-red-600" : ""
                      }
                    >
                      {STATUS_ICON[m.status]}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={submit} className="border-t border-[var(--border)] bg-[var(--panel)] px-4 py-3">
        <div className="mx-auto flex max-w-3xl items-end gap-2">
          <textarea
            className="input max-h-40 flex-1 resize-none"
            rows={1}
            maxLength={4000}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Сообщение"
            aria-label="Текст сообщения"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            aria-label="Отправить"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-white hover:opacity-90 disabled:opacity-40"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden>
              <path d="M3.4 20.4 21 12 3.4 3.6 3.4 10l12.6 2-12.6 2z" />
            </svg>
          </button>
        </div>
      </form>
    </section>
  );
}
