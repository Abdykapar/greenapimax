"use client";

import { FormEvent, useState } from "react";
import Avatar from "./Avatar";
import type { Chat } from "@/lib/useChats";
import { formatTime } from "@/lib/format";

type Props = {
  chats: Chat[];
  activeChatId: string | null;
  onSelect: (chatId: string) => void;
  onCreate: (phone: string) => Promise<string | null>;
  onLogout: () => void;
  idInstance: string;
};

export default function Sidebar({ chats, activeChatId, onSelect, onCreate, onLogout, idInstance }: Props) {
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setCreating(true);
    const err = await onCreate(phone);
    setCreating(false);
    setError(err);
    if (!err) setPhone("");
  }

  return (
    <aside className="flex h-full w-full flex-col border-r border-[var(--border)] bg-[var(--panel)] md:w-[360px]">
      <header className="flex items-center justify-between px-4 pb-2 pt-4">
        <h2 className="text-xl font-semibold">Чаты</h2>
        <button
          onClick={onLogout}
          title={`Выйти (инстанс ${idInstance})`}
          className="rounded-lg px-2 py-1 text-sm text-[var(--muted)] hover:bg-[var(--hover)]"
        >
          Выйти
        </button>
      </header>

      <form onSubmit={handleCreate} className="px-4 pb-3">
        <div className="flex gap-2">
          <input
            className="input flex-1"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Номер, напр. 79991234567"
            aria-label="Номер телефона получателя"
          />
          <button
            type="submit"
            disabled={creating || !phone.trim()}
            className="rounded-xl bg-[var(--accent)] px-3 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {creating ? "…" : "Создать"}
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </form>

      <ul className="flex-1 overflow-y-auto">
        {chats.length === 0 && (
          <li className="px-4 py-8 text-center text-sm text-[var(--muted)]">
            Нет чатов. Введите номер получателя, чтобы начать.
          </li>
        )}
        {chats.map((chat) => {
          const last = chat.messages[chat.messages.length - 1];
          const active = chat.chatId === activeChatId;
          return (
            <li key={chat.chatId}>
              <button
                onClick={() => onSelect(chat.chatId)}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-left ${
                  active ? "bg-[var(--active)]" : "hover:bg-[var(--hover)]"
                }`}
              >
                <Avatar title={chat.title} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate font-medium">{chat.title}</span>
                    {last && <span className="shrink-0 text-xs text-[var(--muted)]">{formatTime(last.timestamp)}</span>}
                  </div>
                  <p className="truncate text-sm text-[var(--muted)]">
                    {last ? `${last.outgoing ? "Вы: " : ""}${last.text}` : "Нет сообщений"}
                  </p>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
