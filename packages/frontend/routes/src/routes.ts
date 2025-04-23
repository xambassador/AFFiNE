// #region Path Parameter Types
export interface RouteParamsTypes {
  admin: { settings: { module: { module: string } } };
}
// #endregion

// #region Absolute Paths
export const ROUTES = {
  index: '/',
  admin: {
    index: '/admin',
    accounts: '/admin/accounts',
    ai: '/admin/ai',
    settings: { index: '/admin/settings', module: '/admin/settings/:module' },
    about: '/admin/about',
  },
};
// #endregion

// #region Relative Paths
export const RELATIVE_ROUTES = {
  index: '/',
  admin: {
    index: 'admin',
    accounts: 'accounts',
    ai: 'ai',
    settings: { index: 'settings', module: ':module' },
    about: 'about',
  },
};
// #endregion

// #region Path Factories
const home = () => '/';
const admin = () => '/admin';
admin.accounts = () => '/admin/accounts';
admin.ai = () => '/admin/ai';
const admin_settings = () => '/admin/settings';
admin_settings.module = (params: { module: string }) =>
  `/admin/settings/${params.module}`;
admin.settings = admin_settings;
admin.about = () => '/admin/about';
export const FACTORIES = { admin, home };
// #endregion
