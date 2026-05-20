'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useRouter, useParams } from 'next/navigation';
import api from '@/services/axiosConfig';
import { getImgUrl } from '@/utils/imageConfig';
import styles from './AdminLayout.module.css';


interface OrderItem {
    name: string;
    price: number;
    quantity: number;
    image?: string;
    productId?: any;
}

interface Order {
    _id: string;
    status: string;
    payment_status: string;
    total_amount: number;
    tax_amount?: number;
    shipping_fee?: number;
    service_fee?: number;
    shipping_address?: any;
    order_items?: OrderItem[];
    shipping_company?: string;
    tracking_number?: string;
    supplier_id?: {
        _id: string;
        first_name: string;
        last_name: string;
        email: string;
        company_name?: string;
        is_verified?: boolean;
        subscription_plan?: string;
    };
    buyer_id?: {
        first_name: string;
        last_name: string;
        email: string;
    };
    tax_info?: {
        name?: string;
    };
}

const AdminOrderDetail = () => {
    const { t, convertPrice } = useAuth();
    const { showToast } = useToast();
    const { id } = useParams();
    const router = useRouter();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [supplierCompany, setSupplierCompany] = useState<any>(null);
    
    // Tracking States
    const [sc, setSc] = useState('');
    const [tn, setTn] = useState('');

    useEffect(() => {
        fetchOrderDetail();
    }, [id]);

    const fetchOrderDetail = async () => {
        try {
            const { data } = await api.get(`/orders/admin/all`);
            const foundOrder = data.find((o: any) => o._id === id);
            setOrder(foundOrder);
            if (foundOrder) {
                setSc(foundOrder.shipping_company || '');
                setTn(foundOrder.tracking_number || '');
                if (foundOrder.supplier_id && foundOrder.supplier_id._id) {
                    try {
                        const { data: cData } = await api.get(`/company/supplier/${foundOrder.supplier_id._id}`);
                        setSupplierCompany(cData?.company);
                    } catch (err) { }
                }
            }
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const updateStatus = async (newStatus?: string) => {
        if (!order) return;
        setUpdating(true);
        try {
            await api.put(`/orders/${id}/status`, { 
                status: newStatus || order.status,
                tracking_number: tn,
                shipping_company: sc
            });
            showToast('Order status updated', 'success');
            fetchOrderDetail();
        } catch (err) {
            showToast('Failed to update status', 'error');
        } finally {
            setUpdating(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'confirmed': return "admin-badge-success";
            case 'pending': return "admin-badge-warning";
            case 'shipped': return "admin-badge-info";
            case 'cancelled': return "admin-badge-danger";
            case 'delivered': return "admin-badge-neutral";
            default: return "admin-badge-neutral";
        }
    };

    const getPaymentStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'paid': return "admin-badge-success";
            case 'refunded': return "admin-badge-warning";
            case 'unpaid': return "admin-badge-danger";
            case 'disputed': return "admin-badge-danger";
            default: return "admin-badge-neutral";
        }
    };

    if (loading) return <div className={"admin-loading-text"}>Loading Order Details...</div>;
    if (!order) return <div className={styles['admin-alert'] + " " + styles['admin-alert-error'] + " " + styles['m-8']}>Order not found.</div>;

    const shippingAddress = order.shipping_address || {};

    return (
        <div className={"admin-page"}>
            <div className={"admin-page-header"}>
                <div>
                    <h1 className={"admin-page-title"}>Order Detail</h1>
                    <p className={"admin-page-subtitle"}>Order #{order._id}</p>
                </div>
                <div className={"admin-page-actions"}>
                    <button onClick={() => router.back()} className={styles['admin-back-btn']}>
                        ← Back to Orders
                    </button>
                </div>
            </div>

            <div className={styles['admin-order-detail-grid']}>
                
                {/* Left side: Items & Addresses */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    
                    <div className={"admin-card"}>
                        <div className={"admin-card-header"}>
                            <h2>Order Items</h2>
                        </div>
                        <div className={"admin-card-body"} style={{ padding: '0' }}>
                            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                                <table className={"admin-table"} style={{ minWidth: '600px' }}>
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Price</th>
                                        <th>Qty</th>
                                        <th style={{ textAlign: 'right' }}>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {order.order_items?.map((item: OrderItem, idx: number) => {
                                        const imgPath = item.image || item.productId?.image || null;
                                        const imgSrc = getImgUrl(imgPath);
                                        return (
                                            <tr key={idx}>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <div style={{ width: '44px', height: '44px', borderRadius: '8px', background: 'var(--admin-bg)', border: '1px solid var(--admin-border)', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            {imgSrc ? (
                                                                <img src={imgSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onErrorCapture={(e: any) => e.target.style.display = 'none'} />
                                                            ) : (
                                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                                                                    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                                                                    <path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" />
                                                                </svg>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="text-admin-main" style={{ fontSize: '13px', fontWeight: 800, maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                {item.name}
                                                            </div>
                                                            <div style={{ fontSize: '10px', color: 'var(--admin-text-muted)', fontWeight: 700 }}>SKU: {typeof item.productId === 'string' ? item.productId.substring(18, 24).toUpperCase() : item.productId?._id?.substring(18, 24).toUpperCase() || 'N/A'}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                 <td className="text-admin-main" style={{ fontWeight: 800 }}>{convertPrice(item.price || 0).formatted}</td>
                                                 <td className="text-admin-main" style={{ fontWeight: 800 }}>{item.quantity}</td>
                                                 <td className="text-admin-main" style={{ textAlign: 'right', fontWeight: 900 }}>
                                                     {convertPrice((item.price || 0) * item.quantity).formatted}
                                                 </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Price Summary Breakdown */}
                            <div className={styles['admin-order-summary-box']}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', width: '250px', fontSize: '12px', fontWeight: 700, color: 'var(--admin-text-muted)' }}>
                                    <span>Subtotal</span>
                                    <span style={{ color: 'var(--admin-text-secondary)' }}>{convertPrice(order.total_amount - (order.tax_amount || 0) - (order.shipping_fee || 0) - (order.service_fee || 0)).formatted}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', width: '250px', fontSize: '12px', fontWeight: 700, color: 'var(--admin-text-muted)' }}>
                                    <span>Tax {order.tax_info?.name ? `(${order.tax_info.name})` : ''}</span>
                                    <span style={{ color: 'var(--admin-text-secondary)' }}>{convertPrice(order.tax_amount || 0).formatted}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', width: '250px', fontSize: '12px', fontWeight: 700, color: 'var(--admin-text-muted)' }}>
                                    <span>Shipping Fee</span>
                                    <span style={{ color: 'var(--admin-text-secondary)' }}>{convertPrice(order.shipping_fee || 0).formatted}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', width: '250px', fontSize: '12px', fontWeight: 700, color: 'var(--admin-text-muted)' }}>
                                    <span>Service Fee</span>
                                    <span style={{ color: 'var(--admin-text-secondary)' }}>{convertPrice(order.service_fee || 0).formatted}</span>
                                </div>
                                <div className="text-admin-main" style={{ display: 'flex', justifyContent: 'space-between', width: '250px', fontSize: '14px', fontWeight: 900, borderTop: '1px dashed var(--admin-border)', paddingTop: '12px', marginTop: '4px' }}>
                                    <span style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Amount</span>
                                    <span className="text-admin-main" style={{ fontSize: '18px' }}>{convertPrice(order.total_amount || 0).formatted}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={styles['admin-form-grid']}>
                        <div className={"admin-card"}>
                            <div className={"admin-card-header"}>
                                <h2>Customer Info</h2>
                            </div>
                            <div className={"admin-card-body"}>
                                <div style={{ marginBottom: '16px' }}>
                                    <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Name</div>
                                    <div className="text-admin-main" style={{ fontSize: '14px', fontWeight: 800 }}>{order.buyer_id?.first_name} {order.buyer_id?.last_name}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Email</div>
                                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--admin-text-secondary)' }}>{order.buyer_id?.email}</div>
                                </div>
                            </div>
                        </div>

                        <div className={"admin-card"}>
                            <div className={"admin-card-header"}>
                                <h2>Supplier Info</h2>
                            </div>
                            <div className={"admin-card-body"}>
                                <div style={{ marginBottom: '16px' }}>
                                    <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Company</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div className="text-admin-main" style={{ fontSize: '14px', fontWeight: 800 }}>{supplierCompany?.company_name || order.supplier_id?.company_name || `${order.supplier_id?.first_name || ''} ${order.supplier_id?.last_name || ''}`.trim() || 'N/A'}</div>
                                        {(order.supplier_id?.is_verified || order.supplier_id?.subscription_plan) && (
                                            <span className={"admin-badge" + " " + "admin-badge-success"} style={{ fontSize: '10px', padding: '2px 6px' }}>✓ Premium</span>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Contact</div>
                                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--admin-text-secondary)' }}>{order.supplier_id?.first_name} {order.supplier_id?.last_name}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={"admin-card"}>
                        <div className={"admin-card-header"}>
                            <h2>Shipping Address</h2>
                        </div>
                        <div className={"admin-card-body"}>
                            {shippingAddress.addressLine ? (
                                <div style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--admin-text-secondary)', fontWeight: 600 }}>
                                    <div className="text-admin-main" style={{ fontWeight: 800 }}>{shippingAddress.fullName}</div>
                                    {shippingAddress.phone && <div>Phone: {shippingAddress.phone}</div>}
                                    {shippingAddress.addressLine}<br />
                                    {shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}<br />
                                    {shippingAddress.country}
                                </div>
                            ) : Object.keys(shippingAddress).length > 0 ? (
                                <div style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--admin-text-secondary)', fontWeight: 600 }}>
                                    {Object.values(shippingAddress).filter(Boolean).join(', ')}
                                </div>
                            ) : (
                                <div style={{ fontSize: '13px', color: 'var(--admin-text-muted)', fontStyle: 'italic' }}>No shipping address provided.</div>
                            )}
                        </div>
                    </div>

                </div>

                {/* Right side: Status & Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    
                    <div className={"admin-card"}>
                        <div className={"admin-card-header"}>
                            <h2>Status & Actions</h2>
                        </div>
                        <div className={"admin-card-body"}>
                            <div style={{ marginBottom: '24px' }}>
                                <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Order Status</div>
                                <span className={`${"admin-badge"} ${getStatusColor(order.status)}`} style={{ fontSize: '12px', padding: '6px 16px' }}>
                                    {order.status}
                                </span>
                            </div>

                            <div style={{ marginBottom: '24px' }}>
                                <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Payment Status</div>
                                <span className={`${"admin-badge"} ${getPaymentStatusColor(order.payment_status)}`} style={{ fontSize: '12px', padding: '6px 16px' }}>
                                    {order.payment_status}
                                </span>
                            </div>

                            <div style={{ marginBottom: '24px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Tracking Info</div>
                                    <button 
                                        onClick={() => updateStatus()} 
                                        disabled={updating || (sc === order.shipping_company && tn === order.tracking_number)}
                                        className="text-admin-main"
                                        style={{ fontSize: '10px', background: 'none', border: 'none', fontWeight: 800, cursor: 'pointer', opacity: (sc === order.shipping_company && tn === order.tracking_number) ? 0 : 1, transition: 'opacity 0.2s', textDecoration: 'underline' }}
                                    >
                                        Save Info
                                    </button>
                                </div>
                                <div className={styles['admin-section-box']} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div>
                                        <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--admin-text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Carrier</div>
                                        <input 
                                            type="text" 
                                            className={styles['admin-form-input']} 
                                            value={sc} 
                                            onChange={e => setSc(e.target.value)} 
                                            placeholder="e.g. FedEx, UPS, DHL..." 
                                            style={{ padding: '8px 12px', fontSize: '12px' }}
                                        />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--admin-text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Tracking Number</div>
                                        <input 
                                            type="text" 
                                            className={styles['admin-form-input']} 
                                            value={tn} 
                                            onChange={e => setTn(e.target.value)} 
                                            placeholder="Tracking Code" 
                                            style={{ padding: '8px 12px', fontSize: '12px', fontFamily: 'monospace' }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid var(--admin-border-subtle)', paddingTop: '24px' }}>
                                <div style={{ fontSize: '13px', fontWeight: 900, color: 'var(--admin-text-main)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px', lineHeight: '1.4', paddingTop: '16px' }}>Update Status</div>
                                
                                <button
                                    onClick={() => updateStatus('confirmed')}
                                    disabled={updating || order.status === 'confirmed'}
                                    className={`${styles['admin-btn']} ${styles['admin-btn-success']}`}
                                    style={{ width: '100%', justifyContent: 'center' }}
                                >
                                    Mark as Confirmed
                                </button>

                                <button
                                    onClick={() => updateStatus('shipped')}
                                    disabled={updating || order.status === 'shipped'}
                                    className={`${styles['admin-btn']} ${styles['admin-btn-primary']}`}
                                    style={{ width: '100%', justifyContent: 'center' }}
                                >
                                    Mark as Shipped
                                </button>

                                <button
                                    onClick={() => updateStatus('delivered')}
                                    disabled={updating || order.status === 'delivered'}
                                    className={`${styles['admin-btn']} ${styles['admin-btn-secondary']}`}
                                    style={{ width: '100%', justifyContent: 'center' }}
                                >
                                    Mark as Delivered
                                </button>

                                <button
                                    onClick={() => updateStatus('cancelled')}
                                    disabled={updating || order.status === 'cancelled'}
                                    className={`${styles['admin-btn']} ${styles['admin-btn-danger']}`}
                                    style={{ width: '100%', justifyContent: 'center', marginTop: '12px' }}
                                >
                                    Cancel Order
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default AdminOrderDetail;
