import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-confirm-modal',
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (open()) {
      <div
        class="fixed inset-0 z-40 flex items-center justify-center bg-ink/50 p-4"
        (click)="cancelled.emit()"
      >
        <div
          class="nb-card w-full max-w-md p-6"
          role="alertdialog"
          aria-modal="true"
          (click)="$event.stopPropagation()"
        >
          <h2 class="nb-heading text-lg text-ink">{{ title() }}</h2>
          <p class="mt-2 text-sm text-ink-soft">{{ message() }}</p>
          <div class="mt-6 flex justify-end gap-3">
            <button
              type="button"
              class="nb-btn nb-btn-outline px-4 py-2 text-sm"
              (click)="cancelled.emit()"
            >
              {{ 'common.cancel' | translate }}
            </button>
            <button
              type="button"
              class="nb-btn px-4 py-2 text-sm"
              [class]="danger() ? 'nb-btn-primary' : 'nb-btn-secondary'"
              (click)="confirmed.emit()"
            >
              {{ confirmLabel() || ('common.confirm' | translate) }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ConfirmModalComponent {
  readonly open = input(false);
  readonly title = input('');
  readonly message = input('');
  readonly confirmLabel = input('');
  readonly danger = input(false);

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();
}
