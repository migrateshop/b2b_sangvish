import React, { createContext, useContext, useState, useCallback } from 'react';

interface Toast {
    id: number;
    message: string;
    type: string;
    title?: string;
    exiting?: boolean;
}

interface ToastContextType {
    showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info', title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const addToast = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success', title = '') => {
        const id = Date.now() + Math.random();
        const newToast: Toast = { id, message, type, title };
        setToasts(prev => [...prev, newToast]);

        // Auto remove after 5 seconds
        setTimeout(() => {
            // Add exit class before removing
            setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
            setTimeout(() => removeToast(id), 300);
        }, 5000);
    }, [removeToast]);

    return (
        <ToastContext.Provider value={{ showToast: addToast }}>
            {children}
            <div className="toast-container">
                {toasts.map(toast => {
                    let icon = null;
                    if (toast.type === 'success') icon = <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg>;
                    if (toast.type === 'error') icon = <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
                    if (toast.type === 'warning' || toast.type === 'info') icon = <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

                    return (
                        <div 
                            key={toast.id} 
                            className={`toast-item ${toast.type} ${toast.exiting ? 'toast-exit' : ''}`}
                        >
                            <div className="toast-icon">{icon}</div>
                            <div className="toast-content">
                                {toast.title && <div className="toast-title">{toast.title}</div>}
                                <div className="toast-message-text">{toast.message}</div>
                            </div>
                            <div className="toast-close" onClick={() => removeToast(toast.id)}>
                                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                        </div>
                    );
                })}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

