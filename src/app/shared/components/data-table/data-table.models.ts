export interface DataTableColumn<T> {
  key: string;
  labelKey: string;
  sortable?: boolean;
  cell?: (row: T) => string;
}

export interface SortChange {
  key: string;
  dir: 'asc' | 'desc';
}
