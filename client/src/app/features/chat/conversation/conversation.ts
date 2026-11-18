import { ChangeDetectionStrategy, Component, type ElementRef, afterRenderEffect, computed, inject, viewChild } from "@angular/core";

import {
    BOT_AVATAR_FROM,
    BOT_AVATAR_TO,
    BOT_INITIALS,
    BOT_NAME,
    BOT_TYPING_TEXT,
    ENCRYPTION_NOTICE,
    SEND_FAILED_TEXT,
} from "../../../core/constants/chat.constants";
import type { ChatMessage } from "../../../core/models/chat.model";
import { ChatStore } from "../../../core/services/chat-store.service";
import { AppIcon } from "../../../shared/components/app-icon/app-icon";
import { Avatar } from "../../../shared/components/avatar/avatar";
import { formatDayLabel, isSameDay } from "../../../shared/utils/date-format.util";
import { MessageBubble } from "../message-bubble/message-bubble";
import { MessageComposer } from "../message-composer/message-composer";

const RUN_START_SPACING_PX = 10;

const RUN_CONTINUATION_SPACING_PX = 2;

interface MessageView {
    message: ChatMessage;
    showTail: boolean;
    topSpacingPx: number;
}

interface MessageGroup {
    dayLabel: string;
    views: MessageView[];
}

@Component({
    selector: "app-conversation",
    imports: [AppIcon, Avatar, MessageBubble, MessageComposer],
    templateUrl: "./conversation.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { class: "flex h-full min-w-0 flex-1" },
})
export class Conversation {
    private readonly chatStore = inject(ChatStore);
    private readonly scrollContainer = viewChild<ElementRef<HTMLElement>>("scrollContainer");

    protected readonly botName = BOT_NAME;
    protected readonly botInitials = BOT_INITIALS;
    protected readonly botAvatarFrom = BOT_AVATAR_FROM;
    protected readonly botAvatarTo = BOT_AVATAR_TO;
    protected readonly botTypingText = BOT_TYPING_TEXT;
    protected readonly encryptionNotice = ENCRYPTION_NOTICE;
    protected readonly sendFailedText = SEND_FAILED_TEXT;

    protected readonly activeContact = this.chatStore.activeContact;
    protected readonly isBotTyping = this.chatStore.isBotTyping;
    protected readonly hasSendFailure = this.chatStore.hasSendFailure;

    protected readonly messageGroups = computed<MessageGroup[]>(() => {
        const messages = this.chatStore.activeMessages();
        const groups: MessageGroup[] = [];

        for (let index = 0; index < messages.length; index += 1) {
            const message = messages[index];
            const previousMessage = messages[index - 1];
            const dayLabel = formatDayLabel(message.sentAt);
            const isFirstMessage = index === 0;
            const startsNewDay = isFirstMessage || !isSameDay(previousMessage.sentAt, message.sentAt);
            const startsNewAuthorRun = isFirstMessage || previousMessage.author !== message.author;
            const showTail = startsNewDay || startsNewAuthorRun;
            const view: MessageView = {
                message,
                showTail,
                topSpacingPx: showTail ? RUN_START_SPACING_PX : RUN_CONTINUATION_SPACING_PX,
            };
            const currentGroup = groups.at(-1);

            if (currentGroup && currentGroup.dayLabel === dayLabel) {
                currentGroup.views.push(view);
            } else {
                groups.push({ dayLabel, views: [view] });
            }
        }

        return groups;
    });

    constructor() {
        afterRenderEffect(() => {
            this.chatStore.activeMessages();
            this.chatStore.isBotTyping();
            this.chatStore.activeChatId();
            this.scrollToBottom();
        });
    }

    private scrollToBottom(): void {
        const container = this.scrollContainer()?.nativeElement;

        if (!container) {
            return;
        }

        container.scrollTop = container.scrollHeight;
    }
}
