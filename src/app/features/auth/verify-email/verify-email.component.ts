import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { apiErrorMessage } from '../../../shared/utils/api-error';

type VerifyPhase = 'verifying' | 'success' | 'error';

@Component({
  selector: 'app-verify-email',
  imports: [RouterLink, TranslatePipe, LoadingSpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex min-h-[calc(100vh-8rem)] items-center justify-center bg-bg px-4 py-12">
      <div class="w-full max-w-sm">
        <div class="nb-card p-8 text-center">
          @switch (phase()) {
            @case ('verifying') {
              <app-loading-spinner [size]="32" />
              <p class="mt-4 text-sm text-ink-soft">{{ 'auth.verifyEmail.verifying' | translate }}</p>
            }
            @case ('success') {
              <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-full border-2 border-ink bg-secondary text-2xl">✓</div>
              <h1 class="nb-heading mt-4 text-lg text-ink">{{ 'auth.verifyEmail.successTitle' | translate }}</h1>
              <p class="mt-1 text-sm text-ink-soft">{{ 'auth.verifyEmail.successSubtitle' | translate }}</p>
            }
            @case ('error') {
              <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-full border-2 border-ink bg-primary text-2xl text-white">
                ✕
              </div>
              <h1 class="nb-heading mt-4 text-lg text-ink">{{ 'auth.verifyEmail.errorTitle' | translate }}</h1>
              <p class="mt-1 text-sm text-ink-soft">{{ errorMessage() }}</p>
            }
          }

          <p class="mt-6 text-center text-sm text-ink-soft">
            <a routerLink="/" class="nb-link">{{ 'auth.verifyEmail.goHome' | translate }}</a>
          </p>
        </div>
      </div>
    </div>
  `,
})
export class VerifyEmailComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  protected readonly phase = signal<VerifyPhase>('verifying');
  protected readonly errorMessage = signal('');

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');

    if (!token) {
      this.phase.set('error');
      this.errorMessage.set('This verification link is missing its token.');
      return;
    }

    this.authService.verifyEmail(token).subscribe({
      next: () => this.phase.set('success'),
      error: (err: unknown) => {
        this.phase.set('error');
        this.errorMessage.set(apiErrorMessage(err, 'This verification link is invalid or has expired.'));
      },
    });
  }
}
