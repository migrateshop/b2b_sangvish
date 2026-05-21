import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSupplierOrders, updateOrderStatus } from '@/services/orderApi';
import { useAuth } from '@/context/AuthContext';
import AlertModal from '../AlertModal';
import styles from '../MyOrders.module.css';



import { getImgUrl } from '@/utils/imageConfig';

const PaymentBadge = ({ status, method }: { status: string; method?: string }) => {
    const cls =
        (status === 'paid' ? 'paid' :
            status === 'disputed' ? 'disputed' :
                status === 'refunded' ? 'refunded' : 'unpaid') as 'paid' | 'disputed' | 'refunded' | 'unpaid';

    const icons = {
        paid: '✓',
        disputed: '!',
        refunded: '↺',
        unpaid: '○'
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
            <span className={`${styles['payment-badge']} ${styles[cls]}`}>
                <span style={{ fontSize: '10px', marginRight: '4px' }}>{icons[cls]}</span>
                {status?.toUpperCase()}
            </span>
            {method && <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>{method}</span>}
        </div>
    );
};

const OrderStatusPill = ({ status }: { status: string }) => {
    const map = {
        pending: { cls: 'pending', label: 'New Request' },
        confirmed: { cls: 'confirmed', label: 'Confirmed' },
        shipped: { cls: 'shipped', label: 'In Transit' },
        delivered: { cls: 'delivered', label: 'Delivered' },
        cancelled: { cls: 'cancelled', label: 'Cancelled' },
    } as const;
    const key = (['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].includes(status) ? status : 'pending') as keyof typeof map;
    const { cls, label } = map[key] || { cls: 'pending', label: status };
    return <div className={`${styles['order-status-pill']} ${styles[cls]}`}>{label}</div>;
};

const SupplierOrders = () => {
    const navigate = useRouter();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { convertPrice } = useAuth();
    const [filterStatus, setFilterStatus] = useState('All');
    const [updatingOrderId, setUpdatingOrderId] = useState<any>(null);
    const [alertModal, setAlertModal] = useState({ isOpen: false, message: '', title: '' });
    const [editOrderData, setEditOrderData] = useState<any>(null);

    useEffect(() => { fetchOrders(); }, []);

    const fetchOrders = async () => {
        try {
            const { data } = await getSupplierOrders();
            setOrders(data);
        } catch (err) {
            setError((err as any).response?.data?.message || 'Failed to fetch orders');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (orderId: any, newStatus: any) => {
        setUpdatingOrderId(orderId);
        try {
            await updateOrderStatus(orderId, { status: newStatus });
            setOrders(orders.map((o: any) => o._id === orderId ? { ...o, status: newStatus } : o));
            setAlertModal({ isOpen: true, message: `Order status updated to ${newStatus}`, title: 'Update Successful' });
        } catch (err) {
            setAlertModal({ isOpen: true, message: (err as any).response?.data?.message || 'Failed to update order status', title: 'Update Error' });
        } finally {
            setUpdatingOrderId(null);
        }
    };

    const handleSaveTracking = async (e: React.FormEvent, orderId: any) => {
        e.preventDefault();
        if (!editOrderData) return;
        setUpdatingOrderId(orderId);
        try {
            await updateOrderStatus(orderId, {
                tracking_number: editOrderData.tracking_number,
                shipping_company: editOrderData.shipping_company,
                status: 'shipped'
            });
            setOrders(orders.map((o: any) => o._id === orderId ? {
                ...o,
                tracking_number: editOrderData.tracking_number,
                shipping_company: editOrderData.shipping_company,
                status: 'shipped'
            } : o));
            setEditOrderData(null);
            setAlertModal({ isOpen: true, message: 'Tracking information saved successfully!', title: 'Shipping Updated' });
        } catch (err) {
            setAlertModal({ isOpen: true, message: (err as any).response?.data?.message || 'Failed to save tracking info', title: 'Update Error' });
        } finally {
            setUpdatingOrderId(null);
        }
    };

    const filteredOrders = filterStatus === 'All'
        ? orders
        : orders.filter(order => {
            if (filterStatus === 'New Requests') return order.status === 'pending';
            if (filterStatus === 'To Ship') return order.status === 'confirmed';
            if (filterStatus === 'In Transit') return order.status === 'shipped';
            if (filterStatus === 'Delivered') return order.status === 'delivered';
            if (filterStatus === 'Completed') return order.payment_status === 'paid' && order.status === 'delivered';
            return true;
        });

    if (loading) return <div className={styles['loading-spinner']}>Loading orders...</div>;
    if (error) return <div className={styles['alert-error']}>{error}</div>;

    const tabs = ['All', 'New Requests', 'To Ship', 'In Transit', 'Delivered', 'Completed'];

    return (
        <div className={styles['my-orders-container']}>
            <div className={styles['orders-page-header']}>
                <div>
                    <h2 className={styles['orders-page-title']}>Order Management</h2>
                    <p className={styles['orders-page-subtitle']}>{orders.length} total order{orders.length !== 1 ? 's' : ''} received</p>
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
                    <svg className={styles['empty-order-icon']} viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
                        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                        <rect x="9" y="3" width="6" height="4" rx="2" />
                        <line x1="9" y1="12" x2="15" y2="12" /><line x1="9" y1="16" x2="12" y2="16" />
                    </svg>
                    <p style={{ color: '#94a3b8', fontSize: '15px', fontWeight: 600 }}>No orders in this category</p>
                    <p style={{ color: '#cbd5e1', fontSize: '13px', marginTop: 4 }}>Try selecting a different tab</p>
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
                                    {order.buyer_id && (
                                        <span style={{ fontSize: 12, fontWeight: 700, color: '#1e3a8a', background: '#eff6ff', padding: '3px 10px', borderRadius: 20, border: '1px solid #bfdbfe' }}>
                                            {order.buyer_id.first_name} {order.buyer_id.last_name}
                                        </span>
                                    )}
                                    <PaymentBadge status={order.payment_status} method={order.payment_method} />
                                </div>
                            </div>

                            {/* ── Card Body ── */}
                            <div className={styles['order-card-body']}>
                                <div className={styles['order-card-main']}>
                                    {/* Shipping Address */}
                                    {order.shipping_address && (
                                        <div className={styles['shipping-addr-block']}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" style={{ flexShrink: 0, marginTop: 2 }}>
                                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                                            </svg>
                                            <div className={styles['shipping-addr-text']}>
                                                <div className={styles['shipping-addr-name']}>
                                                    {order.shipping_address.fullName || `${order.buyer_id?.first_name} ${order.buyer_id?.last_name}`}
                                                </div>
                                                <div>{order.shipping_address.addressLine}</div>
                                                <div>{order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postalCode}</div>
                                                <div className={styles['shipping-addr-country']}>{order.shipping_address.country}</div>
                                            </div>
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

                                        {/* Tracking Display */}
                                        {(order.tracking_number || order.shipping_company) && (
                                            <div className={styles['tracking-badge']} style={{ cursor: 'default' }}>
                                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1e40af" strokeWidth="2.5">
                                                    <rect x="1" y="3" width="15" height="13" /><path d="M16 8h4l3 3v5h-7V8z" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
                                                </svg>
                                                <span className={styles['tracking-carrier']}>{order.shipping_company}</span>
                                                <span className={styles['tracking-number']}>{order.tracking_number}</span>
                                                <button
                                                    onClick={() => setEditOrderData({ ...order })}
                                                    style={{ background: 'none', border: 'none', color: '#1d4ed8', fontSize: 12, fontWeight: 700, cursor: 'pointer', padding: '2px 6px', marginLeft: 'auto' }}
                                                >
                                                    Edit
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* ── Actions Column ── */}
                                <div className={styles['order-card-actions']}>
                                    <OrderStatusPill status={order.status} />

                                    {/* Accept Order (pending) */}
                                    {order.status === 'pending' && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                            <button
                                                className={`${styles['btn-action-primary']} ${styles['btn-accept']}`}
                                                disabled={updatingOrderId === order._id || order.payment_status !== 'paid'}
                                                onClick={() => handleUpdateStatus(order._id, 'confirmed')}
                                                style={order.payment_status !== 'paid' ? { background: '#f1f5f9', color: '#94a3b8', border: 'none', cursor: 'not-allowed', boxShadow: 'none' } : {}}
                                            >
                                                {updatingOrderId === order._id ? 'Updating…' : (order.payment_status === 'paid' ? 'Accept Order' : 'Awaiting Payment')}
                                            </button>
                                            {order.payment_status !== 'paid' && (
                                                <p className={styles['await-payment-note']}>Can only accept once payment is confirmed</p>
                                            )}
                                        </div>
                                    )}

                                    {/* Mark as Shipped (confirmed) */}
                                    {order.status === 'confirmed' && (
                                        <button
                                            className={`${styles['btn-action-primary']} ${styles['btn-ship']}`}
                                            disabled={updatingOrderId === order._id}
                                            onClick={() => setEditOrderData({ ...order })}
                                        >
                                            Mark as Shipped
                                        </button>
                                    )}

                                    {/* Mark as Delivered (shipped) */}
                                    {order.status === 'shipped' && (
                                        <button
                                            className={`${styles['btn-action-primary']} ${styles['btn-deliver']}`}
                                            disabled={updatingOrderId === order._id}
                                            onClick={() => handleUpdateStatus(order._id, 'delivered')}
                                        >
                                            {updatingOrderId === order._id ? 'Updating…' : 'Mark Delivered'}
                                        </button>
                                    )}

                                    <button
                                        className={styles['btn-ghost']}
                                        onClick={() => {
                                            const baseRoute = typeof window !== 'undefined' && window.location.pathname.includes('/supplier/dashboard') ? '/supplier/dashboard' : '/dashboard';
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
                                            const baseRoute = typeof window !== 'undefined' && window.location.pathname.includes('/supplier/dashboard') ? '/supplier/dashboard' : '/dashboard';
                                            navigate.push(`${baseRoute}/orders/${order._id}`);
                                        }}
                                    >
                                        View details →
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Tracking / Shipping Modal */}
            {editOrderData && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: '20px' }}>
                    <div style={{ background: '#fff', borderRadius: '24px', padding: '32px', width: '100%', maxWidth: '480px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                            <div style={{ width: '48px', height: '48px', background: '#fff7ed', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>🚚</div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>Shipping Details</h3>
                                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b', fontWeight: 500 }}>Enter tracking info for Order #{String(editOrderData._id).slice(-8).toUpperCase()}</p>
                            </div>
                        </div>

                        <form onSubmit={(e) => handleSaveTracking(e, editOrderData._id)}>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Courier Service</label>
                                <input
                                    type="text"
                                    placeholder="e.g. DHL, FedEx, UPS"
                                    required
                                    value={editOrderData.shipping_company || ''}
                                    onChange={e => setEditOrderData({ ...editOrderData, shipping_company: e.target.value })}
                                    style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontSize: '14px', outline: 'none', transition: 'border-color 0.2s', background: '#f8fafc' }}
                                    onFocus={e => e.currentTarget.style.borderColor = 'var(--primary-color)'}
                                    onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                                />
                            </div>

                            <div style={{ marginBottom: '32px' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tracking Number</label>
                                <input
                                    type="text"
                                    placeholder="Enter the tracking ID"
                                    required
                                    value={editOrderData.tracking_number || ''}
                                    onChange={e => setEditOrderData({ ...editOrderData, tracking_number: e.target.value })}
                                    style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontSize: '14px', outline: 'none', transition: 'border-color 0.2s', background: '#f8fafc', fontFamily: 'monospace', letterSpacing: '0.05em' }}
                                    onFocus={e => e.currentTarget.style.borderColor = 'var(--primary-color)'}
                                    onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                <button
                                    type="button"
                                    onClick={() => setEditOrderData(null)}
                                    style={{ padding: '12px 24px', borderRadius: '12px', border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', fontWeight: 700, fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={updatingOrderId === editOrderData._id}
                                    style={{ padding: '12px 32px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', fontWeight: 700, fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.2)', transition: 'all 0.2s' }}
                                >
                                    {updatingOrderId === editOrderData._id ? 'Saving…' : 'Confirm Shipment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <AlertModal
                isOpen={alertModal.isOpen}
                onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
                message={alertModal.message}
                title={alertModal.title}
            />
        </div>
    );
};

export default SupplierOrders;
