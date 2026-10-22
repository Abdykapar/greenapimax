"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import ChatWindow from "./ChatWindow";
import { Credentials, checkAccount, sendMessage } from "@/lib/greenApi";
import { normalizePhone } from "@/lib/format";
import { useChats } from "@/lib/useChats";

export default function Messenger({ creds, onLogout }: { creds: Credentials; onLogout: () => void }) {
  const { chats, pollError, openChat, addOutgoing, updateMessage } = useChats(creds);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const activeChat = chats.find((c) => c.chatId === activeChatId) ?? null;

  async function handleCreate(input: string): Promise<string | null> {
    const phone = normalizePhone(input);
    if (!phone) return "Введите номер РФ (7XXXXXXXXXX) или РБ (375XXXXXXXXX)";
    try {
      // MAX notifications use the numeric chatId, so resolve it instead of using phone@c.us
      const { exist, chatId } = await checkAccount(creds, Number(phone));
      if (!exist || !chatId) return "Этот номер не зарегистрирован в MAX";
      openChat(chatId, `+${phone}`);
      setActiveChatId(chatId);
      return null;
    } catch (err) {
      return err instanceof Error ? err.message : "Не удалось проверить номер";
    }
  }

  async function handleSend(text: string) {
    if (!activeChat) return;
    const chatId = activeChat.chatId;
    const tempId = `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    addOutgoing(chatId, { id: tempId, text, outgoing: true, timestamp: Date.now(), status: "pending" });
    try {
      const { idMessage } = await sendMessage(creds, chatId, text);
      updateMessage(chatId, tempId, { id: idMessage, status: "sent" });
    } catch {
      updateMessage(chatId, tempId, { status: "failed" });
    }
  }

  return (
    <div className="flex h-dvh w-full overflow-hidden">
      <div className={`${activeChat ? "hidden md:flex" : "flex"} h-full w-full md:w-auto`}>
        <Sidebar
          chats={chats}
          activeChatId={activeChatId}
          onSelect={setActiveChatId}
          onCreate={handleCreate}
          onLogout={onLogout}
          idInstance={creds.idInstance}
        />
      </div>
      <main className={`${activeChat ? "flex" : "hidden md:flex"} relative h-full flex-1`}>
        {pollError && (
          <div className="absolute left-1/2 top-16 z-10 -translate-x-1/2 rounded-lg bg-red-600 px-3 py-1.5 text-sm text-white shadow">
            Ошибка получения: {pollError}
          </div>
        )}
        {activeChat ? (
          <ChatWindow
            key={activeChat.chatId}
            chat={activeChat}
            onSend={handleSend}
            onBack={() => setActiveChatId(null)}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center bg-[var(--chat-bg)] text-[var(--muted)]">
            Выберите чат или создайте новый
          </div>
        )}
      </main>
    </div>
  );
}
