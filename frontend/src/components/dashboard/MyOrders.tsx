import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getMyOrders } from '@/services/orderApi';
import { useAuth } from '@/context/AuthContext';
import ReviewModal from './ReviewModal';
import api from '@/services/axiosConfig';
import ConfirmationModal from './ConfirmationModal';
import AlertModal from './AlertModal';
import styles from './MyOrders.module.css';

import { getImgUrl } from '@/utils/imageConfig';

const PaymentBadge = ({ status }: { status: string }) => {
    const cls =
        (status === 'paid' ? 'paid' :
            status === 'disputed' ? 'disputed' :
                status === 'refunded' ? 'refunded' : 'unpaid') as 'paid' | 'disputed' | 'refunded' | 'unpaid';

    const icons = {
        paid: '',
        disputed: '',
        refunded: '',
        unpaid: ''
    };

    return (
        <span className={`${styles['payment-badge']} ${styles[cls] || ''}`}>
            <span style={{ fontSize: '10px', marginRight: '4px' }}>{icons[cls]}</span>
            {status?.toUpperCase()}
        </span>
    );
};

const OrderStatusPill = ({ status }: { status: string }) => {
    const cls = (['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].includes(status) ? status : 'pending') as 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
    const labels = { pending: 'Confirming', confirmed: 'Preparing', shipped: 'In Transit', delivered: 'Delivered', cancelled: 'Cancelled' };
    return <div className={`${styles['order-status-pill']} ${styles[cls] || ''}`}>{labels[cls] || status}</div>;
};

const MyOrders = () => {
    const navigate = useRouter();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { convertPrice } = useAuth();
    const [filterStatus, setFilterStatus] = useState('All');
    const [isReviewModalOpen, setReviewModalOpen] = useState(false);
    const [reviewProductData, setReviewProductData] = useState<any>(null);
    const [reviewOrderId, setReviewOrderId] = useState<any>(null);

    const [disputeModal, setDisputeModal] = useState(false);
    const [disputeOrder, setDisputeOrder] = useState<any>(null);
    const [disputeReason, setDisputeReason] = useState('Item not received');
    const [disputeDesc, setDisputeDesc] = useState('');
    const [disputeLoading, setDisputeLoading] = useState(false);
    const [confirmingDelivery, setConfirmingDelivery] = useState(null);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, orderId: null });
    const [alertModal, setAlertModal] = useState({ isOpen: false, message: '', title: '' });

    const openReviewModal = (product: any, orderId: any) => {
        setReviewProductData(product);
        setReviewOrderId(orderId);
        setReviewModalOpen(true);
    };

    const handleConfirmDelivery = async (orderId: any) => {
        setConfirmingDelivery(orderId);
        try {
            await api.put(`/orders/${orderId}/confirm-delivery`);
            setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: 'delivered' } : o));
            setAlertModal({ isOpen: true, message: 'Delivery confirmed successfully!', title: 'Success' });
        } catch (err) {
            setAlertModal({ isOpen: true, message: (err as any).response?.data?.message || 'Failed to confirm delivery', title: 'Error' });
        } finally {
            setConfirmingDelivery(null);
        }
    };

    const handleOpenDisputeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!disputeOrder) return;
        setDisputeLoading(true);
        try {
            await api.post('/disputes', { order_id: disputeOrder._id, reason: disputeReason, description: disputeDesc });
            setOrders(prev => prev.map(o => o._id === disputeOrder._id ? { ...o, payment_status: 'disputed' } : o));
            setDisputeModal(false);
            setDisputeDesc('');
            setAlertModal({ isOpen: true, message: 'Dispute opened. Our team will review it shortly.', title: 'Dispute Status' });
        } catch (err) {
            setAlertModal({ isOpen: true, message: (err as any).response?.data?.message || 'Failed to open dispute', title: 'Error' });
        } finally {
            setDisputeLoading(false);
        }
    };

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const { data } = await getMyOrders();
                setOrders(data);
            } catch (err) {
                setError((err as any).response?.data?.message || 'Failed to fetch orders');
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, []);

    const filteredOrders = filterStatus === 'All'
        ? orders
        : orders.filter(order => {
            if (filterStatus === 'Confirming') return order.status === 'pending';
            if (filterStatus === 'Unpaid') return order.payment_status === 'unpaid';
            if (filterStatus === 'Preparing to ship') return order.status === 'confirmed';
            if (filterStatus === 'Delivering') return order.status === 'shipped';
            if (filterStatus === 'Refunds & after-sales') return ['refunded', 'disputed'].includes(order.payment_status) || order.status === 'cancelled';
            return true;
        });

    if (loading) return <div className={styles['loading-spinner']}>Loading your orders...</div>;
    if (error) return <div className={styles['alert-error']}>{error}</div>;

    const tabs = ['All', 'Confirming', 'Unpaid', 'Preparing to ship', 'Delivering', 'Refunds & after-sales'];

    return (
        <div className={styles['my-orders-container']}>
            <div className={styles['orders-page-header']}>
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '8px' }}>
                        <div style={{
                            width: '48px', height: '48px',
                            background: 'rgba(255,255,255,0.1)',
                            borderRadius: '14px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: '1px solid rgba(255,255,255,0.15)',
                            backdropFilter: 'blur(10px)'
                        }}>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2">
                                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                                <rect x="9" y="3" width="6" height="4" rx="2" />
                                <path d="M9 12h6M9 16h4" />
                            </svg>
                        </div>
                        <h2 className={styles['orders-page-title']}>My Orders</h2>
                    </div>
                    <p className={styles['orders-page-subtitle']}>{orders.length} order{orders.length !== 1 ? 's' : ''} in your account</p>
                </div>

                {/* Right-side stats */}
                <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{
                        background: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        borderRadius: '16px',
                        padding: '14px 20px',
                        backdropFilter: 'blur(10px)',
                        textAlign: 'center',
                        minWidth: '90px'
                    }}>
                        <div style={{ fontSize: '22px', fontWeight: 900, color: '#fff', lineHeight: 1 }}>{orders.length}</div>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total</div>
                    </div>
                    <div style={{
                        background: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        borderRadius: '16px',
                        padding: '14px 20px',
                        backdropFilter: 'blur(10px)',
                        textAlign: 'center',
                        minWidth: '90px'
                    }}>
                        <div style={{ fontSize: '22px', fontWeight: 900, color: '#34d399', lineHeight: 1 }}>
                            {orders.filter(o => o.payment_status === 'paid').length}
                        </div>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Paid</div>
                    </div>
                    <div style={{
                        background: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        borderRadius: '16px',
                        padding: '14px 20px',
                        backdropFilter: 'blur(10px)',
                        textAlign: 'center',
                        minWidth: '90px'
                    }}>
                        <div style={{ fontSize: '22px', fontWeight: 900, color: '#fb923c', lineHeight: 1 }}>
                            {orders.filter(o => o.status === 'shipped' || o.status === 'confirmed').length}
                        </div>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active</div>
                    </div>
                </div>
            </div>

            <div className={styles['order-tabs-scroll']}>
                {tabs.map(tab => (
                    <button
                        key={tab}
                        className={`${styles['order-tab']} ${filterStatus === tab ? styles['active'] : ''}`}
                        onClick={() => setFilterStatus(tab)}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {filteredOrders.length === 0 ? (
                <div className={styles['order-empty-state']}>
                    <div style={{ width: '100px', height: '100px', background: '#f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                        <svg className={styles['empty-order-icon']} width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
                            <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                            <rect x="9" y="3" width="6" height="4" rx="2" />
                            <circle cx="12" cy="14" r="3" />
                        </svg>
                    </div>
                    <h3 style={{ color: '#0f172a', fontSize: '20px', fontWeight: 800, margin: '0 0 8px' }}>No orders found</h3>
                    <p style={{ color: '#64748b', fontSize: '15px', fontWeight: 500, maxWidth: '300px', margin: '0 auto' }}>We couldn't find any orders matching your current filter.</p>
                </div>
            ) : (
                <div className={styles['order-list']}>
                    {filteredOrders.map(order => (
                        <div key={order._id} className={styles['order-card']}>
                            {/* ── Card Header ── */}
                            <div className={styles['order-card-header']}>
                                <div>
                                    <div className={styles['order-id-label']}>Order ID</div>
                                    <div className={styles['order-id-value']}>#{order._id?.slice(-12).toUpperCase()}</div>
                                </div>
                                <div className={styles['order-header-meta']}>
                                    <span className={styles['order-date-badge']}>
                                        {new Date(order.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </span>
                                    <PaymentBadge status={order.payment_status} />
                                </div>
                            </div>

                            {/* ── Card Body ── */}
                            <div className={styles['order-card-body']}>
                                <div className={styles['order-card-main']}>
                                    {/* Supplier Info */}
                                    {order.supplier_id && (
                                        <div className={styles['order-party-info']}>
                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5">
                                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
                                            </svg>
                                            <span className={styles['order-party-label']}>Supplier:</span>
                                            <span className={styles['order-party-name']}>
                                                {order.supplier_id.company_name || `${order.supplier_id.first_name} ${order.supplier_id.last_name}`}
                                            </span>
                                        </div>
                                    )}

                                    {/* Items */}
                                    <div className={styles['order-items']}>
                                        {order.order_items.map((item: any) => (
                                            <div key={item._id} className={styles['order-item-row']}>
                                                <div className={styles['order-item-img']}>
                                                    <img src={getImgUrl(item.image)} alt={item.name} />
                                                </div>
                                                <div className={styles['order-item-info']}>
                                                    <div className={styles['order-item-name']}>{item.name}</div>
                                                    <div className={styles['order-item-price']}>
                                                        {convertPrice(item.price).formatted} × {item.quantity}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Footer: Total + Tracking */}
                                    <div className={styles['order-card-footer']}>
                                        <div>
                                            <div className={styles['order-total-label']}>Order Total</div>
                                            <div className={styles['order-total-amount']}>{convertPrice(order.total_amount).formatted}</div>
                                        </div>
                                        {(order.tracking_number || order.shipping_company) && (
                                            <div className={styles['tracking-badge']}>
                                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1e40af" strokeWidth="2.5">
                                                    <rect x="1" y="3" width="15" height="13" /><path d="M16 8h4l3 3v5h-7V8z" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
                                                </svg>
                                                <span className={styles['tracking-carrier']}>{order.shipping_company}</span>
                                                <span className={styles['tracking-number']}>{order.tracking_number}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* ── Actions Column ── */}
                                <div className={styles['order-card-actions']}>
                                    <OrderStatusPill status={order.status} />

                                    {order.payment_status === 'unpaid' && (
                                        <button
                                            className={`${styles['btn-action-primary']} ${styles['btn-pay']}`}
                                            onClick={() => {
                                                if (order.stripe_session_id) {
                                                    setAlertModal({ isOpen: true, message: 'Please contact support to resume payment, or start a new order.', title: 'Payment Issue' });
                                                }
                                            }}
                                        >
                                            Pay Now
                                        </button>
                                    )}

                                    {order.status === 'shipped' && order.payment_status === 'paid' && (
                                        <button
                                            className={`${styles['btn-action-primary']} ${styles['btn-confirm-delivery']}`}
                                            onClick={() => setConfirmModal({ isOpen: true, orderId: order._id })}
                                            disabled={confirmingDelivery === order._id}
                                        >
                                            {confirmingDelivery === order._id ? 'Confirming…' : 'Confirm Delivery'}
                                        </button>
                                    )}

                                    {order.payment_status === 'paid' && !['disputed', 'refunded'].includes(order.payment_status) && (
                                        <button
                                            className={styles['btn-dispute-outline']}
                                            onClick={() => { setDisputeOrder(order); setDisputeModal(true); }}
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                                            </svg>
                                            Open Dispute
                                        </button>
                                    )}

                                    {order.payment_status === 'disputed' && (
                                        <button
                                            className={styles['btn-dispute-active']}
                                            onClick={() => {
                                                const baseRoute = typeof window !== 'undefined' && window.location.pathname.includes('/buyer/dashboard') ? '/buyer/dashboard' : '/dashboard';
                                                navigate.push(`${baseRoute}/disputes`);
                                            }}
                                        >
                                            <span className={styles['pulse-dot']} />
                                            Dispute Open
                                        </button>
                                    )}
                                    {order.payment_status === 'refunded' && (
                                        <div className={`${styles['status-label-badge']} ${styles['refunded']}`}>Refunded</div>
                                    )}

                                    {order.order_items.length > 0 && order.status === 'delivered' && (
                                        <button
                                            className={styles['btn-ghost']}
                                            onClick={() => openReviewModal(order.order_items[0], order._id)}
                                        >
                                            Leave Review
                                        </button>
                                    )}

                                    <button
                                        className={styles['btn-ghost']}
                                        onClick={() => {
                                            const baseRoute = typeof window !== 'undefined' && window.location.pathname.includes('/buyer/dashboard') ? '/buyer/dashboard' : '/dashboard';
                                            navigate.push(`${baseRoute}/invoice/${order._id}`);
                                        }}
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '6px', verticalAlign: 'middle' }}>
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                            <polyline points="7 10 12 15 17 10" />
                                            <line x1="12" y1="15" x2="12" y2="3" />
                                        </svg>
                                        Download Invoice
                                    </button>

                                    <button
                                        className={styles['btn-ghost']}
                                        onClick={() => {
                                            const baseRoute = typeof window !== 'undefined' && window.location.pathname.includes('/buyer/dashboard') ? '/buyer/dashboard' : '/dashboard';
                                            navigate.push(`${baseRoute}/orders/${order._id}`);
                                        }}
                                    >
                                        View Details →
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {reviewProductData && (
                <ReviewModal
                    isOpen={isReviewModalOpen}
                    onClose={() => setReviewModalOpen(false)}
                    product={reviewProductData}
                    orderId={reviewOrderId}
                />
            )}

            {/* Dispute Modal */}
            {disputeModal && disputeOrder && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: '16px' }}>
                    <div className={styles['dispute-modal-inner']} style={{ background: '#fff', borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '460px', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                            <div style={{ width: 40, height: 40, background: '#fff1f2', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e11d48" strokeWidth="2.5">
                                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                                </svg>
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>Open a Dispute</h3>
                                <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>
                                    {disputeOrder.order_items[0]?.name || `Order #${String(disputeOrder._id).slice(-8).toUpperCase()}`}
                                </p>
                            </div>
                        </div>
                        <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '20px 0' }} />
                        <form onSubmit={handleOpenDisputeSubmit}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reason</label>
                                <select
                                    value={disputeReason}
                                    onChange={e => setDisputeReason(e.target.value)}
                                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '14px', fontFamily: 'Inter, sans-serif', outline: 'none', background: '#f8fafc', boxSizing: 'border-box' }}
                                >
                                    {['Item not received', 'Item not as described', 'Damaged item', 'Wrong item sent', 'Partial delivery', 'Quality issue', 'Other'].map(r => (
                                        <option key={r} value={r}>{r}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description</label>
                                <textarea
                                    required
                                    value={disputeDesc}
                                    onChange={e => setDisputeDesc(e.target.value)}
                                    rows={4}
                                    placeholder="Please describe the issue in detail..."
                                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '14px', fontFamily: 'Inter, sans-serif', outline: 'none', resize: 'vertical', boxSizing: 'border-box', background: '#f8fafc' }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setDisputeModal(false)} style={{ padding: '10px 20px', borderRadius: '10px', border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', fontWeight: 700, fontSize: '13px', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                                    Cancel
                                </button>
                                <button type="submit" disabled={disputeLoading} style={{ padding: '10px 24px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #dc2626, #b91c1c)', color: '#fff', fontWeight: 700, fontSize: '13px', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                                    {disputeLoading ? 'Submitting…' : 'Submit Dispute'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false, orderId: null })}
                onConfirm={() => handleConfirmDelivery(confirmModal.orderId)}
                title="Confirm Receipt"
                message="Confirm that you have received this order?"
                confirmText="OK"
                cancelText="Cancel"
            />

            <AlertModal
                isOpen={alertModal.isOpen}
                onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
                message={alertModal.message}
                title={alertModal.title}
            />
        </div>
    );
};

export default MyOrders;
