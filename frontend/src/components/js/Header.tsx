import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Select from 'react-select';
import api from '@/services/axiosConfig';
import AuthModal from './AuthModal';
import SettingsModal from './SettingsModal';
import { useAuth } from '@/context/AuthContext';
import LogoutModal from './LogoutModal';
import { useChat } from '@/context/ChatContext';
import { useNotifications } from '@/context/NotificationContext';
import { getImgUrl } from '@/utils/imageConfig';
import useIsMobile from '@/hooks/useIsMobile';


interface Category {
    _id: string;
    title: string;
    image?: string;
    children?: Category[];
    subcategories?: Category[];
    name?: string;
}

interface UserAddress {
    address: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
    country_code?: string;
    is_default?: boolean;
}

interface CartItem {
    image?: string;
    title?: string;
    name?: string;
    price: number | string;
    quantity: number;
}

const Header = () => {
    const { unreadTotal } = useChat();
    const { unreadCount, notifications, markAsRead, markAllRead } = useNotifications();
    const [categories, setCategories] = useState<Category[]>([]);
    const [staticPages, setStaticPages] = useState<any[]>([]);
    const [activeCategory, setActiveCategory] = useState<Category | null>(null);
    const [categoryProducts, setCategoryProducts] = useState<any[]>([]);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isFeaturedMenuOpen, setIsFeaturedMenuOpen] = useState(false);
    const [isHelpCenterOpen, setIsHelpCenterOpen] = useState(false);
    const [activeFeaturedItem, setActiveFeaturedItem] = useState<string>('top-deals');
    const [activeHelpItem, setActiveHelpItem] = useState<string>('buyers');
    const [isCategoriesPortalOpen, setIsCategoriesPortalOpen] = useState(false);
    const [activePortalCategory, setActivePortalCategory] = useState<any>(null);
    const [searchKeyword, setSearchKeyword] = useState('');
    const pathname = usePathname();
    const navigate = useRouter();

    // Read initial tab from URL if present
    const searchParams = useSearchParams();
    const urlTab = searchParams.get('tab') || 'products';

    const [activeSearchTab, setActiveSearchTab] = useState(urlTab);
    const [cartCount, setCartCount] = useState(0);
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [searchHistory, setSearchHistory] = useState<string[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [isDeliverToOpen, setIsDeliverToOpen] = useState(false);
    const [userAddress, setUserAddress] = useState<UserAddress | null>(null);
    const [tempCountry, setTempCountry] = useState('');
    const [zipCode, setZipCode] = useState('');
    const [isScrolled, setIsScrolled] = useState(false);
    const [logoImgError, setLogoImgError] = useState(false);
    const profileDropdownRef = useRef<HTMLDivElement>(null);
    const deliverToRef = useRef<HTMLDivElement>(null);



    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
                setIsProfileMenuOpen(false);
            }
            if (deliverToRef.current && !deliverToRef.current.contains(event.target as Node)) {
                setIsDeliverToOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const history = JSON.parse((typeof window !== 'undefined' ? localStorage.getItem('search_history') : null) || '[]');
        setSearchHistory(history);
    }, []);

    const saveSearch = (term: string) => {
        const history = JSON.parse((typeof window !== 'undefined' ? localStorage.getItem('search_history') : null) || '[]');
        if (!history.includes(term)) {
            const newHistory = [term, ...history].slice(0, 5);
            setSearchHistory(newHistory);
            localStorage.setItem('search_history', JSON.stringify(newHistory));
        }
    };

    useEffect(() => {
        const updateCount = () => {
            const items = JSON.parse((typeof window !== 'undefined' ? localStorage.getItem('cart') : null) || '[]');
            setCartCount(items.length);
            setCartItems(items);
        };
        updateCount();
        window.addEventListener('cartUpdated', updateCount);
        window.addEventListener('storage', updateCount);
        return () => {
            window.removeEventListener('cartUpdated', updateCount);
            window.removeEventListener('storage', updateCount);
        };
    }, []);

    const {
        authModal, user, currentRole, switchRole, logout,
        openLogin, openRegister, closeAuthModal,
        language, currency, availableCountries, selectedCountry, setSelectedCountry, t, siteSettings
    } = useAuth();
    const isCheckoutPage = pathname === '/checkout';
    const isAiSourcingPage = pathname === '/ai-sourcing';
    const isDashboard = pathname ? (pathname.startsWith('/dashboard') || pathname.startsWith('/buyer/dashboard') || pathname.startsWith('/supplier') || pathname.startsWith('/admin') || pathname.startsWith('/supplier-dashboard') || isCheckoutPage) : false;
    const isSearchPage = pathname ? pathname.startsWith('/search') : false;
    const isProductPage = pathname ? pathname.startsWith('/product') : false;
    const isWorldwide = searchParams.get('tab') === 'worldwide';
    const isHome = pathname === '/';
    const isCompactHeader = (!isHome || (isHome && isScrolled)) && pathname && !pathname.startsWith('/admin') && !pathname.startsWith('/dashboard') && !pathname.startsWith('/buyer/dashboard');

    const isMobile = useIsMobile(450);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const { data } = await api.get('/categories');
                setCategories(data);
                if (data.length > 0) setActiveCategory(null);
            } catch (err) {
                console.error('Error fetching categories:', err);
            }
        };
        const fetchStaticPages = async () => {
            try {
                const { data } = await api.get('/cms');
                setStaticPages(data);
            } catch (err) {
                console.error('Error fetching static pages:', err);
            }
        };
        const fetchUserAddress = async () => {
            if (user) {
                try {
                    const { data } = await api.get('/shipping-address');
                    const defaultAddr = data.find((a: any) => a.is_default) || data[0];
                    setUserAddress(defaultAddr);
                    if (defaultAddr && defaultAddr.country_code) {
                        setSelectedCountry(defaultAddr.country_code);
                    }
                } catch (err) {
                    console.error('Error fetching address:', err);
                }
            }
        };
        fetchCategories();
        fetchStaticPages();
        fetchUserAddress();
    }, [user]);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 150);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const showFixedHeader = (!isHome && !isSearchPage && !isProductPage) || (isHome && isScrolled);

    useEffect(() => {
        setTempCountry(selectedCountry);
    }, [selectedCountry]);

    useEffect(() => {
        // Keep active tab in sync with URL
        const paramsTab = new URLSearchParams(searchParams?.toString()).get('tab');
        if (paramsTab && paramsTab !== activeSearchTab) {
            setActiveSearchTab(paramsTab);
        }
    }, [searchParams?.toString()]);

    useEffect(() => {
        // Product fetching for mega menu is removed as per user request to show categories only
    }, [isMenuOpen]);

    // Lock body scroll and prevent jump when mega menu is open
    useEffect(() => {
        if (isMenuOpen || isFeaturedMenuOpen || isHelpCenterOpen || isCategoriesPortalOpen) {
            document.body.classList.add('mega-menu-open');
        } else {
            document.body.classList.remove('mega-menu-open');
        }
        return () => { document.body.classList.remove('mega-menu-open'); };
    }, [isMenuOpen, isFeaturedMenuOpen, isCategoriesPortalOpen]);

    if (pathname && pathname.startsWith('/admin')) {
        return null;
    }

    if (isMobile) {
        return (
            <header className="mobile-header-fixed">
                <div className="mph-search-bar-wrap" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000, background: '#fff', borderBottom: '1px solid #eee' }}>
                    <div className="mph-mobile-header-top">
                        <div className="mph-mobile-logo-container">
                            {siteSettings?.logo_light ? (
                                <img
                                    src={getImgUrl(siteSettings.logo_light)}
                                    alt={siteSettings?.siteName || 'Logo'}
                                    className="mph-mobile-logo"
                                    onClick={() => navigate.push('/')}
                                    style={{ height: '30px', cursor: 'pointer' }}
                                />
                            ) : (
                                <span className="mph-mobile-logo-text" onClick={() => navigate.push('/')}>
                                    {siteSettings?.siteName || 'Alibaba Demo'}
                                </span>
                            )}
                        </div>

                        <div className="mph-mobile-header-actions">
                            <button className="mph-hdr-btn" onClick={() => setIsDeliverToOpen?.(true)} title="Location">
                                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                            </button>
                            <button className="mph-hdr-btn" onClick={() => setIsSettingsOpen?.(true)} title="Language & Currency">
                                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"></path></svg>
                            </button>
                            <Link href={user ? "/dashboard/messages" : "#"} onClick={(e) => { if (!user) { e.preventDefault(); openLogin(); } }} className="mph-hdr-btn mph-hdr-badge-wrap" title="Messages">
                                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                                {unreadTotal > 0 && <span className="mph-hdr-badge">{unreadTotal}</span>}
                            </Link>
                            <Link href="/cart" className="mph-hdr-btn mph-hdr-badge-wrap" title="Cart">
                                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                                {cartCount > 0 && <span className="mph-hdr-badge">{cartCount}</span>}
                            </Link>
                            <Link href={user ? "/dashboard/notifications" : "#"} onClick={(e) => { if (!user) { e.preventDefault(); openLogin(); } }} className="mph-hdr-btn mph-hdr-badge-wrap" title="Notifications">
                                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                                {unreadCount > 0 && <span className="mph-hdr-badge">{unreadCount}</span>}
                            </Link>
                            <Link href={user ? "/buyer/dashboard/saved" : "#"} onClick={(e) => { if (!user) { e.preventDefault(); openLogin(); } }} className="mph-hdr-btn" title="Favorites">
                                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
                            </Link>
                        </div>
                    </div>
                </div>
            </header>
        );
    }

    // If it's a checkout page, we might still want to hide it or show a simplified one, 
    // but the user asked for it to be fixed on "other pages".
    // Let's keep it visible everywhere for now as requested.

    return (
        <>
            <header className={`header ${showFixedHeader ? 'is-fixed' : ''} ${isCompactHeader ? 'search-page-header' : ''} ${isDashboard ? 'dashboard-global-header' : ''} ${isHome && !isScrolled ? 'home-header-radiant' : ''}`}>
                {/* Promo Banner Removed */}


                {/* Top Nav */}
                {/* Top Nav */}
                <div className={`top-nav ${isDashboard ? 'container-fluid' : 'container'} ${isCompactHeader ? 'compact-layout' : ''}`}>
                    <div className="logo-section d-flex align-center gap-4">
                        <Link href="/" className="brand-logo d-flex align-center" style={{ textDecoration: 'none' }}>
                            {siteSettings?.logo_dark && !logoImgError ? (
                                <img
                                    src={getImgUrl(siteSettings.logo_dark)}
                                    alt={siteSettings?.site_name || 'Logo'}
                                    style={{ height: '40px', maxWidth: '160px', objectFit: 'contain' }}
                                    onError={() => setLogoImgError(true)}
                                />
                            ) : (
                                <span className="alibaba-logo-svg">
                                    <svg width="240" height="40" viewBox="0 0 250 40" preserveAspectRatio="xMinYMid meet">
                                        <text x="0" y="32" style={{ fill: '#000', fontSize: '30px', fontWeight: '900', fontStyle: 'italic', fontFamily: 'Arial, sans-serif' }}>
                                            {siteSettings?.site_name || 'B2B'}
                                            <tspan style={{ fill: '#000', fontStyle: 'normal' }}>.com</tspan>
                                        </text>
                                    </svg>
                                </span>
                            )}
                        </Link>

                        {/* All Categories Dropdown - Only show when scrolled (fixed header) as requested */}
                        {showFixedHeader && (
                            <div
                                className="nav-item-wrapper all-categories-wrapper top-nav-categories d-none-mobile"
                                onMouseEnter={() => (typeof window !== 'undefined' ? window.innerWidth : 768) > 768 && setIsMenuOpen(true)}
                                onMouseLeave={() => (typeof window !== 'undefined' ? window.innerWidth : 768) > 768 && setIsMenuOpen(false)}
                                onClick={() => (typeof window !== 'undefined' ? window.innerWidth : 768) <= 768 && setIsMenuOpen(!isMenuOpen)}
                            >
                                <button className="nav-link-btn d-flex align-center gap-1 font-medium header-cat-btn" style={{ background: 'none', border: 'none', padding: '0', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                                    <span style={{ fontWeight: '700', fontSize: '0.95rem' }}>{t('all_categories')}</span>
                                </button>

                                {isMenuOpen && (
                                    <div className="mega-menu">
                                        {/* Mobile sheet header (not visible on desktop) */}
                                        <div className="mobile-mega-header" style={{ display: 'none', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px 8px', borderBottom: '1px solid #f1f5f9' }}>
                                            <span style={{ fontSize: '1rem', fontWeight: 600, color: '#1a202c' }}>Select Category</span>
                                            <button
                                                onClick={(e: React.MouseEvent) => { e.stopPropagation(); setIsMenuOpen(false); }}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#64748b', lineHeight: 1 }}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                        <div className="mega-menu-container d-flex">
                                            <div className="mega-menu-left">
                                                <ul className="category-list">
                                                    {/* All option first */}
                                                    <li
                                                        className={`category-item d-flex align-center gap-2 ${!activeCategory ? 'active' : ''}`}
                                                        onMouseEnter={() => (typeof window !== 'undefined' ? window.innerWidth : 768) > 768 && setActiveCategory(null)}
                                                        onClick={() => {
                                                            if ((typeof window !== 'undefined' ? window.innerWidth : 768) <= 768) {
                                                                navigate.push('/search');
                                                                setIsMenuOpen(false);
                                                            } else {
                                                                setActiveCategory(null);
                                                            }
                                                        }}
                                                    >
                                                        <div className="cat-icon-wrapper">
                                                            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path></svg>
                                                        </div>
                                                        <span className="cat-title-text">Categories for you</span>
                                                    </li>
                                                    {categories.map(cat => (
                                                        <li
                                                            key={cat._id}
                                                            className={`category-item d-flex align-center gap-2 ${activeCategory?._id === cat._id ? 'active' : ''}`}
                                                            onMouseEnter={() => (typeof window !== 'undefined' ? window.innerWidth : 768) > 768 && setActiveCategory(cat)}
                                                            onClick={() => {
                                                                if ((typeof window !== 'undefined' ? window.innerWidth : 768) <= 768) {
                                                                    navigate.push(`/search?category_id=${cat._id}`);
                                                                    setIsMenuOpen(false);
                                                                } else {
                                                                    setActiveCategory(cat);
                                                                }
                                                            }}
                                                        >
                                                            <div className="cat-icon-wrapper">
                                                                <img src={getImgUrl(cat.image)} alt="" className="cat-menu-img" onError={(e) => (e.target as HTMLImageElement).src = 'https://cdn-icons-png.flaticon.com/512/711/711707.png'} />
                                                            </div>
                                                            <span className="cat-title-text">{cat.title}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div className="mega-menu-right">
                                                <div className="mega-menu-scroll-area">
                                                    <div className="mega-category-section">
                                                        <div className="mega-menu-title-row">
                                                            <h4 className="active-cat-title category-title">
                                                                {activeCategory ? activeCategory.title : 'Featured Categories'}
                                                            </h4>
                                                            <Link href={activeCategory ? `/search?category_id=${activeCategory._id}` : '/search'} className="browse-link-alibaba view-all-link">View all &gt;</Link>
                                                        </div>
                                                        {activeCategory ? (
                                                            <div className="subcategory-grid">
                                                                {activeCategory.children && activeCategory.children.length > 0 ? (
                                                                    activeCategory.children.map((sub: Category) => (
                                                                        <div key={sub._id} className="subcategory-group-circular">
                                                                            <Link
                                                                                href={`/search?category_id=${sub._id}`}
                                                                                className="subcategory-circular-link"
                                                                                onClick={() => setIsMenuOpen(false)}
                                                                            >
                                                                                <div className="sub-cat-circle-img">
                                                                                    <img
                                                                                        src={getImgUrl(sub.image)}
                                                                                        alt={sub.title}
                                                                                        onError={(e) => {
                                                                                            (e.target as HTMLImageElement).src = 'https://cdn-icons-png.flaticon.com/512/711/711707.png';
                                                                                        }}
                                                                                    />
                                                                                </div>
                                                                                <span className="subcategory-circular-title">{sub.title}</span>
                                                                            </Link>
                                                                        </div>
                                                                    ))
                                                                ) : (
                                                                    <div className="no-subcategories" style={{ gridColumn: '1 / -1' }}>
                                                                        <p>Explore all products in {activeCategory.title}</p>
                                                                        <Link href={`/search?category_id=${activeCategory._id}`} className="sr-empty-btn mt-4" style={{ display: 'inline-block' }} onClick={() => setIsMenuOpen(false)}>Shop Now</Link>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <div className="subcategory-grid">
                                                                {categories.slice(0, 10).map((parent: Category) => (
                                                                    parent.children && parent.children.slice(0, 1).map((sub: Category) => (
                                                                        <div key={sub._id} className="subcategory-group-circular">
                                                                            <Link
                                                                                href={`/search?category_id=${sub._id}`}
                                                                                className="subcategory-circular-link"
                                                                                onClick={() => setIsMenuOpen(false)}
                                                                            >
                                                                                <div className="sub-cat-circle-img">
                                                                                    <img src={getImgUrl(sub.image)} alt={sub.title} onError={(e) => {
                                                                                        (e.target as HTMLImageElement).src = 'https://cdn-icons-png.flaticon.com/512/711/711707.png';
                                                                                    }} />
                                                                                </div>
                                                                                <span className="subcategory-circular-title">{sub.title}</span>
                                                                            </Link>
                                                                        </div>
                                                                    ))
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {(isCompactHeader || isSearchPage || isProductPage) && !isDashboard && (
                        <div className="compact-search-container animated-search">
                            <form className="search-bar unified d-flex align-center compact-search-bar" onSubmit={(e: React.FormEvent) => {
                                e.preventDefault();
                                if (searchKeyword.trim() || activeSearchTab === 'suppliers') {
                                    saveSearch(searchKeyword);
                                    navigate.push(`/search?keyword=${encodeURIComponent(searchKeyword)}&tab=${activeSearchTab}`);
                                    setShowHistory(false);
                                } else {
                                    alert('Please enter a search keyword.');
                                }
                            }}>
                                <input
                                    type="text"
                                    placeholder={activeSearchTab === 'products' ? t('search') + ' ' + t('products') + '...' : t('search') + ' ' + t('suppliers') + '...'}
                                    className="search-input w-100"
                                    value={searchKeyword}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchKeyword(e.target.value)}
                                    onFocus={() => setShowHistory(true)}
                                    onBlur={() => setTimeout(() => setShowHistory(false), 200)}
                                />
                                {showHistory && searchHistory.length > 0 && !searchKeyword && (
                                    <div className="search-history-dropdown">
                                        <div className="search-history-label">Recent Searches</div>
                                        {searchHistory.map((term, i) => (
                                            <div
                                                key={i}
                                                className="search-history-item"
                                                onClick={() => {
                                                    setSearchKeyword(term);
                                                    navigate.push(`/search?keyword=${encodeURIComponent(term)}&tab=${activeSearchTab}`);
                                                    saveSearch(term);
                                                }}
                                            >
                                                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                                <span>{term}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <input
                                    type="file"
                                    id="header-image-search"
                                    style={{ display: 'none' }}
                                    accept="image/*"
                                    onChange={async (e: React.ChangeEvent<HTMLInputElement>) => {
                                        const file = e.target.files ? e.target.files[0] : null;
                                        if (file) {
                                            const formData = new FormData();
                                            formData.append('image', file);
                                            if (typeof window !== 'undefined') {
                                                (window as any).imageSearchFile = file;
                                            }
                                            navigate.push('/search?is_image_search=true');
                                        }
                                    }}
                                />
                                <button
                                    type="button"
                                    className="btn-image-search d-flex align-center gap-1"
                                    onClick={() => document.getElementById('header-image-search')?.click()}
                                >
                                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                </button>
                                <button type="submit" className="btn-search alibaba-style d-flex align-center justify-center" style={{ padding: '0.7rem 1.5rem' }}>
                                    {pathname !== '/categories' && (
                                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                                    )}
                                </button>
                            </form>
                        </div>
                    )}

                    <div className="nav-actions d-flex align-center gap-3">
                        <div
                            className={`action-item location-dropdown-wrapper ${isDeliverToOpen ? 'is-open' : ''}`}
                            ref={deliverToRef}
                        >
                            <div className="location-trigger d-flex align-center gap-1" onClick={() => setIsDeliverToOpen(!isDeliverToOpen)} style={{ cursor: 'pointer' }}>
                                <span className="icon">
                                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25s-7.5-4.108-7.5-11.25a7.5 7.5 0 1115 0z" />
                                    </svg>
                                </span>
                                <span>{t('deliver_to')}: {selectedCountry || user?.country_code || 'IN'}</span>
                                <svg className={`chevron-icon ${isDeliverToOpen ? 'rotate' : ''}`} width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            </div>

                            {isDeliverToOpen && (
                                <div className="location-dropdown-menu">
                                    <div className="location-dropdown-content" style={{ position: 'relative' }}>
                                        <button 
                                            className="btn-reset location-close-btn"
                                            onClick={(e) => { e.stopPropagation(); setIsDeliverToOpen(false); }}
                                            style={{ position: 'absolute', top: '20px', right: '20px', padding: '5px', cursor: 'pointer', color: '#64748b', display: 'flex' }}
                                            title="Close"
                                        >
                                            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                                        </button>
                                        <h4 className="location-title">Specify your location</h4>
                                        <p className="location-subtitle">Shipping options and fees vary based on your location</p>

                                        {user ? (
                                            <div className="user-location-info">
                                                {userAddress && (
                                                    <div className="current-address-card">
                                                        <div className="address-info">
                                                            <strong>{user.first_name} {user.last_name}</strong>
                                                            <p>{userAddress.address}, {userAddress.city}, {userAddress.state}, {userAddress.zip_code}, {userAddress.country}</p>
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="location-links">
                                                    <Link href="/dashboard/shipping" className="location-link" onClick={() => setIsDeliverToOpen(false)}>View more</Link>
                                                    <span className="divider">|</span>
                                                    <Link href="/dashboard/shipping" className="location-link" onClick={() => setIsDeliverToOpen(false)}>Add address</Link>
                                                </div>
                                            </div>
                                        ) : (
                                            <div
                                                className="login-prompt-location"
                                                style={{ cursor: 'pointer' }}
                                                onClick={() => {
                                                    openLogin();
                                                    setIsDeliverToOpen(false);
                                                }}
                                            >
                                                <p>Sign in to see your addresses</p>
                                            </div>
                                        )}

                                        <div className="location-separator">
                                            <span>Or</span>
                                        </div>

                                        <div className="location-form">
                                            <div className="form-group custom-select-wrapper-react">
                                                <div className="select-container-react">
                                                    <Select
                                                        className="country-select-enhanced"
                                                        classNamePrefix="rs-select"
                                                        options={(availableCountries || []).map(c => ({ value: c.code, label: c.name }))}
                                                        value={{
                                                            value: tempCountry,
                                                            label: availableCountries.find(c => c.code === tempCountry)?.name || tempCountry
                                                        }}
                                                        onChange={(option: any) => option && setTempCountry(option.value)}
                                                        placeholder="Select country..."
                                                        isSearchable={true}
                                                        styles={{
                                                            control: (base) => ({
                                                                ...base,
                                                                border: 'none',
                                                                boxShadow: 'none',
                                                                background: 'transparent',
                                                                padding: '0 10px',
                                                                minHeight: '60px',
                                                                fontWeight: '700',
                                                                fontSize: '18px',
                                                                cursor: 'pointer'
                                                            }),
                                                            valueContainer: (base) => ({
                                                                ...base,
                                                                paddingLeft: '50px'
                                                            }),
                                                            option: (base, state) => ({
                                                                ...base,
                                                                fontSize: '14px',
                                                                fontWeight: state.isSelected ? '700' : '500',
                                                                padding: '12px 20px',
                                                                background: state.isFocused ? '#f1f5f9' : (state.isSelected ? 'var(--primary-color)' : 'transparent'),
                                                                color: state.isSelected ? '#fff' : '#1a1a2e',
                                                                cursor: 'pointer'
                                                            })
                                                        }}
                                                    />
                                                    <span className="flag-icon-overlay">
                                                        {tempCountry || 'IN'}
                                                    </span>
                                                </div>
                                            </div>


                                            <button
                                                className="btn-location-save"
                                                onClick={() => {
                                                    setSelectedCountry(tempCountry);
                                                    setIsDeliverToOpen(false);
                                                    // Trigger global page refresh or state update for products
                                                    window.location.reload();
                                                }}
                                            >
                                                Save
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="action-item language d-flex align-center gap-1" style={{ cursor: 'pointer' }} onClick={() => setIsSettingsOpen(!isSettingsOpen)}>
                            <span className="icon">
                                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                                </svg>
                            </span>
                            <span>{language} - {currency}</span>
                            <svg className={`chevron-icon ${isSettingsOpen ? 'rotate' : ''}`} width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </div>
                        <div className="user-utility-actions d-flex align-center gap-4">
                            <div className="action-item notifications-dropdown-wrapper" style={{ position: 'relative' }}>
                                <div className="icon-badge-container">
                                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                                    {user && unreadCount > 0 && <span className="badge">{unreadCount}</span>}
                                </div>
                                <div className="notifications-dropdown">
                                    <div className="dropdown-header p-3 d-flex justify-content-between align-items-center">
                                        <span>Recent Notifications</span>
                                        <button type="button" onClick={(e: React.MouseEvent) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            markAllRead();
                                        }} style={{ color: 'var(--primary-color)' }}>Mark all as read</button>
                                    </div>
                                    <div className="dropdown-list">
                                        {user && notifications.length > 0 ? (
                                            notifications.slice(0, 5).map(n => (
                                                <Link
                                                    key={n._id}
                                                    href={n.link || '#'}
                                                    className={`dropdown-item ${n.isRead ? 'read' : 'unread'}`}
                                                    style={{ display: 'block', padding: '16px 20px', borderBottom: '1px solid #f1f5f9', textDecoration: 'none', transition: 'all 0.2s' }}
                                                    onClick={() => !n.isRead && markAsRead(n._id)}
                                                >
                                                    <div className="item-header-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', alignItems: 'flex-start' }}>
                                                        <div className="item-title" style={{ fontWeight: '700', fontSize: '14px', color: '#1a1a2e', flex: 1, paddingRight: '10px' }}>{n.title}</div>
                                                        {!n.isRead && <div className="unread-dot" style={{ width: '8px', height: '8px', background: 'var(--primary-color)', borderRadius: '50%', flexShrink: 0, marginTop: '5px' }}></div>}
                                                    </div>
                                                    <div className="item-message" style={{ fontSize: '13px', color: '#475569', lineHeight: '1.5', marginBottom: '8px' }}>{n.message}</div>
                                                    <div className="item-time" style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                                                        {new Date(n.createdAt).toLocaleDateString()}
                                                    </div>
                                                </Link>
                                            ))
                                        ) : (
                                            <div className="empty-dropdown" style={{ padding: '40px 20px', textAlign: 'center' }}>
                                                <div style={{ fontSize: '40px', marginBottom: '16px', opacity: 0.5 }}>🔔</div>
                                                <div style={{ color: '#64748b', fontSize: '14px' }}>{user ? 'No new notifications' : 'Sign in to see notifications'}</div>
                                            </div>
                                        )}
                                    </div>
                                    <Link href="/dashboard/notifications" className="view-all-link" style={{ display: 'block', padding: '15px', textAlign: 'center', background: '#f8fafc', color: 'var(--primary-color)', fontSize: '13px', fontWeight: '800', textDecoration: 'none', borderTop: '1px solid #f1f5f9' }}>View All Notifications</Link>
                                </div>
                            </div>

                            <Link href="/dashboard/messages" className="action-item d-none-mobile" title="Messages" style={{ position: 'relative', textDecoration: 'none', display: 'flex', alignItems: 'center' }} onClick={(e) => { if (!user) { e.preventDefault(); openLogin(); } }}>
                                <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
                                {user && (unreadTotal || 0) > 0 && (
                                    <span className="badge-chat" style={{ background: '#ff3b30' }}>
                                        {unreadTotal}
                                    </span>
                                )}
                            </Link>

                            <Link href="/buyer/dashboard/saved" className="action-item d-none-mobile" title="Favorites" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }} onClick={(e) => { if (!user) { e.preventDefault(); openLogin(); } }}>
                                <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
                            </Link>
                        </div>

                        <div className="action-item notifications-dropdown-wrapper cart-dropdown-wrapper" style={{ position: 'relative' }}>
                            <Link href="/cart" className="action-item cart icon-badge-container" style={{ textDecoration: 'none', color: 'inherit' }}>
                                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                                {cartCount > 0 && (
                                    <span className="badge">{cartCount}</span>
                                )}
                            </Link>
                            <div className="notifications-dropdown cart-dropdown">
                                <div className="dropdown-header">
                                    <span>My Cart</span>
                                    <div className="cart-count-pill">{cartCount} items</div>
                                </div>
                                <div className="cart-dropdown-list">
                                    {cartItems && cartItems.length > 0 ? (
                                        cartItems.slice(0, 2).map((item: CartItem, idx: number) => (
                                            <Link key={idx} href="/cart" className="cart-dropdown-item">
                                                <div className="cart-item-img-container">
                                                    <img src={getImgUrl(item.image) || 'https://via.placeholder.com/64'} alt="product" />
                                                </div>
                                                <div className="cart-item-info">
                                                    <div className="cart-item-name">{item.title || item.name}</div>
                                                    <div className="cart-item-meta">
                                                        <span className="cart-item-price-val">{typeof item.price === 'number' ? `$${item.price.toFixed(2)}` : item.price}</span>
                                                        <span className="cart-item-quantity-pill">Qty: {item.quantity || 1}</span>
                                                    </div>
                                                </div>
                                            </Link>
                                        ))
                                    ) : (
                                        <div className="cart-empty-state">
                                            <div className="cart-empty-icon">🛒</div>
                                            <div className="cart-empty-title">Your cart is empty</div>
                                            <div className="cart-empty-msg">Looks like you haven't added anything to your cart yet.</div>
                                        </div>
                                    )}
                                </div>
                                {cartItems && cartItems.length > 0 && (
                                    <div className="cart-dropdown-footer">
                                        <div className="cart-subtotal-row">
                                            <span className="subtotal-label">Subtotal</span>
                                            <span className="subtotal-value">
                                                ${cartItems.reduce((acc: number, item: CartItem) => {
                                                    const price = typeof item.price === 'number' ? item.price : parseFloat(String(item.price).replace(/[^0-9.]/g, ''));
                                                    return acc + (isNaN(price) ? 0 : price * (item.quantity || 1));
                                                }, 0).toFixed(2)}
                                            </span>
                                        </div>
                                        <Link href="/cart" className="btn-cart-checkout">
                                            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                            Checkout Now
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Profile Dropdown */}
                        {user ? (
                            <div className={`user-profile-dropdown-container ${isProfileMenuOpen ? 'is-open' : ''}`} ref={profileDropdownRef}>
                                <div className="user-profile-trigger d-flex align-center gap-2" onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}>
                                    <div className="avatar-wrapper">
                                        {user.profile_image ? (
                                            <img src={getImgUrl(user.profile_image)} alt="Avatar" className="user-avatar-small" />
                                        ) : (
                                            <div className="user-avatar-placeholder">
                                                {user.first_name?.[0]?.toUpperCase() || 'U'}
                                            </div>
                                        )}
                                    </div>
                                    <div className="user-label-content d-none-mobile">
                                        <span className="user-role-label">{currentRole === 'supplier' ? 'Supplier' : (currentRole === 'admin' ? 'Admin' : 'Buyer')}</span>
                                        <span className="user-name-text">{user.first_name}</span>
                                    </div>
                                    <svg className="chevron-icon" width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                </div>

                                <div className={`header-profile-dropdown ${isProfileMenuOpen ? 'show-dropdown' : ''}`}>
                                    <div className="dropdown-header-info">
                                        <div className="info-main">
                                            <p className="full-name">{user.first_name} {user.last_name}</p>
                                            <p className="email">{user.email}</p>
                                        </div>
                                    </div>

                                    <div className="dropdown-divider"></div>

                                    <div className="role-switcher-section">
                                        <p className="section-title">Manage Your Dashboards</p>
                                        <div className="role-grid">
                                            {!(user.roles?.includes('admin') || user.role === 'admin') && (
                                                <>
                                                    <button
                                                        className={`role-choice-card ${currentRole === 'buyer' ? 'active' : ''}`}
                                                        onClick={() => { switchRole('buyer'); setIsProfileMenuOpen(false); }}
                                                    >
                                                        <div className="check-mark"><svg width="12" height="12" fill="none" stroke="white" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg></div>
                                                        <span className="role-name">Buyer</span>
                                                        <span className="role-desc">Purchase products</span>
                                                    </button>

                                                    {(user.roles?.includes('supplier') || user.role === 'supplier') ? (
                                                        <button
                                                            className={`role-choice-card ${currentRole === 'supplier' ? 'active' : ''}`}
                                                            onClick={() => { switchRole('supplier'); setIsProfileMenuOpen(false); }}
                                                        >
                                                            <div className="check-mark"><svg width="12" height="12" fill="none" stroke="white" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg></div>
                                                            <span className="role-name">Supplier</span>
                                                            <span className="role-desc">Sell on marketplace</span>
                                                        </button>
                                                    ) : (
                                                        <Link href="/become-supplier" className="role-choice-card start-selling-card">
                                                            <span className="role-name" style={{ color: '#ff6600' }}>Start Selling</span>
                                                            <span className="role-desc">Become a supplier</span>
                                                        </Link>
                                                    )}
                                                </>
                                            )}

                                            {(user.roles?.includes('admin') || user.role === 'admin') && (
                                                <button
                                                    className={`role-choice-card ${currentRole === 'admin' ? 'active' : ''}`}
                                                    onClick={() => switchRole('admin')}
                                                >
                                                    <div className="check-mark"><svg width="12" height="12" fill="none" stroke="white" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg></div>
                                                    <span className="role-name">Admin</span>
                                                    <span className="role-desc">Manage platform</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="dropdown-divider"></div>

                                    <div className="dropdown-footer-links">
                                        <button onClick={() => { setShowLogoutModal(true); setIsProfileMenuOpen(false); }} className="footer-link btn-reset">
                                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                            Sign Out
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <>
                                <button onClick={openLogin} className="action-item sign-in btn-reset">
                                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                                    {t('sign_in')}
                                </button>
                                <button onClick={openRegister} className="btn-create-account">
                                    {t('create_account')}
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* AI Sourcing Tab Bar - Only on /ai-sourcing */}
                {isAiSourcingPage && (
                    <div className="ai-header-tab-bar">
                        <div className="ai-header-tabs">
                            <Link href="/ai-sourcing" className={`ai-header-tab ${pathname === '/ai-sourcing' ? 'active' : ''}`} style={{ textDecoration: 'none' }}>
                                {t('ai_mode') || 'AI Mode'}
                            </Link>
                            <span className={`ai-header-tab ${activeSearchTab === 'products' && pathname !== '/ai-sourcing' ? 'active' : ''}`} onClick={() => navigate.push('/search?tab=products')}>
                                {t('products') || 'Products'}
                            </span>
                            <span className={`ai-header-tab ${activeSearchTab === 'suppliers' ? 'active' : ''}`} onClick={() => navigate.push('/search?tab=suppliers')}>
                                {t('manufacturers') || 'Manufacturers'}
                            </span>
                            <span className={`ai-header-tab ${activeSearchTab === 'worldwide' ? 'active' : ''}`} onClick={() => navigate.push('/search?tab=worldwide')}>
                                {t('worldwide') || 'Worldwide'}
                            </span>
                        </div>
                    </div>
                )}

                {/* Middle Search Section - Only on Home */}
                {isHome && !isScrolled && (
                    <div className="search-section container">
                        <div className="search-tabs d-flex align-center justify-center gap-4">
                            <Link href="/ai-sourcing" className={`search-tab d-flex align-center gap-1 ${(pathname as string) === '/ai-sourcing' ? 'active' : ''}`} style={{ textDecoration: 'none' }}>{t('ai_mode') || 'AI Mode'} <span className="sparkle">✦</span></Link>
                            <button
                                className={`search-tab ${activeSearchTab === 'products' ? 'active' : ''}`}
                                onClick={() => {
                                    setActiveSearchTab('products');
                                    if (pathname === '/') {
                                        navigate.replace(`/?tab=products`);
                                    }
                                }}
                            >
                                {t('products')}
                            </button>
                            <button
                                className={`search-tab ${activeSearchTab === 'suppliers' ? 'active' : ''}`}
                                onClick={() => {
                                    setActiveSearchTab('suppliers');
                                    if (pathname === '/') {
                                        navigate.replace(`/?tab=suppliers`);
                                    }
                                }}
                            >
                                {t('manufacturers') || 'Manufacturers'}
                            </button>
                            <button
                                className={`search-tab ${activeSearchTab === 'worldwide' ? 'active' : ''}`}
                                onClick={() => {
                                    setActiveSearchTab('worldwide');
                                    if (pathname === '/') {
                                        navigate.replace(`/?tab=worldwide`);
                                    }
                                }}
                            >
                                {t('worldwide')}
                            </button>
                        </div>

                        <div className="search-bar-wrapper">
                            <form className="search-bar d-flex align-center" onSubmit={(e: React.FormEvent) => {
                                e.preventDefault();
                                if (searchKeyword.trim() || activeSearchTab === 'suppliers') {
                                    saveSearch(searchKeyword);
                                    navigate.push(`/search?keyword=${encodeURIComponent(searchKeyword)}&tab=${activeSearchTab}`);
                                    setShowHistory(false);
                                } else {
                                    alert('Please enter a search keyword.');
                                }
                            }}>
                                <input
                                    type="text"
                                    placeholder={activeSearchTab === 'products' ? t('search') + ' ' + t('products') + '...' : t('search') + ' ' + t('suppliers') + '...'}
                                    className="search-input w-100"
                                    value={searchKeyword}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchKeyword(e.target.value)}
                                    onFocus={() => setShowHistory(true)}
                                    onBlur={() => setTimeout(() => setShowHistory(false), 200)}
                                />

                                {showHistory && searchHistory.length > 0 && !searchKeyword && (
                                    <div className="search-history-dropdown">
                                        <div className="search-history-label">Recent Searches</div>
                                        {searchHistory.map((term, i) => (
                                            <div
                                                key={i}
                                                className="search-history-item"
                                                onClick={() => {
                                                    setSearchKeyword(term);
                                                    navigate.push(`/search?keyword=${encodeURIComponent(term)}&tab=${activeSearchTab}`);
                                                    saveSearch(term);
                                                }}
                                            >
                                                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                                <span>{term}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <input
                                    type="file"
                                    id="home-image-search"
                                    style={{ display: 'none' }}
                                    accept="image/*"
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                        const file = e.target.files ? e.target.files[0] : null;
                                        if (file) {
                                            if (typeof window !== 'undefined') {
                                                (window as any).imageSearchFile = file;
                                            }
                                            navigate.push('/search?is_image_search=true');
                                        }
                                    }}
                                />
                                <button
                                    type="button"
                                    className="btn-image-search d-flex align-center gap-1"
                                    onClick={() => document.getElementById('home-image-search')?.click()}
                                >
                                    <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                </button>
                                <button type="submit" className="btn-search dynamic-gradient-style d-flex align-center justify-center gap-2" style={{ padding: '0.7rem 2rem' }}>
                                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                                    <span style={{ fontWeight: '700' }}>{t('search')}</span>
                                </button>
                            </form>
                        </div>
                    </div>
                )}
                {/* Bottom Nav - Restored as per user request */}
                {!isCompactHeader && !isDashboard && (
                    <div className="bottom-nav d-none-mobile">
                        <div className="container d-flex align-center justify-between">
                            <div className="d-flex align-center gap-5">
                                <div
                                    className="nav-item-wrapper all-categories-wrapper"
                                    onMouseEnter={() => (typeof window !== 'undefined' ? window.innerWidth : 768) > 768 && setIsMenuOpen(true)}
                                    onMouseLeave={() => (typeof window !== 'undefined' ? window.innerWidth : 768) > 768 && setIsMenuOpen(false)}
                                >
                                    <button className="nav-link-btn d-flex align-center gap-2 font-medium" style={{ background: 'none', border: 'none', padding: '0', cursor: 'pointer' }}>
                                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                                        <span style={{ fontWeight: '600' }}>{t('all_categories') || 'All categories'}</span>
                                    </button>
                                    {isMenuOpen && (
                                        <div className="mega-menu">
                                            <div className="mega-menu-container d-flex">
                                                <div className="mega-menu-left">
                                                    <ul className="category-list">
                                                        <li
                                                            className={`category-item d-flex align-center gap-2 ${!activeCategory ? 'active' : ''}`}
                                                            onMouseEnter={() => setActiveCategory(null)}
                                                        >
                                                            <div className="cat-icon-wrapper">
                                                                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path></svg>
                                                            </div>
                                                            <span className="cat-title-text">Categories for you</span>
                                                        </li>
                                                        {categories.map(cat => (
                                                            <li
                                                                key={cat._id}
                                                                className={`category-item d-flex align-center gap-2 ${activeCategory?._id === cat._id ? 'active' : ''}`}
                                                                onMouseEnter={() => setActiveCategory(cat)}
                                                                onClick={() => {
                                                                    navigate.push(`/search?category_id=${cat._id}`);
                                                                    setIsMenuOpen(false);
                                                                }}
                                                            >
                                                                <div className="cat-icon-wrapper">
                                                                    <img src={getImgUrl(cat.image)} alt="" className="cat-menu-img" onError={(e) => (e.target as HTMLImageElement).src = 'https://cdn-icons-png.flaticon.com/512/711/711707.png'} />
                                                                </div>
                                                                <span className="cat-title-text">{cat.title}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                                <div className="mega-menu-right">
                                                    <div className="mega-menu-scroll-area">
                                                        <div className="d-flex justify-between align-center mb-4 px-4">
                                                            <h3 className="active-cat-title" style={{ fontSize: '1.2rem', fontWeight: '700' }}>
                                                                {activeCategory ? activeCategory.title : 'Featured Categories'}
                                                            </h3>
                                                            <button
                                                                className="btn-view-all"
                                                                style={{
                                                                    padding: '6px 16px',
                                                                    borderRadius: '20px',
                                                                    border: '1px solid #e2e8f0',
                                                                    background: '#fff',
                                                                    fontSize: '0.85rem',
                                                                    fontWeight: '600',
                                                                    cursor: 'pointer',
                                                                    color: 'var(--primary-color)'
                                                                }}
                                                                onClick={() => {
                                                                    navigate.push(activeCategory ? `/search?category_id=${activeCategory._id}` : '/search');
                                                                    setIsMenuOpen(false);
                                                                }}
                                                            >
                                                                View All
                                                            </button>
                                                        </div>
                                                        <div className="alibaba-cat-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem 1rem', padding: '1rem' }}>
                                                            {activeCategory ? (
                                                                activeCategory.children && activeCategory.children.length > 0 ? (
                                                                    activeCategory.children.map((sub: any) => (
                                                                        <div
                                                                            key={sub._id}
                                                                            className="alibaba-cat-item"
                                                                            onClick={() => {
                                                                                navigate.push(`/search?category_id=${sub._id}`);
                                                                                setIsMenuOpen(false);
                                                                            }}
                                                                        >
                                                                            <div className="alibaba-cat-img-wrapper" style={{ width: '80px', height: '80px' }}>
                                                                                <img
                                                                                    src={getImgUrl(sub.image)}
                                                                                    alt={sub.title}
                                                                                    className="alibaba-cat-img"
                                                                                    onError={(e) => (e.target as HTMLImageElement).src = 'https://cdn-icons-png.flaticon.com/512/711/711707.png'}
                                                                                />
                                                                            </div>
                                                                            <div className="alibaba-cat-name" style={{ fontSize: '0.8rem' }}>{sub.title}</div>
                                                                        </div>
                                                                    ))
                                                                ) : (
                                                                    <div className="p-4 text-center color-gray" style={{ gridColumn: 'span 4' }}>
                                                                        No subcategories found.
                                                                    </div>
                                                                )
                                                            ) : (
                                                                categories.slice(0, 12).map(cat => (
                                                                    <div
                                                                        key={cat._id}
                                                                        className="alibaba-cat-item"
                                                                        onClick={() => {
                                                                            navigate.push(`/search?category_id=${cat._id}`);
                                                                            setIsMenuOpen(false);
                                                                        }}
                                                                    >
                                                                        <div className="alibaba-cat-img-wrapper" style={{ width: '80px', height: '80px' }}>
                                                                            <img
                                                                                src={getImgUrl(cat.image)}
                                                                                alt={cat.title}
                                                                                className="alibaba-cat-img"
                                                                                onError={(e) => (e.target as HTMLImageElement).src = 'https://cdn-icons-png.flaticon.com/512/711/711707.png'}
                                                                            />
                                                                        </div>
                                                                        <div className="alibaba-cat-name" style={{ fontSize: '0.8rem' }}>{cat.title}</div>
                                                                    </div>
                                                                ))
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div
                                    className="nav-item-wrapper featured-selections-wrapper"
                                    onMouseEnter={() => setIsFeaturedMenuOpen(true)}
                                    onMouseLeave={() => { setIsFeaturedMenuOpen(false); }}
                                >
                                    <button className="nav-link-btn font-medium d-flex align-center gap-1" style={{ color: '#1a1a2e', fontWeight: '600', background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem 0', borderBottom: '2px solid transparent' }}>
                                        {t('featured_selections') || 'Featured selections'}
                                        <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ transition: 'transform 0.2s', transform: isFeaturedMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)', marginLeft: '2px' }}><path d="M19 9l-7 7-7-7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                    </button>
                                    {isFeaturedMenuOpen && (
                                        <div className="mega-menu featured-mega cat-list-only">
                                            <div className="mega-menu-container d-flex">
                                                <div className="mega-menu-left full-width">
                                                    <ul className="category-list">
                                                        <li className="category-item d-flex align-center gap-2" onClick={() => { navigate.push('/section/top-deals'); setIsFeaturedMenuOpen(false); }}>
                                                            <div className="cat-icon-wrapper"><svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" /></svg></div>
                                                            <span className="cat-title-text">Top Deals</span>
                                                        </li>
                                                        <li className="category-item d-flex align-center gap-2" onClick={() => { navigate.push('/section/top-ranking'); setIsFeaturedMenuOpen(false); }}>
                                                            <div className="cat-icon-wrapper"><svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg></div>
                                                            <span className="cat-title-text">Top Ranking</span>
                                                        </li>
                                                        <li className="category-item d-flex align-center gap-2" onClick={() => { navigate.push('/section/new-arrivals'); setIsFeaturedMenuOpen(false); }}>
                                                            <div className="cat-icon-wrapper"><svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg></div>
                                                            <span className="cat-title-text">New Arrivals</span>
                                                        </li>
                                                        <li className="category-item d-flex align-center gap-2" onClick={() => { navigate.push('/search?section=Top Deals'); setIsFeaturedMenuOpen(false); }}>
                                                            <div className="cat-icon-wrapper"><svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg></div>
                                                            <span className="cat-title-text">Flash Sale</span>
                                                        </li>
                                                        <li className="category-item d-flex align-center gap-2" onClick={() => { navigate.push('/search?sort_by=ranking'); setIsFeaturedMenuOpen(false); }}>
                                                            <div className="cat-icon-wrapper"><svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg></div>
                                                            <span className="cat-title-text">Best Sellers</span>
                                                        </li>
                                                        <li className="category-item d-flex align-center gap-2" onClick={() => { navigate.push('/search?section=Clearance'); setIsFeaturedMenuOpen(false); }}>
                                                            <div className="cat-icon-wrapper"><svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" /></svg></div>
                                                            <span className="cat-title-text">Clearance</span>
                                                        </li>
                                                        <li className="category-item d-flex align-center gap-2" onClick={() => { navigate.push('/search?trade_assurance=true'); setIsFeaturedMenuOpen(false); }}>
                                                            <div className="cat-icon-wrapper"><svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg></div>
                                                            <span className="cat-title-text">Trade Assurance</span>
                                                        </li>
                                                        <li className="category-item d-flex align-center gap-2" onClick={() => { navigate.push('/search?bulk=true'); setIsFeaturedMenuOpen(false); }}>
                                                            <div className="cat-icon-wrapper"><svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg></div>
                                                            <span className="cat-title-text">Bulk Orders</span>
                                                        </li>
                                                        <li className="category-item d-flex align-center gap-2" onClick={() => { navigate.push('/search?sample_available=true'); setIsFeaturedMenuOpen(false); }}>
                                                            <div className="cat-icon-wrapper"><svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" /></svg></div>
                                                            <span className="cat-title-text">Free Samples</span>
                                                        </li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="d-flex align-center gap-5">
                                <Link
                                    href={(user?.roles?.includes('supplier') || user?.role === 'supplier') ? "/dashboard" : "/become-supplier"}
                                    className="nav-link-btn font-medium"
                                    style={{ color: '#1a1a2e', textDecoration: 'none', fontWeight: '600' }}
                                    onClick={() => {
                                        if (user?.roles?.includes('supplier') || user?.role === 'supplier') {
                                            switchRole('supplier');
                                        }
                                    }}
                                >
                                    {((user?.roles?.includes('supplier') || user?.role === 'supplier') ? (t('seller_dashboard') || 'Seller Dashboard') : (t('start_selling') || 'Start Selling'))}
                                </Link>
                                <Link href="/rfq/post" className="nav-link-btn font-medium" style={{ color: '#1a1a2e', textDecoration: 'none', fontWeight: '800' }}>{t('request_for_quotation') || 'Request for Quotation'}</Link>
                                <div
                                    className="nav-item-wrapper help-center-wrapper"
                                    onMouseEnter={() => setIsHelpCenterOpen(true)}
                                    onMouseLeave={() => setIsHelpCenterOpen(false)}
                                >
                                    <button className="nav-link-btn font-medium d-flex align-center gap-1" style={{ color: '#1a1a2e', fontWeight: '600', background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem 0', borderBottom: '2px solid transparent' }}>
                                        {t('help_center') || 'Help Center'}
                                        <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ transition: 'transform 0.2s', transform: isHelpCenterOpen ? 'rotate(180deg)' : 'rotate(0deg)', marginLeft: '2px' }}><path d="M19 9l-7 7-7-7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                    </button>
                                    {isHelpCenterOpen && (
                                        <div className="mega-menu help-mega cat-list-only">
                                            <div className="mega-menu-container d-flex">
                                                <div className="mega-menu-left full-width">
                                                    <ul className="category-list">
                                                        {staticPages.length > 0 ? (
                                                            staticPages
                                                                .filter(page => {
                                                                    const title = page.title.toLowerCase();
                                                                    return [
                                                                        'for suppliers',
                                                                        'for buyers',
                                                                        'about us',
                                                                        'terms & privacy',
                                                                        'help & support',
                                                                        'disputes & reports'
                                                                    ].some(allowed => title.includes(allowed));
                                                                })
                                                                .map((page) => (
                                                                    <li key={page._id} className="category-item d-flex align-center gap-2" onClick={() => { navigate.push(`/page/${page.slug}`); setIsHelpCenterOpen(false); }}>
                                                                        <span className="cat-title-text">{page.title}</span>
                                                                    </li>
                                                                ))
                                                        ) : (
                                                            <>
                                                                <li className="category-item d-flex align-center gap-2" onClick={() => { navigate.push('/page/for-buyers'); setIsHelpCenterOpen(false); }}>
                                                                    <span className="cat-title-text">For Buyers</span>
                                                                </li>
                                                                <li className="category-item d-flex align-center gap-2" onClick={() => { navigate.push('/page/for-suppliers'); setIsHelpCenterOpen(false); }}>
                                                                    <span className="cat-title-text">For Suppliers</span>
                                                                </li>
                                                            </>
                                                        )}
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {/* Mobile Quick Actions Bar (Home Only) */}
                {isHome && (
                    <div className="mob-quick-actions d-none-desktop" >
                        <div className="mob-qa-card" onClick={() => { setIsCategoriesPortalOpen(true); setActivePortalCategory(null); }}>
                            <div className="mob-qa-card-icon" style={{ background: '#fff0ec' }}>
                                <svg width="20" height="20" fill="none" stroke="#ff6535" viewBox="0 0 24 24" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            </div>
                            Source by<br />category
                        </div>
                        <Link href={user ? "/rfq/post" : "#"} className="mob-qa-card" onClick={(e) => { if (!user) { e.preventDefault(); openLogin(); } }}>
                            <div className="mob-qa-card-icon" style={{ background: '#eef6ff' }}>
                                <svg width="20" height="20" fill="none" stroke="#2563eb" viewBox="0 0 24 24" strokeWidth="2"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            </div>
                            Request for<br />Quotation
                        </Link>
                        <Link
                            href={(user?.roles?.includes('supplier') || user?.role === 'supplier') ? "/dashboard" : "/become-supplier"}
                            className="mob-qa-card"
                            onClick={() => {
                                if (user?.roles?.includes('supplier') || user?.role === 'supplier') {
                                    switchRole('supplier');
                                }
                            }}
                        >
                            <div className="mob-qa-card-icon" style={{ background: '#f5f3ff' }}>
                                <svg width="20" height="20" fill="none" stroke="#8b5cf6" viewBox="0 0 24 24" strokeWidth="2"><path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            </div>
                            {(user?.roles?.includes('supplier') || user?.role === 'supplier') ? 'Seller\nDashboard' : 'Become a\nSupplier'}
                        </Link>
                    </div>
                )}

                {/* Remove redundant bottom tabs on search page as they are now in the top bar */}
                {/* {isSearchPage && (
                <div className="search-page-tabs container d-flex align-center gap-4">
                    <button className="search-page-tab active">Products</button>
                    <button className="search-page-tab">Suppliers</button>
                    <button className="search-page-tab">Worldwide</button>
                </div>
            )} */}
                <SettingsModal
                    isOpen={isSettingsOpen}
                    onClose={() => setIsSettingsOpen(false)}
                />
                <LogoutModal
                    isOpen={showLogoutModal}
                    onClose={() => setShowLogoutModal(false)}
                    onConfirm={() => {
                        logout();
                        setShowLogoutModal(false);
                    }}
                    title="Sign Out"
                    message="Are you sure you want to sign out?"
                />

                {/* Mobile Categories Fullscreen Portal */}
                {isCategoriesPortalOpen && (
                    <div className="categories-portal">
                        <div className="portal-header">
                            <button className="portal-back-btn" onClick={() => setIsCategoriesPortalOpen(false)}>
                                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            <h2 className="portal-title">Categories</h2>
                            <button className="portal-help-btn">
                                <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </button>
                        </div>

                        <div className="portal-main">
                            <div className="portal-sidebar">
                                <div
                                    className={`portal-sidebar-item ${!activePortalCategory ? 'active' : ''}`}
                                    onClick={() => setActivePortalCategory(null)}
                                >
                                    <div className="portal-sidebar-icon-wrap">
                                        <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
                                    </div>
                                    <span className="portal-sidebar-text">For you</span>
                                </div>
                                {categories.map((cat: Category) => (
                                    <div
                                        key={cat._id}
                                        className={`portal-sidebar-item ${activePortalCategory?._id === cat._id ? 'active' : ''}`}
                                        onClick={() => setActivePortalCategory(cat)}
                                    >
                                        <div className="portal-sidebar-icon-wrap">
                                            <img src={getImgUrl(cat.image)} alt="" onError={(e) => (e.target as HTMLImageElement).src = 'https://cdn-icons-png.flaticon.com/512/711/711707.png'} />
                                        </div>
                                        <span className="portal-sidebar-text">{cat.title}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="portal-content">
                                <h3 className="portal-content-title">
                                    {activePortalCategory ? activePortalCategory.title : 'Recommendations'}
                                </h3>

                                <div className="portal-recommendations-grid">
                                    {(activePortalCategory ? (activePortalCategory.subcategories || []) : categories).map((item: Category, i: number) => (
                                        <Link
                                            key={item._id || i}
                                            href={`/search?category_id=${activePortalCategory ? activePortalCategory._id : item._id}`}
                                            className="portal-item-card"
                                            onClick={() => setIsCategoriesPortalOpen(false)}
                                        >
                                            <div className="portal-item-img-wrap">
                                                <img
                                                    src={getImgUrl(item.image)}
                                                    alt={item.title || item.name}
                                                    onError={(e) => (e.target as HTMLImageElement).src = 'https://cdn-icons-png.flaticon.com/512/711/711707.png'}
                                                />
                                            </div>
                                            <span className="portal-item-name">{item.title || item.name || 'Sample Item'}</span>
                                        </Link>
                                    ))}
                                </div>

                                {!activePortalCategory && (
                                    <div className="portal-inspiration">
                                        <h3 className="portal-inspiration-title">Get product inspiration</h3>
                                        <div className="portal-recommendations-grid">
                                            {categories.slice(0, 6).reverse().map((item: Category, i: number) => (
                                                <Link
                                                    key={i}
                                                    href={`/search?category_id=${item._id}`}
                                                    className="portal-item-card"
                                                    onClick={() => setIsCategoriesPortalOpen(false)}
                                                >
                                                    <div className="portal-item-img-wrap">
                                                        <img
                                                            src={getImgUrl(item.image)}
                                                            alt={item.title}
                                                            onError={(e) => (e.target as HTMLImageElement).src = 'https://cdn-icons-png.flaticon.com/512/711/711707.png'}
                                                        />
                                                    </div>
                                                    <span className="portal-item-name">{item.title}</span>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </header>
            {showFixedHeader && <div className="fixed-header-placeholder" style={{ height: '70px' }} />}
        </>
    );
};

export default Header;
