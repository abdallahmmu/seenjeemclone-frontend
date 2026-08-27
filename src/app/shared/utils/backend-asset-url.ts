import { environment } from '../../../environments/environment';

/** Resolves a backend-relative uploaded-file path (e.g. `/uploads/...`) against the API origin. Absolute URLs pass through unchanged. */
export function backendAssetUrl(path: string): string {
  return path.startsWith('http') ? path : `${environment.apiUrl}${path}`;
}
