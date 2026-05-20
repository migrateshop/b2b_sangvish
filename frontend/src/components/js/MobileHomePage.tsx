'use client';
import React, { useState, useEffect, useRef, useCallback, Suspense, lazy } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Select from 'react-select';
import api from '@/services/axiosConfig';
import { getImgUrl } from '@/utils/imageConfig';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import { useNotifications } from '@/context/NotificationContext';

import RFQSection from './RFQSection';
import AppPromoSection from './AppPromoSection';
import SupplierHomeLayout from './SupplierHomeLayout';
import Partners from './Partners';
import Worldwide from '@/app/pages/Worldwide';
import AllProducts from './AllProducts';
import AiSourcing from '@/app/pages/AiSourcing';
import SettingsModal from './SettingsModal';
import FeaturedSuppliers from './FeaturedSuppliers';

/* ─── Banner Fallback Slides ─── */
const FALLBACK_SLIDES = [
    {
        id: 1,
        title: 'Global B2B Marketplace',
        subtitle: 'Connect with 40M+ verified suppliers',
        gradFrom: 'var(--primary-color)',
        gradTo: '#1a4a9e',
        accent: '#ff6600',
    },
    {
        id: 2,
        title: 'Factory Price, Zero Middlemen',
        subtitle: 'Source directly from manufacturers',
        gradFrom: '#052e16',
        gradTo: '#065f46',
        accent: '#10b981',
    },
    {
        id: 3,
        title: 'Trade Smarter with AI',
        subtitle: 'AI-powered sourcing & discovery',
        gradFrom: '#1e0a4e',
        gradTo: '#3b0e94',
        accent: '#8b5cf6',
    },
];

