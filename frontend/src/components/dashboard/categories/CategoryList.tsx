import React, { useState, useEffect } from 'react';
import { fetchCategories, deleteCategory } from '@/services/categoryApi';
import api from '@/services/axiosConfig';
import styles from '@/app/pages/admin/AdminLayout.module.css';
import { getImgUrl } from '@/utils/imageConfig';

interface Category {
    _id: string;
    title: string;
    slug?: string;
    status?: string;
    image?: string;
    order?: number;
    children?: Category[];
}

const CategoryList = ({ onAdd, onEdit }: { onAdd: (parentId?: string | null) => void; onEdit: (cat: Category) => void }) => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
    const [activeParent, setActiveParent] = useState<Category | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    useEffect(() => {
        load();
        const fetchSettings = async () => {
            try {
                const { data } = await api.get('/admin/site-settings');
                if (data?.pagination_limit) setItemsPerPage(data.pagination_limit);
            } catch (err) {}
        };
        fetchSettings();
    }, []);

    const load = async () => {
        setLoading(true);
        try {
            const { data } = await fetchCategories();
            setCategories(data);
        } catch (err) {
            setError('Failed to load categories');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteCategory(id);
            setConfirmDelete(null);
            load();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Delete failed');
        }
    };

    const getVisibleCategories = () => {
        if (searchTerm) {
            const flatten = (items: Category[]): Category[] => {
                let res: Category[] = [];
                items.forEach(item => {
                    if (item.title.toLowerCase().includes(searchTerm.toLowerCase())) res.push(item);
                    if (item.children) res = [...res, ...flatten(item.children)];
                });
                return res;
            };
            return flatten(categories);
        }
        if (activeParent) return activeParent.children || [];
        return categories;
    };

    const visibleCategories = getVisibleCategories();
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentCategories = visibleCategories.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(visibleCategories.length / itemsPerPage);

    const handleViewSubcategories = (cat: Category) => { setActiveParent(cat); setCurrentPage(1); };
    const handleGoBack = () => {
        if (!activeParent) return;
        const findParent = (items: Category[], targetId: string): Category | null => {
            for (let item of items) {
                if (item.children?.some((c: Category) => c._id === targetId)) return item;
                if (item.children) { const found = findParent(item.children, targetId); if (found) return found; }
            }
            return null;
        };
        setActiveParent(findParent(categories, activeParent._id));
        setCurrentPage(1);
    };

    const stats = [
        { label: 'Total Categories', value: categories.length, icon: '🗂️' },
        { label: 'Active', value: categories.filter(c => c.status === 'active').length, icon: '✅' },
        { label: 'Inactive', value: categories.filter(c => c.status !== 'active').length, icon: '⏸️' },
        { label: 'With Subcategories', value: categories.filter(c => (c.children?.length || 0) > 0).length, icon: '📂' },
    ];

    return (
        <div className={styles['admin-page']}>
            {/* Page Header */}
            <div className={styles['admin-page-header']}>
                <div>
                    <h1 className={styles['admin-page-title']}>Category Management</h1>
                    <p className={styles['admin-page-subtitle']}>Organize platform taxonomy and navigation</p>
                </div>
                <div className={styles['admin-page-actions']}>
                    <button className={`${styles['admin-btn']} ${styles['admin-btn-primary']}`} onClick={() => onAdd(activeParent?._id)}>
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"/></svg>
                        Add Category
                    </button>
                </div>
            </div>

            {/* Stats Row */}
            <div className={styles['admin-stats-grid']}>
                {stats.map((s, i) => (
                    <div key={i} className={styles['admin-stat-premium']}>
                        <div className={styles['admin-stat-card-label']}>{s.label}</div>
                        <div className={styles['admin-stat-card-value']} style={{ fontSize: '1.75rem' }}>{s.value}</div>
                    </div>
                ))}
            </div>

            {/* Breadcrumb / Back nav */}
            {activeParent && (
                <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button onClick={handleGoBack} className={styles['admin-back-btn']}>
                        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"/></svg>
                        Back
                    </button>
                    <span style={{ fontSize: '13px', color: 'var(--admin-text-muted)' }}>›</span>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--admin-text-main)' }}>{activeParent.title}</span>
                    <span style={{ fontSize: '12px', background: 'var(--admin-nav-hover)', borderRadius: '20px', padding: '2px 10px', fontWeight: 700, color: 'var(--admin-text-muted)' }}>
                        {activeParent.children?.length || 0} subcategories
                    </span>
                </div>
            )}

            {/* Filter Bar */}
            <div className={styles['admin-card']} style={{ marginBottom: '20px' }}>
                <div className={styles['admin-filter-bar']} style={{ padding: '14px 18px', gap: '12px' }}>
                    <input
                        type="text"
                        className={styles['admin-search-input']}
                        style={{ flex: 2, minWidth: '180px' }}
                        placeholder="Search categories by name..."
                        value={searchTerm}
                        onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    />
                    {searchTerm && (
                        <button onClick={() => setSearchTerm('')} className={`${styles['admin-btn']} ${styles['admin-btn-secondary']}`} style={{ whiteSpace: 'nowrap', padding: '9px 16px' }}>
                            Clear
                        </button>
                    )}
                </div>
                <div style={{ padding: '8px 18px', borderBottom: '1px solid var(--admin-border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Showing {visibleCategories.length} {activeParent ? `subcategories in "${activeParent.title}"` : 'categories'}
                    </span>
                </div>

                {error && <div className={styles['admin-alert'] + ' ' + styles['admin-alert-error']} style={{ margin: '16px 18px' }}>{error}</div>}

                {/* Table */}
                <div style={{ overflowX: 'auto' }}>
                    <table className={styles['admin-table']}>
                        <thead>
                            <tr>
                                <th>Category</th>
                                <th className={styles['hide-mobile-col']}>Slug</th>
                                <th>Status</th>
                                <th className={styles['hide-mobile-col']}>Subcategories</th>
                                <th className={styles['hide-mobile-col']}>Sort Order</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} className={styles['admin-loading-text']}>Loading categories...</td></tr>
                            ) : currentCategories.length === 0 ? (
                                <tr>
                                    <td colSpan={6}>
                                        <div className={styles['admin-empty-state']} style={{ border: 'none', padding: '48px' }}>
                                            <div className={styles['admin-empty-state-icon']}>🗂️</div>
                                            <p>No categories found{searchTerm ? ` for "${searchTerm}"` : ''}.</p>
                                            {searchTerm && (
                                                <button onClick={() => setSearchTerm('')} className={`${styles['admin-btn']} ${styles['admin-btn-secondary']}`} style={{ width: 'auto' }}>Clear Search</button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                currentCategories.map(cat => (
                                    <tr key={cat._id}>
                                        {/* Category name + image */}
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--admin-bg)', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--admin-border)' }}>
                                                    {cat.image ? (
                                                        <img src={getImgUrl(cat.image)} alt={cat.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e: any) => { e.target.style.display = 'none'; }} />
                                                    ) : (
                                                        <span style={{ fontSize: '18px' }}>🗂️</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 800, color: 'var(--admin-text-main)', fontSize: '13px' }}>{cat.title}</div>
                                                    <div style={{ fontSize: '10px', color: 'var(--admin-text-muted)', fontFamily: 'monospace' }}>#{cat._id?.substring(18, 24).toUpperCase()}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className={styles['hide-mobile-col']} style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--admin-text-muted)' }}>/{cat.slug}</td>
                                        <td>
                                            <span className={styles['admin-badge'] + ' ' + (cat.status === 'active' ? styles['admin-badge-success'] : styles['admin-badge-neutral'])}>
                                                {cat.status || 'active'}
                                            </span>
                                        </td>
                                        <td className={styles['hide-mobile-col']}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span className={styles['admin-badge'] + ' ' + styles['admin-badge-info']} style={{ minWidth: '28px', justifyContent: 'center' }}>
                                                    {cat.children?.length || 0}
                                                </span>
                                                {(cat.children && cat.children.length > 0) && (
                                                    <button onClick={() => handleViewSubcategories(cat)} className="admin-action-btn-edit" style={{ padding: '3px 10px', fontSize: '10px' }}>
                                                        View
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                        <td className={styles['hide-mobile-col']} style={{ fontWeight: 700, color: 'var(--admin-text-muted)', fontSize: '12px' }}>{cat.order || 0}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                <button onClick={() => onEdit(cat)} className="admin-action-btn-edit">Edit</button>
                                                <button onClick={() => setConfirmDelete(cat._id)} className="admin-action-btn-delete">Delete</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderTop: '1px solid var(--admin-border)' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--admin-text-muted)' }}>
                            Showing {indexOfFirstItem + 1}–{Math.min(indexOfLastItem, visibleCategories.length)} of {visibleCategories.length}
                        </span>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className={styles['admin-btn'] + ' ' + styles['admin-btn-secondary']} style={{ padding: '6px 14px' }}>Prev</button>
                            <span style={{ fontSize: '12px', fontWeight: 800 }}>Page {currentPage} of {totalPages}</span>
                            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className={styles['admin-btn'] + ' ' + styles['admin-btn-secondary']} style={{ padding: '6px 14px' }}>Next</button>
                        </div>
                    </div>
                )}
            </div>

            {/* Delete Confirm Modal */}
            {confirmDelete && (
                <div className={styles['admin-modal-overlay']}>
                    <div className={styles['admin-modal']}>
                        <div className={styles['admin-modal-header']}>
                            <h3>Delete Category?</h3>
                            <button className={styles['admin-modal-close']} onClick={() => setConfirmDelete(null)}>×</button>
                        </div>
                        <div className={styles['admin-modal-body']}>
                            <p style={{ color: 'var(--admin-text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>
                                This action permanently removes the category. Subcategories may become orphaned.
                            </p>
                        </div>
                        <div className={styles['admin-modal-footer']}>
                            <button className={styles['admin-btn'] + ' ' + styles['admin-btn-secondary']} onClick={() => setConfirmDelete(null)}>Cancel</button>
                            <button className={styles['admin-btn'] + ' ' + styles['admin-btn-danger']} onClick={() => handleDelete(confirmDelete)}>Confirm Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CategoryList;
