import { ChangeDetectionStrategy, Component, HostListener, effect, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, Subject, catchError, debounceTime, of, switchMap } from 'rxjs';
import { TranslatePipe } from '../../pipes/translate.pipe';

export interface UserSearchOption {
  handle: string;
  email: string;
}

/**
 * Free-text handle input with a live searchable dropdown underneath — the
 * text itself IS the value (backward compatible with a plain handle typed
 * directly, since the promo-code backend resolves by exact handle either
 * way), the dropdown is just a faster way to find one. `searchFn` is
 * supplied by the parent (rather than this component owning an HTTP call
 * itself) so a shared component doesn't need to depend on any one feature's
 * service.
 */
@Component({
  selector: 'app-user-search-select',
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative" (click)="$event.stopPropagation()">
      <input
        type="text"
        [value]="query()"
        [placeholder]="placeholder()"
        class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        (input)="onInput($any($event.target).value)"
        (focus)="open.set(true)"
      />

      @if (open() && query().trim().length > 0) {
        <div class="absolute z-10 mt-1 w-full max-h-56 overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg">
          @if (searching()) {
            <div class="px-3 py-2 text-xs text-slate-400">{{ 'common.loading' | translate }}</div>
          } @else if (results().length === 0) {
            <div class="px-3 py-2 text-xs text-slate-400">{{ 'common.noResults' | translate }}</div>
          } @else {
            @for (option of results(); track option.handle) {
              <button
                type="button"
                class="block w-full px-3 py-2 text-start text-sm hover:bg-slate-50"
                (click)="select(option)"
              >
                <span class="font-medium text-slate-800">&#64;{{ option.handle }}</span>
                <span class="ms-2 text-xs text-slate-400">{{ option.email }}</span>
              </button>
            }
          }
        </div>
      }
    </div>
  `,
})
export class UserSearchSelectComponent {
  readonly value = input('');
  readonly placeholder = input('');
  readonly searchFn = input.required<(query: string) => Observable<UserSearchOption[]>>();

  readonly valueChange = output<string>();

  protected readonly query = signal('');
  protected readonly results = signal<UserSearchOption[]>([]);
  protected readonly searching = signal(false);
  protected readonly open = signal(false);

  private readonly querySubject = new Subject<string>();
  private lastSyncedValue = '';

  constructor() {
    this.querySubject
      .pipe(
        debounceTime(250),
        switchMap((raw) => {
          const trimmed = raw.trim();
          if (trimmed.length === 0) return of<UserSearchOption[]>([]);
          this.searching.set(true);
          return this.searchFn()(trimmed).pipe(catchError(() => of<UserSearchOption[]>([])));
        }),
        takeUntilDestroyed(),
      )
      .subscribe((results) => {
        this.results.set(results);
        this.searching.set(false);
      });

    // Reflects an externally-set value (e.g. an existing promo code's
    // target loaded async after this component already rendered) without
    // clobbering text the person is actively typing — only re-syncs when
    // the input actually changed since the last sync.
    effect(() => {
      const external = this.value();
      if (external !== this.lastSyncedValue) {
        this.lastSyncedValue = external;
        this.query.set(external);
      }
    });
  }

  @HostListener('document:click')
  protected closeDropdown(): void {
    this.open.set(false);
  }

  protected onInput(value: string): void {
    this.query.set(value);
    this.open.set(true);
    this.querySubject.next(value);
    this.valueChange.emit(value);
  }

  protected select(option: UserSearchOption): void {
    this.lastSyncedValue = option.handle;
    this.query.set(option.handle);
    this.open.set(false);
    this.results.set([]);
    this.valueChange.emit(option.handle);
  }
}
