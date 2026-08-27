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
    <div class="flex min-h-screen flex-col bg-slate-50">
      <header class="border-b border-slate-200 bg-white">
        <div class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <a
            routerLink="/"
            class="bg-linear-to-l from-primary via-secondary to-primary bg-clip-text text-xl font-extrabold text-transparent"
          >
            سين جيم
          </a>

          <nav class="hidden items-center gap-6 text-sm font-medium text-slate-600 sm:flex">
            <a routerLink="/" class="transition hover:text-primary" routerLinkActive="text-primary" [routerLinkActiveOptions]="{ exact: true }">{{
              'nav.home' | translate
            }}</a>
            <a routerLink="/play" class="transition hover:text-primary" routerLinkActive="text-primary">{{ 'nav.play' | translate }}</a>
            <a routerLink="/shop" class="transition hover:text-primary" routerLinkActive="text-primary">{{ 'nav.shop' | translate }}</a>
            @if (authService.isAdmin()) {
              <a routerLink="/admin" class="transition hover:text-primary" routerLinkActive="text-primary">{{ 'nav.admin' | translate }}</a>
            }
          </nav>

          <div class="flex items-center gap-3">
            <button
              type="button"
              class="rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              (click)="translateService.toggleLang()"
            >
              {{ translateService.lang() === 'en' ? 'AR' : 'EN' }}
            </button>

            @if (authService.isAuthenticated()) {
              <app-user-menu />
            } @else {
              <a routerLink="/login" class="rounded-md px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100">{{
                'nav.login' | translate
              }}</a>
              <a
                routerLink="/register"
                class="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-dark"
              >
                {{ 'nav.register' | translate }}
              </a>
            }
          </div>
        </div>
      </header>

      <main class="flex-1">
        <router-outlet />
      </main>

      <footer class="border-t border-slate-200 bg-white py-6 text-center text-sm text-slate-500">
        © {{ year }} Seenjeem
      </footer>
    </div>
  `,
})
export class PublicLayoutComponent {
  protected readonly authService = inject(AuthService);
  protected readonly translateService = inject(TranslateService);

  protected readonly year = new Date().getFullYear();
}
