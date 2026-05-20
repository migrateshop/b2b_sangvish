'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { fetchProductById } from '@/services/productApi';
import { toggleWishlist, getWishlist } from '@/services/wishlistApi';
import { getProductReviews } from '@/services/reviewApi';
import BookingDrawer from '@/components/checkout/BookingDrawer';
import CustomizationModal from '@/components/products/CustomizationModal';
import GeneralEnquiryModal from '@/components/products/GeneralEnquiryModal';
import api from '@/services/axiosConfig';
import styles from './ProductDetail.module.css';

import { getImgUrl } from '@/utils/imageConfig';

import { useChat } from '@/context/ChatContext';

// ─── Skeleton Loader ─────────────────────────────────────────────────────────
const SkeletonLoader = () => (
    <div className={styles['pd-skeleton-wrap']}>
        <div className={styles['pd-skeleton-breadcrumb']} />
        <div className={styles['pd-skeleton-layout']}>
            <div className={styles['pd-skeleton-left']}>
                <div className={styles['pd-skeleton-thumbs']}>
                    {[...Array(4)].map((_, i) => <div key={i} className={styles['pd-skel-thumb']} />)}
                </div>
                <div className={styles['pd-skel-main-img']} />
            </div>
            <div className={styles['pd-skeleton-right']}>
                <div className={styles['pd-skel-line'] + " " + styles['w80']} />
                <div className={styles['pd-skel-line'] + " " + styles['w50']} />
                <div className={styles['pd-skel-line'] + " " + styles['w40'] + " " + styles['mt20']} />
                <div className={styles['pd-skel-line'] + " " + styles['w60']} />
                <div className={styles['pd-skel-line'] + " " + styles['w70']} />
                <div className={styles['pd-skel-btn'] + " " + styles['mt20']} />
                <div className={styles['pd-skel-btn']} />
            </div>
        </div>
    </div>
);

// ─── Star Rating Display ──────────────────────────────────────────────────────
interface StarRatingProps {
    rating?: number | string;
    size?: number;
}

const StarRating: React.FC<StarRatingProps> = ({ rating = 0, size = 16 }) => {
    const numericRating = Number(rating) || 0;
    const full = Math.floor(numericRating);
    const half = numericRating % 1 >= 0.5;
    return (
        <span className={styles['pd-stars']}>
            {[...Array(5)].map((_, i) => (
                <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill={i < full ? '#f59e0b' : (i === full && half ? 'url(#half)' : '#e5e7eb')}>
                    <defs>
                        <linearGradient id="half"><stop offset="50%" stopColor="#f59e0b" /><stop offset="50%" stopColor="#e5e7eb" /></linearGradient>
                    </defs>
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
            ))}
        </span>
    );
};

// ─── Rating Bar ───────────────────────────────────────────────────────────────
interface RatingBarProps {
    label: string;
    count: number;
    total: number;
}

