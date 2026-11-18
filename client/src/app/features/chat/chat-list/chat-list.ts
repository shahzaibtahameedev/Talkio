import { ChangeDetectionStrategy, Component, inject } from "@angular/core";

import type { ChatId } from "../../../core/models/chat.model";
import { ChatStore } from "../../../core/services/chat-store.service";
import { AppIcon } from "../../../shared/components/app-icon/app-icon";
import { Avatar } from "../../../shared/components/avatar/avatar";
import { ChatListTimePipe } from "../../../shared/pipes/chat-list-time.pipe";
import { resolveStatusIcon, resolveStatusLabel } from "../../../shared/utils/message-status.util";

@Component({
    selector: "app-chat-list",
    imports: [AppIcon, Avatar, ChatListTimePipe],
    templateUrl: "./chat-list.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { class: "flex h-full w-full max-w-[420px] min-w-[300px] shrink-0 md:w-[32%]" },
})
export class ChatList {
    private readonly chatStore = inject(ChatStore);

    protected readonly chatPreviews = this.chatStore.chatPreviews;
    protected readonly activeChatId = this.chatStore.activeChatId;
    protected readonly searchTerm = this.chatStore.searchTerm;

    protected readonly resolveStatusIcon = resolveStatusIcon;
    protected readonly resolveStatusLabel = resolveStatusLabel;

    protected selectChat(chatId: ChatId): void {
        this.chatStore.selectChat(chatId);
    }

    protected onSearchInput(event: Event): void {
        const searchInput = event.target as HTMLInputElement;

        this.chatStore.setSearchTerm(searchInput.value);
    }
}
