
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import api from '@/services/axiosConfig';
import styles from './AdminLayout.module.css';

interface Commission {
    _id?: string;
    id?: string;
    name: string;
    type: string;
    value: string | number;
    appliesTo: string;
    description: string;
}

interface Category {
    _id: string;
    title: string;
}

const emptyForm = { name: '', type: 'Percentage', value: '', appliesTo: 'All Products', description: '' };
type CommissionForm = typeof emptyForm;

const AdminCommissions = () => {
    const { t } = useAuth();
    const { showToast } = useToast();
    const [data, setData] = useState<Commission[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState<CommissionForm>(emptyForm);
    const [editingId, setEditingId] = useState<string | null>(null);
    
    const [loading, setLoading] = useState(true);

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    useEffect(() => { 
        const fetchSettings = async () => {
            try {
                const { data: set } = await api.get('/admin/site-settings');
                if (set?.pagination_limit) setItemsPerPage(set.pagination_limit);
            } catch (err: any) { }
        };
        fetchSettings();
        fetchCommissions(); 
        fetchCategories(); 
    }, []);

    const fetchCategories = async () => {
        try { const { data } = await api.get('/categories'); setCategories(data || []); } catch (err: any) { console.error(err); }
    };

    const fetchCommissions = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/commissions');
            setData(data || []);
        } catch (err: any) {
            console.error(err);
            showToast('Failed to fetch commissions', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (item: Commission) => {
        setEditingId(item._id || item.id || null);
        setForm({
            name: item.name,
            type: item.type,
            value: item.value.toString(),
            appliesTo: item.appliesTo,
            description: item.description
        });
        setShowForm(true);
    };

    const handleDelete = async (id?: string) => {
        if (!id || !window.confirm('Are you sure you want to delete this commission rule?')) return;
        try {
            await api.delete(`/commissions/${id}`);
            setData(data.filter(item => item._id !== id && item.id !== id));
            showToast('Commission rule deleted', 'success');
        } catch (err: any) {
            showToast('Failed to delete rule', 'error');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                const { data: updated } = await api.put(`/commissions/${editingId}`, form);
                setData(data.map(item => (item._id === editingId || item.id === editingId) ? updated : item));
                showToast('Commission rule updated', 'success');
            } else {
                const { data: created } = await api.post('/commissions', form);
                setData([...data, created]);
                showToast('Commission rule created', 'success');
            }
            setShowForm(false);
            setForm(emptyForm);
            setEditingId(null);
        } catch (err: any) {
            showToast('Failed to save commission rule', 'error');
        }
    };

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentData = data.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(data.length / itemsPerPage);

    if (loading) return <div className={"admin-loading-text"}>Loading commission rules...</div>;

    return (
        <div className={"admin-page"}>
            <div className={"admin-page-header"}>
                <div>
                    <h1 className={"admin-page-title"}>Commission Rates</h1>
                    <p className={"admin-page-subtitle"}>Manage marketplace commission structures and rules</p>
                </div>
                {!showForm && (
                    <button onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyForm); }} className={"admin-btn" + " " + "admin-btn-primary"}>
                        + New Rule
                    </button>
                )}
            </div>

            {showForm ? (
                <div className={"admin-card"} style={{ maxWidth: '800px' }}>
                    <div className={"admin-card-header"}>
                        <h2 className={"admin-card-title"}>{editingId ? 'Edit Management Rule' : 'Create New Rule'}</h2>
                    </div>
                    <div className={"admin-card-body"}>
                        <form onSubmit={handleSubmit}>
                            <div className={styles['admin-form-grid']}>
                                <div className={styles['admin-form-group']}>
                                    <label className={styles['admin-form-label']}>Rule Name</label>
                                    <input className={styles['admin-form-input']} required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Standard Commission" />
                                </div>
                                <div className={styles['admin-form-group']}>
                                    <label className={styles['admin-form-label']}>Applies To</label>
                                    <select className={styles['admin-form-select']} value={form.appliesTo} onChange={e => setForm({...form, appliesTo: e.target.value})}>
                                        <option value="All Products">All Products</option>
                                        <optgroup label="Categories">
                                            {categories.map(cat => <option key={cat._id} value={cat.title}>{cat.title}</option>)}
                                        </optgroup>
                                    </select>
                                </div>
                                <div className={styles['admin-form-group']}>
                                    <label className={styles['admin-form-label']}>Type</label>
                                    <select className={styles['admin-form-select']} value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                                        <option value="Percentage">Percentage (%)</option>
                                        <option value="Fixed">Fixed Amount ($)</option>
                                    </select>
                                </div>
                                <div className={styles['admin-form-group']}>
                                    <label className={styles['admin-form-label']}>Value</label>
                                    <input className={styles['admin-form-input']} required type="number" step="0.01" min="0" value={form.value} onChange={e => setForm({...form, value: e.target.value})} placeholder="e.g. 5" />
                                </div>
                                <div className={styles['admin-form-group'] + " " + styles['full-width']}>
                                    <label className={styles['admin-form-label']}>Rule Description</label>
                                    <textarea className={styles['admin-form-textarea']} value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Details about when this commission applies..." />
                                </div>
                            </div>
                            <div className={styles['admin-form-actions']}>
                                <button type="button" onClick={() => setShowForm(false)} className={"admin-btn" + " " + "admin-btn-secondary"}>Cancel</button>
                                <button type="submit" className={"admin-btn" + " " + "admin-btn-primary"}>{editingId ? 'Update Rule' : 'Save Rule'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className={"admin-card"}>
                    <div style={{ overflowX: 'auto' }}>
                        <table className={"admin-table"}>
                            <thead>
                                <tr>
                                    {['Name', 'Scope', 'Type', 'Value', 'Description', 'Actions'].map(h => <th key={h}>{h}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {currentData.map(item => (
                                    <tr key={item._id || item.id}>
                                        <td><strong style={{ color: 'var(--admin-text-main)' }}>{item.name}</strong></td>
                                        <td><span className={"admin-badge" + " " + "admin-badge-neutral"}>{item.appliesTo}</span></td>
                                        <td>{item.type}</td>
                                        <td style={{ fontWeight: 900, color: 'var(--admin-text-main)', fontSize: '14px' }}>
                                            {item.type === 'Fixed' ? '$' : ''}{item.value}{item.type === 'Percentage' ? '%' : ''}
                                        </td>
                                        <td style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>{item.description}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button onClick={() => handleEdit(item)} className={"admin-action-btn-edit"}>Edit</button>
                                                <button onClick={() => handleDelete(item._id || item.id)} className={"admin-action-btn-delete"}>Delete</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {data.length === 0 && (
                                    <tr className={""}><td colSpan={6}>No commission rules defined yet.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                {totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderTop: '1px solid var(--admin-border)', background: 'var(--admin-card-bg)', borderBottomLeftRadius: '14px', borderBottomRightRadius: '14px', borderRadius: '14px', border: '1px solid var(--admin-border)' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--admin-text-muted)' }}>
                            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, data.length)} of {data.length} rules
                        </span>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className={"admin-btn" + " " + "admin-btn-secondary"} style={{ padding: '6px 12px' }}>Prev</button>
                            <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--admin-text-main)' }}>Page {currentPage} of {totalPages}</span>
                            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className={"admin-btn" + " " + "admin-btn-secondary"} style={{ padding: '6px 12px' }}>Next</button>
                        </div>
                    </div>
                )}
            </div>
            )}
        </div>
    );
};

export default AdminCommissions;

