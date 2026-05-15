import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import api from '@/services/axiosConfig';
import { getImgUrl } from '@/utils/imageConfig';
import { useAuth } from '@/context/AuthContext';


const CategoryCards = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const { t, user, openLogin } = useAuth();

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const { data } = await api.get('/categories');
                setCategories(data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching categories:', error);
                setLoading(false);
            }
        };

        fetchCategories();
    }, []);

    if (loading) {
        return (
            <div className="mt-12 container">
                <div className="cat-skeleton-container" style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '24px' }}>
                    <div className="cat-skeleton-banner" />
                    <div className="cat-skeleton-grid-main">
                        {Array(6).fill(0).map((_, i) => (
                            <div key={i} className="cat-skeleton-card" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="mt-12 mb-4 category-sections-full-width container">
            <div className="category-cards-layout">
                {/* Main Category Banner - Left Fixed */}
                <div className="cat-main-banner">
                    <div className="cat-banner-content">
                        <h2 className="cat-banner-title">{t('global_sourcing')}</h2>
                        <p className="cat-banner-subtitle">{t('one_request_multiple_quotes')}</p>
                    </div>
                    <Link 
                        href={user ? "/rfq/post" : "#"} 
                        className="cat-banner-btn"
                        onClick={(e) => {
                            if (!user) {
                                e.preventDefault();
                                openLogin();
                            }
                        }}
                    >
                        {t('post_rfq')}
                    </Link>
                </div>

                {/* Swiper Slider for Categories */}
                <div className="cat-swiper-container">
                    <Swiper
                        modules={[Navigation, Pagination]}
                        spaceBetween={20}
                        slidesPerView={3}
                        navigation={{
                            nextEl: '.cat-nav-next',
                            prevEl: '.cat-nav-prev',
                        }}
                        breakpoints={{
                            320: { slidesPerView: 1 },
                            640: { slidesPerView: 2 },
                            1024: { slidesPerView: 3 },
                        }}
                        className="cat-cards-swiper"
                    >
                        {categories.map((cat, index) => (
                            <SwiperSlide key={cat._id || index}>
                                <Link
                                    href={`/search?category_id=${cat._id}`}
                                    className="cat-card"
                                >
                                    <div className="cat-image-wrapper">
                                        <img
                                            src={getImgUrl(cat.image)}
                                            alt={cat.title}
                                            className="cat-card-img"
                                            onError={(e) => e.target.src = 'https://placehold.co/400x600?text=No+Image'}
                                        />
                                    </div>
                                    <div className="cat-info">
                                        <h3 className="cat-title">{cat.title}</h3>
                                        <p className="cat-subtitle d-none">{cat.description?.slice(0, 30) || 'Explore Gallery'}</p>
                                    </div>
                                </Link>
                            </SwiperSlide>
                        ))}
                    </Swiper>

                    {/* Navigation Buttons */}
                    <button className="cat-nav-btn cat-nav-prev">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
                    </button>
                    <button className="cat-nav-btn cat-nav-next">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CategoryCards;
