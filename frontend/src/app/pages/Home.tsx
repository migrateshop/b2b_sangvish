'use client';
import React, { Suspense, lazy, useState, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import api from '@/services/axiosConfig';
import Worldwide from './Worldwide';
import SupplierHomeLayout from '@/components/js/SupplierHomeLayout';
import Partners from '@/components/js/Partners';
import AllProducts from '@/components/js/AllProducts';
import MobileHomePage from '@/components/js/MobileHomePage';

// Lazy-loaded homepage sections for performance
const HeroBanner = lazy(() => import('@/components/js/HeroBanner'));
const HomeCategories = lazy(() => import('@/components/js/HomeCategories'));
const FeaturedSuppliers = lazy(() => import('@/components/js/FeaturedSuppliers'));
const IndustrySection = lazy(() => import('@/components/js/IndustrySection'));
const RFQSection = lazy(() => import('@/components/js/RFQSection'));
const FeaturedSelections = lazy(() => import('@/components/js/FeaturedSelections'));
const WhyChooseUs = lazy(() => import('@/components/js/WhyChooseUs'));
const AppPromoSection = lazy(() => import('@/components/js/AppPromoSection'));

/* ─── Custom hook: detect mobile viewport ─── */
const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const checkMobile = () => window.innerWidth <= 991;
        setIsMobile(checkMobile());
        const mq = window.matchMedia('(max-width: 991px)');
        const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);
    return isMobile;
};

const SectionLoader = () => (
    <div style={{
        height: '200px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#bbb',
        fontSize: '14px',
    }}>
        Loading...
    </div>
);

const Home = () => {
    const location = usePathname();
    const searchParams = useSearchParams();
    const tab = searchParams.get('tab') || 'products';
    const isMobile = useIsMobile();

    const [sections, setSections] = useState<any[]>([]);
    const [loadingSections, setLoadingSections] = useState(true);

    useEffect(() => {
        api.get('/homepage-sections')
            .then(res => { if (res.data) setSections(res.data); })
            .catch(err => console.error('Error fetching homepage sections:', err));
    }, []);

    const componentMap = {
        hero_banner: HeroBanner,
        categories: HomeCategories,
        featured_selections: FeaturedSelections,
        featured_suppliers: FeaturedSuppliers,
        industry_section: IndustrySection,
        rfq_section: RFQSection,
        why_choose_us: WhyChooseUs,
        app_promo: AppPromoSection,
        // Removed trending_products to prevent duplicate "Top Deals" section
    };

    /* ── MOBILE layout (≤ 767 px) ── */
    if (isMobile) {
        return <MobileHomePage />;
    }

    /* ── Special tabs ── */
    if (tab === 'suppliers') {
        return (
            <div className="home-page">
                <SupplierHomeLayout />
                <Partners />
            </div>
        );
    }

    if (tab === 'worldwide') {
        return (
            <div className="home-page">
                <Worldwide />
                <AllProducts forceWorldwide={true} />
            </div>
        );
    }

    /* ── DESKTOP layout ── */
    return (
        <div className="home-page alibaba-home">
            <Suspense fallback={<SectionLoader />}>
                {sections
                    .filter(s => s.is_active)
                    .sort((a, b) => a.order - b.order)
                    .map((section: any) => {
                        const Comp = (componentMap as any)[section.id_name];
                        if (!Comp) return null;
                        return (
                            <Comp key={section._id || section.id_name} config={section} />
                        );
                    })
                }
            </Suspense>
        </div>
    );
};

export default Home;
