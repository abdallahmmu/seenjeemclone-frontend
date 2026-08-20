import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-confirm-modal',
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (open()) {
      <div
        class="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4"
        (click)="cancelled.emit()"
      >
        <div
          class="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
          role="alertdialog"
          aria-modal="true"
          (click)="$event.stopPropagation()"
        >
          <h2 class="text-lg font-semibold text-slate-900">{{ title() }}</h2>
          <p class="mt-2 text-sm text-slate-600">{{ message() }}</p>
          <div class="mt-6 flex justify-end gap-3">
            <button
              type="button"
              class="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              (click)="cancelled.emit()"
            >
              {{ 'common.cancel' | translate }}
            </button>
            <button
              type="button"
              class="rounded-lg px-4 py-2 text-sm font-medium text-white"
              [class]="danger() ? 'bg-red-600 hover:bg-red-700' : 'bg-primary hover:bg-primary-dark'"
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
