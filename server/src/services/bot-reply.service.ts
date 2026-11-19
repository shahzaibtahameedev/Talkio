import { randomUUID } from "node:crypto";

import { HumanMessage } from "@langchain/core/messages";

import { customerServiceGraph } from "../agent/graph.js";
import { AGENT_FALLBACK_REPLY } from "../constants/chat.constants.js";
import type { ChatMessage, SendMessageRequest } from "../types/chat.types.js";

/** Runs the customer-service agent for one customer message and wraps its answer as a chat message. */
export async function createBotReply(request: SendMessageRequest): Promise<ChatMessage> {
    const replyText = await askCustomerServiceAgent(request.conversationId, request.text);
    const reply: ChatMessage = {
        id: randomUUID(),
        chatId: request.chatId,
        author: "bot",
        text: replyText,
        sentAt: new Date().toISOString(),
    };

    return reply;
}

async function askCustomerServiceAgent(conversationId: string, text: string): Promise<string> {
    // thread_id picks this conversation's memory in the checkpointer.
    const config = { configurable: { thread_id: conversationId } };
    const input = { messages: [new HumanMessage(text)] };

    try {
        const finalState = await customerServiceGraph.invoke(input, config);
        const lastMessage = finalState.messages.at(-1);

        console.log(`[agent] thread=${conversationId} intent=${finalState.intent} escalated=${finalState.escalated}`);

        if (!lastMessage) {
            return AGENT_FALLBACK_REPLY;
        }

        return lastMessage.text;
    } catch (error) {
        console.error("[agent] The customer-service agent failed:", error);

        return AGENT_FALLBACK_REPLY;
    }
}
