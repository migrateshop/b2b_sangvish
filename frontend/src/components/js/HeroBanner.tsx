import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/services/axiosConfig';
import { getImgUrl } from '@/utils/imageConfig';
import { useAuth } from '@/context/AuthContext';

interface SlideCta {
    label: string;
    link: string;
    needsAuth?: boolean;
}

interface Slide {
    id: string | number;
    tag: string;
    title: string;
    subtitle: string;
    cta1: SlideCta;
    cta2: SlideCta;
    accent: string;
    gradFrom: string;
    gradMid: string;
    gradTo: string;
    shape1: string;
    shape2: string;
    statLabel: string;
    image?: string;
}

interface Category {
    _id: string;
    title: string;
    image: string;
    children?: Category[];
}

const HeroBanner = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [activeCategory, setActiveCategory] = useState<Category | null>(null);
    const [megaOpen, setMegaOpen] = useState(false);
    const [slide, setSlide] = useState(0);
    const [animating, setAnimating] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const { t, user, openLogin, switchRole } = useAuth();
    const navigate = useRouter();

    const isSupplier = user?.roles?.includes('supplier') || user?.role === 'supplier';

    const FALLBACK_SLIDES: Slide[] = [
        {
            id: 1,
            tag: t('trusted_by_countries') || 'Trusted by 190+ Countries',
            title: t('hero_slide1_title') || 'Global B2B\nMarketplace',
            subtitle: t('hero_slide1_subtitle') || 'Connect with 40M+ products from verified suppliers worldwide and grow your business faster.',
            cta1: { label: t('get_quotes_now') || 'Get Quotes Now', link: '/rfq/post', needsAuth: true },
            cta2: { 
                label: isSupplier ? 'Seller Dashboard' : (t('start_selling') || 'Start Selling'), 
                link: isSupplier ? '/dashboard' : '/become-supplier' 
            },
            accent: '#ff6600',
            gradFrom: '#0a1f4e',
            gradMid: '#2563eb',
            gradTo: '#14408a',
            shape1: '#3b82f6',
            shape2: '#ff6600',
            statLabel: t('hero_stat_products') || '40M+ Products',
        },
        {
            id: 2,
            tag: t('verified_suppliers') || '100% Verified Suppliers',
            title: t('hero_slide2_title') || 'Factory Price,\nZero Middlemen',
            subtitle: t('hero_slide2_subtitle') || 'Source directly from manufacturers. No intermediaries, no markups — pure savings at scale.',
            cta1: { label: t('browse_products') || 'Browse Products', link: '/search' },
            cta2: { label: t('find_suppliers') || 'Find Suppliers', link: '/search?tab=suppliers' },
            accent: '#10b981',
            gradFrom: '#052e16',
            gradMid: '#065f46',
            gradTo: '#047857',
            shape1: '#059669',
            shape2: '#34d399',
            statLabel: t('hero_stat_suppliers') || '200K+ Suppliers',
        },
        {
            id: 3,
            tag: t('ai_powered_search') || 'AI-Powered Search',
            title: t('hero_slide3_title') || 'Trade Smarter\nwith AI',
            subtitle: t('hero_slide3_subtitle') || 'Use cutting-edge AI to find the best products, compare prices, and make data-driven sourcing decisions.',
            cta1: { label: t('try_ai_sourcing') || 'Try AI Sourcing', link: '/ai-sourcing' },
            cta2: { label: t('learn_more') || 'Learn More', link: '/section/top-ranking' },
            accent: '#8b5cf6',
            gradFrom: '#1e0a4e',
            gradMid: '#3b0e94',
            gradTo: '#4c1d95',
            shape1: '#7c3aed',
            shape2: '#c4b5fd',
            statLabel: t('hero_stat_instant') || 'Instant Results',
        },
    ];

    const DYNAMIC_SIDE_LINKS = [
        {
            icon: <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
            title: isSupplier ? (t('seller_dashboard') || 'Seller Dashboard') : (t('start_selling') || 'Start Selling'), 
            sub: isSupplier ? (t('manage_your_shop') || 'Manage your shop') : (t('reach_global_buyers') || 'Reach global buyers'), 
            link: isSupplier ? '/dashboard' : '/become-supplier', 
            cls: 'side-orange'
        },
        {
            icon: <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
            title: t('post_rfq') || 'Post RFQ', sub: t('get_multiple_quotes') || 'Get multiple quotes', link: '/rfq/post', cls: 'side-blue', needsAuth: true
        },
        {
            icon: <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>,
            title: t('top_ranking') || 'Top Ranking', sub: t('best_sellers_today') || 'Best sellers today', link: '/section/top-ranking', cls: 'side-gold'
        },
        {
            icon: <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
            title: t('ai_sourcing') || 'AI Sourcing', sub: t('smart_discovery') || 'Smart discovery', link: '/ai-sourcing', cls: 'side-purple'
        },
    ];

    const DYNAMIC_STATS = [
        { num: '40M+', label: t('products') || 'Products' },
        { num: '200K+', label: t('suppliers') || 'Suppliers' },
        { num: '190+', label: t('countries') || 'Countries' },
        { num: '24hr', label: t('response') || 'Response' },
    ];

    const [slidesData, setSlidesData] = useState<Slide[]>(FALLBACK_SLIDES);
    const [loadingSlides, setLoadingSlides] = useState(true);

    /* fetch generic data */
    useEffect(() => {
        Promise.all([
            api.get('/categories'),
            api.get('/hero-slides')
        ]).then(([catRes, slideRes]) => {
            const cData = catRes.data;
            setCategories(cData);
            if (cData[0]) setActiveCategory(cData[0]);

            const sData = slideRes.data;
            if (sData && sData.length > 0) {
                // Map backend schema to frontend format
                const mapped: Slide[] = sData.map((s: any) => ({
                    id: s._id,
                    tag: s.tag,
                    title: s.title,
                    subtitle: s.subtitle,
                    cta1: { label: s.cta1_label, link: s.cta1_link, needsAuth: s.cta1_needsAuth },
                    cta2: { 
                        label: (isSupplier && s.cta2_link === '/become-supplier') ? 'Seller Dashboard' : s.cta2_label, 
                        link: (isSupplier && s.cta2_link === '/become-supplier') ? '/dashboard' : s.cta2_link 
                    },
                    accent: s.accent, gradFrom: s.gradFrom, gradMid: s.gradMid, gradTo: s.gradTo,
                    shape1: s.shape1, shape2: s.shape2, statLabel: s.statLabel,
                    image: s.image
                }));
                setSlidesData(mapped);
            }
        }).catch(err => console.error('Error fetching hero data:', err))
            .finally(() => setLoadingSlides(false));
    }, []);

    /* auto-advance slides */
    const startTimer = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setSlide(s => (s + 1) % slidesData.length);
        }, 5500);
    }, [slidesData.length]);

    useEffect(() => {
        if (!loadingSlides) startTimer();
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [startTimer, loadingSlides]);

    const goTo = useCallback((indexOrFn: number | ((prev: number) => number)) => {
        if (animating) return;
        setAnimating(true);
        setSlide(indexOrFn);
        setTimeout(() => setAnimating(false), 600);
        startTimer();
    }, [animating, startTimer]);

    const handleCta = (cta: SlideCta, e: React.MouseEvent) => {
        if (cta.needsAuth && !user) { e.preventDefault(); openLogin(); }
        if (isSupplier && cta.link === '/dashboard') {
            switchRole('supplier');
        }
    };
    const handleSideLink = (item: any, e: React.MouseEvent) => {
        if (item.needsAuth && !user) { e.preventDefault(); openLogin(); }
        if (isSupplier && item.link === '/dashboard') {
            switchRole('supplier');
        }
    };

    const cur = slidesData[slide] || slidesData[0];

    if (loadingSlides) {
        return (
            <section className="hero-banner-section">
                <div className="container">
                    <div className="hb-skeleton-root">
                        <div className="hb-skeleton-sidebar">
                            <div className="hb-skeleton-item" style={{ width: '40%', height: '32px', marginBottom: '24px' } as React.CSSProperties} />
                            {Array(8).fill(0).map((_, i) => (
                                <div key={i} className="hb-skeleton-item" />
                            ))}
                        </div>
                        <div className="hb-skeleton-main">
                            <div className="hb-skeleton-tag" />
                            <div className="hb-skeleton-title" />
                            <div className="hb-skeleton-title" style={{ width: '60%' } as React.CSSProperties} />
                            <div className="hb-skeleton-text" />
                            <div className="hb-skeleton-text" style={{ width: '70%' } as React.CSSProperties} />
                            <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
                                <div className="hb-skeleton-btn" />
                                <div className="hb-skeleton-btn" style={{ width: '120px' } as React.CSSProperties} />
                            </div>
                        </div>
                        <div className="hb-skeleton-right">
                            {Array(4).fill(0).map((_, i) => (
                                <div key={i} className="hb-skeleton-ql" />
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="hero-banner-section">
            <div className="container">
                <div className="hb-root">
                    {/* ═══ LEFT SIDEBAR ═══ */}
                    <nav
                        className="hb-sidebar"
                        onMouseLeave={() => { setMegaOpen(false); }}
                    >
                        <div className="hb-sidebar-head">
                            <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                            <span>{t('all_categories') || 'All Categories'}</span>
                        </div>

                        <ul className="hb-cat-list">
                            {categories.map(cat => (
                                <li
                                    key={cat._id}
                                    className={`hb-cat-item ${activeCategory?._id === cat._id ? 'hb-cat-active' : ''}`}
                                    onMouseEnter={() => { setActiveCategory(cat); setMegaOpen(true); }}
                                    onClick={() => navigate.push(`/search?category_id=${cat._id}`)}
                                >
                                    <span className="hb-cat-thumb">
                                        <img
                                            src={getImgUrl(cat.image)}
                                            alt={cat.title}
                                            onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => e.currentTarget.src = 'https://cdn-icons-png.flaticon.com/512/711/711707.png'}
                                        />
                                    </span>
                                    <span className="hb-cat-name">{cat.title}</span>
                                    {cat.children && cat.children.length > 0 && (
                                        <svg className="hb-cat-chevron" width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 18l6-6-6-6" />
                                        </svg>
                                    )}
                                </li>
                            ))}
                        </ul>

                        {/* Mega panel */}
                        {megaOpen && activeCategory && (
                            <div className="hb-mega">
                                <div className="hb-mega-title">
                                    <span>{activeCategory.title}</span>
                                    <Link href={`/search?category_id=${activeCategory._id}`} className="hb-mega-all" onClick={() => setMegaOpen(false)}>
                                        View all →
                                    </Link>
                                </div>
                                <div className="hb-mega-grid">
                                    {(activeCategory.children && activeCategory.children.length > 0 ? activeCategory.children : [activeCategory]).map(sub => (
                                        <Link
                                            key={sub._id}
                                            href={`/search?category_id=${sub._id}`}
                                            className="hb-mega-item"
                                            onClick={() => setMegaOpen(false)}
                                        >
                                            <div className="hb-mega-img">
                                                <img
                                                    src={getImgUrl(sub.image)}
                                                    alt={sub.title}
                                                    onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => e.currentTarget.src = 'https://cdn-icons-png.flaticon.com/512/711/711707.png'}
                                                />
                                            </div>
                                            <span>{sub.title}</span>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </nav>

                    {/* ═══ MAIN HERO ═══ */}
                    <div className="hb-hero" style={{
                        '--grad-from': cur.gradFrom,
                        '--grad-mid': cur.gradMid,
                        '--grad-to': cur.gradTo,
                        '--accent': cur.accent,
                        '--shape1': cur.shape1,
                        '--shape2': cur.shape2,
                    } as React.CSSProperties}>
                        {/* Decorative background layers */}
                        <div className="hb-bg-blob blob-tl" />
                        <div className="hb-bg-blob blob-br" />
                        
                        {/* Dynamic Banner Image */}
                        {cur.image && (
                            <div 
                                className="hb-bg-image" 
                                style={{ 
                                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
                                    zIndex: 1, overflow: 'hidden' 
                                }}
                            >
                                <img 
                                    src={getImgUrl(cur.image)} 
                                    alt="" 
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.35 }} 
                                />
                                <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to right, ${cur.gradFrom}cc, transparent)` }} />
                            </div>
                        )}

                        <div className="hb-bg-grid" />
                        <div className="hb-bg-glow glow-top" />
                        <div className="hb-bg-glow glow-bottom" />

                        {/* Floating stat chips */}
                        <div className="hb-floating-chips">
                            {DYNAMIC_STATS.map((s, i) => (
                                <div key={i} className={`hb-chip chip-${i}`}>
                                    <span className="hb-chip-num">{s.num}</span>
                                    <span className="hb-chip-label">{s.label}</span>
                                </div>
                            ))}
                        </div>

                        {/* Slide content */}
                        <div className={`hb-slide-content ${animating ? 'hb-slide-exit' : 'hb-slide-enter'}`}>
                            <span className="hb-tag">{cur.tag}</span>

                            <h1 className="hb-title">
                                {cur.title.split('\n').map((line, i) => (
                                    <span key={i} className={i === 1 ? 'hb-title-accent' : ''}>
                                        {line}{i === 0 && <br />}
                                    </span>
                                ))}
                            </h1>

                            <p className="hb-subtitle">{cur.subtitle}</p>

                            <div className="hb-actions">
                                <Link
                                    href={cur.cta1.link}
                                    className="hb-btn-primary"
                                    onClick={e => handleCta(cur.cta1, e)}
                                >
                                    {cur.cta1.label}
                                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                </Link>
                                <Link href={cur.cta2.link} className="hb-btn-ghost">
                                    {cur.cta2.label}
                                </Link>
                            </div>

                            {/* Quick search bar inside hero */}
                            <div className="hb-quick-search">
                                <input
                                    type="text"
                                    className="hb-qs-input"
                                    placeholder={t('search_products_suppliers') || "Search products, suppliers..."}
                                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                                        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                            navigate.push(`/search?keyword=${encodeURIComponent(e.currentTarget.value)}`);
                                        }
                                    }}
                                />
                                <button
                                    className="hb-qs-btn"
                                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                        const parent = e.currentTarget.closest('.hb-quick-search');
                                        const input = parent?.querySelector('input');
                                        const val = input?.value.trim();
                                        if (val) navigate.push(`/search?keyword=${encodeURIComponent(val)}`);
                                    }}
                                >
                                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    Search
                                </button>
                            </div>
                        </div>

                        {/* Slide Controls */}
                        <div className="hb-controls">
                            <button className="hb-arrow hb-prev" onClick={() => goTo((slide - 1 + slidesData.length) % slidesData.length)}>
                                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <div className="hb-dots">
                                {slidesData.map((_, i) => (
                                    <button key={i} className={`hb-dot ${i === slide ? 'hb-dot-active' : ''}`} onClick={() => goTo(i)} />
                                ))}
                            </div>
                            <button className="hb-arrow hb-next" onClick={() => goTo((slide + 1) % slidesData.length)}>
                                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>

                        {/* Slide progress bar */}
                        <div className="hb-progress-bar">
                            <div key={slide} className="hb-progress-fill" style={{ '--accent': cur.accent } as React.CSSProperties} />
                        </div>
                    </div>

                    {/* ═══ RIGHT QUICK LINKS ═══ */}
                    <div className="hb-quicklinks">
                        {DYNAMIC_SIDE_LINKS.map((item, i) => (
                            <Link
                                key={i}
                                href={item.link}
                                className={`hb-ql-card ${item.cls}`}
                                onClick={e => handleSideLink(item, e)}
                            >
                                <span className="hb-ql-icon">{item.icon}</span>
                                <div className="hb-ql-text">
                                    <span className="hb-ql-title">{item.title}</span>
                                    <span className="hb-ql-sub">{item.sub}</span>
                                </div>
                                <svg className="hb-ql-arrow" width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 18l6-6-6-6" />
                                </svg>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HeroBanner;
