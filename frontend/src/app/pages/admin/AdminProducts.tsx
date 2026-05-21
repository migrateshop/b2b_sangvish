import React, { useState, useEffect } from 'react';
import api from '@/services/axiosConfig';
import ProductForm from '@/components/dashboard/products/ProductForm';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import styles from './AdminLayout.module.css';

const IMAGE_URL = process.env.NEXT_PUBLIC_IMAGE_URL || '';

interface Category {
    _id: string;
    title: string;
}

interface Product {
    _id: string;
    name: string;
    description: string;
    sku: string;
    moq: number;
    currency: string;
    status: 'active' | 'inactive' | 'pending' | 'rejected' | 'draft';
    approval_status: 'approved' | 'pending' | 'rejected';
    countInStock?: number;
    oldPrice?: number;
    images?: string[];
    category?: Category;
    supplier?: {
        _id?: string;
        company_name?: string;
        first_name?: string;
        last_name?: string;
    };
}

const statusStyles = {
    active:    { background: '#dcfce7', color: '#166534' },
    inactive:  { background: '#f3f4f6', color: '#6b7280' },
    pending:   { background: '#fef9c3', color: '#854d0e' },
    rejected:  { background: '#fee2e2', color: '#991b1b' },
};

const AdminProducts = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [formMode, setFormMode] = useState<'add' | 'edit' | null>(null);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const { siteSettings, t } = useAuth();
    const { showToast } = useToast();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [approvalFilter, setApprovalFilter] = useState('All');
    const [categories, setCategories] = useState<Category[]>([]);
    const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
    
    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(siteSettings?.pagination_limit || 10);

    useEffect(() => {
        if (siteSettings?.pagination_limit) {
            setItemsPerPage(Number(siteSettings.pagination_limit) || 10);
        }
    }, [siteSettings?.pagination_limit]);

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, []);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/admin/products');
            setProducts(data);
        } catch (err: any) { setError(err.message); }
        finally { setLoading(false); }
    };

    const fetchCategories = async () => {
        try { const { data } = await api.get('/categories'); setCategories(data); }
        catch (err) { console.error(err); }
    };

    const handleApprove = async (id: string) => {
        try { 
            await api.put(`/admin/products/${id}/approve`); 
            fetchProducts(); 
            showToast('Product approved successfully!', 'success');
        } catch (err: any) { 
            console.error(err); 
            showToast(err.response?.data?.message || 'Failed to approve product.', 'error');
        }
    };

    const handleReject = async (id: string) => {
        try { 
            await api.put(`/admin/products/${id}/reject`, { note: 'Disapproved by admin' }); 
            fetchProducts(); 
            showToast('Product rejected successfully.', 'success');
        } catch (err: any) { 
            console.error(err); 
            showToast(err.response?.data?.message || 'Failed to reject product.', 'error');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Delete this product?')) return;
        try { 
            await api.delete(`/admin/products/${id}`); 
            fetchProducts(); 
            showToast('Product deleted successfully.', 'success');
        } catch (err: any) { 
            console.error(err); 
            showToast(err.response?.data?.message || 'Failed to delete product.', 'error');
        }
    };

    const filteredProducts = products.filter((p: Product) => {
        const matchesSearch =
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.supplier?.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.supplier?.first_name?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'All' || p.status === statusFilter.toLowerCase();
        const matchesApproval = approvalFilter === 'All' ||
            (approvalFilter === 'Approved' && p.approval_status === 'approved') ||
            (approvalFilter === 'Pending' && p.approval_status === 'pending') ||
            (approvalFilter === 'Rejected' && p.approval_status === 'rejected');
        const matchesCategory = categoryFilter === 'All' || p.category?._id === categoryFilter;
        return matchesSearch && matchesStatus && matchesApproval && matchesCategory;
    });

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentProducts = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

    const stats = [
        { label: t('total_products') || 'Total Products', value: products.length },
        { label: t('active') || 'Active', value: products.filter((p: Product) => p.status === 'active').length },
        { label: t('pending_approval') || 'Pending Approval', value: products.filter((p: Product) => p.approval_status === 'pending').length },
        { label: t('rejected') || 'Rejected', value: products.filter((p: Product) => p.approval_status === 'rejected').length },
    ];

    if (formMode === 'add' || formMode === 'edit') {
        return (
            <ProductForm
                product={editingProduct as any}
                onSave={() => { setFormMode(null); setEditingProduct(null); fetchProducts(); }}
                onCancel={() => { setFormMode(null); setEditingProduct(null); }}
            />
        );
    }

    return (
        <div className={styles['admin-page']}>
            {/* Page Header */}
            <div className={styles['admin-page-header']}>
                <div>
                    <h1 className={styles['admin-page-title']}>{t('product_management') || 'Product Management'}</h1>
                    <p className={styles['admin-page-subtitle']}>{t('manage_products_desc') || 'Catalog control and quality assurance'}</p>
                </div>

            </div>

            {/* Stats */}
            <div className={styles['admin-stats-grid']}>
                {stats.map((s, i) => (
                    <div key={i} className={styles['admin-stat-premium']}>
                        <div className={styles['admin-stat-card-label']}>{s.label}</div>
                        <div className={styles['admin-stat-card-value']} style={{ fontSize: '1.75rem' }}>{s.value}</div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className={styles['admin-card']} style={{ marginBottom: '20px' }}>
                <div style={{ padding: '14px 18px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div className={styles['admin-search-wrap']} style={{ flex: '2', minWidth: '220px' }}>
                        <svg className={styles['admin-search-icon']} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                        <input
                            type="text"
                            className={styles['admin-search-input-premium']}
                            placeholder={t('search_products') || "Search product or supplier..."}
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                    {/* Approval filter */}
                    <select
                        className={styles['admin-form-select']}
                        style={{ flex: '1', minWidth: '140px', padding: '9px 14px' }}
                        value={approvalFilter}
                        onChange={e => setApprovalFilter(e.target.value)}
                    >
                        <option value="All">{t('all_approvals') || 'All Approvals'}</option>
                        <option value="Approved">{t('approved') || 'Approved'}</option>
                        <option value="Pending">{t('pending') || 'Pending'}</option>
                        <option value="Rejected">{t('rejected') || 'Rejected'}</option>
                    </select>
                    {/* Category filter */}
                    <select
                        className={styles['admin-form-select']}
                        style={{ flex: '1', minWidth: '140px', padding: '9px 14px' }}
                        value={categoryFilter}
                        onChange={e => setCategoryFilter(e.target.value)}
                    >
                        <option value="All">{t('all_categories') || 'All Categories'}</option>
                        {categories.map((cat: Category) => (
                            <option key={cat._id} value={cat._id}>{cat.title}</option>
                        ))}
                    </select>
                    {/* Reset */}
                    <button
                        onClick={() => { setSearchQuery(''); setStatusFilter('All'); setCategoryFilter('All'); setApprovalFilter('All'); }}
                        className={`${styles['admin-btn']} ${styles['admin-btn-secondary']}`}
                        style={{ whiteSpace: 'nowrap', padding: '9px 16px' }}
                    >
                        {t('reset') || 'Reset'}
                    </button>
                    {/* View toggle */}
                    <div style={{ display: 'flex', gap: '4px', border: '1px solid var(--admin-border)', borderRadius: '8px', padding: '3px', marginLeft: 'auto' }}>
                        {(['table', 'grid'] as const).map((mode: 'table' | 'grid') => (
                            <button
                                key={mode}
                                onClick={() => setViewMode(mode)}
                                style={{
                                    padding: '5px 10px', border: 'none', borderRadius: '6px', cursor: 'pointer',
                                    background: viewMode === mode ? 'var(--primary-color)' : 'transparent',
                                    color: viewMode === mode ? '#fff' : 'var(--admin-text-muted)',
                                    fontSize: '14px', transition: 'all 0.2s'
                                }}
                            >{mode === 'table' ? '☰' : '⊞'}</button>
                        ))}
                    </div>
                </div>

                {/* Result count */}
                <div style={{ padding: '10px 18px', borderBottom: '1px solid var(--admin-border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        {t('showing') || 'Showing'} {filteredProducts.length} {t('of') || 'of'} {products.length} {t('products') || 'products'}
                    </span>
                </div>

                {loading ? (
                    <div className={"admin-loading-text"}>{t('loading_products') || 'Loading products...'}</div>
                ) : error ? (
                    <div className={styles['admin-alert'] + " " + styles['admin-alert-error']} style={{ margin: '20px' }}>{error}</div>
                ) : filteredProducts.length === 0 ? (
                    <div className={styles['admin-empty-state']} style={{ border: 'none' }}>
                        <div className={styles['admin-empty-state-icon']}>📦</div>
                        <p>{t('no_products_found') || 'No products matched your criteria.'}</p>
                        <button onClick={() => { setSearchQuery(''); setStatusFilter('All'); setCategoryFilter('All'); setApprovalFilter('All'); }} className={`${styles['admin-btn']} ${styles['admin-btn-secondary']}`} style={{ width: 'auto' }}>{t('clear_filters') || 'Clear Filters'}</button>
                    </div>
                ) : viewMode === 'grid' ? (
                    /* ── Grid View ── */
                    <div className={styles['admin-product-grid']} style={{ padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '24px' }}>
                        {currentProducts.map(product => {
                            const cleanPath = product.images?.[0] ? (product.images[0].startsWith('/') ? product.images[0].slice(1) : product.images[0]) : null;
                            const imgSrc = cleanPath ? (cleanPath.startsWith('http') ? cleanPath : `${IMAGE_URL.replace(/\/+$/, '')}/${cleanPath}`) : null;
                            const approvalSt = product.approval_status;
                            return (
                                <div key={product._id} className={styles['admin-plan-card']} style={{ padding: '0', display: 'flex', flexDirection: 'column' }}>
                                    {/* Product image */}
                                    <div style={{ height: '180px', background: 'var(--admin-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderBottom: '1px solid var(--admin-border-subtle)', position: 'relative' }}>
                                        {!imgSrc && <span style={{ fontSize: '3rem', opacity: 0.2 }}>📦</span>}
                                        {imgSrc && (
                                            <img 
                                                src={imgSrc} 
                                                alt={product.name} 
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                                onError={(e: any) => { e.target.style.display = 'none'; }} 
                                            />
                                        )}
                                        <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                                            <span className={`${styles['admin-badge']} ${approvalSt === 'approved' ? styles['admin-badge-success'] : approvalSt === 'pending' ? styles['admin-badge-warning'] : styles['admin-badge-danger']}`} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                                                {approvalSt}
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                        <div style={{ fontSize: '10px', color: 'var(--admin-text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                                            {product.category?.title || 'General'}
                                        </div>
                                        <h3 className="text-admin-main" style={{ fontSize: '15px', fontWeight: 900, marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', minHeight: '40px', lineHeight: '1.4' }}>
                                            {product.name}
                                        </h3>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                            <div className="text-admin-main" style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--admin-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 800 }}>
                                                {(product.supplier?.company_name?.[0] || product.supplier?.first_name?.[0] || 'G').toUpperCase()}
                                            </div>
                                            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--admin-text-secondary)' }}>
                                                {product.supplier?.company_name || product.supplier?.first_name || 'Global'}
                                            </span>
                                        </div>

                                        <div style={{ marginTop: 'auto', display: 'flex', gap: '8px' }}>
                                            <button onClick={() => { setEditingProduct(product); setFormMode('edit'); }} className={`${styles['admin-btn']} ${styles['admin-btn-secondary']}`} style={{ flex: 1, padding: '8px', justifyContent: 'center' }}>{t('edit') || 'Edit'}</button>
                                            <div style={{ display: 'flex', gap: '4px' }}>
                                                {approvalSt === 'pending' ? (
                                                    <button onClick={() => handleApprove(product._id)} className={`${styles['admin-btn']} ${styles['admin-btn-primary']}`} style={{ padding: '8px 12px' }}>✓</button>
                                                ) : (
                                                    <button onClick={() => handleReject(product._id)} className={`${styles['admin-btn']} ${styles['admin-btn-danger']}`} style={{ padding: '8px 12px' }}>✗</button>
                                                )}
                                                <button onClick={() => handleDelete(product._id)} className="admin-action-btn-delete" style={{ padding: '8px 12px' }}>🗑</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    /* ── Table View ── */
                    <div style={{ overflowX: 'auto' }}>
                        <table className={styles['admin-table']}>
                            <thead>
                                <tr>
                                    <th>{t('product') || 'Product'}</th>
                                    <th className={styles['hide-mobile-col']}>{t('supplier') || 'Supplier'}</th>
                                    <th className={styles['hide-mobile-col']}>{t('category') || 'Category'}</th>
                                    <th>{t('status') || 'Status'}</th>
                                    <th>{t('approval') || 'Approval'}</th>
                                    <th>{t('actions') || 'Actions'}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentProducts.map(product => {
                                    const cleanPath = product.images?.[0] ? (product.images[0].startsWith('/') ? product.images[0].slice(1) : product.images[0]) : null;
                                    const imgSrc = cleanPath ? (cleanPath.startsWith('http') ? cleanPath : `${IMAGE_URL.replace(/\/+$/, '')}/${cleanPath}`) : null;
                                    const approvalSt = product.approval_status;
                                    return (
                                        <tr key={product._id}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--admin-bg)', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--admin-border)', position: 'relative' }}>
                                                        <span style={{ fontSize: '18px', position: 'absolute' }}>📦</span>
                                                        {imgSrc && (
                                                            <img 
                                                                src={imgSrc} 
                                                                alt="" 
                                                                style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'relative', zIndex: 1 }} 
                                                                onError={(e: any) => { e.target.style.display = 'none'; }} 
                                                            />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="text-admin-main" style={{ fontWeight: 900, fontSize: '14px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>
                                                            {product.name}
                                                        </div>
                                                        <div style={{ fontSize: '10px', color: 'var(--admin-text-muted)', fontFamily: 'monospace' }}>#{product._id.substring(18, 24).toUpperCase()}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className={styles['hide-mobile-col']} style={{ fontSize: '12px', fontWeight: 700 }}>
                                                {product.supplier?.company_name || product.supplier?.first_name || 'Global'}
                                            </td>
                                            <td className={styles['hide-mobile-col']} style={{ fontSize: '12px' }}>
                                                {product.category?.title || 'General'}
                                            </td>
                                            <td>
                                                <span style={{
                                                    padding: '3px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em',
                                                    ...(statusStyles[product.status as keyof typeof statusStyles] || statusStyles.inactive)
                                                }}>
                                                    {product.status}
                                                </span>
                                            </td>
                                            <td>
                                                {approvalSt === 'pending' ? (
                                                    <button onClick={() => handleApprove(product._id)} className="admin-action-btn-edit">{t('approve') || 'Approve'}</button>
                                                ) : approvalSt === 'rejected' ? (
                                                    <button onClick={() => handleApprove(product._id)} className="admin-action-btn-edit">{t('reapprove') || 'Re-approve'}</button>
                                                ) : (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                        <span className={`${styles['admin-badge']} ${styles['admin-badge-success']}`}>{t('approved') || 'Approved'}</span>
                                                        <button onClick={() => handleReject(product._id)} className="admin-action-btn-delete" style={{ fontSize: '10px', padding: '3px 8px' }}>{t('reject') || 'Reject'}</button>
                                                    </div>
                                                )}
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                                    <button onClick={() => { setEditingProduct(product); setFormMode('edit'); }} className="admin-action-btn-edit">{t('edit') || 'Edit'}</button>
                                                    <button onClick={() => handleDelete(product._id)} className="admin-action-btn-delete">{t('delete') || 'Delete'}</button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
                {totalPages > 0 && (
                    <div className={styles['admin-pagination-footer']}>
                        <span className={styles['admin-pagination-info']}>
                            {t('showing') || 'Showing'} {indexOfFirstItem + 1} {t('to') || 'to'} {Math.min(indexOfLastItem, filteredProducts.length)} {t('of') || 'of'} {filteredProducts.length} {t('products') || 'products'}
                        </span>
                        <div className={styles['admin-pagination-controls']}>
                            <button disabled={currentPage === 1} onClick={() => setCurrentPage((p: number) => p - 1)} className={styles['admin-pagination-btn-arrow']} title="Prev">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                            </button>
                            <span className="text-admin-main" style={{ fontSize: '12px', fontWeight: 800 }}>{t('page') || 'Page'} {currentPage} {t('of') || 'of'} {totalPages}</span>
                            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage((p: number) => p + 1)} className={styles['admin-pagination-btn-arrow']} title="Next">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminProducts;

