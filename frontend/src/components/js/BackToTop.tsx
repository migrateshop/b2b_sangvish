import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

const BackToTop = () => {
    const [isVisible, setIsVisible] = useState(false);
    const pathname = usePathname();

    // Only show on home page ('/')
    const isHomePage = pathname === '/';

    useEffect(() => {
        if (!isHomePage) return;

        const toggleVisibility = () => {
            if (window.pageYOffset > 300) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener('scroll', toggleVisibility);
        return () => window.removeEventListener('scroll', toggleVisibility);
    }, [isHomePage]);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    if (!isHomePage) return null;

    return (
        <div className={`back-to-top-wrapper ${isVisible ? 'visible' : ''}`} onClick={scrollToTop}>
            <div className="btt-btn">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 15l-6-6-6 6" />
                </svg>
            </div>
        </div>
    );
};

export default BackToTop;
