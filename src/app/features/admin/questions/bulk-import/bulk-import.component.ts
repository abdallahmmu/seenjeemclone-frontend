import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { BulkImportResponse } from '../../../../core/models/question.model';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { ToastService } from '../../../../shared/services/toast.service';
import { apiErrorMessage } from '../../../../shared/utils/api-error';
import { AdminService } from '../../services/admin.service';

type PendingImport = { format: 'json'; questions: unknown[] } | { format: 'csv'; csv: string };

@Component({
  selector: 'app-bulk-import',
  imports: [TranslatePipe, LoadingSpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto max-w-4xl">
      <h1 class="text-2xl font-bold text-slate-900">{{ 'admin.import.title' | translate }}</h1>

      <div class="mt-6 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
        <label class="cursor-pointer text-sm font-semibold text-primary hover:text-primary-dark">
          {{ previewing() ? '…' : ('admin.import.upload' | translate) }}
          <input type="file" accept=".csv,.json" class="hidden" (change)="onFileSelected($event)" />
        </label>
        <p class="mt-2 text-xs text-slate-400">{{ 'admin.import.hint' | translate }}</p>
        <div class="mt-4 flex items-center justify-center gap-4">
          <button
            type="button"
            class="text-xs font-semibold text-primary hover:text-primary-dark"
            (click)="downloadCsvExample()"
          >
            ⭳ {{ 'admin.import.downloadCsvExample' | translate }}
          </button>
          <button
            type="button"
            class="text-xs font-semibold text-primary hover:text-primary-dark"
            (click)="downloadJsonExample()"
          >
            ⭳ {{ 'admin.import.downloadJsonExample' | translate }}
          </button>
        </div>
      </div>

      @if (result(); as r) {
        <div class="mt-6 flex items-center gap-4 text-sm">
          <span class="font-semibold text-emerald-600">{{
            'admin.import.rowsValid' | translate: { count: r.summary.valid }
          }}</span>
          <span class="font-semibold text-red-600">{{
            'admin.import.rowsInvalid' | translate: { count: r.summary.invalid }
          }}</span>
        </div>

        @if (r.mode === 'PREVIEW') {
          <div class="mt-3 overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table class="min-w-full divide-y divide-slate-200 text-sm">
              <thead class="bg-slate-50">
                <tr>
                  <th class="px-4 py-2 text-start font-semibold text-slate-600">#</th>
                  <th class="px-4 py-2 text-start font-semibold text-slate-600">
                    {{ 'admin.questions.questionText' | translate }}
                  </th>
                  <th class="px-4 py-2 text-start font-semibold text-slate-600">
                    {{ 'admin.questions.difficulty' | translate }}
                  </th>
                  <th class="px-4 py-2 text-start font-semibold text-slate-600">{{ 'common.status' | translate }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                @for (row of r.rows; track row.rowIndex) {
                  <tr [class.bg-red-50]="!row.valid">
                    <td class="px-4 py-2 text-slate-500">{{ row.rowIndex + 1 }}</td>
                    <td class="px-4 py-2 text-slate-700">{{ row.data?.text ?? '—' }}</td>
                    <td class="px-4 py-2 text-slate-700">{{ row.data?.difficulty ?? '—' }}</td>
                    <td class="px-4 py-2">
                      @if (row.valid) {
                        <span class="text-emerald-600">✓</span>
                      } @else {
                        <span class="text-red-600">{{ (row.errors ?? []).join(', ') }}</span>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <div class="mt-4 flex items-center justify-end gap-3">
            @if (!canCommit()) {
              <p class="text-xs text-amber-600">Fix the errors above and re-upload before importing.</p>
            }
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
              [disabled]="!canCommit() || importing()"
              (click)="commit()"
            >
              @if (importing()) {
                <app-loading-spinner [size]="16" variant="white" />
              }
              {{ 'admin.import.commit' | translate }}
            </button>
          </div>
        } @else {
          <p class="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {{ r.imported.length }} question(s) imported.
          </p>
        }
      }
    </div>
  `,
})
export class BulkImportComponent {
  private readonly adminService = inject(AdminService);
  private readonly toastService = inject(ToastService);

  protected readonly result = signal<BulkImportResponse | null>(null);
  protected readonly previewing = signal(false);
  protected readonly importing = signal(false);

  private pending: PendingImport | null = null;

  protected readonly canCommit = computed(() => {
    const result = this.result();
    return !!result && result.mode === 'PREVIEW' && result.summary.invalid === 0;
  });

  /**
   * A category can hold many questions per difficulty now (a pool, not
   * exactly one) — these examples show two rows for the SAME categoryId +
   * difficulty to make that obvious, plus one media row. The categoryId
   * itself is a placeholder: real ids only exist per-deployment (visible in
   * the categories admin page's URL/API), so there's nothing real to embed
   * here — the hint text below the upload button says as much.
   */
  private readonly examplePlaceholderCategoryId = 'REPLACE_WITH_A_REAL_CATEGORY_ID';

  private readonly exampleRows: Record<string, unknown>[] = [
    {
      categoryId: this.examplePlaceholderCategoryId,
      difficulty: 'EASY',
      text: 'ما هي عاصمة مصر؟',
      options: ['القاهرة', 'الإسكندرية', 'الجيزة', 'الأقصر'],
      correctOptionIndex: 0,
      explanation: 'القاهرة هي عاصمة جمهورية مصر العربية.',
      mediaType: null,
      mediaUrl: null,
    },
    {
      categoryId: this.examplePlaceholderCategoryId,
      difficulty: 'EASY',
      text: 'ما هي عاصمة السعودية؟',
      options: ['جدة', 'الرياض', 'مكة', 'الدمام'],
      correctOptionIndex: 1,
      explanation: 'الرياض هي عاصمة المملكة العربية السعودية.',
      mediaType: null,
      mediaUrl: null,
    },
    {
      categoryId: this.examplePlaceholderCategoryId,
      difficulty: 'MEDIUM',
      text: 'من هذا الشخص؟',
      options: ['الخيار أ', 'الخيار ب', 'الخيار ج', 'الخيار د'],
      correctOptionIndex: 0,
      explanation: '',
      mediaType: 'IMAGE',
      mediaUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Example.jpg',
    },
  ];

  private downloadTextFile(filename: string, contents: string, mimeType: string): void {
    const blob = new Blob([contents], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  protected downloadCsvExample(): void {
    const header = 'categoryId,difficulty,text,options,correctOptionIndex,explanation,mediaType,mediaUrl';
    const lines = this.exampleRows.map((row) => {
      const options = (row['options'] as string[]).join('|');
      return [
        row['categoryId'],
        row['difficulty'],
        row['text'],
        options,
        row['correctOptionIndex'],
        row['explanation'] ?? '',
        row['mediaType'] ?? '',
        row['mediaUrl'] ?? '',
      ].join(',');
    });
    this.downloadTextFile('questions-example.csv', [header, ...lines].join('\n'), 'text/csv');
  }

  protected downloadJsonExample(): void {
    this.downloadTextFile(
      'questions-example.json',
      JSON.stringify(this.exampleRows, null, 2),
      'application/json',
    );
  }

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? '');
      const isJson = file.name.toLowerCase().endsWith('.json');

      if (isJson) {
        try {
          const questions: unknown = JSON.parse(text);
          if (!Array.isArray(questions)) throw new Error('not an array');
          this.pending = { format: 'json', questions };
        } catch {
          this.toastService.error('The JSON file must contain an array of questions.');
          return;
        }
      } else {
        this.pending = { format: 'csv', csv: text };
      }

      this.runPreview();
    };
    reader.readAsText(file);
    input.value = '';
  }

  protected commit(): void {
    if (!this.pending || this.importing() || !this.canCommit()) return;

    this.importing.set(true);
    const request =
      this.pending.format === 'json'
        ? this.adminService.commitBulkImportJson(this.pending.questions)
        : this.adminService.commitBulkImportCsv(this.pending.csv);

    request.subscribe({
      next: (response) => {
        this.importing.set(false);
        this.result.set(response);
        this.pending = null;
        if (response.mode === 'COMMIT') {
          this.toastService.success(`${response.imported.length} question(s) imported.`);
        }
      },
      error: (err: unknown) => {
        this.importing.set(false);
        this.toastService.error(apiErrorMessage(err, 'Import failed.'));
      },
    });
  }

  private runPreview(): void {
    if (!this.pending) return;

    this.previewing.set(true);
    const request =
      this.pending.format === 'json'
        ? this.adminService.previewBulkImportJson(this.pending.questions)
        : this.adminService.previewBulkImportCsv(this.pending.csv);

    request.subscribe({
      next: (response) => {
        this.previewing.set(false);
        this.result.set(response);
      },
      error: (err: unknown) => {
        this.previewing.set(false);
        this.toastService.error(apiErrorMessage(err, 'Could not parse the file.'));
      },
    });
  }
}
