const MILLISECONDS_PER_DAY = 86400000;

export function formatClockTime(value: Date): string {
    const formattedTime = value.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

    return formattedTime.toLowerCase();
}

export function isSameDay(first: Date, second: Date): boolean {
    const isSameCalendarDay =
        first.getFullYear() === second.getFullYear() &&
        first.getMonth() === second.getMonth() &&
        first.getDate() === second.getDate();

    return isSameCalendarDay;
}

export function formatDayLabel(value: Date): string {
    const today = new Date();
    const yesterday = new Date(today.getTime() - MILLISECONDS_PER_DAY);

    if (isSameDay(value, today)) {
        return "Today";
    }

    if (isSameDay(value, yesterday)) {
        return "Yesterday";
    }

    const formattedDate = value.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });

    return formattedDate;
}
