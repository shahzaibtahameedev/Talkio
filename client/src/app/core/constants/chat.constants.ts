import type { ChatContact, ChatId, MessageAuthor } from "../models/chat.model";

export const BOT_NAME = "Talkio Bot";

export const BOT_INITIALS = "TB";

export const BOT_AVATAR_FROM = "#00a884";

export const BOT_AVATAR_TO = "#006d5b";

export const BOT_TYPING_TEXT = "typing...";

export const ENCRYPTION_NOTICE =
    "Messages are end-to-end encrypted. No one outside of this chat, not even Talkio, can read them.";

export const MAX_MESSAGE_LENGTH = 4096;

export const SEND_FAILED_TEXT = "Message not delivered. Check that the Talkio server is running.";

export const DEFAULT_CHAT_ID: ChatId = "shahzaib";

export const CHAT_CONTACTS: readonly ChatContact[] = [
    {
        id: "shahzaib",
        name: "Shahzaib",
        initials: "S",
        avatarFrom: "#7f6cf0",
        avatarTo: "#4733c4",
        phoneNumber: "+92 300 1112233",
    },
    {
        id: "atif",
        name: "Atif",
        initials: "A",
        avatarFrom: "#2aa6f0",
        avatarTo: "#0b5fab",
        phoneNumber: "+92 301 4455667",
    },
    {
        id: "ali",
        name: "Ali",
        initials: "A",
        avatarFrom: "#f0875a",
        avatarTo: "#b8492a",
        phoneNumber: "+92 302 7788990",
    },
];

interface SeedMessage {
    chatId: ChatId;
    author: MessageAuthor;
    text: string;
    minutesAgo: number;
}

export const SEED_MESSAGES: readonly SeedMessage[] = [
    { chatId: "shahzaib", author: "user", text: "Assalam o alaikum", minutesAgo: 96 },
    { chatId: "shahzaib", author: "bot", text: "Thank You", minutesAgo: 95 },
    { chatId: "shahzaib", author: "user", text: "Is the new order flow live yet?", minutesAgo: 34 },
    { chatId: "shahzaib", author: "bot", text: "Thank You", minutesAgo: 33 },
    { chatId: "atif", author: "user", text: "Bhai, testing the bot from my side", minutesAgo: 58 },
    { chatId: "atif", author: "bot", text: "Thank You", minutesAgo: 57 },
    { chatId: "ali", author: "user", text: "Hello! Anyone there?", minutesAgo: 20 },
    { chatId: "ali", author: "bot", text: "Thank You", minutesAgo: 19 },
];
