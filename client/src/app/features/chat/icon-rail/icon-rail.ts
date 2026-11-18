import { ChangeDetectionStrategy, Component, inject } from "@angular/core";

import { ChatStore } from "../../../core/services/chat-store.service";
import { AppIcon } from "../../../shared/components/app-icon/app-icon";
import type { IconName } from "../../../shared/components/app-icon/app-icon.model";
import { Avatar } from "../../../shared/components/avatar/avatar";

interface RailItem {
    icon: IconName;
    label: string;
    isActive: boolean;
}

@Component({
    selector: "app-icon-rail",
    imports: [AppIcon, Avatar],
    templateUrl: "./icon-rail.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { class: "hidden h-full shrink-0 md:block" },
})
export class IconRail {
    private readonly chatStore = inject(ChatStore);

    protected readonly activeContact = this.chatStore.activeContact;

    protected readonly primaryItems: readonly RailItem[] = [
        { icon: "chats", label: "Chats", isActive: true },
        { icon: "calls", label: "Calls", isActive: false },
        { icon: "status", label: "Status", isActive: false },
        { icon: "channels", label: "Channels", isActive: false },
        { icon: "communities", label: "Communities", isActive: false },
        { icon: "sparkle", label: "Meta AI", isActive: false },
    ];

    protected readonly secondaryItems: readonly RailItem[] = [
        { icon: "photos", label: "Starred messages", isActive: false },
        { icon: "settings", label: "Settings", isActive: false },
    ];
}
