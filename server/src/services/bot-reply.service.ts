import { randomUUID } from "node:crypto";

import { BOT_REPLY_DELAY_MS, BOT_REPLY_TEXT } from "../constants/chat.constants.js";
import type { ChatMessage } from "../types/chat.types.js";

function wait(durationMs: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, durationMs));
}

/**
 * The POC bot answers every incoming message with the same text, regardless of
 * what was sent. The short delay mirrors a real bot so the client can show its
 * typing indicator.
 */
export async function createBotReply(chatId: string): Promise<ChatMessage> {
    await wait(BOT_REPLY_DELAY_MS);

    const reply: ChatMessage = {
        id: randomUUID(),
        chatId,
        author: "bot",
        text: BOT_REPLY_TEXT,
        sentAt: new Date().toISOString(),
    };

    return reply;
}
