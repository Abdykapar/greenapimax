"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Credentials,
  Notification,
  deleteNotification,
  receiveNotification,
} from "./greenApi";
import { loadJson, saveJson } from "./storage";

const EMPTY_QUEUE_DELAY_MS = 3000;
const ERROR_RETRY_DELAY_MS = 3000;

export type MessageStatus = "pending" | "sent" | "delivered" | "read" | "failed";

export type Message = {
  id: string;
  text: string;
  outgoing: boolean;
  timestamp: number; // ms
  status?: MessageStatus;
};

export type Chat = {
  chatId: string;
  title: string;
  messages: Message[];
};

function extractText(messageData: Notification["body"]["messageData"]): string | null {
  if (!messageData) return null;
  if (messageData.typeMessage === "textMessage") return messageData.textMessageData?.textMessage ?? null;
  if (messageData.typeMessage === "extendedTextMessage") return messageData.extendedTextMessageData?.text ?? null;
  return null; // only text messages are supported
}

function addMessage(chats: Chat[], chatId: string, title: string, message: Message): Chat[] {
  const existing = chats.find((c) => c.chatId === chatId);
  if (existing?.messages.some((m) => m.id === message.id)) return chats;
  const updated: Chat = existing
    ? { ...existing, messages: [...existing.messages, message] }
    : { chatId, title, messages: [message] };
  // most recently active chat goes first
  return [updated, ...chats.filter((c) => c.chatId !== chatId)];
}

function applyNotification(chats: Chat[], { body }: Notification): Chat[] {
  switch (body.typeWebhook) {
    case "incomingMessageReceived":
    case "outgoingMessageReceived":
    case "outgoingAPIMessageReceived": {
      const text = extractText(body.messageData);
      if (text === null || !body.senderData || !body.idMessage) return chats;
      const { chatId, chatName, senderName, senderContactName } = body.senderData;
      const outgoing = body.typeWebhook !== "incomingMessageReceived";
      const title = chatName || senderContactName || (outgoing ? "" : senderName) || chatId;
      return addMessage(chats, chatId, title, {
        id: body.idMessage,
        text,
        outgoing,
        timestamp: body.timestamp * 1000,
        status: outgoing ? "sent" : undefined,
      });
    }
    case "outgoingMessageStatus": {
      const { idMessage, status } = body;
      if (!idMessage || !status) return chats;
      const mapped: MessageStatus | undefined =
        status === "sent" || status === "delivered" || status === "read"
          ? status
          : status === "failed" || status === "noAccount" || status === "notInGroup"
            ? "failed"
            : undefined;
      if (!mapped) return chats;
      return chats.map((chat) =>
        chat.messages.some((m) => m.id === idMessage)
          ? { ...chat, messages: chat.messages.map((m) => (m.id === idMessage ? { ...m, status: mapped } : m)) }
          : chat,
      );
    }
    default:
      return chats;
  }
}

export function useChats(creds: Credentials) {
  const storageKey = `chats:${creds.idInstance}`;
  const [chats, setChats] = useState<Chat[]>(() => loadJson<Chat[]>(storageKey, []));
  const [pollError, setPollError] = useState<string | null>(null);

  useEffect(() => saveJson(storageKey, chats), [storageKey, chats]);

  // Long-poll the HTTP API notification queue: receive → handle → delete.
  useEffect(() => {
    const controller = new AbortController();
    let stopped = false;
    const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    (async () => {
      while (!stopped) {
        try {
          const notification = await receiveNotification(creds, controller.signal);
          setPollError(null);
          if (notification) {
            setChats((prev) => applyNotification(prev, notification));
            await deleteNotification(creds, notification.receiptId);
            continue; // more may be queued — fetch the next one right away
          }
          // Queue is empty. receiveTimeout should hold the request for up to 5s,
          // but the server may answer immediately, so pause to avoid hammering it.
          await wait(EMPTY_QUEUE_DELAY_MS);
        } catch (err) {
          if (stopped) break;
          setPollError(err instanceof Error ? err.message : "Ошибка получения сообщений");
          await wait(ERROR_RETRY_DELAY_MS);
        }
      }
    })();

    return () => {
      stopped = true;
      controller.abort();
    };
  }, [creds]);

  const openChat = useCallback((chatId: string, title: string) => {
    setChats((prev) =>
      prev.some((c) => c.chatId === chatId) ? prev : [{ chatId, title, messages: [] }, ...prev],
    );
  }, []);

  const addOutgoing = useCallback((chatId: string, message: Message) => {
    setChats((prev) => addMessage(prev, chatId, chatId, message));
  }, []);

  const updateMessage = useCallback((chatId: string, tempId: string, patch: Partial<Message>) => {
    setChats((prev) =>
      prev.map((chat) => {
        if (chat.chatId !== chatId) return chat;
        // the webhook for this message may already have arrived under its real id
        if (patch.id && patch.id !== tempId && chat.messages.some((m) => m.id === patch.id)) {
          return { ...chat, messages: chat.messages.filter((m) => m.id !== tempId) };
        }
        return { ...chat, messages: chat.messages.map((m) => (m.id === tempId ? { ...m, ...patch } : m)) };
      }),
    );
  }, []);

  return { chats, pollError, openChat, addOutgoing, updateMessage };
}
