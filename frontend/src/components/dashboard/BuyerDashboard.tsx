import React, { useState, useEffect } from 'react';
import api from '@/services/axiosConfig';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import BuyerWishlist from './BuyerWishlist';
import BuyerProfile from './BuyerProfile';
import MyRFQs from './MyRFQs';
import MyOrders from './MyOrders';
import BuyerDisputes from './BuyerDisputes';
import MyMessages from './MyMessages';
import MyNotifications from './MyNotifications';
import InquiriesRFQs from './InquiriesRFQs';
import BuyerCustomizations from './BuyerCustomizations';
import BuyerEnquiries from './BuyerEnquiries';
import MyContacts from './MyContacts';
import UserSettings from './UserSettings';
import ShippingAddress from './ShippingAddress';
import BuyerSubscription from './products/BuyerSubscription';
import OrderDetail from './OrderDetail';
import Invoice from './Invoice';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import { useNotifications } from '@/context/NotificationContext';
import { getImgUrl } from '@/utils/imageConfig';


const BuyerDashboard = ({ tab, subtab }: { tab?: string; subtab?: string }) => {
    const { unreadTotal } = useChat();
    const activeSidebar = tab || 'dashboard';
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Header Dropdowns
    const [showLangDropdown, setShowLangDropdown] = useState(false);
    const [showNotifyDropdown, setShowNotifyDropdown] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth <= 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const { logout, user: authUser, currentRole, switchRole, convertPrice, language, currency, availableLanguages, availableCurrencies, updateUserSettings, t } = useAuth();
    const { markAllRead, notifications } = useNotifications();
    const navigate = useRouter();
    const user = authUser || { first_name: 'User', last_name: '', email: 'user@example.com' };
    const [stats, setStats] = useState({ rfqs: 0, favorites: 0, totalOrders: 0, pendingOrders: 0, completedOrders: 0, activeInquiries: 0 });
    const [recentOrders, setRecentOrders] = useState<any[]>([]);
    const [recentProducts, setRecentProducts] = useState<any[]>([]);
    const [rfqs, setRfqs] = useState<any[]>([]);
    const [loadingStats, setLoadingStats] = useState(true);

    const fetchDashboardStats = async () => {
        setLoadingStats(true);
        try {
            const [rfqRes, wishlistRes, orderRes] = await Promise.all([
                api.get('/rfq/my-rfqs'),
                api.get('/wishlist'),
                api.get('/orders/my-orders')
            ]);

            const orders = orderRes.data || [];
            const pending = orders.filter((o: any) => o.status === 'pending' || o.status === 'processing').length;
            const completed = orders.filter((o: any) => o.status === 'delivered' || o.status === 'completed').length;

            setStats({
                rfqs: rfqRes.data?.length || 0,
                favorites: wishlistRes.data?.length || 0,
                totalOrders: orders.length,
                pendingOrders: pending,
                completedOrders: completed,
                activeInquiries: rfqRes.data?.filter((r: any) => r.status === 'active' || r.status === 'open')?.length || 0
            });

            // Get 5 most recent orders
            setRecentOrders(orders.slice(0, 5));
            setRfqs((rfqRes.data || []).slice(0, 5));

            // Fetch recently viewed products
            try {
                const prodRes = await api.get('/products', { params: { limit: 12, sort_by: 'recent' } });
                setRecentProducts(prodRes.data?.products || []);
            } catch { }
        } catch (err) {
            console.error('Failed to fetch dashboard stats:', err);
        } finally {
            setLoadingStats(false);
        }
    };

    useEffect(() => {
        fetchDashboardStats();

        const handleRefresh = () => {
            fetchDashboardStats();
        };
        window.addEventListener('newMessage', handleRefresh);
        window.addEventListener('notificationReceived', handleRefresh);
        return () => {
            window.removeEventListener('newMessage', handleRefresh);
            window.removeEventListener('notificationReceived', handleRefresh);
        };
    }, []);

    const handleLogout = () => {
        logout();
        navigate.push('/login');
    };

    const translateGroup = (groupName: string) => {
        const map: any = {
            'Main': t('main') || 'Main',
            'Online trading': t('online_trading') || 'Online trading',
            'Add-on services': t('addon_services') || 'Add-on services',
            'Settings': t('settings') || 'Settings'
        };
        return map[groupName] || groupName;
    };

    const sidebarItems = [
        {
            group: 'Main', items: [
                { id: 'dashboard', label: t('dashboard'), icon: 'dashboard' },
            ]
        },
        {
            group: 'Online trading', items: [
                { id: 'my_rfqs', label: t('my_rfqs') || 'My RFQs', icon: 'rfq' },
                { id: 'customizations', label: 'Customization Requests', icon: 'C' },
                { id: 'product-enquiries', label: 'Product Enquiries', icon: 'M' },
                { id: 'messages', label: t('messenger') || 'Messenger', icon: 'M' },
                { id: 'notifications', label: t('notifications'), icon: 'N' },
                { id: 'orders', label: t('orders'), icon: 'O' },
                { id: 'disputes', label: t('disputes') || 'Disputes', icon: 'D' },
                { id: 'saved', label: t('saved_history') || 'Saved & history', icon: 'H' }
            ]
        },
        {
            group: 'Add-on services', items: [
                { id: 'subscription', label: t('subscription') || 'Subscription', icon: 'Sub', badge: 'New' }
            ]
        },
        {
            group: 'Settings', items: [
                { id: 'company_profile', label: t('company_profile') || 'Company Profile', icon: 'profile' },
                { id: 'shipping', label: t('shipping_address') || 'Shipping Address', icon: 'shipping' },
                { id: 'settings', label: t('settings'), icon: 'S' }
            ]
        }
    ];

    const SidebarIcon = ({ type }: { type: string }) => {
        const icons = {
            'dashboard': <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="14" width="7" height="7" rx="1"></rect><rect x="3" y="14" width="7" height="7" rx="1"></rect></svg>,
            'rfq': <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>,
            'M': <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>,
            'O': <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path><path d="M3 6h18"></path><path d="M16 10a4 4 0 0 1-8 0"></path></svg>,
            'N': <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>,
            'H': <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>,
            'D': <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>,
            'Sub': <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>,
            'S': <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>,
            'profile': <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>,
            'shipping': <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>,
        };
        return <span className="buyer-sb-icon">{(icons as any)[type] || icons['dashboard']}</span>;
    };


    // Helper for toggle icon
    const ToggleIcon = () => (
        isCollapsed ?
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="animate-pulse"><polyline points="13 17 18 12 13 7"></polyline><polyline points="6 17 11 12 6 7"></polyline></svg> :
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="11 17 6 12 11 7"></polyline><polyline points="18 17 13 12 18 7"></polyline></svg>
    );

    const getStatusColor = (status: string) => {
        const colors = {
            pending: '#f59e0b', processing: '#3b82f6', shipped: '#8b5cf6',
            delivered: '#10b981', completed: '#059669', cancelled: '#ef4444',
            active: '#10b981', open: '#3b82f6', closed: '#6b7280'
        };
        return (colors as any)[status?.toLowerCase()] || '#6b7280';
    };

    // ─── Dashboard Overview Content ───
    const DashboardOverview = () => (
        <>
            {/* Welcome Banner */}
            <div className="dashboard-welcome-banner">
                <div className="d-flex justify-between align-center w-100" style={{ flexWrap: 'wrap', gap: '12px' }}>
                    <div className="d-flex align-center gap-4 text-left">
                        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 text-2xl font-bold border-2 border-white shadow-sm shrink-0 overflow-hidden">
                            {user.profile_image ? (
                                <img src={getImgUrl(user.profile_image)} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <>{user.first_name ? user.first_name[0].toUpperCase() : 'U'}</>
                            )}
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white mb-1">{t('welcome_back')}, {user.first_name}!</h1>
                            <p className="text-xs text-blue-100 opacity-80">{t('buyer_subtitle') || 'Managing your sourcing and orders in one place.'}</p>
                        </div>
                    </div>
                    <div className="banner-actions" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <Link href="/rfq/post" className="buyer-dash-banner-btn" style={{ background: '#ff7000', textDecoration: 'none', border: 'none', boxShadow: '0 4px 12px rgba(255, 112, 0, 0.3)', position: 'relative', zIndex: 5 }}>{t('post_rfq') || 'Post RFQ'}</Link>
                        <Link href="/search" className="buyer-dash-banner-btn outline" style={{ position: 'relative', zIndex: 5 }}>{t('browse_products') || 'Browse Products'}</Link>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="dashboard-grid mt-6">
                <div className="buyer-stat-grid">
                    <div className="buyer-stat-card" onClick={() => {
                        const baseRoute = typeof window !== 'undefined' && window.location.pathname.includes('/buyer/dashboard') ? '/buyer/dashboard' : '/dashboard';
                        navigate.push(`${baseRoute}/orders`);
                    }}>
                        <div className="buyer-stat-icon" style={{ background: '#f1f5f9', color: '#64748b' }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" /></svg>
                        </div>
                        <div className="buyer-stat-number">{loadingStats ? '...' : stats.totalOrders}</div>
                        <div className="buyer-stat-label">{t('total_orders') || 'Total Orders'}</div>
                    </div>
                    <div className="buyer-stat-card" onClick={() => {
                        const baseRoute = typeof window !== 'undefined' && window.location.pathname.includes('/buyer/dashboard') ? '/buyer/dashboard' : '/dashboard';
                        navigate.push(`${baseRoute}/orders`);
                    }}>
                        <div className="buyer-stat-icon" style={{ background: '#f1f5f9', color: '#64748b' }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                        </div>
                        <div className="buyer-stat-number">{loadingStats ? '...' : stats.pendingOrders}</div>
                        <div className="buyer-stat-label">{t('pending') || 'Pending'}</div>
                    </div>
                    <div className="buyer-stat-card" onClick={() => {
                        const baseRoute = typeof window !== 'undefined' && window.location.pathname.includes('/buyer/dashboard') ? '/buyer/dashboard' : '/dashboard';
                        navigate.push(`${baseRoute}/my_rfqs`);
                    }}>
                        <div className="buyer-stat-icon" style={{ background: '#f1f5f9', color: '#64748b' }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22"><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></svg>
                        </div>
                        <div className="buyer-stat-number">{loadingStats ? '...' : stats.rfqs}</div>
                        <div className="buyer-stat-label">{t('rfqs') || 'RFQs'}</div>
                    </div>
                    <div className="buyer-stat-card" onClick={() => {
                        const baseRoute = typeof window !== 'undefined' && window.location.pathname.includes('/buyer/dashboard') ? '/buyer/dashboard' : '/dashboard';
                        navigate.push(`${baseRoute}/messages`);
                    }}>
                        <div className="buyer-stat-icon" style={{ background: '#f1f5f9', color: '#64748b' }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>
                        </div>
                        <div className="buyer-stat-number">{loadingStats ? '...' : (unreadTotal || 0)}</div>
                        <div className="buyer-stat-label">{t('new_messages') || 'New Messages'}</div>
                    </div>
                    <div className="buyer-stat-card" onClick={() => {
                        const baseRoute = typeof window !== 'undefined' && window.location.pathname.includes('/buyer/dashboard') ? '/buyer/dashboard' : '/dashboard';
                        navigate.push(`${baseRoute}/saved`);
                    }}>
                        <div className="buyer-stat-icon" style={{ background: '#f1f5f9', color: '#64748b' }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
                        </div>
                        <div className="buyer-stat-number">{loadingStats ? '...' : stats.favorites}</div>
                        <div className="buyer-stat-label">{t('favorites') || 'Favorites'}</div>
                    </div>
                    <div className="buyer-stat-card" onClick={() => {
                        const baseRoute = typeof window !== 'undefined' && window.location.pathname.includes('/buyer/dashboard') ? '/buyer/dashboard' : '/dashboard';
                        navigate.push(`${baseRoute}/orders`);
                    }}>
                        <div className="buyer-stat-icon" style={{ background: '#f1f5f9', color: '#64748b' }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                        </div>
                        <div className="buyer-stat-number">{loadingStats ? '...' : stats.completedOrders}</div>
                        <div className="buyer-stat-label">{t('completed') || 'Completed'}</div>
                    </div>
                </div>

                {/* Recent Orders Table */}
                <div className="buyer-dash-section">
                    <div className="buyer-dash-section-header">
                        <h3>{t('recent_orders') || 'Recent Orders'}</h3>
                        <Link href={typeof window !== 'undefined' && window.location.pathname.includes('/buyer/dashboard') ? '/buyer/dashboard/orders' : '/dashboard/orders'} className="buyer-dash-view-all">{t('view_all') || 'View All'} →</Link>
                    </div>
                    {recentOrders.length > 0 ? (
                        <div className="buyer-orders-table-wrap">
                            <table className="buyer-orders-table">
                                <thead>
                                    <tr>
                                        <th>{t('order_id') || 'Order ID'}</th>
                                        <th>{t('product') || 'Product'}</th>
                                        <th>{t('amount') || 'Amount'}</th>
                                        <th>{t('status') || 'Status'}</th>
                                        <th>{t('date') || 'Date'}</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentOrders.map(order => (
                                        <tr key={order._id}>
                                            <td className="buyer-order-id">#{order._id?.slice(-6).toUpperCase()}</td>
                                            <td className="buyer-order-product">
                                                {order.items?.[0]?.product?.name || order.items?.[0]?.name || 'Product'}
                                            </td>
                                            <td className="buyer-order-amount">
                                                {convertPrice ? convertPrice(order.total_amount || order.totalAmount || 0).formatted : `$${order.total_amount || order.totalAmount || 0}`}
                                            </td>
                                            <td>
                                                <span className="buyer-order-status" style={{ background: `${getStatusColor(order.status)}18`, color: getStatusColor(order.status) }}>
                                                    {order.status || 'Pending'}
                                                </span>
                                            </td>
                                            <td className="buyer-order-date">{new Date(order.createdAt || order.created_at).toLocaleDateString()}</td>
                                            <td>
                                                <Link href={typeof window !== 'undefined' && window.location.pathname.includes('/buyer/dashboard') ? '/buyer/dashboard/orders' : '/dashboard/orders'} className="buyer-order-view-btn">{t('view') || 'View'}</Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="buyer-dash-empty">

                            <p className="buyer-dash-empty-title">{t('no_orders_yet') || 'No orders yet'}</p>
                            <p className="buyer-dash-empty-desc">{t('start_sourcing_first_order') || 'Start sourcing products and place your first order.'}</p>
                            <Link href="/search" className="buyer-dash-empty-btn">{t('browse_products') || 'Browse Products'}</Link>
                        </div>
                    )}
                </div>

                {/* Recent Sourcing Requests (RFQ) */}
                <div className="buyer-dash-section">
                    <div className="buyer-dash-section-header">
                        <h3>{t('sourcing_requests_rfq') || 'Sourcing Requests (RFQ)'}</h3>
                        <Link href="/rfq/post" className="buyer-dash-view-all">{t('post_new') || '+ Post New'}</Link>
                    </div>
                    {rfqs.length > 0 ? (
                        <div className="buyer-rfq-list">
                            {rfqs.map(rfq => (
                                <div key={rfq._id} className="buyer-rfq-item">
                                    <div className="buyer-rfq-info">
                                        <span className="buyer-rfq-title">{rfq.title || rfq.product_name || 'RFQ Request'}</span>
                                        <span className="buyer-rfq-date">{new Date(rfq.createdAt || rfq.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <span className="buyer-order-status" style={{ background: `${getStatusColor(rfq.status)}18`, color: getStatusColor(rfq.status) }}>
                                        {rfq.status || 'Open'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="buyer-dash-empty">

                            <p className="buyer-dash-empty-title">{t('no_active_sourcing') || 'No active sourcing requests'}</p>
                            <p className="buyer-dash-empty-desc">{t('post_request_reach_global') || 'Post a request and reach verified suppliers globally.'}</p>
                            <Link href="/rfq/post" className="buyer-dash-empty-btn">{t('post_rfq') || 'Post RFQ'}</Link>
                        </div>
                    )}
                </div>

                {/* Recently Viewed Products */}
                {recentProducts.length > 0 && (
                    <div className="buyer-dash-section">
                        <div className="buyer-dash-section-header">
                            <h3>{t('recently_added_products') || 'Recently Added Products'}</h3>
                            <Link href="/search" className="buyer-dash-view-all">{t('browse_all') || 'Browse All'} →</Link>
                        </div>
                        <div className="buyer-recent-products">
                            {recentProducts.slice(0, 12).map(product => {
                                const imgUrl = getImgUrl(product.images?.[0] || product.main_image);
                                const priceData = convertPrice ? convertPrice(product.main_price || product.price_tiers?.[0]?.price || 0) : { formatted: `$${product.main_price || 0}` };
                                return (
                                    <Link key={product._id} href={`/product/${product.slug || product._id}`} className="buyer-recent-prod-card">
                                        <div className="buyer-recent-prod-img">
                                            {imgUrl ? <img src={imgUrl} alt={product.name} /> : <div className="buyer-recent-prod-placeholder">📷</div>}
                                        </div>
                                        <div className="buyer-recent-prod-info">
                                            <div className="buyer-recent-prod-name">{product.name}</div>
                                            <div className="buyer-recent-prod-price">{priceData.formatted}</div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </>
    );

    return (
        <div className="dashboard-page-wrapper">
            {/* Desktop Premium Header */}
            <header className="dashboard-header-top" style={{ height: '64px', background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', position: 'sticky', top: 0, zIndex: 1000 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <button onClick={() => (typeof window !== 'undefined' && window.innerWidth <= 768) ? setDrawerOpen(true) : setIsCollapsed(!isCollapsed)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary-color)' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                    </button>
                    <span style={{ color: 'var(--primary-color)', fontWeight: 900, fontSize: '18px', cursor: 'default' }}>
                        {t('buyer') || 'Buyer'}
                    </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {!isMobile && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingRight: '16px', borderRight: '1px solid #e2e8f0' }}>
                            {(authUser?.roles?.includes('supplier') || authUser?.role === 'supplier') ? (
                                <button onClick={() => switchRole('supplier')} className="buyer-dash-banner-btn" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#1a1a2e', fontSize: '11px', padding: '6px 14px' }}>{t('supplier_portal') || 'Supplier Portal'}</button>
                            ) : (
                                <Link href="/become-supplier" className="buyer-dash-banner-btn" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#1a1a2e', fontSize: '11px', padding: '6px 14px', textDecoration: 'none' }}>{t('start_selling') || 'Start Selling'}</Link>
                            )}
                            <Link href="/" style={{ textDecoration: 'none', color: '#64748b', fontSize: '12px', fontWeight: 700, marginLeft: '10px' }}>{t('main_site') || 'MAIN SITE'}</Link>
                        </div>
                    )}

                    <div style={{ position: 'relative' }}>
                        <button onClick={() => (typeof window !== 'undefined' && window.innerWidth <= 768) ? navigate.push('/buyer/dashboard/notifications') : setShowNotifyDropdown(!showNotifyDropdown)} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                            {notifications.length > 0 && <span style={{ position: 'absolute', top: '-4px', right: '-4px', background: '#e11d48', color: '#fff', fontSize: '10px', fontWeight: 900, padding: '2px 5px', borderRadius: '10px', border: '2px solid #fff' }}>{notifications.length}</span>}
                        </button>
                        {showNotifyDropdown && (
                            <div onMouseLeave={() => setShowNotifyDropdown(false)} style={{ position: 'absolute', top: '100%', right: 0, width: '380px', background: '#fff', borderRadius: '20px', boxShadow: '0 15px 40px rgba(0,0,0,0.12)', border: '1px solid #eef2f6', zIndex: 1000, marginTop: '12px', overflow: 'hidden', animation: 'dropdownFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                                <div style={{ padding: '18px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}>
                                    <span style={{ fontWeight: 800, fontSize: '15px', color: '#1a1a2e' }}>{t('recent_notifications') || 'Recent Notifications'}</span>
                                    <button onClick={markAllRead} style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>{t('mark_all_read') || 'Mark all as read'}</button>
                                </div>
                                <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                                    {(notifications || []).length > 0 ? (notifications || []).slice(0, 10).map((n: any) => {
                                        const createdAt = n.createdAt || n.created_at;
                                        const dateObj = createdAt ? new Date(createdAt) : null;
                                        const isValidDate = dateObj && !isNaN(dateObj.getTime());

                                        return (
                                            <div
                                                key={n._id}
                                                style={{ padding: '16px 20px', borderBottom: '1px solid #f8fafc', cursor: 'pointer', transition: 'all 0.2s' }}
                                                onClick={() => {
                                                    if (n.link) navigate.push(n.link);
                                                    setShowNotifyDropdown(false);
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', alignItems: 'flex-start' }}>
                                                    <div style={{ fontWeight: 700, fontSize: '14px', color: '#1a1a2e', flex: 1, paddingRight: '10px' }}>{n.title}</div>
                                                    {!n.isRead && <div style={{ width: '8px', height: '8px', background: 'var(--primary-color)', borderRadius: '50%', flexShrink: 0, marginTop: '5px' }}></div>}
                                                </div>
                                                <div style={{ fontSize: '13px', color: '#475569', lineHeight: '1.5', marginBottom: '8px' }}>{n.message}</div>
                                                <div style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                                                    {isValidDate ? dateObj.toLocaleDateString() : 'Recent'}
                                                </div>
                                            </div>
                                        );
                                    }) : (
                                        <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                                            <div style={{ fontSize: '40px', marginBottom: '16px', opacity: 0.5 }}>🔔</div>
                                            <div style={{ color: '#64748b', fontSize: '14px' }}>{t('no_new_notifications') || 'No new notifications'}</div>
                                        </div>
                                    )}
                                </div>
                                <Link href="/buyer/dashboard/notifications" style={{ display: 'block', padding: '15px', textAlign: 'center', background: '#f8fafc', color: 'var(--primary-color)', fontSize: '13px', fontWeight: '800', textDecoration: 'none', borderTop: '1px solid #f1f5f9' }}>{t('view_all_notifications') || 'View All Notifications'}</Link>
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => navigate.push('/dashboard/settings')}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--primary-color)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                            {user.first_name?.[0].toUpperCase()}
                        </div>
                        <div className="d-none d-lg-block" style={{ textAlign: 'left' }}>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: '#1a1a2e' }}>{user.first_name} {user.last_name}</div>
                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>{t('buyer_account') || 'Buyer Account'}</div>
                        </div>
                    </div>

                    <button onClick={handleLogout} style={{ background: 'rgba(225, 29, 72, 0.08)', border: '1px solid rgba(225, 29, 72, 0.15)', width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#e11d48' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                    </button>
                </div>
            </header>

            {/* Overlay */}
            {drawerOpen && <div className="sidebar-overlay" onClick={() => setDrawerOpen(false)}></div>}

            <div className="dashboard-container">
                <aside className={`dashboard-sidebar buyer-sidebar-v2 ${drawerOpen ? 'drawer-open' : ''} ${isCollapsed ? 'collapsed' : ''}`}>
                    <div className="mobile-drawer-header" style={{ padding: '16px 20px', alignItems: 'center', gap: '12px', borderBottom: '1px solid #f1f5f9', marginBottom: '4px' }}>
                        <button onClick={() => setDrawerOpen(false)} style={{ color: '#1a1a2e', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: 800 }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
                            <span>{t('my_alibaba') || 'My Alibaba'}</span>
                        </button>
                    </div>

                    <div className="buyer-sb-profile-section d-none" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div className="buyer-sb-avatar-wrapper" style={{ position: 'relative' }}>
                            {user?.profile_image ? (
                                <img src={getImgUrl(user.profile_image)} alt="Profile" style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
                            ) : (
                                <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--primary-color)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '18px', border: '2px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                                    {user?.first_name?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                        <div className="buyer-sb-user-info">
                            <div style={{ fontWeight: 800, fontSize: '15px', color: '#1a1a2e', lineHeight: 1.2 }}>{user?.first_name} {user?.last_name}</div>
                            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{user?.email}</div>
                        </div>
                    </div>

                    <div className="buyer-sb-desktop-header">
                        {!isCollapsed && <span className="buyer-sb-title">{t('buyer_portal') || 'Buyer Portal'}</span>}
                        <button className="buyer-sb-toggle-btn" onClick={() => setIsCollapsed(!isCollapsed)} title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}>
                            <ToggleIcon />
                        </button>
                    </div>

                    <button className={`buyer-sb-item buyer-sb-hub-item ${activeSidebar === 'dashboard' ? 'active' : ''}`}
                        onClick={() => {
                            const baseRoute = typeof window !== 'undefined' && window.location.pathname.includes('/buyer/dashboard') ? '/buyer/dashboard' : '/dashboard';
                            navigate.push(baseRoute);
                            setDrawerOpen(false);
                        }}>
                        <div className="buyer-sb-item-left" style={{ fontWeight: 700, fontSize: '15px' }}>
                            <SidebarIcon type="dashboard" />
                            {!isCollapsed && <span>{t('dashboard') || 'Dashboard'}</span>}
                        </div>
                    </button>

                    <div className="buyer-sb-nav-content">
                        {sidebarItems.map((group, idx) => (
                            <div key={idx}>
                                {(group.group !== 'Main' || drawerOpen) && <h4 className="buyer-sb-section-title">{translateGroup(group.group)}</h4>}
                                {group.items.filter(i => i.id !== 'dashboard').map((item: any) => {
                                    const baseRoute = typeof window !== 'undefined' && window.location.pathname.includes('/buyer/dashboard') ? '/buyer/dashboard' : '/dashboard';
                                    return (
                                        <button key={item.id}
                                            className={`buyer-sb-item ${activeSidebar === item.id || (item.subItems && item.subItems.some((sub: any) => sub.id === activeSidebar)) ? 'active' : ''}`}
                                            onClick={() => {
                                                if (item.subItems) {
                                                    navigate.push(`${baseRoute}/${item.subItems[0].id}`);
                                                } else {
                                                    navigate.push(`${baseRoute}/${item.id}`);
                                                }
                                                setDrawerOpen(false);
                                            }}
                                            title={isCollapsed ? item.label : ''}>
                                            <div className="buyer-sb-item-left">
                                                <SidebarIcon type={item.icon} />
                                                {!isCollapsed && <span>{item.label}</span>}
                                                {item.id === 'messages' && unreadTotal > 0 && (
                                                    <span className="buyer-sb-msg-badge">{unreadTotal}</span>
                                                )}
                                            </div>
                                            {!isCollapsed && <span className="buyer-sb-arrow">❯</span>}
                                        </button>
                                    );
                                })}
                            </div>
                        ))}
                    </div>

                    {(drawerOpen || !isCollapsed) && (
                        <div className="buyer-sb-logout-section">
                            <button className="buyer-sb-logout-btn" onClick={handleLogout}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                                <span>Logout Account</span>
                            </button>
                        </div>
                    )}
                </aside>

                <main className="dashboard-main">
                    {activeSidebar === 'orders' ? (
                        subtab ? <OrderDetail role="buyer" orderId={subtab} /> : <MyOrders />
                    ) : activeSidebar === 'disputes' ? (
                        <BuyerDisputes />
                    ) : activeSidebar === 'notifications' ? (
                        <MyNotifications />
                    ) : activeSidebar === 'messages' ? (
                        <MyMessages />
                    ) : activeSidebar === 'inquiries' ? (
                        <InquiriesRFQs />
                    ) : activeSidebar === 'customizations' ? (
                        <BuyerCustomizations />
                    ) : activeSidebar === 'product-enquiries' ? (
                        <BuyerEnquiries />
                    ) : activeSidebar === 'contacts' ? (
                        <MyContacts />
                    ) : activeSidebar === 'my_rfqs' ? (
                        <MyRFQs />
                    ) : activeSidebar === 'saved' ? (
                        <BuyerWishlist />
                    ) : activeSidebar === 'company_profile' ? (
                        <BuyerProfile />
                    ) : activeSidebar === 'subscription' ? (
                        <BuyerSubscription />
                    ) : activeSidebar === 'shipping' ? (
                        <ShippingAddress />
                    ) : activeSidebar === 'security' || activeSidebar === 'settings' ? (
                        <UserSettings />
                    ) : activeSidebar === 'invoice' ? (
                        <Invoice orderId={subtab} orderData={null} />
                    ) : (
                        <DashboardOverview />
                    )}
                </main>
            </div>
        </div>
    );
};

export default BuyerDashboard;
