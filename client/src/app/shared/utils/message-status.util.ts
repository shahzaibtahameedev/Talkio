import type { MessageStatus } from "../../core/models/chat.model";
import type { IconName } from "../components/app-icon/app-icon.model";

export function resolveStatusIcon(status: MessageStatus): IconName {
    switch (status) {
        case "sending":
            return "clock";
        case "failed":
            return "alert";
        default:
            return "check-double";
    }
}

export function resolveStatusLabel(status: MessageStatus): string {
    switch (status) {
        case "sending":
            return "Sending";
        case "failed":
            return "Not delivered";
        default:
            return "Read";
    }
}
