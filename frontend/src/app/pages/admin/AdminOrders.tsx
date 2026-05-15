import React, { useState, useEffect } from 'react';
import { useToast } from '@/context/ToastContext';
import Link from 'next/link';
import api from '@/services/axiosConfig';
import { useAuth } from '@/context/AuthContext';
import styles from './AdminLayout.module.css';

interface Order {
    _id: string;
    status: string;
    payment_status: string;
    total_amount: number;
    buyer_id: {
        first_name: string;
        last_name: string;
        email: string;
    };
    supplier_id: {
        company_name?: string;
        first_name: string;
        last_name: string;
    };
    createdAt: string;
}

const AdminOrders = () => {
    const { showToast } = useToast();
    const { siteSettings, t, convertPrice } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(siteSettings?.pagination_limit || 10);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (siteSettings?.pagination_limit) {
            setItemsPerPage(siteSettings.pagination_limit);
        }
    }, [siteSettings?.pagination_limit]);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const { data } = await api.get('/orders/admin/all');
            setOrders(data);
            setLoading(false);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch orders');
            setLoading(false);
        }
    };

    const handleDeleteOrder = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this order?')) return;
        try {
            await api.delete(`/orders/admin/${id}`);
            setOrders(orders.filter(order => order._id !== id));
            showToast('Order deleted successfully', 'success');
        } catch (err: any) {
            showToast('Error occurred', 'error');
        }
    };

    const handleClearPending = async () => {
        if (!window.confirm('Are you sure you want to delete ALL pending orders? This cannot be undone.')) return;
        try {
            const { data } = await api.delete('/orders/admin/clear-pending');
            showToast('Pending orders cleared', 'success');
            fetchOrders();
        } catch (err: any) {
            showToast('Error occurred', 'error');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'confirmed': return "admin-badge-success";
            case 'pending': return "admin-badge-warning";
            case 'shipped': return "admin-badge-info";
            case 'cancelled': return "admin-badge-neutral";
            case 'delivered': return "admin-badge-neutral";
            default: return "admin-badge-neutral";
        }
    };

    // Calculate stats
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.status?.toLowerCase() === 'pending').length;
    const ongoingOrders = orders.filter(o => {
        const s = o.status?.toLowerCase();
        return s && s !== 'delivered' && s !== 'cancelled' && s !== 'pending';
    }).length;
    const completedOrders = orders.filter(o => o.status?.toLowerCase() === 'delivered').length;
    const orderRevenue = orders.reduce((sum, o) => {
        if (o.payment_status === 'paid' && o.status !== 'cancelled') {
            return sum + (o.total_amount || 0);
        }
        return sum;
    }, 0);

    // Filter Logic
    const filteredOrders = orders.filter(order => {
        const query = searchQuery.toLowerCase();
        return (
            order._id.toLowerCase().includes(query) ||
            `${order.buyer_id?.first_name} ${order.buyer_id?.last_name}`.toLowerCase().includes(query) ||
            order.buyer_id?.email?.toLowerCase().includes(query) ||
            order.supplier_id?.company_name?.toLowerCase().includes(query)
        );
    });

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentOrders = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

    return (
        <div className={styles['admin-page']}>
            <div className={styles['admin-page-header']}>
                <div>
                    <h1 className={styles['admin-page-title']}>{t('order_management') || 'Order Management'}</h1>
                    <p className={styles['admin-page-subtitle']}>{t('monitor_platform_transactions') || 'Monitor and manage platform transactions'}</p>
                </div>
            </div>



            {error && <div className={`${styles['admin-alert']} ${styles['admin-alert-error']}`}>{error}</div>}

            {/* Stats Cards Section */}
            <div className={styles['admin-stats-grid']}>
                <div className={styles['admin-stat-premium']} style={{ borderLeft: '4px solid var(--primary-color)' }}>
                    <div className={styles['admin-stat-card-label']}>{t('total_orders') || 'Total Orders'}</div>
                    <div className={styles['admin-stat-card-value']}>{totalOrders}</div>
                </div>
                <div className={styles['admin-stat-premium']} style={{ borderLeft: '4px solid #854d0e' }}>
                    <div className={styles['admin-stat-card-label']}>{t('pending_orders') || 'Pending Orders'}</div>
                    <div className={styles['admin-stat-card-value']} style={{ color: '#854d0e' }}>{pendingOrders}</div>
                </div>
                <div className={styles['admin-stat-premium']} style={{ borderLeft: '4px solid #1d4ed8' }}>
                    <div className={styles['admin-stat-card-label']}>{t('ongoing_orders') || 'Ongoing Orders'}</div>
                    <div className={styles['admin-stat-card-value']} style={{ color: '#1d4ed8' }}>{ongoingOrders}</div>
                </div>
                <div className={styles['admin-stat-premium']} style={{ borderLeft: '4px solid #166534' }}>
                    <div className={styles['admin-stat-card-label']}>{t('completed_orders') || 'Completed Orders'}</div>
                    <div className={styles['admin-stat-card-value']} style={{ color: '#166534' }}>{completedOrders}</div>
                </div>
                <div className={styles['admin-stat-premium']} style={{ borderLeft: '4px solid #10b981' }}>
                    <div className={styles['admin-stat-card-label']}>{t('paid_revenue') || 'Paid Revenue'}</div>
                    <div className={styles['admin-stat-card-value']} style={{ color: '#166534', fontSize: '1.5rem', wordBreak: 'break-all', whiteSpace: 'normal', lineHeight: '1.4', marginTop: '4px' }}>{convertPrice(orderRevenue).formatted}</div>
                </div>
            </div>

            <div className={`${styles['admin-card']} ${styles['mt-6']}`}>
                <div style={{ overflowX: 'auto' }}>
                    <table className={styles['admin-table']}>
                        <thead>
                            <tr>
                                <th>{t('order_id') || 'Order ID'}</th>
                                <th>{t('customer') || 'Customer'}</th>
                                <th>{t('supplier') || 'Supplier'}</th>
                                <th>{t('amount') || 'Amount'}</th>
                                <th>{t('status') || 'Status'}</th>
                                <th>{t('payment') || 'Payment'}</th>
                                <th>{t('date') || 'Date'}</th>
                                <th>{t('actions') || 'Actions'}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className={"admin-loading-text"}>{t('loading_orders') || 'Loading Orders...'}</td>
                                </tr>
                            ) : orders.length === 0 ? (
                                <tr className={""}>
                                    <td colSpan={8}>{t('no_orders_found') || 'No orders found'}</td>
                                </tr>
                            ) : (
                                currentOrders.map(order => (
                                    <tr key={order._id}>
                                        <td style={{ fontFamily: 'monospace', fontSize: '11px', fontWeight: 800 }}>
                                            #{order._id.slice(-8).toUpperCase()}
                                        </td>
                                        <td>
                                            <div className="text-admin-main" style={{ fontWeight: 900, fontSize: '13.5px' }}>
                                                {order.buyer_id?.first_name} {order.buyer_id?.last_name}
                                            </div>
                                            <div style={{ fontSize: '10px', color: 'var(--admin-text-muted)', fontWeight: 700 }}>
                                                {order.buyer_id?.email}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 800, color: 'var(--admin-text-secondary)', fontSize: '12px' }}>
                                                {order.supplier_id?.company_name || `${order.supplier_id?.first_name} ${order.supplier_id?.last_name}` || 'N/A'}
                                            </div>
                                        </td>
                                        <td className="text-admin-main" style={{ fontWeight: 900 }}>
                                            {convertPrice(order.total_amount || 0).formatted}
                                        </td>
                                        <td>
                                            <span className={`${"admin-badge"} ${getStatusColor(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td>
                                            <span style={{
                                                fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em',
                                                color: order.payment_status === 'paid' ? '#166534' : 'var(--admin-text-muted)'
                                            }}>
                                                {order.payment_status}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: '11px', color: 'var(--admin-text-muted)', fontWeight: 700 }}>
                                            {new Date(order.createdAt).toLocaleDateString()}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                <Link
                                                    href={`/admin/orders/${order._id}`}
                                                    className={"admin-action-btn-edit"}
                                                    style={{ textDecoration: 'none', display: 'inline-block' }}
                                                >
                                                    {t('view') || 'View'}
                                                </Link>
                                                <button
                                                    onClick={() => handleDeleteOrder(order._id)}
                                                    className={"admin-action-btn-delete"}
                                                >
                                                    {t('delete') || 'Delete'}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderTop: '1px solid var(--admin-border)' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--admin-text-muted)' }}>
                            {t('showing') || 'Showing'} {indexOfFirstItem + 1} {t('to') || 'to'} {Math.min(indexOfLastItem, filteredOrders.length)} {t('of') || 'of'} {filteredOrders.length}
                        </span>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className={`${styles['admin-btn']} ${styles['admin-btn-secondary']}`} style={{ padding: '6px 12px' }}>{t('prev') || 'Prev'}</button>
                            <span className="text-admin-main" style={{ fontSize: '12px', fontWeight: 800 }}>{t('page') || 'Page'} {currentPage} {t('of') || 'of'} {totalPages}</span>
                            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className={`${styles['admin-btn']} ${styles['admin-btn-secondary']}`} style={{ padding: '6px 12px' }}>{t('next') || 'Next'}</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminOrders;
