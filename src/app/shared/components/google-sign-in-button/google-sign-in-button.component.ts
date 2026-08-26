import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, inject, input, output, viewChild } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { TranslateService } from '../../../core/services/translate.service';

// Minimal shape of the Google Identity Services global — loaded via the
// <script src="https://accounts.google.com/gsi/client"> tag in index.html,
// not an npm package, so there's no real type definition to import.
interface GoogleAccountsId {
  initialize(config: {
    client_id: string;
    callback: (response: { credential: string }) => void;
    use_fedcm_for_prompt?: boolean;
    use_fedcm_for_button?: boolean;
  }): void;
  renderButton(
    parent: HTMLElement,
    options: { type: 'standard'; theme: 'outline'; size: 'large'; width: number; text: 'signin_with' | 'signup_with'; locale: string },
  ): void;
}

declare const google: { accounts: { id: GoogleAccountsId } } | undefined;

const GOOGLE_SCRIPT_POLL_INTERVAL_MS = 100;
const GOOGLE_SCRIPT_POLL_TIMEOUT_MS = 5000;

/**
 * Wraps Google Identity Services' own rendered button (not a custom-styled
 * button calling a popup API — GSI requires its own button element for the
 * One Tap / auto-select UX to work correctly). The `<script>` tag is static
 * in index.html and loaded `defer`, so it usually — but not guaranteedly —
 * has already run by the time this component initializes; pollForGoogle
 * covers the race rather than assuming load order.
 */
@Component({
  selector: 'app-google-sign-in-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div #container></div>`,
})
export class GoogleSignInButtonComponent implements AfterViewInit {
  private readonly translateService = inject(TranslateService);
  private readonly container = viewChild.required<ElementRef<HTMLDivElement>>('container');

  /** 'signin_with' on the login page, 'signup_with' on the register page — Google's own button copy. */
  readonly text = input<'signin_with' | 'signup_with'>('signin_with');
  readonly credential = output<string>();

  ngAfterViewInit(): void {
    this.pollForGoogle(Date.now());
  }

  private pollForGoogle(startedAt: number): void {
    if (typeof google !== 'undefined') {
      this.render(google);
      return;
    }

    if (Date.now() - startedAt > GOOGLE_SCRIPT_POLL_TIMEOUT_MS) {
      // Best-effort feature — a network-blocked or ad-blocked GSI script
      // just means no Google button renders; password sign-in still works.
      return;
    }

    setTimeout(() => this.pollForGoogle(startedAt), GOOGLE_SCRIPT_POLL_INTERVAL_MS);
  }

  private render(g: NonNullable<typeof google>): void {
    const clientId = environment.googleClientId;
    if (!clientId) return;

    g.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => this.credential.emit(response.credential),
      // Without FedCM, a browser/extension blocking third-party cookies to
      // accounts.google.com makes GSI silently fall back to a legacy popup
      // OAuth flow — and that popup then gets blocked too, since it's opened
      // from inside a cross-origin iframe's postMessage handler rather than
      // a direct click. FedCM avoids third-party cookies and popups entirely.
      use_fedcm_for_prompt: true,
      use_fedcm_for_button: true,
    });
    g.accounts.id.renderButton(this.container().nativeElement, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      width: 320,
      text: this.text(),
      locale: this.translateService.lang() === 'ar' ? 'ar' : 'en',
    });
  }
}