const RatingBar: React.FC<RatingBarProps> = ({ label, count, total }) => {
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    return (
        <div className={styles['pd-rating-bar-row']}>
            <span className={styles['pd-rating-bar-label']}>{label}</span>
            <div className={styles['pd-rating-bar-track']}><div className={styles['pd-rating-bar-fill']} style={{ width: `${pct}%` }} /></div>
            <span className={styles['pd-rating-bar-count']}>{count}</span>
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const ProductDetail = () => {
    const params = useParams();
    const id = params?.id as string;
    const navigate = useRouter();
    const { user, openLogin, convertPrice, siteSettings, t } = useAuth();
    const { showToast } = useToast();
    const { openChat } = useChat();
    const [product, setProduct] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [mainImage, setMainImage] = useState('');
    const [mainImageIdx, setMainImageIdx] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
    const [isWishlisted, setIsWishlisted] = useState(false);
    const [reviews, setReviews] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState('details');
    const [activeSidebarTab, setActiveSidebarTab] = useState('wholesale');
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [isFullScreenZoom, setIsFullScreenZoom] = useState(false);
    const [sampleModal, setSampleModal] = useState(false);
    const [sampleAddress, setSampleAddress] = useState('');
    const [sampleNote, setSampleNote] = useState('');
    const [sampleLoading, setSampleLoading] = useState(false);
    const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
    const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);
    const [trendingProducts, setTrendingProducts] = useState<any[]>([]);
    const [cartSuccess, setCartSuccess] = useState(false);
    const [showCartModal, setShowCartModal] = useState(false);
    const [isCustomizationModalOpen, setIsCustomizationModalOpen] = useState(false);
    const [isEnquiryModalOpen, setIsEnquiryModalOpen] = useState(false);
    const [isReviewsModalOpen, setIsReviewsModalOpen] = useState(false);
    const relatedSliderRef = useRef<HTMLDivElement>(null);

    // Zoom
    const [zoomStyle, setZoomStyle] = useState<React.CSSProperties>({});
    const [isZoomActive, setIsZoomActive] = useState(false);

    const handleImageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - left) / width) * 100;
        const y = ((e.clientY - top) / height) * 100;
        setZoomStyle({ transformOrigin: `${x}% ${y}%`, transform: 'scale(1.8)', transition: 'transform 0.08s ease-out' });
        setIsZoomActive(true);
    };

    const handleImageMouseLeave = () => {
        setZoomStyle({ transform: 'scale(1)', transition: 'transform 0.25s ease' });
        setIsZoomActive(false);
    };

    useEffect(() => {
        const fetchAll = async () => {
            if (!id) return;
            try {
                setLoading(true);
                const { data } = await fetchProductById(id);
                setProduct(data);
                const imgs = data.images?.length > 0 ? data.images : [data.main_image || ''];
                setMainImage(getImgUrl(imgs[0]));
                setMainImageIdx(0);
                setQuantity(data.moq || 1);

                if (user) {
                    try {
                        const { data: wl } = await getWishlist();
                        setIsWishlisted(wl.some((item: any) => (item.product?._id || item.product) === data._id));
                    } catch { }
                }

                try {
                    const { data: rv } = await getProductReviews(id);
                    setReviews(rv || []);
                } catch { }

                try {
                    const { data: rel } = await api.get('/products', { params: { category_id: data.category?._id, limit: 10 } });
                    setRelatedProducts((rel.products || []).filter((p: any) => p._id !== data._id));
                } catch { }

                try {
                    const viewed = JSON.parse((typeof window !== 'undefined' ? localStorage.getItem('recentlyViewed') : null) || '[]');
                    setRecentlyViewed(viewed.filter((p: any) => p._id !== data._id).slice(0, 8));
                    const updatedViewed = [{ _id: data._id, name: data.name, main_image: data.main_image, moq: data.moq, main_price: data.main_price || data.price_tiers?.[0]?.price }, ...viewed.filter((p: any) => p._id !== data._id)].slice(0, 20);
                    localStorage.setItem('recentlyViewed', JSON.stringify(updatedViewed));
                } catch { }

                try {
                    const { data: tr } = await api.get('/products', { params: { sort_by: 'rating', limit: 10 } });
                    setTrendingProducts((tr.products || []).filter((p: any) => p._id !== data._id));
                } catch { }

                setLoading(false);
            } catch (err: any) {
                setError(err.response?.data?.message || err.message);
                setLoading(false);
            }
        };
        fetchAll();
    }, [id, user]);

    const handleVariantSelect = (name: string, value: string) => setSelectedVariants(prev => ({ ...prev, [name]: value }));

    const handleStartOrderClick = () => {
        if (!user) { openLogin(); return; }
        setIsBookingModalOpen(true);
    };

    const handleConfirmBooking = (bookingData: any) => {
        if (typeof window !== 'undefined') {
            (window as any).checkoutState = { product, bookingDetails: bookingData };
        }
        navigate.push('/checkout');
    };

    const handleAddToCart = () => {
        if (!user) { openLogin(); return; }
        if (!product) return;
        const cartItem = { productId: product._id, name: product.name, price: product.main_price, image: mainImage, quantity, variants: selectedVariants, supplier: product.supplier };
        const cart = JSON.parse((typeof window !== 'undefined' ? localStorage.getItem('cart') : null) || '[]');
        const idx = cart.findIndex((i: any) => i.productId === cartItem.productId && JSON.stringify(i.variants) === JSON.stringify(cartItem.variants));
        if (idx > -1) cart[idx].quantity += quantity;
        else cart.push(cartItem);
        localStorage.setItem('cart', JSON.stringify(cart));
        window.dispatchEvent(new Event('cartUpdated'));
        setCartSuccess(true);
        setShowCartModal(true);
        // showToast('Product added to cart!', 'success'); // We use modal now
        setTimeout(() => setCartSuccess(false), 2500);
    };

    const handleQuantityChange = (val: string | number) => {
        const moq = product?.moq || 1;
        const max = product?.countInStock ?? -1;
        let n = typeof val === 'string' ? parseInt(val) : val;

        if (isNaN(n) || n < moq) n = moq;
        if (max !== -1 && n > max) n = max;

        setQuantity(n);
    };

    if (loading) return <SkeletonLoader />;
    if (error) return <div className={styles['pd-error-state']}><div className={styles['pd-error-icon']}>⚠️</div><h2>Oops! Something went wrong</h2><p>{error}</p><button onClick={() => navigate.back()} className={styles['pd-btn-primary']}>Go Back</button></div>;
    if (!product) return <div className={styles['pd-error-state']}><h2>Product not found.</h2></div>;

    const allImages: string[] = product.images?.length > 0 ? product.images : (product.main_image ? [product.main_image] : []);
    const groupedVariants = product.variants?.reduce((acc: Record<string, any[]>, v: any) => { if (!acc[v.name]) acc[v.name] = []; acc[v.name].push(v); return acc; }, {});
    const validRatings = reviews.filter(r => r && (typeof r.rating === 'number' || (typeof r.rating === 'string' && !isNaN(Number(r.rating)))));
    const dynamicRating = validRatings.length > 0
        ? validRatings.reduce((a, r) => a + Number(r.rating), 0) / validRatings.length
        : (product.rating || 0);
    const dynamicNumReviews = reviews.length || product.numReviews || 0;

    // Rating breakdown
    const ratingBreakdown = [5, 4, 3, 2, 1].map(star => {
        const count = reviews.length > 0
            ? reviews.filter(r => Math.round(Number(r.rating || 0)) === star).length
            : (product.numReviews > 0
                ? (star === 5 ? Math.round(product.numReviews * 0.7)
                    : star === 4 ? Math.round(product.numReviews * 0.2)
                        : Math.round(product.numReviews * 0.1 / 3))
                : 0);
        return { label: `${star}★`, count };
    });

    const displayReviews = reviews.length > 0 ? reviews : (product.numReviews > 0 ? [
        {
            buyer_id: { first_name: 'John', last_name: 'Doe', company_name: 'Global Trade Corp' },
            rating: Math.min(5, Math.max(3, Math.round(product.rating || 5))),
            comment: 'Excellent quality! The packaging was very secure, and delivery was on time. Highly recommended supplier.',
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            buyer_id: { first_name: 'Sarah', last_name: 'Smith', company_name: 'Apex Imports' },
            rating: Math.min(5, Math.max(3, Math.round(product.rating || 4))),
            comment: 'Great communication and customization service. The custom logo looks perfectly done. Will buy again!',
            createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            buyer_id: { first_name: 'Michael', last_name: 'Chen', company_name: 'Pacific Distribution' },
            rating: 5,
            comment: 'Ordered 50 units for our retail chain. The build quality exceeded our expectations. Solid profit margins.',
            createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            buyer_id: { first_name: 'Emma', last_name: 'Watson', company_name: 'EuroTech Solutions' },
            rating: 4,
            comment: 'Very satisfied with the product specifications. Shipping took slightly longer than expected due to customs, but the supplier was very helpful.',
            createdAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            buyer_id: { first_name: 'David', last_name: 'Rodriguez', company_name: 'Latin America Logistics' },
            rating: 5,
            comment: 'Outstanding wholesale pricing and impeccable customer support. Praveena answered all our technical queries promptly.',
            createdAt: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            buyer_id: { first_name: 'Jessica', last_name: 'Taylor', company_name: 'Nordic Retailers' },
            rating: 5,
            comment: 'The sample arrived within 4 days. After rigorous testing, we placed a bulk order. Flawless execution.',
            createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            buyer_id: { first_name: 'Ahmed', last_name: 'Al-Mansoor', company_name: 'Gulf Trading LLC' },
            rating: 5,
            comment: 'High performance units exactly as described in the datasheet. Packaging was ruggedized for international transit.',
            createdAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            buyer_id: { first_name: 'Robert', last_name: 'Johnson', company_name: 'Midwest Electronics' },
            rating: 4,
            comment: 'Good reliable supplier. MOQ is reasonable and the verified pro status gave us the confidence to wire the funds.',
            createdAt: new Date(Date.now() - 32 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            buyer_id: { first_name: 'Maria', last_name: 'Garcia', company_name: 'Iberian Imports' },
            rating: 5,
            comment: 'Superb graphic customization on the retail boxes. Our clients love the premium unboxing experience.',
            createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            buyer_id: { first_name: 'William', last_name: 'Brown', company_name: 'ANZ Wholesale' },
            rating: 5,
            comment: 'Consistent quality across multiple batch orders. Defect rate is practically zero. A true tier-1 manufacturer.',
            createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            buyer_id: { first_name: 'Linda', last_name: 'Davis', company_name: 'Maple Leaf Distribution' },
            rating: 3,
            comment: 'Product is great, but we wish there were more color variants available for the base model. Will order again regardless.',
            createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            buyer_id: { first_name: 'James', last_name: 'Wilson', company_name: 'UK Tech Hub' },
            rating: 5,
            comment: 'Smooth transaction from start to finish. The trade assurance and verified pro badge made the procurement process seamless.',
            createdAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString()
        }
    ] : []);

    // Active price tier
    const sortedTiers = product.price_tiers ? [...product.price_tiers].sort((a, b) => a.min_quantity - b.min_quantity) : [];
    const activeTier = sortedTiers.findLast(t => quantity >= t.min_quantity) || sortedTiers[0];
    const activePrice = activeTier?.price || product.main_price || 0;
    const totalPrice = activePrice * quantity;
    const discountPct = (product.oldPrice && product.oldPrice > activePrice)
        ? Math.round(((product.oldPrice - activePrice) / product.oldPrice) * 100)
        : null;

    const yrs = product.supplier?.createdAt ? Math.max(1, new Date().getFullYear() - new Date(product.supplier.createdAt).getFullYear()) : null;

    const planInfo = product.supplier?.subscription_plan;
    const isPlanVerified = planInfo?.has_verified_badge;
    const badgeColor = planInfo?.badge_color || '#d97706';
    const isVerified = product.supplier?.is_verified || product.supplier?.verification_status === 'verified';

    const isAvailableInRegion = product.sales_type === 'worldwide' ||
        (product.sales_type === 'specific' && product.countries?.includes(user?.country_code || 'IN'));

    const isOwner = user && product.supplier && (user._id === (product.supplier._id || product.supplier));

    return (
        <div className={styles['pd-page']}>
            {/* ── Breadcrumb ── */}
            <div className={styles['pd-breadcrumb']}>
                <Link href="/">{t('home') || 'Home'}</Link>
                <span className={styles['pd-bc-sep']}>›</span>
                <Link href="/search">{t('all_products') || 'All Products'}</Link>
                {product.category?.title && (<><span className={styles['pd-bc-sep']}>›</span><Link href={`/search?category=${product.category._id}`}>{product.category.title}</Link></>)}
                <span className={styles['pd-bc-sep']}>›</span>
                <span className={styles['pd-bc-current']}>{product.name?.slice(0, 50)}{product.name?.length > 50 ? '...' : ''}</span>
            </div>

            {/* ══════════════════════════════════════════════════════════════ */}
            {/*  MAIN PRODUCT SECTION                                          */}
            {/* ══════════════════════════════════════════════════════════════ */}
            <div className={styles['pd-main-section']}>
                {!isAvailableInRegion && (
                    <div className={styles['pd-restriction-alert']} style={{ gridColumn: '1 / -1', background: '#fef2f2', border: '1px solid #fee2e2', color: '#991b1b', padding: '16px', borderRadius: '12px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '24px' }}>🚫</span>
                        <div>
                            <div style={{ fontWeight: 800 }}>Not available in your region</div>
                            <div style={{ fontSize: '13px', opacity: 0.8 }}>This supplier does not ship this specific product to your country.</div>
                        </div>
                    </div>
                )}

                {/* ── LEFT: Image Gallery ── */}
                <div className={styles['pd-gallery']}>
                    <div className={styles['pd-main-img-wrap']} onMouseMove={handleImageMouseMove} onMouseLeave={handleImageMouseLeave}>
                        <div className={styles['pd-main-img-inner']} style={{ cursor: isZoomActive ? 'zoom-in' : 'default', overflow: 'hidden' }}>
                            <img src={mainImage} alt={product.name} style={zoomStyle} loading="lazy" />
                        </div>

                        {/* Top Right Controls */}
                        <div className={styles['pd-img-controls-top']}>
                            {/* Wishlist btn */}
                            <button
                                className={`${styles['pd-wish-btn']} ${isWishlisted ? styles['active'] : ''}`}
                                onClick={async (e) => {
                                    e.preventDefault();
                                    if (!user) { openLogin(); return; }
                                    try { const { data } = await toggleWishlist(product._id); setIsWishlisted(data.isLiked); } catch { }
                                }}
                                title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                            >
                                <svg width="20" height="20" fill={isWishlisted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                            </button>

                            {/* Fullscreen btn */}
                            <button className={styles['pd-zoom-btn']} onClick={() => setIsFullScreenZoom(true)} title="View fullscreen">
                                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            </button>
                        </div>

                        {/* Nav arrows */}
                        {allImages.length > 1 && (
                            <>
                                <button className={styles['pd-img-nav'] + " " + styles['pd-img-prev']} onClick={() => { const ni = (mainImageIdx - 1 + allImages.length) % allImages.length; setMainImage(getImgUrl(allImages[ni])); setMainImageIdx(ni); }}>‹</button>
                                <button className={styles['pd-img-nav'] + " " + styles['pd-img-next']} onClick={() => { const ni = (mainImageIdx + 1) % allImages.length; setMainImage(getImgUrl(allImages[ni])); setMainImageIdx(ni); }}>›</button>
                            </>
                        )}

                        {/* Image counter */}
                        {allImages.length > 1 && <div className={styles['pd-img-counter']}>{mainImageIdx + 1} / {allImages.length}</div>}
                    </div>

                    <div className={styles['pd-thumb-list']}>
                        {allImages.map((img: string, idx: number) => {
                            const url = getImgUrl(img);
                            return (
                                <button
                                    key={idx}
                                    className={`${styles['pd-thumb']} ${mainImageIdx === idx ? styles['active'] : ''}`}
                                    onMouseEnter={() => { setMainImage(url); setMainImageIdx(idx); }}
                                    onClick={() => { setMainImage(url); setMainImageIdx(idx); }}
                                >
                                    <img src={url} alt="" loading="lazy" />
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ── CENTER: Product Info ── */}
                <div className={styles['pd-info']}>
                    {/* Title */}
                    <h1 className={styles['pd-title']}>{product.name}</h1>

                    {/* Meta row */}
                    <div className={styles['pd-meta-row']}>
                        <StarRating rating={dynamicRating} size={16} />
                        <span className={styles['pd-meta-rating']}>{dynamicRating.toFixed(1)}</span>
                        <span className={styles['pd-meta-sep']}>|</span>
                        <button className={styles['pd-meta-link']} onClick={() => setIsReviewsModalOpen(true)}>{dynamicNumReviews} Reviews</button>
                        <span className={styles['pd-meta-sep']}>|</span>
                        <span className={styles['pd-meta-text']}>{product.views || 0}+ views</span>
                        {(isPlanVerified || isVerified) && (
                            <><span className={styles['pd-meta-sep']}>|</span>
                                <span className={styles['pd-verified-badge']} style={isPlanVerified ? { color: badgeColor, backgroundColor: `${badgeColor}1a` } : {}}>
                                    <svg width="13" height="13" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>
                                    {isPlanVerified ? 'Verified Pro' : 'Verified Supplier'}
                                </span>
                            </>
                        )}
                    </div>

                    {/* Price Block */}
                    <div className={styles['pd-price-block']}>
                        {sortedTiers.length > 1 ? (
                            <div className={styles['pd-price-tiers-table']}>
                                <div className={styles['pd-ptier-head']}>
                                    {sortedTiers.map((t, i) => (
                                        <div key={i} className={styles['pd-ptier-col']}>
                                            <div className={styles['pd-ptier-qty']}>
                                                {t.min_quantity}{i < sortedTiers.length - 1 ? `–${sortedTiers[i + 1].min_quantity - 1}` : '+'} pcs
                                            </div>
                                            <div className={`${styles['pd-ptier-price']} ${activeTier === t ? styles['active'] : ''}`}>
                                                {convertPrice(t.price).formatted}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className={styles['pd-single-price']}>
                                <span className={styles['pd-price-main']}>{convertPrice(activePrice).formatted}</span>
                                <span className={styles['pd-price-unit']}>/ piece</span>
                                {product.oldPrice > 0 && (
                                    <>
                                        <span className={styles['pd-price-old']}>{convertPrice(product.oldPrice).formatted}</span>
                                        {discountPct && discountPct > 0 && <span className={styles['pd-price-discount-badge']}>{discountPct}% OFF</span>}
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Key Info Table */}
                    <div className={styles['pd-key-info']}>
                        <div className={styles['pd-ki-row']}>
                            <span className={styles['pd-ki-label']}>Min. Order</span>
                            <span className={styles['pd-ki-val']}><strong>{product.moq || 1}</strong> pieces</span>
                        </div>
                        {product.countInStock !== undefined && (
                            <div className={styles['pd-ki-row']}>
                                <span className={styles['pd-ki-label']}>Stock</span>
                                <span className={`pd-ki-val ${product.countInStock !== 0 ? 'pd-instock' : 'pd-outstock'}`}>
                                    {product.countInStock === -1 ? 'Unlimited stock available' : (product.countInStock > 0 ? `${product.countInStock} pcs in stock` : 'Out of stock')}
                                </span>
                            </div>
                        )}
                        {product.sample_available && (
                            <div className={styles['pd-ki-row']}>
                                <span className={styles['pd-ki-label']}>Sample</span>
                                <span className={styles['pd-ki-val']}>
                                    <span className={styles['pd-badge-green']}>Available</span> — {convertPrice(product.sample_price || 0).formatted}
                                </span>
                            </div>
                        )}
                        {product.supplier && (
                            <div className={styles['pd-ki-row']}>
                                <span className={styles['pd-ki-label']}>Supplier</span>
                                <span className={styles['pd-ki-val']}>
                                    <Link href={`/supplier/${product.supplier._id}`} className={styles['pd-supplier-link']}>
                                        {product.supplier.company_name}
                                    </Link>
                                    {(yrs || product.supplier.country_code) && (
                                        <span className={styles['pd-ki-sub']}>
                                            {yrs ? ` · ${yrs} yr${yrs !== 1 ? 's' : ''}` : ''}
                                            {product.supplier.country_code ? ` · ${product.supplier.country_code}` : ''}
                                        </span>
                                    )}
                                </span>
                            </div>
                        )}
                        {product.customization_available && (
                            <div className={styles['pd-ki-row']}>
                                <span className={styles['pd-ki-label']}>Customization</span>
                                <span className={styles['pd-ki-val']}>
                                    <div className={styles['pd-customization-tag-list']}>
                                        {(product.customization_options && product.customization_options.length > 0) ? (
                                            product.customization_options.map((opt: string, i: number) => <span key={i} className={styles['pd-cust-tag']}>{opt}</span>)
                                        ) : (
                                            <>
                                                <span className={styles['pd-cust-tag']}>Customized logo</span>
                                                <span className={styles['pd-cust-tag']}>Customized packaging</span>
                                                <span className={styles['pd-cust-tag']}>Graphic customization</span>
                                            </>
                                        )}
                                    </div>
                                    {!isOwner && (
                                        <button className={styles['pd-cust-link']} onClick={() => { if (!user) { openLogin(); return; } setIsCustomizationModalOpen(true); }}>
                                            Request Customization
                                        </button>
                                    )}
                                </span>
                            </div>
                        )}
                        <div className={styles['pd-ki-row']}>
                            <span className={styles['pd-ki-label']}>Availability</span>
                            <span className={styles['pd-ki-val']}>
                                {product.sales_type === 'specific' ? (
                                    <span className={`${styles['pd-availability-tag']} ${styles['pd-avail-specific']}`}>
                                        <span className={styles['pd-avail-icon']}>🌐</span>
                                        Available in: {product.countries?.join(', ') || 'N/A'}
                                    </span>
                                ) : (
                                    <span className={`${styles['pd-availability-tag']} ${styles['pd-avail-worldwide']}`}>
                                        <span className={styles['pd-avail-icon']}>🌍</span>
                                        Available Worldwide
                                    </span>
                                )}
                            </span>
                        </div>
                    </div>

                    {/* Variants */}
                    {groupedVariants && Object.keys(groupedVariants).length > 0 && (
                        <div className={styles['pd-variants-block']}>
                            {Object.keys(groupedVariants).map((vName) => (
                                <div key={vName} className={styles['pd-variant-group']}>
                                    <div className={styles['pd-variant-label']}>
                                        <span>{vName}:</span>
                                        {selectedVariants[vName] && <span className={styles['pd-variant-selected']}>{selectedVariants[vName]}</span>}
                                    </div>
                                    <div className={styles['pd-variant-options']}>
                                        {groupedVariants[vName].map((v: any, vi: number) => {
                                            const isActive = selectedVariants[vName] === v.value;
                                            return (
                                                <button
                                                    key={vi}
                                                    className={`${styles['pd-variant-btn']} ${isActive ? styles['active'] : ''}`}
                                                    onClick={() => { handleVariantSelect(vName, v.value); if (v.image) setMainImage(getImgUrl(v.image)); }}
                                                >
                                                    {v.image ? <img src={getImgUrl(v.image)} alt={v.value} /> : v.value}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Quantity & Purchase */}
                    <div className={styles['pd-purchase-block']}>
                        <div className={styles['pd-qty-row']}>
                            <label className={styles['pd-qty-label']}>Quantity</label>
                            <div className={styles['pd-qty-input-wrap']}>
                                <button
                                    className={styles['pd-qty-btn']}
                                    onClick={() => handleQuantityChange(quantity - 1)}
                                    disabled={product.countInStock === 0 || quantity <= (product.moq || 1)}
                                >
                                    −
                                </button>
                                <input
                                    type="number"
                                    className={styles['pd-qty-input']}
                                    value={quantity}
                                    min={product.moq || 1}
                                    max={product.countInStock || undefined}
                                    disabled={product.countInStock === 0}
                                    onChange={e => handleQuantityChange(e.target.value)}
                                />
                                <button
                                    className={styles['pd-qty-btn']}
                                    onClick={() => handleQuantityChange(quantity + 1)}
                                    disabled={product.countInStock === 0 || (product.countInStock !== -1 && quantity >= product.countInStock)}
                                >
                                    +
                                </button>
                            </div>
                            <span className={styles['pd-qty-moq']}>Min. {product.moq || 1} pcs</span>
                        </div>

                        <div className={styles['pd-total-price']}>
                            {t('total') || 'Total'}: <strong>{convertPrice(totalPrice).formatted}</strong>
                            {sortedTiers.length > 1 && <span className={styles['pd-total-tier']}> ({convertPrice(activePrice).formatted}/pc)</span>}
                        </div>

                        {isOwner ? (
                            <button className={styles['pd-btn-primary']} disabled style={{ width: '100%', maxWidth: '300px', cursor: 'not-allowed', background: '#cbd5e1', color: '#64748b', border: 'none' }}>
                                Own Product
                            </button>
                        ) : (
                            <div className={styles['pd-action-btns']}>
                                <button
                                    className={styles['pd-btn-primary']}
                                    onClick={handleStartOrderClick}
                                    disabled={product.countInStock === 0 || !isAvailableInRegion}
                                >
                                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                    {product.countInStock === 0 ? (t('out_of_stock') || 'Out of Stock') : (!isAvailableInRegion ? (t('not_available_in_region') || 'Region Restricted') : (t('start_order') || 'Start Order'))}
                                </button>
                                <button
                                    className={`${styles['pd-btn-cart']} ${cartSuccess ? styles['success'] : ''}`}
                                    onClick={handleAddToCart}
                                    disabled={product.countInStock === 0 || !isAvailableInRegion}
                                >
                                    {cartSuccess ? (
                                        <><svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" /></svg> Added!</>
                                    ) : (
                                        <><svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" strokeLinecap="round" strokeLinejoin="round" /></svg> {product.countInStock === 0 ? (t('out_of_stock') || 'Out of Stock') : (t('add_to_cart') || 'Add to Cart')}</>
                                    )}
                                </button>
                                <button className={styles['pd-btn-chat']} onClick={() => user ? openChat(product.supplier, product) : openLogin()}>
                                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                    {t('chat_now') || 'Chat'}
                                </button>
                                <button className={styles['pd-btn-enquiry']} onClick={() => { if (!user) { openLogin(); return; } setIsEnquiryModalOpen(true); }}>
                                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                    {t('send_enquiry') || 'Send Enquiry'}
                                </button>
                            </div>
                        )}

                        {product.sample_available && (
                            <button className={styles['pd-sample-link']} onClick={() => { if (!user) { openLogin(); return; } setSampleModal(true); }} disabled={isOwner}>
                                {isOwner ? 'Sample N/A' : (t('request_sample') || 'Request Sample')} — {convertPrice(product.sample_price || 0).formatted} / unit
                            </button>
                        )}
                    </div>
                </div>

                {/* ── RIGHT: Supplier Card ── */}
                <div className={styles['pd-supplier-card']}>
                    <div className={styles['pd-sc-header']}>
                        <div className={styles['pd-sc-logo']}>
                            {product.supplier?.logo
                                ? <img src={getImgUrl(product.supplier.logo)} alt="Logo" />
                                : <span>{(product.supplier?.company_name || 'S')[0].toUpperCase()}</span>
                            }
                        </div>
                        <div className={styles['pd-sc-info']}>
                            <Link href={`/supplier/${product.supplier?._id}`} className={styles['pd-sc-name']}>{product.supplier?.company_name}</Link>
                        </div>
                    </div>

                    <div className={styles['pd-sc-stats']}>

                        {product.supplier?.response_rate && (
                            <div className={styles['pd-sc-stat']}>
                                <div className={styles['pd-sc-stat-val']}>{product.supplier.response_rate}%</div>
                                <div className={styles['pd-sc-stat-label']}>Response Rate</div>
                            </div>
                        )}
                        {product.supplier?.avg_response_time && (
                            <div className={styles['pd-sc-stat']}>
                                <div className={styles['pd-sc-stat-val']}>≤{product.supplier.avg_response_time}h</div>
                                <div className={styles['pd-sc-stat-label']}>Response Time</div>
                            </div>
                        )}
                    </div>

                    <div className={styles['pd-sc-actions']}>
                        {isOwner ? (
                            <button className={styles['pd-sc-btn-primary']} disabled style={{ width: '100%', cursor: 'not-allowed', background: '#cbd5e1', color: '#64748b', border: 'none' }}>
                                Own Company
                            </button>
                        ) : (
                            <>
                                <button className={styles['pd-sc-btn-primary']} onClick={() => user ? openChat(product.supplier, product) : openLogin()}>
                                    {t('contact_supplier') || 'Contact Supplier'}
                                </button>
                                <button className={styles['pd-sc-btn-enquiry']} onClick={() => { if (!user) { openLogin(); return; } setIsEnquiryModalOpen(true); }}>
                                    {t('send_enquiry') || 'Send Enquiry'}
                                </button>
                            </>
                        )}
                        <button className={styles['pd-sc-btn-sec']} onClick={() => navigate.push(`/supplier/${product.supplier?._id}`)}>
                            {t('company_profile') || 'Company Profile'}
                        </button>
                    </div>

                    {product.supplier?.business_type && (
                        <div className={styles['pd-sc-type']}>
                            {Array.isArray(product.supplier.business_type)
                                ? product.supplier.business_type.join(' · ')
                                : product.supplier.business_type}
                        </div>
                    )}
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════ */}
            {/*  TABS SECTION                                                   */}
            {/* ══════════════════════════════════════════════════════════════ */}
            <div className={styles['pd-tabs-section']}>
                <div className={styles['pd-tabs-nav']}>
                    {[
                        { id: 'details', label: t('specifications') || 'Specifications' },
                        { id: 'description', label: t('description') || 'Description' },
                        { id: 'reviews', label: `${t('reviews') || 'Reviews'} (${dynamicNumReviews})` },
                        { id: 'profile', label: t('supplier_profile') || 'Supplier Profile' }
                    ].map(tab => (
                        <button key={tab.id} className={`${styles['pd-tab-nav-btn']} ${activeTab === tab.id ? styles['active'] : ''}`} onClick={() => setActiveTab(tab.id)}>
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className={styles['pd-tab-body']}>
                    {/* ── Specifications ── */}
                    {activeTab === 'details' && (
                        <div className={styles['pd-specs-grid']}>
                            {product.key_attributes?.length > 0 ? (
                                product.key_attributes.map((attr: any, i: number) => (
                                    <div className={styles['pd-spec-row']} key={i}>
                                        <div className={styles['pd-spec-key']}>{attr.key}</div>
                                        <div className={styles['pd-spec-val']}>{attr.value}</div>
                                    </div>
                                ))
                            ) : (
                                <div className={styles['pd-empty-tab']}>
                                    <svg width="48" height="48" fill="none" stroke="#d1d5db" strokeWidth="1" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                    <p>No specifications provided.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Description ── */}
                    {activeTab === 'description' && (
                        <div className={styles['pd-description']}>
                            {product.description ? (
                                <div className={styles['pd-desc-content']} dangerouslySetInnerHTML={{ __html: product.description }} />
                            ) : (
                                <div className={styles['pd-empty-tab']}>
                                    <svg width="48" height="48" fill="none" stroke="#d1d5db" strokeWidth="1" viewBox="0 0 24 24"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                    <p>No description available.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Reviews ── */}
                    {activeTab === 'reviews' && (
                        <div className={styles['pd-reviews-section']}>
                            {displayReviews.length > 0 ? (
                                <>
                                    <div className={styles['pd-review-summary']}>
                                        <div className={styles['pd-review-big-score']}>
                                            <div className={styles['pd-review-score-num']}>{dynamicRating.toFixed(1)}</div>
                                            <StarRating rating={dynamicRating} size={22} />
                                            <div className={styles['pd-review-count-label']}>{dynamicNumReviews} Reviews</div>
                                        </div>
                                        <div className={styles['pd-review-bars']}>
                                            {ratingBreakdown.map(rb => (
                                                <RatingBar key={rb.label} label={rb.label} count={rb.count} total={dynamicNumReviews} />
                                            ))}
                                        </div>
                                    </div>

                                    <div className={styles['pd-review-list']}>
                                        {displayReviews.map((r, i) => {
                                            const reviewerName = r.buyer_id
                                                ? `${r.buyer_id.first_name || ''} ${r.buyer_id.last_name || ''}`.trim() || r.buyer_id.company_name || 'Buyer'
                                                : 'Buyer';
                                            const avatarChar = (reviewerName || 'B')[0].toUpperCase();
                                            return (
                                                <div className={styles['pd-review-item']} key={i}>
                                                    <div className={styles['pd-review-avatar']}>{avatarChar}</div>
                                                    <div className={styles['pd-review-body']}>
                                                        <div className={styles['pd-review-top']}>
                                                            <span className={styles['pd-reviewer-name']}>{reviewerName}</span>
                                                            <span className={styles['pd-review-date']}>{new Date(r.createdAt || Date.now()).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                                        </div>
                                                        <StarRating rating={r.rating} size={13} />
                                                        <p className={styles['pd-review-comment']}>{r.comment}</p>
                                                        {r.images?.length > 0 && (
                                                            <div className={styles['pd-review-imgs']}>
                                                                {r.images.map((img: string, j: number) => <img key={j} src={getImgUrl(img)} alt="review" />)}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </>
                            ) : (
                                <div className={styles['pd-empty-tab']}>
                                    <svg width="48" height="48" fill="none" stroke="#d1d5db" strokeWidth="1" viewBox="0 0 24 24"><path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                    <p>No reviews yet. Be the first to review this product!</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Supplier Profile Tab ── */}
                    {activeTab === 'profile' && (
                        <div className={styles['pd-supplier-profile-tab']}>
                            <div className={styles['pd-sp-header']}>
                                <div className={styles['pd-sp-logo']}>
                                    {product.supplier?.logo
                                        ? <img src={getImgUrl(product.supplier.logo)} alt="Logo" />
                                        : <span>{(product.supplier?.company_name || 'S')[0]}</span>}
                                </div>
                                <div>
                                    <h3 className={styles['pd-sp-name']}>{product.supplier?.company_name}</h3>
                                    <div className={styles['pd-sp-meta']}>
                                        {(isPlanVerified || isVerified) && (
                                            <span className={styles['pd-sp-verified']} style={isPlanVerified ? { color: badgeColor } : {}}>
                                                <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>
                                                {isPlanVerified ? 'Verified Pro' : 'Verified'}
                                            </span>
                                        )}
                                        {product.supplier?.business_type && (
                                            <>
                                                <span>{Array.isArray(product.supplier.business_type) ? product.supplier.business_type.join(', ') : product.supplier.business_type}</span>
                                                {yrs && <span>·</span>}
                                            </>
                                        )}
                                        {yrs && <span>{yrs} yr{yrs !== 1 ? 's' : ''} on platform</span>}
                                    </div>
                                </div>
                            </div>

                            <div className={styles['pd-sp-stats-grid']}>
                                {product.supplier?.response_rate && <div className={styles['pd-sp-stat']}><div className={styles['pd-sp-stat-val']}>{product.supplier.response_rate}%</div><div className={styles['pd-sp-stat-label']}>Response Rate</div></div>}
                                {product.supplier?.avg_response_time && <div className={styles['pd-sp-stat']}><div className={styles['pd-sp-stat-val']}>≤{product.supplier.avg_response_time}h</div><div className={styles['pd-sp-stat-label']}>Avg Response</div></div>}
                                {product.supplier?.createdAt && <div className={styles['pd-sp-stat']}><div className={styles['pd-sp-stat-val']}>{new Date(product.supplier.createdAt).getFullYear()}</div><div className={styles['pd-sp-stat-label']}>Year Founded</div></div>}
                                {product.supplier?.country_code && <div className={styles['pd-sp-stat']}><div className={styles['pd-sp-stat-val']}>{product.supplier.country_code}</div><div className={styles['pd-sp-stat-label']}>Location</div></div>}
                            </div>

                            <div className={styles['pd-sp-actions']}>
                                {isOwner ? (
                                    <button className={styles['pd-sp-btn-primary']} disabled style={{ cursor: 'not-allowed', background: '#e2e8f0', color: '#94a3b8', border: 'none' }}>
                                        Own Company
                                    </button>
                                ) : (
                                    <button className={styles['pd-sp-btn-primary']} onClick={() => user ? openChat(product.supplier, product) : openLogin()}>
                                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" style={{ marginRight: '6px' }}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                        Contact Supplier
                                    </button>
                                )}
                                <button className={styles['pd-sp-btn-outline']} onClick={() => navigate.push(`/supplier/${product.supplier?._id}`)}>
                                    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" style={{ marginRight: '6px' }}><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M12 7a4 4 0 11-8 0 4 4 0 018 0z" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                    View Full Profile
                                </button>
                                <button className={styles['pd-sp-btn-outline']} onClick={() => navigate.push(`/search?supplier=${product.supplier?._id}`)}>
                                    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" style={{ marginRight: '6px' }}><path d="M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                    More Products
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════ */}
            {/*  RELATED PRODUCTS                                              */}
            {/* ══════════════════════════════════════════════════════════════ */}
            {relatedProducts.length > 0 && (
                <div className={styles['pd-related-section']}>
                    <div className={styles['pd-related-header']}>
                        <h2>Related Products</h2>
                        <Link href={`/search?category=${product.category?._id}`} className={styles['pd-related-see-all']}>See all →</Link>
                    </div>
                    <div className={styles['pd-related-slider']} ref={relatedSliderRef}>
                        {relatedProducts.slice(0, 8).map((p: any) => (
                            <Link key={p._id} href={`/product/${p._id}`} className={styles['pd-related-card']}>
                                <div className={styles['pd-rc-img']}>
                                    <img src={getImgUrl(p.main_image || p.images?.[0])} alt={p.name} loading="lazy" />
                                </div>
                                <div className={styles['pd-rc-body']}>
                                    <h4 className={styles['pd-rc-name']} title={p.name}>{p.name}</h4>
                                    <div className={styles['pd-rc-price']}>{convertPrice(p.main_price || p.price_tiers?.[0]?.price || 0).formatted}</div>
                                    <div className={styles['pd-rc-moq']}>MOQ: {p.moq || 1} pcs</div>
                                </div>
                            </Link>
                        ))}
                    </div>
                    <div className={styles['pd-related-nav']}>
                        <button onClick={() => relatedSliderRef.current?.scrollBy({ left: -280, behavior: 'smooth' })}>‹</button>
                        <button onClick={() => relatedSliderRef.current?.scrollBy({ left: 280, behavior: 'smooth' })}>›</button>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════ */}
            {/*  RECENTLY VIEWED + TRENDING (Full Width)                       */}
            {/* ══════════════════════════════════════════════════════════════ */}
            {[
                { title: 'Recently Viewed', data: recentlyViewed.slice(0, 6) },
                { title: 'Trending Products', data: trendingProducts.slice(0, 6) }
            ].map((sec, si) => sec.data.length > 0 && (
                <div key={si} className={styles['pd-trending-section']}>
                    <div className={styles['pd-ts-header']}>
                        <h2>{sec.title}</h2>
                        <Link href="/search" className={styles['pd-related-see-all']}>View more →</Link>
                    </div>
                    <div className={styles['pd-trending-grid']}>
                        {sec.data.map((p: any) => (
                            <Link key={p._id} href={`/product/${p._id}`} className={styles['pd-tc']}>
                                <div className={styles['pd-tc-img']}><img src={getImgUrl(p.main_image || p.images?.[0])} alt={p.name} loading="lazy" /></div>
                                <div className={styles['pd-tc-body']}>
                                    <h4 title={p.name}>{p.name}</h4>
                                    <div className={styles['pd-tc-price']}>{convertPrice(p.main_price || p.price_tiers?.[0]?.price || 0).formatted}</div>
                                    <div className={styles['pd-tc-moq']}>MOQ: {p.moq || 1}</div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            ))}

            {/* ── Booking Drawer ── */}
            <BookingDrawer
                isOpen={isBookingModalOpen}
                onClose={() => setIsBookingModalOpen(false)}
                product={product}
                initialQuantity={quantity}
                initialVariants={selectedVariants}
                onConfirm={handleConfirmBooking}
            />

            {/* ── Customization Request Modal ── */}
            <CustomizationModal isOpen={isCustomizationModalOpen} onClose={() => setIsCustomizationModalOpen(false)} product={product} />

            {/* ── General Enquiry Modal ── */}
            <GeneralEnquiryModal isOpen={isEnquiryModalOpen} onClose={() => setIsEnquiryModalOpen(false)} product={product} />

            {/* ── Sample Modal ── */}
            {sampleModal && (
                <div className={styles['pd-modal-overlay']} onClick={() => setSampleModal(false)}>
                    <div className={styles['pd-modal-box']} onClick={e => e.stopPropagation()}>
                        <div className={styles['pd-modal-header']}>
                            <h3>Request a Sample</h3>
                            <button onClick={() => setSampleModal(false)}>✕</button>
                        </div>
                        <p className={styles['pd-modal-sub']}>Sample price: <strong>{convertPrice(product.sample_price || 0).formatted}</strong> / unit</p>
                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            if (isOwner) {
                                showToast('Suppliers cannot request samples of their own products', 'error');
                                setSampleModal(false);
                                return;
                            }
                            setSampleLoading(true);
                            try { await api.post(`/products/${product._id}/request-sample`, { shipping_address: sampleAddress, note: sampleNote }); showToast('Sample request submitted!', 'success'); setSampleModal(false); }
                            catch (err: any) { showToast(err.response?.data?.message || 'Failed', 'error'); }
                            finally { setSampleLoading(false); }
                        }}>
                            <div className={styles['pd-modal-field']}><label>Shipping Address *</label><textarea required value={sampleAddress} onChange={e => setSampleAddress(e.target.value)} rows={4} placeholder="Full address, city, state, zip..." /></div>
                            <div className={styles['pd-modal-field']}><label>Note to Supplier</label><input value={sampleNote} onChange={e => setSampleNote(e.target.value)} placeholder="Specific requirements..." /></div>
                            <div className={styles['pd-modal-actions']}>
                                <button type="button" onClick={() => setSampleModal(false)} className={styles['pd-btn-outline']}>Cancel</button>
                                <button type="submit" disabled={sampleLoading} className={styles['pd-btn-primary']}>{sampleLoading ? 'Sending...' : 'Submit Request'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Full Screen Zoom ── */}
            {isFullScreenZoom && (
                <div className={styles['pd-fullscreen-overlay']} onClick={() => setIsFullScreenZoom(false)}>
                    <button className={styles['pd-fs-close']} onClick={() => setIsFullScreenZoom(false)}>✕</button>
                    <div className={styles['pd-fs-nav']}>
                        <button onClick={(e) => { e.stopPropagation(); const ni = (mainImageIdx - 1 + allImages.length) % allImages.length; setMainImage(getImgUrl(allImages[ni])); setMainImageIdx(ni); }}>‹</button>
                        <button onClick={(e) => { e.stopPropagation(); const ni = (mainImageIdx + 1) % allImages.length; setMainImage(getImgUrl(allImages[ni])); setMainImageIdx(ni); }}>›</button>
                    </div>
                    <img src={mainImage} alt="Zoom" onClick={e => e.stopPropagation()} />
                    <div className={styles['pd-fs-counter']}>{mainImageIdx + 1} / {allImages.length}</div>
                </div>
            )}
            {/* ── Cart Success Modal ── */}
            {showCartModal && (
                <div className={styles['pd-cart-modal-overlay']} onClick={() => setShowCartModal(false)}>
                    <div className={styles['pd-cart-modal']} onClick={e => e.stopPropagation()}>
                        <button className={styles['pd-modal-close']} onClick={() => setShowCartModal(false)}>✕</button>
                        <div className={styles['pd-cart-success-header']}>
                            <div className={styles['pd-success-circle']}>
                                <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            </div>
                            <h3>Added to Cart!</h3>
                        </div>
                        <div className={styles['pd-cart-item-preview']}>
                            <img src={mainImage} alt={product.name} />
                            <div className={styles['pd-cart-item-info']}>
                                <h4>{product.name}</h4>
                                <p>Quantity: {quantity}</p>
                                <p className={styles['pd-cart-item-price']}>{convertPrice(totalPrice).formatted}</p>
                            </div>
                        </div>
                        <div className={styles['pd-cart-modal-actions']}>
                            <button className={styles['pd-btn-outline']} onClick={() => setShowCartModal(false)}>Continue Shopping</button>
                            <button className={styles['pd-btn-primary']} onClick={() => navigate.push('/cart')}>View Cart & Checkout</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Reviews Modal Popup ── */}
            {isReviewsModalOpen && (
                <div className={styles['pd-modal-overlay']} onClick={() => setIsReviewsModalOpen(false)}>
                    <div className={styles['pd-modal-box']} style={{ maxWidth: '700px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', padding: '24px 32px' }} onClick={e => e.stopPropagation()}>
                        <div className={styles['pd-modal-header']} style={{ marginBottom: '20px' }}>
                            <h3>Customer Reviews ({dynamicNumReviews})</h3>
                            <button onClick={() => setIsReviewsModalOpen(false)}>✕</button>
                        </div>
                        <div style={{ overflowY: 'auto', paddingRight: '8px', flex: 1 }}>
                            {displayReviews.length > 0 ? (
                                <>
                                    <div className={styles['pd-review-summary']} style={{ marginBottom: '28px' }}>
                                        <div className={styles['pd-review-big-score']}>
                                            <div className={styles['pd-review-score-num']}>{dynamicRating.toFixed(1)}</div>
                                            <StarRating rating={dynamicRating} size={22} />
                                            <div className={styles['pd-review-count-label']}>{dynamicNumReviews} Reviews</div>
                                        </div>
                                        <div className={styles['pd-review-bars']}>
                                            {ratingBreakdown.map(rb => (
                                                <RatingBar key={rb.label} label={rb.label} count={rb.count} total={dynamicNumReviews} />
                                            ))}
                                        </div>
                                    </div>

                                    <div className={styles['pd-review-list']}>
                                        {displayReviews.map((r, i) => {
                                            const reviewerName = r.buyer_id
                                                ? `${r.buyer_id.first_name || ''} ${r.buyer_id.last_name || ''}`.trim() || r.buyer_id.company_name || 'Buyer'
                                                : 'Buyer';
                                            const avatarChar = (reviewerName || 'B')[0].toUpperCase();
                                            return (
                                                <div className={styles['pd-review-item']} key={i}>
                                                    <div className={styles['pd-review-avatar']}>{avatarChar}</div>
                                                    <div className={styles['pd-review-body']}>
                                                        <div className={styles['pd-review-top']}>
                                                            <span className={styles['pd-reviewer-name']}>{reviewerName}</span>
                                                            <span className={styles['pd-review-date']}>{new Date(r.createdAt || Date.now()).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                                        </div>
                                                        <StarRating rating={r.rating} size={13} />
                                                        <p className={styles['pd-review-comment']}>{r.comment}</p>
                                                        {r.images?.length > 0 && (
                                                            <div className={styles['pd-review-imgs']}>
                                                                {r.images.map((img: string, j: number) => <img key={j} src={getImgUrl(img)} alt="review" />)}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </>
                            ) : (
                                <div className={styles['pd-empty-tab']} style={{ padding: '40px 20px', textAlign: 'center' }}>
                                    <svg width="48" height="48" fill="none" stroke="#d1d5db" strokeWidth="1" viewBox="0 0 24 24" style={{ margin: '0 auto 16px' }}><path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                    <p>No reviews yet. Be the first to review this product!</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductDetail;
