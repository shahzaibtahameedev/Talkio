import { ChangeDetectionStrategy, Component, type ElementRef, computed, effect, inject, signal, viewChild } from "@angular/core";

import { ChatStore } from "../../../core/services/chat-store.service";
import { AppIcon } from "../../../shared/components/app-icon/app-icon";

const MAX_TEXTAREA_HEIGHT_PX = 120;

@Component({
    selector: "app-message-composer",
    imports: [AppIcon],
    templateUrl: "./message-composer.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { class: "block shrink-0" },
})
export class MessageComposer {
    private readonly chatStore = inject(ChatStore);
    private readonly draftInput = viewChild<ElementRef<HTMLTextAreaElement>>("draftInput");

    protected readonly draftText = signal("");

    protected readonly hasDraft = computed(() => {
        const isDraftFilled = this.draftText().trim().length > 0;

        return isDraftFilled;
    });

    constructor() {
        effect(() => {
            this.chatStore.activeChatId();
            this.draftText.set("");
            this.resetInputHeight();
        });
    }

    protected onDraftInput(event: Event): void {
        const textarea = event.target as HTMLTextAreaElement;

        this.draftText.set(textarea.value);
        this.growInput(textarea);
    }

    protected onKeydown(event: KeyboardEvent): void {
        const isEnterKey = event.key === "Enter";
        const isNewLineRequested = event.shiftKey;

        if (isEnterKey && !isNewLineRequested) {
            event.preventDefault();
            this.sendDraft();
        }
    }

    protected async sendDraft(): Promise<void> {
        const draft = this.draftText();
        const isDraftEmpty = draft.trim().length === 0;

        if (isDraftEmpty) {
            return;
        }

        this.draftText.set("");
        this.resetInputHeight();

        await this.chatStore.sendMessage(draft);
    }

    private growInput(textarea: HTMLTextAreaElement): void {
        textarea.style.height = "auto";

        const nextHeight = Math.min(textarea.scrollHeight, MAX_TEXTAREA_HEIGHT_PX);

        textarea.style.height = `${nextHeight}px`;
    }

    private resetInputHeight(): void {
        const textarea = this.draftInput()?.nativeElement;

        if (!textarea) {
            return;
        }

        textarea.style.height = "auto";
    }
}
