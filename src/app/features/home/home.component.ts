import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HelperTool } from '../../core/models/helper-tool.model';
import { AuthService } from '../../core/services/auth.service';
import { ContactService } from '../../core/services/contact.service';
import { HelperToolService } from '../../core/services/helper-tool.service';
import { TranslateService } from '../../core/services/translate.service';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { ToastService } from '../../shared/services/toast.service';
import { apiErrorMessage } from '../../shared/utils/api-error';
import { helperToolIconUrl } from '../../shared/utils/helper-tool-icon';

interface Testimonial {
  initials: string;
  nameKey: string;
  roleKey: string;
  quoteKey: string;
}

const TESTIMONIALS: Testimonial[] = [
  { initials: 'ر.س', nameKey: 'home.testimonials.items.0.name', roleKey: 'home.testimonials.items.0.role', quoteKey: 'home.testimonials.items.0.quote' },
  { initials: 'م.ع', nameKey: 'home.testimonials.items.1.name', roleKey: 'home.testimonials.items.1.role', quoteKey: 'home.testimonials.items.1.quote' },
  { initials: 'ل.ح', nameKey: 'home.testimonials.items.2.name', roleKey: 'home.testimonials.items.2.role', quoteKey: 'home.testimonials.items.2.quote' },
];

const FAQ_COUNT = 5;

