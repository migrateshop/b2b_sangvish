import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

import { useAuth } from '@/context/AuthContext';
import api from '@/services/axiosConfig';
import { getImgUrl } from '@/utils/imageConfig';

const Footer = () => {
    const { t, siteSettings } = useAuth();
    const location = usePathname();
    const [sections, setSections] = useState([]);

    useEffect(() => {
        const fetchFooter = async () => {
            try {
                const { data } = await api.get('/common/footer-sections');
                if (data && data.length > 0) {
                    setSections(data);
                }
            } catch (err) {
                console.error('Failed to load dynamic footer', err);
            }
        };
        fetchFooter();
    }, []);

    const isDashboard = location === '/dashboard' ||
        location.startsWith('/supplier') ||
        location.startsWith('/admin') ||
        location.startsWith('/buyer');

    if (isDashboard) {
        return null;
    }

    return (
        <footer className="footer-section">
            <div className="container">
                <div className="footer-container">
                    {/* Brand Column */}
                    <div className="footer-brand">
                        <div className="logo">
                            <Link href="/" className="d-flex align-items-center gap-2 text-decoration-none">
                                {siteSettings?.logo_light ? (
                                    <img src={getImgUrl(siteSettings.logo_light)} alt={siteSettings?.site_name} style={{ maxHeight: '40px' }} />
                                ) : (
                                    <>
                                        <div className="logo-icon">{siteSettings?.site_name?.charAt(0) || 'B'}</div>
                                        <span className="logo-text-large">{siteSettings?.site_name || 'B2B Mart'}</span>
                                    </>
                                )}
                            </Link>
                        </div>
                        <div className="brand-desc">
                            <p>
                                {siteSettings?.footer_description ||
                                    "A trusted global marketplace connecting buyers and suppliers across 190+ countries."}
                            </p>
                        </div>
                        <div className="footer-social-links">
                            {siteSettings?.facebook_url && (
                                <a href={siteSettings.facebook_url} target="_blank" rel="noopener noreferrer" className="social-icon-btn">
                                    <i className="fab fa-facebook-f"></i>
                                </a>
                            )}
                            {siteSettings?.twitter_url && (
                                <a href={siteSettings.twitter_url} target="_blank" rel="noopener noreferrer" className="social-icon-btn">
                                    <i className="fab fa-twitter"></i>
                                </a>
                            )}
                            {siteSettings?.linkedin_url && (
                                <a href={siteSettings.linkedin_url} target="_blank" rel="noopener noreferrer" className="social-icon-btn">
                                    <i className="fab fa-linkedin-in"></i>
                                </a>
                            )}
                            {siteSettings?.youtube_url && (
                                <a href={siteSettings.youtube_url} target="_blank" rel="noopener noreferrer" className="social-icon-btn">
                                    <i className="fab fa-youtube"></i>
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Dynamic Link Columns */}
                    {sections.map(section => (
                        <div key={section._id} className="footer-column">
                            <h4>{section.label}</h4>
                            <ul>
                                {section.links.map((link, idx) => (
                                    <li key={idx}>
                                        <Link href={link.url}>{link.title}</Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}

                    {/* Fallback columns if sections are empty */}
                    {sections.length === 0 && (
                        <>
                            <div className="footer-column">
                                <h4>SHOP</h4>
                                <ul>
                                    <li><Link href="/categories">All Categories</Link></li>
                                    <li><Link href="/section/new-arrivals">New Arrivals</Link></li>
                                    <li><Link href="/best-sellers">Best Sellers</Link></li>
                                    <li><Link href="/clearance">Clearance</Link></li>
                                </ul>
                            </div>
                            <div className="footer-column">
                                <h4>COMPANY</h4>
                                <ul>
                                    <li><Link href="/about">About Us</Link></li>
                                    <li><Link href="/careers">Careers</Link></li>
                                    <li><Link href="/press">Press</Link></li>
                                    <li><Link href="/blog">Blog</Link></li>
                                </ul>
                            </div>
                            <div className="footer-column">
                                <h4>SUPPORT</h4>
                                <ul>
                                    <li><Link href="/help">Help Center</Link></li>
                                    <li><Link href="/contact">Contact Us</Link></li>
                                    <li><Link href="/returns">Returns</Link></li>
                                    <li><Link href="/shipping">Shipping Info</Link></li>
                                </ul>
                            </div>
                        </>
                    )}
                </div>

                <div className="footer-bottom">
                    <div className="copyright">
                        {siteSettings?.copyright || `© ${new Date().getFullYear()} ${siteSettings?.site_name || 'B2B Mart'}. All rights reserved.`}
                    </div>
                    <div className="legal-links">
                        <Link href="/privacy-policy">Privacy Policy</Link>
                        <Link href="/terms-of-service">Terms of Service</Link>
                        <Link href="/cookie-policy">Cookie Policy</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
