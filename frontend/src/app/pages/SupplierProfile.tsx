'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getSupplierCompanyProfile } from '@/services/companyApi';
import { fetchProducts } from '@/services/productApi';
import { toggleWishlist } from '@/services/wishlistApi';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import styles from './SupplierProfile.module.css';

import { getImgUrl } from '@/utils/imageConfig';

const SupplierProfile = () => {
    const { id } = useParams();
    const { user: authUser, convertPrice, t, siteSettings } = useAuth();
    const [supplierInfo, setSupplierInfo] = useState<any>(null);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('home');
    const [successMessage, setSuccessMessage] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [sortOrder, setSortOrder] = useState('new');
    const { openChat } = useChat();
    const [contactDetailPopup, setContactDetailPopup] = useState({ open: false, field: '', value: '' });
    const [showCartPopup, setShowCartPopup] = useState(false);
    const [cartItems, setCartItems] = useState<any[]>([]);
    const [addedItems, setAddedItems] = useState<Record<string, boolean>>({});

    useEffect(() => {
        const fetchCart = () => {
            setCartItems(JSON.parse((typeof window !== 'undefined' ? localStorage.getItem('cart') : null) || '[]'));
        };
        fetchCart();
        window.addEventListener('cartUpdated', fetchCart);
        return () => window.removeEventListener('cartUpdated', fetchCart);
    }, []);

    // Extract unique categories from products (handling both populated category and category_info from aggregation)
    const dynamicCategories = Array.from(new Set(products.map((p: any) => {
        const cat = p.category_info || p.category;
        return cat?.title || 'Uncategorized';
    })))
        .filter(Boolean)
        .sort();

    const filteredProducts = products.filter((p: any) => {
        if (selectedCategory === 'top') return true;
        if (selectedCategory !== 'all') {
            const cat = p.category_info || p.category;
            return (cat?.title || 'Uncategorized') === selectedCategory;
        }
        return true;
    }).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const handleAddToCart = (e: any, product: any) => {
        e.preventDefault();
        e.stopPropagation();

        try {
            const supplierId = product.supplier?._id || product.supplier || null;
            const cartItem = {
                productId: product._id,
                name: product.name,
                price: product.main_price,
                image: product.main_image,
                quantity: 1,
                variants: {},
                supplier: supplierId
            };

            const existingCart = JSON.parse((typeof window !== 'undefined' ? localStorage.getItem('cart') : null) || '[]');
            const existingIndex = existingCart.findIndex((item: any) => item.productId === cartItem.productId);

            if (existingIndex > -1) {
                existingCart[existingIndex].quantity += 1;
            } else {
                existingCart.push(cartItem);
            }

            localStorage.setItem('cart', JSON.stringify(existingCart));
            window.dispatchEvent(new Event('cartUpdated'));

            setAddedItems(prev => ({ ...prev, [product._id]: true }));
            setSuccessMessage(t('product_added_to_cart') || 'Product added to cart successfully');
            setShowSuccess(true);
            setTimeout(() => {
                setAddedItems(prev => ({ ...prev, [product._id]: false }));
                setShowSuccess(false);
            }, 3000);
        } catch (err) {
            console.error("Cart error in SupplierProfile:", err);
        }
    };

    const handleChatNow = (e: any, product: any) => {
        e.preventDefault();
        e.stopPropagation();
        if (!authUser) {
            alert('Please login to chat with the supplier');
            return;
        }
        
        const targetData = product?.supplier || product?.supplier_info || (supplierInfo as any)?.user;
        if (!targetData) return;

        // Ensure we pass the right object to openChat
        const targetUser = typeof targetData === 'string' ? { _id: targetData } : targetData;
        openChat(targetUser, product);
    };

    const handleToggleWishlist = async (e: any, productId: any) => {
        e.preventDefault();
        e.stopPropagation();
        if (!authUser) {
            alert('Please login to add to wishlist');
            return;
        }
        try {
            await toggleWishlist(productId);
            // We might need to refresh user data if AuthContext doesn't auto-update
            window.dispatchEvent(new Event('wishlistUpdated'));
            setSuccessMessage('Wishlist updated!');
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 2000);
        } catch (err) {
            console.error("Wishlist error:", err);
        }
    };

    useEffect(() => {
        const loadProfile = async () => {
            try {
                setLoading(true);
                const { data: companyData } = await getSupplierCompanyProfile(id);
                setSupplierInfo(companyData);

                const { data: prodData } = await fetchProducts({ supplier: id, limit: 100 });
                setProducts(prodData.products || []);
            } catch (err) {
                console.error("Profile load error:", err);
                setError('Failed to load supplier profile.');
            } finally {
                setLoading(false);
            }
        };
        loadProfile();
    }, [id]);

    if (loading) return (
        <div className={styles['flex'] + " " + styles['flex-col'] + " " + styles['items-center'] + " " + styles['justify-center'] + " " + styles['min-h-[60vh]']}>
            <div className={styles['animate-spin'] + " " + styles['rounded-full'] + " " + styles['h-12'] + " " + styles['w-12'] + " " + styles['border-t-2'] + " " + styles['border-b-2'] + " " + styles['border-[var(--clr-accent)]'] + " " + styles['mb-4']}></div>
            <p className={styles['font-bold'] + " " + styles['text-gray-500']}>Loading Factory Profile...</p>
        </div>
    );

    if (error || !supplierInfo?.user) return (
        <div className={styles['py-20'] + " " + styles['text-center']}>
            <div className={styles['text-4xl'] + " " + styles['mb-4']}>⚠️</div>
            <p className={styles['text-red-500'] + " " + styles['font-bold']}>{error || 'Supplier not found'}</p>
            <Link href="/" className={styles['text-blue-500'] + " " + styles['hover:underline'] + " " + styles['mt-4'] + " " + styles['inline-block']}>Return Home</Link>
        </div>
    );

    const { user, company } = supplierInfo as any;
    const companyName = company.company_name || user.company_name || `${user.first_name} ${user.last_name}`;
    let isNewSupplier = false;
    let yearsInBusiness = 1;

    if (company.createdAt) {
        const d = new Date(company.createdAt);
        const n = new Date();
        if (d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth()) {
            isNewSupplier = true;
        } else {
            yearsInBusiness = Math.max(1, n.getFullYear() - d.getFullYear() + 1);
        }
    }

    const IconWrapper = ({ children, className = "" }: any) => (
        <span className={`inline-flex items-center justify-center ${className}`}>{children}</span>
    );

    return (
        <div className={styles['supplier-profile-page']}>


            {/* 2. MAIN HEADER */}
            <header className={styles['sp-header']}>
                <div className="container mx-auto px-4 lg:px-16">
                    <div className={styles['sp-header-content']}>
                        <div className={styles['sp-logo']}>
                            {company.logo ? (
                                <img src={getImgUrl(company.logo)} alt={companyName} />
                            ) : (
                                <div className={styles['sp-logo-placeholder']}>{companyName.charAt(0)}</div>
                            )}
                        </div>

                        <div className={styles['sp-header-info']}>
                            <h1 className={styles['sp-company-name']}>{companyName}</h1>
                            <div className={styles['sp-badges-row']}>
                                {/* Subscription badge instead of just verified */}
                                {(() => {
                                    const plan = user.subscription_plan;
                                    const isPlanVerified = plan?.has_verified_badge;
                                    const badgeColor = plan?.badge_color || '#d97706';
                                    const isVerified = company.verification_status === 'verified';
                                    if (isPlanVerified) {
                                        return (
                                            <span className={styles['sp-badge-verified']} style={{ color: badgeColor, backgroundColor: `${badgeColor}1a`, borderColor: `${badgeColor}33` }}>
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '4px' }}><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
                                                VERIFIED PRO
                                            </span>
                                        );
                                    } else if (isVerified) {
                                        return (
                                            <span className={styles['sp-badge-verified']}>
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '4px' }}><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
                                                VERIFIED
                                            </span>
                                        );
                                    }
                                    return null;
                                })()}
                                <span className={styles['sp-badge-year']}>{isNewSupplier ? 'NEW' : `${yearsInBusiness} YRS`}</span>
                                <span className={styles['sp-badge-type']}>{company.business_type || 'Manufacturer'}</span>
                            </div>

                            <div className={styles['sp-stats-row']}>
                                <div className={styles['sp-stat-item']}>
                                    {/* Map Pin SVG */}
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                                        <circle cx="12" cy="9" r="2.5" />
                                    </svg>
                                    <span><b>{company.country || user.country_code || 'IN'}</b></span>
                                </div>
                                <div className={styles['sp-stat-item']}>
                                    {/* Bolt SVG */}
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                                    </svg>
                                    <span><b>98.2%</b> Response Rate</span>
                                </div>
                                <div className={styles['sp-stat-item']}>
                                    {/* Chat bubble SVG */}
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                    </svg>
                                    <span><b>&lt;1h</b> Time</span>
                                </div>
                            </div>
                        </div>

                        <div className={styles['sp-header-actions']}>
                            <div className={styles['sp-main-actions']}>
                                <button onClick={(e) => handleChatNow(e, null)} className={`${styles['sp-btn']} ${styles['sp-btn-primary']}`}>{t('chat_now') || 'Chat Now'}</button>
                                <Link href="/rfq/post" className={`${styles['sp-btn']} ${styles['sp-btn-outline']}`}>{t('send_enquiry') || 'Send Inquiry'}</Link>
                            </div>
                            <button className={styles['sp-report-btn']} title="Report this supplier">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
                                    <line x1="4" y1="22" x2="4" y2="15"></line>
                                </svg>
                                <span>Report</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* 3. NAVIGATION */}
            <nav className={styles['sp-nav']}>
                <div className="container mx-auto px-4 lg:px-16 flex overflow-x-auto no-scrollbar">
                    {['home', 'products', 'profile', 'contacts'].map((tab: any) => (
                        <button
                            key={tab}
                            className={`${styles['sp-nav-tab']} ${activeTab === tab ? styles['active'] : ''}`}
                            onClick={() => { setActiveTab(tab); setShowCartPopup(false); }}
                        >
                            {tab === 'profile' ? (t('supplier_profile') || 'Company Profile') : (t(tab) || tab)}
                        </button>
                    ))}
                </div>
            </nav>

            {/* 4. CONTENT BODY */}
            <main className={styles['sp-body']}>
                <div className={`${styles['sp-container']} container mx-auto`}>

                    {/* HOME TAB */}
                    {activeTab === 'home' && (
                        <div className={styles['sp-fade-in']}>
                            <section className={styles['sp-home-hero']}>
                                <div className={styles['sp-banner-wrapper']}>
                                    {company.banner_image ? (
                                        <img src={getImgUrl(company.banner_image)} className={styles['sp-banner-image']} alt="Banner" />
                                    ) : (
                                        <img src="https://images.unsplash.com/photo-1565514020179-026b92b84bb6?w=1600&q=80" className={styles['sp-banner-image']} alt="Fallback" />
                                    )}
                                    <div className={styles['sp-banner-overlay']}>
                                        <div className={styles['sp-hero-text']}>
                                            <h2>World Class {company.business_type || 'Manufacturing'} Excellence</h2>
                                            <p>{company.description || "Leading global supplier of high-quality electronics and industrial solutions."}</p>
                                        </div>
                                    </div>
                                </div>
                            </section>


                            <section>
                                <div className={styles['flex'] + " " + styles['justify-between'] + " " + styles['items-end'] + " " + styles['mb-8']}>
                                    <div>
                                        <h2 className={styles['text-2xl'] + " " + styles['font-black'] + " " + styles['text-slate-900']} style={{ color: '#000' }}>Featured Collections</h2>
                                        <p className={styles['text-slate-400'] + " " + styles['font-medium']} style={{ color: '#666' }}>Strictly selected for premium buyers</p>
                                    </div>
                                    <button onClick={() => setActiveTab('products')} className={styles['text-[var(--clr-accent)]'] + " " + styles['font-bold'] + " " + styles['text-sm'] + " " + styles['hover:underline']} style={{ color: 'var(--primary-color)' }}>Browse All Collections &rarr;</button>
                                </div>
                                <div className={styles['sp-products-grid']} style={{ background: 'transparent', gap: '20px' }}>
                                    {products.slice(0, 12).map((p: any) => (
                                        <div key={p._id} className={styles['sp-product-card']} style={{ borderRadius: '16px', border: '1px solid #eee', overflow: 'hidden', padding: '0', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s, box-shadow 0.2s' }}>
                                            <Link href={`/product/${p._id}`} className={styles['sp-product-card-link']} style={{ flex: '1', display: 'flex', flexDirection: 'column' }}>
                                                <div className={styles['sp-product-image']} style={{ borderRadius: '0', marginBottom: '0', background: '#fcfcfc', width: '100%', aspectRatio: '1' }}>
                                                    <img src={getImgUrl(p.main_image)} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    <button
                                                        className={styles['sp-wishlist-btn-overlay']}
                                                        onClick={(e) => handleToggleWishlist(e, p._id)}
                                                        title="Add to wishlist"
                                                        style={{ background: 'rgba(255,255,255,0.8)', padding: '6px', borderRadius: '50%', right: '12px', top: '12px', backdropFilter: 'blur(4px)' }}
                                                    >
                                                        <svg
                                                            width="18"
                                                            height="18"
                                                            viewBox="0 0 24 24"
                                                            fill={authUser?.wishlist?.includes(p._id) ? "var(--clr-accent)" : "none"}
                                                            stroke={authUser?.wishlist?.includes(p._id) ? "var(--clr-accent)" : "#555"}
                                                            strokeWidth="2.5"
                                                        >
                                                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.84-8.84 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                                        </svg>
                                                    </button>
                                                </div>
                                                <div style={{ padding: '16px' }}>
                                                    <h3 className={styles['sp-product-name']} style={{ color: '#000', fontWeight: '700', fontSize: '15px', minHeight: '42px', marginBottom: '8px', lineHeight: '1.4' }}>{p.name}</h3>
                                                    <div className={styles['sp-product-price']} style={{ color: '#000', fontSize: '19px', fontWeight: '900', marginBottom: '4px' }}>{convertPrice(Math.round(p.main_price || p.price_tiers?.[0]?.price || p.price || 0)).formatted}</div>
                                                    <div className={styles['sp-product-moq']} style={{ color: '#777', fontSize: '12px', fontWeight: '500' }}>Min. Order: {p.moq || 1} {p.unit || 'PCS'}</div>
                                                </div>
                                            </Link>

                                            <div className={styles['sp-product-actions']} style={{ position: 'relative', zIndex: 10, padding: '0 16px 16px', display: 'flex', gap: '8px' }}>
                                                <button
                                                    onClick={(e) => handleAddToCart(e, p)}
                                                    className={styles['sp-btn-full-pill']}
                                                    style={{ background: addedItems[p._id] ? '#059669' : 'var(--primary-color)', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', fontWeight: '700', flex: '2' }}
                                                >
                                                    {addedItems[p._id] ? '✓ Added' : (t('add_to_cart') || 'Add to cart')}
                                                </button>
                                                <button
                                                    onClick={(e) => handleChatNow(e, p)}
                                                    className={styles['sp-btn-outline-pill']}
                                                    style={{ border: '1.5px solid #eee', color: '#333', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', fontWeight: '700', flex: '1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>
                    )}

                    {/* PRODUCTS TAB */}
                    {activeTab === 'products' && (
                        <div className={styles['sp-fade-in']}>
                            <div className={styles['sp-products-tab-wrap']}>
                                {/* Sidebar */}
                                <aside className={styles['sp-sidebar-wrap']}>
                                    <button
                                        onClick={() => setSelectedCategory('top')}
                                        className={styles['sp-sidebar-toppick']}
                                    >
                                        <div className={styles['sp-toppick-icon']}>🏢</div>
                                        <span>{t('top_picks') || 'Top picks'}</span>
                                    </button>

                                    <div className={styles['sp-sidebar-cat-section']}>
                                        <div className={styles['sp-sidebar-cat-title']}>{t('categories') || 'Product categories'}</div>
                                    </div>
                                    <ul className={styles['sp-sidebar-cat-list']}>
                                        {dynamicCategories.map((cat: any) => (
                                            <li key={cat}>
                                                <button
                                                    onClick={() => setSelectedCategory(cat)}
                                                    className={`${styles['sp-sidebar-cat-btn']} ${selectedCategory === cat ? styles['active'] : ''}`}
                                                >
                                                    <span>{cat}</span>
                                                    <span className={styles['sp-cat-arrow']}>›</span>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </aside>

                                {/* Products Area */}
                                <div className={styles['sp-products-main']}>
                                    <div className={styles['sp-products-toolbar']}>
                                        <h2 className={styles['sp-products-title']}>
                                            {selectedCategory === 'all' ? (t('all_products') || 'All products') : selectedCategory === 'top' ? (t('top_picks') || 'Top picks') : selectedCategory}
                                        </h2>
                                    </div>

                                    <div className={styles['sp-products-grid']}>
                                        {filteredProducts.map((p: any) => (
                                            <div key={p._id} className={styles['sp-product-card']}>
                                                <Link href={`/product/${p._id}`} className={styles['sp-product-card-link']}>
                                                    <div className={styles['sp-product-image']} style={{ borderRadius: '0', marginBottom: '0', background: '#fcfcfc', width: '100%', aspectRatio: '1' }}>
                                                        <img
                                                            src={getImgUrl(p.main_image)}
                                                            alt={p.name}
                                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                        />
                                                        <button
                                                            className={styles['sp-wishlist-btn-overlay']}
                                                            onClick={(e) => handleToggleWishlist(e, p._id)}
                                                            title="Add to wishlist"
                                                        >
                                                            <svg
                                                                width="22"
                                                                height="22"
                                                                viewBox="0 0 24 24"
                                                                fill={authUser?.wishlist?.includes(p._id) ? "var(--clr-accent)" : "none"}
                                                                stroke={authUser?.wishlist?.includes(p._id) ? "var(--clr-accent)" : "currentColor"}
                                                                strokeWidth="2"
                                                            >
                                                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.84-8.84 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                    <h3 className={styles['sp-product-name']}>{p.name}</h3>
                                                    <div className={styles['sp-product-price']}>{convertPrice(p.main_price || p.price_tiers?.[0]?.price || p.price || 0).formatted}</div>
                                                    <div className={styles['sp-product-moq']}>Min. Order: {p.moq || 1} piece</div>
                                                </Link>
                                                <div className={styles['sp-product-actions']} style={{ position: 'relative', zIndex: 10 }}>
                                                    <button
                                                        onClick={(e) => handleAddToCart(e, p)}
                                                        className={styles['sp-btn-full-pill']}
                                                        style={{ background: addedItems[p._id] ? '#059669' : undefined }}
                                                    >
                                                        {addedItems[p._id] ? '✓ Added' : (t('add_to_cart') || 'Add to cart')}
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleChatNow(e, p)}
                                                        className={styles['sp-btn-outline-pill']}
                                                    >
                                                        {t('chat_now') || 'Chat now'}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        {filteredProducts.length === 0 && (
                                            <div style={{ gridColumn: '1/-1', padding: '80px 0', textAlign: 'center' }}>
                                                <p style={{ color: '#aaa', fontWeight: 600 }}>No products found in this category.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* COMPANY PROFILE TAB */}
                    {activeTab === 'profile' && (
                        <div className={`${styles['sp-fade-in']} max-w-5xl mx-auto`}>
                            <div className={styles['sp-profile-card']}>
                                <header className={styles['mb-12'] + " " + styles['border-b'] + " " + styles['border-slate-100'] + " " + styles['pb-8']}>
                                    <h2 className={styles['text-3xl'] + " " + styles['font-black'] + " " + styles['text-slate-900']}>Company Overview</h2>
                                    <p className={styles['text-slate-400'] + " " + styles['font-bold'] + " " + styles['mt-2']}>Deep insights into factory capabilities and standards</p>
                                </header>

                                <div className={styles['sp-profile-grid']}>
                                    <div className={styles['sp-grid-item']}>
                                        <span className={styles['sp-grid-label']}>Main Capabilities</span>
                                        <span className={styles['sp-grid-value']}>{company.capabilities?.join(', ') || 'Global Export, R&D, OEM/ODM'}</span>
                                    </div>
                                    <div className={styles['sp-grid-item']}>
                                        <span className={styles['sp-grid-label']}>Staff Size</span>
                                        <span className={styles['sp-grid-value']}>{company.staff_size || 'Above 100 Employees'}</span>
                                    </div>
                                    <div className={styles['sp-grid-item']}>
                                        <span className={styles['sp-grid-label']}>Year Established</span>
                                        <span className={styles['sp-grid-value']}>{new Date(company.createdAt).getFullYear() - 3}</span>
                                    </div>
                                    <div className={styles['sp-grid-item']}>
                                        <span className={styles['sp-grid-label']}>Certifications</span>
                                        <span className={styles['sp-grid-value']}>{company.certifications?.join(', ') || 'ISO9001, CE, RoHS'}</span>
                                    </div>
                                    <div className={styles['sp-grid-item']}>
                                        <span className={styles['sp-grid-label']}>Production Area</span>
                                        <span className={styles['sp-grid-value']}>{company.factory_area || '10,000+ m²'}</span>
                                    </div>
                                    <div className={styles['sp-grid-item']}>
                                        <span className={styles['sp-grid-label']}>Annual Revenue</span>
                                        <span className={styles['sp-grid-value']}>{company.annual_revenue || 'US$10M - US$50M'}</span>
                                    </div>
                                </div>

                                </div>

                            <div className={styles['sp-profile-card'] + " " + styles['mt-8']}>
                                <div className={styles['grid'] + " " + styles['lg:grid-cols-2'] + " " + styles['gap-12'] + " " + styles['items-center']}>
                                    <div className={styles['space-y-6']}>
                                        <h3 className={styles['text-2xl'] + " " + styles['font-black'] + " " + styles['text-slate-900']}>Manufacturing Strength</h3>
                                        <p className={styles['text-slate-600'] + " " + styles['leading-relaxed'] + " " + styles['font-medium']}>
                                            {company.description || "Our facility utilizes cutting-edge automation and lean manufacturing principles to deliver consistent quality at scale. With dedicated R&D teams and rigorous quality control, we stay ahead of industry standards."}
                                        </p>
                                        <div className={styles['flex'] + " " + styles['gap-4']}>
                                            <div className={styles['bg-slate-50'] + " " + styles['p-4'] + " " + styles['rounded-xl'] + " " + styles['flex-1'] + " " + styles['text-center']}>
                                                <div className={styles['text-2xl'] + " " + styles['font-black'] + " " + styles['text-[var(--clr-accent)]']}>8+</div>
                                                <div className={styles['text-[10px]'] + " " + styles['font-bold'] + " " + styles['text-slate-400'] + " " + styles['uppercase']}>Production Lines</div>
                                            </div>
                                            <div className={styles['bg-slate-50'] + " " + styles['p-4'] + " " + styles['rounded-xl'] + " " + styles['flex-1'] + " " + styles['text-center']}>
                                                <div className={styles['text-2xl'] + " " + styles['font-black'] + " " + styles['text-[var(--clr-accent)]']}>24h</div>
                                                <div className={styles['text-[10px]'] + " " + styles['font-bold'] + " " + styles['text-slate-400'] + " " + styles['uppercase']}>Quality Testing</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}


                    {/* CONTACTS TAB */}
                    {activeTab === 'contacts' && (
                        <div className={styles['sp-fade-in']}>
                            <div className={styles['sp-contact-wrap']}>
                                {/* Left: Company Contact Information */}
                                <div className={styles['sp-contact-main']}>
                                    <h2 className={styles['sp-contact-heading']}>Company contact information</h2>

                                    <div className={styles['sp-contact-person']}>
                                        <div className={styles['sp-contact-avatar']}>
                                            {user.logo
                                                ? <img src={getImgUrl(user.logo)} alt={user.first_name} />
                                                : <span style={{ fontSize: '2rem', color: '#fff', background: 'var(--clr-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', borderRadius: '50%' }}>{user.first_name?.charAt(0)?.toUpperCase()}</span>
                                            }
                                        </div>
                                        <div className={styles['sp-contact-name']}>{user.first_name} {user.last_name}</div>
                                    </div>

                                    <div className={styles['sp-contact-fields']}>
                                        <div className={styles['sp-contact-col']}>
                                            <div className={styles['sp-contact-field']}>
                                                <span className={styles['sp-field-label']}>Company phone:</span>
                                                <button
                                                    onClick={() => setContactDetailPopup({ open: true, field: 'Company Phone', value: company.phone || 'Not provided' })}
                                                    className={styles['sp-field-link']} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                                                >View details</button>
                                            </div>
                                            <div className={styles['sp-contact-field']}>
                                                <span className={styles['sp-field-label']}>Company mobile:</span>
                                                <button
                                                    onClick={() => setContactDetailPopup({ open: true, field: 'Company Mobile', value: company.mobile || 'Not provided' })}
                                                    className={styles['sp-field-link']} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                                                >View details</button>
                                            </div>
                                        </div>
                                        <div className={styles['sp-contact-col']}>
                                            <div className={styles['sp-contact-field']}>
                                                <span className={styles['sp-field-label']}>Company website:</span>
                                                {company.website
                                                    ? <a href={company.website} target="_blank" rel="noopener noreferrer" className={styles['sp-field-link']}>{company.website}</a>
                                                    : <span className={styles['sp-field-value']} style={{ color: '#aaa' }}>Not provided</span>
                                                }
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Contact Supplier Panel */}
                                <div className={styles['sp-contact-sidebar']}>
                                    <h3 className={styles['sp-contact-sidebar-title']}>Contact supplier</h3>
                                    <div className={styles['sp-supplier-info-row']}>
                                        <div className={styles['sp-supplier-logo-sm']}>
                                            {company.logo
                                                ? <img src={getImgUrl(company.logo)} alt={companyName} />
                                                : <span style={{ fontSize: '1.2rem' }}>🏢</span>
                                            }
                                        </div>
                                        <div>
                                            <div className={styles['sp-supplier-location']}>{company.city || company.country || 'India'}</div>
                                            <div className={styles['sp-supplier-company']}>{companyName.substring(0, 12)}{companyName.length > 12 ? '...' : ''}</div>
                                        </div>
                                    </div>
                                    <button onClick={(e) => handleChatNow(e, null)} className={styles['sp-contact-chat-btn']} style={{ border: 'none', cursor: 'pointer', display: 'block', width: '100%', textAlign: 'center' }}>{t('chat_now') || 'Chat now'}</button>
                                    <Link href="/rfq/post" className={styles['sp-contact-inquiry-btn']}>{t('send_enquiry') || 'Send inquiry'}</Link>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </main>
            {/* SUCCESS POPUP */}
            {showSuccess && (
                <div className={styles['fixed'] + " " + styles['bottom-10'] + " " + styles['left-1/2'] + " " + styles['transform'] + " " + styles['-translate-x-1/2'] + " " + styles['z-[9999]'] + " " + styles['animate-bounce']}>
                    <div className={styles['bg-green-600'] + " " + styles['text-white'] + " " + styles['px-8'] + " " + styles['py-3'] + " " + styles['rounded-full'] + " " + styles['shadow-2xl'] + " " + styles['flex'] + " " + styles['items-center'] + " " + styles['gap-3'] + " " + styles['font-bold'] + " " + styles['border-2'] + " " + styles['border-green-400']}>
                        <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        {successMessage}
                    </div>
                </div>
            )}

            {/* CONTACT DETAIL POPUP - Bootstrap style */}
            {contactDetailPopup.open && (
                <div
                    style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={() => setContactDetailPopup({ open: false, field: '', value: '' })}
                >
                    <div
                        style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 8px 32px rgba(0,0,0,0.18)', width: '100%', maxWidth: '420px', margin: '0 16px', overflow: 'hidden' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #dee2e6' }}>
                            <h5 style={{ margin: 0, fontWeight: 600, fontSize: '1.05rem', color: '#212529' }}>{contactDetailPopup.field}</h5>
                            <button onClick={() => setContactDetailPopup({ open: false, field: '', value: '' })}
                                style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: '#6c757d', cursor: 'pointer', lineHeight: 1 }}>×</button>
                        </div>
                        {/* Body */}
                        <div style={{ padding: '24px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                                <div style={{ width: '46px', height: '46px', borderRadius: '50%', background: '#e8f0fe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a73e8" strokeWidth="2">
                                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.62 3.39a2 2 0 0 1 2-2.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                                    </svg>
                                </div>
                                <div>
                                    <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px' }}>{contactDetailPopup.field}</div>
                                    <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#212529' }}>{contactDetailPopup.value}</div>
                                </div>
                            </div>
                            <p style={{ margin: 0, fontSize: '13px', color: '#6c757d' }}>
                                This contact info is provided by the supplier. For a faster response, use the chat feature.
                            </p>
                        </div>
                        {/* Footer */}
                        <div style={{ padding: '12px 20px', borderTop: '1px solid #dee2e6', display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setContactDetailPopup({ open: false, field: '', value: '' })}
                                style={{ padding: '8px 20px', background: '#6c757d', color: '#fff', border: 'none', borderRadius: '5px', fontWeight: 500, cursor: 'pointer', fontSize: '14px' }}
                            >Close</button>
                        </div>
                    </div>
                </div>
            )}

        </div>

    );
};

export default SupplierProfile;
