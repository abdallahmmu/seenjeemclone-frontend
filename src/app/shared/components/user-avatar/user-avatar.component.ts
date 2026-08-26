import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { initialsFromHandle, resolveAvatarUrl } from '../../utils/avatar-url';

@Component({
  selector: 'app-user-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (resolvedUrl(); as url) {
      <img [src]="url" alt="" class="rounded-full object-cover" [style.width.px]="size()" [style.height.px]="size()" />
    } @else {
      <div
        class="flex items-center justify-center rounded-full bg-primary font-semibold text-white"
        [style.width.px]="size()"
        [style.height.px]="size()"
        [style.fontSize.px]="size() * 0.4"
      >
        {{ initials() }}
      </div>
    }
  `,
})
export class UserAvatarComponent {
  readonly avatarUrl = input<string | null>(null);
  readonly handle = input.required<string>();
  readonly size = input(36);

  protected readonly resolvedUrl = computed(() => resolveAvatarUrl(this.avatarUrl()));
  protected readonly initials = computed(() => initialsFromHandle(this.handle()));
}
