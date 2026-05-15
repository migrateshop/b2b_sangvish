import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import api from '@/services/axiosConfig';
import styles from './AdminLayout.module.css';

const emptyForm = { name: '', code: '', native_name: '', is_active: true, direction: 'ltr' };

interface Language {
    _id: string;
    name: string;
    code: string;
    native_name: string;
    is_active: boolean;
    direction: string;
}

const AdminModal = ({ isOpen, title, children, onConfirm, onCancel, confirmText = 'Confirm', type = 'info' }: any) => {
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
                    <button className={`${styles['admin-btn']} ${styles['admin-btn-secondary']}`} onClick={onCancel}>Cancel</button>
                    <button
                        className={`${styles['admin-btn']} ${styles['admin-btn-primary']}`}
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

const AdminLanguages = () => {
    const { showToast } = useToast();
    const [data, setData] = useState<Language[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState<any>(emptyForm);
    const [editingId, setEditingId] = useState<string | null>(null);
    
    const [modalOpen, setModalOpen] = useState(false);
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchLanguages = async () => {
        try {
            setLoading(true);
            const { data: langs } = await api.get('/admin/languages');
            setData(langs);
        } catch (err) {
            console.error('Fetch error', err);
        } finally { setLoading(false); }
    };

    useEffect(() => { 
        fetchLanguages(); 
    }, []);

    // Search and Pagination Logic
    const filteredData = data.filter(item => {
        return item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
               item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
               (item.native_name && item.native_name.toLowerCase().includes(searchTerm.toLowerCase()));
    });
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentData = filteredData.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);

    const handleEdit = (item: Language) => {
        setForm(item);
        setEditingId(item._id);
        setShowForm(true);
    };

    const confirmDelete = (id: string) => {
        setPendingDeleteId(id);
        setModalOpen(true);
    };

    const handleDelete = async () => {
        try {
            await api.delete(`/admin/languages/${pendingDeleteId}`);
            showToast('Language removed', 'success');
            fetchLanguages();
        } catch (err) { showToast('Delete failed', 'error'); }
        finally { setModalOpen(false); setPendingDeleteId(null); }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.put(`/admin/languages/${editingId}`, form);
                showToast('Language updated', 'success');
            } else {
                await api.post('/admin/languages', form);
                showToast('Language added', 'success');
            }
            setShowForm(false);
            fetchLanguages();
        } catch (err) { showToast('Save failed', 'error'); }
    };

    return (
        <div className={"admin-page"}>
            <div className={"admin-page-header"} style={{ marginBottom: '32px' }}>
                <div>
                    <h1 className={"admin-page-title"} style={{ fontSize: '28px', fontWeight: 900 }}>Global Languages</h1>
                    <p className={"admin-page-subtitle"} style={{ fontSize: '14px', color: 'var(--admin-text-muted)', fontWeight: 600 }}>Configure available localized interfaces and typography settings</p>
                </div>
                {!showForm && <button onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(true); }} className={`${styles['admin-btn']} ${styles['admin-btn-primary']}`}>+ Add Language</button>}
            </div>

            <AdminModal isOpen={modalOpen} title="Delete Language" type="danger" onConfirm={handleDelete} onCancel={() => setModalOpen(false)} confirmText="Remove Now">
                <p>Are you sure you want to disable this language? This will immediately remove it from the storefront language switcher.</p>
            </AdminModal>

            {showForm ? (
                <div className={"admin-card"} style={{ borderRadius: '24px' }}>
                    <div style={{ padding: '32px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: 900, marginBottom: '24px' }}>{editingId ? 'Edit Language Profile' : 'Register New Interface Language'}</h2>
                        <form onSubmit={handleSave}>
                            <div className={styles['admin-form-grid']}>
                                <div className={styles['admin-form-group']}>
                                    <label className={styles['admin-form-label']}>Language Name</label>
                                    <input className={styles['admin-form-input']} value={form.name} onChange={e => setForm({...form, name: e.target.value})} required placeholder="e.g. English" />
                                </div>
                                <div className={styles['admin-form-group']}>
                                    <label className={styles['admin-form-label']}>Language Code (ISO)</label>
                                    <input className={styles['admin-form-input']} value={form.code} onChange={e => setForm({...form, code: e.target.value})} required placeholder="e.g. en" />
                                </div>
                                <div className={styles['admin-form-group']}>
                                    <label className={styles['admin-form-label']}>Native Name</label>
                                    <input className={styles['admin-form-input']} value={form.native_name} onChange={e => setForm({...form, native_name: e.target.value})} placeholder="e.g. English" />
                                </div>
                                <div className={styles['admin-form-group']}>
                                    <label className={styles['admin-form-label']}>Layout Direction</label>
                                    <select className={styles['admin-form-select']} value={form.direction} onChange={e => setForm({...form, direction: e.target.value})}>
                                        <option value="ltr">LTR (Left to Right)</option>
                                        <option value="rtl">RTL (Right to Left)</option>
                                    </select>
                                </div>
                                <div className={styles['admin-form-group']}>
                                    <label className={styles['admin-form-label']}>Status</label>
                                    <select className={styles['admin-form-select']} value={form.is_active} onChange={e => setForm({...form, is_active: e.target.value === 'true'})}>
                                        <option value="true">Active</option>
                                        <option value="false">Inactive</option>
                                    </select>
                                </div>
                            </div>
                             <div className={styles['admin-form-actions']}>
                                <button type="button" onClick={() => setShowForm(false)} className={`${styles['admin-btn']} ${styles['admin-btn-secondary']}`}>Cancel</button>
                                <button type="submit" className={`${styles['admin-btn']} ${styles['admin-btn-primary']}`}> {editingId ? 'Update' : 'Save Language'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : (
                <div className={"admin-card"}>
                    <div style={{ padding: '14px 18px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <div className={styles['admin-search-wrap']} style={{ flex: '1', minWidth: '220px' }}>
                            <svg className={styles['admin-search-icon']} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                            <input
                                type="text"
                                className={styles['admin-search-input-premium']}
                                placeholder="Search languages..."
                                value={searchTerm}
                                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            />
                        </div>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table className={"admin-table"}>
                            <thead>
                                <tr>
                                    <th>Language Name</th>
                                    <th>ISO Code</th>
                                    <th>Native Name</th>
                                    <th>Direction</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--admin-text-muted)' }}>Loading...</td></tr>
                                ) : data.length === 0 ? (
                                    <tr className={""}><td colSpan={6}>No languages found.</td></tr>
                                ) : currentData.map(item => (
                                    <tr key={item._id}>
                                        <td><strong>{item.name}</strong></td>
                                        <td>{item.code}</td>
                                        <td>{item.native_name}</td>
                                        <td>
                                            <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}>{item.direction || 'ltr'}</span>
                                        </td>
                                        <td>
                                            <span className={`admin-badge ${item.is_active ? 'admin-badge-success' : 'admin-badge-danger'}`}>
                                                {item.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button onClick={() => handleEdit(item)} className={"admin-action-btn-edit"}>Edit</button>
                                                <button onClick={() => confirmDelete(item._id)} className={"admin-action-btn-delete"}>Delete</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {totalPages > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderTop: '1px solid var(--admin-border)' }}>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--admin-text-muted)' }}>
                                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredData.length)} of {filteredData.length} languages
                            </span>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className={`${styles['admin-btn']} ${styles['admin-btn-secondary']}`} style={{ padding: '6px 12px' }}>Prev</button>
                                <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--admin-text-main)' }}>Page {currentPage} of {totalPages}</span>
                                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className={`${styles['admin-btn']} ${styles['admin-btn-secondary']}`} style={{ padding: '6px 12px' }}>Next</button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AdminLanguages;