@Component({
  selector: 'app-home',
  imports: [RouterLink, TranslatePipe, ReactiveFormsModule, LoadingSpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative overflow-hidden bg-bg">
      <div class="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 py-16 sm:py-20 lg:grid-cols-2 lg:gap-6">
        <div class="flex flex-col items-center text-center lg:items-start lg:text-start">
          <span class="nb-badge animate-fade-in-up nb-badge-secondary normal-case">
            {{ 'home.hero.eyebrow' | translate }}
          </span>

          <h1 class="nb-heading animate-fade-in-up mt-5 min-h-15 text-5xl text-primary sm:text-6xl" style="animation-delay: 0.08s">
            سين جيم
          </h1>
          <p class="animate-fade-in-up mt-4 max-w-xl text-lg text-ink-soft" style="animation-delay: 0.16s">
            {{ 'home.hero.description' | translate }}
          </p>

          <div class="animate-fade-in-up mt-8 flex flex-wrap justify-center gap-4 lg:justify-start" style="animation-delay: 0.24s">
            <a routerLink="/play" class="nb-btn nb-btn-primary px-6 py-3 text-sm">
              {{ 'nav.play' | translate }}
            </a>
            <a href="#helper-tools" class="nb-btn nb-btn-outline px-6 py-3 text-sm">
              {{ 'home.hero.learnMore' | translate }}
            </a>
          </div>

          @if (!authService.isAuthenticated()) {
            <p class="animate-fade-in-up mt-6 text-sm text-ink-soft" style="animation-delay: 0.32s">
              {{ 'auth.login.noAccount' | translate }}
              <a routerLink="/register" class="nb-link">{{ 'auth.login.registerLink' | translate }}</a>
            </p>
          }
        </div>

        <div class="animate-fade-in-up nb-tilt flex justify-center" style="animation-delay: 0.2s">
          <svg viewBox="0 0 360 320" class="w-full max-w-md" role="presentation">
            <rect x="40" y="50" width="280" height="220" rx="20" fill="var(--color-surface)" stroke="var(--color-ink)" stroke-width="3" />
            @for (cell of boardCells; track $index) {
              <rect [attr.x]="cell.x" [attr.y]="cell.y" width="78" height="58" rx="8" [attr.fill]="cell.color" stroke="var(--color-ink)" stroke-width="2.5" />
              <text [attr.x]="cell.x + 39" [attr.y]="cell.y + 35" text-anchor="middle" font-size="16" font-weight="900" [attr.fill]="cell.text">
                {{ cell.points }}
              </text>
            }
            <circle cx="300" cy="60" r="34" fill="var(--color-secondary)" stroke="var(--color-ink)" stroke-width="3" />
            <path
              d="M290 48h20v10a10 10 0 0 1-20 0z M292 58c-6 0-9-4-9-9h9 M308 58c6 0 9-4 9-9h-9"
              fill="none"
              stroke="var(--color-ink)"
              stroke-width="2.5"
              stroke-linecap="round"
            />
            <rect x="296" y="66" width="8" height="8" fill="var(--color-ink)" />
          </svg>
        </div>
      </div>
    </div>

    <section class="border-t-2 border-ink bg-surface py-16">
      <div class="mx-auto max-w-4xl px-4 text-center">
        <h2 class="nb-heading animate-fade-in-up text-2xl text-ink sm:text-4xl">{{ 'home.about.title' | translate }}</h2>
        <p class="animate-fade-in-up mx-auto mt-4 max-w-2xl text-ink-soft" style="animation-delay: 0.06s">
          {{ 'home.about.body' | translate }}
        </p>

        <div class="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
          @for (stat of stats; track stat.labelKey; let i = $index) {
            <div class="nb-card nb-lift animate-fade-in-up p-6" [style.animation-delay.ms]="i * 60">
              <p class="nb-heading text-4xl text-primary">{{ stat.value }}</p>
              <p class="mt-1 text-sm font-semibold text-ink-soft">{{ stat.labelKey | translate }}</p>
            </div>
          }
        </div>
      </div>
    </section>

    <section id="helper-tools" class="border-t-2 border-ink bg-secondary-soft py-16">
      <div class="mx-auto max-w-6xl px-4">
        <div class="text-center">
          <h2 class="nb-heading animate-fade-in-up text-2xl text-ink sm:text-4xl">{{ 'home.helperTools.title' | translate }}</h2>
          <p class="animate-fade-in-up mx-auto mt-3 max-w-2xl text-ink-soft" style="animation-delay: 0.06s">
            {{ 'home.helperTools.subtitle' | translate }}
          </p>
        </div>

        @if (helperTools().length > 0) {
          <div class="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            @for (tool of helperTools(); track tool.id; let i = $index) {
              <div
                class="nb-card nb-lift animate-pop-in flex flex-col items-center p-5 text-center"
                [class]="i % 2 === 0 ? 'nb-tilt' : 'nb-tilt-alt'"
                [style.animation-delay.ms]="i * 70"
              >
                <img [src]="toolIcon(tool)" alt="" class="h-16 w-16 rounded-full border-2 border-ink object-cover" />
                <h3 class="mt-3 text-sm font-bold text-ink">{{ toolName(tool) }}</h3>
                <p class="mt-1.5 line-clamp-3 text-xs text-ink-soft">{{ toolDescription(tool) }}</p>
                <span class="nb-badge mt-3 normal-case" [class]="tool.timing === 'BEFORE_ONLY' ? 'nb-badge-primary' : 'nb-badge-secondary'">
                  {{ (tool.timing === 'BEFORE_ONLY' ? 'home.helperTools.beforeOnly' : 'home.helperTools.beforeOrDuring') | translate }}
                </span>
              </div>
            }
          </div>
        }
      </div>
    </section>

    <section class="border-t-2 border-ink bg-surface py-16">
      <div class="mx-auto max-w-5xl px-4">
        <h2 class="nb-heading animate-fade-in-up text-center text-2xl text-ink sm:text-4xl">
          {{ 'home.testimonials.title' | translate }}
        </h2>

        <div class="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
          @for (testimonial of testimonials; track testimonial.nameKey; let i = $index) {
            <div class="nb-card animate-fade-in-up p-6" [style.animation-delay.ms]="i * 80">
              <div class="flex items-center gap-3">
                <span class="flex h-10 w-10 items-center justify-center rounded-full border-2 border-ink bg-primary text-sm font-bold text-white">
                  {{ testimonial.initials }}
                </span>
                <div>
                  <p class="text-sm font-bold text-ink">{{ testimonial.nameKey | translate }}</p>
                  <p class="text-xs text-ink-soft">{{ testimonial.roleKey | translate }}</p>
                </div>
              </div>
              <p class="nb-accent mt-4 text-lg">"{{ testimonial.quoteKey | translate }}"</p>
            </div>
          }
        </div>
      </div>
    </section>

    <section class="border-t-2 border-ink bg-secondary-soft py-16">
      <div class="mx-auto max-w-3xl px-4">
        <h2 class="nb-heading animate-fade-in-up text-center text-2xl text-ink sm:text-4xl">
          {{ 'home.faq.title' | translate }}
        </h2>

        <div class="mt-8 space-y-3">
          @for (i of faqIndices; track i) {
            <div class="nb-card animate-fade-in-up overflow-hidden" [style.animation-delay.ms]="i * 50">
              <button
                type="button"
                class="flex w-full items-center justify-between gap-4 px-5 py-4 text-start text-sm font-bold text-ink"
                [attr.aria-expanded]="faqOpenIndex() === i"
                (click)="toggleFaq(i)"
              >
                <span>{{ 'home.faq.items.' + i + '.q' | translate }}</span>
                <span class="shrink-0 text-primary transition-transform duration-300" [class.rotate-180]="faqOpenIndex() === i">⌄</span>
              </button>
              <div class="faq-panel" [class.open]="faqOpenIndex() === i">
                <div class="overflow-hidden">
                  <p class="px-5 pb-4 text-sm text-ink-soft">{{ 'home.faq.items.' + i + '.a' | translate }}</p>
                </div>
              </div>
            </div>
          }
        </div>
      </div>
    </section>

    <section class="border-t-2 border-ink bg-surface py-16">
      <div class="mx-auto max-w-2xl px-4">
        <div class="text-center">
          <h2 class="nb-heading animate-fade-in-up text-2xl text-ink sm:text-4xl">{{ 'home.contact.title' | translate }}</h2>
          <p class="animate-fade-in-up mt-3 text-ink-soft" style="animation-delay: 0.06s">{{ 'home.contact.subtitle' | translate }}</p>
        </div>

        <form class="nb-card animate-fade-in-up mt-8 space-y-4 p-6" style="animation-delay: 0.1s" [formGroup]="contactForm" (ngSubmit)="submitContact()">
          <div>
            <label class="block text-sm font-semibold text-ink">{{ 'home.contact.name' | translate }}</label>
            <input type="text" formControlName="name" class="nb-input mt-1" />
          </div>
          <div>
            <label class="block text-sm font-semibold text-ink">{{ 'home.contact.email' | translate }}</label>
            <input type="email" formControlName="email" class="nb-input mt-1" />
          </div>
          <div>
            <label class="block text-sm font-semibold text-ink">{{ 'home.contact.message' | translate }}</label>
            <textarea formControlName="message" rows="4" class="nb-input mt-1"></textarea>
          </div>
          <div class="flex justify-center">
            <button type="submit" [disabled]="sendingContact()" class="nb-btn nb-btn-primary px-8 py-3 text-sm">
              @if (sendingContact()) {
                <app-loading-spinner [size]="16" variant="white" />
              }
              {{ 'home.contact.send' | translate }}
            </button>
          </div>
        </form>
      </div>
    </section>
  `,
})
export class HomeComponent {
  protected readonly authService = inject(AuthService);
  protected readonly translateService = inject(TranslateService);
  private readonly helperToolService = inject(HelperToolService);
  private readonly contactService = inject(ContactService);
  private readonly toastService = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  protected readonly helperTools = signal<HelperTool[]>([]);
  protected readonly faqOpenIndex = signal<number | null>(0);
  protected readonly sendingContact = signal(false);

  protected readonly testimonials = TESTIMONIALS;
  protected readonly faqIndices = Array.from({ length: FAQ_COUNT }, (_, i) => i);

  protected readonly boardCells = [
    { x: 60, y: 80, color: '#DC2626', text: '#FFFFFF', points: 200 },
    { x: 148, y: 80, color: '#F5B942', text: '#111111', points: 400 },
    { x: 236, y: 80, color: '#DC2626', text: '#FFFFFF', points: 600 },
    { x: 60, y: 150, color: '#F5B942', text: '#111111', points: 200 },
    { x: 148, y: 150, color: '#DC2626', text: '#FFFFFF', points: 400 },
    { x: 236, y: 150, color: '#F5B942', text: '#111111', points: 600 },
  ];

  protected readonly stats = [
    { value: '2', labelKey: 'home.about.stats.teams' },
    { value: '6+', labelKey: 'home.about.stats.categories' },
    { value: '3', labelKey: 'home.about.stats.helperTools' },
  ];

  protected readonly contactForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    message: ['', Validators.required],
  });

  constructor() {
    this.helperToolService.getHelperTools().subscribe({
      next: (tools) => this.helperTools.set(tools),
      error: () => {
        // Best-effort only — the rest of the landing page still renders fine.
      },
    });
  }

  protected toolIcon(tool: HelperTool): string {
    return helperToolIconUrl(tool);
  }

  protected toolName(tool: HelperTool): string {
    return this.translateService.lang() === 'ar' ? tool.nameAr : tool.nameEn;
  }

  protected toolDescription(tool: HelperTool): string {
    return this.translateService.lang() === 'ar' ? tool.descriptionAr : tool.descriptionEn;
  }

  protected toggleFaq(index: number): void {
    this.faqOpenIndex.update((current) => (current === index ? null : index));
  }

  protected submitContact(): void {
    if (this.contactForm.invalid || this.sendingContact()) {
      this.contactForm.markAllAsTouched();
      return;
    }

    this.sendingContact.set(true);
    this.contactService.send(this.contactForm.getRawValue()).subscribe({
      next: () => {
        this.sendingContact.set(false);
        this.contactForm.reset();
        this.toastService.success(this.translateService.t('home.contact.success'));
      },
      error: (err: unknown) => {
        this.sendingContact.set(false);
        this.toastService.error(apiErrorMessage(err, this.translateService.t('home.contact.error')));
      },
    });
  }
}
