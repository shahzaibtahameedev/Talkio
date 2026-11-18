import { ChangeDetectionStrategy, Component, computed, input } from "@angular/core";

import type { ChatMessage } from "../../../core/models/chat.model";
import { AppIcon } from "../../../shared/components/app-icon/app-icon";
import type { IconName } from "../../../shared/components/app-icon/app-icon.model";
import { ClockTimePipe } from "../../../shared/pipes/clock-time.pipe";
import { resolveStatusIcon, resolveStatusLabel } from "../../../shared/utils/message-status.util";

const OUTGOING_META_SPACER_PX = 76;

const INCOMING_META_SPACER_PX = 52;

@Component({
    selector: "app-message-bubble",
    imports: [AppIcon, ClockTimePipe],
    templateUrl: "./message-bubble.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { class: "block" },
})
export class MessageBubble {
    readonly message = input.required<ChatMessage>();
    readonly showTail = input(true);

    protected readonly isOutgoing = computed(() => {
        const isSentByUser = this.message().author === "user";

        return isSentByUser;
    });

    protected readonly metaSpacerWidth = computed(() => {
        if (this.isOutgoing()) {
            return OUTGOING_META_SPACER_PX;
        }

        return INCOMING_META_SPACER_PX;
    });

    protected readonly statusIcon = computed<IconName | null>(() => {
        if (!this.isOutgoing()) {
            return null;
        }

        const icon = resolveStatusIcon(this.message().status);

        return icon;
    });

    protected readonly statusLabel = computed(() => {
        const label = resolveStatusLabel(this.message().status);

        return label;
    });
}
