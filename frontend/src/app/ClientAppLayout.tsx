'use client'

import React from 'react';
import { usePathname } from 'next/navigation';
import Header from '@/components/js/Header';
import Footer from '@/components/js/Footer';
import MobileBottomNav from '@/components/js/MobileBottomNav';
import useIsMobile from '@/hooks/useIsMobile';
import ScrollToTop from '@/components/js/ScrollToTop';
import BackToTop from '@/components/js/BackToTop';
import AuthModal from '@/components/js/AuthModal';
import ChatPopup from '@/components/js/ChatPopup';
import SEO from '@/components/js/SEO';

export default function ClientAppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isMobile = useIsMobile(450);
  const isHomeTabletOrMobile = useIsMobile(767);

  // Routes that use their own full-screen layouts (no global header/footer)
  const isFullscreenRoute =
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/supplier/dashboard') ||
    pathname?.startsWith('/buyer/dashboard') ||
    pathname?.startsWith('/dashboard');

  return (
    <>
      <SEO />
      {!isFullscreenRoute && <ScrollToTop />}
      {!isFullscreenRoute && !(pathname === '/' && isHomeTabletOrMobile) && <Header />}
      <main>
        {children}
      </main>
      {!isFullscreenRoute && pathname !== '/ai-sourcing' && <Footer />}
      {isMobile && (!isFullscreenRoute || pathname?.startsWith('/buyer/dashboard') || pathname?.startsWith('/dashboard')) && <MobileBottomNav />}
      {!isFullscreenRoute && <BackToTop />}
      {/* Global Modals/Popups */}
      <AuthModal />
      <ChatPopup />
    </>
  );
}
