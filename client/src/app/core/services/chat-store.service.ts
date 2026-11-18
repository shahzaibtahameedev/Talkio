import { Injectable, computed, inject, signal } from "@angular/core";

import { CHAT_CONTACTS, DEFAULT_CHAT_ID, MAX_MESSAGE_LENGTH, SEED_MESSAGES } from "../constants/chat.constants";
import type { ChatContact, ChatId, ChatMessage, ChatPreview, MessageStatus } from "../models/chat.model";
import { ChatApiService } from "./chat-api.service";

const MILLISECONDS_PER_MINUTE = 60000;

let localMessageCounter = 0;

function createLocalMessageId(): string {
    localMessageCounter += 1;

    const localMessageId = `local-${localMessageCounter}`;

    return localMessageId;
}

function createSeedMessages(): ChatMessage[] {
    const startedAt = Date.now();
    const seededMessages = SEED_MESSAGES.map((seed, index) => {
        const sentAt = new Date(startedAt - seed.minutesAgo * MILLISECONDS_PER_MINUTE);
        const message: ChatMessage = {
            id: `seed-${index}`,
            chatId: seed.chatId,
            author: seed.author,
            text: seed.text,
            sentAt,
            status: "read",
        };

        return message;
    });

    return seededMessages;
}

@Injectable({ providedIn: "root" })
export class ChatStore {
    private readonly chatApiService = inject(ChatApiService);

    private readonly messagesState = signal<ChatMessage[]>(createSeedMessages());
    private readonly activeChatIdState = signal<ChatId>(DEFAULT_CHAT_ID);
    private readonly typingChatIdState = signal<ChatId | null>(null);
    private readonly searchTermState = signal("");

    readonly activeChatId = this.activeChatIdState.asReadonly();
    readonly searchTerm = this.searchTermState.asReadonly();

    readonly activeContact = computed<ChatContact>(() => {
        const chatId = this.activeChatIdState();
        const matchedContact = CHAT_CONTACTS.find((contact) => contact.id === chatId);

        if (matchedContact) {
            return matchedContact;
        }

        return CHAT_CONTACTS[0];
    });

    readonly activeMessages = computed<ChatMessage[]>(() => {
        const chatId = this.activeChatIdState();
        const chatMessages = this.messagesState().filter((message) => message.chatId === chatId);

        return chatMessages;
    });

    readonly isBotTyping = computed<boolean>(() => {
        const isTypingInActiveChat = this.typingChatIdState() === this.activeChatIdState();

        return isTypingInActiveChat;
    });

    readonly hasSendFailure = computed<boolean>(() => {
        const userMessages = this.activeMessages().filter((message) => message.author === "user");
        const latestUserMessage = userMessages.at(-1);
        const didLatestSendFail = latestUserMessage?.status === "failed";

        return didLatestSendFail;
    });

    readonly chatPreviews = computed<ChatPreview[]>(() => {
        const normalizedSearch = this.searchTermState().trim().toLowerCase();
        const allMessages = this.messagesState();
        const previews: ChatPreview[] = [];

        for (const contact of CHAT_CONTACTS) {
            const isSearchEmpty = normalizedSearch.length === 0;
            const matchesSearch = isSearchEmpty || contact.name.toLowerCase().includes(normalizedSearch);

            if (matchesSearch) {
                const chatMessages = allMessages.filter((message) => message.chatId === contact.id);
                const lastMessage = chatMessages.at(-1) ?? null;

                previews.push({ contact, lastMessage });
            }
        }

        return previews;
    });

    selectChat(chatId: ChatId): void {
        this.activeChatIdState.set(chatId);
    }

    setSearchTerm(searchTerm: string): void {
        this.searchTermState.set(searchTerm);
    }

    async sendMessage(text: string): Promise<void> {
        const trimmedText = text.trim();
        const isEmpty = trimmedText.length === 0;
        const isTooLong = trimmedText.length > MAX_MESSAGE_LENGTH;

        if (isEmpty || isTooLong) {
            return;
        }

        const chatId = this.activeChatIdState();
        const outgoingMessage: ChatMessage = {
            id: createLocalMessageId(),
            chatId,
            author: "user",
            text: trimmedText,
            sentAt: new Date(),
            status: "sending",
        };

        this.appendMessage(outgoingMessage);
        this.typingChatIdState.set(chatId);

        try {
            const response = await this.chatApiService.sendMessage(chatId, trimmedText);
            const botMessage: ChatMessage = {
                id: response.reply.id,
                chatId,
                author: "bot",
                text: response.reply.text,
                sentAt: new Date(response.reply.sentAt),
                status: "read",
            };

            this.updateMessageStatus(outgoingMessage.id, "read");
            this.appendMessage(botMessage);
        } catch {
            this.updateMessageStatus(outgoingMessage.id, "failed");
        } finally {
            this.stopTyping(chatId);
        }
    }

    private stopTyping(chatId: ChatId): void {
        this.typingChatIdState.update((currentTypingChatId) => {
            const isTypingInThisChat = currentTypingChatId === chatId;

            if (isTypingInThisChat) {
                return null;
            }

            return currentTypingChatId;
        });
    }

    private appendMessage(message: ChatMessage): void {
        this.messagesState.update((currentMessages) => currentMessages.concat(message));
    }

    private updateMessageStatus(messageId: string, status: MessageStatus): void {
        this.messagesState.update((currentMessages) =>
            currentMessages.map((message) => {
                const isTargetMessage = message.id === messageId;

                if (!isTargetMessage) {
                    return message;
                }

                return { ...message, status };
            }),
        );
    }
}
