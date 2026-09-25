import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Banner } from '../../../core/models/banner.model';
import { AuthService } from '../../../core/services/auth.service';
import { BannerService } from '../../services/banner.service';
import { backendAssetUrl } from '../../utils/backend-asset-url';

/**
 * Popup ad banners shown once per login, fetched a single time per app
 * session right after authentication (see the guard in ngOnInit — repeated
 * navigations never re-trigger the fetch). Renders every banner the backend
 * says is due right now, stacked "above each other" in admin-`order`
 * sequence — the first (lowest order) banner is on top and must be closed
 * before the next one underneath becomes reachable, since each is a
 * full-screen backdrop.
 */
@Component({
  selector: 'app-banner-popup-stack',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (banner of banners(); track banner.id; let i = $index) {
      @if (i === 0) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4">
          <div class="relative max-h-[90vh] max-w-lg">
            <button
              type="button"
              class="nb-btn nb-btn-primary absolute -inset-e-3 -top-3 h-9 w-9 rounded-full! p-0 text-sm"
              (click)="dismiss(banner)"
              aria-label="Close"
            >
              ✕
            </button>
            @if (banner.linkUrl) {
              <a [href]="isExternalLink(banner.linkUrl) ? banner.linkUrl : undefined" (click)="onBannerClick($event, banner)">
                <img [src]="assetUrl(banner.imageUrl)" alt="" class="nb-card max-h-[85vh] w-full object-contain p-1.5" />
              </a>
            } @else {
              <img [src]="assetUrl(banner.imageUrl)" alt="" class="nb-card max-h-[85vh] w-full object-contain p-1.5" />
            }
          </div>
        </div>
      }
    }
  `,
})
export class BannerPopupStackComponent {
  private readonly bannerService = inject(BannerService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly banners = signal<Banner[]>([]);
  private fetchedForSession = false;

  constructor() {
    // `isAuthenticated` flips true asynchronously, however long session
    // restore (tryRestoreSession) or a fresh login takes — an OnInit check
    // at root-component bootstrap would almost always read false, before
    // that resolves. Reacting to the signal instead fires exactly once per
    // login (the fetchedForSession guard), and resets on logout so logging
    // back in in the same SPA session shows the popups again.
    effect(() => {
      const authenticated = this.authService.isAuthenticated() && this.authService.currentUser()?.role == 'PLAYER';

      if (authenticated && !this.fetchedForSession) {
        this.fetchedForSession = true;
        this.bannerService.getActiveBanners().subscribe({
          next: (banners) => this.banners.set(banners),
          error: () => {
            // Best-effort only — no ads is not worth surfacing an error for.
          },
        });
      } else if (!authenticated) {
        this.fetchedForSession = false;
        this.banners.set([]);
      }
    });
  }

  protected assetUrl(path: string): string {
    return backendAssetUrl(path);
  }

  protected isExternalLink(link: string): boolean {
    return /^https?:\/\//.test(link);
  }

  protected onBannerClick(event: Event, banner: Banner): void {
    const link = banner.linkUrl;
    if (!link || this.isExternalLink(link)) {
      this.dismiss(banner);
      return;
    }

    event.preventDefault();
    this.dismiss(banner);
    this.router.navigateByUrl(link);
  }

  protected dismiss(banner: Banner): void {
    this.banners.update((list) => list.filter((b) => b.id !== banner.id));
  }
}