const MobileHomePage = () => {
    const navigate = useRouter();
    const { t, convertPrice, user, openLogin, selectedCountry, setSelectedCountry, siteSettings, availableCountries } = useAuth();
    const { unreadTotal } = useChat();
    const { unreadCount } = useNotifications();

    /* ── State ── */
    const [bannerSlides, setBannerSlides] = useState(FALLBACK_SLIDES);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [categories, setCategories] = useState<any[]>([]);
    const [topDeals, setTopDeals] = useState<any[]>([]);
    const [newArrivals, setNewArrivals] = useState<any[]>([]);
    const [topRanking, setTopRanking] = useState<any[]>([]);
    const [industryBlocks, setIndustryBlocks] = useState<any[]>([]);
    const [staticPages, setStaticPages] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const location = usePathname();

    // Read initial tab from URL if present
    const searchParams = useSearchParams();
    const urlTab = searchParams.get('tab') || 'products';
    const [activeSearchTab, setActiveSearchTab] = useState(urlTab);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [popupMenu, setPopupMenu] = useState<string | null>(null); // 'categories' | 'featured' | 'help' | null
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isDeliverToOpen, setIsDeliverToOpen] = useState(false);
    const [tempCountry, setTempCountry] = useState(selectedCountry || '');
    const [cartCount, setCartCount] = useState(0);
    const [expandedCatId, setExpandedCatId] = useState<string | null>(null);

    useEffect(() => {
        setTempCountry(selectedCountry || '');
    }, [selectedCountry]);

    useEffect(() => {
        const updateCart = () => {
            const items = JSON.parse((typeof window !== 'undefined' ? localStorage.getItem('cart') : null) || '[]');
            setCartCount(items.length);
        };
        updateCart();
        window.addEventListener('cartUpdated', updateCart);
        window.addEventListener('storage', updateCart);
        return () => {
            window.removeEventListener('cartUpdated', updateCart);
            window.removeEventListener('storage', updateCart);
        };
    }, []);

    const slideTimer = useRef<any>(null);

    /* ── Quick actions (static nav items) ── */
    const QUICK_ACTIONS = [
        {
            label: t('start_selling') || 'Start Selling',
            link: '/become-supplier',
            icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#222" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18" /><path d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" /><path d="M9 13h1" /><path d="M14 13h1" /><path d="M9 17h1" /><path d="M14 17h1" /><path d="M9 9h1" /><path d="M14 9h1" /></svg>,
            bg: '#f1f5f9'
        },
        {
            label: t('post_rfq') || 'Post RFQ',
            link: '/rfq/post',
            needsAuth: true,
            icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#222" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>,
            bg: '#f1f5f9'
        },
        {
            label: t('top_ranking') || 'Top Ranking',
            link: '/section/top-ranking',
            icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#222" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>,
            bg: '#f1f5f9'
        },
        {
            label: t('ai_sourcing') || 'AI Mode',
            link: '/ai-sourcing',
            icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#222" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></svg>,
            bg: '#f1f5f9'
        },
        {
            label: t('worldwide') || 'Worldwide',
            link: '/?tab=worldwide',
            icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#222" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>,
            bg: '#f1f5f9'
        },
        {
            label: t('suppliers') || 'Suppliers',
            link: '/?tab=suppliers',
            icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#222" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
            bg: '#f1f5f9'
        },
        {
            label: t('cart') || 'Cart',
            link: '/cart',
            icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#222" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg>,
            bg: '#f1f5f9'
        },
        {
            label: t('orders') || 'Orders',
            link: '/buyer/dashboard',
            needsAuth: true,
            icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#222" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="21 7.5 12 12.25 3 7.5 12 2.75 21 7.5" /><polyline points="21 12.5 12 17.25 3 12.5" /><polyline points="21 17.5 12 22.25 3 17.5" /><line x1="12" y1="22.25" x2="12" y2="12.25" /></svg>,
            bg: '#f1f5f9'
        }
    ];

    /* ── Fetch banner slides ── */
    useEffect(() => {
        api.get('/hero-slides').then(res => {
            const data = res.data;
            if (data && data.length > 0) {
                setBannerSlides(data.map(s => ({
                    id: s._id,
                    title: s.title,
                    subtitle: s.subtitle,
                    gradFrom: s.gradFrom || 'var(--primary-color)',
                    gradTo: s.gradTo || '#1a4a9e',
                    accent: s.accent || '#ff6600',
                    ctaLabel: s.cta1_label || 'Shop Now',
                    ctaLink: s.cta1_link || '/search',
                    image: s.image,
                })));
            }
        }).catch(() => { });
    }, []);

    /* ── Fetch categories ── */
    useEffect(() => {
        api.get('/categories').then(res => {
            setCategories((res.data || []).slice(0, 14));
        }).catch(() => { });

        api.get('/cms').then(res => {
            setStaticPages(res.data || []);
        }).catch(() => { });
    }, []);

    /* ── Fetch products ── */
    useEffect(() => {
        const uCountry = selectedCountry || '';
        setLoadingProducts(true);
        Promise.all([
            api.get(`/products?section=Top Deals&limit=8&user_country=${uCountry}&t=${Date.now()}`),
            api.get(`/products?section=New Arrivals&limit=6&user_country=${uCountry}&t=${Date.now()}`),
            api.get(`/products?section=Top Ranking&limit=6&user_country=${uCountry}&t=${Date.now()}`),
        ]).then(([dealsRes, arrivalsRes, rankingRes]) => {
            setTopDeals(dealsRes.data.products || []);
            setNewArrivals(arrivalsRes.data.products || []);
            setTopRanking(rankingRes.data.products || []);
        }).catch(() => { }).finally(() => setLoadingProducts(false));
    }, [selectedCountry]);

    /* ── Fetch industry blocks based on categories ── */
    useEffect(() => {
        if (categories.length === 0) return;
        const uCountry = selectedCountry || '';
        const GRADIENTS = [
            { from: 'var(--primary-color)', to: '#1a6bff' },
            { from: '#7e22ce', to: '#a855f7' },
            { from: '#9a3412', to: '#f97316' },
            { from: '#065f46', to: '#10b981' },
        ];
        const topCats = categories.slice(0, 4);
        Promise.all(
            topCats.map((cat, i) =>
                api.get(`/products?category_id=${cat._id}&limit=4&user_country=${uCountry}&t=${Date.now()}`)
                    .then(res => ({
                        category: cat,
                        products: res.data.products || [],
                        gradient: GRADIENTS[i % GRADIENTS.length],
                    }))
                    .catch(() => ({ category: cat, products: [], gradient: GRADIENTS[i % GRADIENTS.length] }))
            )
        ).then(results => {
            setIndustryBlocks(results.filter(r => r.products.length > 0));
        }).catch(() => { });
    }, [categories, selectedCountry]);

    useEffect(() => {
        // Keep active tab in sync with URL
        const paramsTab = new URLSearchParams(searchParams?.toString()).get('tab');
        if (paramsTab && paramsTab !== activeSearchTab) {
            setActiveSearchTab(paramsTab);
        }
    }, [searchParams?.toString()]);

    /* ── Banner auto-advance ── */
    const startTimer = useCallback(() => {
        clearInterval(slideTimer.current);
        if (bannerSlides.length > 1) {
            slideTimer.current = setInterval(() => {
                setCurrentSlide(s => (s + 1) % bannerSlides.length);
            }, 4000);
        }
    }, [bannerSlides.length]);

    useEffect(() => {
        startTimer();
        return () => clearInterval(slideTimer.current);
    }, [startTimer]);

    const goToSlide = (i) => {
        setCurrentSlide(i);
        startTimer();
    };

    // Synchronize activeSearchTab with URL parameter so navigation back/forward works
    const tabParam = new URLSearchParams(searchParams?.toString()).get('tab');
    useEffect(() => {
        if (tabParam === 'products' || tabParam === 'suppliers' || tabParam === 'worldwide') {
            setActiveSearchTab(tabParam);
        } else if (location === '/ai-sourcing') {
            setActiveSearchTab('ai');
        } else {
            setActiveSearchTab('products');
        }
    }, [tabParam, location]);

    const handleSearch = (e) => {
        e.preventDefault();
        const kw = encodeURIComponent(searchQuery.trim());
        if (activeSearchTab === 'ai') {
            navigate.push(`/ai-sourcing${kw ? `?q=${kw}` : ''}`);
        } else if (activeSearchTab === 'worldwide') {
            navigate.push(`/?tab=worldwide`);
        } else if (searchQuery.trim() || activeSearchTab === 'suppliers') {
            navigate.push(`/search?keyword=${kw}&tab=${activeSearchTab}`);
        }
    };

    const handleQuickAction = (item, e) => {
        if (item.needsAuth && !user) {
            e.preventDefault();
            openLogin();
        }
    };

    const cur = bannerSlides[currentSlide] || bannerSlides[0];

    /* ─── MobileProductCard ─── */
    const MobileProductCard = ({ product, size = 'normal' }) => (
        <Link
            href={`/product/${product.slug || product._id}`}
            className={`mph-product-card ${size === 'small' ? 'mph-product-card--small' : ''}`}
        >
            <div className="mph-product-img-wrap">
                <img
                    src={getImgUrl(product.images?.[0] || product.main_image)}
                    alt={product.name}
                    loading="lazy"
                    onError={e => e.target.src = 'https://placehold.co/200'}
                />
            </div>
            <div className="mph-product-info">
                <p className="mph-product-name">{product.name}</p>
                <span className="mph-product-price">
                    {convertPrice(product.main_price || product.price_tiers?.[0]?.price || 0).formatted}
                </span>
                <span className="mph-product-moq">MOQ: {product.moq || 1}</span>
            </div>
        </Link>
    );

    /* ─── Section Header ─── */
    const SectionHeader = ({ title, subtitle, viewAllLink, onViewAll }) => (
        <div className="mph-section-header">
            <div className="mph-section-header-left">
                <h2 className="mph-section-title">{title}</h2>
                {subtitle && <p className="mph-section-subtitle">{subtitle}</p>}
            </div>
            {(viewAllLink || onViewAll) && (
                <button
                    className="mph-view-all-btn"
                    onClick={() => onViewAll ? onViewAll() : navigate.push(viewAllLink)}
                >
                    View All <span>›</span>
                </button>
            )}
        </div>
    );

    /* ─── Skeleton Loader ─── */
    const ProductSkeleton = ({ count = 4, cols = 2 }) => (
        <div className={`mph-skeleton-grid mph-skeleton-grid--${cols}col`}>
            {Array(count).fill(0).map((_, i) => (
                <div key={i} className="mph-skeleton-card">
                    <div className="mph-skeleton-img" />
                    <div className="mph-skeleton-text" />
                    <div className="mph-skeleton-text mph-skeleton-text--short" />
                </div>
            ))}
        </div>
    );

    return (
        <div className="mobile-home-page">

            {/* ═══════════════════════════
                SEARCH BAR & TABS
            ═══════════════════════════ */}
            <div className="mph-search-bar-wrap" style={{ marginTop: '54px' }}>
                {/* Location Selection Dropdown Banner */}
                {isDeliverToOpen && (
                    <div className="mph-location-dropdown">
                        <div className="mph-location-dropdown-header">
                            <h4>Select Delivery Location</h4>
                            <button onClick={() => setIsDeliverToOpen(false)}>✕</button>
                        </div>
                        <div className="mph-location-dropdown-body">
                            <Select
                                value={(availableCountries || []).find((c: any) => c.code === tempCountry || c.name === tempCountry)}
                                onChange={(opt: any) => {
                                    setTempCountry(opt ? opt.name : '');
                                }}
                                options={availableCountries || [
                                    { code: 'US', name: 'United States' },
                                    { code: 'GB', name: 'United Kingdom' },
                                    { code: 'CA', name: 'Canada' },
                                    { code: 'AU', name: 'Australia' },
                                    { code: 'DE', name: 'Germany' },
                                    { code: 'FR', name: 'France' },
                                    { code: 'CN', name: 'China' },
                                    { code: 'IN', name: 'India' },
                                ]}
                                getOptionLabel={(opt: any) => opt.name}
                                getOptionValue={(opt: any) => opt.code}
                                placeholder="Search country..."
                                className="mph-country-select"
                                classNamePrefix="react-select"
                            />
                            <button
                                className="mph-location-save-btn"
                                onClick={() => {
                                    if (setSelectedCountry) setSelectedCountry(tempCountry);
                                    setIsDeliverToOpen(false);
                                }}
                            >
                                Save Location
                            </button>
                        </div>
                    </div>
                )}

                {/* ─── Tabs ─── */}
                <div className="mph-search-tabs">
                    <Link
                        href="/ai-sourcing"
                        className={`mph-search-tab mph-search-tab--ai ${activeSearchTab === 'ai' ? 'active' : ''}`}
                        style={{ textDecoration: 'none' }}
                    >
                        AI Mode <span className="mph-sparkle">✦</span>
                    </Link>
                    <button
                        className={`mph-search-tab ${activeSearchTab === 'products' ? 'active' : ''}`}
                        onClick={() => navigate.replace(`/?tab=products`)}
                    >
                        {t('products') || 'Products'}
                    </button>
                    <button
                        className={`mph-search-tab ${activeSearchTab === 'suppliers' ? 'active' : ''}`}
                        onClick={() => navigate.replace(`/?tab=suppliers`)}
                    >
                        {t('manufacturers') || 'Manufacturers'}
                    </button>
                    <button
                        className={`mph-search-tab ${activeSearchTab === 'worldwide' ? 'active' : ''}`}
                        onClick={() => navigate.replace(`/?tab=worldwide`)}
                    >
                        {t('worldwide') || 'Worldwide'}
                    </button>
                </div>

                <form className="mph-search-form" onSubmit={handleSearch}>
                    <div className="mph-search-input-wrap">
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="mph-search-icon-left">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            className="mph-search-input"
                            placeholder={activeSearchTab === 'products' ? (t('search') + ' ' + (t('products') || 'Products') + '...') : (t('search') + ' ' + (t('suppliers') || 'Suppliers') + '...')}
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                        <input
                            type="file"
                            id="mph-mobile-image-search"
                            style={{ display: 'none' }}
                            accept="image/*"
                            onChange={(e) => {
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
                            className="mph-btn-image-search"
                            onClick={() => document.getElementById('mph-mobile-image-search')?.click()}
                        >
                            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
                            </svg>
                        </button>
                    </div>
                    <button type="submit" className="mph-search-submit">
                        {t('search') || 'Search'}
                    </button>
                </form>
            </div>

            {/* ═══════════════════════════
                SECONDARY NAV BAR (Scrolling)
            ═══════════════════════════ */}
            <div className="mph-secondary-nav">
                <button className="mph-sec-nav-item" onClick={() => setPopupMenu('categories')} style={{ background: 'none', border: 'none' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="3" y1="12" x2="21" y2="12"></line>
                        <line x1="3" y1="6" x2="21" y2="6"></line>
                        <line x1="3" y1="18" x2="21" y2="18"></line>
                    </svg>
                    All categories
                </button>
                <button className="mph-sec-nav-item" onClick={() => setPopupMenu('featured')} style={{ background: 'none', border: 'none' }}>
                    Featured selections
                </button>
                <Link href="/become-supplier" className="mph-sec-nav-item">
                    Start Selling
                </Link>
                <Link href="/rfq/post" className="mph-sec-nav-item">
                    Request for Quotation
                </Link>
                <button className="mph-sec-nav-item" onClick={() => setPopupMenu('help')} style={{ background: 'none', border: 'none' }}>
                    Help Center
                </button>
            </div>

            {/* ═══════════════════════════
                CONDITIONAL BODY FOR TABS
            ═══════════════════════════ */}
            {activeSearchTab === 'ai' ? (
                <div style={{ position: 'relative', minHeight: '80vh' }}>
                    <AiSourcing />
                </div>
            ) : activeSearchTab === 'suppliers' ? (
                <>
                    <SupplierHomeLayout />
                    <Partners />
                </>
            ) : activeSearchTab === 'worldwide' ? (
                <div style={{ marginTop: '10px' }}>
                    <Worldwide />
                    <AllProducts forceWorldwide={true} />
                </div>
            ) : (
                <>
                    {/* ═══════════════════════════
                    HERO BANNER CAROUSEL
                ═══════════════════════════ */}
                    <div className="mph-banner-wrap">
                        <div
                            className="mph-banner-track"
                            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                        >
                            {bannerSlides.map((slide, i) => (
                                <div
                                    key={slide.id || i}
                                    className="mph-banner-slide"
                                    style={{
                                        background: `linear-gradient(135deg, ${slide.gradFrom || 'var(--primary-color)'}, ${slide.gradTo || '#1a4a9e'})`,
                                    }}
                                >
                                    {slide.image && (
                                        <img
                                            src={getImgUrl(slide.image)}
                                            alt={slide.title}
                                            className="mph-banner-bg-img"
                                        />
                                    )}
                                    <div className="mph-banner-overlay" />
                                    <div className="mph-banner-content">
                                        <h1 className="mph-banner-title">{slide.title}</h1>
                                        <p className="mph-banner-subtitle">{slide.subtitle}</p>
                                        <Link
                                            href={slide.ctaLink || '/search'}
                                            className="mph-banner-cta"
                                            style={{ background: slide.accent || '#ff6600' }}
                                        >
                                            {slide.ctaLabel || t('shop_now') || 'Shop Now'}
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {/* Dots */}
                        {bannerSlides.length > 1 && (
                            <div className="mph-banner-dots">
                                {bannerSlides.map((_, i) => (
                                    <button
                                        key={i}
                                        className={`mph-banner-dot ${i === currentSlide ? 'active' : ''}`}
                                        onClick={() => goToSlide(i)}
                                        aria-label={`Slide ${i + 1}`}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ═══════════════════════════
                    QUICK ACTIONS GRID
                ═══════════════════════════ */}
                    <div className="mph-quick-actions-wrap">
                        <div className="mph-quick-actions-grid" style={{ justifyContent: 'center' }}>
                            {QUICK_ACTIONS.map((item, i) => (
                                <Link
                                    key={i}
                                    href={item.link}
                                    className="mph-quick-action-item"
                                    onClick={e => handleQuickAction(item, e)}
                                >
                                    <div className="mph-quick-action-icon" style={{ background: item.bg }}>{item.icon}</div>
                                    <span className="mph-quick-action-label" style={{ color: '#222' }}>{item.label}</span>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* ═══════════════════════════
                    CATEGORIES SCROLL ROW
                ═══════════════════════════ */}
                    {categories.length > 0 && (
                        <div className="mph-section-card">
                            <SectionHeader
                                title={t('browse_categories') || 'Categories'}
                                viewAllLink="/categories"
                            />
                            <div className="mph-categories-scroll">
                                {categories.map(cat => (
                                    <Link
                                        key={cat._id}
                                        href={`/search?category_id=${cat._id}`}
                                        className="mph-category-pill"
                                    >
                                        <div className="mph-category-img-wrap">
                                            <img
                                                src={getImgUrl(cat.image)}
                                                alt={cat.title}
                                                loading="lazy"
                                                onError={e => e.target.src = 'https://cdn-icons-png.flaticon.com/512/711/711707.png'}
                                            />
                                        </div>
                                        <span className="mph-category-name">{cat.title}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ═══════════════════════════
                    TOP DEALS — 2×4 grid
                ═══════════════════════════ */}
                    <div className="mph-section-card mph-section-card--deals">
                        <SectionHeader
                            title={t('top_deals') || '🔥 Top Deals'}
                            subtitle="Lowest prices, updated daily"
                            onViewAll={() => navigate.push('/section/top-deals')}
                        />
                        {loadingProducts ? (
                            <ProductSkeleton count={6} cols={3} />
                        ) : topDeals.length > 0 ? (
                            <div className="mph-products-grid mph-products-grid--3col">
                                {topDeals.slice(0, 6).map((product, idx) => (
                                    <div key={product._id} className="mph-product-card-wrap">
                                        {idx === 0 && <div className="mph-hot-badge">HOT</div>}
                                        <MobileProductCard product={product} />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="mph-empty-state">No products available</div>
                        )}
                    </div>

                    {/* ═══════════════════════════
                    PROMO BANNER — RFQ
                ═══════════════════════════ */}
                    <div className="mph-promo-banner" onClick={() => user ? navigate.push('/rfq/post') : openLogin()}>
                        <div className="mph-promo-banner-content">
                            <div className="mph-promo-icon">📋</div>
                            <div className="mph-promo-text">
                                <h3>{t('post_rfq') || 'Post an RFQ'}</h3>
                                <p>Get quotes from 200K+ verified suppliers in 24hrs</p>
                            </div>
                        </div>
                        <div className="mph-promo-arrow">›</div>
                    </div>

                    {/* ═══════════════════════════
                    NEW ARRIVALS — 2-col grid
                ═══════════════════════════ */}
                    <div className="mph-section-card">
                        <SectionHeader
                            title={t('new_arrivals') || '✨ New Arrivals'}
                            subtitle="Freshly sourced inventory"
                            onViewAll={() => navigate.push('/section/new-arrivals')}
                        />
                        {loadingProducts ? (
                            <ProductSkeleton count={4} cols={2} />
                        ) : newArrivals.length > 0 ? (
                            <div className="mph-products-grid mph-products-grid--2col">
                                {newArrivals.slice(0, 4).map(product => (
                                    <MobileProductCard key={product._id} product={product} />
                                ))}
                            </div>
                        ) : (
                            <div className="mph-empty-state">No products available</div>
                        )}
                    </div>

                    {/* ═══════════════════════════
                    TOP RANKING — horizontal scroll
                ═══════════════════════════ */}
                    <div className="mph-section-card">
                        <SectionHeader
                            title={t('top_ranking') || '⭐ Top Ranking'}
                            subtitle="Market leaders by volume"
                            onViewAll={() => navigate.push('/section/top-ranking')}
                        />
                        {loadingProducts ? (
                            <div className="mph-horizontal-scroll">
                                {Array(5).fill(0).map((_, i) => (
                                    <div key={i} className="mph-skeleton-card mph-skeleton-card--compact" />
                                ))}
                            </div>
                        ) : topRanking.length > 0 ? (
                            <div className="mph-horizontal-scroll">
                                {topRanking.map(product => (
                                    <Link
                                        key={product._id}
                                        href={`/product/${product.slug || product._id}`}
                                        className="mph-ranking-card"
                                    >
                                        <div className="mph-ranking-img-wrap">
                                            <img
                                                src={getImgUrl(product.images?.[0] || product.main_image)}
                                                alt={product.name}
                                                loading="lazy"
                                                onError={e => e.target.src = 'https://placehold.co/200'}
                                            />
                                        </div>
                                        <p className="mph-ranking-name">{product.name}</p>
                                        <span className="mph-ranking-price">
                                            {convertPrice(product.main_price || product.price_tiers?.[0]?.price || 0).formatted}
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="mph-empty-state">No products available</div>
                        )}
                    </div>

                    {/* ═══════════════════════════
                        FEATURED SUPPLIERS
                    ═══════════════════════════ */}
                    <FeaturedSuppliers />

                    {/* ═══════════════════════════
                    INDUSTRY BLOCKS
                ═══════════════════════════ */}
                    {industryBlocks.map((block, idx) => (
                        <div key={idx} className="mph-section-card mph-industry-block">
                            {/* Coloured header banner */}
                            <div
                                className="mph-industry-banner"
                                style={{
                                    background: `linear-gradient(135deg, ${block.gradient.from}, ${block.gradient.to})`
                                }}
                            >
                                <div className="mph-industry-banner-content">
                                    <div className="mph-industry-cat-img">
                                        <img
                                            src={getImgUrl(block.category.image)}
                                            alt={block.category.title}
                                            onError={e => e.target.src = 'https://cdn-icons-png.flaticon.com/512/711/711707.png'}
                                        />
                                    </div>
                                    <div>
                                        <h3 className="mph-industry-title">{block.category.title}</h3>
                                        <p className="mph-industry-count">{block.products.length}+ products</p>
                                    </div>
                                </div>
                                <Link
                                    href={`/search?category_id=${block.category._id}`}
                                    className="mph-industry-view-all"
                                >
                                    View All →
                                </Link>
                            </div>
                            {/* Product 2x2 grid */}
                            <div className="mph-products-grid mph-products-grid--2col mph-products-grid--no-border">
                                {block.products.slice(0, 4).map(product => (
                                    <MobileProductCard key={product._id} product={product} size="small" />
                                ))}
                            </div>
                        </div>
                    ))}

                    {/* ═══════════════════════════
                    AI SOURCING PROMO
                ═══════════════════════════ */}
                    <div className="mph-ai-promo-banner" onClick={() => navigate.push('/ai-sourcing')}>
                        <div className="mph-ai-promo-content">
                            <div className="mph-ai-promo-icon">🤖</div>
                            <div>
                                <h3 className="mph-ai-promo-title">{t('ai_sourcing') || 'AI Sourcing'}</h3>
                                <p className="mph-ai-promo-desc">Find the best products instantly with AI</p>
                            </div>
                        </div>
                        <div className="mph-ai-promo-cta">Try Now ›</div>
                    </div>
                </>
            )}

            {/* ═══════════════════════════
                DESKTOP-EQUIVALENT SECTIONS (RFQ & Mobile App)
            ═══════════════════════════ */}
            {activeSearchTab !== 'ai' && (
                <div className="mph-desktop-section-wrapper">
                    <RFQSection />
                    <AppPromoSection />
                </div>
            )}

            {/* Bottom spacing for mobile nav */}
            {activeSearchTab !== 'ai' && <div style={{ height: '72px' }} />}

            {/* ═══════════════════════════
                POPUP MENUS (Bottom Sheet)
            ═══════════════════════════ */}
            {popupMenu && (
                <>
                    <div className="mph-popup-overlay" onClick={() => setPopupMenu(null)}></div>
                    <div className="mph-popup-sheet">
                        <div className="mph-popup-header">
                            <h3>
                                {popupMenu === 'categories' && 'All Categories'}
                                {popupMenu === 'featured' && 'Featured Selections'}
                                {popupMenu === 'help' && 'Help Center'}
                            </h3>
                            <button className="mph-popup-close" onClick={() => setPopupMenu(null)}>✕</button>
                        </div>
                        <div className="mph-popup-body">
                            {popupMenu === 'categories' && (
                                <ul className="mph-popup-list">
                                    {categories.map(c => (
                                        <React.Fragment key={c._id}>
                                            <li onClick={() => setExpandedCatId(expandedCatId === c._id ? null : c._id)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                                    <img src={getImgUrl(c.image)} alt="" style={{ width: 24, height: 24, marginRight: 12, objectFit: 'contain' }} onError={(e: any) => { e.target.src = 'https://cdn-icons-png.flaticon.com/512/711/711707.png' }} />
                                                    {c.title}
                                                </div>
                                                <span style={{ transform: expandedCatId === c._id ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
                                            </li>
                                            {expandedCatId === c._id && (
                                                <div className="mph-subcategories-container" style={{ background: '#f8fafc', padding: '8px 16px' }}>
                                                    <div onClick={() => { setPopupMenu(null); navigate.push(`/search?category_id=${c._id}`); }} style={{ padding: '10px 16px', fontWeight: 'bold', color: 'var(--primary-color)', cursor: 'pointer', borderBottom: '1px solid #e2e8f0' }}>
                                                        View All in {c.title} →
                                                    </div>
                                                    {(c.children || c.subcategories || []).map((sub: any) => (
                                                        <div key={sub._id} onClick={() => { setPopupMenu(null); navigate.push(`/search?category_id=${sub._id}`); }} style={{ padding: '10px 16px', fontSize: '14px', color: '#334155', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}>
                                                            {sub.title}
                                                        </div>
                                                    ))}
                                                    {(c.children || c.subcategories || []).length === 0 && (
                                                        <div style={{ padding: '10px 16px', fontSize: '13px', color: '#94a3b8' }}>No subcategories found.</div>
                                                    )}
                                                </div>
                                            )}
                                        </React.Fragment>
                                    ))}
                                    <li onClick={() => { setPopupMenu(null); navigate.push('/categories'); }} style={{ color: 'var(--clr-primary)', fontWeight: 'bold' }}>
                                        View All Categories →
                                    </li>
                                </ul>
                            )}
                            {popupMenu === 'featured' && (
                                <ul className="mph-popup-list">
                                    <li onClick={() => { setPopupMenu(null); navigate.push('/section/top-deals'); }}>🔥 Top Deals</li>
                                    <li onClick={() => { setPopupMenu(null); navigate.push('/section/new-arrivals'); }}>✨ New Arrivals</li>
                                    <li onClick={() => { setPopupMenu(null); navigate.push('/section/top-ranking'); }}>⭐ Top Ranking</li>
                                    <li onClick={() => { setPopupMenu(null); navigate.push('/search?section=Top Deals'); }}>⚡ Flash Sale</li>
                                    <li onClick={() => { setPopupMenu(null); navigate.push('/search?sort_by=ranking'); }}>💎 Best Sellers</li>
                                    <li onClick={() => { setPopupMenu(null); navigate.push('/search?section=Clearance'); }}>🏷️ Clearance</li>
                                    <li onClick={() => { setPopupMenu(null); navigate.push('/search?trade_assurance=true'); }}>🛡️ Trade Assurance</li>
                                    <li onClick={() => { setPopupMenu(null); navigate.push('/search?bulk=true'); }}>📦 Bulk Orders</li>
                                    <li onClick={() => { setPopupMenu(null); navigate.push('/search?sample_available=true'); }}>🎁 Free Samples</li>
                                </ul>
                            )}
                            {popupMenu === 'help' && (
                                <ul className="mph-popup-list">
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
                                                <li key={page._id} onClick={() => { setPopupMenu(null); navigate.push(`/page/${page.slug}`); }}>
                                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                                        {page.title}
                                                    </div>
                                                </li>
                                            ))
                                    ) : (
                                        <>
                                            <li onClick={() => { setPopupMenu(null); navigate.push('/page/for-buyers'); }}>For Buyers</li>
                                            <li onClick={() => { setPopupMenu(null); navigate.push('/page/for-suppliers'); }}>For Suppliers</li>
                                            <li onClick={() => { setPopupMenu(null); navigate.push('/page/about-us'); }}>About Us</li>
                                        </>
                                    )}
                                </ul>
                            )}
                        </div>
                    </div>
                </>
            )}

            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        </div>
    );
};

export default MobileHomePage;
