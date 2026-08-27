import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, of } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiEnvelope } from '../../../core/models/api.model';
import { AdminStats } from '../../../core/models/admin.model';
import { Banner, UpdateBannerRequest } from '../../../core/models/banner.model';
import {
  Category,
  CategoryGroup,
  CreateCategoryGroupRequest,
  CreateCategoryRequest,
  UpdateCategoryGroupRequest,
  UpdateCategoryRequest,
} from '../../../core/models/category.model';
import { CreateCreditPackageRequest, CreditPackage, UpdateCreditPackageRequest } from '../../../core/models/credit-package.model';
import { CreateHelperToolRequest, HelperTool, UpdateHelperToolRequest } from '../../../core/models/helper-tool.model';
import { CreatePaymentMethodRequest, PaymentMethod, UpdatePaymentMethodRequest } from '../../../core/models/payment-method.model';
import { CreatePromoCodeRequest, PromoCode, UpdatePromoCodeRequest } from '../../../core/models/promo-code.model';
import { PurchaseOrder, PurchaseOrderStatus } from '../../../core/models/purchase-order.model';
import {
  BulkImportResponse,
  CreateQuestionRequest,
  Question,
  UpdateQuestionRequest,
} from '../../../core/models/question.model';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  getStats(): Observable<AdminStats> {
    return this.http.get<ApiEnvelope<AdminStats>>(`${this.base}/admin/stats`).pipe(map((res) => res.data));
  }

  // Category groups
  getCategoryGroups(): Observable<CategoryGroup[]> {
    return this.http
      .get<ApiEnvelope<CategoryGroup[]>>(`${this.base}/admin/category-groups`)
      .pipe(map((res) => res.data));
  }

  getCategoryGroup(id: string): Observable<CategoryGroup> {
    return this.http
      .get<ApiEnvelope<CategoryGroup>>(`${this.base}/admin/category-groups/${id}`)
      .pipe(map((res) => res.data));
  }

  createCategoryGroup(payload: CreateCategoryGroupRequest): Observable<CategoryGroup> {
    return this.http
      .post<ApiEnvelope<CategoryGroup>>(`${this.base}/admin/category-groups`, payload)
      .pipe(map((res) => res.data));
  }

  updateCategoryGroup(id: string, payload: UpdateCategoryGroupRequest): Observable<CategoryGroup> {
    return this.http
      .put<ApiEnvelope<CategoryGroup>>(`${this.base}/admin/category-groups/${id}`, payload)
      .pipe(map((res) => res.data));
  }

  deleteCategoryGroup(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/admin/category-groups/${id}`);
  }

  // Categories
  getCategories(groupId?: string): Observable<Category[]> {
    let params = new HttpParams();
    if (groupId) params = params.set('groupId', groupId);
    return this.http
      .get<ApiEnvelope<Category[]>>(`${this.base}/admin/categories`, { params })
      .pipe(map((res) => res.data));
  }

  getCategory(id: string): Observable<Category> {
    return this.http.get<ApiEnvelope<Category>>(`${this.base}/admin/categories/${id}`).pipe(map((res) => res.data));
  }

  createCategory(payload: CreateCategoryRequest): Observable<Category> {
    return this.http
      .post<ApiEnvelope<Category>>(`${this.base}/admin/categories`, payload)
      .pipe(map((res) => res.data));
  }

  updateCategory(id: string, payload: UpdateCategoryRequest): Observable<Category> {
    return this.http
      .put<ApiEnvelope<Category>>(`${this.base}/admin/categories/${id}`, payload)
      .pipe(map((res) => res.data));
  }

  deleteCategory(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/admin/categories/${id}`);
  }

  /**
   * There's no bulk reorder endpoint — each row's new `order` is persisted with its own
   * PUT, in parallel. Fine for admin-authored lists, which stay small.
   */
  reorderCategories(orderedCategories: Category[]): Observable<Category[]> {
    if (orderedCategories.length === 0) return of([]);
    const updates = orderedCategories.map((category, index) => this.updateCategory(category.id, { order: index }));
    return forkJoin(updates);
  }

  uploadCategoryImage(id: string, file: File): Observable<Category> {
    const formData = new FormData();
    formData.append('image', file);
    return this.http
      .post<ApiEnvelope<Category>>(`${this.base}/admin/categories/${id}/image`, formData)
      .pipe(map((res) => res.data));
  }

  // Questions
  getQuestions(categoryId?: string): Observable<Question[]> {
    let params = new HttpParams();
    if (categoryId) params = params.set('categoryId', categoryId);
    return this.http
      .get<ApiEnvelope<Question[]>>(`${this.base}/admin/questions`, { params })
      .pipe(map((res) => res.data));
  }

  getQuestion(id: string): Observable<Question> {
    return this.http.get<ApiEnvelope<Question>>(`${this.base}/admin/questions/${id}`).pipe(map((res) => res.data));
  }

  createQuestion(payload: CreateQuestionRequest): Observable<Question> {
    return this.http
      .post<ApiEnvelope<Question>>(`${this.base}/admin/questions`, payload)
      .pipe(map((res) => res.data));
  }

  updateQuestion(id: string, payload: UpdateQuestionRequest): Observable<Question> {
    return this.http
      .put<ApiEnvelope<Question>>(`${this.base}/admin/questions/${id}`, payload)
      .pipe(map((res) => res.data));
  }

  deleteQuestion(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/admin/questions/${id}`);
  }

  // Helper tools
  getHelperToolsAdmin(): Observable<HelperTool[]> {
    return this.http.get<ApiEnvelope<HelperTool[]>>(`${this.base}/admin/helper-tools`).pipe(map((res) => res.data));
  }

  getHelperTool(id: string): Observable<HelperTool> {
    return this.http
      .get<ApiEnvelope<HelperTool>>(`${this.base}/admin/helper-tools/${id}`)
      .pipe(map((res) => res.data));
  }

  createHelperTool(payload: CreateHelperToolRequest): Observable<HelperTool> {
    return this.http
      .post<ApiEnvelope<HelperTool>>(`${this.base}/admin/helper-tools`, payload)
      .pipe(map((res) => res.data));
  }

  updateHelperTool(id: string, payload: UpdateHelperToolRequest): Observable<HelperTool> {
    return this.http
      .put<ApiEnvelope<HelperTool>>(`${this.base}/admin/helper-tools/${id}`, payload)
      .pipe(map((res) => res.data));
  }

  deleteHelperTool(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/admin/helper-tools/${id}`);
  }

  uploadHelperToolImage(id: string, file: File): Observable<HelperTool> {
    const formData = new FormData();
    formData.append('image', file);
    return this.http
      .post<ApiEnvelope<HelperTool>>(`${this.base}/admin/helper-tools/${id}/image`, formData)
      .pipe(map((res) => res.data));
  }

  /** Same "no bulk endpoint, N parallel PUTs" reasoning as reorderCategories. */
  reorderHelperTools(orderedTools: HelperTool[]): Observable<HelperTool[]> {
    if (orderedTools.length === 0) return of([]);
    const updates = orderedTools.map((tool, index) => this.updateHelperTool(tool.id, { order: index }));
    return forkJoin(updates);
  }

  previewBulkImportJson(questions: unknown[]): Observable<BulkImportResponse> {
    return this.bulkImport({ format: 'json', questions, commit: false });
  }

  commitBulkImportJson(questions: unknown[]): Observable<BulkImportResponse> {
    return this.bulkImport({ format: 'json', questions, commit: true });
  }

  previewBulkImportCsv(csv: string): Observable<BulkImportResponse> {
    return this.bulkImport({ format: 'csv', csv, commit: false });
  }

  commitBulkImportCsv(csv: string): Observable<BulkImportResponse> {
    return this.bulkImport({ format: 'csv', csv, commit: true });
  }

  private bulkImport(payload: Record<string, unknown>): Observable<BulkImportResponse> {
    return this.http
      .post<ApiEnvelope<BulkImportResponse>>(`${this.base}/admin/questions/bulk-import`, payload)
      .pipe(map((res) => res.data));
  }

  // Credit packages
  getCreditPackages(): Observable<CreditPackage[]> {
    return this.http
      .get<ApiEnvelope<CreditPackage[]>>(`${this.base}/admin/credit-packages`)
      .pipe(map((res) => res.data));
  }

  getCreditPackage(id: string): Observable<CreditPackage> {
    return this.http
      .get<ApiEnvelope<CreditPackage>>(`${this.base}/admin/credit-packages/${id}`)
      .pipe(map((res) => res.data));
  }

  createCreditPackage(payload: CreateCreditPackageRequest): Observable<CreditPackage> {
    return this.http
      .post<ApiEnvelope<CreditPackage>>(`${this.base}/admin/credit-packages`, payload)
      .pipe(map((res) => res.data));
  }

  updateCreditPackage(id: string, payload: UpdateCreditPackageRequest): Observable<CreditPackage> {
    return this.http
      .put<ApiEnvelope<CreditPackage>>(`${this.base}/admin/credit-packages/${id}`, payload)
      .pipe(map((res) => res.data));
  }

  deleteCreditPackage(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/admin/credit-packages/${id}`);
  }

  uploadCreditPackageImage(id: string, file: File): Observable<CreditPackage> {
    const formData = new FormData();
    formData.append('image', file);
    return this.http
      .post<ApiEnvelope<CreditPackage>>(`${this.base}/admin/credit-packages/${id}/image`, formData)
      .pipe(map((res) => res.data));
  }

  // Payment methods
  getPaymentMethods(): Observable<PaymentMethod[]> {
    return this.http
      .get<ApiEnvelope<PaymentMethod[]>>(`${this.base}/admin/payment-methods`)
      .pipe(map((res) => res.data));
  }

  getPaymentMethod(id: string): Observable<PaymentMethod> {
    return this.http
      .get<ApiEnvelope<PaymentMethod>>(`${this.base}/admin/payment-methods/${id}`)
      .pipe(map((res) => res.data));
  }

  createPaymentMethod(payload: CreatePaymentMethodRequest): Observable<PaymentMethod> {
    return this.http
      .post<ApiEnvelope<PaymentMethod>>(`${this.base}/admin/payment-methods`, payload)
      .pipe(map((res) => res.data));
  }

  updatePaymentMethod(id: string, payload: UpdatePaymentMethodRequest): Observable<PaymentMethod> {
    return this.http
      .put<ApiEnvelope<PaymentMethod>>(`${this.base}/admin/payment-methods/${id}`, payload)
      .pipe(map((res) => res.data));
  }

  deletePaymentMethod(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/admin/payment-methods/${id}`);
  }

  uploadPaymentMethodImage(id: string, file: File): Observable<PaymentMethod> {
    const formData = new FormData();
    formData.append('image', file);
    return this.http
      .post<ApiEnvelope<PaymentMethod>>(`${this.base}/admin/payment-methods/${id}/image`, formData)
      .pipe(map((res) => res.data));
  }

  // Promo codes
  getPromoCodes(): Observable<PromoCode[]> {
    return this.http.get<ApiEnvelope<PromoCode[]>>(`${this.base}/admin/promo-codes`).pipe(map((res) => res.data));
  }

  getPromoCode(id: string): Observable<PromoCode> {
    return this.http.get<ApiEnvelope<PromoCode>>(`${this.base}/admin/promo-codes/${id}`).pipe(map((res) => res.data));
  }

  createPromoCode(payload: CreatePromoCodeRequest): Observable<PromoCode> {
    return this.http
      .post<ApiEnvelope<PromoCode>>(`${this.base}/admin/promo-codes`, payload)
      .pipe(map((res) => res.data));
  }

  updatePromoCode(id: string, payload: UpdatePromoCodeRequest): Observable<PromoCode> {
    return this.http
      .put<ApiEnvelope<PromoCode>>(`${this.base}/admin/promo-codes/${id}`, payload)
      .pipe(map((res) => res.data));
  }

  deletePromoCode(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/admin/promo-codes/${id}`);
  }

  // Banners — create is multipart (image required at creation), so it takes
  // the file directly rather than a plain JSON payload type.
  getBanners(): Observable<Banner[]> {
    return this.http.get<ApiEnvelope<Banner[]>>(`${this.base}/admin/banners`).pipe(map((res) => res.data));
  }

  getBanner(id: string): Observable<Banner> {
    return this.http.get<ApiEnvelope<Banner>>(`${this.base}/admin/banners/${id}`).pipe(map((res) => res.data));
  }

  createBanner(
    payload: { linkUrl?: string | null; frequencyCap: string; order: number; active: boolean },
    image: File,
  ): Observable<Banner> {
    const formData = new FormData();
    if (payload.linkUrl) formData.append('linkUrl', payload.linkUrl);
    formData.append('frequencyCap', payload.frequencyCap);
    formData.append('order', String(payload.order));
    formData.append('active', String(payload.active));
    formData.append('image', image);
    return this.http.post<ApiEnvelope<Banner>>(`${this.base}/admin/banners`, formData).pipe(map((res) => res.data));
  }

  updateBanner(id: string, payload: UpdateBannerRequest): Observable<Banner> {
    return this.http.put<ApiEnvelope<Banner>>(`${this.base}/admin/banners/${id}`, payload).pipe(map((res) => res.data));
  }

  deleteBanner(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/admin/banners/${id}`);
  }

  uploadBannerImage(id: string, file: File): Observable<Banner> {
    const formData = new FormData();
    formData.append('image', file);
    return this.http
      .post<ApiEnvelope<Banner>>(`${this.base}/admin/banners/${id}/image`, formData)
      .pipe(map((res) => res.data));
  }

  // Purchase orders — admin review queue
  getPurchaseOrders(status?: PurchaseOrderStatus): Observable<PurchaseOrder[]> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    return this.http
      .get<ApiEnvelope<PurchaseOrder[]>>(`${this.base}/admin/purchase-orders`, { params })
      .pipe(map((res) => res.data));
  }

  approvePurchaseOrder(id: string): Observable<PurchaseOrder> {
    return this.http
      .post<ApiEnvelope<PurchaseOrder>>(`${this.base}/admin/purchase-orders/${id}/approve`, {})
      .pipe(map((res) => res.data));
  }

  rejectPurchaseOrder(id: string, reason?: string): Observable<PurchaseOrder> {
    return this.http
      .post<ApiEnvelope<PurchaseOrder>>(`${this.base}/admin/purchase-orders/${id}/reject`, { reason })
      .pipe(map((res) => res.data));
  }
}
