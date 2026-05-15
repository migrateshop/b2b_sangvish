import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import styles from './AdminLayout.module.css';
import './admin-global.css';
import { useTheme } from '@/context/ThemeContext';
import { useNotifications } from '@/context/NotificationContext';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/axiosConfig';
import LogoutModal from '@/components/js/LogoutModal';
import { getImgUrl } from '@/utils/imageConfig';

interface AdminSubItem {
    id: string | number;
    label: string;
    path: string;
    icon: string;
}

interface AdminMenuItem {
    id?: string | number;
    label?: string;
    path?: string;
    icon?: string;
    group?: string;
    items?: AdminSubItem[];
}

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
    const navigate = useRouter();
    const location = usePathname();
    const { theme, toggleTheme } = useTheme();
    const { user, logout, language, currency, availableLanguages, availableCurrencies, updateUserSettings, siteSettings, isInitialized, t, convertPrice } = useAuth();
    const normalizeKey = (label: string) => {
        return label?.toLowerCase()
            .replace(/ & /g, '_and_')
            .replace(/ /g, '_')
            .replace(/[^a-zA-Z0-9_]/g, '');
    };
    const [isCollapsed, setIsCollapsed] = React.useState(false);
    const [drawerOpen, setDrawerOpen] = React.useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);

    // Refs for click-outside logic
    const headerRightRef = React.useRef<HTMLDivElement>(null);

    // Global click listener to close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (headerRightRef.current && !headerRightRef.current.contains(event.target as Node)) {
                setShowLangDropdown(false);
                setShowNotifyDropdown(false);
                setShowProfileDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Security Check: Only admins allowed
    useEffect(() => {
        if (!isInitialized) return;
        if (location === '/admin/login') return;

        if (!user) {
            navigate.push('/admin/login');
            return;
        }
        const roles = user.roles || (user.role ? [user.role] : []);
        if (!roles.includes('admin')) {
            navigate.push('/admin/login');
        }
    }, [user, navigate, location, isInitialized]);

    // Language & Currency State
    const [showLangDropdown, setShowLangDropdown] = useState(false);
    const [selectedLang, setSelectedLang] = useState(language);
    const [selectedCurr, setSelectedCurr] = useState(currency);

    useEffect(() => {
        setSelectedLang(language);
        setSelectedCurr(currency);
    }, [language, currency]);

    const handleSaveLangCurr = async () => {
        await updateUserSettings(selectedLang, selectedCurr);
        setShowLangDropdown(false);
        if (typeof window !== 'undefined') {
            window.location.reload();
        }
    };

    const activeLangName = availableLanguages?.find(l => (l.code === language || l.name === language))?.name || language || 'English';
    const activeCurrCode = availableCurrencies?.find(c => (c.code === currency || c.name === currency))?.code || currency || 'USD';

    const handleLogout = () => {
        setShowLogoutModal(true);
    };

    const confirmLogout = () => {
        logout();
        setShowLogoutModal(false);
    };

    const { notifications, unreadCount } = useNotifications();
    const [navItems, setNavItems] = useState<AdminMenuItem[]>([]);
    const [showNotifyDropdown, setShowNotifyDropdown] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const mRes = await api.get('/admin/menu');
                setNavItems(mRes.data || []);
            } catch (err) {
                console.error('Error fetching layout data:', err);
            }
        };
        fetchData();
    }, []);

    const getPageTitle = () => {
        const segments = location.split('/').filter(s => s && s !== 'admin');
        const last = segments[segments.length - 1];
        if (!last || last === 'dashboard') return 'Dashboard';
        return last.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    const SidebarIcon = ({ path, active }: { path: string; active: boolean }) => (
        <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ minWidth: '20px', flexShrink: 0 }}
        >
            <path d={path} />
        </svg>
    );

    if (!isInitialized) {
        return (
            <div style={{
                height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', background: '#f8fafc'
            }}>
                <div style={{
                    width: '40px', height: '40px', border: '3px solid #e2e8f0',
                    borderTop: '3px solid var(--primary-color, #0d2e67)', borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                }} />
                <style>{`
                    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                `}</style>
            </div>
        );
    }

    return (
        <div className={`admin-layout ${theme}`}>
            {/* Mobile Header */}
            <header className={styles['admin-mobile-header']}>
                <button className={styles['admin-menu-toggle']} onClick={() => setDrawerOpen(true)}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                </button>
                <div className={styles['admin-logo-box-mobile']}>
                    {siteSettings?.logo_light ? (
                        <img src={siteSettings.logo_light} alt="Logo" style={{ height: '24px' }} />
                    ) : (
                        <>
                            <span className={styles['admin-logo-a']}>{siteSettings?.site_name?.[0] || 'A'}</span>
                            <span className={styles['admin-logo-libaba']}>{siteSettings?.site_name?.substring(1) || 'libaba'}</span>
                        </>
                    )}
                </div>
                <div style={{ width: '40px' }}></div>
            </header>

            {/* Overlay */}
            {drawerOpen && <div className={styles['admin-overlay']} onClick={() => setDrawerOpen(false)}></div>}

            <aside className={`admin-sidebar border-r border-gray-200 ${isCollapsed ? 'collapsed' : ''} ${drawerOpen ? 'drawer-open' : ''}`}>
                <div className={styles['admin-logo-box']}>
                    <Link href="/admin/dashboard" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', transition: 'opacity 0.2s' }}>
                        {siteSettings?.logo_light ? (
                            <img src={siteSettings.logo_light} alt={siteSettings?.site_name || 'Admin'} style={{ height: '32px', maxWidth: '100%', objectFit: 'contain' }} />
                        ) : (
                            <>
                                <span className={styles['admin-logo-a']}>
                                    {siteSettings?.site_name?.[0] || 'A'}
                                </span>
                                {!isCollapsed && (
                                    <span className={styles['admin-logo-libaba']}>
                                        {siteSettings?.site_name?.substring(1) || 'libaba'}
                                    </span>
                                )}
                            </>
                        )}
                    </Link>
                    <button className={styles['desktop-collapse-btn']} onClick={() => setIsCollapsed(!isCollapsed)}>
                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ transform: isCollapsed ? 'rotate(180deg)' : 'none' }}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"></path>
                        </svg>
                    </button>
                    <button className={styles['mobile-close-btn']} onClick={() => setDrawerOpen(false)}>
                        <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>

                <div className={styles['admin-nav-content']}>
                    <nav className={styles['admin-nav']}>
                        {navItems.map((item, index) => {
                            if (item.group) {
                                return (
                                    <div key={index} className="admin-nav-group-container">
                                        <div className="admin-nav-group">
                                            {!isCollapsed ? (t(normalizeKey(item.group)) || item.group) : '···'}
                                        </div>
                                        {item.items?.map((sub: AdminSubItem) => (
                                            <Link
                                                key={sub.id}
                                                href={sub.path}
                                                className={`admin-nav-item ${location === sub.path ? 'active' : ''}`}
                                                onClick={() => setDrawerOpen(false)}
                                                title={isCollapsed ? (t(normalizeKey(sub.label)) || sub.label) : ''}
                                            >
                                                <SidebarIcon path={sub.icon} active={location === sub.path} />
                                                {!isCollapsed && <span>{t(normalizeKey(sub.label)) || sub.label}</span>}
                                            </Link>
                                        ))}
                                    </div>
                                );
                            } else {
                                return (
                                    <Link
                                        key={item.id || index}
                                        href={item.path || '#'}
                                        className={`admin-nav-item ${location === item.path ? 'active' : ''}`}
                                        onClick={() => setDrawerOpen(false)}
                                        title={isCollapsed ? (t(normalizeKey(item.label)) || item.label) : ''}
                                    >
                                        <SidebarIcon path={item.icon || ''} active={location === item.path} />
                                        {!isCollapsed && <span>{t(normalizeKey(item.label)) || item.label}</span>}
                                    </Link>
                                );
                            }
                        })}
                    </nav>
                </div>

                <div className={styles['admin-sidebar-footer']}>
                    <button
                        className="admin-nav-item"
                        onClick={handleLogout}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', marginTop: 0 }}
                        title={isCollapsed ? 'Logout' : ''}
                    >
                        <SidebarIcon
                            path="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                            active={false}
                        />
                        {!isCollapsed && <span>{t('logout_account') || 'Logout'}</span>}
                    </button>
                </div>
            </aside>

            <main className={styles['admin-main']}>
                <header className={styles['admin-header']}>
                    <div className={styles['admin-header-left']}>
                        <Link href="/admin/dashboard" className={styles['breadcrumb-home']}>{t('home') || 'Home'}</Link>
                        <div className={styles['breadcrumb-separator']}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                        </div>
                        <span className={styles['breadcrumb-current']}>{t(normalizeKey(getPageTitle())) || getPageTitle()}</span>
                    </div>

                    <div className={styles['admin-header-right']} ref={headerRightRef}>
                        <div className={styles['admin-header-group']} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div className={styles['relative']} style={{ position: 'relative' }}>
                                <button
                                    title="Language & Currency"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowLangDropdown(!showLangDropdown);
                                        setShowNotifyDropdown(false);
                                        setShowProfileDropdown(false);
                                    }}
                                    className={styles['pill-selector']}
                                    style={{ border: showLangDropdown ? '1px solid var(--primary-color, #0d2e67)' : '1px solid #e2e8f0' }}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary-color, #0d2e67)' }}><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"></path></svg>
                                    <span style={{ color: 'var(--admin-text-main, #1a1a2e)' }}>{activeLangName} - {activeCurrCode}</span>
                                </button>

                                {showLangDropdown && (
                                    <div
                                        onMouseLeave={() => setShowLangDropdown(false)}
                                        style={{
                                            position: 'absolute', top: 'calc(100% + 12px)', right: '-8px',
                                            width: '300px', zIndex: 2000,
                                            background: '#fff',
                                            borderRadius: '16px',
                                            boxShadow: '0 20px 60px rgba(13,46,103,0.15), 0 4px 16px rgba(0,0,0,0.08)',
                                            border: '1px solid #e8edf5',
                                            overflow: 'hidden'
                                        }}
                                    >
                                        {/* Header */}
                                        <div style={{
                                            background: 'var(--primary-color, #0d2e67)',
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
                                                    <div style={{ color: '#fff', fontWeight: '800', fontSize: '13px', lineHeight: 1.2 }}>Language & Currency</div>
                                                    <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px', fontWeight: '600' }}>Display preferences</div>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); setShowLangDropdown(false); }}
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
                                                    Language
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
                                                    Currency
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
                                                    width: '100%',
                                                    padding: '12px',
                                                    borderRadius: '12px',
                                                    border: 'none',
                                                    background: 'var(--primary-color, #0d2e67)',
                                                    color: '#fff',
                                                    fontWeight: '800',
                                                    fontSize: '13px',
                                                    cursor: 'pointer',
                                                    boxShadow: '0 4px 12px rgba(13, 46, 103, 0.25)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '8px'
                                                }}
                                            >
                                                Save Changes
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className={styles['relative']} style={{ position: 'relative' }}>
                                <button
                                    title="Notifications"
                                    onClick={() => {
                                        setShowNotifyDropdown(!showNotifyDropdown);
                                        setShowLangDropdown(false);
                                        setShowProfileDropdown(false);
                                    }}
                                    className={styles['header-action-btn']}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                                        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                                    </svg>
                                    {unreadCount > 0 && <span className={styles['notification-badge-count']}>{unreadCount}</span>}
                                </button>

                                {showNotifyDropdown && (
                                    <div
                                        onMouseLeave={() => setShowNotifyDropdown(false)}
                                        style={{
                                            position: 'absolute', top: 'calc(100% + 12px)', right: '-8px',
                                            width: '360px', zIndex: 2000,
                                            background: '#fff',
                                            borderRadius: '16px',
                                            boxShadow: '0 20px 60px rgba(13,46,103,0.15), 0 4px 16px rgba(0,0,0,0.08)',
                                            border: '1px solid #e8edf5',
                                            overflow: 'hidden'
                                        }}
                                    >
                                        {/* Header */}
                                        <div style={{
                                            background: 'var(--primary-color, #0d2e67)',
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
                                            {unreadCount > 0 && (
                                                <span style={{
                                                    background: 'var(--clr-accent)', color: '#fff',
                                                    fontSize: '10px', fontWeight: '900',
                                                    padding: '3px 8px', borderRadius: '99px'
                                                }}>
                                                    {unreadCount} NEW
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
                                                        key={n._id || idx}
                                                        onClick={() => { n.link && navigate.push(n.link); setShowNotifyDropdown(false); }}
                                                        style={{
                                                            display: 'flex', alignItems: 'flex-start', gap: '12px',
                                                            padding: '12px 16px', cursor: 'pointer',
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
                                                        {!n.isRead && (
                                                            <div style={{
                                                                width: '7px', height: '7px', borderRadius: '50%',
                                                                background: 'var(--primary-color)', flexShrink: 0, marginTop: '4px'
                                                            }} />
                                                        )}
                                                    </div>
                                                );
                                            }) : (
                                                <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                                                    <div style={{ fontSize: '32px', marginBottom: '8px', opacity: 0.4, display: 'flex', justifyContent: 'center' }}>
                                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                                                    </div>
                                                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>No new notifications</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Faint vertical divider */}
                        <div style={{ width: '1px', height: '32px', backgroundColor: '#e2e8f0', margin: '0 8px' }}></div>

                        <button onClick={toggleTheme} title="Toggle Theme" className={styles['header-action-btn']}>
                            {theme === 'light' ? (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                                </svg>
                            ) : (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="5"></circle>
                                    <line x1="12" y1="1" x2="12" y2="3"></line>
                                    <line x1="12" y1="21" x2="12" y2="23"></line>
                                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                                    <line x1="1" y1="12" x2="3" y2="12"></line>
                                    <line x1="21" y1="12" x2="23" y2="12"></line>
                                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                                </svg>
                            )}
                        </button>

                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '16px', marginLeft: '12px' }}>
                            <div
                                className={`${styles['profile-pill']} ${showProfileDropdown ? styles['profile-pill-active'] : ''}`}
                                onClick={() => {
                                    setShowProfileDropdown(!showProfileDropdown);
                                    setShowLangDropdown(false);
                                    setShowNotifyDropdown(false);
                                }}
                            >
                                <div style={{
                                    overflow: 'hidden',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: '#e2e8f0',
                                    width: '38px', height: '38px', borderRadius: '50%'
                                }}>
                                    {user?.profile_image ? (
                                        <img
                                            src={getImgUrl(user.profile_image)}
                                            alt="Profile"
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    ) : (
                                        <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e293b' }}>{user?.first_name?.[0]}{user?.last_name?.[0]}</span>
                                    )}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                    <span className="text-admin-main" style={{ fontSize: '13px', fontWeight: '700', lineHeight: '1.2' }}>{user?.first_name} {user?.last_name}</span>
                                    <span className="text-admin-muted" style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '0.02em', marginTop: '2px', textTransform: 'uppercase' }}>Super Admin</span>
                                </div>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: showProfileDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', marginLeft: '4px' }}>
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                            </div>

                            {showProfileDropdown && (
                                <div
                                    onMouseLeave={() => setShowProfileDropdown(false)}
                                    className={styles['premium-dropdown']}
                                >
                                    <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', marginBottom: '8px' }}>
                                        <div style={{ color: '#0f172a', fontSize: '13px', fontWeight: '700' }}>Signed in as</div>
                                        <div style={{ color: '#64748b', fontSize: '12px', fontWeight: '500', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email || (user?.first_name + ' ' + user?.last_name)}</div>
                                    </div>

                                    <button
                                        onClick={() => { navigate.push('/admin/profile'); setShowProfileDropdown(false); }}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '10px',
                                            width: '100%', padding: '10px 16px', background: 'transparent',
                                            border: 'none', borderRadius: '10px', cursor: 'pointer',
                                            color: '#334155', fontSize: '13px', fontWeight: '600', transition: 'background 0.2s', textAlign: 'left'
                                        }}
                                        onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#0f172a'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#334155'; }}
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                            <circle cx="12" cy="7" r="4"></circle>
                                        </svg>
                                        Edit Profile
                                    </button>

                                    <button
                                        onClick={() => { handleLogout(); setShowProfileDropdown(false); }}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '10px',
                                            width: '100%', padding: '10px 16px', background: 'transparent',
                                            border: 'none', borderRadius: '10px', cursor: 'pointer',
                                            color: '#ef4444', fontSize: '13px', fontWeight: '600', transition: 'background 0.2s', textAlign: 'left',
                                            marginTop: '4px'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = '#fef2f2'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                            <polyline points="16 17 21 12 16 7"></polyline>
                                            <line x1="21" y1="12" x2="9" y2="12"></line>
                                        </svg>
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>
                <div className={styles['admin-content-wrapper']}>
                    {children}
                </div>
            </main>

            <LogoutModal
                isOpen={showLogoutModal}
                onClose={() => setShowLogoutModal(false)}
                onConfirm={confirmLogout}
                title="Admin Logout"
                message="Are you sure you want to sign out from Admin Panel?"
            />
        </div>
    );
};

export default AdminLayout;
