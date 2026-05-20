import React, { useState, useEffect, useMemo } from 'react';
import api from '@/services/axiosConfig';
import { useAuth } from '@/context/AuthContext';
import styles from './AdminLayout.module.css';

interface Order {
    _id: string;
    createdAt: string;
    payment_status: string;
    status: string;
    total_amount: number;
}

const AdminRevenue = () => {
    const { t } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [dateRange, setDateRange] = useState('last6months');

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const { data } = await api.get('/orders/admin/all');
                setOrders(data);
                setLoading(false);
            } catch (err) { setError(t('failed_fetch_revenue') || 'Failed to fetch revenue data'); setLoading(false); }
        };
        fetchOrders();
    }, []);

    const analyticsData = useMemo(() => {
        if (!orders.length) return { months: ['Jan','Feb','Mar','Apr','May','Jun'], revenues: [0,0,0,0,0,0], orderCounts: [0,0,0,0,0,0], totalRevenue: 0, totalOrders: 0, avgOrder: 0, growth: 0 };

        const now = new Date();
        const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        let monthsToDisplay = dateRange === 'last12months' ? 12 : dateRange === 'thisyear' ? now.getMonth() + 1 : 6;

        const displayList = [];
        for (let i = monthsToDisplay - 1; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            displayList.push({ month: d.getMonth(), year: d.getFullYear(), label: monthNames[d.getMonth()] });
        }

        const stats = displayList.map(m => {
            const monthlyOrders = orders.filter(o => { const od = new Date(o.createdAt); return od.getMonth() === m.month && od.getFullYear() === m.year; });
            const paidOrders = monthlyOrders.filter(o => o.payment_status === 'paid');
            const totalInPeriod = monthlyOrders.filter(o => o.status !== 'pending' && o.status !== 'cancelled');
            const revenue = paidOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
            return { label: m.label, revenue, count: totalInPeriod.length };
        });

        const totalRevenue = stats.reduce((sum, s) => sum + s.revenue, 0);
        const totalOrders = stats.reduce((sum, s) => sum + s.count, 0);
        const avgOrder = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
        
        const currentRev = stats[stats.length - 1]?.revenue || 0;
        const prevRev = stats[stats.length - 2]?.revenue || 0;
        const growthNum = prevRev > 0 ? (((currentRev - prevRev) / prevRev) * 100) : 0;
        const growth = growthNum.toFixed(1);

        return { months: stats.map(s => s.label), revenues: stats.map(s => s.revenue), orderCounts: stats.map(s => s.count), totalRevenue, totalOrders, avgOrder, growth, growthNum };
    }, [orders, dateRange]);

    const { months, revenues, orderCounts, totalRevenue, totalOrders, avgOrder, growth, growthNum } = analyticsData;
    const maxRev = Math.max(...revenues, 1);

    if (loading) return <div className={"admin-loading-text"}>{t('loading_analytics') || 'Loading analytics...'}</div>;

    return (
        <div className={styles['revenue-analytics-print'] + " " + "admin-page"}>
            <div className={"admin-page-header"}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ 
                        width: '56px', height: '56px', borderRadius: '16px', 
                        background: 'linear-gradient(135deg, var(--primary-color) 0%, #1a4a99 100%)', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 8px 16px rgba(13,46,103,0.15)'
                    }}>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                    </div>
                </div>
                <div>
                    <h1 className={"admin-page-title"}>{t('revenue_analytics') || 'Revenue Analytics'}</h1>
                    <p className={"admin-page-subtitle"}>{t('track_platform_earnings') || 'Track platform earnings, trends, and sales performance'}</p>
                </div>
                <div style={{ display: 'flex', gap: '12px', marginLeft: 'auto' }}>
                    <select className={styles['admin-form-select']} style={{ minWidth: '160px' }} value={dateRange} onChange={e => setDateRange(e.target.value)}>
                        <option value="last6months">{t('last_6_months') || 'Last 6 Months'}</option>
                        <option value="last12months">{t('last_12_months') || 'Last 12 Months'}</option>
                        <option value="thisyear">{t('this_year') || 'This Year'}</option>
                    </select>
                </div>
            </div>

            {error && <div className={styles['admin-alert'] + " " + styles['admin-alert-error']}>{error}</div>}

            <div className={"admin-stats-grid"}>
                {[
                    { 
                        label: t('total_revenue') || 'Total Revenue', 
                        value: `$${totalRevenue >= 1000 ? (totalRevenue/1000).toFixed(1) + 'K' : totalRevenue.toLocaleString()}`, 
                        icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>,
                        color: 'var(--primary-color)',
                        bg: '#eef2ff'
                    },
                    { 
                        label: t('total_orders') || 'Total Orders', 
                        value: totalOrders.toLocaleString(), 
                        icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>,
                        color: 'var(--clr-accent)',
                        bg: '#fff5ed'
                    },
                    { 
                        label: t('avg_order_value') || 'Avg Order Value', 
                        value: `$${avgOrder.toLocaleString()}`, 
                        icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20V10"></path><path d="M18 20V4"></path><path d="M6 20v-4"></path></svg>,
                        color: '#8b5cf6',
                        bg: '#f5f0ff'
                    },
                    { 
                        label: t('growth_mom') || 'Growth (MoM)', 
                        value: `${growthNum > 0 ? '+' : ''}${growth}%`, 
                        icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>,
                        color: '#10b981',
                        bg: '#ecfdf5'
                    },
                ].map((card, i) => (
                    <div key={i} className={"admin-stat-premium"} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ 
                            width: '48px', height: '48px', borderRadius: '12px', 
                            background: card.bg, color: card.color, 
                            display: 'flex', alignItems: 'center', justifyContent: 'center' 
                        }}>
                            {card.icon}
                        </div>
                        <div>
                            <div className={"admin-stat-card-label"} style={{ marginBottom: '2px' }}>{card.label}</div>
                            <div className={"admin-stat-card-value"} style={{ fontSize: '1.5rem' }}>{card.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Bar Chart */}
            <div className={"admin-card"} style={{ marginBottom: '24px', padding: '24px', marginTop: '40px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h3 style={{ margin: 0, fontWeight: 800 }}>{t('monthly_revenue') || 'Monthly Revenue'}</h3>
                    <div style={{ display: 'flex', gap: '12px', fontSize: '10px', fontWeight: 700, color: 'var(--admin-text-muted)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'var(--primary-color)', display: 'inline-block' }}></span> {t('peak') || 'Peak'}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#c7d7f8', display: 'inline-block' }}></span> {t('normal') || 'Normal'}</div>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '240px' }}>
                    {months.map((month, i) => (
                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', height: '100%', justifyContent: 'flex-end' }}>
                            <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--admin-text-main)' }}>
                                ${revenues[i] >= 1000 ? (revenues[i]/1000).toFixed(1) + 'K' : revenues[i]}
                            </div>
                            <div style={{
                                width: '100%',
                                height: `${(revenues[i] / maxRev) * 180}px`,
                                background: revenues[i] === Math.max(...revenues) && revenues[i] > 0 ? 'var(--primary-color)' : '#c7d7f8',
                                borderRadius: '8px 8px 4px 4px',
                                transition: 'all 0.5s ease',
                                cursor: 'pointer',
                                boxShadow: revenues[i] === Math.max(...revenues) && revenues[i] > 0 ? '0 8px 16px rgba(13,46,103,0.2)' : 'none'
                            }} title={`$${revenues[i].toLocaleString()}`} />
                            <div style={{ fontSize: '10px', color: 'var(--admin-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{month}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Monthly Breakdown Table */}
            <div className={"admin-card"} style={{ marginTop: '40px' }}>
                <div className={"admin-card-header"}>
                    <h2>{t('detailed_performance') || 'Detailed Performance'}</h2>
                    <button onClick={() => window.print()} className={"admin-btn" + " " + "admin-btn-secondary"} style={{ padding: '6px 14px', fontSize: '11px' }}>{t('export_pdf') || 'Export PDF'}</button>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table className={"admin-table"}>
                        <thead>
                            <tr>
                                {[t('month') || 'Month', t('revenue') || 'Revenue', t('orders') || 'Orders', t('avg_value') || 'Avg Value', t('growth') || 'Growth'].map(h => <th key={h}>{h}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {[...months].reverse().map((month, idx) => {
                                const i = months.length - 1 - idx;
                                const growthVal = i === 0 || revenues[i-1] === 0 ? '—' : `${(((revenues[i]-revenues[i-1])/revenues[i-1])*100).toFixed(1)}%`;
                                const isPositive = growthVal !== '—' && parseFloat(growthVal) >= 0;
                                return (
                                    <tr key={i}>
                                        <td style={{ fontWeight: 700 }}>{month}</td>
                                        <td style={{ fontWeight: 800, color: 'var(--admin-text-main)' }}>${revenues[i].toLocaleString()}</td>
                                        <td>{orderCounts[i]}</td>
                                        <td>${orderCounts[i] > 0 ? Math.round(revenues[i]/orderCounts[i]).toLocaleString() : 0}</td>
                                        <td style={{ fontWeight: 800, color: isPositive ? '#10b981' : '#ef4444' }}>{growthVal}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminRevenue;
