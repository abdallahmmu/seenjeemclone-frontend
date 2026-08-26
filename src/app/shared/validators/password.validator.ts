import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export type PasswordRequirementKey = 'minLength' | 'lowercase' | 'uppercase' | 'number' | 'special';

export interface PasswordRequirement {
  key: PasswordRequirementKey;
  met: boolean;
}

/** Mirrors the backend's passwordField rules exactly (auth.schema.ts) — keep both in sync. */
export function passwordRequirements(value: string): PasswordRequirement[] {
  return [
    { key: 'minLength', met: value.length >= 8 },
    { key: 'lowercase', met: /[a-z]/.test(value) },
    { key: 'uppercase', met: /[A-Z]/.test(value) },
    { key: 'number', met: /[0-9]/.test(value) },
    { key: 'special', met: /[^A-Za-z0-9]/.test(value) },
  ];
}

export const passwordStrengthValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = (control.value as string | null) ?? '';
  return passwordRequirements(value).every((requirement) => requirement.met) ? null : { passwordWeak: true };
};

export function passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  return password && confirmPassword && password !== confirmPassword ? { passwordMismatch: true } : null;
}
