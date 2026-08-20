import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './shared/components/toast/toast.component';
import { TranslateService } from './core/services/translate.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
})
export class App {
  // Injected eagerly so the lang/dir effect runs as soon as the app bootstraps.
  private readonly translateService = inject(TranslateService);
}
