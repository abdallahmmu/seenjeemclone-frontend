import { Injectable, computed, effect, signal } from '@angular/core';
import { ar } from '../i18n/ar';
import { en } from '../i18n/en';

export type AppLang = 'en' | 'ar';

const DICTIONARIES: Record<AppLang, Record<string, unknown>> = { en, ar };
const STORAGE_KEY = 'seenjeem.lang';

@Injectable({ providedIn: 'root' })
export class TranslateService {
  private readonly langSignal = signal<AppLang>(this.readInitialLang());

  readonly lang = this.langSignal.asReadonly();
  readonly dir = computed<'ltr' | 'rtl'>(() => (this.langSignal() === 'ar' ? 'rtl' : 'ltr'));

  constructor() {
    effect(() => {
      const lang = this.langSignal();
      document.documentElement.lang = lang;
      document.documentElement.dir = this.dir();
      localStorage.setItem(STORAGE_KEY, lang);
    });
  }

  setLang(lang: AppLang): void {
    this.langSignal.set(lang);
  }

  toggleLang(): void {
    this.langSignal.set(this.langSignal() === 'en' ? 'ar' : 'en');
  }

  t(key: string, params?: Record<string, string | number>): string {
    const value = this.resolve(DICTIONARIES[this.langSignal()], key) ?? this.resolve(DICTIONARIES.en, key) ?? key;
    return params ? this.interpolate(value, params) : value;
  }

  private resolve(dict: Record<string, unknown>, key: string): string | undefined {
    const result = key.split('.').reduce<unknown>((acc, part) => {
      if (acc && typeof acc === 'object' && part in (acc as Record<string, unknown>)) {
        return (acc as Record<string, unknown>)[part];
      }
      return undefined;
    }, dict);
    return typeof result === 'string' ? result : undefined;
  }

  private interpolate(value: string, params: Record<string, string | number>): string {
    return value.replace(/{{\s*(\w+)\s*}}/g, (_match, token: string) =>
      token in params ? String(params[token]) : `{{${token}}}`,
    );
  }

  private readInitialLang(): AppLang {
    const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    return stored === 'ar' || stored === 'en' ? stored : 'en';
  }
}
