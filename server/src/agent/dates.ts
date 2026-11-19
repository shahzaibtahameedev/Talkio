const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** Formats a date as YYYY-MM-DD in the server's local time zone. */
export function toIsoDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const isoDate = `${year}-${month}-${day}`;

    return isoDate;
}

/** A line for system prompts so agents can resolve "today" and "tomorrow". */
export function describeToday(): string {
    const today = new Date();
    const weekdayName = WEEKDAY_NAMES[today.getDay()];
    const isoDate = toIsoDate(today);
    const todayLine = `Today is ${weekdayName}, ${isoDate}.`;

    return todayLine;
}
