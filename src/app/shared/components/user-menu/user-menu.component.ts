import { ChangeDetectionStrategy, Component, HostListener, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { PromoCodeDialogComponent } from '../promo-code-dialog/promo-code-dialog.component';
import { UserAvatarComponent } from '../user-avatar/user-avatar.component';

/** Header dropdown: avatar + handle trigger, "My account" (profile settings), promo code redemption, and "Log out" — shared by the public and admin layouts. */
@Component({
  selector: 'app-user-menu',
  imports: [RouterLink, TranslatePipe, UserAvatarComponent, PromoCodeDialogComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative">
      <button
        type="button"
        class="flex items-center gap-2 rounded-lg border-2 border-transparent px-2 py-1 text-sm font-semibold text-ink transition-colors hover:border-ink hover:bg-secondary-soft"
        (click)="toggle($event)"
      >
        <app-user-avatar
          [avatarUrl]="authService.currentUser()?.avatarUrl ?? null"
          [handle]="authService.currentUser()?.handle ?? ''"
          [size]="28"
        />
        <span class="hidden sm:inline">{{ authService.currentUser()?.handle }}</span>
        <span class="text-xs text-ink-soft">▾</span>
      </button>

      @if (open()) {
        <div class="nb-card absolute end-0 z-20 mt-2 w-48 overflow-hidden rounded-lg! py-1">
          <a routerLink="/profile" class="block px-4 py-2 text-sm font-medium text-ink hover:bg-secondary-soft">
            {{ 'nav.myAccount' | translate }}
          </a>
          <a routerLink="/history" class="block px-4 py-2 text-sm font-medium text-ink hover:bg-secondary-soft">
            {{ 'nav.gameHistory' | translate }}
          </a>
          <button
            type="button"
            class="block w-full px-4 py-2 text-start text-sm font-medium text-ink hover:bg-secondary-soft"
            (click)="openPromoDialog($event)"
          >
            {{ 'nav.havePromoCode' | translate }}
          </button>
          <button
            type="button"
            class="block w-full px-4 py-2 text-start text-sm font-medium text-primary hover:bg-primary-soft"
            (click)="logout()"
          >
            {{ 'nav.logout' | translate }}
          </button>
        </div>
      }
    </div>

    <app-promo-code-dialog [open]="promoDialogOpen()" (closed)="promoDialogOpen.set(false)" />
  `,
})
export class UserMenuComponent {
  protected readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly open = signal(false);
  protected readonly promoDialogOpen = signal(false);

  protected toggle(event: Event): void {
    event.stopPropagation();
    this.open.update((value) => !value);
  }

  @HostListener('document:click')
  protected onDocumentClick(): void {
    this.open.set(false);
  }

  protected openPromoDialog(event: Event): void {
    event.stopPropagation();
    this.open.set(false);
    this.promoDialogOpen.set(true);
  }

  protected logout(): void {
    this.authService.logout().subscribe(() => this.router.navigateByUrl('/'));
  }
}
