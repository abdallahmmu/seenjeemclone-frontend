import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { TranslateService } from '../../core/services/translate.service';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { UserMenuComponent } from '../../shared/components/user-menu/user-menu.component';

interface AdminNavItem {
  path: string;
  labelKey: string;
  icon: string;
  superAdminOnly?: boolean;
}

const NAV_ITEMS: AdminNavItem[] = [
  { path: '/admin', labelKey: 'admin.nav.dashboard', icon: '📊' },
  { path: '/admin/category-groups', labelKey: 'admin.nav.categoryGroups', icon: '📁' },
  { path: '/admin/categories', labelKey: 'admin.nav.categories', icon: '🗂️' },
  { path: '/admin/questions', labelKey: 'admin.nav.questions', icon: '❓' },
  { path: '/admin/helper-tools', labelKey: 'admin.nav.helperTools', icon: '🧩' },
  { path: '/admin/credit-packages', labelKey: 'admin.nav.creditPackages', icon: '💳' },
  { path: '/admin/payment-methods', labelKey: 'admin.nav.paymentMethods', icon: '🏦' },
  { path: '/admin/purchase-orders', labelKey: 'admin.nav.purchaseOrders', icon: '🧾' },
  { path: '/admin/promo-codes', labelKey: 'admin.nav.promoCodes', icon: '🎟️' },
  { path: '/admin/banners', labelKey: 'admin.nav.banners', icon: '📣' },
  { path: '/admin/admins', labelKey: 'admin.nav.admins', icon: '👥', superAdminOnly: true },
  { path: '/admin/audit-logs', labelKey: 'admin.nav.auditLogs', icon: '📜', superAdminOnly: true },
  { path: '/admin/settings', labelKey: 'admin.nav.settings', icon: '⚙️', superAdminOnly: true },
];

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslatePipe, UserMenuComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex min-h-screen bg-slate-100">
      <aside class="hidden w-64 shrink-0 flex-col border-e border-slate-200 bg-white sm:flex">
        <div class="border-b border-slate-200 px-5 py-4">
          <a
            routerLink="/"
            class="bg-linear-to-l from-primary via-secondary to-primary bg-clip-text text-lg font-extrabold text-transparent"
          >
            سين جيم
          </a>
          <p class="text-xs text-slate-400">{{ 'nav.admin' | translate }}</p>
        </div>
        <nav class="flex-1 space-y-1 p-3">
          @for (item of visibleItems(); track item.path) {
            <a
              [routerLink]="item.path"
              routerLinkActive="bg-primary-soft text-primary-dark"
              [routerLinkActiveOptions]="{ exact: item.path === '/admin' }"
              class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              <span>{{ item.icon }}</span>
              <span>{{ item.labelKey | translate }}</span>
            </a>
          }
        </nav>
        <div class="border-t border-slate-200 p-3">
          <a routerLink="/" class="block rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
            ← {{ 'nav.home' | translate }}
          </a>
        </div>
      </aside>

      <div class="flex min-w-0 flex-1 flex-col">
        <header class="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
          <span class="text-xs font-medium text-slate-400">{{ authService.currentUser()?.role }}</span>
          <div class="flex items-center gap-3">
            <button
              type="button"
              class="rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              (click)="translateService.toggleLang()"
            >
              {{ translateService.lang() === 'en' ? 'AR' : 'EN' }}
            </button>
            <app-user-menu />
          </div>
        </header>
        <main class="flex-1 overflow-y-auto p-4 sm:p-6">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class AdminLayoutComponent {
  protected readonly authService = inject(AuthService);
  protected readonly translateService = inject(TranslateService);

  protected readonly visibleItems = computed(() =>
    NAV_ITEMS.filter((item) => !item.superAdminOnly || this.authService.isSuperAdmin()),
  );
}
