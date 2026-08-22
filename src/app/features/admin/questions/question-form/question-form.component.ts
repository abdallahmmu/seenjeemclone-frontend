import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { distinctUntilChanged, of, startWith, switchMap } from 'rxjs';
import { Category } from '../../../../core/models/category.model';
import { Difficulty, QuestionMediaType } from '../../../../core/models/question.model';
import { TranslateService } from '../../../../core/services/translate.service';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { ToastService } from '../../../../shared/services/toast.service';
import { apiErrorMessage } from '../../../../shared/utils/api-error';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-question-form',
  imports: [ReactiveFormsModule, TranslatePipe, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto max-w-3xl" dir="rtl">
      <h1 class="text-2xl font-bold text-slate-900">
        {{ (isEdit() ? 'admin.questions.edit' : 'admin.questions.add') | translate }}
      </h1>

      <form class="mt-6 space-y-6 rounded-xl border border-slate-200 bg-white p-6" [formGroup]="form" (ngSubmit)="submit()">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2" dir="ltr">
          <div>
            <label class="block text-sm font-medium text-slate-700">{{ 'admin.questions.category' | translate }}</label>
            <select formControlName="categoryId" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="" disabled>{{ 'admin.questions.category' | translate }}</option>
              @for (category of categories(); track category.id) {
                <option [value]="category.id">
                  {{ translateService.lang() === 'ar' ? category.nameAr : category.nameEn }}
                </option>
              }
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700">{{ 'admin.questions.difficulty' | translate }}</label>
            <select formControlName="difficulty" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="EASY" [disabled]="takenDifficulties().has('EASY')">{{ 'admin.questions.easy' | translate }}</option>
              <option value="MEDIUM" [disabled]="takenDifficulties().has('MEDIUM')">{{ 'admin.questions.medium' | translate }}</option>
              <option value="HARD" [disabled]="takenDifficulties().has('HARD')">{{ 'admin.questions.hard' | translate }}</option>
            </select>
            @if (takenDifficulties().has(form.controls.difficulty.value)) {
              <p class="mt-1 text-xs text-red-600">{{ 'admin.questions.difficultyTaken' | translate }}</p>
            }
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700">{{ 'admin.questions.questionText' | translate }}</label>
          <textarea
            formControlName="text"
            rows="2"
            class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          ></textarea>
        </div>

        <div>
          <div class="flex items-center justify-between">
            <label class="block text-sm font-medium text-slate-700">{{ 'admin.questions.options' | translate }}</label>
            <button type="button" class="text-xs font-semibold text-primary hover:text-primary-dark" (click)="addOption()">
              + {{ 'admin.questions.addOption' | translate }}
            </button>
          </div>

          <div formArrayName="options" class="mt-3 space-y-3">
            @for (option of optionsArray.controls; track option; let i = $index) {
              <div class="flex items-center gap-3">
                <input
                  type="radio"
                  name="correctOption"
                  class="h-4 w-4"
                  [checked]="correctOptionIndex() === i"
                  [attr.aria-label]="'admin.questions.correctAnswer' | translate"
                  (change)="correctOptionIndex.set(i)"
                />
                <input
                  [formControlName]="i"
                  type="text"
                  class="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  class="text-xs font-semibold text-red-500 hover:text-red-700 disabled:opacity-30"
                  [disabled]="optionsArray.length <= 2"
                  (click)="removeOption(i)"
                >
                  ✕
                </button>
              </div>
            }
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700">{{ 'admin.questions.explanation' | translate }}</label>
          <textarea
            formControlName="explanation"
            rows="2"
            class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          ></textarea>
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2" dir="ltr">
          <div>
            <label class="block text-sm font-medium text-slate-700">{{ 'admin.questions.media' | translate }}</label>
            <select formControlName="mediaType" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option [ngValue]="null">{{ 'admin.questions.mediaNone' | translate }}</option>
              <option value="AUDIO">{{ 'admin.questions.mediaAudio' | translate }}</option>
              <option value="VIDEO">{{ 'admin.questions.mediaVideo' | translate }}</option>
              <option value="IMAGE">{{ 'admin.questions.mediaImage' | translate }}</option>
            </select>
          </div>
          @if (form.controls.mediaType.value) {
            <div>
              <label class="block text-sm font-medium text-slate-700">{{ 'admin.questions.mediaUrl' | translate }}</label>
              <input
                formControlName="mediaUrl"
                type="url"
                [placeholder]="'admin.questions.mediaUrlPlaceholder' | translate"
                class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <p class="mt-1 text-xs text-slate-500">
                {{ (form.controls.mediaType.value === 'IMAGE' ? 'admin.questions.mediaImageHint' : 'admin.questions.mediaUrlHint') | translate }}
              </p>
            </div>
          }
        </div>

        <div class="flex items-center gap-2" dir="ltr">
          <input id="active" type="checkbox" formControlName="active" class="h-4 w-4 rounded border-slate-300" />
          <label for="active" class="text-sm text-slate-700">{{ 'common.active' | translate }}</label>
        </div>

        <div class="flex justify-end gap-3" dir="ltr">
          <a
            routerLink="/admin/questions"
            class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            {{ 'common.cancel' | translate }}
          </a>
          <button
            type="submit"
            [disabled]="saving()"
            class="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
          >
            {{ 'common.save' | translate }}
          </button>
        </div>
      </form>
    </div>
  `,
})
export class QuestionFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly adminService = inject(AdminService);
  private readonly toastService = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly translateService = inject(TranslateService);

  protected readonly saving = signal(false);
  protected readonly isEdit = signal(false);
  protected readonly categories = signal<Category[]>([]);
  protected readonly correctOptionIndex = signal(0);
  // Difficulties the SELECTED category already has a question for (this
  // question's own id excluded in edit mode) — ticket: admins kept hitting
  // "A question already exists for this category and difficulty" because
  // the difficulty dropdown always defaulted to MEDIUM regardless of what
  // was already taken. Drives both the disabled options below and
  // autoPickDifficulty's smarter default for new questions.
  protected readonly takenDifficulties = signal<Set<Difficulty>>(new Set());

  protected readonly form = this.fb.nonNullable.group({
    categoryId: ['', Validators.required],
    difficulty: ['MEDIUM' as Difficulty, Validators.required],
    text: ['', Validators.required],
    explanation: [''],
    active: [true],
    options: this.fb.array([this.createOption(), this.createOption()]),
    mediaType: this.fb.control<QuestionMediaType | null>(null),
    mediaUrl: [''],
  });

  private questionId = '';

  protected get optionsArray() {
    return this.form.controls.options;
  }

  ngOnInit(): void {
    this.adminService.getCategories().subscribe((categories) => this.categories.set(categories));

    this.form.controls.categoryId.valueChanges
      .pipe(
        startWith(this.form.controls.categoryId.value),
        distinctUntilChanged(),
        switchMap((categoryId) => (categoryId ? this.adminService.getQuestions(categoryId) : of([]))),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((questions) => {
        const taken = new Set(
          questions.filter((q) => q.id !== this.questionId).map((q) => q.difficulty),
        );
        this.takenDifficulties.set(taken);
        if (!this.isEdit()) this.autoPickDifficulty(taken);
      });

    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEdit.set(true);
      this.questionId = id;
      this.adminService.getQuestion(id).subscribe({
        next: (question) => {
          this.form.patchValue({
            categoryId: question.categoryId,
            difficulty: question.difficulty,
            text: question.text,
            explanation: question.explanation ?? '',
            active: question.active,
            mediaType: question.mediaType,
            mediaUrl: question.mediaUrl ?? '',
          });
          this.optionsArray.clear();
          question.options.forEach((option) => this.optionsArray.push(this.createOption(option)));
          this.correctOptionIndex.set(question.correctOptionIndex);
        },
        error: (err: unknown) => this.toastService.error(apiErrorMessage(err, 'Could not load the question.')),
      });
    } else {
      const categoryIdParam = this.route.snapshot.queryParamMap.get('categoryId');
      if (categoryIdParam) this.form.patchValue({ categoryId: categoryIdParam });
    }
  }

  /** Only called for a new question — leaves an edited question's own difficulty alone. */
  private autoPickDifficulty(taken: Set<Difficulty>): void {
    const order: Difficulty[] = ['EASY', 'MEDIUM', 'HARD'];
    const current = this.form.controls.difficulty.value;
    if (!taken.has(current)) return;

    const next = order.find((difficulty) => !taken.has(difficulty));
    if (next) this.form.controls.difficulty.setValue(next);
  }

  protected addOption(): void {
    this.optionsArray.push(this.createOption());
  }

  protected removeOption(index: number): void {
    if (this.optionsArray.length <= 2) return;
    this.optionsArray.removeAt(index);

    if (this.correctOptionIndex() >= this.optionsArray.length) {
      this.correctOptionIndex.set(this.optionsArray.length - 1);
    } else if (this.correctOptionIndex() === index) {
      this.correctOptionIndex.set(0);
    } else if (this.correctOptionIndex() > index) {
      this.correctOptionIndex.update((i) => i - 1);
    }
  }

  protected submit(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();

    if (value.mediaType && !value.mediaUrl.trim()) {
      this.toastService.error('A clip URL is required when a media type is selected.');
      return;
    }

    this.saving.set(true);
    const payload = {
      categoryId: value.categoryId,
      difficulty: value.difficulty,
      text: value.text,
      options: value.options,
      correctOptionIndex: this.correctOptionIndex(),
      explanation: value.explanation || null,
      mediaType: value.mediaType,
      mediaUrl: value.mediaType ? value.mediaUrl.trim() : null,
      active: value.active,
    };
    const request = this.isEdit()
      ? this.adminService.updateQuestion(this.questionId, payload)
      : this.adminService.createQuestion(payload);

    request.subscribe({
      next: () => {
        this.toastService.success('Question saved.');
        this.router.navigateByUrl('/admin/questions');
      },
      error: (err: unknown) => {
        this.saving.set(false);
        this.toastService.error(apiErrorMessage(err, 'Could not save the question.'));
      },
    });
  }

  private createOption(value = '') {
    return this.fb.nonNullable.control(value, Validators.required);
  }
}
