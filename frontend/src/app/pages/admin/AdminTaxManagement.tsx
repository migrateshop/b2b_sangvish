import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import api from '@/services/axiosConfig';
import styles from './AdminLayout.module.css';

interface Category {
    _id: string;
    title: string;
}

interface TaxRule {
    _id?: string;
    name: string;
    country_code: string;
    country_name: string;
    type: string;
    value: string;
    scope: string;
    category_ids: string[];
    product_ids: string[];
    description?: string;
    is_active: boolean;
}

const COUNTRIES = [
    { code: 'US', name: 'United States' }, { code: 'GB', name: 'United Kingdom' },
    { code: 'DE', name: 'Germany' }, { code: 'FR', name: 'France' },
    { code: 'IN', name: 'India' }, { code: 'CN', name: 'China' },
    { code: 'JP', name: 'Japan' }, { code: 'AU', name: 'Australia' },
    { code: 'CA', name: 'Canada' }, { code: 'BR', name: 'Brazil' },
    { code: 'SA', name: 'Saudi Arabia' }, { code: 'AE', name: 'UAE' },
    { code: 'SG', name: 'Singapore' }, { code: 'VN', name: 'Vietnam' },
    { code: 'PK', name: 'Pakistan' }, { code: 'BD', name: 'Bangladesh' },
    { code: 'IT', name: 'Italy' }, { code: 'ES', name: 'Spain' },
    { code: 'NL', name: 'Netherlands' }, { code: 'TR', name: 'Turkey' },
];

const emptyForm: TaxRule = { 
    name: '', 
    country_code: '', 
    country_name: '', 
    type: 'percentage', 
    value: '', 
    scope: 'global', 
    category_ids: [], 
    product_ids: [], 
    description: '', 
    is_active: true 
};

