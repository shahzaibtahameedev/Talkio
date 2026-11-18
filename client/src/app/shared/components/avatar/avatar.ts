import { ChangeDetectionStrategy, Component, computed, input } from "@angular/core";

@Component({
    selector: "app-avatar",
    templateUrl: "./avatar.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { class: "block shrink-0" },
})
export class Avatar {
    readonly initials = input.required<string>();
    readonly colorFrom = input.required<string>();
    readonly colorTo = input.required<string>();

    protected readonly gradient = computed(() => {
        const background = `linear-gradient(135deg, ${this.colorFrom()} 0%, ${this.colorTo()} 100%)`;

        return background;
    });
}
