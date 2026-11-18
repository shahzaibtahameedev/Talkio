import { ChangeDetectionStrategy, Component, input } from "@angular/core";

import type { IconName } from "./app-icon.model";

@Component({
    selector: "app-icon",
    templateUrl: "./app-icon.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { class: "block shrink-0" },
})
export class AppIcon {
    readonly name = input.required<IconName>();
    readonly strokeWidth = input(2);
}
