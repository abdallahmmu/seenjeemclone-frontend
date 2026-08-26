import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { NavigationError, provideRouter, Router, withComponentInputBinding } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { AuthService } from './core/services/auth.service';

const CHUNK_RELOAD_FLAG_KEY = 'chunk-load-error-reload-attempted';

/**
 * The backend rebuilds and redeploys its `public/` folder on every push,
 * replacing lazy-route chunk files with freshly-hashed names. A tab left
 * open across a deploy still references the old hashes, so a later
 * lazy-route navigation 404s — and since the server's SPA fallback serves
 * index.html for any unmatched GET, the browser sees "text/html" where it
 * expected a JS module and throws, rather than a clean 404. Reload once to
 * pick up the new build; the sessionStorage guard stops a genuinely broken
 * deploy from reload-looping.
 */
function setupChunkLoadErrorRecovery(router: Router): void {
  router.events.subscribe((event) => {
    if (!(event instanceof NavigationError)) return;
    const message = String((event.error as Error | undefined)?.message ?? '');
    const isChunkLoadError = /dynamically imported module|importing a module script failed|module script/i.test(message);
    if (!isChunkLoadError || sessionStorage.getItem(CHUNK_RELOAD_FLAG_KEY)) return;

    sessionStorage.setItem(CHUNK_RELOAD_FLAG_KEY, '1');
    window.location.reload();
  });
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAppInitializer(() => firstValueFrom(inject(AuthService).tryRestoreSession())),
    provideAppInitializer(() => setupChunkLoadErrorRecovery(inject(Router))),
  ],
};
