export type BannerFrequencyCap = 'ONCE' | 'TWICE' | 'ALWAYS';

export interface Banner {
  id: string;
  imageUrl: string;
  linkUrl: string | null;
  frequencyCap: BannerFrequencyCap;
  order: number;
  active: boolean;
  createdAt: string;
}

export interface UpdateBannerRequest {
  linkUrl?: string | null;
  frequencyCap?: BannerFrequencyCap;
  order?: number;
  active?: boolean;
}
