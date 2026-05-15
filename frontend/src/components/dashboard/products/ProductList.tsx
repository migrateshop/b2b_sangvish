import React, { useState, useEffect, useCallback, useRef } from 'react';
import { fetchMyProducts, fetchAllProductsAdmin, deleteProduct, approveProduct, rejectProduct, bulkUploadProducts, toggleShowcase } from '@/services/productApi';
import { useAuth } from '@/context/AuthContext';
import styles from './ProductManagement.module.css';

import { getImgUrl } from '@/utils/imageConfig';

const statusTabs = ['all', 'active', 'draft', 'inactive', 'showcase'];
const approvalTabs = ['all', 'pending', 'approved', 'rejected'];

const ProductList = ({ isAdminView, onAdd, onEdit, onTotalUpdate, onExport, onBulkUpload }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [statusTab, setStatusTab] = useState('all');
    const [approvalTab, setApprovalTab] = useState('all');
    const [keyword, setKeyword] = useState('');
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [rejectModal, setRejectModal] = useState(null);
    const [rejectNote, setRejectNote] = useState('');
    const bulkInputRef = useRef();
    const [uploading, setUploading] = useState(false);
    const { user } = useAuth();
    const [totalCountGlobal, setTotalCountGlobal] = useState(0);

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const params = { page, limit: 15 };
            if (statusTab === 'showcase') {
                params.isFeatured = true;
            } else if (statusTab !== 'all') {
                params.status = statusTab;
            }
            if (isAdminView && approvalTab !== 'all') params.approval_status = approvalTab;
            if (keyword) params.keyword = keyword;

            const { data } = isAdminView
                ? await fetchAllProductsAdmin(params)
                : await fetchMyProducts(params);

            setProducts(data.products || []);
            setTotalPages(data.pages || 1);

            if (!isAdminView && onTotalUpdate) {
                const globalCount = data.totalCountGlobal ?? data.total ?? 0;
                setTotalCountGlobal(globalCount);
                onTotalUpdate(globalCount);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load products.');
        } finally {
            setLoading(false);
        }
    }, [page, statusTab, approvalTab, keyword, isAdminView, onTotalUpdate]);

    useEffect(() => { load(); }, [load]);

    const handleToggleShowcase = async (id) => {
        try {
            const { data } = await toggleShowcase(id);
            if (data.success) {
                setProducts(prev => prev.map(p => p._id === id ? { ...p, isFeatured: data.isFeatured } : p));
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Action failed.');
            setTimeout(() => setError(''), 4000);
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteProduct(id);
            setConfirmDelete(null);
            load();
        } catch (err) {
            setError(err.response?.data?.message || 'Delete failed.');
        }
    };

    const handleApprove = async (id) => {
        try {
            await approveProduct(id);
            load();
        } catch (err) {
            setError(err.response?.data?.message || 'Approve failed.');
        }
    };

    const handleReject = async () => {
        try {
            await rejectProduct(rejectModal, rejectNote);
            setRejectModal(null);
            setRejectNote('');
            load();
        } catch (err) {
            setError(err.response?.data?.message || 'Reject failed.');
        }
    };

    const handleBulkUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Subscription Check for Bulk
        if (user?.roles?.includes('supplier') || user?.role === 'supplier') {
            const plan = user.subscription_plan;
            if (!plan) { alert('Please subscribe to a plan to perform bulk uploads.'); return; }
            if (plan.level < 2) { alert('Bulk upload is only available for premium plans. Please upgrade.'); return; }

            // Limit check
            if (plan.max_products !== -1 && plan.max_products !== 0 && totalCountGlobal >= plan.max_products) {
                alert(`Product limit reached (${plan.max_products}). Please upgrade to upload more.`);
                return;
            }
        }

        const fd = new FormData();
        fd.append('file', file);

        setUploading(true);
        setError('');
        try {
            const { data } = await bulkUploadProducts(fd);
            alert(data.message || 'Bulk upload successful!');
            load();
        } catch (err) {
            setError(err.response?.data?.message || 'Bulk upload failed.');
        } finally {
            setUploading(false);
            if (bulkInputRef.current) bulkInputRef.current.value = '';
        }
    };

    const getImg = (p) => {
        const img = p.main_image || (p.images && p.images[0]) || null;
        return getImgUrl(img, null);
    };

    const getEmptyStateContent = () => {
        if (isAdminView) {
            return {
                title: 'No products match this filter',
                desc: 'Try adjusting your search query or status filter to see other catalog items.',
                icon: (
                    <svg className={styles['pm-empty-icon']} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                ),
                button: null
            };
        }

        switch (statusTab) {
            case 'inactive':
                return {
                    title: 'No inactive products',
                    desc: 'All of your products are currently active or saved in drafts. You have no disabled listings.',
                    icon: (
                        <svg className={styles['pm-empty-icon']} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
                            <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
                        </svg>
                    ),
                    button: (
                        <button className={styles['pm-empty-action-btn']} onClick={() => setStatusTab('active')}>
                            View Active Products
                        </button>
                    )
                };
            case 'draft':
                return {
                    title: 'No drafts found',
                    desc: 'Your drafts folder is clean. You can create a new product listing and save it as draft at any time.',
                    icon: (
                        <svg className={styles['pm-empty-icon']} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                            <polyline points="10 9 9 9 8 9" />
                        </svg>
                    ),
                    button: onAdd ? (
                        <button className={styles['pm-empty-action-btn']} onClick={onAdd}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                            Create Listing
                        </button>
                    ) : null
                };
            case 'showcase':
                return {
                    title: 'Your showcase is empty',
                    desc: 'Feature your best-selling or premium items on your public supplier profile store homepage.',
                    icon: (
                        <svg className={styles['pm-empty-icon']} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                    ),
                    button: (
                        <button className={styles['pm-empty-action-btn']} onClick={() => setStatusTab('active')}>
                            Manage Showcase Products
                        </button>
                    )
                };
            case 'active':
                return {
                    title: 'No active products',
                    desc: 'You have no published listings. Activate existing products from your drafts folder or list a new one.',
                    icon: (
                        <svg className={styles['pm-empty-icon']} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                            <line x1="12" y1="22.08" x2="12" y2="12" />
                        </svg>
                    ),
                    button: onAdd ? (
                        <button className={styles['pm-empty-action-btn']} onClick={onAdd}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                            Add Your First Product
                        </button>
                    ) : null
                };
            default:
                return {
                    title: 'No products found',
                    desc: 'Create professional listings to showcase your catalog, receive direct quotes, and connect with global buyers.',
                    icon: (
                        <svg className={styles['pm-empty-icon']} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                            <line x1="12" y1="22.08" x2="12" y2="12" />
                        </svg>
                    ),
                    button: onAdd ? (
                        <button className={styles['pm-empty-action-btn']} onClick={onAdd}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                            Add Product Listing
                        </button>
                    ) : null
                };
        }
    };

    const emptyContent = getEmptyStateContent();

    return (
        <div className={styles['pm-card-modern']}>
            {/* Unified Modern Header */}
            <div className={styles['pm-header-modern']}>
                <div className={styles['pm-header-title-modern']}>
                    <h2>{isAdminView ? 'All Products' : 'My Products'}</h2>
                    <span className={styles['pm-header-badge']}>Total: {totalCountGlobal}</span>
                </div>
                <div className={styles['pm-header-actions-modern']}>
                    {!isAdminView && onExport && (
                        <button className={styles['pm-btn-outline-modern']} onClick={onExport}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                            Export XLSX
                        </button>
                    )}
                    {!isAdminView && onBulkUpload && (
                        <button className={styles['pm-btn-outline-modern']} onClick={onBulkUpload}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                            Bulk Upload
                        </button>
                    )}
                    {!isAdminView && onAdd && (
                        <button className={styles['pm-btn-primary']} onClick={onAdd} style={{ padding: '9px 18px', gap: '6px' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                            Add Product
                        </button>
                    )}
                </div>
            </div>

            {/* Toolbar: Search and Tabs */}
            <div className={styles['pm-toolbar-modern']}>
                <div className={styles['pm-tabs-modern']}>
                    {statusTabs.map(t => (
                        <button key={t} className={`${styles['pm-tab-modern']} ${statusTab === t ? styles['active'] : ''}`}
                            onClick={() => { setStatusTab(t); setPage(1); }}>
                            {t.charAt(0).toUpperCase() + t.slice(1)}
                        </button>
                    ))}
                    {isAdminView && (
                        <>
                            <div style={{ width: '1px', background: '#cbd5e1', margin: '4px 6px' }}></div>
                            {approvalTabs.map(t => (
                                <button key={'a-' + t} className={`${styles['pm-tab-modern']} ${approvalTab === t ? styles['active'] : ''}`}
                                    onClick={() => { setApprovalTab(t); setPage(1); }}>
                                    {t.charAt(0).toUpperCase() + t.slice(1)}
                                </button>
                            ))}
                        </>
                    )}
                </div>
                
                <div className={styles['pm-search-wrap-modern']}>
                    <svg className={styles['pm-search-icon-modern']} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    <input
                        className={styles['pm-search-input-modern']}
                        placeholder="Search products by name or SKU..."
                        value={keyword}
                        onChange={e => { setKeyword(e.target.value); setPage(1); }}
                    />
                </div>
            </div>

            {error && <div className={styles['pm-alert-error']} style={{ margin: '16px 0' }}>{error}</div>}

            {loading ? (
                <div className={styles['pm-loading']}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--clr-accent)" strokeWidth="2">
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                    </svg>
                    Loading products...
                </div>
            ) : (
                <div className={styles['pm-table-wrapper']}>
                    {products.length === 0 ? (
                        <div className={styles['pm-empty-alibaba']}>
                            <div className={styles['pm-empty-icon-wrap']}>
                                {emptyContent.icon}
                            </div>
                            <h3>{emptyContent.title}</h3>
                            <p>{emptyContent.desc}</p>
                            {emptyContent.button}
                        </div>
                    ) : (
                        <table className={styles['pm-table']}>
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th className={styles['pm-col-hide-mobile']}>Category</th>
                                    <th className={styles['pm-col-hide-mobile']}>SKU</th>
                                    <th className={styles['pm-col-hide-mobile']}>MOQ</th>
                                    <th>Price</th>
                                    <th className={styles['pm-col-hide-mobile']}>Stock</th>
                                    <th>Status</th>
                                    <th className={styles['pm-col-hide-mobile']}>Approval</th>
                                    {isAdminView && <th className={styles['pm-col-hide-mobile']}>Supplier</th>}
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map(p => {
                                    const img = getImg(p);
                                    const minPrice = p.main_price || (p.price_tiers?.length > 0 ? p.price_tiers[0].price : '—');
                                    return (
                                        <tr key={p._id}>
                                            <td>
                                                <div className={styles['pm-product-cell']}>
                                                    {img
                                                        ? <img src={img} alt={p.name} className={styles['pm-product-img']} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://placehold.co/100?text=📦'; }} />
                                                        : <div className={styles['pm-product-img-placeholder']}>📦</div>
                                                    }
                                                    <div>
                                                        <div className={styles['pm-product-name']}>
                                                            {p.name}
                                                            {p.isFeatured && <span className={styles['pm-showcase-pill']}>Showcase</span>}
                                                        </div>
                                                        <div className={styles['pm-product-sku']}>{p.slug}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className={styles['pm-col-hide-mobile']}>{p.category?.title || 'N/A'}</td>
                                            <td className={styles['pm-col-hide-mobile']}><span className={styles['pm-sku-badge']}>{p.sku || '—'}</span></td>
                                            <td className={styles['pm-col-hide-mobile']}>{p.moq}</td>
                                            <td>${minPrice}</td>
                                            <td className={styles['pm-col-hide-mobile']}>{p.countInStock}</td>
                                            <td>
                                                <span className={`${styles['pm-badge']} ${styles[`pm-badge-${p.status}`]}`}>{p.status}</span>
                                            </td>
                                            <td className={styles['pm-col-hide-mobile']}>
                                                <span className={`${styles['pm-badge']} ${styles[`pm-badge-${p.approval_status}`]}`}>{p.approval_status}</span>
                                            </td>
                                            {isAdminView && (
                                                <td className={styles['pm-col-hide-mobile']} style={{ fontSize: '0.8rem' }}>
                                                    {p.supplier?.company_name || `${p.supplier?.first_name || ''} ${p.supplier?.last_name || ''}`}
                                                </td>
                                            )}
                                            <td>
                                                <div className={styles['pm-actions']}>
                                                    {!isAdminView && (
                                                        <button
                                                            className={`${styles['pm-btn-showcase']} ${p.isFeatured ? styles['active'] : ''}`}
                                                            onClick={() => handleToggleShowcase(p._id)}
                                                            title={p.isFeatured ? "Remove from showcase" : "Add to store showcase"}
                                                        >
                                                            {p.isFeatured ? '★' : '☆'}
                                                        </button>
                                                    )}
                                                    <button className={styles['pm-btn-edit']} onClick={() => onEdit(p)}>Edit</button>
                                                    <button className={styles['pm-btn-delete']} onClick={() => setConfirmDelete(p._id)}>Delete</button>
                                                    {isAdminView && p.approval_status === 'pending' && (
                                                        <>
                                                            <button className={styles['pm-btn-approve']} onClick={() => handleApprove(p._id)}>✓ Approve</button>
                                                            <button className={styles['pm-btn-reject']} onClick={() => { setRejectModal(p._id); setRejectNote(''); }}>✗ Reject</button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className={styles['pm-pagination']}>
                    <button className={styles['pm-page-btn']} disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                    {Array.from({ length: totalPages }, (_, i) => (
                        <button key={i + 1} className={`pm-page-btn ${page === i + 1 ? 'active' : ''}`} onClick={() => setPage(i + 1)}>
                            {i + 1}
                        </button>
                    ))}
                    <button className={styles['pm-page-btn']} disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
                </div>
            )}

            {/* Confirm Delete Modal */}
            {confirmDelete && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: '#fff', borderRadius: '14px', padding: '32px', maxWidth: '360px', width: '90%', textAlign: 'center' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🗑️</div>
                        <h3 style={{ margin: '0 0 8px', color: '#1a1a2e' }}>Delete Product?</h3>
                        <p style={{ color: '#6c757d', fontSize: '0.9rem', margin: '0 0 24px' }}>This action cannot be undone.</p>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                            <button className={styles['pm-btn-secondary']} onClick={() => setConfirmDelete(null)}>Cancel</button>
                            <button className={styles['pm-btn-delete']} style={{ padding: '10px 20px' }} onClick={() => handleDelete(confirmDelete)}>Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Reason Modal */}
            {rejectModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: '#fff', borderRadius: '14px', padding: '32px', maxWidth: '400px', width: '90%' }}>
                        <h3 style={{ margin: '0 0 16px', color: '#1a1a2e' }}>Reject Product</h3>
                        <textarea
                            className={styles['pm-form-textarea']}
                            style={{ width: '100%', boxSizing: 'border-box' }}
                            placeholder="Provide a reason for rejection..."
                            value={rejectNote}
                            onChange={e => setRejectNote(e.target.value)}
                        />
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
                            <button className={styles['pm-btn-secondary']} onClick={() => setRejectModal(null)}>Cancel</button>
                            <button className={styles['pm-btn-reject']} style={{ padding: '10px 20px', fontWeight: '700' }} onClick={handleReject}>Reject</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductList;
