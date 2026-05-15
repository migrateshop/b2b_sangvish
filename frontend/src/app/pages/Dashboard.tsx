'use client';
import React, { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import BuyerDashboard from '@/components/dashboard/BuyerDashboard';
import SupplierDashboard from '@/components/dashboard/SupplierDashboard';
import AdminDashboard from './admin/AdminDashboard';
import Invoice from '@/components/dashboard/Invoice';
import { useAuth } from '@/context/AuthContext';
import { verifySession, verifyPayPal } from '@/services/orderApi';
import api from '@/services/axiosConfig';

const DashboardContent = ({ overrideRole }) => {
    const { user, currentRole } = useAuth();
    const params = useParams();
    // Routes use [...slug] so params is { slug: string[] }
    const slugArr = Array.isArray(params?.slug) ? params.slug : (params?.slug ? [params.slug] : []);
    const tab = slugArr[0] || undefined;
    const subtab = slugArr[1] || undefined;
    const finalRole = overrideRole || currentRole;

    if (finalRole === 'admin') {
        return <AdminDashboard tab={tab} subtab={subtab} />;
    } else if (finalRole === 'supplier') {
        return <SupplierDashboard tab={tab} subtab={subtab} />;
    } else {
        return <BuyerDashboard tab={tab} subtab={subtab} />;
    }
};

const Dashboard = ({ overrideRole }) => {
    const { user, isInitialized } = useAuth();
    const navigate = useRouter();

    const searchParams = useSearchParams();
    const setSearchParams = (params) => {
        navigate.push(`/dashboard?${params.toString()}`, { scroll: false });
    };
    const sessionId = searchParams.get('session_id');
    const payPalToken = searchParams.get('token');
    const razorOrderId = searchParams.get('razorpay_order_id');
    const status = searchParams.get('status');
    const planId = searchParams.get('plan_id');

    const hasSession = (sessionId || payPalToken || razorOrderId) && status === 'success';
    // Subscription payments have plan_id and are verified by the subscription components
    const [verifying, setVerifying] = useState(hasSession && !planId);

    useEffect(() => {
        if (!isInitialized) return;
        
        if (!user) {
            navigate.push('/login');
            return;
        }

        // If 'plan_id' is present, it's a subscription purchase; handled in BuyerSubscription/SupplierSubscription
        if (hasSession && !planId) {
            const verifyPayment = async () => {
                try {
                    if (sessionId) {
                        await verifySession(sessionId);
                    } else if (payPalToken) {
                        await verifyPayPal(payPalToken);
                    } else if (razorOrderId) {
                        await api.post('/orders/verify-razorpay', {
                            razorpay_order_id: razorOrderId,
                            razorpay_payment_id: searchParams.get('razorpay_payment_id'),
                            razorpay_signature: searchParams.get('razorpay_signature')
                        });
                    }
                    
                    // Clean URL
                    const params = new URLSearchParams(searchParams);
                    params.delete('session_id');
                    params.delete('token');
                    params.delete('PayerID');
                    params.delete('razorpay_order_id');
                    params.delete('razorpay_payment_id');
                    params.delete('razorpay_signature');
                    params.delete('status');
                    setSearchParams(params);
                } catch (err) {
                    console.error('Payment verification failed:', err);
                } finally {
                    setVerifying(false);
                }
            };
            verifyPayment();
        }
    }, [user, isInitialized, navigate, searchParams, hasSession, sessionId, payPalToken, razorOrderId, planId]);

    const hasPlanId = searchParams.get('plan_id');
    const isVerifyingOrder = verifying && !hasPlanId;

    if (!isInitialized || !user || isVerifyingOrder) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', gap: '15px' }}>
                <div className="spinner-circle"></div>
                <div style={{ fontSize: '14px', color: '#666', fontWeight: 500 }}>
                    {isVerifyingOrder ? 'Verifying payment...' : 'Loading profile...'}
                </div>
            </div>
        );
    }

    return <DashboardContent overrideRole={overrideRole} />;
};

export default Dashboard;
