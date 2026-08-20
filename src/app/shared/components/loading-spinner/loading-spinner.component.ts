import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center justify-center" [class.py-16]="fullPage()" role="status">
      <span
        class="inline-block animate-spin rounded-full border-2 border-slate-200 border-t-primary"
        [style.width.px]="size()"
        [style.height.px]="size()"
      ></span>
      <span class="sr-only">Loading</span>
    </div>
  `,
})
export class LoadingSpinnerComponent {
  readonly size = input(24);
  readonly fullPage = input(false);
}
