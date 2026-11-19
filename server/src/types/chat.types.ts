export type MessageAuthor = "user" | "bot";

export interface ChatMessage {
    id: string;
    chatId: string;
    author: MessageAuthor;
    text: string;
    sentAt: string;
}

export interface SendMessageRequest {
    chatId: string;
    conversationId: string;
    text: string;
}

export interface SendMessageResponse {
    reply: ChatMessage;
}

export interface ApiErrorResponse {
    error: string;
}
