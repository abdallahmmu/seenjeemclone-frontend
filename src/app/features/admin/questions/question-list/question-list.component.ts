import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Category } from '../../../../core/models/category.model';
import { Difficulty, Question } from '../../../../core/models/question.model';
import { TranslateService } from '../../../../core/services/translate.service';
import { ConfirmModalComponent } from '../../../../shared/components/confirm-modal/confirm-modal.component';
import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { DataTableColumn } from '../../../../shared/components/data-table/data-table.models';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { ToastService } from '../../../../shared/services/toast.service';
import { apiErrorMessage } from '../../../../shared/utils/api-error';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-question-list',
  imports: [DataTableComponent, ConfirmModalComponent, TranslatePipe, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h1 class="text-2xl font-bold text-slate-900">{{ 'admin.questions.title' | translate }}</h1>
      <div class="flex gap-2">
        <a
          routerLink="/admin/questions/import"
          class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          {{ 'admin.questions.import' | translate }}
        </a>
        <a
          [routerLink]="['/admin/questions/new']"
          [queryParams]="categoryId() ? { categoryId: categoryId() } : {}"
          class="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
        >
          + {{ 'admin.questions.add' | translate }}
        </a>
      </div>
    </div>

    <div class="mt-4 flex flex-wrap gap-3">
      <select
        class="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        [value]="categoryId()"
        (change)="onCategoryFilterChange($any($event.target).value)"
      >
        <option value="">{{ 'admin.questions.category' | translate }}</option>
        @for (category of categories(); track category.id) {
          <option [value]="category.id">{{ translateService.lang() === 'ar' ? category.nameAr : category.nameEn }}</option>
        }
      </select>

      <select
        class="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        [value]="difficulty()"
        (change)="onDifficultyFilterChange($any($event.target).value)"
      >
        <option value="">{{ 'admin.questions.allDifficulties' | translate }}</option>
        <option value="EASY">{{ 'admin.questions.easy' | translate }}</option>
        <option value="MEDIUM">{{ 'admin.questions.medium' | translate }}</option>
        <option value="HARD">{{ 'admin.questions.hard' | translate }}</option>
      </select>
    </div>

    <div class="mt-4">
      <app-data-table
        [columns]="columns()"
        [rows]="filteredQuestions()"
        [loading]="loading()"
        [total]="filteredQuestions().length"
        [pageSize]="1000"
      >
        <ng-template #rowActions let-row>
          <div class="flex justify-end gap-3">
            <a
              [routerLink]="['/admin/questions', row.id, 'edit']"
              class="text-xs font-semibold text-primary hover:text-primary-dark"
            >
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
      [title]="'admin.questions.title' | translate"
      [message]="'common.confirm' | translate"
      [danger]="true"
      [confirmLabel]="'common.delete' | translate"
      (confirmed)="deleteConfirmed()"
      (cancelled)="cancelDelete()"
    />
  `,
})
export class QuestionListComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly toastService = inject(ToastService);
  protected readonly translateService = inject(TranslateService);
  private readonly route = inject(ActivatedRoute);

  protected readonly loading = signal(true);
  protected readonly questions = signal<Question[]>([]);
  protected readonly categories = signal<Category[]>([]);
  protected readonly categoryId = signal('');
  protected readonly difficulty = signal<'' | Difficulty>('');
  protected readonly pendingDelete = signal<Question | null>(null);

  protected readonly filteredQuestions = computed(() =>
    this.difficulty() ? this.questions().filter((q) => q.difficulty === this.difficulty()) : this.questions(),
  );

  protected readonly columns = computed<DataTableColumn<Question>[]>(() => [
    { key: 'text', labelKey: 'admin.questions.questionText', cell: (q) => q.text },
    { key: 'category', labelKey: 'admin.questions.category', cell: (q) => this.categoryName(q.categoryId) },
    {
      key: 'difficulty',
      labelKey: 'admin.questions.difficulty',
      cell: (q) => this.translateService.t('admin.questions.' + q.difficulty.toLowerCase()),
    },
    {
      key: 'active',
      labelKey: 'common.status',
      cell: (q) => this.translateService.t(q.active ? 'common.active' : 'common.inactive'),
    },
  ]);

  ngOnInit(): void {
    const fromRoute = this.route.snapshot.paramMap.get('categoryId');
    const fromQuery = this.route.snapshot.queryParamMap.get('categoryId');
    this.categoryId.set(fromRoute ?? fromQuery ?? '');

    this.adminService.getCategories().subscribe((categories) => this.categories.set(categories));
    this.load();
  }

  protected categoryName(categoryId: string): string {
    const category = this.categories().find((c) => c.id === categoryId);
    if (!category) return '—';
    return this.translateService.lang() === 'ar' ? category.nameAr : category.nameEn;
  }

  protected onCategoryFilterChange(value: string): void {
    this.categoryId.set(value);
    this.load();
  }

  protected onDifficultyFilterChange(value: string): void {
    this.difficulty.set(value as '' | Difficulty);
  }

  protected confirmDelete(question: Question): void {
    this.pendingDelete.set(question);
  }

  protected cancelDelete(): void {
    this.pendingDelete.set(null);
  }

  protected deleteConfirmed(): void {
    const question = this.pendingDelete();
    if (!question) return;

    this.adminService.deleteQuestion(question.id).subscribe({
      next: () => {
        this.questions.update((list) => list.filter((q) => q.id !== question.id));
        this.pendingDelete.set(null);
        this.toastService.success('Question deleted.');
      },
      error: (err: unknown) => {
        this.pendingDelete.set(null);
        this.toastService.error(apiErrorMessage(err, 'Could not delete the question.'));
      },
    });
  }

  private load(): void {
    this.loading.set(true);
    this.adminService.getQuestions(this.categoryId() || undefined).subscribe({
      next: (questions) => {
        this.questions.set(questions);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.toastService.error(apiErrorMessage(err, 'Could not load questions.'));
      },
    });
  }
}
