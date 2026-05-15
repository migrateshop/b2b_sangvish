const fs = require('fs');
const path = require('path');

const routes = {
  'app/page.tsx': "import Home from '@/src/pages/Home';\nexport default function Page() { return <Home />; }",
  'app/search/page.tsx': "import Search from '@/src/pages/Search';\nexport default function Page() { return <Search />; }",
  'app/section/[sectionId]/page.tsx': "import SectionPage from '@/src/pages/SectionPage';\nexport default function Page() { return <SectionPage />; }",
  'app/categories/page.tsx': "import Categories from '@/src/pages/Categories';\nexport default function Page() { return <Categories />; }",
  'app/login/page.tsx': "import Login from '@/src/pages/Login';\nexport default function Page() { return <Login />; }",
  'app/register/page.tsx': "import Register from '@/src/pages/Register';\nexport default function Page() { return <Register />; }",
  'app/dashboard/[...slug]/page.tsx': "import Dashboard from '@/src/pages/Dashboard';\nexport default function Page() { return <Dashboard />; }",
  'app/rfq/post/page.tsx': "import PostRFQ from '@/src/pages/rfq/PostRFQ';\nexport default function Page() { return <PostRFQ />; }",
  'app/product/[id]/page.tsx': "import ProductDetail from '@/src/pages/ProductDetail';\nexport default function Page() { return <ProductDetail />; }",
  'app/checkout/page.tsx': "import Checkout from '@/src/pages/Checkout';\nexport default function Page() { return <Checkout />; }",
  'app/page/[slug]/page.tsx': "import PageView from '@/src/pages/PageView';\nexport default function Page() { return <PageView />; }",
  'app/cart/page.tsx': "import Cart from '@/src/pages/Cart';\nexport default function Page() { return <Cart />; }",
  'app/buyer/dashboard/[...slug]/page.tsx': "import Dashboard from '@/src/pages/Dashboard';\nexport default function Page() { return <Dashboard overrideRole=\"buyer\" />; }",
  'app/supplier/dashboard/[...slug]/page.tsx': "import Dashboard from '@/src/pages/Dashboard';\nexport default function Page() { return <Dashboard overrideRole=\"supplier\" />; }",
  'app/become-supplier/page.tsx': "import SupplierRegister from '@/src/pages/SupplierRegister';\nexport default function Page() { return <SupplierRegister />; }",
  'app/supplier/[id]/page.tsx': "import SupplierProfile from '@/src/pages/SupplierProfile';\nexport default function Page() { return <SupplierProfile />; }",
  'app/ai-sourcing/page.tsx': "import AiSourcingWrapper from '@/app/AiSourcingWrapper';\nexport default function Page() { return <AiSourcingWrapper />; }",
  'app/top-ranking/page.tsx': "import TopRanking from '@/src/pages/TopRanking';\nexport default function Page() { return <TopRanking />; }",
  'app/admin/login/page.tsx': "import AdminLogin from '@/src/pages/admin/AdminLogin';\nexport default function Page() { return <AdminLogin />; }",
  'app/social-register/page.tsx': "import SocialRegister from '@/src/pages/SocialRegister';\nexport default function Page() { return <SocialRegister />; }",
  'app/admin/layout.tsx': "import AdminLayout from '@/src/pages/admin/AdminLayout';\nexport default function Layout({children}: {children: React.ReactNode}) { return <AdminLayout>{children}</AdminLayout>; }",
  'app/admin/dashboard/page.tsx': "import AdminDashboard from '@/src/pages/admin/AdminDashboard';\nexport default function Page() { return <AdminDashboard />; }",
  'app/admin/products/page.tsx': "import AdminProducts from '@/src/pages/admin/AdminProducts';\nexport default function Page() { return <AdminProducts />; }",
  'app/admin/categories/page.tsx': "import AdminCategories from '@/src/pages/admin/AdminCategories';\nexport default function Page() { return <AdminCategories />; }",
  'app/admin/settings/page.tsx': "import AdminSettings from '@/src/pages/admin/AdminSettings';\nexport default function Page() { return <AdminSettings />; }",
  'app/admin/email-settings/page.tsx': "import AdminEmailSettings from '@/src/pages/admin/AdminEmailSettings';\nexport default function Page() { return <AdminEmailSettings />; }",
  'app/admin/email-templates/page.tsx': "import AdminEmailTemplates from '@/src/pages/admin/AdminEmailTemplates';\nexport default function Page() { return <AdminEmailTemplates />; }",
  'app/admin/email-templates/add/page.tsx': "import AdminEmailTemplateForm from '@/src/pages/admin/AdminEmailTemplateForm';\nexport default function Page() { return <AdminEmailTemplateForm />; }",
  'app/admin/email-templates/edit/[id]/page.tsx': "import AdminEmailTemplateForm from '@/src/pages/admin/AdminEmailTemplateForm';\nexport default function Page() { return <AdminEmailTemplateForm />; }",
  'app/admin/payment-methods/page.tsx': "import AdminPaymentSettings from '@/src/pages/admin/AdminPaymentSettings';\nexport default function Page() { return <AdminPaymentSettings />; }",
  'app/admin/subscriptions/page.tsx': "import AdminSubscriptionPlans from '@/src/pages/admin/AdminSubscriptionPlans';\nexport default function Page() { return <AdminSubscriptionPlans />; }",
  'app/admin/orders/page.tsx': "import AdminOrders from '@/src/pages/admin/AdminOrders';\nexport default function Page() { return <AdminOrders />; }",
  'app/admin/orders/[id]/page.tsx': "import AdminOrderDetail from '@/src/pages/admin/AdminOrderDetail';\nexport default function Page() { return <AdminOrderDetail />; }",
  'app/admin/users/page.tsx': "import AdminUsers from '@/src/pages/admin/AdminUsers';\nexport default function Page() { return <AdminUsers />; }",
  'app/admin/buyers/page.tsx': "import AdminUsers from '@/src/pages/admin/AdminUsers';\nexport default function Page() { return <AdminUsers roleFilter=\"buyer\" />; }",
  'app/admin/suppliers/page.tsx': "import AdminUsers from '@/src/pages/admin/AdminUsers';\nexport default function Page() { return <AdminUsers roleFilter=\"supplier\" />; }",
  'app/admin/disputes/page.tsx': "import AdminDisputes from '@/src/pages/admin/AdminDisputes';\nexport default function Page() { return <AdminDisputes />; }",
  'app/admin/social-login/page.tsx': "import AdminSocialLogin from '@/src/pages/admin/AdminSocialLogin';\nexport default function Page() { return <AdminSocialLogin />; }",
  'app/admin/cms/page.tsx': "import AdminCMS from '@/src/pages/admin/AdminCMS';\nexport default function Page() { return <AdminCMS />; }",
  'app/admin/homepage/page.tsx': "import AdminHomepage from '@/src/pages/admin/AdminHomepage';\nexport default function Page() { return <AdminHomepage />; }",
  'app/admin/hero-slides/page.tsx': "import AdminHeroSlides from '@/src/pages/admin/AdminHeroSlides';\nexport default function Page() { return <AdminHeroSlides />; }",
  'app/admin/audit-logs/page.tsx': "import AdminAuditLogs from '@/src/pages/admin/AdminAuditLogs';\nexport default function Page() { return <AdminAuditLogs />; }",
  'app/admin/tax/page.tsx': "import AdminTaxManagement from '@/src/pages/admin/AdminTaxManagement';\nexport default function Page() { return <AdminTaxManagement />; }",
  'app/admin/verifications/page.tsx': "import AdminCompanies from '@/src/pages/admin/AdminCompanies';\nexport default function Page() { return <AdminCompanies />; }",
  'app/admin/approvals/page.tsx': "import AdminApprovals from '@/src/pages/admin/AdminApprovals';\nexport default function Page() { return <AdminApprovals />; }",
  'app/admin/commissions/page.tsx': "import AdminCommissions from '@/src/pages/admin/AdminCommissions';\nexport default function Page() { return <AdminCommissions />; }",
  'app/admin/revenue/page.tsx': "import AdminRevenue from '@/src/pages/admin/AdminRevenue';\nexport default function Page() { return <AdminRevenue />; }",
  'app/admin/moderation/page.tsx': "import AdminModeration from '@/src/pages/admin/AdminModeration';\nexport default function Page() { return <AdminModeration />; }",
  'app/admin/fraud/page.tsx': "import AdminFraud from '@/src/pages/admin/AdminFraud';\nexport default function Page() { return <AdminFraud />; }",
  'app/admin/footer/page.tsx': "import AdminFooterMenu from '@/src/pages/admin/AdminFooterMenu';\nexport default function Page() { return <AdminFooterMenu />; }",
  'app/admin/shipping-rules/page.tsx': "import AdminShippingRules from '@/src/pages/admin/AdminShippingRules';\nexport default function Page() { return <AdminShippingRules />; }",
  'app/admin/countries/page.tsx': "import AdminCountries from '@/src/pages/admin/AdminCountries';\nexport default function Page() { return <AdminCountries />; }",
  'app/admin/states/page.tsx': "import AdminStates from '@/src/pages/admin/AdminStates';\nexport default function Page() { return <AdminStates />; }",
  'app/admin/worldwide/page.tsx': "import AdminWorldwide from '@/src/pages/admin/AdminWorldwide';\nexport default function Page() { return <AdminWorldwide />; }",
  'app/admin/profile/page.tsx': "import AdminProfile from '@/src/pages/admin/AdminProfile';\nexport default function Page() { return <AdminProfile />; }",
  'app/admin/withdrawals/page.tsx': "import AdminWithdrawals from '@/src/pages/admin/AdminWithdrawals';\nexport default function Page() { return <AdminWithdrawals />; }",
  'app/admin/notifications/page.tsx': "import AdminNotifications from '@/src/pages/admin/AdminNotifications';\nexport default function Page() { return <AdminNotifications />; }",
  'app/admin/business-types/page.tsx': "import AdminBusinessTypes from '@/src/pages/admin/AdminBusinessTypes';\nexport default function Page() { return <AdminBusinessTypes />; }",
  'app/admin/languages/page.tsx': "import AdminLanguages from '@/src/pages/admin/AdminLanguages';\nexport default function Page() { return <AdminLanguages />; }",
  'app/admin/currencies/page.tsx': "import AdminCurrencies from '@/src/pages/admin/AdminCurrencies';\nexport default function Page() { return <AdminCurrencies />; }",
  'app/AiSourcingWrapper.tsx': "'use client'\nimport {useIsMobile} from '@/src/hooks/useIsMobile';\nimport MobileHomePage from '@/src/components/js/MobileHomePage';\nimport AiSourcing from '@/src/pages/AiSourcing';\nexport default function AiSourcingWrapper() { const isMobile = useIsMobile(); return isMobile ? <MobileHomePage /> : <AiSourcing />; }"
};

Object.keys(routes).forEach(filepath => {
  const fullPath = path.join(__dirname, filepath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  // Prepend 'use client' because all these old React components use hooks
  let content = "'use client';\n" + routes[filepath];
  if (filepath.endsWith('AiSourcingWrapper.tsx')) content = routes[filepath];
  fs.writeFileSync(fullPath, content);
});

console.log('Routes created successfully.');
