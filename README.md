# Talkio

A WhatsApp-styled web chat interface and the first step of a WhatsApp bot POC.

- **client/** — Angular 20 + Tailwind CSS 4 single-page chat UI
- **server/** — Hono (Node) backend exposing one endpoint that replies `"Thank You"` to any message

## How the chat is modelled

The sidebar lists the three users — **Shahzaib**, **Atif** and **Ali**. Selecting one puts you
in that person's seat: your messages are the green outgoing bubbles and the Talkio Bot answers.
Each person keeps their own thread, so you can test the bot as a different user by switching chats.

## Getting started

Requires Node.js 20.19+, 22.12+ or 24+.

```bash
npm install            # root tooling (concurrently)
npm run install:all    # client + server dependencies
npm run dev            # runs both: API on :3001, UI on http://localhost:4200
```

Run them separately instead:

```bash
npm run dev:server     # http://localhost:3001
npm run dev:client     # http://localhost:4200
```

The Angular dev server proxies `/api` to `http://localhost:3001` (see `client/proxy.conf.json`),
so the UI calls same-origin paths in development.

## API

### `POST /api/messages`

```jsonc
// request
{ "chatId": "shahzaib" | "atif" | "ali", "text": "Hello" }

// 200
{
    "reply": {
        "id": "f1c2...",
        "chatId": "shahzaib",
        "author": "bot",
        "text": "Thank You",
        "sentAt": "2026-11-18T16:41:55.953Z"
    }
}

// 400
{ "error": "Message text cannot be empty" }
```

The reply text is always `"Thank You"`, whatever is sent. A short delay
(`BOT_REPLY_DELAY_MS`) stands in for real bot latency so the client can show its typing indicator.

## Project layout

```
client/src/app/
  core/
    constants/      API paths, bot copy, contacts, seed conversation
    models/         chat types shared across the UI
    services/       chat-api.service.ts (HTTP), chat-store.service.ts (signal state)
  features/chat/
    chat-shell/     three-column layout
    icon-rail/      far-left navigation rail
    chat-list/      searchable sidebar of the three users
    conversation/   header, message list, date dividers, typing indicator
    message-bubble/ a single bubble with tail, timestamp and delivery ticks
    message-composer/ auto-growing input; Enter sends, Shift+Enter adds a line
  shared/
    components/     app-icon (SVG set), avatar
    pipes/          clock-time, chat-list-time
    utils/          date formatting

server/src/
  constants/        bot reply text, delay, allowed origins
  routes/           message.route.ts
  services/         bot-reply.service.ts
  types/            request/response contracts
```

All UI state lives in `ChatStore` as Angular signals. Sending a message appends an optimistic
bubble with a clock icon, shows the typing indicator, then flips the bubble to blue read ticks
when the reply lands. If the API is unreachable the bubble turns red and a notice appears
under the thread.

## Scripts

| Location | Command | Purpose |
| --- | --- | --- |
| root | `npm run dev` | client + server together |
| client | `npm start` | dev server on :4200 |
| client | `npm run build` | production bundle |
| server | `npm run dev` | watch mode on :3001 |
| server | `npm run build` | compile to `dist/` |
| server | `npm run typecheck` | type check only |
