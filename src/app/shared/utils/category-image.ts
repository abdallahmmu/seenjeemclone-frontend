import { environment } from '../../../environments/environment';
import { Category } from '../../core/models/category.model';

const DEFAULT_CATEGORY_IMAGE = '/images/default-category.svg';

/** Category images are stored backend-relative (`/uploads/categories/...`) — resolve against the API origin. */
export function categoryImageUrl(category: Pick<Category, 'imageUrl'>): string {
  if (!category.imageUrl) return DEFAULT_CATEGORY_IMAGE;
  return category.imageUrl.startsWith('http') ? category.imageUrl : `${environment.apiUrl}${category.imageUrl}`;
}
