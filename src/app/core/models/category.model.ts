export interface CategoryGroup {
  id: string;
  nameEn: string;
  nameAr: string;
  order: number;
  active: boolean;
  createdAt: string;
}

export interface CreateCategoryGroupRequest {
  nameEn: string;
  nameAr: string;
  order?: number;
  active?: boolean;
}

export type UpdateCategoryGroupRequest = Partial<CreateCategoryGroupRequest>;

export interface Category {
  id: string;
  groupId: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  imageUrl: string | null;
  order: number;
  active: boolean;
  createdAt: string;
  /** Omitted by create/update (which don't re-fetch the count) — present on list/get. */
  questionCount?: number;
}

export interface CreateCategoryRequest {
  groupId: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  order?: number;
  active?: boolean;
}

export type UpdateCategoryRequest = Partial<CreateCategoryRequest>;
