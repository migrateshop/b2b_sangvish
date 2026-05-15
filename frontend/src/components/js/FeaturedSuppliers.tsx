import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/services/axiosConfig';
import { getImgUrl } from '@/utils/imageConfig';
import { useAuth } from '@/context/AuthContext';


const FeaturedSuppliers = ({ config }) => {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const { t } = useAuth();
    const navigate = useRouter();

    useEffect(() => {
        const fetchSuppliers = async () => {
            try {
                const { data } = await api.get('/company/search?limit=4&verified_only=true&t=' + Date.now());
                setSuppliers(data.companies || []);
            } catch (err) {
                console.error('Error fetching suppliers:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchSuppliers();
    }, []);

    const getInitials = (name) => {
        if (!name) return 'S';
        return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    };

    const getCountryFlag = (code) => {
        if (!code || code.length !== 2) return '🌐';
        return <img src={getImgUrl(`/uploads/flags/${code.toLowerCase()}.png`)} alt={code} style={{ width: 20, height: 14, borderRadius: 2, marginRight: 4 }} />;
    };

    if (loading) {
        return (
            <section className="featured-suppliers-section">
                <div className="container">
                    <div className="fs-skeletons">
                        {Array(6).fill(0).map((_, i) => <div key={i} className="fs-skeleton" />)}
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="featured-suppliers-section">
            <div className="container">
                <div className="fs-header">
                    <div>
                        <h2 className="fs-title">{t('top_suppliers') || 'Top Suppliers'}</h2>
                        <p className="fs-subtitle">{config?.subtitle || t('verified_manufacturers_subtitle') || 'Verified manufacturers & trusted global suppliers'}</p>
                    </div>
                    <button className="fs-view-all" onClick={() => navigate.push('/?tab=suppliers')}>
                        {t('view_all_suppliers') || 'View All Suppliers'} →
                    </button>
                </div>

                <div className="fs-grid">
                    {suppliers.map(supplier => (
                        <Link
                            key={supplier._id}
                            href={`/supplier/${supplier.user_id?._id || supplier.user_id}`}
                            className="fs-card"
                        >
                            <div className="fs-card-header">
                                <div className="fs-brand-logo-wrap">
                                    {supplier.logo ? (
                                        <img
                                            src={getImgUrl(supplier.logo)}
                                            alt={supplier.company_name}
                                            className="fs-logo"
                                            onError={e => {
                                                e.target.style.display = 'none';
                                                e.target.nextSibling.style.display = 'flex';
                                            }}
                                        />
                                    ) : null}
                                    <div
                                        className="fs-logo-fallback"
                                        style={{ display: supplier.logo ? 'none' : 'flex' }}
                                    >
                                        {getInitials(supplier.company_name)}
                                    </div>
                                </div>
                                <div className="fs-brand-info">
                                    <h4 className="fs-company-name" title={supplier.company_name}>
                                        {supplier.company_name || 'Premium Supplier'}
                                    </h4>
                                    <div className="fs-location">
                                        {supplier.user_id?.country_code || supplier.country_code || 'IN'}, {supplier.user_id?.country || supplier.country || 'India'}
                                    </div>
                                </div>
                                {(() => {
                                    const plan = supplier.user_id?.subscription_plan;
                                    const isPlanVerified = plan?.has_verified_badge;
                                    const badgeColor = plan?.badge_color;
                                    const isVerified = supplier.verification_status === 'verified';
                                    if (isPlanVerified || isVerified) {
                                        return (
                                            <div className={`fs-verified-badge${isPlanVerified ? ' fs-pro' : ''}`}
                                                style={isPlanVerified && badgeColor ? { color: badgeColor, backgroundColor: `${badgeColor}1a` } : {}}>
                                                <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                                </svg>
                                                {isPlanVerified ? 'VERIFIED PRO' : 'VERIFIED'}
                                            </div>
                                        );
                                    }
                                    return null;
                                })()}
                            </div>

                            <div className="fs-business-tags">
                                {supplier.business_type ? (
                                    supplier.business_type.split(',').slice(0, 3).map((tag, idx) => (
                                        <span key={idx} className="fs-tag-pill">{tag.trim()}</span>
                                    ))
                                ) : (
                                    <>
                                        <span className="fs-tag-pill">Manufacturer</span>
                                        <span className="fs-tag-pill">Trading Company</span>
                                    </>
                                )}
                            </div>

                            <div className="fs-card-divider"></div>

                            <div className="fs-stats-row">
                                <div className="fs-stat-col">
                                    <span className="fs-stat-label">Products Count:</span>
                                    <span className="fs-stat-val">{(supplier.total_products || supplier.products_count) ? (supplier.total_products || supplier.products_count) : '0'}</span>
                                </div>
                                <div className="fs-stat-sep"></div>
                                <div className="fs-stat-col">
                                    <span className="fs-stat-label">Years Experience:</span>
                                    <span className="fs-stat-val">
                                        {(() => {
                                            const joinDate = supplier.createdAt || supplier.user_id?.createdAt;
                                            if (joinDate) {
                                                const d = new Date(joinDate);
                                                const n = new Date();
                                                if (d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth()) return 'New';
                                            }
                                            return supplier.years_experience ? `${supplier.years_experience} Yrs` : 'New';
                                        })()}
                                    </span>
                                </div>
                                <div className="fs-stat-sep"></div>
                                <div className="fs-stat-col">
                                    <span className="fs-stat-label">Response Rate:</span>
                                    <span className="fs-stat-val">{supplier.response_rate ? `${supplier.response_rate}%` : '~95%'}</span>
                                </div>
                            </div>

                            <div className="fs-card-footer">
                                <button className="fs-view-profile-btn">{t('view_profile') || 'View Profile'}</button>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FeaturedSuppliers;
