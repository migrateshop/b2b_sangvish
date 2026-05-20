import React, { useState, useEffect } from 'react';
import { useToast } from '@/context/ToastContext';
import api from '@/services/axiosConfig';
import { useAuth } from '@/context/AuthContext';
import styles from './AdminLayout.module.css';

interface AdminModalProps {
    isOpen: boolean;
    title: string;
    children: React.ReactNode;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    type?: string;
}

const AdminModal = ({ isOpen, title, children, onConfirm, onCancel, confirmText = 'Confirm', type = 'info' }: AdminModalProps) => {
    const { t } = useAuth();
    if (!isOpen) return null;
    return (
        <div className={styles['admin-modal-overlay']}>
            <div className={styles['admin-modal']}>
                <div className={styles['admin-modal-header']}>
                    <h3>{title}</h3>
                    <button className={styles['admin-modal-close']} onClick={onCancel}>&times;</button>
                </div>
                <div className={styles['admin-modal-body']}>{children}</div>
                <div className={styles['admin-modal-footer']}>
                    <button className={"admin-btn" + " " + "admin-btn-secondary"} onClick={onCancel}>{t('cancel') || 'Cancel'}</button>
                    <button
                        className={"admin-btn" + " " + "admin-btn-primary"}
                        style={{ background: type === 'danger' ? '#dc2626' : 'var(--primary-color)' }}
                        onClick={onConfirm}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

interface Product {
    _id: string;
    name: string;
    approval_status: string;
    supplier?: {
        company_name?: string;
        first_name?: string;
        last_name?: string;
    };
    createdAt: string;
}

interface ModalConfig {
    title: string;
    content: React.ReactNode;
    onConfirm: () => void;
    type?: string;
    confirmText?: string;
}

const AdminApprovals = () => {
    const { showToast } = useToast();
    const { t } = useAuth();
    const [data, setData] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalConfig, setModalConfig] = useState<ModalConfig>({ title: '', content: null, onConfirm: () => { }, type: 'info' });

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const { data } = await api.get('/admin/site-settings');
                if (data?.pagination_limit) setItemsPerPage(data.pagination_limit);
            } catch (err) { }
        };
        fetchSettings();
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await api.get('/admin/products');
            setData(res.data || []);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching products', error);
            setLoading(false);
        }
    };



    const handleApprove = (id: string) => {
        setModalConfig({
            title: t('confirm_approve_product') || 'Approve Product',
            content: <p style={{ fontSize: '14px', color: '#4b5563' }}>{t('approve_product_desc') || 'Are you sure you want to approve this product listing for the marketplace?'}</p>,
            type: 'info',
            confirmText: t('approve') || 'Approve',
            onConfirm: async () => {
                try {
                    await api.put(`/admin/products/${id}/approve`);
                    setData(data.map(p => p._id === id ? { ...p, approval_status: 'approved' } : p));
                    showToast(t('product_approved_success') || 'Product approved successfully!');
                    setModalOpen(false);
                } catch (err) { showToast(t('failed_approve_product') || 'Failed to approve product.'); }
            }
        });
        setModalOpen(true);
    };

    const handleRejectClick = (id: string) => {
        setModalConfig({
            title: t('reject_product') || 'Reject Product',
            content: (
                <div>
                    <p style={{ fontSize: '14px', color: '#4b5563', marginBottom: '12px' }}>{t('provide_rejection_reason') || 'Please provide a reason for rejecting this product:'}</p>
                    <textarea
                        className={styles['admin-form-textarea']}
                        placeholder={t('rejection_placeholder') || "e.g. Low quality images, missing specifications..."}
                        id="reject-note-input"
                        autoFocus
                    />
                </div>
            ),
            type: 'danger',
            confirmText: t('reject') || 'Reject',
            onConfirm: async () => {
                const noteValue = (document.getElementById('reject-note-input') as HTMLTextAreaElement)?.value || '';
                if (!noteValue.trim()) { showToast(t('please_enter_rejection_reason') || 'Please enter a rejection reason.', 'error'); return; }
                try {
                    await api.put(`/admin/products/${id}/reject`, { note: noteValue });
                    setData(data.map(p => p._id === id ? { ...p, approval_status: 'rejected' } : p));
                    showToast(t('product_rejected_success') || 'Product rejected.', 'success');
                    setModalOpen(false);
                } catch (err) { showToast(t('failed_reject_product') || 'Failed to reject product.', 'error'); }
            }
        });
        setModalOpen(true);
    };

    const pendingProducts = data.filter(item => item.approval_status === 'pending');

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentProducts = pendingProducts.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(pendingProducts.length / itemsPerPage);

    if (loading) return <div className={"admin-loading-text"}>{t('loading_pending_products') || 'Loading pending products...'}</div>;

    return (
        <div className={"admin-page"}>

            <AdminModal
                isOpen={modalOpen}
                title={modalConfig.title}
                onConfirm={modalConfig.onConfirm}
                onCancel={() => setModalOpen(false)}
                confirmText={modalConfig.confirmText}
                type={modalConfig.type}
            >
                {modalConfig.content}
            </AdminModal>

            <div className={"admin-page-header"}>
                <div>
                    <h1 className={"admin-page-title"}>{t('product_approvals') || 'Product Approvals'}</h1>
                    <p className={"admin-page-subtitle"}>{t('approvals_desc') || 'Review and manage pending product listings'}</p>
                </div>
            </div>

            <div className={"admin-card"}>
                <div style={{ overflowX: 'auto', width: '100%' }}>
                    <table className={"admin-table"}>
                        <thead>
                            <tr>
                                <th>{t('product') || 'Product'}</th>
                                <th>{t('supplier') || 'Supplier'}</th>
                                <th>{t('date') || 'Date'}</th>
                                <th>{t('status') || 'Status'}</th>
                                <th>{t('actions') || 'Actions'}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentProducts.map(item => (
                                <tr key={item._id}>
                                    <td style={{ verticalAlign: 'middle' }}>
                                        <div className="text-admin-main" style={{ fontWeight: 900, fontSize: '13.5px' }}>{item.name}</div>
                                        <div style={{ fontSize: '10px', color: 'var(--admin-text-muted)', fontFamily: 'monospace' }}>#{item._id.slice(-6).toUpperCase()}</div>
                                    </td>
                                    <td style={{ fontWeight: 700, fontSize: '12px' }}>{item.supplier?.company_name || `${item.supplier?.first_name} ${item.supplier?.last_name}`}</td>
                                    <td style={{ fontSize: '11px', color: 'var(--admin-text-muted)', fontWeight: 700 }}>{new Date(item.createdAt).toLocaleDateString()}</td>
                                    <td>
                                        <span className={`${"admin-badge"} ${"admin-badge-warning"}`}>
                                            {t('pending_approval') || 'Pending Approval'}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button onClick={() => handleApprove(item._id)} className={"admin-action-btn-edit"}>{t('approve') || 'Approve'}</button>
                                            <button onClick={() => handleRejectClick(item._id)} className={"admin-action-btn-delete"}>{t('reject') || 'Reject'}</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {pendingProducts.length === 0 && (
                                <tr className={""}><td colSpan={5}>{t('no_pending_products') || 'No pending products to review.'}</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {totalPages > 1 && (
                    <div className={styles['admin-pagination-footer']}>
                        <span className={styles['admin-pagination-info']}>
                            {t('showing') || 'Showing'} {indexOfFirstItem + 1} {t('to') || 'to'} {Math.min(indexOfLastItem, pendingProducts.length)} {t('of') || 'of'} {pendingProducts.length} {t('approvals') || 'approvals'}
                        </span>
                        <div className={styles['admin-pagination-controls']}>
                            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className={styles['admin-pagination-btn-arrow']} title="Prev">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                            </button>
                            <span className="text-admin-main" style={{ fontSize: '12px', fontWeight: 800 }}>{t('page') || 'Page'} {currentPage} {t('of') || 'of'} {totalPages}</span>
                            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className={styles['admin-pagination-btn-arrow']} title="Next">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminApprovals;
