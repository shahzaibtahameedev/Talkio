import { Hono } from "hono";

import { MAX_MESSAGE_LENGTH, SUPPORTED_CHAT_IDS } from "../constants/chat.constants.js";
import { HTTP_STATUS } from "../constants/server.constants.js";
import { createBotReply } from "../services/bot-reply.service.js";
import type { SendMessageRequest } from "../types/chat.types.js";

export const messageRoute = new Hono();

messageRoute.post("/", async (context) => {
    let parsedBody: unknown;

    try {
        parsedBody = await context.req.json();
    } catch {
        return context.json({ error: "Request body must be valid JSON" }, HTTP_STATUS.BAD_REQUEST);
    }

    const isBodyAnObject = typeof parsedBody === "object" && parsedBody !== null;

    if (!isBodyAnObject) {
        return context.json({ error: "Request body must be a JSON object" }, HTTP_STATUS.BAD_REQUEST);
    }

    const requestBody = parsedBody as Partial<SendMessageRequest>;
    const chatId = requestBody.chatId;
    const text = requestBody.text;
    const isKnownChat = typeof chatId === "string" && SUPPORTED_CHAT_IDS.includes(chatId);

    if (!isKnownChat) {
        return context.json({ error: "A known chatId is required" }, HTTP_STATUS.BAD_REQUEST);
    }

    if (typeof text !== "string") {
        return context.json({ error: "Message text is required" }, HTTP_STATUS.BAD_REQUEST);
    }

    const trimmedText = text.trim();
    const isEmpty = trimmedText.length === 0;
    const isTooLong = trimmedText.length > MAX_MESSAGE_LENGTH;

    if (isEmpty) {
        return context.json({ error: "Message text cannot be empty" }, HTTP_STATUS.BAD_REQUEST);
    }

    if (isTooLong) {
        return context.json({ error: "Message text is too long" }, HTTP_STATUS.BAD_REQUEST);
    }

    const reply = await createBotReply(chatId);

    return context.json({ reply });
});
