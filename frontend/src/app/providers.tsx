'use client'

import React, { Suspense } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { ChatProvider } from '@/context/ChatContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { ToastProvider } from '@/context/ToastContext';
import { HelmetProvider } from 'react-helmet-async';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <HelmetProvider>
        <AuthProvider>
          <ToastProvider>
            <ChatProvider>
              <NotificationProvider>
                <ThemeProvider>
                  {children}
                </ThemeProvider>
              </NotificationProvider>
            </ChatProvider>
          </ToastProvider>
        </AuthProvider>
      </HelmetProvider>
    </Suspense>
  );
}
