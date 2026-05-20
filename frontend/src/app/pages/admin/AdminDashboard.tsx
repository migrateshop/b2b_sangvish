import React, { useState, useEffect } from 'react';
import api from '@/services/axiosConfig';

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    Filler
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import styles from './AdminDashboardNew.module.css';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    Filler
);

interface DashboardStats {
    buyerCount: number;
    supplierCount: number;
    adminCount: number;
    products: number;
    categories: number;
    pendingCompanies: number;
    totalEarnings: number;
    adminEarnings: number;
    monthlyEarnings: number;
    userDistribution: number[];
    monthlyRevenue: { labels: string[]; data: number[] };
    todayUserCount: number;
    todayBuyerCount: number;
    todaySupplierCount: number;
    todayProductCount: number;
    todayOrderCount: number;
    todayEarnings: number;
    totalOrders: number;
    totalUsers: number;
}

interface RecentCompany {
    _id: string;
    company_name: string;
    verification_status: string;
    country?: string;
    createdAt: string;
    user_id?: {
        email: string;
    };
}

import { useAuth } from '@/context/AuthContext';

const AdminDashboard = () => {
    const { convertPrice, t } = useAuth();

    const normalizeKey = (key: string) => {
        return key.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '');
    };

    const [stats, setStats] = useState<DashboardStats>({
        buyerCount: 0,
        supplierCount: 0,
        adminCount: 0,
        products: 0,
        categories: 0,
        pendingCompanies: 0,
        totalEarnings: 0,
        adminEarnings: 0,
        monthlyEarnings: 0,
        userDistribution: [0, 0, 0],
        monthlyRevenue: { labels: [], data: [] },
        todayUserCount: 0,
        todayBuyerCount: 0,
        todaySupplierCount: 0,
        todayProductCount: 0,
        todayOrderCount: 0,
        todayEarnings: 0,
        totalOrders: 0,
        totalUsers: 0
    });

    const [recentCompanies, setRecentCompanies] = useState<RecentCompany[]>([]);
    const [loading, setLoading] = useState(true);

    const revenueData = {
        labels: stats.monthlyRevenue?.labels?.length > 0
            ? stats.monthlyRevenue.labels
            : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
            label: 'Monthly Revenue',
            data: stats.monthlyRevenue?.data?.length > 0
                ? stats.monthlyRevenue.data
                : [0, 0, 0, 0, 0, 0],
            borderColor: '#ff6b00',
            backgroundColor: (context: any) => {
                const chart = context.chart;
                const { ctx, chartArea } = chart;
                if (!chartArea) return undefined;
                const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                gradient.addColorStop(0, 'rgba(255, 107, 0, 0.2)');
                gradient.addColorStop(1, 'rgba(255, 107, 0, 0.01)');
                return gradient;
            },
            tension: 0.5,
            fill: true,
            pointBackgroundColor: '#ff6b00',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
        }]
    };

    const userData = {
        labels: ['Buyers', 'Suppliers', 'Admins'],
        datasets: [{
            data: stats.userDistribution || [0, 0, 0],
            backgroundColor: ['#f97316', '#fb923c', '#fdba74'],
            hoverBackgroundColor: ['#ea580c', '#f97316', '#fb923c'],
            hoverOffset: 4,
            borderWidth: 0,
        }]
    };

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const { data: statsData } = await api.get('/admin/stats');
                setStats(statsData);
                const { data: companiesData } = await api.get('/admin/companies');
                setRecentCompanies(companiesData.slice(0, 5));
            } catch (error) {
                console.error('Dashboard data fetch error:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();

        const interval = setInterval(() => {
            api.get('/admin/stats').then(({ data }) => setStats(data)).catch(() => {});
            api.get('/admin/companies').then(({ data }) => setRecentCompanies(data.slice(0, 5))).catch(() => {});
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    if (loading) return (
        <div className={styles['adm-loading']}>
            <div className={styles['adm-spinner']} />
            <p>{t('loading') || 'Loading dashboard...'}</p>
        </div>
    );

    const statCards = [
        {
            label: t('total_users') || 'Total Users',
            value: (stats.totalUsers || 0).toLocaleString(),
            sublabel: (stats.todayUserCount || 0) > 0 ? `+${stats.todayUserCount} ${t('today_suffix') || 'today'}` : null,
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
            ),
            color: '#0ea5e9',
            bg: 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)',
            light: '#f0f9ff',
        },
        {
            label: t('total_buyers') || 'Total Buyers',
            value: stats.buyerCount?.toLocaleString() || '0',
            sublabel: (stats.todayBuyerCount || 0) > 0 ? `+${stats.todayBuyerCount} ${t('today_suffix') || 'today'}` : null,
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
            ),
            color: 'var(--primary-color)',
            bg: 'linear-gradient(135deg, var(--primary-color) 0%, #1a4a99 100%)',
            light: '#eef2ff',
        },
        {
            label: t('total_suppliers') || 'Total Suppliers',
            value: stats.supplierCount?.toLocaleString() || '0',
            sublabel: (stats.todaySupplierCount || 0) > 0 ? `+${stats.todaySupplierCount} ${t('today_suffix') || 'today'}` : null,
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /><line x1="12" y1="12" x2="12" y2="16" /><line x1="10" y1="14" x2="14" y2="14" /></svg>
            ),
            color: 'var(--clr-accent)',
            bg: 'linear-gradient(135deg, var(--clr-accent) 0%, #ff8c38 100%)',
            light: '#fff5ed',
        },
        {
            label: t('total_products') || 'Total Products',
            value: stats.products?.toLocaleString() || '0',
            sublabel: (stats.todayProductCount || 0) > 0 ? `+${stats.todayProductCount} ${t('today_suffix') || 'today'}` : null,
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>
            ),
            color: '#8b5cf6',
            bg: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)',
            light: '#f5f0ff',
        },
        {
            label: t('total_orders') || 'Total Orders',
            value: (stats.totalOrders || 0).toLocaleString(),
            sublabel: (stats.todayOrderCount || 0) > 0 ? `+${stats.todayOrderCount} ${t('today_suffix') || 'today'}` : null,
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" ry="1" /></svg>
            ),
            color: '#6366f1',
            bg: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
            light: '#eef2ff',
        },
        {
            label: t('admin_earnings') || 'Admin Earnings',
            value: convertPrice(stats.adminEarnings || 0).formatted,
            sublabel: t('fees_plus_subscriptions') || 'fees + subscriptions',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
            ),
            color: 'var(--clr-accent)',
            bg: 'linear-gradient(135deg, var(--clr-accent) 0%, #ff8c38 100%)',
            light: '#fff5ed',
        },
        {
            label: t('todays_earnings') || "Today's Earnings",
            value: convertPrice(stats.todayEarnings || 0).formatted,
            sublabel: t('paid_orders_today') || 'paid orders today',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
            ),
            color: '#ef4444',
            bg: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)',
            light: '#fef2f2',
        },
        {
            label: t('monthly_revenue') || 'Monthly Revenue',
            value: convertPrice(stats.monthlyEarnings || 0).formatted,
            sublabel: t('current_month') || 'current month',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
            ),
            color: '#10b981',
            bg: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
            light: '#ecfdf5',
        },
        {
            label: t('total_earnings') || 'Total Earnings',
            value: convertPrice(stats.totalEarnings || 0).formatted,
            sublabel: t('lifetime_gmv') || 'lifetime GMV',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
            ),
            color: 'var(--primary-color)',
            bg: 'linear-gradient(135deg, var(--primary-color) 0%, #1a4a99 100%)',
            light: '#eef2ff',
        },
    ];

    const getStatusStyle = (status: string) => {
        if (status === 'verified') return { background: '#dcfce7', color: '#15803d' };
        if (status === 'pending') return { background: '#fef9c3', color: '#a16207' };
        if (status === 'rejected') return { background: '#fee2e2', color: '#b91c1c' };
        if (status === 'submitted') return { background: '#eff6ff', color: '#1d4ed8' }; // Profile submitted blue
        return { background: '#f1f5f9', color: '#64748b' };
    };

    return (
        <div className={styles['adm-dashboard']}>
            {/* Welcome Banner */}
            <div className={styles['adm-welcome']} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div className={styles['adm-welcome-text']}>
                    <h1>{t('dashboard') || 'Dashboard'}</h1>
                    <p>{t('platform_overview') || 'Platform overview and key metrics at a glance'}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                    <div className={styles['adm-welcome-date']}>
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                    <button
                        onClick={() => {
                            window.location.reload();
                        }}
                        style={{
                            padding: '10px 20px',
                            background: 'var(--primary-color)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '12px',
                            fontWeight: 700,
                            fontSize: '13px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: '0 4px 12px rgba(255, 102, 0, 0.2)',
                            transition: 'all 0.2s'
                        }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="23 4 23 10 17 10"></polyline>
                            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                        </svg>
                        Refresh Live Counts
                    </button>
                </div>
            </div>

            {/* Stat Cards */}
            <div className={styles['adm-stats-grid']}>
                {statCards.map((card, i) => (
                    <div className={styles['adm-stat-card']} key={i} style={{ '--card-color': card.color } as React.CSSProperties}>
                        <div className={styles['adm-stat-icon']} style={{ background: card.light, color: card.color }}>
                            {card.icon}
                        </div>
                        <div className={styles['adm-stat-body']}>
                            <div className={styles['adm-stat-label']}>{card.label}</div>
                            <div className={styles['adm-stat-value']}>{card.value}</div>
                        </div>
                        <div className={styles['adm-stat-accent']} style={{ background: card.bg }} />
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div className={styles['adm-charts-grid']}>
                {/* Revenue Line Chart */}
                <div className={styles['adm-chart-card'] + " " + styles['adm-chart-large']}>
                    <div className={styles['adm-chart-header']}>
                        <div>
                            <h3>{t('revenue_analytics') || 'Revenue Analytics'}</h3>
                            <p>{t('monthly_platform_growth') || 'Monthly platform growth (USD)'}</p>
                        </div>
                        <div className={styles['adm-chart-badge']}>{t('live') || 'Live'}</div>
                    </div>
                    <div className={styles['adm-chart-body']}>
                        <Line
                            data={revenueData}
                            options={{
                                maintainAspectRatio: false,
                                scales: {
                                    y: {
                                        ticks: {
                                            color: '#94a3b8',
                                            font: { size: 11 },
                                            callback: (value: any) => `$${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`
                                        },
                                        grid: { color: 'rgba(0,0,0,0.03)' },
                                        border: { display: false }
                                    },
                                    x: {
                                        ticks: { color: '#94a3b8', font: { size: 11 } },
                                        grid: { display: false },
                                        border: { display: false }
                                    }
                                },
                                plugins: {
                                    legend: { display: false },
                                    tooltip: {
                                        backgroundColor: 'var(--primary-color)',
                                        titleColor: '#fff',
                                        bodyColor: 'rgba(255,255,255,0.8)',
                                        padding: 12,
                                        cornerRadius: 10,
                                        displayColors: false,
                                    }
                                }
                            }}
                        />
                    </div>
                </div>

                {/* Doughnut Chart */}
                <div className={styles['adm-chart-card'] + " " + styles['adm-chart-small']}>
                    <div className={styles['adm-chart-header']}>
                        <div>
                            <h3>{t('user_distribution') || 'User Distribution'}</h3>
                            <p>{t('segments_by_role') || 'Segments by role'}</p>
                        </div>
                    </div>
                    <div className={styles['adm-chart-body'] + " " + styles['adm-donut-body']}>
                        <div className={styles['adm-donut-chart-wrap']}>
                            <Doughnut
                                data={userData}
                                options={{
                                    maintainAspectRatio: false,
                                    cutout: '78%',
                                    plugins: {
                                        legend: {
                                            display: false
                                        },
                                        tooltip: {
                                            backgroundColor: '#1e293b',
                                            titleColor: '#fff',
                                            bodyColor: 'rgba(255,255,255,0.8)',
                                            padding: 12,
                                            cornerRadius: 10,
                                            displayColors: false,
                                        }
                                    }
                                }}
                            />
                            {/* Center label */}
                            <div className={styles['adm-donut-center']}>
                                <span className={styles['adm-donut-total']}>
                                    {(stats.buyerCount + stats.supplierCount + stats.adminCount).toLocaleString()}
                                </span>
                                <span>{t('users') || 'users'}</span>
                            </div>
                        </div>

                        {/* Custom Legend on the Right */}
                        <div className={styles['adm-donut-legend-side']}>
                            {['Buyers', 'Suppliers', 'Admins'].map((label, i) => (
                                <div key={label} className={styles['adm-legend-item']}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span className={styles['legend-dot']} style={{ background: userData.datasets[0].backgroundColor[i] }} />
                                        <span className={styles['legend-label']}>{t(normalizeKey(label)) || label}</span>
                                    </div>
                                    <span className={styles['legend-value']}>{stats.userDistribution?.[i] || 0}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Stats Row */}
            <div className={styles['adm-quick-stats']}>
                <div className={styles['adm-quick-item']} style={{ borderColor: '#10b981', background: '#ffffff' }}>
                    <span className={styles['adm-quick-icon']} style={{ background: '#f0fdf4', color: '#10b981' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                    </span>
                    <div>
                        <div className={styles['adm-quick-label']}>{t('verified_companies') || 'Verified Companies'}</div>
                        <div className={styles['adm-quick-value']}>{recentCompanies.filter(c => c.verification_status === 'verified').length}</div>
                    </div>
                </div>
                <div className={styles['adm-quick-item']} style={{ borderColor: '#f59e0b', background: '#ffffff' }}>
                    <span className={styles['adm-quick-icon']} style={{ background: '#fffbeb', color: '#f59e0b' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                    </span>
                    <div>
                        <div className={styles['adm-quick-label']}>{t('pending_verifications') || 'Pending Verifications'}</div>
                        <div className={styles['adm-quick-value']}>{stats.pendingCompanies || 0}</div>
                    </div>
                </div>
                <div className={styles['adm-quick-item']} style={{ borderColor: '#f43f5e', background: '#ffffff' }}>
                    <span className={styles['adm-quick-icon']} style={{ background: '#fff1f2', color: '#f43f5e' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.78-8.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
                    </span>
                    <div>
                        <div className={styles['adm-quick-label']}>{t('total_products') || 'Total Products'}</div>
                        <div className={styles['adm-quick-value']}>{stats.products?.toLocaleString() || 0}</div>
                    </div>
                </div>
                <div className={styles['adm-quick-item']} style={{ borderColor: '#06b6d4', background: '#ffffff' }}>
                    <span className={styles['adm-quick-icon']} style={{ background: '#ecfeff', color: '#06b6d4' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></svg>
                    </span>
                    <div>
                        <div className={styles['adm-quick-label']}>{t('categories') || 'Categories'}</div>
                        <div className={styles['adm-quick-value']}>{stats.categories?.toLocaleString() || 0}</div>
                    </div>
                </div>
            </div>

            {/* Recent Companies Table */}
            <div className={styles['adm-table-card']}>
                <div className={styles['adm-table-header']}>
                    <div>
                        <h3>{t('recent_company_applications') || 'Recent Company Applications'}</h3>
                        <p>{t('manual_verification_required') || 'Manual verification required for onboarding'}</p>
                    </div>
                    <a href="/admin/verifications" className={styles['adm-view-all']}>
                        {t('view_all') || 'View all'} <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                    </a>
                </div>
                <div className={styles['adm-table-wrap']}>
                    <table className={styles['adm-table']}>
                        <thead>
                            <tr>
                                <th>{t('business_entity') || 'Business Entity'}</th>
                                <th>{t('email') || 'Email'}</th>
                                <th>{t('region') || 'Region'}</th>
                                <th>{t('status') || 'Status'}</th>
                                <th>{t('created') || 'Created'}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentCompanies.length > 0 ? recentCompanies.map(company => (
                                <tr key={company._id}>
                                    <td>
                                        <div className={styles['adm-company-cell']}>
                                            <div
                                                className={styles['adm-company-avatar-round']}
                                                style={{ background: ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'][Math.floor(Math.random() * 5)] }}
                                            >
                                                {company.company_name?.[0]?.toUpperCase() || 'C'}
                                            </div>
                                            <span className={styles['adm-company-name-bold']}>{company.company_name}</span>
                                        </div>
                                    </td>
                                    <td className={styles['adm-td-muted-small']}>{company.user_id?.email || 'N/A'}</td>
                                    <td className={styles['adm-td-muted-small']}>{company.country || 'India'}</td>
                                    <td>
                                        <div className={styles['adm-status-badge-outline']} style={{ borderColor: company.verification_status === 'verified' ? '#10b981' : '#f59e0b', color: company.verification_status === 'verified' ? '#10b981' : '#f59e0b' }}>
                                            <span className={styles['status-dot']} style={{ background: company.verification_status === 'verified' ? '#10b981' : '#f59e0b' }} />
                                            {t(company.verification_status?.toLowerCase()) || company.verification_status?.toUpperCase() || 'PENDING'}
                                        </div>
                                    </td>
                                    <td className={styles['adm-td-muted-small']}>{new Date(company.createdAt).toLocaleDateString()}</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className={styles['adm-empty-row']}>{t('no_company_applications_yet') || 'No company applications yet.'}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
