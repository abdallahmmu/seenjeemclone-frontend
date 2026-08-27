import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CategoryGroup } from '../../../../core/models/category.model';
import { TranslateService } from '../../../../core/services/translate.service';
import { ConfirmModalComponent } from '../../../../shared/components/confirm-modal/confirm-modal.component';
import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { DataTableColumn } from '../../../../shared/components/data-table/data-table.models';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { ToastService } from '../../../../shared/services/toast.service';
import { apiErrorMessage } from '../../../../shared/utils/api-error';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-category-group-list',
  imports: [DataTableComponent, ConfirmModalComponent, TranslatePipe, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-slate-900">{{ 'admin.categoryGroups.title' | translate }}</h1>
      <a routerLink="new" class="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark">
        + {{ 'admin.categoryGroups.add' | translate }}
      </a>
    </div>

    <div class="mt-4">
      <app-data-table [columns]="columns()" [rows]="groups()" [loading]="loading()" [total]="groups().length" [pageSize]="1000">
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
      [title]="'admin.categoryGroups.title' | translate"
      [message]="'admin.categoryGroups.deleteConfirm' | translate"
      [danger]="true"
      [confirmLabel]="'common.delete' | translate"
      (confirmed)="deleteConfirmed()"
      (cancelled)="cancelDelete()"
    />
  `,
})
export class CategoryGroupListComponent {
  private readonly adminService = inject(AdminService);
  private readonly toastService = inject(ToastService);
  protected readonly translateService = inject(TranslateService);

  protected readonly loading = signal(true);
  protected readonly groups = signal<CategoryGroup[]>([]);
  protected readonly pendingDelete = signal<CategoryGroup | null>(null);

  protected readonly columns = computed<DataTableColumn<CategoryGroup>[]>(() => [
    { key: 'name', labelKey: 'admin.categoryGroups.name', cell: (g) => this.groupName(g) },
    { key: 'order', labelKey: 'admin.categoryGroups.order', cell: (g) => String(g.order) },
    {
      key: 'active',
      labelKey: 'common.status',
      cell: (g) => this.translateService.t(g.active ? 'common.active' : 'common.inactive'),
    },
  ]);

  constructor() {
    this.load();
  }

  protected groupName(group: CategoryGroup): string {
    return this.translateService.lang() === 'ar' ? group.nameAr : group.nameEn;
  }

  protected toggleActive(group: CategoryGroup): void {
    this.adminService.updateCategoryGroup(group.id, { active: !group.active }).subscribe({
      next: (updated) => this.groups.update((list) => list.map((g) => (g.id === updated.id ? updated : g))),
      error: (err: unknown) => this.toastService.error(apiErrorMessage(err, 'Could not update the category group.')),
    });
  }

  protected confirmDelete(group: CategoryGroup): void {
    this.pendingDelete.set(group);
  }

  protected cancelDelete(): void {
    this.pendingDelete.set(null);
  }

  protected deleteConfirmed(): void {
    const group = this.pendingDelete();
    if (!group) return;

    this.adminService.deleteCategoryGroup(group.id).subscribe({
      next: () => {
        this.groups.update((list) => list.filter((g) => g.id !== group.id));
        this.pendingDelete.set(null);
        this.toastService.success('Category group deleted.');
      },
      error: (err: unknown) => {
        this.pendingDelete.set(null);
        this.toastService.error(apiErrorMessage(err, 'Could not delete the category group.'));
      },
    });
  }

  private load(): void {
    this.loading.set(true);
    this.adminService.getCategoryGroups().subscribe({
      next: (groups) => {
        this.groups.set(groups);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.toastService.error(apiErrorMessage(err, 'Could not load category groups.'));
      },
    });
  }
}
