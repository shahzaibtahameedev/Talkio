import { Pipe, type PipeTransform } from "@angular/core";

import { formatClockTime } from "../utils/date-format.util";

@Pipe({ name: "clockTime" })
export class ClockTimePipe implements PipeTransform {
    transform(value: Date): string {
        const formattedTime = formatClockTime(value);

        return formattedTime;
    }
}
