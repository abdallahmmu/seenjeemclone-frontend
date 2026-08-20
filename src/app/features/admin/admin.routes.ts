import { Routes } from '@angular/router';
import { superAdminGuard } from '../../core/guards/role.guard';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./dashboard/dashboard.component').then((m) => m.DashboardComponent),
    title: 'Admin dashboard',
  },
  {
    path: 'category-groups',
    loadComponent: () =>
      import('./category-groups/category-group-list/category-group-list.component').then(
        (m) => m.CategoryGroupListComponent,
      ),
    title: 'Category groups',
  },
  {
    path: 'category-groups/new',
    loadComponent: () =>
      import('./category-groups/category-group-form/category-group-form.component').then(
        (m) => m.CategoryGroupFormComponent,
      ),
    title: 'New category group',
  },
  {
    path: 'category-groups/:id/edit',
    loadComponent: () =>
      import('./category-groups/category-group-form/category-group-form.component').then(
        (m) => m.CategoryGroupFormComponent,
      ),
    title: 'Edit category group',
  },
  {
    path: 'categories',
    loadComponent: () =>
      import('./categories/category-list/category-list.component').then((m) => m.CategoryListComponent),
    title: 'Categories',
  },
  {
    path: 'categories/new',
    loadComponent: () =>
      import('./categories/category-form/category-form.component').then((m) => m.CategoryFormComponent),
    title: 'New category',
  },
  {
    path: 'categories/:id/edit',
    loadComponent: () =>
      import('./categories/category-form/category-form.component').then((m) => m.CategoryFormComponent),
    title: 'Edit category',
  },
  {
    path: 'categories/:categoryId/questions',
    loadComponent: () =>
      import('./questions/question-list/question-list.component').then((m) => m.QuestionListComponent),
    title: 'Category questions',
  },
  {
    path: 'questions',
    loadComponent: () =>
      import('./questions/question-list/question-list.component').then((m) => m.QuestionListComponent),
    title: 'Questions',
  },
  {
    path: 'questions/import',
    loadComponent: () => import('./questions/bulk-import/bulk-import.component').then((m) => m.BulkImportComponent),
    title: 'Bulk import questions',
  },
  {
    path: 'questions/new',
    loadComponent: () =>
      import('./questions/question-form/question-form.component').then((m) => m.QuestionFormComponent),
    title: 'New question',
  },
  {
    path: 'questions/:id/edit',
    loadComponent: () =>
      import('./questions/question-form/question-form.component').then((m) => m.QuestionFormComponent),
    title: 'Edit question',
  },
  {
    path: 'helper-tools',
    loadComponent: () =>
      import('./helper-tools/helper-tool-list/helper-tool-list.component').then((m) => m.HelperToolListComponent),
    title: 'Helper tools',
  },
  {
    path: 'helper-tools/new',
    loadComponent: () =>
      import('./helper-tools/helper-tool-form/helper-tool-form.component').then((m) => m.HelperToolFormComponent),
    title: 'New helper tool',
  },
  {
    path: 'helper-tools/:id/edit',
    loadComponent: () =>
      import('./helper-tools/helper-tool-form/helper-tool-form.component').then((m) => m.HelperToolFormComponent),
    title: 'Edit helper tool',
  },
  {
    path: 'admins',
    canActivate: [superAdminGuard],
    loadComponent: () => import('./admins/admins.component').then((m) => m.AdminsComponent),
    title: 'Admins',
  },
  {
    path: 'audit-logs',
    canActivate: [superAdminGuard],
    loadComponent: () => import('./audit-logs/audit-logs.component').then((m) => m.AuditLogsComponent),
    title: 'Audit logs',
  },
  {
    path: 'settings',
    canActivate: [superAdminGuard],
    loadComponent: () => import('./settings/settings.component').then((m) => m.SettingsComponent),
    title: 'Settings',
  },
];
