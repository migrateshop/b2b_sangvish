import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/services/axiosConfig';
import { getImgUrl } from '@/utils/imageConfig';
import { useAuth } from '@/context/AuthContext';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/autoplay';


const HomeCategories = ({ config }) => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const { t } = useAuth();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const catRes = await api.get('/categories');
                setCategories(catRes.data.slice(0, 12));
                setLoading(false);
            } catch (err) {
                console.error('Error:', err);
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="home-categories-section">
                <div className="container" style={{ padding: '0 0 20px' }}>
                    <div className="hc-skeleton-header">
                        <div className="hc-skeleton-title" />
                        <div className="hc-skeleton-subtitle" />
                    </div>
                    <div className="hc-skeleton-container">
                        <div className="hc-skeleton-grid">
                            {Array(6).fill(0).map((_, i) => (
                                <div key={i} className="hc-skeleton-card" />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <section className="home-categories-section">

            <div className="container">
                <div className="hc-header">
                    <div className="hc-header-left">
                        <h2 className="hc-title">{config?.title || t('browse_categories') || 'Browse Categories'}</h2>
                        <p className="hc-subtitle">{config?.subtitle || t('explore_thousands_products') || 'Explore thousands of products by category'}</p>
                    </div>
                    <Link href="/categories" className="hc-view-all">
                        {t('view_all_categories')} &rarr;
                    </Link>
                </div>

                <div className="hc-slider-container">
                    <div className="hc-swiper-nav hc-swiper-prev" id="hc-prev">
                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"/></svg>
                    </div>
                    <div className="hc-swiper-nav hc-swiper-next" id="hc-next">
                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/></svg>
                    </div>
                    {categories.length > 0 && (
                        <Swiper
                            key={categories.length}
                            modules={[Navigation, Autoplay]}
                            spaceBetween={16}
                            slidesPerView={2}
                            navigation={{ prevEl: '#hc-prev', nextEl: '#hc-next' }}
                            autoplay={{ delay: 3500, disableOnInteraction: false, pauseOnMouseEnter: true }}
                            loop={false}
                            breakpoints={{
                                480: { slidesPerView: 3, spaceBetween: 16 },
                                768: { slidesPerView: 4, spaceBetween: 16 },
                                1024: { slidesPerView: 5, spaceBetween: 16 },
                                1280: { slidesPerView: 6, spaceBetween: 16 },
                            }}
                            className="hc-swiper"
                        >
                            {categories.map((cat) => (
                                <SwiperSlide key={cat._id}>
                                    <Link
                                        href={`/search?category_id=${cat._id}`}
                                        className="hc-card"
                                    >
                                        <div className="hc-card-img-wrap">
                                            <img
                                                src={getImgUrl(cat.image)}
                                                alt={cat.title}
                                                className="hc-card-img"
                                                loading="lazy"
                                                onError={e => e.target.src = 'https://placehold.co/200x200?text=' + encodeURIComponent(cat.title)}
                                            />
                                        </div>
                                        <div className="hc-card-info">
                                            <h3 className="hc-card-name">{cat.title}</h3>
                                            {cat.children && cat.children.length > 0 && (
                                                <p className="hc-card-count">{cat.children.length} {t('subcategories') || 'subcategories'}</p>
                                            )}
                                        </div>
                                    </Link>
                                </SwiperSlide>
                            ))}
                        </Swiper>
                    )}
                </div>
            </div>
        </section>
    );
};

export default HomeCategories;
