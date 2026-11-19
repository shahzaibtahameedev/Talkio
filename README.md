# Talkio

A WhatsApp-styled web chat interface and the first step of a WhatsApp bot POC.

- **client/** — Angular 20 + Tailwind CSS 4 single-page chat UI
- **server/** — Hono (Node) backend whose one endpoint answers with a LangGraph.js customer-service agent

## How the chat is modelled

The sidebar lists the three users — **Shahzaib**, **Atif** and **Ali**. Selecting one puts you
in that person's seat: your messages are the green outgoing bubbles and the Talkio Bot answers.
Each person keeps their own thread, so you can test the bot as a different user by switching chats.

## Getting started

Requires Node.js 22.9+ or 24+ (the server loads `.env` with Node's built-in `--env-file-if-exists`).

Configure the LLM first. Copy `server/.env.example` to `server/.env` and fill in your OpenRouter key
and a model id that supports tool calling and structured outputs:

```bash
LLM_BASE_URL=https://openrouter.ai/api/v1
LLM_API_KEY=sk-or-...
LLM_MODEL=provider/model-name   # from https://openrouter.ai/models
```

Then install and run:

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
{ "chatId": "shahzaib" | "atif" | "ali", "conversationId": "<uuid>", "text": "Hello" }

// 200
{
    "reply": {
        "id": "f1c2...",
        "chatId": "shahzaib",
        "author": "bot",
        "text": "Hi! How can I help you today?",
        "sentAt": "2026-11-18T16:41:55.953Z"
    }
}

// 400
{ "error": "Message text cannot be empty" }
```

`conversationId` is the agent's memory key (LangGraph `thread_id`). The UI creates one per chat
with `crypto.randomUUID()` when the page loads, so reloading the page starts fresh conversations.
If the agent fails (bad key, model down), the endpoint still returns 200 with a short apology as the reply.

## Customer-service agent

```
START -> classifier -> (router) -> query | booking | complaint | other -> END
```

- **classifier** makes one structured-output call (zod) that labels the latest message
  `query`, `booking`, `complaint` or `other`. It sees the last 6 messages, so follow-ups
  like "tomorrow at 5pm" stay on the current topic.
- **router** is a plain function on the conditional edge: the intent is the next node's name.
- **specialists** are small `createAgent` tool-calling agents, each with its own prompt and tools:
  - query: answers FAQs from the business info in its prompt (`BUSINESS_INFO` in `specialists.ts`)
  - booking: `checkSlots`, `bookSlot`, `cancelBooking` over an in-memory store
  - complaint: gathers details, calls `logComplaint`, then sets `escalated = true`
  - other: greetings and unclear messages; asks a short clarifying question
- **memory** is LangGraph's `MemorySaver`, keyed by `thread_id`. Conversations, bookings and
  complaints all live in memory and are lost when the server restarts.

Only each specialist's final answer is added to the shared transcript; tool calls stay inside
that specialist's run. The server logs each turn's intent and `escalated` flag.

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
  agent/
    state.ts        graph state: messages, intent, escalated
    llm.ts          OpenRouter chat model from env
    classifier.ts   classifier node + router
    specialists.ts  the four agents and their prompts
    tools.ts        booking + complaint tools with in-memory stores
    graph.ts        builds and compiles the graph once
  constants/        fallback reply, limits, port, allowed origins
  routes/           message.route.ts
  services/         bot-reply.service.ts (runs the graph)
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
