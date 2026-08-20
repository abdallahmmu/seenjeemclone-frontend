import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { AdminStats } from '../../../core/models/admin.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { ToastService } from '../../../shared/services/toast.service';
import { apiErrorMessage } from '../../../shared/utils/api-error';
import { AdminService } from '../services/admin.service';

@Component({
  selector: 'app-admin-dashboard',
  imports: [TranslatePipe, LoadingSpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 class="text-2xl font-bold text-slate-900">{{ 'admin.dashboard.title' | translate }}</h1>

    @if (stats(); as s) {
      <div class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div class="rounded-xl border border-slate-200 bg-white p-5">
          <p class="text-sm text-slate-500">{{ 'admin.dashboard.totalQuestions' | translate }}</p>
          <p class="mt-2 text-3xl font-bold text-slate-900">{{ s.totalQuestions }}</p>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-5">
          <p class="text-sm text-slate-500">{{ 'admin.dashboard.totalCategoryGroups' | translate }}</p>
          <p class="mt-2 text-3xl font-bold text-slate-900">{{ s.totalCategoryGroups }}</p>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-5">
          <p class="text-sm text-slate-500">{{ 'admin.dashboard.categoryPacks' | translate }}</p>
          <p class="mt-2 text-3xl font-bold text-slate-900">{{ s.categoryPacks.total }}</p>
          <p class="mt-1 text-xs text-slate-400">
            {{ s.categoryPacks.active }} {{ 'admin.dashboard.categoryPacksActive' | translate }} ·
            {{ s.categoryPacks.inactive }} {{ 'admin.dashboard.categoryPacksInactive' | translate }}
          </p>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-5">
          <p class="text-sm text-slate-500">{{ 'admin.dashboard.gamesPlayed' | translate }}</p>
          <p class="mt-2 text-3xl font-bold text-slate-900">{{ s.gamesPlayed }}</p>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-5">
          <p class="text-sm text-slate-500">{{ 'admin.dashboard.activeUsers' | translate }}</p>
          <p class="mt-2 text-3xl font-bold text-slate-900">{{ s.activeUsers }}</p>
        </div>
      </div>
    } @else {
      <app-loading-spinner [fullPage]="true" [size]="32" />
    }
  `,
})
export class DashboardComponent {
  private readonly adminService = inject(AdminService);
  private readonly toastService = inject(ToastService);

  protected readonly stats = toSignal(
    this.adminService.getStats().pipe(
      catchError((err: unknown) => {
        this.toastService.error(apiErrorMessage(err, 'Could not load dashboard stats.'));
        return of(undefined as AdminStats | undefined);
      }),
    ),
  );
}
