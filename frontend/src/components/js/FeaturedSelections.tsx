import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/services/axiosConfig';
import { useAuth } from '@/context/AuthContext';
import { getImgUrl } from '@/utils/imageConfig';


const FeaturedSelections = ({ config }) => {
    const navigate = useRouter();
    const [topDeals, setTopDeals] = useState([]);
    const [topRanking, setTopRanking] = useState([]);
    const [newArrivals, setNewArrivals] = useState([]);
    const [loading, setLoading] = useState(true);
    const { convertPrice, t, user, openLogin, selectedCountry } = useAuth();

    useEffect(() => {
        const fetchSections = async () => {
            try {
                const uCountry = selectedCountry || 'IN';
                const [dealsRes, rankingRes, arrivalsRes] = await Promise.all([
                    api.get(`/products?section=Top Deals&limit=6&t=${Date.now()}&user_country=${uCountry}`),
                    api.get(`/products?section=Top Ranking&limit=4&t=${Date.now()}&user_country=${uCountry}`),
                    api.get(`/products?section=New Arrivals&limit=4&t=${Date.now()}&user_country=${uCountry}`)
                ]);

                setTopDeals(dealsRes.data.products || []);
                setTopRanking(rankingRes.data.products || []);
                setNewArrivals(arrivalsRes.data.products || []);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching featured sections:', error);
                setLoading(false);
            }
        };

        fetchSections();
    }, [selectedCountry]);

    const handleViewMore = (section) => {
        const routeMap = {
            'Top Deals': 'top-deals',
            'New Arrivals': 'new-arrivals',
            'Top Ranking': 'top-ranking'
        };
        const sectionId = routeMap[section] || section.toLowerCase().replace(/\s+/g, '-');
        navigate.push(`/section/${sectionId}`);
    };

    if (loading) {
        return <div className="container mt-16 text-center">{t('loading')}</div>;
    }

    const ProductCard = ({ product, showBadge }) => (
        <Link href={`/product/${product.slug || product._id}`} className="deal-card">
            <div className="deal-img-wrapper">
                {showBadge && (
                    <div className="deal-ranking-badge">
                        TOP PICKS
                    </div>
                )}
                <img
                    src={getImgUrl(product.images?.[0] || product.main_image)}
                    alt={product.name}
                    className="deal-img"
                    loading="lazy"
                />
            </div>
            <div className="deal-info">
                <div className="deal-name">{product.name}</div>
                <div className="deal-price-area">
                    <span className="deal-current-price">
                        {product.price_tiers?.length > 0
                            ? convertPrice(product.price_tiers[0].price).formatted
                            : convertPrice(product.main_price || 0).formatted}
                    </span>
                    {product.oldPrice > 0 && <span className="deal-was-price">{convertPrice(product.oldPrice).formatted}</span>}
                </div>
                <div className="deal-meta-info">
                    <span className="deal-moq-label">MOQ: {product.moq || 1}</span>
                </div>
            </div>
        </Link>
    );

    const MiniProductCard = ({ product }) => (
        <Link href={`/product/${product.slug || product._id}`} className="mini-ranking-card">
            <div className="mini-ranking-img">
                <img
                    src={getImgUrl(product.images?.[0] || product.main_image)}
                    alt={product.name}
                    loading="lazy"
                />
            </div>
            <div className="mini-ranking-details">
                <span className="mini-price-tag">
                    {product.price_tiers?.length > 0
                        ? convertPrice(product.price_tiers[0].price).formatted
                        : convertPrice(product.main_price || 0).formatted}
                </span>
                <span className="mini-moq-tag">MOQ: {product.moq || 1}</span>
            </div>
        </Link>
    );

    return (
        <div className="marketplace-sections container">
            {/* Top Deals Section */}
            <div className="section-container deals-section">
                <div className="section-header-block">
                    <div className="header-text-group">
                        <h2 className="section-main-title">{t('top_deals') || 'Top Deals'}</h2>
                        <p className="section-main-subtitle">Score the lowest prices on EliteMarket.com</p>
                    </div>
                    <button className="section-view-all icon-only" onClick={() => handleViewMore('Top Deals')}>
                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                    </button>
                </div>
                <div className="section-items-grid">
                    {topDeals.map((product, index) => (
                        <ProductCard key={product._id} product={product} showBadge={index === 0} />
                    ))}
                    {topDeals.length === 0 && Array(6).fill(0).map((_, i) => (
                        <div key={i} className="deal-card-skeleton"></div>
                    ))}
                </div>
            </div>

            {/* Side-by-Side Sections */}
            <div className="dual-section-row">
                <div className="section-container mini-container">
                    <div className="section-header-block compact">
                        <div className="header-text-group">
                            <h2 className="section-main-title small">{t('top_ranking') || 'Top Ranking'}</h2>
                            <p className="section-main-subtitle">Market leaders based on volume</p>
                        </div>
                        <button className="section-view-all icon-only" onClick={() => handleViewMore('Top Ranking')}>
                            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                        </button>
                    </div>
                    <div className="grid-4-cols">
                        {topRanking.map(product => (
                            <MiniProductCard key={product._id} product={product} />
                        ))}
                    </div>
                </div>

                <div className="section-container mini-container">
                    <div className="section-header-block compact">
                        <div className="header-text-group">
                            <h2 className="section-main-title small">{t('new_arrivals')}</h2>
                            <p className="section-main-subtitle">Freshly sourced inventory</p>
                        </div>
                        <button className="section-view-all icon-only" onClick={() => handleViewMore('New Arrivals')}>
                            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                        </button>
                    </div>
                    <div className="grid-4-cols">
                        {newArrivals.map(product => (
                            <MiniProductCard key={product._id} product={product} />
                        ))}
                    </div>
                </div>
            </div>


            {/* RFQ Sourcing Banner */}
            <div className="section-block rfq-banner-section mt-8">
                <div className="rfq-banner-left">
                    <div className="rfq-banner-eyebrow">
                        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                        {t('request_for_quotation') || 'Request for Quotation'}
                    </div>
                    <h2 className="rfq-banner-title">{t('source_smarter_quotes') || 'Source Smarter — Get Quotes in 24 Hours'}</h2>
                    <p className="rfq-banner-subtitle">{t('post_once_rfq_desc') || 'Post once. Receive multiple competitive quotes from verified global suppliers.'}</p>
                    <div className="rfq-banner-stats">
                        <span className="rfq-stat-pill"><strong>200K+</strong> {t('suppliers') || 'Suppliers'}</span>
                        <span className="rfq-stat-sep">•</span>
                        <span className="rfq-stat-pill"><strong>24hr</strong> {t('response') || 'Response'}</span>
                    </div>
                </div>
                <Link
                    href={user ? "/rfq/post" : "#"}
                    className="rfq-banner-btn"
                    onClick={(e) => {
                        if (!user) {
                            e.preventDefault();
                            openLogin();
                        }
                    }}
                >
                    {t('submit_rfq') || 'Post an RFQ'}
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                </Link>
            </div>
        </div>
    );
};

export default FeaturedSelections;



