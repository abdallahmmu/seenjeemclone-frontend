/** Every successful backend response body is wrapped as `{ data: T }`. */
export interface ApiEnvelope<T> {
  data: T;
}

export interface ApiListMeta {
  total: number;
  limit: number;
  offset: number;
}

/** List endpoints that support pagination (e.g. audit logs) also return `meta`. */
export interface ApiListEnvelope<T> {
  data: T[];
  meta?: ApiListMeta;
}

/** Every error response body is `{ error: string }`. */
export interface ApiErrorBody {
  error: string;
}
