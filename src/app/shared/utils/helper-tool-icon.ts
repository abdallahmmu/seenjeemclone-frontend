import { environment } from '../../../environments/environment';
import { HelperTool } from '../../core/models/helper-tool.model';

const DEFAULT_ICON_BY_KEY: Record<string, string> = {
  trap: '/images/helper-trap.svg',
  hole: '/images/helper-hole.svg',
  double_answer: '/images/helper-double-answer.svg',
};
const FALLBACK_ICON = '/images/helper-default.svg';

/** Same resolve-or-fallback shape as categoryImageUrl — an uploaded icon wins, otherwise a per-key (or generic) default. */
export function helperToolIconUrl(tool: Pick<HelperTool, 'iconUrl' | 'key'>): string {
  if (!tool.iconUrl) return DEFAULT_ICON_BY_KEY[tool.key] ?? FALLBACK_ICON;
  return tool.iconUrl.startsWith('http') ? tool.iconUrl : `${environment.apiUrl}${tool.iconUrl}`;
}
