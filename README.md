# MAX Chat — GREEN-API

A simple web chat for sending and receiving text messages in the **MAX** messenger through [GREEN-API](https://green-api.com/max). The UI is modeled on [web.max.ru](https://web.max.ru/).

Stack: React 19, Next.js 16 (App Router), Tailwind CSS 4, TypeScript.

## Features

- Log in with `idInstance` / `apiTokenInstance`. The app checks the instance state with `getStateInstance`.
- Create a chat from the recipient's phone number. The number is checked with `checkAccount`, which returns the MAX `chatId`.
- Send text messages with [`SendMessage`](https://green-api.com/v3/docs/api/sending/SendMessage/).
- Receive messages over the [HTTP API](https://green-api.com/v3/docs/api/receiving/technology-http-api/): a `ReceiveNotification` → `DeleteNotification` loop.
- Delivery statuses (sent / delivered / read) arrive through `outgoingMessageStatus` notifications.
- Chats and credentials are stored in the browser's `localStorage`.

## Local setup

Requirements: Node.js 20.9+.

```bash
npm install
npm run dev
```

Open http://localhost:3000.

Production build:

```bash
npm run build
npm start
```

## Instance setup in GREEN-API

1. Create a MAX instance at https://console.green-api.com and authorize it.
2. In the instance settings, leave **webhookUrl empty** and turn on notifications for incoming messages, outgoing messages and statuses. Messages are received over the HTTP API.
3. Copy `idInstance`, `apiTokenInstance` and `apiUrl` (the default is `https://api.green-api.com`) into the login form.

> Phone-number lookup in MAX only supports Russian (`7…`) and Belarusian (`375…`) numbers.

## Architecture

```
app/page.tsx              → ClientRoot (client-side rendering only)
app/api/green/route.ts    → GREEN-API proxy (avoids CORS; validates host, method and parameters)
lib/greenApi.ts           → client API methods
lib/useChats.ts           → chat state + notification-receiving loop
components/               → LoginForm, Sidebar, ChatWindow, Messenger
```
