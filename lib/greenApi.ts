export type Credentials = {
  apiUrl: string;
  idInstance: string;
  apiTokenInstance: string;
};

export class GreenApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

async function call<T>(
  creds: Credentials,
  method: string,
  options: { body?: unknown; query?: Record<string, string | number>; pathSuffix?: string; signal?: AbortSignal } = {},
): Promise<T> {
  const { signal, ...rest } = options;
  const res = await fetch("/api/green", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...creds, method, ...rest }),
    signal,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const fallback =
      res.status === 401 || res.status === 403 ? "Неверный idInstance или apiTokenInstance" : `HTTP ${res.status}`;
    const reason = data?.error ?? data?.message ?? data?.reason ?? fallback;
    throw new GreenApiError(String(reason), res.status);
  }
  return data as T;
}

export function getStateInstance(creds: Credentials) {
  return call<{ stateInstance: string }>(creds, "getStateInstance");
}

export function checkAccount(creds: Credentials, phoneNumber: number) {
  return call<{ exist: boolean; chatId: string }>(creds, "checkAccount", {
    body: { phoneNumber },
  });
}

export function sendMessage(creds: Credentials, chatId: string, message: string) {
  return call<{ idMessage: string }>(creds, "sendMessage", { body: { chatId, message } });
}

export type Notification = {
  receiptId: number;
  body: {
    typeWebhook: string;
    timestamp: number;
    idMessage?: string;
    status?: string;
    chatId?: string;
    senderData?: { chatId: string; chatName?: string; senderName?: string; senderContactName?: string };
    messageData?: {
      typeMessage: string;
      textMessageData?: { textMessage: string };
      extendedTextMessageData?: { text: string };
    };
  };
};

export function receiveNotification(creds: Credentials, signal?: AbortSignal) {
  return call<Notification | null>(creds, "receiveNotification", {
    query: { receiveTimeout: 5 },
    signal,
  });
}

export function deleteNotification(creds: Credentials, receiptId: number) {
  return call<{ result: boolean }>(creds, "deleteNotification", { pathSuffix: String(receiptId) });
}
