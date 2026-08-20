import { NgTemplateOutlet } from '@angular/common';
import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDropList } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component, TemplateRef, computed, contentChild, input, output } from '@angular/core';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { DataTableColumn, SortChange } from './data-table.models';

/**
 * Generic sortable, paginated table. Project a `<ng-template #rowActions let-row>` for a per-row
 * actions column. Set `reorderable` to enable a drag handle column and listen to `(reorder)`.
 */
@Component({
  selector: 'app-data-table',
  imports: [NgTemplateOutlet, TranslatePipe, CdkDropList, CdkDrag, CdkDragHandle],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table class="min-w-full divide-y divide-slate-200 text-sm">
        <thead class="bg-slate-50">
          <tr>
            @if (reorderable()) {
              <th scope="col" class="w-8 px-2 py-3"></th>
            }
            @for (column of columns(); track column.key) {
              <th
                scope="col"
                class="px-4 py-3 text-start font-semibold text-slate-600"
                [class.cursor-pointer]="column.sortable"
                (click)="column.sortable && onSort(column.key)"
              >
                <span class="inline-flex items-center gap-1">
                  {{ column.labelKey | translate }}
                  @if (column.sortable && sortKey() === column.key) {
                    <span>{{ sortDir() === 'asc' ? '▲' : '▼' }}</span>
                  }
                </span>
              </th>
            }
            @if (actionsTemplate()) {
              <th scope="col" class="px-4 py-3 text-end font-semibold text-slate-600">
                {{ 'common.actions' | translate }}
              </th>
            }
          </tr>
        </thead>
        <tbody
          cdkDropList
          [cdkDropListDisabled]="!reorderable()"
          (cdkDropListDropped)="onDrop($event)"
          class="divide-y divide-slate-100"
        >
          @if (loading()) {
            <tr>
              <td [attr.colspan]="columns().length + 1" class="px-4 py-10 text-center text-slate-400">
                {{ 'common.loading' | translate }}
              </td>
            </tr>
          } @else if (rows().length === 0) {
            <tr>
              <td [attr.colspan]="columns().length + 1" class="px-4 py-10 text-center text-slate-400">
                {{ 'common.noResults' | translate }}
              </td>
            </tr>
          } @else {
            @for (row of rows(); track trackBy()(row)) {
              <tr
                cdkDrag
                [cdkDragDisabled]="!reorderable()"
                class="bg-white hover:bg-slate-50"
                [class.cursor-pointer]="rowClickable()"
                (click)="rowClick.emit(row)"
              >
                @if (reorderable()) {
                  <td class="w-8 px-2 py-3 text-slate-300" (click)="$event.stopPropagation()">
                    <span cdkDragHandle class="cursor-grab select-none hover:text-slate-500">⠿</span>
                  </td>
                }
                @for (column of columns(); track column.key) {
                  <td class="px-4 py-3 text-slate-700">{{ cellValue(row, column) }}</td>
                }
                @if (actionsTemplate()) {
                  <td class="px-4 py-3 text-end" (click)="$event.stopPropagation()">
                    <ng-container *ngTemplateOutlet="actionsTemplate()!; context: { $implicit: row }" />
                  </td>
                }
              </tr>
            }
          }
        </tbody>
      </table>
    </div>
    @if (total() > pageSize()) {
      <div class="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
        <span>{{ rangeStart() }}–{{ rangeEnd() }} / {{ total() }}</span>
        <div class="flex gap-2">
          <button
            type="button"
            class="rounded-md border border-slate-300 px-3 py-1 disabled:opacity-40"
            [disabled]="page() <= 1"
            (click)="pageChange.emit(page() - 1)"
          >
            ‹
          </button>
          <button
            type="button"
            class="rounded-md border border-slate-300 px-3 py-1 disabled:opacity-40"
            [disabled]="rangeEnd() >= total()"
            (click)="pageChange.emit(page() + 1)"
          >
            ›
          </button>
        </div>
      </div>
    }
  `,
})
export class DataTableComponent<T> {
  readonly columns = input.required<DataTableColumn<T>[]>();
  readonly rows = input.required<T[]>();
  readonly loading = input(false);
  readonly page = input(1);
  readonly pageSize = input(10);
  readonly total = input(0);
  readonly sortKey = input<string | null>(null);
  readonly sortDir = input<'asc' | 'desc'>('asc');
  readonly rowClickable = input(false);
  readonly reorderable = input(false);
  readonly trackBy = input<(row: T) => unknown>((row: T) => row);

  readonly actionsTemplate = contentChild<TemplateRef<{ $implicit: T }>>('rowActions');

  readonly sortChange = output<SortChange>();
  readonly pageChange = output<number>();
  readonly rowClick = output<T>();
  readonly reorder = output<{ previousIndex: number; currentIndex: number }>();

  protected readonly rangeStart = computed(() => (this.total() === 0 ? 0 : (this.page() - 1) * this.pageSize() + 1));
  protected readonly rangeEnd = computed(() => Math.min(this.page() * this.pageSize(), this.total()));

  protected cellValue(row: T, column: DataTableColumn<T>): string {
    if (column.cell) return column.cell(row);
    const value = (row as Record<string, unknown>)[column.key];
    return value == null ? '' : String(value);
  }

  protected onSort(key: string): void {
    const dir = this.sortKey() === key && this.sortDir() === 'asc' ? 'desc' : 'asc';
    this.sortChange.emit({ key, dir });
  }

  protected onDrop(event: CdkDragDrop<unknown>): void {
    if (event.previousIndex === event.currentIndex) return;
    this.reorder.emit({ previousIndex: event.previousIndex, currentIndex: event.currentIndex });
  }
}