const AdminTaxManagement = () => {
    const { t } = useAuth();
    const { showToast } = useToast();
    const [rules, setRules] = useState<TaxRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState<TaxRule>(emptyForm);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [search, setSearch] = useState('');
    
    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const fetchRules = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/tax');
            setRules(data);
        } catch (err) {
            showToast('Failed to fetch tax rules', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const { data } = await api.get('/categories');
            setCategories(data);
        } catch (err) {
            console.error('Failed to fetch categories:', err);
        }
    };

    useEffect(() => {
        fetchRules();
        fetchCategories();
    }, []);

    const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const code = e.target.value;
        const country = COUNTRIES.find(c => c.code === code);
        setForm(f => ({ ...f, country_code: code, country_name: country?.name || '' }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setSaving(true);
        try {
            if (editingId) { await api.put(`/tax/${editingId}`, form); showToast('Tax updated!'); }
            else { await api.post('/tax', form); showToast('Tax created!'); }
            setShowForm(false); setEditingId(null); setForm(emptyForm); fetchRules();
        } catch (err) { showToast('Error', 'error'); }
        finally { setSaving(false); }
    };

    const handleEdit = (rule: TaxRule) => {
        setForm({ 
            name: rule.name, 
            country_code: rule.country_code, 
            country_name: rule.country_name, 
            type: rule.type, 
            value: rule.value, 
            scope: rule.scope, 
            category_ids: rule.category_ids?.map((c: any) => c._id || c) || [], 
            product_ids: rule.product_ids?.map((p: any) => p._id || p) || [], 
            description: rule.description || '', 
            is_active: rule.is_active 
        });
        setEditingId(rule._id || null);
        setShowForm(true);
        setTimeout(() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            document.querySelector('.admin-content-wrapper')?.scrollTo({ top: 0, behavior: 'smooth' });
        }, 50);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Delete this tax?')) return;
        try { await api.delete(`/tax/${id}`); showToast('Tax deleted.'); fetchRules(); }
        catch (err) { showToast('Delete failed.'); }
    };

    const handleToggle = async (rule: TaxRule) => {
        try { await api.put(`/tax/${rule._id}`, { ...rule, is_active: !rule.is_active }); fetchRules(); }
        catch (err) { showToast('Toggle failed.'); }
    };

    const filtered = rules.filter(r =>
        r.country_name?.toLowerCase().includes(search.toLowerCase()) ||
        r.name?.toLowerCase().includes(search.toLowerCase())
    );

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentRules = filtered.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filtered.length / itemsPerPage);

    const scopeLabel = (scope: string) => {
        const labels: Record<string, string> = { global: '🌍 Global', category: '📦 Category', product: '🏷 Product' };
        return labels[scope] || scope;
    };

    return (
        <div className={"admin-page"}>
            
            {!showForm ? (
                <>
                    <div className={"admin-page-header"}>
                        <div>
                            <h1 className={"admin-page-title"}>Tax Management</h1>
                            <p className={"admin-page-subtitle"}>Configure country-based tax rules (VAT, GST, customs)</p>
                        </div>
                        <button onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(true); window.scrollTo(0, 0); }} className={"admin-btn" + " " + "admin-btn-primary"}>+ Add Tax</button>
                    </div>

                    <div className={"admin-stats-grid"}>
                        {[
                            { label: 'Total Taxes', value: rules.length },
                            { label: 'Active', value: rules.filter(r => r.is_active).length },
                            { label: 'Countries Covered', value: new Set(rules.map(r => r.country_code)).size },
                        ].map((card, i) => (
                            <div key={i} className={"admin-stat-premium"}>
                                <div className={"admin-stat-card-label"}>{card.label}</div>
                                <div className={"admin-stat-card-value"}>{card.value}</div>
                            </div>
                        ))}
                    </div>

                    <div className={"admin-card"} style={{ marginTop: '32px' }}>

                        <div style={{ padding: '16px 20px' }}>
                            <div className={"admin-search-wrap"} style={{ flex: 1 }}>
                                <svg className={"admin-search-icon"} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Search by country or name..."
                                    value={search}
                                    onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                                />
                            </div>
                        </div>

                        {loading ? (
                            <div className={"admin-loading-text"}>Loading taxes...</div>
                        ) : filtered.length === 0 ? (
                            <div className={"admin-empty-state"}>
                                <div className={"admin-empty-state-icon"}>🧾</div>
                                <p>No tax rules found matching your search.</p>
                                <button onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(true); window.scrollTo(0, 0); }} className={"admin-btn" + " " + "admin-btn-primary"}>+ Add Tax</button>
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table className={"admin-table"}>
                                    <thead>
                                        <tr>
                                            {['Country', 'Name', 'Type', 'Value', 'Scope', 'Status', 'Actions'].map(h => <th key={h}>{h}</th>)}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentRules.map(rule => (
                                            <tr key={rule._id}>
                                                <td>
                                                    <div style={{ fontWeight: 800, color: 'var(--admin-text-main)', fontSize: '13px' }}>{rule.country_name}</div>
                                                    <div style={{ fontSize: '10px', color: 'var(--admin-text-muted)' }}>{rule.country_code}</div>
                                                </td>
                                                <td>{rule.name}</td>
                                                <td>
                                                    <span className={`admin-badge ${rule.type === 'percentage' ? 'admin-badge-info' : 'admin-badge-warning'}`}>
                                                        {rule.type === 'percentage' ? '% Percentage' : '$ Fixed'}
                                                    </span>
                                                </td>
                                                <td style={{ fontWeight: 800, color: 'var(--admin-text-main)' }}>
                                                    {rule.type === 'percentage' ? `${rule.value}%` : `$${rule.value}`}
                                                </td>
                                                <td style={{ fontSize: '12px' }}>{scopeLabel(rule.scope)}</td>
                                                <td>
                                                    <div
                                                        className={`admin-toggle${rule.is_active ? ' on' : ''}`}
                                                        onClick={() => handleToggle(rule)}
                                                    />
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        <button onClick={() => handleEdit(rule)} className={"admin-action-btn-edit"}>Edit</button>
                                                        <button onClick={() => rule._id && handleDelete(rule._id)} className={"admin-action-btn-delete"}>Delete</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        {totalPages > 1 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderTop: '1px solid var(--admin-border)', background: 'var(--admin-card-bg)', borderBottomLeftRadius: '14px', borderBottomRightRadius: '14px' }}>
                                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--admin-text-muted)' }}>
                                    Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filtered.length)} of {filtered.length} taxes
                                </span>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className={"admin-btn" + " " + "admin-btn-secondary"} style={{ padding: '6px 12px' }}>Prev</button>
                                    <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--admin-text-main)' }}>Page {currentPage} of {totalPages}</span>
                                    <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className={"admin-btn" + " " + "admin-btn-secondary"} style={{ padding: '6px 12px' }}>Next</button>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                /* ── FORM ── */
                <>
                    <div className={"admin-page-header"}>
                        <div>
                            <h1 className={"admin-page-title"}>{editingId ? 'Edit Tax Rule' : 'Create New Tax Rule'}</h1>
                            <p className={"admin-page-subtitle"}>Define when and how tax applies to buyer orders</p>
                        </div>
                        <button onClick={() => { setShowForm(false); setEditingId(null); }} className={styles['admin-back-btn']}>← Back</button>
                    </div>

                    <div className={"admin-card"}>
                        <div className={"admin-card-body"}>
                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                {/* Row 1 */}
                                <div className={styles['admin-form-grid']}>
                                    <div className={styles['admin-form-group']}>
                                        <label className={styles['admin-form-label']}>Rule Name</label>
                                        <input type="text" required className={styles['admin-form-input']} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. EU VAT, India GST" />
                                    </div>
                                    <div className={styles['admin-form-group']}>
                                        <label className={styles['admin-form-label']}>Country</label>
                                        <select required className={styles['admin-form-select']} value={form.country_code} onChange={handleCountryChange}>
                                            <option value="">Select a country</option>
                                            {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name} ({c.code})</option>)}
                                        </select>
                                    </div>
                                </div>

                                {/* Row 2: Tax Type Picker */}
                                <div className={styles['admin-form-grid']}>
                                    <div className={styles['admin-form-group']}>
                                        <label className={styles['admin-form-label']}>Tax Type</label>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                                            {['percentage', 'fixed'].map(t => (
                                                <label key={t} onClick={() => setForm(f => ({ ...f, type: t }))} style={{
                                                    display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px',
                                                    border: `2px solid ${form.type === t ? 'var(--primary-color)' : 'var(--admin-border)'}`,
                                                    borderRadius: '10px', cursor: 'pointer',
                                                    background: form.type === t ? '#f0f4ff' : 'var(--admin-card-bg)',
                                                    fontWeight: 700, fontSize: '13px', color: form.type === t ? 'var(--primary-color)' : 'var(--admin-text-muted)'
                                                }}>
                                                    <span style={{ fontSize: '18px' }}>{t === 'percentage' ? '%' : '$'}</span>
                                                    {t === 'percentage' ? 'Percentage' : 'Fixed Amount'}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                    <div className={styles['admin-form-group']}>
                                        <label className={styles['admin-form-label']}>{form.type === 'percentage' ? 'Rate (%)' : 'Fixed Amount ($)'}</label>
                                        <div style={{ position: 'relative' }}>
                                            <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: 'var(--primary-color)' }}>{form.type === 'percentage' ? '%' : '$'}</span>
                                            <input type="number" required min="0" step="0.01" className={styles['admin-form-input']} style={{ paddingLeft: '36px' }} value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} placeholder={form.type === 'percentage' ? '20' : '15.00'} />
                                        </div>
                                        {form.type === 'percentage' && <p style={{ fontSize: '11px', color: 'var(--admin-text-muted)', marginTop: '4px' }}>e.g. 20 = 20% VAT on the order total</p>}
                                    </div>
                                </div>

                                {/* Row 3: Scope */}
                                <div className={styles['admin-form-group']}>
                                    <label className={styles['admin-form-label']}>Applies To (Scope)</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
                                        {[
                                            { val: 'global', icon: '🌍', title: 'All Orders', desc: 'Applied to all orders from this country' },
                                            { val: 'category', icon: '📦', title: 'Specific Category', desc: 'Only for products in selected categories' },
                                            { val: 'product', icon: '🏷', title: 'Specific Product', desc: 'Only for selected individual products' },
                                        ].map(s => (
                                            <label key={s.val} onClick={() => setForm(f => ({ ...f, scope: s.val }))} style={{
                                                display: 'flex', flexDirection: 'column', gap: '4px', padding: '14px 16px',
                                                border: `2px solid ${form.scope === s.val ? 'var(--primary-color)' : 'var(--admin-border)'}`,
                                                borderRadius: '12px', cursor: 'pointer',
                                                background: form.scope === s.val ? '#f0f4ff' : 'var(--admin-card-bg)',
                                            }}>
                                                <span style={{ fontSize: '1.5rem' }}>{s.icon}</span>
                                                <span style={{ fontWeight: 800, fontSize: '13px', color: form.scope === s.val ? 'var(--primary-color)' : 'var(--admin-text-main)' }}>{s.title}</span>
                                                <span style={{ fontSize: '11px', color: 'var(--admin-text-muted)' }}>{s.desc}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Category selector */}
                                {form.scope === 'category' && (
                                    <div className={styles['admin-form-group']}>
                                        <label className={styles['admin-form-label']}>Select Categories</label>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '14px', border: '1px solid var(--admin-border)', borderRadius: '10px', maxHeight: '160px', overflowY: 'auto' }}>
                                            {categories.map(cat => {
                                                const selected = form.category_ids.includes(cat._id);
                                                return (
                                                    <span key={cat._id}
                                                        onClick={() => setForm(f => ({
                                                            ...f,
                                                            category_ids: selected ? f.category_ids.filter(id => id !== cat._id) : [...f.category_ids, cat._id]
                                                        }))}
                                                        style={{ padding: '5px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', border: `1px solid ${selected ? 'var(--primary-color)' : 'var(--admin-border)'}`, background: selected ? 'var(--primary-color)' : 'var(--admin-bg)', color: selected ? '#fff' : 'var(--admin-text-secondary)' }}
                                                    >
                                                        {cat.title}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                <div className={styles['admin-form-group']}>
                                    <label className={styles['admin-form-label']}>Notes / Description (Optional)</label>
                                    <input type="text" className={styles['admin-form-input']} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="e.g. Standard EU VAT applied to all digital goods" />
                                </div>

                                {/* Active Toggle */}
                                <div className={styles['admin-section-box']} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                    <div
                                        className={`admin-toggle${form.is_active ? ' on' : ''}`}
                                        onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
                                    />
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--admin-text-main)' }}>Active</div>
                                        <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>When active, this tax will be applied at checkout for matching orders</div>
                                    </div>
                                </div>

                                <div className={styles['admin-form-actions']}>
                                    <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className={"admin-btn" + " " + "admin-btn-secondary"}>Cancel</button>
                                    <button type="submit" disabled={saving} className={"admin-btn" + " " + "admin-btn-primary"}>
                                        {saving ? 'Saving...' : editingId ? 'Update Tax' : 'Create Tax'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default AdminTaxManagement;
