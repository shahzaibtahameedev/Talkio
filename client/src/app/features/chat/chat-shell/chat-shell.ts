import { ChangeDetectionStrategy, Component } from "@angular/core";

import { ChatList } from "../chat-list/chat-list";
import { Conversation } from "../conversation/conversation";
import { IconRail } from "../icon-rail/icon-rail";

@Component({
    selector: "app-chat-shell",
    imports: [ChatList, Conversation, IconRail],
    templateUrl: "./chat-shell.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { class: "flex h-screen w-screen overflow-hidden bg-wa-panel" },
})
export class ChatShell {}
