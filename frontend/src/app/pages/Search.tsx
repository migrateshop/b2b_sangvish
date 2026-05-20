'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import api from '@/services/axiosConfig';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import styles from './Search.module.css';

import { getImgUrl } from '@/utils/imageConfig';
const LIMIT = 20;

// ─── Star Rating ───────────────────────────────────────────────
interface StarRatingProps {
    rating: number;
    size?: number;
}

const StarRating: React.FC<StarRatingProps> = ({ rating, size = 12 }) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
        const fill = Math.min(1, Math.max(0, rating - (i - 1)));
        stars.push(<span key={i} className={styles['sr-star']} style={{ fontSize: size }}>{fill >= 1 ? '★' : fill > 0 ? '⭒' : '☆'}</span>);
    }
    return <span className={styles['sr-stars']}>{stars}</span>;
};

interface SupplierBadgeProps {
    supplierObj: any;
    showText?: boolean;
}

const SupplierBadge: React.FC<SupplierBadgeProps> = ({ supplierObj, showText = false }) => {
    if (!supplierObj) return null;
    const planInfo = supplierObj.user_id?.subscription_plan || supplierObj.subscription_plan_info || supplierObj.subscription_plan;
    const isPlanVerified = planInfo?.has_verified_badge;
    const isVerified = supplierObj.is_verified || supplierObj.verification_status === 'verified' || supplierObj.user_id?.is_verified;
    const bColor = planInfo?.badge_color || '#d97706';

    if (isPlanVerified) {
        return (
            <span className={styles['sr-verified-text-badge'] + " " + styles['fs-pro']} style={{ color: bColor, padding: '2px 4px', background: `${bColor}22`, borderRadius: '4px', fontSize: '10px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '3px', whiteSpace: 'nowrap', textTransform: 'uppercase', lineHeight: 1 }}>
                <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>
                VERIFIED PRO
            </span>
        );
    } else if (isVerified) {
        return (
            <span style={{ color: '#16a34a', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', padding: showText ? '2px 0' : 0 }}>
                <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>
                {showText && 'VERIFIED'}
            </span>
        );
    }
    return null;
};

interface SkeletonCardProps {
    viewMode?: string;
}

const SkeletonCard: React.FC<SkeletonCardProps> = ({ viewMode }) => (
    <div className={`${styles['sr-card-skeleton']} ${viewMode === 'list' ? styles['sr-list-skeleton'] : ''}`}>
        <div className={styles['sr-skel-img']} />
        <div className={styles['sr-skel-body']}>
            <div className={styles['sr-skel-line'] + " " + styles['w80']} />
            <div className={styles['sr-skel-line'] + " " + styles['w50']} />
            <div className={styles['sr-skel-line'] + " " + styles['w60']} />
            <div className={styles['sr-skel-line'] + " " + styles['w40']} />
        </div>
    </div>
);

interface ProductCardProps {
    product: any;
    convertPrice: (price: number) => { amount: string; symbol: string; formatted: string };
    isImageSearch?: boolean;
    onInquiry: (e: React.MouseEvent, product: any) => void;
    viewMode?: string;
}

const getProductSlug = (prod: any) => {
    if (prod?.slug) return prod.slug;
    if (prod?.name) {
        return prod.name
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
    return prod?._id || '';
};

const ProductCard: React.FC<ProductCardProps> = ({ product, convertPrice, isImageSearch, onInquiry, viewMode }) => {
    const { t } = useAuth();
    const basePrice = product.main_price || product.price_tiers?.[0]?.price || 0;
    const price = convertPrice(basePrice);
    const imgUrl = getImgUrl(product.images?.[0] || product.main_image);
    const supplierObj = product.supplier_info || product.supplier;
    const reviewCount = product.num_reviews || product.numReviews || 0;

    if (viewMode === 'list') {
        return (
            <div className={styles['sr-list-item'] + " " + styles['alibaba-list-style']}>
                <Link href={`/product/${getProductSlug(product)}`} className={styles['sr-list-img']}>
                    {imgUrl ? <img src={imgUrl} alt={product.name} loading="lazy" /> : <div className={styles['sr-card-img-placeholder']}><svg width="40" height="40" fill="none" stroke="#d1d5db" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg></div>}
                    {(product.isPromoted || product.ppc_bid > 0) && <div className={styles['sr-ad-badge'] + " " + styles['list-ad']}>Ad</div>}
                </Link>
                <div className={styles['sr-list-content']}>
                    <div className={styles['sr-list-main']}>
                        <Link href={`/product/${getProductSlug(product)}`} className={styles['sr-list-title']}>{product.name}</Link>
                        {product.key_attributes && product.key_attributes.length > 0 && (
                            <div className={styles['sr-list-attributes']}>
                                {product.key_attributes.slice(0, 3).map((attr: any, i: number) => (
                                    <span key={i} className={styles['sr-list-attr-pill']} title={`${attr.name}: ${attr.value}`}>{attr.value}</span>
                                ))}
                            </div>
                        )}
                        <div className={styles['sr-card-rating'] + " " + styles['style-list']}>
                            <StarRating rating={product.rating || 4.5} />
                            <span className={styles['sr-rating-val']}>{(product.rating || 4.5).toFixed(1)}</span>
                            {reviewCount > 0 && <span className={styles['sr-reviews-count']}>({reviewCount} reviews)</span>}
                        </div>
                        {supplierObj?.company_name && (
                            <div className={styles['sr-list-supplier-box']}>
                                <div className={styles['sr-card-supplier']}>
                                    <div className={styles['sr-supplier-left']}>
                                        <SupplierBadge supplierObj={supplierObj} />
                                        <Link href={`/supplier/${supplierObj._id}`} className={styles['sr-supplier-name'] + " " + styles['list-hover']}>{supplierObj.company_name}</Link>
                                    </div>
                                    <div className={styles['sr-supplier-tags']}>
                                        {supplierObj.country_code && <span className={styles['sr-supplier-country']}>
                                            <img src={`https://flagcdn.com/16x12/${supplierObj.country_code.toLowerCase()}.png`} alt={supplierObj.country_code} className={styles['sr-list-flag']} />
                                            {supplierObj.country_code}
                                        </span>}
                                        {supplierObj.years_experience && <span className={styles['sr-supplier-exp']}>{supplierObj.years_experience} yrs</span>}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className={styles['sr-list-right']}>
                        <div className={styles['sr-list-price-block']}>
                            <div className={styles['sr-card-price-row']}>
                                <span className={styles['sr-card-price']}>{price.formatted}</span>
                                <span className={styles['sr-card-unit']}>/ {product.unit || 'piece'}</span>
                            </div>
                            {product.moq && <div className={styles['sr-list-moq']}>{t('min_order_label') || 'Min. order'}: <strong>{product.moq}</strong> {product.unit || 'pieces'}</div>}
                        </div>
                        <div className={styles['sr-list-right-bottom']}>
                            {product.sample_available && (
                                <div className={styles['sr-list-sample-tag']}>Sample Available</div>
                            )}
                            <div className={styles['sr-list-actions-group']}>
                                <button className={styles['sr-list-btn'] + " " + styles['primary-v2']} onClick={(e) => onInquiry(e, product)}>
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" /></svg>
                                    {t('contact_supplier') || 'Contact Supplier'}
                                </button>
                                <Link href={`/product/${getProductSlug(product)}`} className={styles['sr-list-btn'] + " " + styles['secondary']}>
                                    {t('view_details') || 'View Details'}
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles['sr-product-card']}>
            <Link href={`/product/${getProductSlug(product)}`} className={styles['sr-card-img-link']}>
                <div className={styles['sr-card-img-wrap']}>
                    {imgUrl ? <img src={imgUrl} alt={product.name} loading="lazy" /> : <div className={styles['sr-card-img-placeholder']}><svg width="40" height="40" fill="none" stroke="#d1d5db" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg></div>}
                    {(product.isPromoted || product.ppc_bid > 0) && <div className={styles['sr-ad-badge']}>Ad</div>}
                </div>
            </Link>
            <div className={styles['sr-card-body']}>
                <Link href={`/product/${getProductSlug(product)}`} className={styles['sr-card-title-link']}>
                    <h3 className={styles['sr-card-title']}>{product.name}</h3>
                </Link>
                <div className={styles['sr-card-price-row']}>
                    <span className={styles['sr-card-price']}>{price.formatted}</span>
                    <span className={styles['sr-card-unit']}>/ {product.unit || 'piece'}</span>
                </div>
                {product.moq && <div className={styles['sr-card-moq']}>{t('min_order_label') || 'Min. order'}: <strong>{product.moq}</strong> {product.unit || 'pieces'}</div>}
                <div className={styles['sr-card-rating']}>
                    <StarRating rating={product.rating || 4.2} />
                    <span className={styles['sr-rating-val']}>{(product.rating || 4.2).toFixed(1)}</span>
                    {reviewCount > 0 && <span className={styles['sr-reviews-count']}>({reviewCount})</span>}
                </div>
                {supplierObj?.company_name && (
                    <div className={styles['sr-card-supplier']}>
                        <div className={styles['sr-supplier-left']}>
                            <SupplierBadge supplierObj={supplierObj} />
                            <span className={styles['sr-supplier-name']}>{supplierObj.company_name}</span>
                        </div>
                        {supplierObj.country_code && <span className={styles['sr-supplier-country']}>{supplierObj.country_code}</span>}
                    </div>
                )}
                <Link href={`/product/${getProductSlug(product)}`} className={styles['sr-inquiry-btn']}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '4px' }}><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    {t('view_details') || 'View Details'}
                </Link>
            </div>
        </div>
    );
};

interface WorldwideCardProps {
    product: any;
    convertPrice: (price: number) => { amount: string; symbol: string; formatted: string };
    onInquiry: (e: React.MouseEvent, product: any) => void;
}

const WorldwideCard: React.FC<WorldwideCardProps> = ({ product, convertPrice, onInquiry }) => {
    const { t } = useAuth();
    const basePrice = product.main_price || product.price_tiers?.[0]?.price || 0;
    const price = convertPrice(basePrice);
    const imgUrl = getImgUrl(product.images?.[0] || product.main_image);
    const supplierObj = product.supplier_info || product.supplier;
    const reviewCount = product.num_reviews || product.numReviews || 0;

    return (
        <div className={styles['sr-ww-card']}>
            <Link href={`/product/${getProductSlug(product)}`} className={styles['sr-ww-img-link']}>
                <div className={styles['sr-ww-img-wrap']}>
                    {imgUrl
                        ? <img src={imgUrl} alt={product.name} loading="lazy" />
                        : <div className={styles['sr-card-img-placeholder']}><svg width="32" height="32" fill="none" stroke="#d1d5db" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg></div>
                    }
                    <div className={styles['sr-ww-badge-overlay']}>
                        {product.is_fast_shipping && <span className={styles['sr-ww-shipping-badge']}>Fast Shipping</span>}
                    </div>
                </div>
            </Link>
            <div className={styles['sr-ww-body']}>
                <Link href={`/product/${getProductSlug(product)}`} className={styles['sr-ww-title']}>{product.name}</Link>
                <div className={styles['sr-ww-price']}>{price.formatted} <span className={styles['sr-card-unit']}>/ {product.unit || 'pc'}</span></div>

                <div className={styles['sr-ww-meta-row']}>
                    {product.moq && <span className={styles['sr-ww-moq']}>{t('moq') || 'MOQ'}: {product.moq}</span>}
                    <div className={styles['sr-ww-rating']}>
                        <span className={styles['sr-ww-star']}>★</span>
                        <span>{product.rating?.toFixed(1) || '5.0'}</span>
                    </div>
                </div>

                {supplierObj?.company_name && (
                    <div className={styles['sr-ww-supplier']}>
                        <div className={styles['sr-ww-sup-main']}>
                            <SupplierBadge supplierObj={supplierObj} />
                            <span className={styles['sr-ww-sup-name']}>{supplierObj.company_name}</span>
                        </div>
                        {supplierObj.country_code && <span className={styles['sr-ww-country']}>{supplierObj.country_code}</span>}
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── Supplier Card ─────────────────────────────────────────────
interface SupplierCardProps {
    supplier: any;
    convertPrice: (price: number) => { amount: string; symbol: string; formatted: string };
    onInquiry: (e: React.MouseEvent, product: any) => void;
}

const SupplierCard: React.FC<SupplierCardProps> = ({ supplier, convertPrice, onInquiry }) => {
    const { t } = useAuth();
    const displayProducts = supplier.products?.length > 0 ? supplier.products : [];
    const seed = supplier._id?.charCodeAt(0) || 12;
    const stats = {
        onTime: 90 + (seed % 10),
        reorder: 15 + (seed % 20),
        responseTime: seed % 4 + 1,
        revenue: (seed * 1.5).toFixed(1) + 'M+'
    };

    let yrsDisplay = 'New';
    if (supplier.createdAt) {
        const d = new Date(supplier.createdAt);
        const n = new Date();
        if (d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth()) {
            yrsDisplay = 'New';
        } else {
            yrsDisplay = Math.max(1, n.getFullYear() - d.getFullYear()) + ' Yrs';
        }
    } else {
        yrsDisplay = (seed % 15 + 1) + ' Yrs';
    }
    const supplierId = supplier.user_id?._id || supplier.user_id;

    return (
        <div className={styles['sr-supplier-premium-card']}>
            <div className={styles['sr-spc-header']}>
                <div className={styles['sr-spc-main-info']}>
                    <div className={styles['sr-spc-logo']}>
                        {supplier.logo ? <img src={getImgUrl(supplier.logo)} alt="" /> : (supplier.company_name?.charAt(0) || 'S')}
                    </div>
                    <div className={styles['sr-spc-text']}>
                        <Link href={`/supplier/${supplierId}`} className={styles['sr-spc-name']}>
                            {supplier.company_name}
                        </Link>
                        <div className={styles['sr-spc-meta']}>
                            <span className={styles['sr-spc-loc']}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                    <circle cx="12" cy="10" r="3"></circle>
                                </svg>
                                {supplier.city || 'City'}, {supplier.country || 'Country'}
                            </span>
                            {supplier.business_type && <span className={styles['sr-spc-type']}>{supplier.business_type}</span>}
                            <span className={styles['sr-spc-rating']}>
                                <StarRating rating={supplier.avgRating || 4.5} size={11} />
                                {supplier.avgRating?.toFixed(1) || '4.5'}/5 ({supplier.reviewCount || (seed % 50 + 10)} reviews)
                            </span>
                        </div>
                        <div className={styles['sr-spc-badges']}>
                            <SupplierBadge supplierObj={supplier} showText={true} />
                            <span className={styles['sr-spc-badge']}>{yrsDisplay}</span>
                            {supplier.staff_size && <span className={styles['sr-spc-badge']}>{supplier.staff_size} staff</span>}
                            {supplier.factory_area && <span className={styles['sr-spc-badge']}>{supplier.factory_area} m²</span>}
                            {supplier.annual_revenue && <span className={styles['sr-spc-badge'] + " " + styles['b']}>{supplier.annual_revenue} revenue</span>}
                        </div>
                    </div>
                </div>
                <div className={styles['sr-spc-actions']}>
                    <Link href={`/supplier/${supplierId}`} className={styles['sr-spc-btn-dark']}>{t('company_profile') || 'View Profile'}</Link>
                </div>
            </div>

            {(supplier.capabilities?.length > 0 || supplier.certifications?.length > 0) && (
                <div className={styles['sr-spc-tags']}>
                    {(supplier.capabilities || []).map((cap: string) => <span key={cap} className={styles['sr-spc-tag']}>{cap}</span>)}
                    {(supplier.certifications || []).map((cert: string) => <span key={cert} className={styles['sr-spc-tag'] + " " + styles['cert']}>{cert}</span>)}
                </div>
            )}

            <div className={styles['sr-spc-body']}>
                <div className={styles['sr-spc-stats']}>
                    <div className={styles['sr-spc-stat']}>
                        <label>On-time delivery</label>
                        <strong>{stats.onTime}%</strong>
                    </div>
                    <div className={styles['sr-spc-stat']}>
                        <label>Reorder rate</label>
                        <strong>{stats.reorder}%</strong>
                    </div>
                    <div className={styles['sr-spc-stat']}>
                        <label>Response time</label>
                        <strong>≤{stats.responseTime}h</strong>
                    </div>
                    <div className={styles['sr-spc-stat']}>
                        <label>Online revenue</label>
                        <strong>₹{stats.revenue}</strong>
                    </div>
                </div>

                <div className={styles['sr-spc-gallery']}>
                    {displayProducts.slice(0, 4).map((prod: any, idx: number) => (
                        <Link key={idx} href={`/product/${getProductSlug(prod)}`} className={styles['sr-spc-gallery-item']} style={{ position: 'relative' }}>
                            <img src={getImgUrl(prod.images?.[0] || prod.main_image)} alt="" />
                            <div className={styles['sr-spc-gallery-price']}>
                                {convertPrice(prod.main_price).formatted}
                            </div>
                        </Link>
                    ))}
                    {displayProducts.length > 0 && (
                        <div className={styles['sr-spc-gallery-main']}>
                            <img src={getImgUrl(displayProducts[0]?.images?.[0] || displayProducts[0]?.main_image)} alt="" />
                            <div className={styles['sr-spc-gallery-play']}><svg viewBox="0 0 24 24" width="24" height="24" fill="white"><path d="M8 5v14l11-7z" /></svg></div>
                        </div>
                    )}
                </div>
            </div>

            {supplier.description && (
                <div className={styles['sr-spc-desc']}>
                    {supplier.description.length > 180 ? supplier.description.substring(0, 180) + '...' : supplier.description}
                </div>
            )}
            <div className={styles['sr-spc-footer']}>
                <svg width="12" height="12" fill="#f59e0b" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                Top sponsor listing
            </div>
        </div>
    );
};

// ─── Main Search Page ──────────────────────────────────────────
const Search = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [viewMode, setViewMode] = useState<string>('grid'); // Default server state
    const [products, setProducts] = useState<any[]>([]);

    // Hydration-safe localStorage retrieval
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedMode = localStorage.getItem('search_view_mode');
            if (savedMode) setViewMode(savedMode);
        }
    }, []);
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [wwProducts, setWwProducts] = useState<any[]>([]);
    const [wwAttributes, setWwAttributes] = useState<any[]>([]);
    const [wwQuickFilters, setWwQuickFilters] = useState<any[]>([]);
    const [allCategories, setAllCategories] = useState<any[]>([]);
    const [filteredCategories, setFilteredCategories] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [dynamicCountries, setDynamicCountries] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [imagePreview, setImagePreview] = useState<string | ArrayBuffer | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeQuickFilter, setActiveQuickFilter] = useState('');
    const [activeAttr, setActiveAttr] = useState('');
    const { user, openLogin, convertPrice, siteSettings, selectedCountry, t } = useAuth();
    const { openChat } = useChat();
    const location = usePathname();

    // URL-derived state
    const keyword = searchParams?.get('keyword') || '';
    const sortBy = searchParams?.get('sort_by') || '';
    const currentPage = parseInt(searchParams?.get('page') || '1');
    const isImageSearch = searchParams?.get('is_image_search') === 'true';
    const tab = searchParams?.get('tab') || 'products';

    const handleViewMode = (mode: string) => {
        setViewMode(mode);
        localStorage.setItem('search_view_mode', mode);
    };

    const setSearchParams = (params: URLSearchParams) => {
        router.push(`${location}?${params.toString()}`, { scroll: false });
    };

    const [localMinPrice, setLocalMinPrice] = useState(searchParams?.get('min_price') || '');
    const [localMaxPrice, setLocalMaxPrice] = useState(searchParams?.get('max_price') || '');
    const [localMoq, setLocalMoq] = useState(searchParams?.get('min_moq') || '');

    // Fetch categories & locations
    useEffect(() => {
        api.get('/categories').then(({ data }) => {
            setAllCategories(data);
            setFilteredCategories(data.filter((c: any) => !c.parent));
        }).catch(() => { });

        api.get('/company/locations').then(({ data }) => {
            setDynamicCountries(data);
        }).catch(() => { });
    }, []);

    // Helper to get breadcrumbs based on selected category
    const getBreadcrumbs = (catId: string | null) => {
        if (!catId || allCategories.length === 0) return [];
        const crumbs: any[] = [];
        let curId: string | null = catId;
        while (curId) {
            const cat = allCategories.find(c => c._id === curId);
            if (cat) {
                crumbs.unshift(cat);
                curId = typeof cat.parent === 'string' ? cat.parent : cat.parent?._id;
            } else {
                curId = null;
            }
        }
        return crumbs;
    };

    const breadcrumbs = getBreadcrumbs(searchParams?.get('category_id'));

    // Update related categories from results or selected category depth
    useEffect(() => {
        const catId = searchParams?.get('category_id');

        // PRODUCT-BASED SEARCH (keyword present): Show parent (root) categories
        if (keyword) {
            setFilteredCategories(allCategories.filter(c => !c.parent));
            return;
        }

        // CATEGORY-BASED SEARCH: show subcategories OR hide filter if none exist
        if (catId && allCategories.length > 0) {
            const current = allCategories.find(c => c._id === catId);
            if (current) {
                // Look for subcategories
                const children = allCategories.filter(c => {
                    const pid = typeof c.parent === 'string' ? c.parent : c.parent?._id;
                    return pid === catId;
                });

                if (children.length > 0) {
                    setFilteredCategories(children);
                    return;
                } else {
                    // IF NO SUBCATEGORY → REMOVE category filter completely from sidebar
                    setFilteredCategories([]);
                    return;
                }
            }
        }

        // Default Fallback or Generic results: show top-level parents
        setFilteredCategories(allCategories.filter(c => !c.parent));
    }, [allCategories, keyword, searchParams?.get('category_id')]);

    // Main fetch
    const fetchResults = useCallback(async () => {
        setLoading(true);
        setError(null);
        const imageFileFromWindow = typeof window !== 'undefined' ? (window as any).imageSearchFile : null;
        try {
            if (isImageSearch && imageFileFromWindow) {
                const formData = new FormData();
                formData.append('image', imageFileFromWindow);
                const reader = new FileReader();
                reader.onloadend = () => setImagePreview(reader.result);
                reader.readAsDataURL(imageFileFromWindow);
                const { data } = await api.post('/products/search-image', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                setProducts(data.products || []);
                setTotal(data.products?.length || 0);
                setTotalPages(1);
                // Cleanup
                if (typeof window !== 'undefined') (window as any).imageSearchFile = null;
            } else {
                setImagePreview(null);
                const params = {
                    keyword: searchParams?.get('keyword'),
                    category_id: searchParams?.get('category_id'),
                    min_price: searchParams?.get('min_price'),
                    max_price: searchParams?.get('max_price'),
                    min_moq: searchParams?.get('min_moq'),
                    verified_only: searchParams?.get('verified_only'),
                    country: searchParams?.get('country'),
                    certifications: searchParams?.get('certifications'),
                    supplier_type: searchParams?.get('supplier_type'),
                    rating_min: searchParams?.get('rating_min'),
                    capabilities: searchParams?.get('capabilities'),
                    verified_pro: searchParams?.get('verified_pro'),
                    trade_assurance: searchParams?.get('trade_assurance'),
                    moq_under_5: searchParams?.get('moq_under_5'),
                    five_plus_years: searchParams?.get('five_plus_years'),
                    rating_45: searchParams?.get('rating_45'),
                    ce_cert: searchParams?.get('ce_cert'),
                    emc_cert: searchParams?.get('emc_cert'),
                    sort_by: searchParams?.get('sort_by'),
                    section: searchParams?.get('section'),
                    bulk: searchParams?.get('bulk'),
                    sample_available: searchParams?.get('sample_available'),
                    page: searchParams?.get('page') || 1,
                    limit: LIMIT,
                    user_country: selectedCountry || 'IN',
                };

                if (tab === 'suppliers') {
                    const { data } = await api.get('/company/search', { params });
                    setSuppliers(data.companies || []);
                    setTotal(data.total || 0);
                    setTotalPages(data.pages || Math.ceil((data.total || 0) / LIMIT));
                } else if (tab === 'worldwide') {
                    const wwParams = {
                        ...params,
                        attr: activeAttr || undefined,
                        quick_filter: activeQuickFilter || undefined,
                    };
                    const { data } = await api.get('/products/worldwide-search', { params: wwParams });
                    setWwProducts(data.products || []);
                    setTotal(data.total || 0);
                    setTotalPages(data.pages || Math.ceil((data.total || 0) / LIMIT));
                    setWwAttributes(data.attributes || []);
                    setWwQuickFilters(data.quickFilters || []);
                } else {
                    const { data } = await api.get('/products', { params });
                    setProducts(data.products || []);
                    setTotal(data.total || 0);
                    setTotalPages(data.pages || Math.ceil((data.total || 0) / LIMIT));
                }
            }
        } catch (err: any) {
            setError('Failed to load results. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [searchParams, tab, isImageSearch, activeAttr, activeQuickFilter, selectedCountry]);

    useEffect(() => { fetchResults(); }, [fetchResults]);

    useEffect(() => {
        if (tab !== 'worldwide') { setActiveAttr(''); setActiveQuickFilter(''); }
        if (tab !== 'suppliers') setSuppliers([]);
        if (tab !== 'products') setProducts([]);
    }, [tab]);

    // Prevent body scrolling when mobile filter drawer is open
    useEffect(() => {
        if (sidebarOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [sidebarOpen]);

    const updateFilter = (key: string, value: string) => {
        const p = new URLSearchParams(searchParams || undefined);

        // Handle Multi-select for certifications/capabilities if needed
        if (['certifications', 'capabilities'].includes(key)) {
            const current = p.get(key)?.split(',').filter(Boolean) || [];
            if (current.includes(value)) {
                const next = current.filter(v => v !== value);
                if (next.length) p.set(key, next.join(',')); else p.delete(key);
            } else {
                p.set(key, [...current, value].join(','));
            }
        } else {
            if (value) p.set(key, value); else p.delete(key);
        }

        p.set('page', '1');
        setSearchParams(p);
    };

    const removeFilter = (key: string) => {
        if (key === 'all') {
            const kw = searchParams?.get('keyword') || '';
            const t = searchParams?.get('tab') || 'products';
            const catId = searchParams?.get('category_id');
            const newParams: any = { tab: t };
            if (kw) newParams.keyword = kw;
            if (catId) newParams.category_id = catId;
            setSearchParams(new URLSearchParams(newParams));

            // Reset local states
            setLocalMinPrice('');
            setLocalMaxPrice('');
            setLocalMoq('');
        } else {
            const p = new URLSearchParams(searchParams || undefined);
            p.delete(key);
            if (key === 'min_price') setLocalMinPrice('');
            if (key === 'max_price') setLocalMaxPrice('');
            if (key === 'min_moq') setLocalMoq('');
            setSearchParams(p);
        }
    };

    const setTab = (t: string) => {
        const p = new URLSearchParams(searchParams || undefined);
        p.set('tab', t);
        p.set('page', '1');
        setSearchParams(p);
    };

    const goToPage = (pg: number) => {
        const p = new URLSearchParams(searchParams || undefined);
        p.set('page', pg.toString());
        setSearchParams(p);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const applySidebarPrice = () => {
        const p = new URLSearchParams(searchParams || undefined);
        if (localMinPrice) p.set('min_price', localMinPrice); else p.delete('min_price');
        if (localMaxPrice) p.set('max_price', localMaxPrice); else p.delete('max_price');
        p.set('page', '1');
        setSearchParams(p);
    };

    const applySidebarMoq = () => {
        const p = new URLSearchParams(searchParams || undefined);
        if (localMoq) p.set('min_moq', localMoq); else p.delete('min_moq');
        p.set('page', '1');
        setSearchParams(p);
    };

    const handleInquiry = (e: React.MouseEvent, product: any) => {
        e.preventDefault();
        e.stopPropagation();
        if (!user) { openLogin(); return; }
        const sup = product.supplier_info || product.supplier;
        if (sup) openChat(sup, product);
    };

    const activeFilters: any[] = [];
    if (searchParams?.get('category_id')) activeFilters.push({ key: 'category_id', label: filteredCategories.find(c => c._id === searchParams?.get('category_id'))?.title || 'Category' });
    if (searchParams?.get('min_price')) activeFilters.push({ key: 'min_price', label: `Min $${searchParams?.get('min_price')}` });
    if (searchParams?.get('max_price')) activeFilters.push({ key: 'max_price', label: `Max $${searchParams?.get('max_price')}` });
    if (searchParams?.get('verified_only') === 'true') activeFilters.push({ key: 'verified_only', label: 'Verified' });
    if (searchParams?.get('verified_pro') === 'true') activeFilters.push({ key: 'verified_pro', label: 'Verified PRO' });
    if (searchParams?.get('trade_assurance') === 'true') activeFilters.push({ key: 'trade_assurance', label: 'Trade Assurance' });
    if (searchParams?.get('country')) activeFilters.push({ key: 'country', label: searchParams?.get('country') });
    if (searchParams?.get('min_moq')) activeFilters.push({ key: 'min_moq', label: `MOQ ≤${searchParams?.get('min_moq')}` });
    if (searchParams?.get('moq_under_5') === 'true') activeFilters.push({ key: 'moq_under_5', label: 'MOQ ≤ 5' });
    if (searchParams?.get('rating_min')) activeFilters.push({ key: 'rating_min', label: `${searchParams?.get('rating_min')}★+` });
    if (searchParams?.get('rating_45') === 'true') activeFilters.push({ key: 'rating_45', label: '4.5+ Rating' });
    if (searchParams?.get('fast_customization') === 'true') activeFilters.push({ key: 'fast_customization', label: 'Fast Customization' });
    if (searchParams?.get('bulk') === 'true') activeFilters.push({ key: 'bulk', label: 'Bulk Orders' });
    if (searchParams?.get('sample_available') === 'true') activeFilters.push({ key: 'sample_available', label: 'Free Samples' });

    // Multi-select tags
    const certs = searchParams?.get('certifications')?.split(',').filter(Boolean) || [];
    certs.forEach(c => activeFilters.push({ key: 'certifications', label: c, value: c }));

    const caps = searchParams?.get('capabilities')?.split(',').filter(Boolean) || [];
    caps.forEach(c => activeFilters.push({ key: 'capabilities', label: c, value: c }));

    const sortOptions = [
        { key: '', label: t('relevance') || 'Relevance' },
        { key: 'ranking', label: t('best_selling') || 'Best Selling' },
        { key: 'price_asc', label: t('lowest_price') || 'Lowest Price' },
        { key: 'price_desc', label: t('highest_price') || 'Highest Price' },
        { key: 'rating', label: t('best_rated') || 'Best Rated' },
        { key: 'recent', label: t('newest') || 'Newest' },
    ];

    const countries = [
        { code: 'CN', name: 'China' }, { code: 'IN', name: 'India' }, { code: 'US', name: 'United States' },
        { code: 'VN', name: 'Vietnam' }, { code: 'TR', name: 'Turkey' }, { code: 'IT', name: 'Italy' },
    ];

    // Current displayed items
    const displayItems = tab === 'suppliers' ? suppliers : tab === 'worldwide' ? wwProducts : products;

    const isCatSearch = !!searchParams?.get('category_id') && !keyword;
    const isKwSearch = !!keyword;

    const featuredSupplier = products?.[0]?.supplier_info || products?.[0]?.supplier;
    const featuredProducts = products?.slice(0, 3) || [];
    const activeCategoryObj = allCategories.find(c => c._id === searchParams?.get('category_id'));
    const dynamicAttrs = Array.from(new Set(products.map((p: any) => p.category?.title).filter(Boolean))).slice(0, 10);


    return (
        <div className={styles['sr-page']}>
            {sidebarOpen && <div className={styles['sr-sidebar-overlay']} onClick={() => setSidebarOpen(false)} />}

            {/* ─── Tab Bar (Enhanced with Search Input) ─── */}
            {(isKwSearch || isImageSearch || true) && (
                <div className={styles['sr-tab-bar']}>
                    <div className={styles['sr-tab-inner']}>
                        <div className={styles['sr-tab-links']}>
                            <Link href="/ai-sourcing" className={styles['sr-tab-btn'] + " " + styles['ai-mode']} style={{ textDecoration: 'none' }}>
                                {t('ai_mode') || 'AI Mode'}
                            </Link>
                            {[
                                { key: 'products', label: t('products') || 'Products' },
                                { key: 'suppliers', label: t('manufacturers') || 'Manufacturers' },
                                { key: 'worldwide', label: t('worldwide') || 'Worldwide' },
                            ].map(currTab => (
                                <button
                                    key={currTab.key}
                                    className={`${styles['sr-tab-btn']} ${tab === currTab.key ? styles['active'] : ''}`}
                                    onClick={() => setTab(currTab.key)}
                                >
                                    {currTab.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className={styles['sr-layout-container']}>
                {/* 1. Breadcrumb Navigation (For Category Search Only) */}
                {isCatSearch && breadcrumbs.length > 0 && (
                    <div className={styles['sr-breadcrumbs-alibaba']}>
                        <Link href="/">{siteSettings?.site_name || 'B2B Marketplace'}</Link>
                        {breadcrumbs.map((crumb, idx) => (
                            <React.Fragment key={crumb._id}>
                                <span className={styles['sr-crumb-sep']}>›</span>
                                <Link
                                    href={`/search?category_id=${crumb._id}`}
                                    className={idx === breadcrumbs.length - 1 ? styles['last'] : ''}
                                >
                                    {crumb.title}
                                </Link>
                            </React.Fragment>
                        ))}
                    </div>
                )}

                <div className={`${styles['sr-layout']} ${breadcrumbs.length > 0 ? styles['sr-layout--with-breadcrumbs'] : ''}`}>
                    {/* ─── Right Sidebar Drawer ─── */}
                    <aside className={`${styles['sr-sidebar']} ${sidebarOpen ? styles['open'] : ''}`}>
                        <div className={styles['sr-sidebar-header-sticky']}>
                            <div className={styles['sr-sidebar-title']}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 21v-7m0-4V3m8 18v-9m0-4V3m8 18v-5m0-4V3M1 14h6m2-6h6m2 8h6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                {t('filters') || 'Filters'}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                {activeFilters.length > 0 && (
                                    <button className={styles['sr-clear-all']} onClick={() => removeFilter('all')}>{t('clear_all') || 'Clear All'}</button>
                                )}
                                <button className={styles['sr-sidebar-close-btn']} onClick={() => setSidebarOpen(false)}>
                                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        </div>

                        {/* A. Categories Section (Show subcategories for Category Search ONLY) */}
                        {isCatSearch && filteredCategories.length > 0 && (
                            <div className={styles['sr-filter-section']}>
                                <h4 className={styles['sr-filter-title']}>{t('categories') || 'Categories'}</h4>
                                <ul className={styles['sr-cat-list']}>
                                    {filteredCategories.map(cat => (
                                        <li key={cat._id}>
                                            <button
                                                className={`${styles['sr-cat-item']} ${searchParams.get('category_id') === cat._id ? styles['active'] : ''}`}
                                                onClick={() => updateFilter('category_id', cat._id)}
                                            >
                                                <span className={styles['sr-cat-item-text']}>{cat.title}</span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}



                        {/* 2. Global Quick Filters sidebar entry */}
                        <div className={styles['sr-filter-section']}>
                            <h4 className={styles['sr-filter-title']}>{t('supplier_types') || 'Supplier types'}</h4>
                            <div className={styles['sr-filter-options']}>
                                <label className={`${styles['sr-filter-opt']} ${searchParams.get('trade_assurance') === 'true' ? styles['active'] : ''}`}>
                                    <input type="checkbox" checked={searchParams.get('trade_assurance') === 'true'} onChange={() => updateFilter('trade_assurance', searchParams.get('trade_assurance') === 'true' ? '' : 'true')} />
                                    <div className={styles['sr-opt-content']}>
                                        <div className={styles['sr-opt-main']}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                                            <span className={styles['sr-feature-tag'] + " " + styles['ta']}>{t('trade_assurance') || 'Trade Assurance'}</span>
                                        </div>
                                    </div>
                                </label>
                                <label className={`${styles['sr-filter-opt']} ${searchParams.get('verified_only') === 'true' ? styles['active'] : ''}`}>
                                    <input type="checkbox" checked={searchParams.get('verified_only') === 'true'} onChange={() => updateFilter('verified_only', searchParams.get('verified_only') === 'true' ? '' : 'true')} />
                                    <div className={styles['sr-opt-content']}>
                                        <div className={styles['sr-opt-main']}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                                            <span>{t('verified_supplier') || 'Verified Supplier'}</span>
                                        </div>
                                    </div>
                                </label>
                                <label className={`${styles['sr-filter-opt']} ${searchParams.get('verified_pro') === 'true' ? styles['active'] : ''}`}>
                                    <input type="checkbox" checked={searchParams.get('verified_pro') === 'true'} onChange={() => updateFilter('verified_pro', searchParams.get('verified_pro') === 'true' ? '' : 'true')} />
                                    <div className={styles['sr-opt-content']}>
                                        <div className={styles['sr-opt-main']}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                                            <span className={styles['sr-pro-text']}>{t('verified_pro') || 'Verified PRO'}</span>
                                        </div>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* 3. Price / MOQ (Product & Worldwide) */}
                        {tab !== 'suppliers' && (
                            <>
                                <div className={styles['sr-filter-section']}>
                                    <h4 className={styles['sr-filter-title']}>{t('price_range') || 'Price Range'}</h4>
                                    <div className={styles['sr-price-inputs']}>
                                        <input type="number" placeholder="Min" value={localMinPrice} onChange={e => setLocalMinPrice(e.target.value)} className={styles['sr-filter-input']} />
                                        <span className={styles['sr-price-sep']}>–</span>
                                        <input type="number" placeholder="Max" value={localMaxPrice} onChange={e => setLocalMaxPrice(e.target.value)} className={styles['sr-filter-input']} />
                                        <button className={styles['sr-filter-go']} onClick={applySidebarPrice}>Go</button>
                                    </div>
                                </div>
                                <div className={styles['sr-filter-section']}>
                                    <h4 className={styles['sr-filter-title']}>Min. Order Qty</h4>
                                    <div className={styles['sr-price-inputs']}>
                                        <input type="number" placeholder="Max MOQ" value={localMoq} onChange={e => setLocalMoq(e.target.value)} className={styles['sr-filter-input'] + " " + styles['sr-filter-input--full']} />
                                        <button className={styles['sr-filter-go']} onClick={applySidebarMoq}>Go</button>
                                    </div>
                                </div>
                            </>
                        )}



                        {/* 6. Location (ALL tabs) - Dynamic */}
                        <div className={styles['sr-filter-section']}>
                            <h4 className={styles['sr-filter-title']}>Supplier Location</h4>
                            <ul className={styles['sr-cat-list']}>
                                {Array.from(new Set(
                                    ['United States', 'China', 'India', 'Vietnam', 'Turkey', 'Italy', ...dynamicCountries]
                                        .map(loc => loc.trim())
                                )).filter((loc, index, self) => 
                                    self.findIndex(l => l.toLowerCase() === loc.toLowerCase()) === index
                                ).map(loc => (
                                    <li key={loc}>
                                        <button className={`${styles['sr-cat-item']} ${searchParams.get('country') === loc ? styles['active'] : ''}`} onClick={() => updateFilter('country', searchParams.get('country') === loc ? '' : loc)}>
                                            <input type="checkbox" checked={searchParams.get('country') === loc} className={styles['sr-check-input']} readOnly />
                                            <span>{loc}</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>

                    </aside>

                    {/* ─── Main Content ─── */}
                    <main className={styles['sr-main']}>
                        {/* Result Summary */}
                        {isCatSearch && activeCategoryObj ? (
                            <div className={styles['sr-cat-hero']}>
                                <h1>{activeCategoryObj.title}</h1>
                                <p className={styles['sr-cat-hero-sub']}>{total.toLocaleString()}{total >= 999 ? '+' : ''} {t('products') || 'products'} {t('available_sourced') || 'available — sourced from verified global suppliers'}</p>
                            </div>
                        ) : (
                            <div className={styles['sr-result-header'] + " " + styles['alibaba-v2']}>
                                <div className={styles['sr-result-left'] + " " + styles['alibaba-style']}>
                                    {isKwSearch ? (
                                        <h1 className={styles['sr-result-kw']}>"{keyword}"</h1>
                                    ) : (
                                        <h1 className={styles['sr-cat-main-title']}>{t('all_categories') || 'All Categories'} ({total.toLocaleString()}{total >= 999 ? '+' : ''} {t('products') || 'products'})</h1>
                                    )}
                                </div>
                                <div className={styles['sr-filter-trigger-row']}>
                                    <button className={styles['sr-filter-btn']} onClick={() => setSidebarOpen(true)}>
                                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M4 6h16M4 12h10M4 18h4" strokeLinecap="round" /></svg>
                                        {t('filter') || 'Filter'}
                                        {activeFilters.length > 0 && (
                                            <span className={styles['sr-filter-active-count']}>{activeFilters.length}</span>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* 2. Dynamic “Deep Search Results” Banner (Product Search only) */}
                        {isKwSearch && tab === 'products' && featuredSupplier && (
                            <div className={`${styles['sr-deep-search-banner']} ${viewMode === 'list' ? styles['list-view'] : ''}`}>
                                <div className={styles['sr-ds-ribbon']}></div>
                                <div className={styles['sr-ds-inner']}>
                                    <div className={styles['sr-ds-left-col']}>
                                        <div className={styles['sr-ds-sup-row']}>
                                            <div className={styles['sr-ds-sup-avatar']}>
                                                {featuredSupplier.logo
                                                    ? <img src={getImgUrl(featuredSupplier.logo)} alt="" />
                                                    : (featuredSupplier.company_name?.charAt(0) || featuredSupplier.user_id?.first_name?.charAt(0) || 'S')
                                                }
                                            </div>
                                            <div className={styles['sr-ds-sup-info']}>
                                                <div className={styles['sr-ds-sup-eyebrow']}>
                                                    <span className={styles['sr-ds-badge']}>
                                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.2h7.6l-6.2 4.5 2.4 7.3-6.2-4.5-6.2 4.5 2.4-7.3-6.2-4.5h7.6z" /></svg>
                                                        Deep Search Match
                                                    </span>
                                                </div>
                                                <div className={styles['sr-ds-sup-name']}>{featuredSupplier.company_name || `${featuredSupplier.user_id?.first_name} ${featuredSupplier.user_id?.last_name}`}</div>
                                                <div className={styles['sr-ds-sup-sub']}>
                                                    {(featuredSupplier.verification_status === 'verified' || featuredSupplier.user_id?.is_verified) ? 'Verified Global Partner' : 'Registered Member'} • Since {featuredSupplier.createdAt ? new Date(featuredSupplier.createdAt).getFullYear() : '2015'}
                                                </div>
                                            </div>
                                            <div className={styles['sr-ds-sup-actions']}>
                                                <Link href={`/supplier/${featuredSupplier.user_id?._id || featuredSupplier.user_id || products[0]?.supplier_info?._id}`} className={styles['sr-ds-btn'] + " " + styles['secondary']}>
                                                    View Profile
                                                </Link>
                                                <button className={styles['sr-ds-btn'] + " " + styles['primary']} onClick={(e) => handleInquiry(e, products[0])}>
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                                                    Contact Now
                                                </button>
                                            </div>
                                        </div>

                                        <div className={styles['sr-ds-stats-footer'] + " " + styles['internal']}>
                                            <div className={styles['sr-ds-stat-item']}>
                                                <span className={styles['sr-ds-stat-val']}>{featuredSupplier.on_time_rate || '98%'}</span>
                                                <span className={styles['sr-ds-stat-label']}>On-time delivery</span>
                                            </div>
                                            <div className={styles['sr-ds-stat-item']}>
                                                <span className={styles['sr-ds-stat-val']}>{featuredSupplier.response_rate || featuredSupplier.user_id?.response_rate ? `${featuredSupplier.response_rate || featuredSupplier.user_id?.response_rate}%` : 'High'}</span>
                                                <span className={styles['sr-ds-stat-label']}>Response Rate</span>
                                            </div>
                                            <div className={styles['sr-ds-stat-item']}>
                                                <span className={styles['sr-ds-stat-val']}>{featuredSupplier.annual_revenue || '$50M+'}</span>
                                                <span className={styles['sr-ds-stat-label']}>Annual Revenue</span>
                                            </div>
                                            <div className={styles['sr-ds-stat-item']}>
                                                <span className={styles['sr-ds-stat-val']}>{featuredSupplier.years_experience || (featuredSupplier.createdAt ? new Date().getFullYear() - new Date(featuredSupplier.createdAt).getFullYear() : 5)}</span>
                                                <span className={styles['sr-ds-stat-label']}>Years Sourcing</span>
                                            </div>
                                            <div className={styles['sr-ds-stat-item']}>
                                                <span className={styles['sr-ds-stat-val']}>{featuredSupplier.staff_size || '100+'}</span>
                                                <span className={styles['sr-ds-stat-label']}>Staff Size</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className={styles['sr-ds-right-col']}>
                                        <div className={styles['sr-ds-products-row']}>
                                            {featuredProducts.slice(0, 5).map((p, i) => (
                                                <Link href={`/product/${p.slug || p._id}`} key={p._id || i} className={styles['sr-ds-series-card']}>
                                                    <div className={styles['sr-ds-img-wrap']}>
                                                        <img src={getImgUrl(p.images?.[0] || p.main_image)} alt={p.name} loading="lazy" />
                                                    </div>
                                                    <div className={styles['sr-ds-tile-info']}>
                                                        <span className={styles['sr-ds-price']}>{convertPrice(p.main_price).formatted}</span>
                                                        <span className={styles['sr-ds-tile-cat']}>{p.category?.title || 'Featured'}</span>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}


                        {/* 3. Attributes Filter Bar (Product Search only) */}
                        {isKwSearch && tab === 'products' && dynamicAttrs.length > 0 && (
                            <div className={styles['sr-attribute-bar'] + " " + styles['alibaba-v3']}>
                                <span className={styles['sr-attr-label']}>Related Categories:</span>
                                <div className={styles['sr-attr-scroll']}>
                                    {dynamicAttrs.map(attr => (
                                        <button
                                            key={attr}
                                            className={`sr-attr-chip v3 ${activeAttr === attr ? 'active' : ''}`}
                                            onClick={() => setActiveAttr(activeAttr === attr ? '' : attr)}
                                        >
                                            {attr}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}


                        {/* 4. Quick Filter Bar (Product Search only) - HIDDEN BY USER REQUEST */}
                        {/* 
                        {isKwSearch && tab === 'products' && (
                            <div className={styles['sr-top-quick-filters'] + " " + styles['v3'] + " " + styles['d-none']}>
                                <span className={styles['sr-attr-label']}>Select by:</span>
                                <div className={styles['sr-qf-scroll']}>
                                    {[
                                        { key: 'trade_assurance', label: 'Trade Assurance' },
                                        { key: 'moq_under_5', label: 'MOQ ≤ 5' },
                                        { key: 'verified_only', label: 'Verified Supplier' },
                                        { key: 'five_plus_years', label: '5+ Years Supplier' },
                                        { key: 'rating_45', label: '4.5+ Supplier Rating' },
                                        { key: 'ce_cert', label: 'CE Certified' },
                                        { key: 'emc_cert', label: 'EMC Certified' }
                                    ].map(filter => (
                                        <button
                                            key={filter.key}
                                            className={`sr-quick-filter-pill v3 ${searchParams.get(filter.key) === 'true' ? 'active' : ''}`}
                                            onClick={() => updateFilter(filter.key, searchParams.get(filter.key) === 'true' ? '' : 'true')}
                                        >
                                            {filter.label}
                                        </button>
                                    ))}
                                </div>
                                <button className={styles['sr-clear-all-link']} onClick={() => removeFilter('all')}>Clear all</button>
                            </div>
                        )}
                        */}

                        {/* Active Filters */}
                        {activeFilters.length > 0 && (
                            <div className={styles['sr-active-filters']}>
                                {activeFilters.map(f => (
                                    <button
                                        key={f.key + (f.value || '')}
                                        className={styles['sr-active-tag']}
                                        onClick={() => (f.key === 'certifications' || f.key === 'capabilities') ? updateFilter(f.key, f.value) : removeFilter(f.key)}
                                    >
                                        {f.label} <span className={styles['sr-tag-remove']}>✕</span>
                                    </button>
                                ))}
                                <button className={styles['sr-clear-all']} onClick={() => removeFilter('all')}>Clear All</button>
                            </div>
                        )}

                        {/* Image search preview */}
                        {isImageSearch && imagePreview && (
                            <div className={styles['sr-img-search-preview']}>
                                <img src={imagePreview as string} alt="Search" />
                                <div>
                                    <p>Searching by image</p>
                                    <button onClick={() => removeFilter('is_image_search')}>Clear</button>
                                </div>
                            </div>
                        )}

                        {/* ─── WORLDWIDE TAB: Deep Search Header ─── */}
                        {tab === 'worldwide' && (wwAttributes.length > 0 || wwQuickFilters.length > 0) && (
                            <div className={styles['sr-deep-search-results']}>
                                <div className={styles['sr-ds-filter-body']}>
                                    {/* Attribute chips — dynamic from product names */}
                                    {wwAttributes.length > 0 && (
                                        <div className={styles['sr-ds-f-row']}>
                                            <span className={styles['sr-ds-f-label']}>Attributes</span>
                                            <div className={styles['sr-ds-switch-group']}>
                                                {wwAttributes.map(a => {
                                                    const attrWord = a.split(' ').slice(1).join(' ');
                                                    return (
                                                        <button
                                                            key={a}
                                                            className={`${styles['sr-ds-chip']} ${activeAttr === attrWord ? styles['active'] : ''}`}
                                                            onClick={() => setActiveAttr(activeAttr === attrWord ? '' : attrWord)}
                                                        >
                                                            {a}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Quick filter chips — dynamic */}
                                    {wwQuickFilters.length > 0 && (
                                        <div className={styles['sr-ds-f-row']}>
                                            <span className={styles['sr-ds-f-label']}>Select by</span>
                                            <div className={styles['sr-ds-switch-group']}>
                                                {wwQuickFilters.map(qf => (
                                                    <button
                                                        key={qf.key}
                                                        className={`${styles['sr-ds-chip']} ${styles['outline']} ${activeQuickFilter === qf.key ? styles['active'] : ''}`}
                                                        onClick={() => setActiveQuickFilter(activeQuickFilter === qf.key ? '' : qf.key)}
                                                    >
                                                        {qf.label}
                                                    </button>
                                                ))}
                                            </div>
                                            {(activeAttr || activeQuickFilter || searchParams.get('country')) && (
                                                <button className={styles['sr-ds-clear']} onClick={() => { setActiveAttr(''); setActiveQuickFilter(''); removeFilter('country'); }}>Clear all</button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Sort Bar (hidden for worldwide — filters replace it) */}
                        {tab !== 'worldwide' && (
                            <div className={styles['sr-sort-bar']}>
                                <div className={styles['sr-sort-left']}>
                                    {sortOptions.map(opt => (
                                        <button key={opt.key} className={`${styles['sr-sort-btn']} ${sortBy === opt.key ? styles['active'] : ''}`} onClick={() => updateFilter('sort_by', opt.key)}>
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                                {tab !== 'suppliers' && (
                                    <div className={styles['sr-sort-right']}>
                                        <button className={`${styles['sr-view-btn']} ${viewMode === 'grid' ? styles['active'] : ''}`} onClick={() => handleViewMode('grid')} title="Grid View">
                                            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M3 3h7v7H3zm11 0h7v7h-7zm-11 11h7v7H3zm11 0h7v7h-7z" /></svg>
                                        </button>
                                        <button className={`${styles['sr-view-btn']} ${viewMode === 'list' ? styles['active'] : ''}`} onClick={() => handleViewMode('list')} title="List View">
                                            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M3 4h18v2H3zm0 7h18v2H3zm0 7h18v2H3z" /></svg>
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Results */}
                        {loading ? (
                            <div className={tab === 'suppliers' ? styles['sr-suppliers-list'] : tab === 'worldwide' ? styles['sr-ww-grid'] : `${styles['sr-grid']} ${viewMode === 'list' ? styles['sr-list-mode'] : ''}`}>
                                {[...Array(tab === 'worldwide' ? 10 : 8)].map((_, i) => <SkeletonCard key={i} viewMode={tab === 'suppliers' ? 'grid' : viewMode} />)}
                            </div>
                        ) : error ? (
                            <div className={styles['sr-empty']}>
                                <div className={styles['sr-empty-icon']}>⚠️</div>
                                <h2>{error}</h2>
                                <button className={styles['sr-empty-btn']} onClick={fetchResults}>Retry</button>
                            </div>
                        ) : displayItems.length === 0 ? (
                            <div className={styles['sr-empty']}>
                                <div className={styles['sr-empty-icon']}>🔍</div>
                                <h2>No results found</h2>
                                <p>Try different keywords or adjust your filters.</p>
                                <button className={styles['sr-empty-btn']} onClick={() => removeFilter('all')}>Clear Filters</button>
                            </div>
                        ) : (
                            <>
                                {tab === 'suppliers' && (
                                    <div className={styles['sr-suppliers-list']}>
                                        {suppliers.map(item => (
                                            <SupplierCard key={item._id} supplier={item} convertPrice={convertPrice} onInquiry={handleInquiry} />
                                        ))}
                                    </div>
                                )}

                                {tab === 'worldwide' && (
                                    <div className={styles['sr-ww-grid']}>
                                        {wwProducts.map(item => (
                                            <WorldwideCard key={item._id} product={item} convertPrice={convertPrice} onInquiry={handleInquiry} />
                                        ))}
                                    </div>
                                )}

                                {tab === 'products' && (
                                    <div className={`${styles['sr-grid']} ${viewMode === 'list' ? styles['sr-list-mode'] : ''}`}>
                                        {products.map(item => (
                                            <ProductCard key={item._id} product={item} convertPrice={convertPrice} isImageSearch={isImageSearch} onInquiry={handleInquiry} viewMode={viewMode} />
                                        ))}
                                    </div>
                                )}

                                {/* Pagination */}
                                {totalPages >= 1 && (
                                    <div className={styles['sr-pagination']}>
                                        <button className={styles['sr-page-btn']} disabled={currentPage <= 1} onClick={() => goToPage(currentPage - 1)}>
                                            ‹ Prev
                                        </button>
                                        {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                                            let pg;
                                            if (totalPages <= 7) pg = i + 1;
                                            else if (currentPage <= 4) pg = i + 1;
                                            else if (currentPage >= totalPages - 3) pg = totalPages - 6 + i;
                                            else pg = currentPage - 3 + i;
                                            return (
                                                <button key={pg} className={`sr-page-btn ${currentPage === pg ? 'active' : ''}`} onClick={() => goToPage(pg)}>
                                                    {pg}
                                                </button>
                                            );
                                        })}
                                        <button className={styles['sr-page-btn']} disabled={currentPage >= totalPages} onClick={() => goToPage(currentPage + 1)}>
                                            Next ›
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </main>
                </div> {/* sr-layout */}
            </div> {/* sr-layout-container */}
        </div>
    );
};

export default Search;
