import { environment } from '../../../environments/environment';

/** Avatars are either backend-relative (`/uploads/avatars/...`) or an absolute Google photo URL — resolve the relative case against the API origin. */
export function resolveAvatarUrl(avatarUrl: string | null): string | null {
  if (!avatarUrl) return null;
  return avatarUrl.startsWith('http') ? avatarUrl : `${environment.apiUrl}${avatarUrl}`;
}

/** Default placeholder shown until an avatar is uploaded — the first two characters of the handle, uppercased. */
export function initialsFromHandle(handle: string): string {
  return handle.slice(0, 2).toUpperCase();
}
