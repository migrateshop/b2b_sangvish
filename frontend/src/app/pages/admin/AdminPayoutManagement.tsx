import React, { useState, useEffect } from 'react';
import api from '@/services/axiosConfig';
import { useToast } from '@/context/ToastContext';
import styles from './AdminLayout.module.css';

interface PayoutMethod {
    type: string;
    bank_name?: string;
    account_name?: string;
    account_number?: string;
    swift_code?: string;
    ifsc_code?: string;
    is_default: boolean;
}

interface SupplierPayout {
    _id: string;
    first_name: string;
    last_name: string;
    email: string;
    company_name: string;
    wallet_balance: number;
    payout_methods: PayoutMethod[];
}

const AdminPayoutManagement: React.FC = () => {
    const [suppliers, setSuppliers] = useState<SupplierPayout[]>([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const fetchSuppliers = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/admin/payout-methods');
            setSuppliers(data);
        } catch (err: any) {
            showToast(err.response?.data?.message || 'Failed to fetch payout data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const filteredSuppliers = suppliers.filter(s => 
        s.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="admin-page">
            <div className="admin-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h1 className="admin-page-title">Payout Management</h1>
                    <p className="admin-page-subtitle">Review and manage supplier payment account details</p>
                </div>
                <button
                    onClick={fetchSuppliers}
                    disabled={loading}
                    style={{
                        padding: '10px 20px',
                        background: 'var(--primary-color)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '12px',
                        fontWeight: 700,
                        fontSize: '13px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 12px rgba(255, 102, 0, 0.2)',
                        transition: 'all 0.2s'
                    }}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={loading ? 'spin' : ''}>
                        <polyline points="23 4 23 10 17 10"></polyline>
                        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                    </svg>
                    {loading ? 'Refreshing...' : 'Refresh Data'}
                </button>
            </div>

            <div className="admin-card" style={{ marginBottom: '24px' }}>
                <div style={{ padding: '16px 20px' }}>
                    <div className={styles['admin-search-wrap']}>
                        <svg className={styles['admin-search-icon']} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        <input
                            type="text"
                            className={styles['admin-search-input-premium']}
                            placeholder="Search by supplier name, company or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="admin-card">
                <div style={{ overflowX: 'auto' }}>
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Supplier & Company</th>
                                <th>Wallet Balance</th>
                                <th>Configured Payout Methods</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="admin-loading-text" style={{ padding: '60px' }}>Loading supplier payout information...</td>
                                </tr>
                            ) : filteredSuppliers.length === 0 ? (
                                <tr>
                                    <td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>No suppliers found.</td>
                                </tr>
                            ) : (
                                filteredSuppliers.map(s => (
                                    <tr key={s._id}>
                                        <td>
                                            <div style={{ fontWeight: 800, color: 'var(--admin-text-main)', fontSize: '13px' }}>{s.first_name} {s.last_name}</div>
                                            <div style={{ fontSize: '11px', color: 'var(--admin-text-muted)' }}>{s.email}</div>
                                            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary-color)', marginTop: '2px' }}>{s.company_name || 'N/A'}</div>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 900, fontSize: '15px', color: s.wallet_balance > 0 ? '#10b981' : 'inherit' }}>
                                                ${s.wallet_balance?.toLocaleString() || '0.00'}
                                            </div>
                                        </td>
                                        <td>
                                            {s.payout_methods && s.payout_methods.length > 0 ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    {s.payout_methods.map((pm: any, idx) => (
                                                        <div key={idx} style={{ padding: '10px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                                                <span style={{ fontSize: '10px', fontWeight: 900, background: 'var(--primary-color)', color: '#fff', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>{pm.type?.replace('_', ' ')}</span>
                                                                {pm.is_default && <span style={{ fontSize: '10px', fontWeight: 900, background: '#10b981', color: '#fff', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>Default</span>}
                                                            </div>
                                                            {(pm.type === 'bank' || pm.type === 'bank_transfer') && (
                                                                <div style={{ fontSize: '11px', color: '#334155' }}>
                                                                    <div><b>Bank:</b> {pm.bank_name || pm.details?.bank_name || 'N/A'}</div>
                                                                    <div><b>A/N:</b> {pm.account_name || pm.details?.account_name || 'N/A'}</div>
                                                                    <div><b>A/C:</b> {pm.account_number || pm.details?.account_number || 'N/A'}</div>
                                                                    {(pm.swift_code || pm.details?.swift_code) && <div><b>SWIFT:</b> {pm.swift_code || pm.details?.swift_code}</div>}
                                                                </div>
                                                            )}
                                                            {pm.type === 'paypal' && (
                                                                <div style={{ fontSize: '11px', color: '#334155' }}>
                                                                    <div><b>PayPal Email:</b> {pm.details?.email || pm.account_name || 'N/A'}</div>
                                                                </div>
                                                            )}
                                                            {pm.type !== 'bank' && pm.type !== 'bank_transfer' && pm.type !== 'paypal' && pm.details && (
                                                                <div style={{ fontSize: '11px', color: '#334155' }}>
                                                                    {Object.entries(pm.details).map(([key, val]: any) => (
                                                                        <div key={key}><b>{key.replace('_', ' ').toUpperCase()}:</b> {String(val)}</div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span style={{ fontSize: '12px', color: '#ef4444', fontWeight: 600 }}>Not Configured</span>
                                            )}
                                        </td>
                                        <td>
                                            <span className={`admin-badge ${s.payout_methods?.length > 0 ? 'admin-badge-success' : 'admin-badge-danger'}`}>
                                                {s.payout_methods?.length > 0 ? 'Verified' : 'Action Required'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminPayoutManagement;
