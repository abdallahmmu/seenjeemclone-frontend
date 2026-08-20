import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HelperTool } from '../../../../core/models/helper-tool.model';
import { TranslateService } from '../../../../core/services/translate.service';
import { ConfirmModalComponent } from '../../../../shared/components/confirm-modal/confirm-modal.component';
import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { DataTableColumn } from '../../../../shared/components/data-table/data-table.models';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { ToastService } from '../../../../shared/services/toast.service';
import { apiErrorMessage } from '../../../../shared/utils/api-error';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-helper-tool-list',
  imports: [DataTableComponent, ConfirmModalComponent, TranslatePipe, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-slate-900">{{ 'admin.helperTools.title' | translate }}</h1>
      <a routerLink="new" class="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark">
        + {{ 'admin.helperTools.add' | translate }}
      </a>
    </div>
    <p class="mt-1 text-sm text-slate-400">{{ 'admin.helperTools.reorderHint' | translate }}</p>

    <div class="mt-4">
      <app-data-table
        [columns]="columns()"
        [rows]="helperTools()"
        [loading]="loading()"
        [total]="helperTools().length"
        [pageSize]="1000"
        [reorderable]="true"
        [trackBy]="trackById"
        (reorder)="onReorder($event)"
      >
        <ng-template #rowActions let-row>
          <div class="flex justify-end gap-3">
            <button type="button" class="text-xs font-semibold text-slate-500 hover:text-slate-800" (click)="toggleActive(row)">
              {{ (row.active ? 'common.inactive' : 'common.active') | translate }}
            </button>
            <a [routerLink]="[row.id, 'edit']" class="text-xs font-semibold text-primary hover:text-primary-dark">
              {{ 'common.edit' | translate }}
            </a>
            <button type="button" class="text-xs font-semibold text-red-600 hover:text-red-800" (click)="confirmDelete(row)">
              {{ 'common.delete' | translate }}
            </button>
          </div>
        </ng-template>
      </app-data-table>
    </div>

    <app-confirm-modal
      [open]="!!pendingDelete()"
      [title]="'admin.helperTools.edit' | translate"
      [message]="'common.confirm' | translate"
      [danger]="true"
      [confirmLabel]="'common.delete' | translate"
      (confirmed)="deleteConfirmed()"
      (cancelled)="cancelDelete()"
    />
  `,
})
export class HelperToolListComponent {
  private readonly adminService = inject(AdminService);
  private readonly toastService = inject(ToastService);
  protected readonly translateService = inject(TranslateService);

  protected readonly loading = signal(true);
  protected readonly helperTools = signal<HelperTool[]>([]);
  protected readonly pendingDelete = signal<HelperTool | null>(null);
  protected readonly trackById = (row: HelperTool) => row.id;

  protected readonly columns = computed<DataTableColumn<HelperTool>[]>(() => [
    { key: 'name', labelKey: 'admin.helperTools.name', cell: (t) => this.toolName(t) },
    { key: 'key', labelKey: 'admin.helperTools.key', cell: (t) => t.key },
    {
      key: 'timing',
      labelKey: 'admin.helperTools.timing',
      cell: (t) => this.translateService.t(t.timing === 'BEFORE_ONLY' ? 'admin.helperTools.beforeOnly' : 'admin.helperTools.beforeOrDuring'),
    },
    {
      key: 'active',
      labelKey: 'common.status',
      cell: (t) => this.translateService.t(t.active ? 'common.active' : 'common.inactive'),
    },
  ]);

  constructor() {
    this.load();
  }

  protected toolName(tool: HelperTool): string {
    return this.translateService.lang() === 'ar' ? tool.nameAr : tool.nameEn;
  }

  protected toggleActive(tool: HelperTool): void {
    this.adminService.updateHelperTool(tool.id, { active: !tool.active }).subscribe({
      next: (updated) => this.helperTools.update((list) => list.map((t) => (t.id === updated.id ? updated : t))),
      error: (err: unknown) => this.toastService.error(apiErrorMessage(err, 'Could not update the helper tool.')),
    });
  }

  protected confirmDelete(tool: HelperTool): void {
    this.pendingDelete.set(tool);
  }

  protected cancelDelete(): void {
    this.pendingDelete.set(null);
  }

  protected deleteConfirmed(): void {
    const tool = this.pendingDelete();
    if (!tool) return;

    this.adminService.deleteHelperTool(tool.id).subscribe({
      next: () => {
        this.helperTools.update((list) => list.filter((t) => t.id !== tool.id));
        this.pendingDelete.set(null);
        this.toastService.success('Helper tool deleted.');
      },
      error: (err: unknown) => {
        this.pendingDelete.set(null);
        this.toastService.error(apiErrorMessage(err, 'Could not delete the helper tool.'));
      },
    });
  }

  protected onReorder(event: { previousIndex: number; currentIndex: number }): void {
    const list = [...this.helperTools()];
    const [moved] = list.splice(event.previousIndex, 1);
    list.splice(event.currentIndex, 0, moved);
    this.helperTools.set(list);

    this.adminService.reorderHelperTools(list).subscribe({
      error: (err: unknown) => {
        this.toastService.error(apiErrorMessage(err, 'Could not save the new order.'));
        this.load();
      },
    });
  }

  private load(): void {
    this.loading.set(true);
    this.adminService.getHelperToolsAdmin().subscribe({
      next: (helperTools) => {
        this.helperTools.set([...helperTools].sort((a, b) => a.order - b.order));
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.toastService.error(apiErrorMessage(err, 'Could not load helper tools.'));
      },
    });
  }
}
