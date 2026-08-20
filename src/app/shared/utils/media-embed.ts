export type VideoEmbed = { kind: 'iframe'; src: string } | { kind: 'file'; src: string };

const YOUTUBE_PATTERN = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{6,})/;
const VIMEO_PATTERN = /vimeo\.com\/(?:video\/)?(\d+)/;

/**
 * A question's video link may be a direct file (played with a native
 * <video> tag, so single-play can actually be enforced) or a YouTube/Vimeo
 * page link (rendered as an iframe embed instead — see board.component.ts's
 * doc comment on why single-play there is best-effort only).
 */
export function resolveVideoEmbed(url: string, autoplay: boolean): VideoEmbed {
  const youtubeMatch = YOUTUBE_PATTERN.exec(url);
  if (youtubeMatch) {
    const params = autoplay ? '?autoplay=1&rel=0' : '?rel=0';
    return { kind: 'iframe', src: `https://www.youtube.com/embed/${youtubeMatch[1]}${params}` };
  }

  const vimeoMatch = VIMEO_PATTERN.exec(url);
  if (vimeoMatch) {
    const params = autoplay ? '?autoplay=1' : '';
    return { kind: 'iframe', src: `https://player.vimeo.com/video/${vimeoMatch[1]}${params}` };
  }

  return { kind: 'file', src: url };
}
