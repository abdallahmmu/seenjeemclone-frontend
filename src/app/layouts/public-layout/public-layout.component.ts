import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { TranslateService } from '../../core/services/translate.service';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { UserMenuComponent } from '../../shared/components/user-menu/user-menu.component';

@Component({
  selector: 'app-public-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslatePipe, UserMenuComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex min-h-screen flex-col bg-bg">
      <header class="border-b-2 border-ink bg-surface">
        <div class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <a routerLink="/" class="nb-heading text-xl text-primary sm:text-2xl"> سين جيم </a>

          <nav class="hidden items-center gap-6 text-sm font-semibold text-ink-soft sm:flex">
            <a
              routerLink="/"
              class="nb-underline transition-colors hover:text-primary"
              routerLinkActive="is-active text-primary"
              [routerLinkActiveOptions]="{ exact: true }"
              >{{ 'nav.home' | translate }}</a
            >
            <a routerLink="/play" class="nb-underline transition-colors hover:text-primary" routerLinkActive="is-active text-primary">{{
              'nav.play' | translate
            }}</a>
            <a routerLink="/shop" class="nb-underline transition-colors hover:text-primary" routerLinkActive="is-active text-primary">{{
              'nav.shop' | translate
            }}</a>
            @if (authService.isAdmin()) {
              <a routerLink="/admin" class="nb-underline transition-colors hover:text-primary" routerLinkActive="is-active text-primary">{{
                'nav.admin' | translate
              }}</a>
            }
          </nav>

          <div class="flex items-center gap-3">
            <button type="button" class="nb-btn nb-btn-outline px-2.5 py-1 text-xs" (click)="translateService.toggleLang()">
              {{ translateService.lang() === 'en' ? 'AR' : 'EN' }}
            </button>

            @if (authService.isAuthenticated()) {
              <app-user-menu />
            } @else {
              <a routerLink="/login" class="nb-underline px-1 py-1.5 text-sm font-semibold text-ink">{{ 'nav.login' | translate }}</a>
              <a routerLink="/register" class="nb-btn nb-btn-primary px-3 py-1.5 text-sm">
                {{ 'nav.register' | translate }}
              </a>
            }
          </div>
        </div>
      </header>

      <main class="flex-1">
        <router-outlet />
      </main>

      <footer class="border-t-2 border-ink bg-surface py-6 text-center text-sm text-ink-soft"> © {{ year }} Seenjeem </footer>
    </div>
  `,
})
export class PublicLayoutComponent {
  protected readonly authService = inject(AuthService);
  protected readonly translateService = inject(TranslateService);

  protected readonly year = new Date().getFullYear();
}
