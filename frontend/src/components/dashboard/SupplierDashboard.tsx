import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';
import styles from './SupplierDashboard.module.css';
import ProductManagement from './products/ProductManagement';
import RFQMarket from './rfq/RFQMarket';
import CompanyProfile from './CompanyProfile';
import SupplierOrders from './orders/SupplierOrders';
import MyMessages from './MyMessages';
import MyNotifications from './MyNotifications';
import SupplierCustomizations from './SupplierCustomizations';
import SupplierEnquiries from './SupplierEnquiries';
import SupplierQuotes from './rfq/SupplierQuotes';
import InquiriesRFQs from './InquiriesRFQs';
import UserSettings from './UserSettings';
import SupplierSubscription from './products/SupplierSubscription';
import SupplierWallet from './SupplierWallet';
import PayoutMethod from './PayoutMethod';
import { useChat } from '@/context/ChatContext';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import api from '@/services/axiosConfig';
import LogoutModal from '../js/LogoutModal';
import { getImgUrl } from '@/utils/imageConfig';
import OrderDetail from './OrderDetail';
import Invoice from './Invoice';
import BuyerDisputes from './BuyerDisputes';
import SupplierReviews from './SupplierReviews';

const SupplierDashboard = ({ tab, subtab }) => {
    const { unreadTotal } = useChat();
    const navigate = useRouter();
    const { user, logout, switchRole, currentRole, language, currency, availableLanguages, availableCurrencies, updateUserSettings, t, convertPrice } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const activeSection = tab || 'home';
    const [accountSheetOpen, setAccountSheetOpen] = useState(false);

    const translateGroup = (groupName: string) => {
        const map: any = {
            'Core Services': t('core_services') || 'Core Services',
            'Finance & Wallet': t('finance_wallet') || 'Finance & Wallet',
            'Company Profile': t('company_profile') || 'Company Profile',
            'Settings': t('settings') || 'Settings'
        };
        return map[groupName] || groupName;
    };

    const translateLabel = (labelName: string, id: string) => {
        const map: any = {
            'products': t('product_management') || 'Product Management',
            'rfq': t('rfq_market') || 'RFQ Market',
            'my-quotes': t('my_quotes') || 'My Quotes',
            'orders': t('orders') || 'Orders',
            'inquiries': t('inquiries') || 'Inquiries',
            'notifications': t('notifications') || 'Notifications',
            'messages': t('messages') || 'Messages',
            'wallet': t('my_wallet') || 'My Wallet',
            'payout': t('payout_method') || 'Payout Method',
            'profile': t('company_profile') || 'Company Profile',
            'subscription': t('subscription_plan') || 'Subscription Plan',
            'settings': t('settings') || 'Settings',
            'reviews': t('reviews') || 'Reviews'
        };
        return map[id] || labelName;
    };
    const [stats, setStats] = useState({
        activeProducts: 0,
        newRFQs: 0,
        totalOrders: 0,
        totalRevenue: '0.00',
        is_verified: false,
        plan_active: false,
        user_status: 'none',
        company_status: 'none',
        has_company: false
    });
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [showNotifyDropdown, setShowNotifyDropdown] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [loadingStats, setLoadingStats] = useState(true);

    // Language & Currency State
    const [showLangDropdown, setShowLangDropdown] = useState(false);
    const [selectedLang, setSelectedLang] = useState(language);
    const [selectedCurr, setSelectedCurr] = useState(currency);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth <= 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        setSelectedLang(language);
        setSelectedCurr(currency);
    }, [language, currency]);

    const handleSaveLangCurr = async () => {
        await updateUserSettings(selectedLang, selectedCurr);
        setShowLangDropdown(false);
    };

    const handleLogout = () => {
        setShowLogoutModal(true);
    };

    const confirmLogout = () => {
        logout();
        setShowLogoutModal(false);
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Use the 'api' instance which already has the base URL and auth headers
                const [statsRes, notifyRes] = await Promise.allSettled([
                    api.get('/auth/supplier/stats'),
                    api.get('/notifications')
                ]);

                if (statsRes.status === 'fulfilled') {
                    setStats(statsRes.value.data);
                } else {
                    console.error('Error fetching supplier stats:', statsRes.reason);
                }

                if (notifyRes.status === 'fulfilled') {
                    setNotifications(notifyRes.value.data || []);
                } else {
                    console.error('Error fetching notifications:', notifyRes.reason);
                }
            } catch (err) {
                console.error('Error in fetchData:', err);
            } finally {
                setLoadingStats(false);
            }
        };

        setLoadingStats(true);
        fetchData();
    }, [activeSection]);

    const sidebarItems = [
        {
            group: 'Core Services', items: [
                { id: 'products', label: 'Product Management', icon: 'P' },
                { id: 'rfq', label: 'RFQ Market', icon: 'R' },
                { id: 'my-quotes', label: 'My Quotes', icon: 'Q' },
                { id: 'orders', label: 'Orders', icon: 'O' },
                { id: 'customizations', label: 'Customization Requests', icon: 'C' },
                { id: 'product-enquiries', label: 'Product Enquiries', icon: 'I' },
                { id: 'notifications', label: 'Notifications', icon: 'N' },
                { id: 'messages', label: 'Messages', icon: 'M' },
                { id: 'disputes', label: 'Disputes', icon: 'D' },
                { id: 'reviews', label: 'Reviews', icon: 'Rev' }
            ]
        },
        {
            group: 'Finance & Wallet', items: [
                { id: 'wallet', label: 'My Wallet', icon: 'W' },
                { id: 'payout', label: 'Payout Method', icon: 'Pay' }
            ]
        },
        {
            group: 'Company Profile', items: [
                { id: 'profile', label: 'Company Profile', icon: 'C' },
                { id: 'subscription', label: 'Subscription Plan', icon: 'S' }
            ]
        },
        {
            group: 'Settings', items: [
                { id: 'settings', label: 'Settings', icon: 'Set' }
            ]
        }
    ];

    const SidebarIcon = ({ type }) => {
        const icons = {
            'dashboard': <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>,
            'M': <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>,
            'D': <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>,
            'O': <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>,
            'P': <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>,
            'R': <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>,
            'Q': <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>,
            'W': <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>,
            'Pay': <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21h18M3 10h18M5 10v11M9 10v11M15 10v11M19 10v11M12 3l9 7H3l9-7z"></path></svg>,
            'A': <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>,
            'Campaign': <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path><path d="M2 12h20"></path></svg>,
            'C': <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>,
            'N': <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>,
            'S': <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07L19.07 4.93" strokeWidth="1" /></svg>,
            'Sec': <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>,
            'Set': <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>,
            'Rev': <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>,
        };
        return <span className={styles['supplier-sb-icon']}>{icons[type] || icons['dashboard']}</span>;
    };

    const renderContent = () => {
        const isVerified = stats.company_status === 'verified' || stats.company_status === 'pending' || stats.has_company;
        const isPlanActive = stats.plan_active || stats.has_company;
        const restrictedSections = ['products', 'rfq', 'my-quotes', 'orders', 'inquiries', 'wallet', 'payout', 'analytics', 'marketing', 'reviews'];
        const isRestricted = restrictedSections.includes(activeSection) && (!isVerified || !isPlanActive);

        if (loadingStats) {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px 0', gap: '16px' }}>
                    <div className={styles['admin-spinner']} style={{ width: '40px', height: '40px', border: '3px solid #f3f3f3', borderTop: '3px solid var(--primary-color)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                    <p style={{ color: '#64748b', fontSize: '14px', fontWeight: '600' }}>Verifying account permissions...</p>
                    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                </div>
            );
        }

        if (isRestricted) {
            return (
                <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '64px 32px', textAlign: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', border: '1px solid #f0f0f0' }}>
                    <div style={{ width: '80px', height: '80px', backgroundColor: '#fff7ed', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                        <svg width="40" height="40" fill="none" stroke="#f97316" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m0 0v2m0-2h2m-2 0H10m4-9a4 4 0 11-8 0 4 4 0 018 0zM12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707"></path></svg>
                    </div>
                    <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#1a2b4b', marginBottom: '16px' }}>{t('access_restricted') || 'Access Restricted'}</h2>
                    <p style={{ color: '#64748b', fontSize: '16px', maxWidth: '450px', margin: '0 auto 32px', lineHeight: '1.6' }}>
                        {!isVerified
                            ? (t('access_restricted_desc') || "Your company profile must be verified by admin before you can access these features.")
                            : (t('active_plan_required') || "You need an active Gold Supplier plan to start selling and managing orders.")}
                    </p>
                    <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                        {!isVerified ? (
                            <button onClick={() => navigate.push('/supplier/dashboard/profile')} style={{ padding: '12px 24px', backgroundColor: 'var(--primary-color)', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' }}>{t('complete_profile') || 'Complete Profile'}</button>
                        ) : (
                            <button onClick={() => navigate.push('/supplier/dashboard/subscription')} style={{ padding: '12px 24px', backgroundColor: 'var(--clr-accent)', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' }}>{t('upgrade_plan') || 'Upgrade Plan'}</button>
                        )}
                        <button onClick={() => switchRole('buyer')} style={{ padding: '12px 24px', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' }}>{t('back_to_buyer') || 'Back to Buyer'}</button>
                    </div>
                </div>
            );
        }

        if (activeSection === 'products') return <ProductManagement isAdminView={false} />;
        if (activeSection === 'rfq') return <RFQMarket />;
        if (activeSection === 'my-quotes') return <SupplierQuotes />;
        if (activeSection === 'reviews') return <SupplierReviews />;
        const emptyCardStyle = { backgroundColor: '#ffffff', borderRadius: '8px', padding: '32px', minHeight: '800px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' };

        if (activeSection === 'orders') return subtab ? <OrderDetail role="supplier" orderId={subtab} /> : <SupplierOrders />;
        if (activeSection === 'inquiries') return <InquiriesRFQs />;
        if (activeSection === 'customizations') return <SupplierCustomizations />;
        if (activeSection === 'product-enquiries') return <SupplierEnquiries />;
        if (activeSection === 'notifications') return <MyNotifications />;
        if (activeSection === 'messages') return <MyMessages />;
        if (activeSection === 'disputes') return <BuyerDisputes role="supplier" />;
        if (activeSection === 'wallet') return <SupplierWallet />;
        if (activeSection === 'payout') return <PayoutMethod />;
        if (activeSection === 'analytics') return <div style={emptyCardStyle} className={styles['shadow-sm']}><h2>Analytics Dashboard</h2><p>Visitor and search performance reports.</p></div>;
        if (activeSection === 'marketing') return <div style={emptyCardStyle} className={styles['shadow-sm']}><h2>Marketing Center</h2><p>Boost your products and participate in platform sales campaigns.</p></div>;
        if (activeSection === 'profile') return <CompanyProfile />;
        if (activeSection === 'subscription') return <SupplierSubscription />;
        if (activeSection === 'security') return <div style={emptyCardStyle} className={styles['shadow-sm']}><h2>Security & Compliance</h2><p>Verify your business certifications and manage data security settings. This section is essential for maintaining your 'Verified Supplier' status.</p></div>;
        if (activeSection === 'settings') return <UserSettings />;
        if (activeSection === 'invoice') return <Invoice orderId={subtab} />;

        // Default home/overview
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                {/* Welcome Banner */}

                <div style={{ background: '#fff', borderRadius: '18px', padding: '24px 28px', color: '#1a1a2e', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', boxShadow: '0 4px 12px rgba(0,0,0,.05)', position: 'relative', overflow: 'hidden', border: '1px solid #e8edf5' }}>
                    <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '180px', height: '180px', background: 'rgba(0,0,0,.02)', borderRadius: '50%', pointerEvents: 'none' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                        <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: '900', color: 'var(--primary-color)', flexShrink: 0, overflow: 'hidden', border: '1.5px solid #e2e8f0' }}>
                            {user?.profile_image ? (
                                <img src={getImgUrl(user.profile_image)} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <>{user?.company_name ? user.company_name[0].toUpperCase() : (user?.first_name ? user.first_name[0].toUpperCase() : 'S')}</>
                            )}
                        </div>
                        <div>
                            <div style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '4px' }}>{t('supplier_portal') || 'SUPPLIER PORTAL'}</div>
                            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.02em' }}>{`${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.company_name}</h2>
                            {stats.company_status === 'verified' ? (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#f0fdf4', color: '#10b981', padding: '4px 12px', borderRadius: '99px', fontSize: '11px', fontWeight: '700', marginTop: '6px', border: '1px solid #dcfce7' }}>
                                    <svg width="11" height="11" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                    {t('verified_supplier') || 'Verified Supplier'}
                                </span>
                            ) : (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#f8fafc', color: '#64748b', padding: '4px 12px', borderRadius: '99px', fontSize: '11px', fontWeight: '700', marginTop: '6px', border: '1px solid #e2e8f0' }}>
                                    {t('pending_verification') || 'Pending Verification'}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className={styles['supplier-welcome-banner-buttons']} style={{ display: 'flex', gap: '10px', flexShrink: 0, flexWrap: 'wrap' }}>
                        <button onClick={() => {
                            if (!user?.subscription_plan) {
                                navigate.push('/supplier/dashboard/subscription');
                            } else {
                                navigate.push('/supplier/dashboard/products');
                            }
                        }} style={{ padding: '10px 18px', background: 'var(--clr-accent)', border: 'none', borderRadius: '10px', color: '#fff', fontWeight: '800', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(255,106,0,.3)' }}>
                            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                            {t('add_product') || 'Add Product'}
                        </button>
                        <button onClick={() => switchRole('buyer')} style={{ padding: '10px 18px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '10px', color: '#475569', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>
                            {t('buyer_view') || 'Buyer View'}
                        </button>
                    </div>
                </div>

                {/* Stat Cards */}
                <div className={styles['supplier-stat-grid']}>
                    {[
                        { label: t('active_products') || 'Active Products', value: loadingStats ? '—' : stats.activeProducts, icon: <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg>, link: '/supplier/dashboard/products' },
                        { label: t('new_rfqs') || 'New RFQs', value: loadingStats ? '—' : stats.newRFQs, icon: <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>, link: '/supplier/dashboard/rfq' },
                        { label: t('total_orders') || 'Total Orders', value: loadingStats ? '—' : stats.totalOrders, icon: <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" /></svg>, link: '/supplier/dashboard/orders' },
                        { label: t('revenue') || 'Revenue', value: loadingStats ? '—' : convertPrice(parseFloat(stats.totalRevenue) || 0).formatted, icon: <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, link: '/supplier/dashboard/wallet' },
                    ].map((s, i) => (
                        <div key={i} className={styles['supplier-stat-card']} onClick={() => navigate.push(s.link)} style={{ cursor: 'pointer' }}>
                            <div className={styles['supplier-stat-icon']}>{s.icon}</div>
                            <div className={styles['supplier-stat-value']}>{s.value}</div>
                            <div className={styles['supplier-stat-label']}>{s.label}</div>
                        </div>
                    ))}
                </div>

                <div className={styles['supplier-home-grid']} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '18px' }}>
                    {/* Quick Actions */}
                    <div className={styles['dash-card']} style={{ padding: '22px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#1a1a2e' }}>{t('quick_actions') || 'Quick Actions'}</h3>
                        </div>
                        <div className={styles['supplier-quick-actions-grid']} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            {[
                                { label: t('post_new_product') || 'Post New Product', icon: <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>, action: () => {
                                    if (!user?.subscription_plan) {
                                        navigate.push('/supplier/dashboard/subscription');
                                    } else {
                                        navigate.push('/supplier/dashboard/products');
                                    }
                                }, primary: true },
                                { label: t('browse_rfq_market') || 'Browse RFQ Market', icon: <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>, action: () => navigate.push('/supplier/dashboard/rfq'), primary: false },
                                { label: t('view_orders') || 'View Orders', icon: <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>, action: () => navigate.push('/supplier/dashboard/orders'), primary: false },
                                { label: t('boost_visibility') || 'Boost Visibility', icon: <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>, action: () => navigate.push('/supplier/dashboard/subscription'), primary: false },
                            ].map((a, i) => (
                                <button key={i} onClick={a.action} style={{ background: a.primary ? 'var(--primary-color)' : '#f8fafc', color: a.primary ? '#fff' : '#1a1a2e', border: a.primary ? 'none' : '1.5px solid #e8edf5', borderRadius: '14px', padding: '18px 16px', cursor: 'pointer', fontWeight: '700', fontSize: '13px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px', transition: 'all .2s', boxShadow: a.primary ? '0 4px 14px rgba(13,46,103,.15)' : 'none', fontFamily: 'inherit' }}
                                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = a.primary ? '0 8px 20px rgba(13,46,103,.3)' : '0 4px 14px rgba(0,0,0,.06)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = a.primary ? '0 4px 14px rgba(13,46,103,.2)' : 'none'; }}>
                                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{a.icon}</span>
                                    {a.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Right column */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {/* Go Global promo */}
                        <div style={{ background: '#fff', borderRadius: '16px', padding: '22px', color: '#1a1a2e', position: 'relative', overflow: 'hidden', border: '1px solid #e8edf5', boxShadow: '0 4px 12px rgba(0,0,0,.05)' }}>
                            <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', background: 'rgba(255,106,0,.05)', borderRadius: '50%', pointerEvents: 'none' }} />
                            <div style={{ marginBottom: '10px', display: 'flex', color: 'var(--clr-accent)' }}>
                                <svg width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.6 9h16.8M3.6 15h16.8M12 3a13.9 13.9 0 00-3.6 9 13.9 13.9 0 003.6 9M12 3a13.9 13.9 0 013.6 9 13.9 13.9 0 01-3.6 9" /></svg>
                            </div>
                            <h4 style={{ fontSize: '16px', fontWeight: '900', margin: '0 0 8px', letterSpacing: '-0.01em', color: '#0f172a' }}>{t('go_global') || 'Go Global'}</h4>
                            <p style={{ fontSize: '12.5px', lineHeight: '1.6', color: '#64748b', marginBottom: '16px', fontWeight: '500' }}>{t('go_global_desc') || 'Reach millions of buyers worldwide with our Gold Supplier certification.'}</p>
                            <button onClick={() => navigate.push('/supplier/dashboard/subscription')} style={{ width: '100%', background: 'var(--clr-accent)', color: '#fff', border: 'none', padding: '11px', borderRadius: '10px', fontWeight: '800', fontSize: '12px', textTransform: 'uppercase', cursor: 'pointer', letterSpacing: '.04em', boxShadow: '0 4px 12px rgba(255,106,0,.3)' }}>{t('upgrade_now') || 'Upgrade Now'}</button>
                        </div>

                        {/* Onboarding Progress */}
                        <div className={styles['dash-card']} style={{ padding: '20px' }}>
                            <h4 style={{ fontSize: '14px', fontWeight: '800', margin: '0 0 14px', color: '#1a1a2e' }}>{t('onboarding_progress') || 'Onboarding Progress'}</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {[
                                    { label: t('complete_company_profile') || 'Complete Company Profile', done: stats.has_company, link: '/supplier/dashboard/profile' },
                                    { label: t('upload_products_step') || 'Upload 5+ Products', done: stats.activeProducts >= 5, link: '/supplier/dashboard/products' },
                                    { label: t('setup_payout_step') || 'Setup Payout Method', done: user?.payout_methods?.length > 0, link: '/supplier/dashboard/payout' },
                                ].map((step, i) => (
                                    <div key={i} onClick={() => navigate.push(step.link)} style={{ display: 'flex', alignItems: 'center', gap: '12px', opacity: step.done ? .55 : 1, cursor: 'pointer', padding: '10px 12px', borderRadius: '10px', transition: 'background .15s' }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                        <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: step.done ? '#10b981' : '#f1f5f9', border: step.done ? 'none' : '2px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            {step.done && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                                        </div>
                                        <span style={{ fontSize: '12.5px', fontWeight: '600', color: '#1a1a2e', textDecoration: step.done ? 'line-through' : 'none' }}>{step.label}</span>
                                        {!step.done && <span style={{ marginLeft: 'auto', fontSize: '10px', color: 'var(--primary-color)', fontWeight: '700', background: '#f0f4ff', padding: '3px 8px', borderRadius: '6px' }}>Fix →</span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className={`${styles['supplier-dashboard-container']} ${theme}`}>
            {/* Premium Dashboard Header (Mirroring Admin) */}
            <header className={styles['supplier-header']}>
                <div className={styles['supplier-header-left']}>
                    <div className={styles['supplier-logo-box-desktop']} onClick={() => navigate.push('/supplier/dashboard')} style={{ cursor: 'pointer' }}>
                        <span className={styles['supplier-logo-text-rest']}>Supplier</span>
                    </div>
                    <button className={styles['mobile-menu-toggle']} onClick={() => {
                        if ((typeof window !== 'undefined' ? window.innerWidth : 1200) > 768) {
                            setIsCollapsed(!isCollapsed);
                        } else {
                            setDrawerOpen(!drawerOpen);
                        }
                    }} style={isMobile ? { background: '#f0f4ff', border: 'none', borderRadius: '8px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-color)', cursor: 'pointer' } : { background: 'none', border: 'none', padding: '0 4px', width: 'auto', height: 'auto', fontSize: '20px', fontWeight: '900', color: 'var(--primary-color)', display: 'flex', alignItems: 'center' }}>
                        {isMobile ? (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                        ) : '»'}
                    </button>
                </div>

                <div className={styles['supplier-header-right']}>
                    <div className={styles['supplier-header-group']}>
                        {!isMobile && (
                            <button onClick={() => switchRole('buyer')} className={styles['sup-nav-link']} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4b5563', fontWeight: '800', fontSize: '13px', marginRight: '20px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('buyer_dashboard') || 'Buyer Dashboard'}</button>
                        )}
                        <Link href="/" className={styles['sup-nav-link']} style={isMobile ? { textDecoration: 'none', color: '#64748b', fontWeight: '800', fontSize: '11px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', height: '36px', display: 'flex', alignItems: 'center', padding: '0 10px', marginRight: '8px' } : { textDecoration: 'none', color: '#4b5563', fontWeight: '800', fontSize: '13px', marginRight: '20px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{isMobile ? (t('site') || 'Site') : (t('main_site') || 'MAIN SITE')}</Link>
                        <div className={styles['relative']} style={{ position: 'relative' }}>
                            <button className={styles['admin-lang-btn']} title="Language & Currency" onClick={() => setShowLangDropdown(!showLangDropdown)}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"></path></svg>
                                <span>{language || 'English'} - {currency || 'USD'}</span>
                            </button>

                            {showLangDropdown && (
                                <div
                                    onMouseLeave={() => !isMobile && setShowLangDropdown(false)}
                                    style={isMobile ? {
                                        position: 'fixed',
                                        top: '64px',
                                        left: '8px',
                                        right: '8px',
                                        width: 'auto',
                                        zIndex: 3000,
                                        background: '#fff',
                                        borderRadius: '16px',
                                        boxShadow: '0 20px 60px rgba(13,46,103,0.15), 0 4px 16px rgba(0,0,0,0.08)',
                                        border: '1px solid #e8edf5',
                                        overflow: 'hidden'
                                    } : {
                                        position: 'absolute', top: 'calc(100% + 12px)', right: '-8px',
                                        width: '300px', zIndex: 3000,
                                        background: '#fff',
                                        borderRadius: '16px',
                                        boxShadow: '0 20px 60px rgba(13,46,103,0.15), 0 4px 16px rgba(0,0,0,0.08)',
                                        border: '1px solid #e8edf5',
                                        overflow: 'hidden'
                                    }}
                                >
                                    {/* Header */}
                                    <div style={{
                                        background: 'var(--primary-color)',
                                        padding: '16px 20px',
                                        display: 'flex', alignItems: 'center', gap: '10px',
                                        justifyContent: 'space-between'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{
                                                width: '32px', height: '32px', borderRadius: '10px',
                                                background: 'rgba(255,255,255,0.15)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                            }}>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <circle cx="12" cy="12" r="10" />
                                                    <line x1="2" y1="12" x2="22" y2="12" />
                                                    <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <div style={{ color: '#fff', fontWeight: '800', fontSize: '13px', lineHeight: 1.2 }}>{t('language_currency') || 'Language & Currency'}</div>
                                                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px', fontWeight: '600' }}>{t('display_preferences') || 'Display preferences'}</div>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => setShowLangDropdown(false)}
                                            style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', fontSize: '18px', cursor: 'pointer', width: '30px', height: '30px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                                        >✕</button>
                                    </div>

                                    {/* Body */}
                                    <div style={{ padding: '16px' }}>
                                        {/* Language */}
                                        <div style={{ marginBottom: '12px' }}>
                                            <label style={{
                                                display: 'flex', alignItems: 'center', gap: '6px',
                                                fontSize: '10px', fontWeight: '800', color: '#64748b',
                                                textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px'
                                            }}>
                                                <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>
                                                {t('language') || 'Language'}
                                            </label>
                                            <select
                                                value={selectedLang}
                                                onChange={(e) => setSelectedLang(e.target.value)}
                                                style={{
                                                    width: '100%', height: '42px',
                                                    background: '#f8fafc', border: '1.5px solid #e8edf5',
                                                    borderRadius: '10px', padding: '0 36px 0 12px',
                                                    fontSize: '13px', fontWeight: '700', color: '#1a2b4b',
                                                    outline: 'none', appearance: 'none', cursor: 'pointer',
                                                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%230d2e67' stroke-width='2.5'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7' /%3E%3C/svg%3E")`,
                                                    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '12px'
                                                }}
                                            >
                                                {availableLanguages.map(lang => (
                                                    <option key={lang.code} value={lang.name}>{lang.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Currency */}
                                        <div style={{ marginBottom: '16px' }}>
                                            <label style={{
                                                display: 'flex', alignItems: 'center', gap: '6px',
                                                fontSize: '10px', fontWeight: '800', color: '#64748b',
                                                textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px'
                                            }}>
                                                <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                {t('currency') || 'Currency'}
                                            </label>
                                            <select
                                                value={selectedCurr}
                                                onChange={(e) => setSelectedCurr(e.target.value)}
                                                style={{
                                                    width: '100%', height: '42px',
                                                    background: '#f8fafc', border: '1.5px solid #e8edf5',
                                                    borderRadius: '10px', padding: '0 36px 0 12px',
                                                    fontSize: '13px', fontWeight: '700', color: '#1a2b4b',
                                                    outline: 'none', appearance: 'none', cursor: 'pointer',
                                                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%230d2e67' stroke-width='2.5'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7' /%3E%3C/svg%3E")`,
                                                    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '12px'
                                                }}
                                            >
                                                {availableCurrencies.map(curr => (
                                                    <option key={curr.code} value={curr.code}>{curr.code} - {curr.symbol}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Save Button */}
                                        <button
                                            onClick={handleSaveLangCurr}
                                            style={{
                                                width: '100%', padding: '11px',
                                                background: 'var(--primary-color)',
                                                color: '#fff', border: 'none', borderRadius: '10px',
                                                fontWeight: '700', fontSize: '12px', cursor: 'pointer',
                                                letterSpacing: '0.04em', textTransform: 'uppercase',
                                                transition: 'opacity 0.2s'
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                                            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                                        >
                                            {t('save_changes') || 'Save Changes'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className={styles['relative']} style={{ position: 'relative' }}>
                            <button
                                className={styles['admin-header-btn']}
                                title="Notifications"
                                onMouseEnter={() => setShowNotifyDropdown(true)}
                                onClick={() => isMobile ? navigate.push('/supplier/dashboard/notifications') : setShowNotifyDropdown(!showNotifyDropdown)}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                                </svg>
                                {notifications.length > 0 && <span className={styles['notification-badge-count']}>{notifications.length}</span>}
                            </button>

                            {showNotifyDropdown && (
                                <div
                                    onMouseLeave={() => !isMobile && setShowNotifyDropdown(false)}
                                    style={isMobile ? {
                                        position: 'fixed',
                                        top: '64px',
                                        left: '8px',
                                        right: '8px',
                                        width: 'auto',
                                        zIndex: 3000,
                                        background: '#fff',
                                        borderRadius: '16px',
                                        boxShadow: '0 20px 60px rgba(13,46,103,0.15), 0 4px 16px rgba(0,0,0,0.08)',
                                        border: '1px solid #e8edf5',
                                        overflow: 'hidden',
                                        maxHeight: '80vh',
                                        overflowY: 'auto'
                                    } : {
                                        position: 'absolute', top: 'calc(100% + 12px)', right: '-8px',
                                        width: '360px', zIndex: 3000,
                                        background: '#fff',
                                        borderRadius: '16px',
                                        boxShadow: '0 20px 60px rgba(13,46,103,0.15), 0 4px 16px rgba(0,0,0,0.08)',
                                        border: '1px solid #e8edf5',
                                        overflow: 'hidden'
                                    }}
                                >
                                    {/* Header */}
                                    <div style={{
                                        background: 'var(--primary-color)',
                                        padding: '16px 20px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{
                                                width: '32px', height: '32px', borderRadius: '10px',
                                                background: 'rgba(255,255,255,0.15)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}>
                                                <svg width="16" height="16" fill="none" stroke="#fff" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                                                </svg>
                                            </div>
                                            <div>
                                                <div style={{ color: '#fff', fontWeight: '800', fontSize: '13px', lineHeight: 1.2 }}>Notifications</div>
                                                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px', fontWeight: '600' }}>{notifications.length} unread</div>
                                            </div>
                                        </div>
                                        {notifications.length > 0 && (
                                            <span style={{
                                                background: 'var(--clr-accent)', color: '#fff',
                                                fontSize: '10px', fontWeight: '900',
                                                padding: '3px 8px', borderRadius: '99px'
                                            }}>
                                                {notifications.length} NEW
                                            </span>
                                        )}
                                    </div>

                                    {/* Notification List */}
                                    <div style={{ maxHeight: '300px', overflowY: 'auto', padding: '8px 0' }}>
                                        {notifications.length > 0 ? notifications.slice(0, 5).map((n, idx) => {
                                            const colors = [
                                                { bg: '#f0f4ff', icon: 'var(--primary-color)' },
                                                { bg: '#fff7ed', icon: '#f97316' },
                                                { bg: '#f0fdf4', icon: '#10b981' },
                                                { bg: '#fdf4ff', icon: '#a855f7' }
                                            ];
                                            const color = colors[idx % colors.length];
                                            return (
                                                <div
                                                    key={n._id}
                                                    onClick={() => { n.link && navigate.push(n.link); setShowNotifyDropdown(false); }}
                                                    style={{
                                                        display: 'flex', alignItems: 'flex-start', gap: '12px',
                                                        padding: '12px 16px',
                                                        cursor: 'pointer',
                                                        transition: 'background 0.15s',
                                                        borderBottom: idx < Math.min(notifications.length, 5) - 1 ? '1px solid #f1f5f9' : 'none'
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                                >
                                                    {/* Icon */}
                                                    <div style={{
                                                        width: '36px', height: '36px', borderRadius: '10px',
                                                        background: color.bg, flexShrink: 0,
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                    }}>
                                                        <svg width="16" height="16" fill="none" stroke={color.icon} viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                                            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                                                        </svg>
                                                    </div>
                                                    {/* Text */}
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{
                                                            fontSize: '13px', fontWeight: '700',
                                                            color: '#1a2b4b', marginBottom: '2px',
                                                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                                                        }}>{n.title}</div>
                                                        <div style={{
                                                            fontSize: '11.5px', color: '#64748b', lineHeight: '1.4',
                                                            display: '-webkit-box', WebkitLineClamp: 2,
                                                            WebkitBoxOrient: 'vertical', overflow: 'hidden'
                                                        }}>{n.message}</div>
                                                        <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '600', marginTop: '4px' }}>
                                                            {new Date(n.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </div>
                                                    </div>
                                                    {/* Unread dot */}
                                                    <div style={{
                                                        width: '7px', height: '7px', borderRadius: '50%',
                                                        background: 'var(--primary-color)', flexShrink: 0, marginTop: '4px'
                                                    }} />
                                                </div>
                                            );
                                        }) : (
                                            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                                                <div style={{ fontSize: '32px', marginBottom: '8px', opacity: 0.4 }}>🔔</div>
                                                <div style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t('no_new_notifications') || 'No new notifications'}</div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Footer */}
                                    <div style={{ padding: '12px 16px', borderTop: '1px solid #f1f5f9' }}>
                                        <button
                                            onClick={() => { navigate.push('/supplier/dashboard/notifications'); setShowNotifyDropdown(false); }}
                                            style={{
                                                width: '100%', padding: '10px',
                                                background: 'var(--primary-color)',
                                                color: '#fff', border: 'none', borderRadius: '10px',
                                                fontWeight: '700', fontSize: '12px', cursor: 'pointer',
                                                letterSpacing: '0.04em', textTransform: 'uppercase',
                                                transition: 'opacity 0.2s'
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                                            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                                        >
                                            {t('view_all_notifications') || 'View All Notifications'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={styles['admin-profile-section']} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div className={styles['flex'] + " " + styles['items-center'] + " " + styles['gap-3'] + " " + styles['cursor-pointer'] + " " + styles['hover:opacity-80'] + " " + styles['transition-opacity']} onClick={() => navigate.push('/supplier/dashboard/settings')}>
                            <div className={styles['admin-avatar']} style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--primary-color)', color: '#fff', fontWeight: 'bold' }}>
                                {user?.profile_image ? (
                                    <img
                                        src={getImgUrl(user.profile_image)}
                                        alt="Avatar"
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                ) : (
                                    <>{user?.first_name?.[0]?.toUpperCase()}</>
                                )}
                            </div>

                        </div>
                        <button className={styles['admin-header-btn'] + " " + styles['logout-btn']} title="Logout" onClick={handleLogout}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"></path>
                                <polyline points="16 17 21 12 16 7"></polyline>
                                <line x1="21" y1="12" x2="9" y2="12"></line>
                            </svg>
                        </button>
                    </div>
                </div>
            </header>

            <div className={styles['supplier-layout-body']}>

                {/* Sidebar / Mobile Drawer */}
                {drawerOpen && <div className={styles['sidebar-overlay']} onClick={() => setDrawerOpen(false)}></div>}

                <aside className={`${styles['supplier-sidebar']} ${drawerOpen ? styles['drawer-open'] : ''} ${isCollapsed ? styles['collapsed'] : ''}`}>
                    <div className={styles['mobile-drawer-header']}>
                        <span>{t('supplier_portal') || 'Supplier Portal'}</span>
                        <button onClick={() => setDrawerOpen(false)}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>

                    <button
                        className={`${styles['supplier-sidebar-item']} ${styles['hub-top-item']} ${activeSection === 'home' ? styles['active'] : ''}`}
                        onClick={() => {
                            navigate.push('/supplier/dashboard');
                            setDrawerOpen(false);
                        }}>
                        <div className={styles['sidebar-item-left']} style={{ fontWeight: 700, fontSize: '15px', color: 'inherit' }}>
                            <SidebarIcon type="dashboard" />
                            {!isCollapsed && <span>{t('supplier_hub') || 'Supplier Hub'}</span>}
                        </div>
                    </button>

                    <div className={styles['supplier-sidebar-content']}>
                        <div className="hide-desktop" style={{ display: typeof window !== 'undefined' && window.innerWidth <= 1024 ? 'block' : 'none', marginBottom: '16px' }}>
                            <h4 className={styles['sidebar-section-title']}>{t('quick_links') || 'Quick Links'}</h4>
                            <button
                                className={styles['supplier-sidebar-item']}
                                onClick={() => { switchRole('buyer'); setDrawerOpen(false); }}
                            >
                                <div className={styles['sidebar-item-left']}>
                                    <SidebarIcon type="dashboard" />
                                    <span>{t('buyer_dashboard') || 'Buyer Dashboard'}</span>
                                </div>
                            </button>
                            <Link href="/" className={styles['supplier-sidebar-item']} style={{ textDecoration: 'none' }} onClick={() => setDrawerOpen(false)}>
                                <div className={styles['sidebar-item-left']}>
                                    <SidebarIcon type="dashboard" />
                                    <span>{t('main_site') || 'Main Site'}</span>
                                </div>
                            </Link>
                        </div>
                        {sidebarItems.map((group, idx) => (
                            <div key={idx}>
                                {!isCollapsed && <h4 className={styles['sidebar-section-title']}>{translateGroup(group.group)}</h4>}
                                {group.items.map(item => (
                                    <button key={item.id}
                                        className={`${styles['supplier-sidebar-item']} ${activeSection === item.id ? styles['active'] : ''}`}
                                        onClick={() => { navigate.push(`/supplier/dashboard/${item.id}`); setDrawerOpen(false); }}
                                        title={isCollapsed ? translateLabel(item.label, item.id) : ''}>
                                        <div className={styles['sidebar-item-left']}>
                                            <SidebarIcon type={item.icon} />
                                            {!isCollapsed && <span>{translateLabel(item.label, item.id)}</span>}
                                            {item.id === 'messages' && unreadTotal > 0 && (
                                                <span className={styles['supplier-msg-badge']}>{unreadTotal}</span>
                                            )}
                                        </div>
                                        {!isCollapsed && <span className={styles['supplier-sb-arrow']}>❯</span>}
                                    </button>
                                ))}
                            </div>
                        ))}
                    </div>
                </aside>

                <main className={styles['supplier-main-content']}>

                    {renderContent()}
                </main>
            </div>

            {/* Mobile Bottom Navigation for Supplier */}
            <nav className={styles['supplier-mobile-bottom-nav']}>
                <button
                    className={`${styles['supplier-mob-nav-item']} ${activeSection === 'home' ? styles.active : ''}`}
                    onClick={() => navigate.push('/supplier/dashboard')}
                >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                    <span>HUB</span>
                </button>
                <button
                    className={`${styles['supplier-mob-nav-item']} ${activeSection === 'products' ? styles.active : ''}`}
                    onClick={() => navigate.push('/supplier/dashboard/products')}
                >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
                    <span>PRODUCTS</span>
                </button>
                <button
                    className={`${styles['supplier-mob-nav-item']} ${activeSection === 'orders' ? styles.active : ''}`}
                    onClick={() => navigate.push('/supplier/dashboard/orders')}
                >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path><path d="M3 6h18"></path><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
                    <span>ORDERS</span>
                </button>
                <button
                    className={`${styles['supplier-mob-nav-item']} ${activeSection === 'messages' ? styles.active : ''}`}
                    onClick={() => navigate.push('/supplier/dashboard/messages')}
                >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                    {unreadTotal > 0 && <span className={styles['supplier-mob-badge']}>{unreadTotal}</span>}
                    <span>CHAT</span>
                </button>
                <button
                    className={styles['supplier-mob-nav-item']}
                    onClick={() => setAccountSheetOpen(true)}
                >
                    <div className={styles['supplier-mob-account-avatar']}>
                        {user?.first_name ? user.first_name[0].toUpperCase() + (user.last_name ? user.last_name[0].toUpperCase() : '') : 'U'}
                    </div>
                    <span>ACCOUNT</span>
                </button>
            </nav>

            {/* Account Slide-up Sheet */}
            {accountSheetOpen && (
                <div className={styles['myalibaba-overlay']} onClick={() => setAccountSheetOpen(false)} />
            )}
            <div className={`${styles['myalibaba-sheet']} ${accountSheetOpen ? styles.open : ''}`}>
                <div className={styles['myalibaba-handle']} />

                <button className={styles['myalibaba-back-btn']} onClick={() => setAccountSheetOpen(false)}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
                    {user ? (user.first_name || 'Profile') : 'My Account'}
                </button>

                {user && (
                    <>
                        <div className={styles['myalibaba-profile']}>
                            <div className={styles['myalibaba-avatar']}>
                                {user?.first_name ? user.first_name[0].toUpperCase() + (user.last_name ? user.last_name[0].toUpperCase() : '') : 'U'}
                            </div>
                            <div className={styles['myalibaba-user-info']}>
                                <div className={styles['myalibaba-user-name']}>{user.first_name} {user.last_name}</div>
                                <div className={styles['myalibaba-user-email']}>{user.email}</div>
                            </div>
                        </div>

                        <div className={styles['myalibaba-section']}>
                            <div className={styles['myalibaba-section-title']}>Manage Your Dashboards</div>
                            <div className={styles['myalibaba-role-grid']}>
                                <div
                                    className={`${styles['myalibaba-role-card']} ${currentRole === 'buyer' ? styles.active : ''}`}
                                    onClick={() => { switchRole('buyer'); setAccountSheetOpen(false); }}
                                    role="button"
                                    tabIndex={0}
                                >
                                    <div>
                                        <div className={styles['myalibaba-role-name']}>Buyer</div>
                                        <div className={styles['myalibaba-role-desc']}>Purchase products</div>
                                    </div>
                                    {currentRole === 'buyer' && (
                                        <div className={styles['myalibaba-check']}>
                                            <svg width="14" height="14" fill="none" stroke="white" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                        </div>
                                    )}
                                </div>

                                <div
                                    className={`${styles['myalibaba-role-card']} ${currentRole === 'supplier' || !currentRole ? styles.active : ''}`}
                                    onClick={() => { switchRole('supplier'); setAccountSheetOpen(false); }}
                                    role="button"
                                    tabIndex={0}
                                >
                                    <div>
                                        <div className={styles['myalibaba-role-name']}>Supplier</div>
                                        <div className={styles['myalibaba-role-desc']}>Sell on marketplace</div>
                                    </div>
                                    {(currentRole === 'supplier' || !currentRole) && (
                                        <div className={styles['myalibaba-check']}>
                                            <svg width="14" height="14" fill="none" stroke="white" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className={styles['myalibaba-signout-wrap']}>
                            <button
                                className={styles['myalibaba-signout-btn']}
                                onClick={() => { setAccountSheetOpen(false); handleLogout(); }}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                                Sign Out
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* Content ends */}
            <LogoutModal
                isOpen={showLogoutModal}
                onClose={() => setShowLogoutModal(false)}
                onConfirm={confirmLogout}
                title="Supplier Logout"
                message="Are you sure you want to sign out from Supplier Portal?"
            />
        </div>
    );
};

export default SupplierDashboard;
