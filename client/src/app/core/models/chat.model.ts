export type ChatId = "shahzaib" | "atif" | "ali";

export type MessageAuthor = "user" | "bot";

export type MessageStatus = "sending" | "read" | "failed";

export interface ChatContact {
    id: ChatId;
    name: string;
    initials: string;
    avatarFrom: string;
    avatarTo: string;
    phoneNumber: string;
}

export interface ChatMessage {
    id: string;
    chatId: ChatId;
    author: MessageAuthor;
    text: string;
    sentAt: Date;
    status: MessageStatus;
}

export interface ChatPreview {
    contact: ChatContact;
    lastMessage: ChatMessage | null;
}

export interface SendMessageRequest {
    chatId: ChatId;
    conversationId: string;
    text: string;
}

export interface SendMessageResponse {
    reply: {
        id: string;
        chatId: ChatId;
        author: MessageAuthor;
        text: string;
        sentAt: string;
    };
}
