import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type LoadingSpinnerVariant = 'primary' | 'white';

const VARIANT_CLASSES: Record<LoadingSpinnerVariant, string> = {
  // For light/white backgrounds — a full-page or section loader.
  primary: 'border-slate-200 border-t-primary',
  // For colored/gradient button backgrounds, where the primary variant's
  // border-slate-200 ring would have poor contrast against, say, bg-primary.
  white: 'border-white/30 border-t-white',
};

@Component({
  selector: 'app-loading-spinner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center justify-center" [class.py-16]="fullPage()" role="status">
      <span
        class="inline-block animate-spin rounded-full border-2"
        [class]="variantClass()"
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
  readonly variant = input<LoadingSpinnerVariant>('primary');

  protected variantClass(): string {
    return VARIANT_CLASSES[this.variant()];
  }
}
