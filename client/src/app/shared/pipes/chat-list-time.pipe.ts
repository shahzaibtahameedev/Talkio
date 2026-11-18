import { Pipe, type PipeTransform } from "@angular/core";

import { formatClockTime, formatDayLabel, isSameDay } from "../utils/date-format.util";

@Pipe({ name: "chatListTime" })
export class ChatListTimePipe implements PipeTransform {
    transform(value: Date | null): string {
        if (!value) {
            return "";
        }

        const today = new Date();
        const isToday = isSameDay(value, today);

        if (isToday) {
            return formatClockTime(value);
        }

        const dayLabel = formatDayLabel(value);

        return dayLabel;
    }
}
