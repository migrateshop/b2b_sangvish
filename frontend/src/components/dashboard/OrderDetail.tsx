import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/services/axiosConfig';
import { useAuth } from '@/context/AuthContext';
import { getImgUrl } from '@/utils/imageConfig';
import OrderTimeline from './OrderTimeline';
import styles from './OrderDetail.module.css';

const STATUS_MAP = {
    pending:   { color: '#d97706', bg: '#fffbeb', border: '#fde68a', label: 'Pending' },
    confirmed: { color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', label: 'Confirmed' },
    shipped:   { color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', label: 'In Transit' },
    delivered: { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', label: 'Delivered' },
    completed: { color: '#059669', bg: '#ecfdf5', border: '#6ee7b7', label: 'Completed' },
    cancelled: { color: '#dc2626', bg: '#fff1f2', border: '#fecdd3', label: 'Cancelled' },
};

const OrderDetail = ({ role = 'buyer', orderId: propOrderId }) => {
    const params = useParams();
    const slug = params?.slug;
    
    // In [...slug] route, subtab might be the second element
    const orderId = propOrderId || params?.id || params?.subtab || (Array.isArray(slug) ? slug[1] : null);

    const navigate = useRouter();
    const { convertPrice } = useAuth();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const { data } = await api.get(`/orders/${orderId}`);
                setOrder(data);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to fetch order details');
            } finally {
                setLoading(false);
            }
        };
        if (orderId) fetchOrder();
    }, [orderId]);

    if (loading) return (
        <div style={{ padding: 60, textAlign: 'center', fontWeight: 700, color: '#0f172a', animation: 'pulse 1.4s ease infinite', fontFamily: 'Inter, sans-serif' }}>
            Loading Order Details…
        </div>
    );

    if (error) return (
        <div style={{ padding: 40, textAlign: 'center' }}>
            <p style={{ color: '#dc2626', fontWeight: 700, fontSize: 16, marginBottom: 16 }}>{error}</p>
            <button onClick={() => navigate.back()} className={styles['od-action-btn'] + " " + styles['primary']}>← Back to Orders</button>
        </div>
    );

    if (!order) return <div style={{ padding: 40, textAlign: 'center' }}>Order not found</div>;

    const statusInfo = STATUS_MAP[order.status?.toLowerCase()] || { color: '#64748b', bg: '#f3f4f6', border: '#e5e7eb', label: order.status };
    const subtotal = order.total_amount - (order.tax_amount || 0) - (order.shipping_fee || 0);

    return (
        <div className={styles['order-detail-page']}>
            <div style={{ maxWidth: 1100, margin: '0 auto', padding: '8px 0' }}>

                {/* ── Header ── */}
                <div className={styles['od-page-header']}>
                    <div>
                        <button onClick={() => navigate.back()} className={styles['od-back-btn']}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="15 18 9 12 15 6"/>
                            </svg>
                            Back to Orders
                        </button>
                        <h1 className={styles['od-page-title']}>Order Details</h1>
                        <p className={styles['od-order-id']}>#{order._id?.slice(-16).toUpperCase()}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <button
                            onClick={() => navigate.push(`/dashboard/invoice/${orderId}`)}
                            className={styles['od-action-btn']}
                            style={{ background: 'white', color: '#374151', border: '1.5px solid #e2e8f0' }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                <polyline points="14 2 14 8 20 8"/>
                                <line x1="16" y1="13" x2="8" y2="13"/>
                                <line x1="16" y1="17" x2="8" y2="17"/>
                                <polyline points="10 9 9 9 8 9"/>
                            </svg>
                            View Invoice
                        </button>
                        {role === 'buyer' && order.status === 'shipped' && (
                            <button className={styles['od-action-btn'] + " " + styles['primary']}>
                                ✓ Confirm Delivery
                            </button>
                        )}
                    </div>
                </div>

                {/* ── Main Layout ── */}
                <div className={styles['od-detail-grid']}>

                    {/* ─── Left Column ─── */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                        {/* Timeline */}
                        <OrderTimeline timeline={order.timeline} currentStatus={order.status} />

                        {/* Order Items */}
                        <div className={styles['od-card']}>
                            <h3 className={styles['od-card-title']}>
                                <div className={styles['od-card-title-icon']} style={{ background: '#eff6ff' }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2.5">
                                        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
                                    </svg>
                                </div>
                                Ordered Items
                                <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 600, color: '#94a3b8' }}>
                                    {order.order_items?.length} item{order.order_items?.length !== 1 ? 's' : ''}
                                </span>
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {order.order_items?.map((item, idx) => (
                                    <div key={idx} className={styles['od-item-row']}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                            <div className={styles['od-item-thumb']}>
                                                <img src={getImgUrl(item.image)} alt={item.name} />
                                            </div>
                                            <div>
                                                <p className={styles['od-item-name']}>{item.name}</p>
                                                <p className={styles['od-item-qty']}>Qty: {item.quantity}</p>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <p className={styles['od-item-price']}>{convertPrice(item.price).formatted}</p>
                                            <p className={styles['od-item-price-label']}>Unit Price</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Shipping & Logistics */}
                        <div className={styles['od-card']}>
                            <h3 className={styles['od-card-title']}>
                                <div className={styles['od-card-title-icon']} style={{ background: '#f0fdf4' }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5">
                                        <rect x="1" y="3" width="15" height="13"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
                                    </svg>
                                </div>
                                Shipping & Logistics
                            </h3>
                            <div className={styles['od-shipping-grid']}>
                                <div>
                                    <p className={styles['od-field-label']}>Delivery Address</p>
                                    {order.shipping_address ? (
                                        <div className={styles['od-field-value']}>
                                            <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>
                                                {order.shipping_address.fullName}
                                            </div>
                                            <div>{order.shipping_address.addressLine}</div>
                                            <div>{order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postalCode}</div>
                                            <div style={{ color: '#0f172a', fontWeight: 700 }}>{order.shipping_address.country}</div>
                                        </div>
                                    ) : (
                                        <p style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: 13 }}>No address provided</p>
                                    )}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    <div className={styles['od-tracking-box']}>
                                        <p className={styles['od-field-label']}>Carrier Service</p>
                                        <p className={styles['od-tracking-val']} style={{ fontFamily: 'Inter, sans-serif', letterSpacing: 'normal' }}>
                                            {order.shipping_company || 'Pending Fulfillment'}
                                        </p>
                                    </div>
                                    <div className={styles['od-tracking-box']}>
                                        <p className={styles['od-field-label']}>Tracking Number</p>
                                        <p className={styles['od-tracking-val']}>{order.tracking_number || 'Not Assigned'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ─── Right Column ─── */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                        {/* Status + Summary */}
                        <div className={styles['od-summary-card']}>
                            <div className={styles['od-summary-status-banner']} style={{ background: statusInfo.bg, borderBottom: `2px solid ${statusInfo.border}` }}>
                                <p className={styles['od-summary-status-label']}>Current Status</p>
                                <p className={styles['od-summary-status-value']} style={{ color: statusInfo.color }}>{statusInfo.label}</p>
                                <div style={{
                                    marginTop: 6,
                                    padding: '3px 14px',
                                    background: statusInfo.border,
                                    borderRadius: 20,
                                    fontSize: 11,
                                    fontWeight: 700,
                                    color: statusInfo.color,
                                    letterSpacing: '0.04em',
                                    textTransform: 'uppercase'
                                }}>
                                    {new Date(order.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                                </div>
                            </div>
                            <div className={styles['od-summary-body']}>
                                <div className={styles['od-summary-row']}>
                                    <span className={styles['od-summary-key']}>Payment</span>
                                    <span className={`payment-badge ${order.payment_status === 'paid' ? 'paid' : 'unpaid'}`} style={{ fontSize: 11, padding: '3px 10px' }}>
                                        {order.payment_status?.toUpperCase()}
                                    </span>
                                </div>
                                <div className={styles['od-summary-row']}>
                                    <span className={styles['od-summary-key']}>Provider</span>
                                    <span className={styles['od-summary-val']}>{order.payment_provider || 'CARD'}</span>
                                </div>
                                <div className={styles['od-summary-row']}>
                                    <span className={styles['od-summary-key']}>Subtotal</span>
                                    <span className={styles['od-summary-val']}>{convertPrice(subtotal).formatted}</span>
                                </div>
                                <div className={styles['od-summary-row']}>
                                    <span className={styles['od-summary-key']}>Tax</span>
                                    <span className={styles['od-summary-val']}>{convertPrice(order.tax_amount || 0).formatted}</span>
                                </div>
                                <div className={styles['od-summary-row']}>
                                    <span className={styles['od-summary-key']}>Shipping</span>
                                    <span className={styles['od-summary-val']}>{convertPrice(order.shipping_fee || 0).formatted}</span>
                                </div>
                                <div className={styles['od-total-row']}>
                                    <span className={styles['od-total-label']}>Total</span>
                                    <span className={styles['od-total-val']}>{convertPrice(order.total_amount).formatted}</span>
                                </div>
                            </div>
                        </div>

                        {/* Supplier Info (Only show to buyer) */}
                        {role === 'buyer' && (
                            <div className={styles['od-supplier-card']}>
                                <p className={styles['od-supplier-label']}>Supplier Information</p>
                                <p className={styles['od-supplier-name']}>{order.supplier_id?.company_name || 'Verified Partner'}</p>
                                <p className={styles['od-supplier-tag']}>✓ Verified Global Supplier</p>
                                <button className={styles['od-supplier-btn']}>
                                    💬 Contact Supplier
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* CSS for payment badge inside this component */}
            <style>{`
                .payment-badge { display: inline-flex; align-items: center; gap: 4px; border-radius: 20px; font-size: 11px; font-weight: 700; }
                .payment-badge.paid { background: #dcfce7; color: #15803d; }
                .payment-badge.unpaid { background: #fff7ed; color: #c2410c; }
            `}</style>
        </div>
    );
};

export default OrderDetail;
