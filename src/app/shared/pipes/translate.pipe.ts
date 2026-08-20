import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslateService } from '../../core/services/translate.service';

/** Impure by design so it re-renders immediately when the active language changes. */
@Pipe({ name: 'translate', pure: false })
export class TranslatePipe implements PipeTransform {
  private readonly translateService = inject(TranslateService);

  transform(key: string, params?: Record<string, string | number>): string {
    return this.translateService.t(key, params);
  }
}
