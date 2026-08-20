import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Category, CategoryGroup } from '../../../../core/models/category.model';
import { TranslateService } from '../../../../core/services/translate.service';
import { ConfirmModalComponent } from '../../../../shared/components/confirm-modal/confirm-modal.component';
import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { DataTableColumn } from '../../../../shared/components/data-table/data-table.models';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { ToastService } from '../../../../shared/services/toast.service';
import { apiErrorMessage } from '../../../../shared/utils/api-error';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-category-list',
  imports: [DataTableComponent, ConfirmModalComponent, TranslatePipe, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-slate-900">{{ 'admin.categories.title' | translate }}</h1>
      <a routerLink="new" class="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark">
        + {{ 'admin.categories.add' | translate }}
      </a>
    </div>
    <p class="mt-1 text-sm text-slate-400">{{ 'admin.categories.reorderHint' | translate }}</p>

    <div class="mt-4">
      <app-data-table
        [columns]="columns()"
        [rows]="categories()"
        [loading]="loading()"
        [total]="categories().length"
        [pageSize]="1000"
        [reorderable]="true"
        [trackBy]="trackById"
        (reorder)="onReorder($event)"
      >
        <ng-template #rowActions let-row>
          <div class="flex justify-end gap-3">
            <a
              [routerLink]="['/admin/categories', row.id, 'questions']"
              class="text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              {{ 'admin.nav.questions' | translate }}
            </a>
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
      [title]="'admin.categories.edit' | translate"
      [message]="'common.confirm' | translate"
      [danger]="true"
      [confirmLabel]="'common.delete' | translate"
      (confirmed)="deleteConfirmed()"
      (cancelled)="cancelDelete()"
    />
  `,
})
export class CategoryListComponent {
  private readonly adminService = inject(AdminService);
  private readonly toastService = inject(ToastService);
  protected readonly translateService = inject(TranslateService);

  protected readonly loading = signal(true);
  protected readonly categories = signal<Category[]>([]);
  protected readonly groups = signal<CategoryGroup[]>([]);
  protected readonly pendingDelete = signal<Category | null>(null);
  protected readonly trackById = (row: Category) => row.id;

  protected readonly columns = computed<DataTableColumn<Category>[]>(() => [
    { key: 'name', labelKey: 'admin.categories.name', cell: (c) => this.categoryName(c) },
    { key: 'group', labelKey: 'admin.categories.group', cell: (c) => this.groupName(c.groupId) },
    {
      key: 'active',
      labelKey: 'common.status',
      cell: (c) => this.translateService.t(c.active ? 'common.active' : 'common.inactive'),
    },
  ]);

  constructor() {
    this.load();
  }

  protected categoryName(category: Category): string {
    return this.translateService.lang() === 'ar' ? category.nameAr : category.nameEn;
  }

  protected groupName(groupId: string): string {
    const group = this.groups().find((g) => g.id === groupId);
    if (!group) return '—';
    return this.translateService.lang() === 'ar' ? group.nameAr : group.nameEn;
  }

  protected toggleActive(category: Category): void {
    this.adminService.updateCategory(category.id, { active: !category.active }).subscribe({
      next: (updated) => this.categories.update((list) => list.map((c) => (c.id === updated.id ? updated : c))),
      error: (err: unknown) => this.toastService.error(apiErrorMessage(err, 'Could not update the category.')),
    });
  }

  protected confirmDelete(category: Category): void {
    this.pendingDelete.set(category);
  }

  protected cancelDelete(): void {
    this.pendingDelete.set(null);
  }

  protected deleteConfirmed(): void {
    const category = this.pendingDelete();
    if (!category) return;

    this.adminService.deleteCategory(category.id).subscribe({
      next: () => {
        this.categories.update((list) => list.filter((c) => c.id !== category.id));
        this.pendingDelete.set(null);
        this.toastService.success('Category deleted.');
      },
      error: (err: unknown) => {
        this.pendingDelete.set(null);
        this.toastService.error(apiErrorMessage(err, 'Could not delete the category.'));
      },
    });
  }

  protected onReorder(event: { previousIndex: number; currentIndex: number }): void {
    const list = [...this.categories()];
    const [moved] = list.splice(event.previousIndex, 1);
    list.splice(event.currentIndex, 0, moved);
    this.categories.set(list);

    this.adminService.reorderCategories(list).subscribe({
      error: (err: unknown) => {
        this.toastService.error(apiErrorMessage(err, 'Could not save the new order.'));
        this.load();
      },
    });
  }

  private load(): void {
    this.loading.set(true);
    this.adminService.getCategoryGroups().subscribe((groups) => this.groups.set(groups));
    this.adminService.getCategories().subscribe({
      next: (categories) => {
        this.categories.set([...categories].sort((a, b) => a.order - b.order));
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.toastService.error(apiErrorMessage(err, 'Could not load categories.'));
      },
    });
  }
}
