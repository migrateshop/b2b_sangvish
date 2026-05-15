import { useAuth } from '@/context/AuthContext';

import React, { useState, useEffect } from 'react';
import { useToast } from '@/context/ToastContext';
import api from '@/services/axiosConfig';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill'), { 
    ssr: false,
    loading: () => <div style={{ height: '400px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>Loading editor...</div>
});
import ReactDOM from 'react-dom';

import styles from './AdminLayout.module.css';

// Fix for ReactQuill in React 18 (findDOMNode deprecation)
if (typeof window !== 'undefined' && typeof (ReactDOM as any).findDOMNode !== 'function') {
    (ReactDOM as any).findDOMNode = (node: any) => node;
}

interface CMSPage {
    _id: string;
    title: string;
    slug: string;
    content: string;
    isPublished: boolean;
    metaDescription?: string;
    updatedAt: string;
}


const AdminCMS = () => {
    const { t } = useAuth();
    const { showToast } = useToast();
    const [pages, setPages] = useState<CMSPage[]>([]);
    const [view, setView] = useState('list'); // 'list' | 'editor'
    const [editingPage, setEditingPage] = useState<CMSPage | { isNew: boolean } | null>(null);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        content: '',
        isPublished: true,
        metaDescription: ''
    });

    const [isSourceView, setIsSourceView] = useState(false);
    
    // Pagination & Filter states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    const modules = {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            [{ 'align': [] }],
            ['link', 'image', 'video', 'blockquote', 'code-block'],
            ['clean']
        ],
    };

    const formats = [
        'header', 'bold', 'italic', 'underline', 'strike',
        'list', 'bullet', 'align',
        'link', 'image', 'video', 'blockquote', 'code-block'
    ];

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const { data } = await api.get('/admin/site-settings');
                if (data?.pagination_limit) setItemsPerPage(data.pagination_limit);
            } catch (err) { }
        };
        fetchSettings();
        fetchPages();
    }, []);

    const fetchPages = async () => {
        try {
            const { data } = await api.get('/cms');
            setPages(data);
            setLoading(false);
        } catch (err) {
            console.error(err);
        }
    };

    const handleEdit = (page: CMSPage) => {
        setEditingPage(page);
        setFormData({
            title: page.title,
            slug: page.slug,
            content: page.content,
            isPublished: page.isPublished,
            metaDescription: page.metaDescription || ''
        });
        setView('editor');
        setTimeout(() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            document.querySelector('.admin-content-wrapper')?.scrollTo({ top: 0, behavior: 'smooth' });
        }, 50);
    };

    const handleNew = () => {
        setEditingPage({ isNew: true });
        setFormData({
            title: '',
            slug: '',
            content: '',
            isPublished: true,
            metaDescription: ''
        });
        setView('editor');
        setTimeout(() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            document.querySelector('.admin-content-wrapper')?.scrollTo({ top: 0, behavior: 'smooth' });
        }, 50);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (!editingPage) return;

            if ('isNew' in editingPage && editingPage.isNew) {
                await api.post('/cms', formData);
            } else if ('_id' in editingPage) {
                await api.put(`/cms/${editingPage._id}`, formData);
            }
            setView('list');
            setEditingPage(null);
            fetchPages();
        } catch (err) {
            showToast('Failed to save page', 'error');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure?')) return;
        try {
            await api.delete(`/cms/${id}`);
            fetchPages();
        } catch (err) {
            console.error(err);
        }
    };

    if (view === 'editor') {
        return (
            <div className={"admin-page"} style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <div className={"admin-page-header"} style={{ marginBottom: '24px' }}>
                    <div>
                        <h1 className={"admin-page-title"} style={{ fontSize: '24px', fontWeight: 900, color: '#000' }}>
                            {(editingPage && 'isNew' in editingPage) ? 'Create New Page' : 'Edit Page Content'}
                        </h1>
                        <p className={"admin-page-subtitle"}>Design your marketplace content with high precision</p>
                    </div>
                    <button onClick={() => setView('list')} className={"admin-btn" + " " + "admin-btn-secondary"} style={{ borderRadius: '12px' }}>
                        Cancel & Return
                    </button>
                </div>

                <div className={"admin-card"} style={{ border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
                    <div className={"admin-card-body"} style={{ padding: '32px' }}>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                            <div className={styles['admin-form-grid']}>
                                <div className={styles['admin-form-group']}>
                                    <label className={styles['admin-form-label']} style={{ fontWeight: 800, fontSize: '11px', textTransform: 'uppercase', color: 'var(--admin-text-muted)' }}>Page Title</label>
                                    <input
                                        type="text" required
                                        className={styles['admin-form-input']}
                                        style={{ height: '48px', borderRadius: '12px', fontSize: '15px', fontWeight: 600 }}
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="e.g. Terms of Service"
                                    />
                                </div>
                                <div className={styles['admin-form-group']}>
                                    <label className={styles['admin-form-label']} style={{ fontWeight: 800, fontSize: '11px', textTransform: 'uppercase', color: 'var(--admin-text-muted)' }}>URL Slug</label>
                                    <input
                                        type="text" required disabled={!(editingPage && 'isNew' in editingPage)}
                                        className={styles['admin-form-input']}
                                        style={{ height: '48px', borderRadius: '12px', background: (editingPage && 'isNew' in editingPage) ? '#fff' : '#f8fafc', fontWeight: 700 }}
                                        value={formData.slug}
                                        onChange={e => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/ /g, '-') })}
                                        placeholder="terms-of-service"
                                    />
                                </div>
                            </div>
                            
                            <div className={styles['admin-form-group']}>
                                <label className={styles['admin-form-label']} style={{ fontWeight: 800, fontSize: '11px', textTransform: 'uppercase', color: 'var(--admin-text-muted)' }}>Meta Description (SEO)</label>
                                <textarea
                                    className={styles['admin-form-textarea']}
                                    value={formData.metaDescription}
                                    onChange={e => setFormData({ ...formData, metaDescription: e.target.value })}
                                    placeholder="Brief description for search engines..."
                                    style={{ minHeight: '60px', borderRadius: '12px', padding: '12px' }}
                                />
                            </div>

                            <div className={styles['admin-form-group']}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '10px' }}>
                                    <label className={styles['admin-form-label']} style={{ fontWeight: 800, fontSize: '11px', textTransform: 'uppercase', color: 'var(--admin-text-muted)', margin: 0 }}>Content Designer</label>
                                    <button 
                                        type="button" 
                                        onClick={() => setIsSourceView(!isSourceView)}
                                        style={{ background: '#000', color: '#fff', border: 'none', borderRadius: '8px', padding: '6px 16px', fontSize: '12px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                                    >
                                        {isSourceView ? '👁 View Visual' : '⚡ Source Code'}
                                    </button>
                                </div>

                                <div style={{ 
                                    background: '#fff', 
                                    borderRadius: '16px', 
                                    border: '1.5px solid #e2e8f0', 
                                    overflow: 'hidden',
                                    transition: 'all 0.2s'
                                }}>
                                    {isSourceView ? (
                                        <textarea
                                            value={formData.content}
                                            onChange={e => setFormData({ ...formData, content: e.target.value })}
                                            style={{ width: '100%', height: '400px', border: 'none', padding: '20px', fontFamily: '"Fira Code", monospace', fontSize: '13px', lineHeight: '1.6', background: '#0f172a', color: '#e2e8f0', outline: 'none', resize: 'none' }}
                                        />
                                    ) : (
                                        <ReactQuill
                                            theme="snow"
                                            value={formData.content}
                                            onChange={content => setFormData({ ...formData, content })}
                                            modules={modules}
                                            formats={formats}
                                            style={{ height: '400px', marginBottom: '45px' }}
                                        />
                                    )}
                                </div>
                            </div>

                            <div className={styles['admin-form-group']} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '20px', background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1.5px solid #e2e8f0' }}>
                                <div
                                    className={`${styles['admin-toggle']} ${formData.isPublished ? styles['on'] : ''}`}
                                    onClick={() => setFormData(f => ({ ...f, isPublished: !f.isPublished }))}
                                />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 800, fontSize: '14px', color: 'var(--admin-text-main)' }}>Publication Status</div>
                                    <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)', fontWeight: 500 }}>When active, this page will be publicly accessible on the marketplace</div>
                                </div>
                            </div>

                            <div className={styles['admin-form-actions']}>
                                <button type="button" onClick={() => setView('list')} className={"admin-btn" + " " + "admin-btn-secondary"}>Cancel</button>
                                <button type="submit" className={"admin-btn" + " " + "admin-btn-primary"}>
                                    {(editingPage && 'isNew' in editingPage) ? 'Create Page' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    // Pagination & Filtering Logic
    const filteredPages = pages.filter(p => {
        const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.slug.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'All' || (statusFilter === 'Published' && p.isPublished) || (statusFilter === 'Draft' && !p.isPublished);
        return matchesSearch && matchesStatus;
    });

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentPages = filteredPages.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredPages.length / itemsPerPage);

    const stats = [
        { label: 'Total Pages', value: pages.length },
        { label: 'Published', value: pages.filter(p => p.isPublished).length },
        { label: 'Drafts', value: pages.filter(p => !p.isPublished).length }
    ];

    return (
        <div className={"admin-page"}>
            <div className={"admin-page-header"}>
                <div>
                    <h1 className={"admin-page-title"}>Content & CMS</h1>
                    <p className={"admin-page-subtitle"}>Manage storefront pages, SEO content, and legal documents</p>
                </div>
                <div className={"admin-page-actions"}>
                    <button onClick={handleNew} className={"admin-btn" + " " + "admin-btn-primary"}>
                        + Create New Page
                    </button>
                </div>
            </div>

            <div className={"admin-stats-grid"}>
                {stats.map((s, i) => (
                    <div key={i} className={"admin-stat-premium"}>
                        <div className={"admin-stat-card-label"}>{s.label}</div>
                        <div className={"admin-stat-card-value"} style={{ fontSize: '1.75rem' }}>{s.value}</div>
                    </div>
                ))}
            </div>

            <div className={"admin-card"}>
                <div className={""} style={{ padding: '14px 18px', display: 'flex', gap: '12px', flexWrap: 'wrap', background: 'var(--admin-bg)', borderBottom: '1px solid var(--admin-border)' }}>
                    <div className={"admin-search-wrap"} style={{ flex: '2', minWidth: '200px' }}>
                        <svg className={"admin-search-icon"} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        <input
                            type="text"
                            className={""}
                            placeholder="Search pages by title or slug..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <select
                        className={styles['admin-form-select']}
                        style={{ flex: '1', minWidth: '140px', padding: '9px 14px' }}
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                    >
                        <option value="All">All Status</option>
                        <option value="Published">Published</option>
                        <option value="Draft">Draft</option>
                    </select>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table className={"admin-table"}>
                        <thead>
                            <tr>
                                <th>Page Title</th>
                                <th>URL Slug</th>
                                <th>Status</th>
                                <th className={styles['hide-mobile-col']}>Last Updated</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentPages.map(page => (
                                <tr key={page._id}>
                                    <td>
                                        <div style={{ fontWeight: 800, color: 'var(--admin-text-main)', fontSize: '14px' }}>
                                            {page.title}
                                        </div>
                                    </td>
                                    <td>
                                        <code style={{ fontSize: '11px', color: 'var(--admin-text-secondary)', background: 'var(--admin-bg)', padding: '2px 8px', borderRadius: '4px' }}>
                                            /{page.slug}
                                        </code>
                                    </td>
                                    <td>
                                        <span className={`admin-badge ${page.isPublished ? 'admin-badge-success' : 'admin-badge-neutral'}`} style={{ fontSize: '10px' }}>
                                            {page.isPublished ? '✓ Published' : '○ Draft'}
                                        </span>
                                    </td>
                                    <td className={styles['hide-mobile-col']} style={{ fontSize: '12px', color: 'var(--admin-text-muted)', fontWeight: 700 }}>
                                        {new Date(page.updatedAt).toLocaleDateString()}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            <button onClick={() => handleEdit(page)} className={"admin-action-btn-edit"}>Edit</button>
                                            <button onClick={() => handleDelete(page._id)} className={"admin-action-btn-delete"}>Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredPages.length === 0 && !loading && (
                                <tr className={""}>
                                    <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--admin-text-muted)' }}>
                                        No pages found matching your search.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderTop: '1px solid var(--admin-border)' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--admin-text-muted)' }}>
                            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredPages.length)} of {filteredPages.length} pages
                        </span>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className={"admin-btn" + " " + "admin-btn-secondary"} style={{ padding: '6px 12px' }}>Prev</button>
                            <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--admin-text-main)' }}>Page {currentPage} of {totalPages}</span>
                            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className={"admin-btn" + " " + "admin-btn-secondary"} style={{ padding: '6px 12px' }}>Next</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminCMS;
