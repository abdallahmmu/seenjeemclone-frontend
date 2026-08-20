import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fixed inset-x-4 top-4 z-50 flex flex-col items-stretch gap-2 sm:inset-x-auto sm:end-4 sm:items-end">
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          class="w-full max-w-sm rounded-lg border px-4 py-3 text-sm font-medium shadow-lg"
          [class]="typeClasses[toast.type]"
          role="alert"
        >
          <div class="flex items-start justify-between gap-3">
            <span>{{ toast.message }}</span>
            <button
              type="button"
              class="shrink-0 opacity-70 hover:opacity-100"
              (click)="toastService.dismiss(toast.id)"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        </div>
      }
    </div>
  `,
})
export class ToastComponent {
  protected readonly toastService = inject(ToastService);

  protected readonly typeClasses: Record<string, string> = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-sky-50 border-sky-200 text-sky-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
  };
}
